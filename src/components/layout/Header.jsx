import { useState } from "react";
import MobileMenu from "./MobileMenu";
import AnnouncementBar from "./AnnouncementBar";
import Navigation from "./Navigation";
import CartDrawer from "./CartDrawer";
import WishlistDrawer from "./WishlistDrawer";
import ProductSearch from "./ProductSearch";

import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

import "./Header.css";

export default function Header({
  activePath = "home",
  wishlistCount,
  onSearch,
  onWishlist,
  onAccount,
  onCheckout,
  onSelectProduct,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { cartCount, openCart } = useCart();

  const { wishlistCount: savedWishlistCount, openWishlist } = useWishlist();

  // Use the live context count unless a parent explicitly supplies one.
  const displayedWishlistCount = wishlistCount ?? savedWishlistCount;

  const handleOpenSearch = () => {
    setSearchOpen(true);
    onSearch?.();
  };

  const handleOpenWishlist = () => {
    openWishlist();
    onWishlist?.();
  };

  return (
    <>
      <header className="store-header">
        <AnnouncementBar />

        <div className="store-header__main">
          <button
            type="button"
            className="store-header__icon store-header__menu"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="material-symbols-outlined">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>

          <a
            href="#home"
            className="store-header__brand"
            aria-label="Onishakara home"
          >
            <img
              className="store-header__logo"
              src="https://lh3.googleusercontent.com/aida/AEtjO1Udzpxo4NQe4E0FByJbM5_sgXJiRdIWgGW4G9Ux1AB_cxqhCGUCtvoN5kHgM7NdJePNgz9FceLAh8jGtj0AO_PA7tlX2HzfVluPoezgywZL64zjgYKAH5cFYtEnkEKQeopy7qWhlq-U47YB7ziYVroEOhxEWqU0HFG23LIKspbelDEglNMI6clb9wUkb40YcIYjdcj64JbMUx67OD5_ZH9Cmm0NaDUH7jjgXbJ-vmGEg9oP2tssxuoOtA"
              alt="ONISHAKARA"
            />
            <span>ONISHAKARA</span>
          </a>

          <Navigation activePath={activePath} />

          <div className="store-header__actions">
            {/* Product search */}
            <button
              type="button"
              className="store-header__icon"
              aria-label="Search products"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              onClick={handleOpenSearch}
            >
              <span className="material-symbols-outlined">search</span>
            </button>

            {/* Wishlist */}
            <button
              type="button"
              className="store-header__icon-btn wishlist-btn"
              onClick={() => {
                openWishlist();
                onWishlist?.();
              }}
              aria-label={`Wishlist (${savedWishlistCount} items)`}
            >
              <span className="wishlist-heart">♡</span>

              {savedWishlistCount > 0 && (
                <span className="wishlist-count">
                  {savedWishlistCount > 99 ? "99+" : savedWishlistCount}
                </span>
              )}
            </button>

            {/* Shopping bag */}
            <button
              type="button"
              className="store-header__icon store-header__cart"
              aria-label={`Shopping bag, ${cartCount} items`}
              aria-haspopup="dialog"
              onClick={openCart}
            >
              <span className="material-symbols-outlined">shopping_bag</span>

              <span className="store-header__cart-count">[{cartCount}]</span>
            </button>

            {/* Customer account */}
            <button
              type="button"
              className="store-header__account"
              aria-label="Client account"
              onClick={onAccount}
            >
              <span className="material-symbols-outlined">person</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Shopping bag drawer */}
      <CartDrawer onCheckout={onCheckout} />

      {/* Wishlist drawer */}
      <WishlistDrawer />

      {/* Product search overlay */}
      <ProductSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={onSelectProduct}
      />
    </>
  );
}
