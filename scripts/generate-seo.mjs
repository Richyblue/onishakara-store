import fs from "node:fs";
import path from "node:path";

// Load local .env values for developers; hosting environment variables take precedence.
const localEnvPath = path.resolve(".env");
if (fs.existsSync(localEnvPath)) {
  for (const line of fs.readFileSync(localEnvPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] != null) continue;
    const value = match[2].replace(/^["']|["']$/g, "");
    process.env[match[1]] = value;
  }
}

const siteUrlInput = process.env.SITE_URL;
if (!siteUrlInput) {
  throw new Error("SITE_URL is required. Set it to the exact canonical HTTPS domain before building.");
}
const site = new URL(siteUrlInput);
if (site.protocol !== "https:" || site.pathname !== "/" || site.search || site.hash) {
  throw new Error("SITE_URL must be the canonical HTTPS origin only, e.g. https://www.example.com");
}
const siteUrl = site.origin.replace(/\/+$/, "");

const productsEndpoint = process.env.SEO_PRODUCTS_API_URL;
if (!productsEndpoint) {
  throw new Error("SEO_PRODUCTS_API_URL is required so every active store product can be included in sitemap.xml.");
}
const endpoint = new URL(productsEndpoint);
if (!["http:", "https:"].includes(endpoint.protocol)) {
  throw new Error("SEO_PRODUCTS_API_URL must be an absolute HTTP(S) URL.");
}

const response = await fetch(endpoint, {
  headers: { Accept: "application/json" },
  signal: AbortSignal.timeout(30000),
});
if (!response.ok) {
  throw new Error(`Product catalogue request failed: HTTP ${response.status} from SEO_PRODUCTS_API_URL`);
}
const payload = await response.json();
const products = Array.isArray(payload)
  ? payload
  : Array.isArray(payload?.products)
    ? payload.products
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.products)
        ? payload.data.products
        : null;

if (!products) {
  throw new Error("SEO_PRODUCTS_API_URL must return an array, {products: []}, {data: []}, or {data: {products: []}}.");
}

const isPublicProduct = (product) =>
  product &&
  product.status !== "inactive" &&
  product.status !== "deleted" &&
  (product.status == null || ["active", "available", "published"].includes(String(product.status).toLowerCase())) &&
  product.isActive !== false &&
  product.isPublished !== false &&
  product.published !== false;

const slugify = (value = "") =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const publishedProducts = products.filter(isPublicProduct).map((product) => {
  const id = product.id ?? product._id ?? product.productId;
  const name = product.name ?? product.productName ?? product.title;
  if (id == null || !name) {
    throw new Error("Every published product returned by the store API must include an id and name.");
  }
  const slug = slugify(product.slug || name);
  if (!slug) throw new Error(`Product ${id} has no usable SEO slug.`);
  return {
    id: String(id),
    slug,
    lastmod: product.updatedAt ?? product.updated_at ?? product.createdAt ?? product.created_at ?? null,
  };
});

const productSlugs = publishedProducts.map((product) => product.slug);
const duplicateSlugs = productSlugs.filter((slug, index) => productSlugs.indexOf(slug) !== index);
if (duplicateSlugs.length) {
  throw new Error(`Duplicate product slugs found (${[...new Set(duplicateSlugs)].join(", ")}). Set unique product slugs in the catalogue.`);
}

const fixedPaths = ["/", "/shop", "/new-arrivals"];
const entries = [
  ...fixedPaths.map((url) => ({ url })),
  ...publishedProducts.map((product) => ({
    url: `/products/${product.slug}--${encodeURIComponent(product.id)}`,
    lastmod: product.lastmod,
  })),
];

const seen = new Set();
for (const entry of entries) {
  if (seen.has(entry.url)) throw new Error(`Duplicate sitemap URL: ${entry.url}`);
  seen.add(entry.url);
}

const xmlEscape = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

const urlsXml = entries.map(({ url, lastmod }) => {
  const date = lastmod ? new Date(lastmod) : null;
  const lastmodXml = date && !Number.isNaN(date.getTime())
    ? `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>`
    : "";
  return `  <url><loc>${xmlEscape(siteUrl + url)}</loc>${lastmodXml}</url>`;
}).join("\n");

const publicDir = path.resolve("public");
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(
  path.join(publicDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`
);
fs.writeFileSync(
  path.join(publicDir, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`
);

console.log(`SEO sitemap generated: ${entries.length} URLs (${publishedProducts.length} active products).`);
