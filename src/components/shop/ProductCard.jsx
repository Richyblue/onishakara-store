import "./ProductCard.css";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { Link } from "react-router-dom";

// Your Onishakara backend URL
const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL || "https://api-onishakara.princesssalon.xyz"
).replace(/\/+$/, "");

const PLACEHOLDER_IMAGE = "/images/product-placeholder.png";

function formatPrice(price) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

// Resolve an image path to a usable URL.
function resolveImageUrl(image) {
  if (typeof image !== "string" || !image.trim()) {
    return "";
  }

  const value = image.trim();

  // Full external or backend URL.
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Protocol-relative URL.
  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  // Local backend uploads, e.g. uploads/products/example.webp.
  // Also handles /uploads/products/example.webp.
  if (value.startsWith("/uploads/") || value.startsWith("uploads/")) {
    return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
  }

  // Other absolute paths remain relative to the frontend.
  if (value.startsWith("/")) {
    return value;
  }

  // Handle an API returning a path without its leading slash.
  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

// Get the first available product image.
// Supports the images array and existing single-image fields.
function getProductImage(product) {
  if (!product) {
    return PLACEHOLDER_IMAGE;
  }

  let images = product.images;

  // Handle JSON-string images if the API returns a string.
  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }

  // Prefer the first valid image from the multiple-images array.
  if (Array.isArray(images)) {
    const firstImage = images.find(
      (image) => typeof image === "string" && image.trim() !== ""
    );

    if (firstImage) {
      return resolveImageUrl(firstImage) || PLACEHOLDER_IMAGE;
    }
  }

  // Fall back to existing single-image fields.
  const fallbackImage = product.image || product.imageUrl || product.image_url;

  return resolveImageUrl(fallbackImage) || PLACEHOLDER_IMAGE;
}

function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted: isWishlistedProp,
}) {
  const { addToCart } = useCart();

  const { toggleWishlist, isWishlisted: checkWishlist } = useWishlist();

  if (!product) return null;

  const isWishlisted =
    typeof isWishlistedProp === "boolean"
      ? isWishlistedProp
      : checkWishlist(product);
  const stockValue = product.stock ?? product.quantity;
  const hasStockValue = stockValue != null;

  const isOutOfStock =
    product.stockStatus === "out-of-stock" ||
    (hasStockValue && Number(stockValue) <= 0);

  const handleAddToBag = () => {
    if (isOutOfStock) return;

    // Preserve the existing shared cart behavior.
    addToCart(product);
  };

  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <Link
          className="product-card__image-link"
          to={product.href || `/product/${product.id || product._id}`}
          aria-label={`View ${
            product.name || product.productName || "product"
          }`}
        >
          <img
            className="product-card__image"
            src={getProductImage(product)}
            alt={
              product.imageAlt ||
              product.name ||
              product.productName ||
              "Fashion product"
            }
            loading="lazy"
            onError={(event) => {
              // Prevent an infinite loop if the placeholder is missing.
              if (event.currentTarget.dataset.fallbackApplied) {
                event.currentTarget.onerror = null;
                return;
              }

              event.currentTarget.dataset.fallbackApplied = "true";
              event.currentTarget.src = PLACEHOLDER_IMAGE;
            }}
          />
        </Link>

        {product.badge && (
          <span className="product-card__badge">{product.badge}</span>
        )}

        <button
          type="button"
          className={`product-card__wishlist ${
            isWishlisted ? "is-active" : ""
          }`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            if (onToggleWishlist) {
              onToggleWishlist(product);
            } else {
              toggleWishlist(product);
            }
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <span aria-hidden="true">{isWishlisted ? "♥" : "♡"}</span>
        </button>
      </div>

      <div className="product-card__details">
        {product.category && (
          <p className="product-card__category">{product.category}</p>
        )}

        <h3 className="product-card__name">{product.name}</h3>

        <p className="product-card__price">
          {formatPrice(
            product.price ?? product.sellingPrice ?? product.selling_price
          )}
        </p>

        <button
          type="button"
          className={`product-card__add ${
            isOutOfStock ? "is-out-of-stock" : ""
          }`}
          disabled={isOutOfStock}
          onClick={handleAddToBag}
          aria-label={
            isOutOfStock
              ? `${product.name} is out of stock`
              : `Add ${product.name} to bag`
          }
        >
          {isOutOfStock ? (
            <>
              <span className="product-card__add-label">Out of Stock</span>
              <span className="product-card__add-icon" aria-hidden="true">
                —
              </span>
            </>
          ) : (
            <>
              <span className="product-card__add-label">Add to Bag</span>

              <span className="product-card__add-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="19"
                  height="19"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 8h14l1 12H4L5 8Z" />
                  <path d="M9 9V6a3 3 0 0 1 6 0v3" />
                  <path d="M12 12v4M10 14h4" />
                </svg>
              </span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
