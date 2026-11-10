import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "Onishakara";
const DEFAULT_DESCRIPTION =
  "Discover contemporary Nigerian fashion, ready-to-wear, statement pieces and new arrivals at Onishakara.";

export const slugify = (value = "") =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const getSeoProductId = (product) =>
  product?.id ?? product?._id ?? product?.productId ?? "";

export const getSeoProductSlug = (product) =>
  slugify(product?.slug || product?.name || product?.productName || "product");

export const getProductUrl = (product) => {
  const slug = getSeoProductSlug(product);
  const id = getSeoProductId(product);
  return id !== "" ? `/products/${slug}--${encodeURIComponent(String(id))}` : `/products/${slug}`;
};

const upsertMeta = (attribute, key, content) => {
  if (content == null || content === "") return;
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute("content", String(content));
};

const upsertLink = (rel, href) => {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
};

export function applySeo({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  canonicalPath,
  noindex = false,
  schema,
}) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const path = canonicalPath || window.location.pathname;
  const normalizedPath = path.length > 1 ? path.replace(/\/+$/, "") : "/";
  const canonical = `${window.location.origin}${normalizedPath}`;
  const pageTitle = (title || `${SITE_NAME} | Contemporary Nigerian Fashion`).slice(0, 70);
  const pageDescription = String(description || DEFAULT_DESCRIPTION).replace(/\s+/g, " ").trim().slice(0, 160);

  document.documentElement.lang = "en-NG";
  document.title = pageTitle;
  upsertMeta("name", "description", pageDescription);
  upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
  upsertMeta("name", "googlebot", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
  upsertMeta("name", "bingbot", noindex ? "noindex, nofollow" : "index, follow");
  upsertMeta("name", "author", SITE_NAME);
  upsertMeta("property", "og:type", schema?.["@type"] === "Product" ? "product" : "website");
  upsertMeta("property", "og:site_name", SITE_NAME);
  upsertMeta("property", "og:locale", "en_NG");
  upsertMeta("property", "og:title", pageTitle);
  upsertMeta("property", "og:description", pageDescription);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
  upsertMeta("name", "twitter:title", pageTitle);
  upsertMeta("name", "twitter:description", pageDescription);

  if (image) {
    let absoluteImage = image;
    try { absoluteImage = new URL(image, window.location.origin).href; } catch { /* Keep source value */ }
    upsertMeta("property", "og:image", absoluteImage);
    upsertMeta("name", "twitter:image", absoluteImage);
  }

  upsertLink("canonical", canonical);

  let script = document.getElementById("onishakara-jsonld");
  if (!script) {
    script = document.createElement("script");
    script.id = "onishakara-jsonld";
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  const organization = {
    "@type": "Organization",
    name: SITE_NAME,
    url: `${window.location.origin}/`,
  };
  const graph = schema
    ? [organization, schema]
    : [
        organization,
        {
          "@type": "WebSite",
          name: SITE_NAME,
          url: `${window.location.origin}/`,
          inLanguage: "en-NG",
        },
      ];
  script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

export function Seo({
  title,
  description,
  image,
  noindex = false,
  schema,
}) {
  const location = useLocation();
  useEffect(() => {
    applySeo({
      title,
      description,
      image,
      noindex,
      schema,
      canonicalPath: location.pathname,
    });
  }, [title, description, image, noindex, schema, location.pathname]);
  return null;
}

export const productSchema = (product, canonicalPath) => {
  if (!product) return undefined;
  const name = product.name || product.productName || "Onishakara product";
  const price = Number(product.sellingPrice ?? product.selling_price ?? product.price ?? 0);
  let image = product.imageUrl || product.image_url || product.image || product.thumbnail;
  if (!image) {
    let productImages = product.images;
    if (typeof productImages === "string") {
      try { productImages = JSON.parse(productImages); }
      catch { productImages = [productImages]; }
    }
    if (Array.isArray(productImages)) {
      const first = productImages.find(Boolean);
      image = typeof first === "string" ? first : first?.url || first?.src || first?.imageUrl || first?.image_url;
    }
  }
  const schema = {
    "@type": "Product",
    name,
    description: product.description || product.shortDescription || `Discover ${name} at Onishakara.`,
    sku: String(product.sku || getSeoProductId(product) || ""),
    brand: { "@type": "Brand", name: SITE_NAME },
  };
  if (Number.isFinite(price) && price > 0) {
    schema.offers = {
      "@type": "Offer",
      url: `${window.location.origin}${canonicalPath}`,
      priceCurrency: product.currency || "NGN",
      price: price.toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
    };
    const stockValue = product.quantity ?? product.stock;
    if (stockValue != null) {
      schema.offers.availability = Number(stockValue) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";
    }
  }
  if (image) {
    try { schema.image = [new URL(image, window.location.origin).href]; }
    catch { schema.image = [image]; }
  }
  return schema;
};
