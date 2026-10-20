import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "./CartDrawer.css";

// ============================================================
// BACKEND IMAGE URL CONFIGURATION
// ============================================================

const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  "https://api-onishakara.princesssalon.xyz"
).replace(/\/+$/, "");

const resolveImageUrl = (image) => {
  if (typeof image !== "string" || !image.trim()) {
    return "";
  }

  const value = image.trim();

  // Keep complete URLs unchanged.
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Support protocol-relative URLs.
  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  // Uploaded product images are served by the backend.
  if (
    value.startsWith("/uploads/") ||
    value.startsWith("uploads/")
  ) {
    return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
  }

  // Keep frontend public assets on the frontend.
  if (value.startsWith("/")) {
    return value;
  }

  // Resolve other relative backend paths.
  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
};

// Support both the multiple-image gallery and legacy image fields.
const getCartItemImage = (item) => {
  let images = item?.images;

  // JSON columns may arrive as arrays or serialized JSON strings.
  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }

  // Prefer the first usable image from the product gallery.
  if (Array.isArray(images)) {
    for (const image of images) {
      const rawSrc =
        typeof image === "string"
          ? image
          : image?.url ??
            image?.src ??
            image?.imageUrl ??
            image?.image_url ??
            image?.path;

      const resolved = resolveImageUrl(rawSrc);

      if (resolved) {
        return resolved;
      }
    }
  }

  // Fall back to older single-image property names.
  const fallbackImage =
    item?.imageUrl ??
    item?.image_url ??
    item?.image ??
    item?.thumbnail;

  return (
    resolveImageUrl(fallbackImage) ||
    "/images/product-placeholder.png"
  );
};

// ============================================================
// PRICE FORMATTER
// ============================================================

function formatPrice(price) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

// ============================================================
// CART DRAWER
// ============================================================

export default function CartDrawer({ onCheckout }) {
  const navigate = useNavigate();

  const {
    cartItems,
    cartCount,
    cartSubtotal,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateCartQuantity,
  } = useCart();

  const handleCheckout = () => {
    if (!cartItems.length) return;

    closeCart();

    if (onCheckout) {
      onCheckout(cartItems);
      return;
    }

    navigate("/checkout");
  };

  // Lock background scrolling and support Escape to close.
  useEffect(() => {
    if (!isCartOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeCart();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, closeCart]);

  return (
    <>
      <div
        className={`cart-drawer__overlay ${
          isCartOpen ? "is-visible" : ""
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        className={`cart-drawer ${
          isCartOpen ? "is-open" : ""
        }`}
        role="dialog"
        aria-modal={isCartOpen ? "true" : undefined}
        aria-label="Your shopping bag"
        aria-hidden={!isCartOpen}
        inert={!isCartOpen}
      >
        {/* Header */}
        <div className="cart-drawer__header">
          <div>
            <p className="cart-drawer__eyebrow">
              ONISHAKARA
            </p>

            <h2>Your Shopping Bag</h2>

            <p className="cart-drawer__count">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </p>
          </div>

          <button
            type="button"
            className="cart-drawer__close"
            onClick={closeCart}
            aria-label="Close shopping bag"
          >
            <span className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        {/* Empty cart */}
        {cartItems.length === 0 ? (
          <div className="cart-drawer__empty">
            <span className="material-symbols-outlined">
              shopping_bag
            </span>

            <h3>Your bag is waiting</h3>

            <p>
              Discover pieces you'll love and add them to your bag.
            </p>

            <button
              type="button"
              className="cart-drawer__continue"
              onClick={closeCart}
            >
              CONTINUE SHOPPING
            </button>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="cart-drawer__items">
              {cartItems.map((item) => {
                const key = String(
                  item.id ??
                    item._id ??
                    item.sku ??
                    item.name
                );

                const price = Number(
                  item.price ??
                    item.sellingPrice ??
                    item.selling_price ??
                    0
                );

                const quantity =
                  Number(item.cartQuantity) || 1;

                const productName =
                  item.name ??
                  item.productName ??
                  "Fashion item";

                const image = getCartItemImage(item);

                const stockValue =
                  item.stock ?? item.quantity;

                const hasStockLimit =
                  stockValue !== undefined &&
                  stockValue !== null &&
                  Number.isFinite(Number(stockValue));

                const stockLimit = hasStockLimit
                  ? Math.max(0, Number(stockValue))
                  : Infinity;

                return (
                  <article
                    className="cart-item"
                    key={key}
                  >
                    {/* Product image */}
                    <div className="cart-item__image-wrap">
                      <img
                        className="cart-item__image"
                        src={image}
                        alt={productName}
                        loading="lazy"
                        onError={(event) => {
                          const img = event.currentTarget;

                          if (
                            img.dataset.fallbackApplied === "true"
                          ) {
                            return;
                          }

                          img.dataset.fallbackApplied = "true";
                          img.src = "/images/product-placeholder.png";
                        }}
                      />
                    </div>

                    {/* Product details */}
                    <div className="cart-item__details">
                      <h3>{productName}</h3>

                      {(item.category ||
                        item.categoryName ||
                        item.Category?.name) && (
                        <p className="cart-item__category">
                          {item.category?.name ??
                            item.category ??
                            item.categoryName ??
                            item.Category?.name}
                        </p>
                      )}

                      <p className="cart-item__price">
                        {formatPrice(price)}
                      </p>

                      <div className="cart-item__bottom">
                        {/* Quantity controls */}
                        <div
                          className="cart-item__quantity"
                          aria-label={`Quantity: ${quantity}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              quantity === 1
                                ? removeFromCart(item)
                                : updateCartQuantity(
                                    item,
                                    quantity - 1
                                  )
                            }
                            aria-label={`Decrease quantity of ${productName}`}
                          >
                            −
                          </button>

                          <span>{quantity}</span>

                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item,
                                quantity + 1
                              )
                            }
                            aria-label={`Increase quantity of ${productName}`}
                            disabled={quantity >= stockLimit}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-item__remove"
                          onClick={() => removeFromCart(item)}
                          aria-label={`Remove ${productName} from bag`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <p className="cart-item__line-total">
                      {formatPrice(price * quantity)}
                    </p>
                  </article>
                );
              })}
            </div>

            {/* Footer */}
            <div className="cart-drawer__footer">
              <div className="cart-drawer__subtotal">
                <span>Subtotal</span>
                <strong>
                  {formatPrice(cartSubtotal)}
                </strong>
              </div>

              <p className="cart-drawer__note">
                Shipping and any applicable fees are calculated at
                checkout.
              </p>

              <button
                type="button"
                className="cart-drawer__checkout"
                onClick={handleCheckout}
              >
                PROCEED TO CHECKOUT

                <span className="material-symbols-outlined">
                  arrow_forward
                </span>
              </button>

              <button
                type="button"
                className="cart-drawer__continue-link"
                onClick={closeCart}
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}