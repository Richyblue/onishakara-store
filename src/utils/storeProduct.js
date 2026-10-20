
const API_BASE_URL = (
    import.meta.env.VITE_BACKEND_URL ||
    "https://api-onishakara.princesssalon.xyz"
  ).replace(/\/+$/, "");
  
  export function getProductKey(product) {
    return String(
      product?.id ?? product?._id ?? product?.sku ?? product?.name ?? ""
    );
  }
  
  export function getProductName(product) {
    return product?.name ?? product?.productName ?? "Fashion item";
  }
  
  export function getProductPrice(product) {
    return Number(
      product?.sellingPrice ??
      product?.selling_price ??
      product?.price ??
      0
    );
  }
  
  export function formatStorePrice(price) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(price) || 0);
  }
  
  export function getProductImage(product) {
    let images = product?.images;
  
    if (typeof images === "string") {
      try {
        images = JSON.parse(images);
      } catch {
        images = [images];
      }
    }
  
    let image = "";
  
    if (Array.isArray(images)) {
      const first = images.find((entry) =>
        typeof entry === "string"
          ? entry.trim()
          : Boolean(
              entry?.url ??
              entry?.src ??
              entry?.imageUrl ??
              entry?.image_url ??
              entry?.path
            )
      );
  
      image =
        typeof first === "string"
          ? first
          : first?.url ??
            first?.src ??
            first?.imageUrl ??
            first?.image_url ??
            first?.path ??
            "";
    }
  
    image ||= product?.imageUrl ??
      product?.image_url ??
      product?.image ??
      product?.thumbnail ??
      "";
  
    if (!image) return "/images/product-placeholder.png";
  
    if (/^https?:\/\//i.test(image)) return image;
  
    if (image.startsWith("//")) {
      return `${window.location.protocol}${image}`;
    }
  
    if (image.startsWith("/")) {
      if (image.startsWith("/uploads/")) {
        return `${API_BASE_URL}${image}`;
      }
  
      return image;
    }
  
    return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
  }
  