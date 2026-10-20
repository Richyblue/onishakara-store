import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoreProducts } from "../../services/storeApi";
import { shuffleProducts } from "../../utils/shuffleProducts";
import ProductCard from "../shop/ProductCard";
import "./FeaturedProducts.css";

const PRODUCTS_PER_PAGE = 8;

export default function FeaturedProducts({
  title = "Shop Our Products",
  subtitle = "Discover quality pieces selected for your everyday style.",
  limit = PRODUCTS_PER_PAGE,
  onSelectProduct,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getStoreProducts({});
      setProducts(Array.isArray(result) ? result.filter(Boolean) : []);
    } catch (err) {
      setError(err?.message || "We couldn't load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, retryKey]);

  const totalPages = Math.ceil(products.length / limit);

  const safePage = Math.min(currentPage, Math.max(totalPages, 1));

  const visibleProducts = useMemo(() => {
    const start = (safePage - 1) * limit;
    return products.slice(start, start + limit);
  }, [products, safePage, limit]);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    document
      .getElementById("featured-products")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set([
      1,
      totalPages,
      safePage,
      safePage - 1,
      safePage + 1,
    ]);

    return [...pages]
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
  }, [totalPages, safePage]);

  return (
    <section
      id="featured-products"
      className="featured-products"
      aria-labelledby="featured-products-title"
    >
      <div className="featured-products__container">
        <div className="featured-products__heading">
          <div>
            <span className="featured-products__eyebrow">
              THE ONISHAKARA COLLECTION
            </span>

            <h2 id="featured-products-title">{title}</h2>

            <p>{subtitle}</p>
          </div>

          <span className="featured-products__total">
            {products.length} {products.length === 1 ? "product" : "products"}
          </span>
        </div>

        {loading ? (
          <div
            className="featured-products__grid"
            aria-label="Loading products"
          >
            {Array.from({ length: Math.min(limit, 8) }, (_, index) => (
              <div className="featured-products__skeleton" key={index}>
                <div className="featured-products__skeleton-image" />
                <div className="featured-products__skeleton-line" />
                <div className="featured-products__skeleton-line short" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="featured-products__state" role="alert">
            <h3>Products are temporarily unavailable</h3>
            <p>{error}</p>
            <button
              type="button"
              className="featured-products__retry"
              onClick={() => setRetryKey((key) => key + 1)}
            >
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="featured-products__state">
            <h3>New arrivals are on the way</h3>
            <p>There are no products available to display right now.</p>
          </div>
        ) : (
          <>
            <div className="featured-products__results">
              Showing <strong>{(safePage - 1) * limit + 1}</strong>
              {"–"}
              <strong>
                {Math.min(safePage * limit, products.length)}
              </strong> of <strong>{products.length}</strong> products
            </div>

            <div className="featured-products__grid">
              {visibleProducts.map((product, index) => (
                <div
                  className="featured-products__item"
                  key={
                    product.id ??
                    product._id ??
                    product.sku ??
                    `${product.name}-${index}`
                  }
                >
                  <ProductCard
                    product={product}
                    onSelectProduct={onSelectProduct}
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                className="featured-products__pagination"
                aria-label="Product pagination"
              >
                <button
                  type="button"
                  className="featured-products__page-arrow"
                  disabled={safePage === 1}
                  onClick={() => changePage(safePage - 1)}
                  aria-label="Previous page"
                >
                  ‹ <span>Previous</span>
                </button>

                <div className="featured-products__page-numbers">
                  {pageNumbers.map((page, index) => {
                    const previous = pageNumbers[index - 1];
                    const showEllipsis = previous && page - previous > 1;

                    return (
                      <span
                        className="featured-products__page-group"
                        key={page}
                      >
                        {showEllipsis && (
                          <span className="featured-products__ellipsis">…</span>
                        )}

                        <button
                          type="button"
                          className={`featured-products__page-number ${
                            safePage === page ? "is-active" : ""
                          }`}
                          onClick={() => changePage(page)}
                          aria-current={safePage === page ? "page" : undefined}
                          aria-label={`Page ${page}`}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="featured-products__page-arrow"
                  disabled={safePage === totalPages}
                  onClick={() => changePage(safePage + 1)}
                  aria-label="Next page"
                >
                  <span>Next</span> ›
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
