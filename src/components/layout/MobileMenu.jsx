
import { useEffect } from "react";
import "./MobileMenu.css";

const menuItems = [
  { label: "Home", href: "#home", number: "01" },
  { label: "Shop All", href: "#shop-all", number: "02" },
  { label: "New Arrivals", href: "#new-arrivals", number: "03" },
  { label: "Collections", href: "#collections", number: "04" },
  { label: "Categories", href: "#categories", number: "05" },
  { label: "About Us", href: "#about-us", number: "06" },
];

export default function MobileMenu({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mobile-navigation">
      <button
        type="button"
        className="mobile-navigation__backdrop"
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className="mobile-navigation__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="mobile-navigation__header">
          <div>
            <span className="mobile-navigation__eyebrow">
              DISCOVER
            </span>
            <h2>ONISHAKARA</h2>
          </div>

          <button
            type="button"
            className="mobile-navigation__close"
            aria-label="Close menu"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        <nav
          className="mobile-navigation__links"
          aria-label="Mobile main navigation"
        >
          {menuItems.map((item) => (
            <a
              key={item.number}
              href={item.href}
              className="mobile-navigation__link"
              onClick={onClose}
            >
              <span className="mobile-navigation__number">
                {item.number}
              </span>

              <span className="mobile-navigation__label">
                {item.label}
              </span>

              <span className="material-symbols-outlined mobile-navigation__arrow">
                arrow_outward
              </span>
            </a>
          ))}
        </nav>

        <div className="mobile-navigation__footer">
          <span className="mobile-navigation__footer-line" />
          <p>A NEW EXPRESSION OF AFRICAN LUXURY</p>
          <span>LAGOS, NIGERIA</span>
        </div>
      </aside>
    </div>
  );
}
