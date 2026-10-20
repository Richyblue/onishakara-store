
const STORE_WHATSAPP = "2348152470890";

// API origin used to resolve uploaded product images.
// Update this if your backend uses a different domain.
const API_ORIGIN = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v\d+\/?$/i, "") ||
  "https://api-onishakara.princesssalon.xyz"
).replace(/\/+$/, "");

function resolveImageUrl(image) {
  if (!image) return "";

  // Handle image objects returned by the API.
  if (typeof image === "object") {
    image =
      image.url ||
      image.src ||
      image.imageUrl ||
      image.image_url ||
      image.path ||
      "";
  }

  if (typeof image !== "string") return "";

  const value = image.trim();
  if (!value) return "";

  // Already a complete URL.
  if (/^https?:\/\//i.test(value)) return value;

  // Protocol-relative URL.
  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  // Uploaded product images are served by the backend.
  if (
    value.startsWith("/uploads/") ||
    value.startsWith("uploads/")
  ) {
    return `${API_ORIGIN}/${value.replace(/^\/+/, "")}`;
  }

  return value;
}

function getProductImage(item) {
  const product = item.product || item;
  const variant = item.variant;

  let images = product.images;

  // Some APIs return JSON arrays as strings.
  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }

  const firstImage = Array.isArray(images)
    ? images[0]
    : images;

  const image =
    variant?.image ||
    variant?.imageUrl ||
    variant?.image_url ||
    item.image ||
    item.imageUrl ||
    item.image_url ||
    product.image ||
    product.imageUrl ||
    product.image_url ||
    product.thumbnail ||
    firstImage;

  return resolveImageUrl(image);
}

export function openWhatsAppOrder({
  items = [],
  customerName = "",
  phone = "",
  deliveryAddress = "",
} = {}) {
  if (!STORE_WHATSAPP || STORE_WHATSAPP.includes("X")) {
    throw new Error("Configure the store WhatsApp number first.");
  }

  if (!items.length) {
    throw new Error("Your shopping bag is empty.");
  }

  const lines = items.map((item, index) => {
    const product = item.product || item;
    const quantity = Number(item.quantity ?? item.qty) || 1;
    const variant = item.variant;

    const imageUrl = getProductImage(item);

    return [
      `${index + 1}. ${product.name || "Product"}`,
      variant?.size ? `Size: ${variant.size}` : "",
      variant?.color ? `Colour: ${variant.color}` : "",
      `Qty: ${quantity}`,
      imageUrl ? `Product image: ${imageUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });

  const message = [
    "Hello Onishakara!",
    "",
    "I would like to place an order:",
    "",
    ...lines.flatMap((line) => [line, ""]),
    customerName ? `Customer: ${customerName}` : "",
    phone ? `Phone: ${phone}` : "",
    deliveryAddress ? `Delivery address: ${deliveryAddress}` : "",
    "",
    "Please confirm availability, final prices and delivery details.",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const url =
    `https://wa.me/${STORE_WHATSAPP}?text=` +
    encodeURIComponent(message);

  window.open(url, "_blank", "noopener,noreferrer");
}
