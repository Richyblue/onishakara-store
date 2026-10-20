
import { useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import {
  formatStorePrice,
  getProductImage,
  getProductKey,
  getProductName,
  getProductPrice,
} from "../../utils/storeProduct";
import "./WishlistDrawer.css";

export default function WishlistDrawer() {
  const { addToCart } = useCart();
  const {
    wishlist,
    wishlistCount,
    isWishlistOpen,
    closeWishlist,
    removeFromWishlist,
  } = useWishlist();

  useEffect(() => {
    if (!isWishlistOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeWishlist();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isWishlistOpen, closeWishlist]);

  const handleAddToBag = (product) => {
    addToCart(product);
    removeFromWishlist(product);
    closeWishlist();
  };

  return (
    <>
      <button
        type="button"
        className={`wishlist-drawer__overlay ${
          isWishlistOpen ? "is-visible" : ""
        }`}
        aria-label="Close wishlist"
        tabIndex={isWishlistOpen ? 0 : -1}
        onClick={closeWishlist}
      />

      <aside
        className={`wishlist-drawer ${
          isWishlistOpen ? "is-open" : ""
        }`}
        role="dialog"
        aria-modal={isWishlistOpen ? "true" : undefined}
        aria-label="Your wishlist"
        aria-hidden={!isWishlistOpen}
        inert={!isWishlistOpen}
      >
        <header className="wishlist-drawer__header">
          <div>
            <p className="wishlist-drawer__eyebrow">ONISHAKARA</p>
            <h2>Your Wishlist</h2>
            <p className="wishlist-drawer__count">
              {wishlistCount} {wishlistCount === 1 ? "favourite" : "favourites"}
            </p>
          </div>

          <button
            type="button"
            className="wishlist-drawer__close"
            aria-label="Close wishlist"
            onClick={closeWishlist}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {wishlist.length === 0 ? (
          <div className="wishlist-drawer__empty">
            <span className="material-symbols-outlined">favorite_border</span>
            <h3>No favourites yet</h3>
            <p>Save the pieces you love and find them here whenever you return.</p>
            <button type="button" onClick={closeWishlist}>
              EXPLORE COLLECTION
            </button>
          </div>
        ) : (
          <>
            <div className="wishlist-drawer__items">
              {wishlist.map((product) => {
                const name = getProductName(product);
                const image = getProductImage(product);

                return (
                  <article
                    className="wishlist-item"
                    key={getProductKey(product)}
                  >
                    <div className="wishlist-item__image-wrap">
                      <img
                        src={image}
                        alt={name}
                        className="wishlist-item__image"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "/images/product-placeholder.png";
                        }}
                      />
                    </div>

                    <div className="wishlist-item__details">
                      <h3>{name}</h3>
                      <p className="wishlist-item__price">
                        {formatStorePrice(getProductPrice(product))}
                      </p>

                      <button
                        type="button"
                        className="wishlist-item__add"
                        onClick={() => handleAddToBag(product)}
                      >
                        ADD TO BAG
                      </button>

                      <button
                        type="button"
                        className="wishlist-item__remove"
                        onClick={() => removeFromWishlist(product)}
                      >
                        Remove from wishlist
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <footer className="wishlist-drawer__footer">
              <button type="button" onClick={closeWishlist}>
                CONTINUE SHOPPING
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
