
import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoreProducts } from "../services/storeApi";
import ProductCard from "../components/shop/ProductCard";
import { shuffleProducts } from "../utils/shuffleProducts";
import "./NewlyArrived.css";

const PRODUCTS_PER_PAGE = 8;

const getProductName = (product) =>
  product?.name || product?.productName || product?.title || "Untitled product";

const getProductPrice = (product) =>
  Number(product?.price ?? product?.sellingPrice ?? product?.selling_price ?? 0);

const getCategoryName = (product) => {
  const category = product?.category;

  if (typeof category === "string") return category;
  if (category && typeof category === "object") {
    return category.name || category.title || category.categoryName || "Other";
  }

  return product?.categoryName || "Other";
};

export default function NewlyArrived() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getStoreProducts({});
      const catalogue = Array.isArray(result) ? result.filter(Boolean) : [];

      // Keep only products explicitly marked as new arrivals when the
      // backend provides a recognised new-arrival field.
      const hasNewArrivalFlag = catalogue.some((product) =>
        ["isNewArrival", "is_new_arrival", "newArrival", "isNew"].some(
          (field) => typeof product[field] === "boolean"
        )
      );

      const arrivals = hasNewArrivalFlag
        ? catalogue.filter((product) =>
            product.isNewArrival === true ||
            product.is_new_arrival === true ||
            product.newArrival === true ||
            product.isNew === true
          )
        : catalogue;

        setProducts(shuffleProducts(arrivals));
    } catch (err) {
      setError(err?.message || "We couldn't load the latest arrivals.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, retryKey]);

  const categories = useMemo(() => {
    const names = products.map(getCategoryName).filter(Boolean);
    return ["All", ...new Set(names.filter((name) => name !== "Other"))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const name = getProductName(product).toLowerCase();
      const description = String(
        product.description || product.shortDescription || ""
      ).toLowerCase();
      const category = getCategoryName(product);
      const matchesSearch =
        !query ||
        name.includes(query) ||
        description.includes(query) ||
        category.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" || category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-low") return getProductPrice(a) - getProductPrice(b);
      if (sortBy === "price-high") return getProductPrice(b) - getProductPrice(a);
      if (sortBy === "name") return getProductName(a).localeCompare(getProductName(b));

      const dateA = new Date(
        a.createdAt || a.created_at || a.dateAdded || a.updatedAt || 0
      ).getTime();
      const dateB = new Date(
        b.createdAt || b.created_at || b.dateAdded || b.updatedAt || 0
      ).getTime();

      return dateB - dateA;
    });
  }, [products, search, selectedCategory, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));

  const visibleProducts = useMemo(() => {
    const start = (safePage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, safePage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, sortBy]);

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);
    document.getElementById("new-arrivals-products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const candidates = [1, safePage - 1, safePage, safePage + 1, totalPages];

    return [...new Set(candidates)]
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
  }, [totalPages, safePage]);

  return (
    <main className="new-arrivals">
      <section className="new-arrivals__hero">
        <div className="new-arrivals__hero-inner">
          <div className="new-arrivals__hero-copy">
            <span className="new-arrivals__eyebrow">
              FRESH FINDS. TIMELESS STYLE.
            </span>

            <h1>
              Just Arrived.
              <br />
              <span>Made for You.</span>
            </h1>

            <p>
              Meet the latest additions to Onishakara. Discover fresh finds,
              standout essentials, and pieces selected to elevate your style.
            </p>

            <a className="new-arrivals__hero-cta" href="#new-arrivals-products">
              Explore New Arrivals <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="new-arrivals__hero-art" aria-hidden="true">
            <div className="new-arrivals__hero-circle">
              <span>NEW</span>
              <strong>SEASON</strong>
              <span>NEW POSSIBILITIES</span>
            </div>
            <span className="new-arrivals__hero-number">01</span>
          </div>
        </div>
      </section>

      <section
        className="new-arrivals__collection"
        id="new-arrivals-products"
        aria-labelledby="new-arrivals-title"
      >
        <div className="new-arrivals__container">
          <header className="new-arrivals__section-heading">
            <div>
              <span className="new-arrivals__section-label">
                THE LATEST EDIT
              </span>
              <h2 id="new-arrivals-title">New Arrivals</h2>
              <p>
                The newest additions, thoughtfully selected for you.
              </p>
            </div>

            <span className="new-arrivals__count">
              {loading ? "Loading..." : `${filteredProducts.length} items`}
            </span>
          </header>

          <div className="new-arrivals__toolbar">
            <div className="new-arrivals__filters" aria-label="Filter by category">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`new-arrivals__filter ${
                    selectedCategory === category ? "is-active" : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="new-arrivals__controls">
              <label className="new-arrivals__search">
                <span className="new-arrivals__sr-only">Search products</span>
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search arrivals..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <label className="new-arrivals__sort">
                <span className="new-arrivals__sr-only">Sort products</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="newest">Latest first</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="new-arrivals__grid" aria-label="Loading products">
              {Array.from({ length: 8 }, (_, index) => (
                <div className="new-arrivals__skeleton" key={index}>
                  <div className="new-arrivals__skeleton-image" />
                  <div className="new-arrivals__skeleton-line" />
                  <div className="new-arrivals__skeleton-line short" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="new-arrivals__state" role="alert">
              <span className="new-arrivals__state-icon" aria-hidden="true">!</span>
              <h3>We’ll be back in a moment</h3>
              <p>{error}</p>
              <button
                type="button"
                className="new-arrivals__retry"
                onClick={() => setRetryKey((key) => key + 1)}
              >
                Try Again
              </button>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="new-arrivals__state">
              <span className="new-arrivals__state-icon" aria-hidden="true">⌕</span>
              <h3>No matching products found</h3>
              <p>
                Try another search or category to discover more from Onishakara.
              </p>
              <button
                type="button"
                className="new-arrivals__retry"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="new-arrivals__results">
                Showing{" "}
                <strong>{(safePage - 1) * PRODUCTS_PER_PAGE + 1}</strong>–
                <strong>
                  {Math.min(safePage * PRODUCTS_PER_PAGE, filteredProducts.length)}
                </strong>{" "}
                of <strong>{filteredProducts.length}</strong> products
              </div>

              <div className="new-arrivals__grid">
                {visibleProducts.map((product, index) => (
                  <div
                    className="new-arrivals__product"
                    key={
                      product.id ??
                      product._id ??
                      product.sku ??
                      `${getProductName(product)}-${index}`
                    }
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="new-arrivals__pagination"
                  aria-label="New arrivals pages"
                >
                  <button
                    type="button"
                    className="new-arrivals__page-arrow"
                    disabled={safePage === 1}
                    onClick={() => changePage(safePage - 1)}
                  >
                    ‹ <span>Previous</span>
                  </button>

                  <div className="new-arrivals__page-list">
                    {pageNumbers.map((page, index) => {
                      const previous = pageNumbers[index - 1];

                      return (
                        <span className="new-arrivals__page-group" key={page}>
                          {previous && page - previous > 1 && (
                            <span className="new-arrivals__ellipsis">…</span>
                          )}

                          <button
                            type="button"
                            className={`new-arrivals__page-number ${
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
                    className="new-arrivals__page-arrow"
                    disabled={safePage === totalPages}
                    onClick={() => changePage(safePage + 1)}
                  >
                    <span>Next</span> ›
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
