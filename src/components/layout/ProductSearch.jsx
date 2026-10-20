
import { useEffect, useRef, useState } from "react";
import { useCart } from "../../context/CartContext";
import { getStoreProducts } from "../../services/storeApi";
import {
  formatStorePrice,
  getProductImage,
  getProductKey,
  getProductName,
  getProductPrice,
} from "../../utils/storeProduct";
import "./ProductSearch.css";

export default function ProductSearch({
  isOpen,
  onClose,
  onSelectProduct,
}) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => inputRef.current?.focus());

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const searchTerm = query.trim();

    if (!searchTerm) {
      setProducts([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const results = await getStoreProducts({ search: searchTerm });

        if (!cancelled) {
          setProducts(Array.isArray(results) ? results : []);
        }
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setError(err.message || "We couldn't load products. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen]);

  const handleSelect = (product) => {
    onClose();
    onSelectProduct?.(product);
  };

  const handleAddToBag = (product) => {
    addToCart(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="product-search"
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      <button
        type="button"
        className="product-search__backdrop"
        aria-label="Close product search"
        onClick={onClose}
      />

      <section className="product-search__panel">
        <header className="product-search__header">
          <div>
            <p className="product-search__eyebrow">ONISHAKARA</p>
            <h2>Find your next favourite</h2>
          </div>

          <button
            type="button"
            className="product-search__close"
            onClick={onClose}
            aria-label="Close search"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form
          className="product-search__form"
          onSubmit={(event) => event.preventDefault()}
          role="search"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            search
          </span>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clothing, shoes, accessories..."
            aria-label="Search the product catalogue"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              className="product-search__clear"
              onClick={() => setQuery("")}
            >
              Clear
            </button>
          )}
        </form>

        <div className="product-search__results" aria-live="polite">
          {!query.trim() ? (
            <div className="product-search__message">
              <span className="material-symbols-outlined">search</span>
              <h3>What are you looking for?</h3>
              <p>Enter a product name to explore our collection.</p>
            </div>
          ) : loading ? (
            <div className="product-search__message">
              <span className="product-search__spinner" />
              <p>Finding your products...</p>
            </div>
          ) : error ? (
            <div className="product-search__message">
              <span className="material-symbols-outlined">error_outline</span>
              <h3>Search unavailable</h3>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setQuery((current) => `${current} `)}
              >
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="product-search__message">
              <span className="material-symbols-outlined">inventory_2</span>
              <h3>No products found</h3>
              <p>Try another product name or a broader search.</p>
            </div>
          ) : (
            <>
              <p className="product-search__result-count">
                {products.length} {products.length === 1 ? "result" : "results"}
              </p>

              <div className="product-search__grid">
                {products.map((product) => {
                  const name = getProductName(product);

                  return (
                    <article
                      className="product-search__product"
                      key={getProductKey(product)}
                    >
                      <button
                        type="button"
                        className="product-search__product-image"
                        onClick={() => handleSelect(product)}
                        aria-label={`View ${name}`}
                      >
                        <img
                          src={getProductImage(product)}
                          alt={name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              "/images/product-placeholder.png";
                          }}
                        />
                      </button>

                      <div className="product-search__product-info">
                        <button
                          type="button"
                          className="product-search__product-name"
                          onClick={() => handleSelect(product)}
                        >
                          {name}
                        </button>

                        <p className="product-search__price">
                          {formatStorePrice(getProductPrice(product))}
                        </p>

                        <button
                          type="button"
                          className="product-search__add"
                          onClick={() => handleAddToBag(product)}
                        >
                          ADD TO BAG
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
