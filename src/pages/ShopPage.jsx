import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getStoreProducts } from "../services/storeApi";
import { useCart } from "../context/CartContext";
import "./ShopPage.css";

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

  // Keep absolute image URLs unchanged.
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Support protocol-relative image URLs.
  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  // Images saved by the backend are served from /uploads.
  if (
    value.startsWith("/uploads/") ||
    value.startsWith("uploads/")
  ) {
    return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
  }

  // Preserve frontend public paths, such as /images/placeholder.png.
  if (value.startsWith("/")) {
    return value;
  }

  // Resolve other relative backend image paths.
  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
};

// ============================================================
// PRODUCT HELPERS
// ============================================================

const formatNaira = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const getPrice = (product) =>
  Number(
    product?.sellingPrice ??
      product?.selling_price ??
      product?.price ??
      0
  );

const getCategory = (product) => {
  const category =
    product?.Category?.name ??
    product?.category?.name ??
    product?.categoryName ??
    (typeof product?.category === "string"
      ? product.category
      : "");

  return category || "";
};

const getName = (product) =>
  product?.name ?? product?.productName ?? "Untitled piece";

const getImage = (product) => {
  let rawImages = product?.images;

  // Sequelize JSON data may arrive as an array or a JSON string.
  if (typeof rawImages === "string") {
    try {
      rawImages = JSON.parse(rawImages);
    } catch {
      // Support a single image path stored as a string.
      rawImages = [rawImages];
    }
  }

  // Use the first available image from the product gallery.
  if (Array.isArray(rawImages) && rawImages.length) {
    for (const item of rawImages) {
      const rawSrc =
        typeof item === "string"
          ? item
          : item?.url ??
            item?.src ??
            item?.imageUrl ??
            item?.image_url ??
            item?.path;

      const src = resolveImageUrl(rawSrc);

      if (src) {
        return src;
      }
    }
  }

  // Fall back to the legacy single-image fields.
  const direct =
    product?.imageUrl ??
    product?.image_url ??
    product?.image ??
    product?.thumbnail;

  return resolveImageUrl(direct);
};

const getVariants = (product) =>
  Array.isArray(product?.Variants)
    ? product.Variants
    : Array.isArray(product?.variants)
      ? product.variants
      : [];

const isActive = (item) =>
  item?.status == null ||
  item?.status === "active" ||
  item?.status === "available";

const getSizes = (product) => {
  const variantSizes = getVariants(product)
    .filter(isActive)
    .map((variant) => variant?.size)
    .filter(Boolean);

  const productSizes = Array.isArray(product?.sizes)
    ? product.sizes
    : [];

  return [...new Set([...productSizes, ...variantSizes])];
};

const getAvailableStock = (product) => {
  const variants = getVariants(product).filter(isActive);

  if (variants.length) {
    return variants.reduce(
      (total, variant) =>
        total + Math.max(0, Number(variant?.quantity) || 0),
      0
    );
  }

  return Math.max(
    0,
    Number(product?.quantity ?? product?.stock ?? 0) || 0
  );
};

const getProductId = (product) => product?.id ?? product?._id;

// ============================================================
// SHOP PAGE
// ============================================================

export default function ShopPage({
  products: suppliedProducts,
  onAddToCart,
  onToggleWishlist,
  wishlist = [],
  loading: parentLoading = false,
}) {
  // Shared cart used by the header, product cards and cart drawer.
  const { addToCart } = useCart();

  const [apiProducts, setApiProducts] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [category, setCategory] = useState("All Garments");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(850000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [madeToOrder, setMadeToOrder] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);

  const [columns, setColumns] = useState(3);
  const [visibleCount, setVisibleCount] = useState(8);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [localWishlist, setLocalWishlist] = useState([]);

  const hasSuppliedProducts = Array.isArray(suppliedProducts);

  const catalogueProducts = hasSuppliedProducts
    ? suppliedProducts
    : apiProducts;

  // Load products from the public store API when the parent
  // does not provide a catalogue.
  const loadProducts = useCallback(async () => {
    if (hasSuppliedProducts) {
      setApiLoading(false);
      setApiError("");
      return;
    }

    setApiLoading(true);
    setApiError("");

    try {
      const result = await getStoreProducts({ search });

      setApiProducts(
        Array.isArray(result)
          ? result.filter((product) => isActive(product))
          : []
      );
    } catch (error) {
      setApiError(
        error?.message ||
          "We could not connect to the store catalogue. Please try again."
      );
    } finally {
      setApiLoading(false);
    }
  }, [hasSuppliedProducts, search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, refreshKey]);

  // Build category filters from the available catalogue.
  const collections = useMemo(() => {
    const categories = catalogueProducts
      .map(getCategory)
      .filter(Boolean);

    return ["All Garments", ...new Set(categories)];
  }, [catalogueProducts]);

  // Apply filters and sorting.
  const filteredProducts = useMemo(() => {
    let result = [...catalogueProducts];

    if (category !== "All Garments") {
      result = result.filter(
        (product) =>
          getCategory(product).toLowerCase() ===
          category.toLowerCase()
      );
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      result = result.filter((product) =>
        `${getName(product)} ${getCategory(product)} ${
          product?.description ?? ""
        } ${product?.sku ?? ""}`
          .toLowerCase()
          .includes(query)
      );
    }

    result = result.filter(
      (product) => getPrice(product) <= maxPrice
    );

    if (inStockOnly) {
      result = result.filter(
        (product) => getAvailableStock(product) > 0
      );
    }

    if (madeToOrder) {
      result = result.filter(
        (product) =>
          product?.madeToOrder === true ||
          product?.availability === "made-to-order"
      );
    }

    if (selectedSizes.length) {
      result = result.filter((product) =>
        selectedSizes.some((size) =>
          getSizes(product).includes(size)
        )
      );
    }

    if (sort === "price-low") {
      result.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sort === "price-high") {
      result.sort((a, b) => getPrice(b) - getPrice(a));
    } else if (sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b?.createdAt ?? 0).getTime() -
          new Date(a?.createdAt ?? 0).getTime()
      );
    }

    return result;
  }, [
    catalogueProducts,
    category,
    search,
    sort,
    maxPrice,
    inStockOnly,
    madeToOrder,
    selectedSizes,
  ]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const isLoading =
    parentLoading || (!hasSuppliedProducts && apiLoading);

  const displayError = !hasSuppliedProducts ? apiError : "";

  // Reset all catalogue filters.
  const clearFilters = () => {
    setCategory("All Garments");
    setSearch("");
    setSort("featured");
    setMaxPrice(850000);
    setInStockOnly(false);
    setMadeToOrder(false);
    setSelectedSizes([]);
    setVisibleCount(8);
  };

  const toggleSize = (size) => {
    setSelectedSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size]
    );

    setVisibleCount(8);
  };

  // Wishlist handling.
  const toggleWishlist = (product) => {
    const id = getProductId(product) ?? getName(product);

    setLocalWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );

    onToggleWishlist?.(product);
  };

  const isWishlisted = (product) => {
    const id = getProductId(product);

    return (
      wishlist.includes(id) ||
      localWishlist.includes(id)
    );
  };

  // Add to the shared cart context.
  // CartContext handles quantity merging and opening the drawer.
  const addProductToCart = (product) => {
    if (!product) return;

    if (getAvailableStock(product) <= 0) return;

    addToCart(product);
  };

  return (
    <main className="og-shop">
      {/* Breadcrumb */}
      <div className="og-breadcrumb">
        <div className="og-shop-container og-breadcrumb-inner">
          <nav aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/shop">Shop All</Link>
            <span>/</span>
            <strong>Ready-to-Wear</strong>
          </nav>

          <span className="og-sync-label">
            <i />
            POS catalogue
          </span>
        </div>
      </div>

      {/* Editorial introduction */}
      <section className="og-shop-container og-editorial">
        <div className="og-editorial-copy">
          <span className="og-eyebrow">
            Haute Monograph · Volume IV
          </span>

          <h1>The Ready-to-Wear Atelier</h1>

          <p>
            Sculptural tailoring, hand-loomed Aso-Oke textures and
            liquid silk damasks. Discover contemporary Nigerian
            elegance, curated for collectors around the world.
          </p>
        </div>

        <div className="og-editorial-actions">
          <div className="og-product-count">
            <strong>{filteredProducts.length}</strong>
            <span> curated designs</span>
          </div>

          <div
            className="og-grid-switch"
            aria-label="Product grid layout"
          >
            <button
              type="button"
              className={columns === 3 ? "active" : ""}
              onClick={() => setColumns(3)}
              aria-label="Three-column grid"
              aria-pressed={columns === 3}
            >
              ▦
            </button>

            <button
              type="button"
              className={columns === 4 ? "active" : ""}
              onClick={() => setColumns(4)}
              aria-label="Four-column grid"
              aria-pressed={columns === 4}
            >
              ▤
            </button>
          </div>
        </div>
      </section>

      {/* Search and sorting toolbar */}
      <section className="og-toolbar">
        <div className="og-shop-container og-toolbar-inner">
          <label className="og-search">
            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              placeholder="Search the collection..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleCount(8);
              }}
              aria-label="Search products"
            />
          </label>

          <div className="og-toolbar-actions">
            <button
              type="button"
              className="og-filter-toggle"
              onClick={() =>
                setMobileFiltersOpen((open) => !open)
              }
              aria-expanded={mobileFiltersOpen}
            >
              ☷ Filters
            </button>

            <label className="og-sort">
              <span>Sort by</span>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="featured">Curator's Choice</option>
                <option value="newest">Newest Releases</option>
                <option value="price-low">
                  Price: Low to High
                </option>
                <option value="price-high">
                  Price: High to Low
                </option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Catalogue and filters */}
      <section className="og-shop-container og-catalogue">
        <aside
          className={`og-sidebar ${
            mobileFiltersOpen ? "og-sidebar-open" : ""
          }`}
        >
          <div className="og-filter-panel">
            <div className="og-filter-heading">
              <h2>Collections</h2>
              <span>Explore</span>
            </div>

            <div className="og-category-list">
              {collections.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    category === item ? "selected" : ""
                  }
                  onClick={() => {
                    setCategory(item);
                    setVisibleCount(8);
                  }}
                >
                  <span>{item}</span>
                  {category === item && <span>↗</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="og-filter-panel">
            <h2>Acquisition State</h2>

            <label className="og-check">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(event) =>
                  setInStockOnly(event.target.checked)
                }
              />
              <span>
                In Stock
                <small>Available inventory only</small>
              </span>
            </label>

            <label className="og-check">
              <input
                type="checkbox"
                checked={madeToOrder}
                onChange={(event) =>
                  setMadeToOrder(event.target.checked)
                }
              />
              <span>
                Made to Order
                <small>Atelier production</small>
              </span>
            </label>
          </div>

          <div className="og-filter-panel">
            <div className="og-filter-heading">
              <h2>Price Range</h2>
              <span>NGN ₦</span>
            </div>

            <div className="og-price-labels">
              <span>₦0</span>
              <strong>{formatNaira(maxPrice)}</strong>
            </div>

            <input
              className="og-price-slider"
              type="range"
              min="50000"
              max="850000"
              step="10000"
              value={maxPrice}
              onChange={(event) =>
                setMaxPrice(Number(event.target.value))
              }
              aria-label="Maximum price"
            />

            <div className="og-price-chips">
              <button
                type="button"
                onClick={() => setMaxPrice(100000)}
              >
                Under ₦100k
              </button>

              <button
                type="button"
                onClick={() => setMaxPrice(300000)}
              >
                Under ₦300k
              </button>

              <button
                type="button"
                onClick={() => setMaxPrice(850000)}
              >
                All prices
              </button>
            </div>
          </div>

          <div className="og-filter-panel">
            <div className="og-filter-heading">
              <h2>Atelier Fit</h2>
              <span>Size</span>
            </div>

            <div className="og-size-grid">
              {["XS", "S", "M", "L", "XL", "XXL"].map(
                (size) => (
                  <button
                    key={size}
                    type="button"
                    className={
                      selectedSizes.includes(size)
                        ? "selected"
                        : ""
                    }
                    onClick={() => toggleSize(size)}
                    aria-pressed={selectedSizes.includes(size)}
                  >
                    {size}
                  </button>
                )
              )}
            </div>

            <p className="og-filter-note">
              Sizes are shown when supplied by your product data.
            </p>
          </div>

          <button
            className="og-clear-filters"
            type="button"
            onClick={clearFilters}
          >
            Clear all filters ↗
          </button>
        </aside>

        {/* Products */}
        <div className="og-products-area">
          <div className="og-results-bar">
            <span>
              Showing <strong>{visibleProducts.length}</strong> of{" "}
              <strong>{filteredProducts.length}</strong> pieces
            </span>

            <span className="og-results-caption">
              Live catalogue · Onishakara Gold
            </span>
          </div>

          {displayError ? (
            <div className="og-empty-state" role="alert">
              <span className="og-eyebrow">
                Connection interrupted
              </span>

              <h2>We couldn't load the collection.</h2>
              <p>{displayError}</p>

              <button
                type="button"
                onClick={() =>
                  setRefreshKey((key) => key + 1)
                }
              >
                Try Again
              </button>
            </div>
          ) : isLoading ? (
            <div
              className="og-empty-state"
              aria-live="polite"
            >
              <h2>Opening the atelier...</h2>
              <p>
                Loading available designs from the live catalogue.
              </p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="og-empty-state">
              <span className="og-eyebrow">
                No matching pieces
              </span>

              <h2>Your next favourite is waiting.</h2>
              <p>Try another category or clear your filters.</p>

              <button
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div
              className={`og-product-grid og-columns-${columns}`}
              aria-live="polite"
            >
              {visibleProducts.map((product, index) => {
                const image = getImage(product);
                const stock = getAvailableStock(product);
                const sizes = getSizes(product);
                const badge = product?.badge ?? "";
                const productName = getName(product);
                const wishlisted = isWishlisted(product);

                return (
                  <article
                    className="og-product-card"
                    key={
                      getProductId(product) ??
                      `${productName}-${index}`
                    }
                  >
                    <div className="og-product-image">
                      {image ? (
                        <img
                          src={image}
                          alt={
                            product?.imageAlt ?? productName
                          }
                          loading="lazy"
                          onError={(event) => {
                            // Hide a broken image without changing
                            // the existing product card layout.
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="og-image-placeholder">
                          <span>ONISHAKARA</span>
                          <small>Atelier Collection</small>
                        </div>
                      )}

                      {badge && (
                        <span className="og-product-badge">
                          {badge}
                        </span>
                      )}

                      <button
                        type="button"
                        className={`og-wishlist ${
                          wishlisted ? "wishlisted" : ""
                        }`}
                        onClick={() => toggleWishlist(product)}
                        aria-label={
                          wishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        aria-pressed={wishlisted}
                      >
                        {wishlisted ? "♥" : "♡"}
                      </button>

                      {/* Add to Bag: uses the existing CartContext */}
                      <button
                        type="button"
                        className={`og-quick-add ${
                          stock <= 0 ? "is-unavailable" : ""
                        }`}
                        onClick={() =>
                          addProductToCart(product)
                        }
                        disabled={stock <= 0}
                        aria-label={
                          stock <= 0
                            ? `${productName} is currently unavailable`
                            : `Add ${productName} to bag`
                        }
                      >
                        {stock <= 0
                          ? "Currently unavailable"
                          : "Add to Bag ↗"}
                      </button>
                    </div>

                    <div className="og-product-info">
                      <div className="og-product-meta">
                        <span>
                          {getCategory(product) ||
                            "Atelier Collection"}
                        </span>

                        <span
                          className={
                            stock > 0
                              ? "in-stock"
                              : "out-stock"
                          }
                        >
                          {stock > 0
                            ? "In Stock"
                            : "Unavailable"}
                        </span>
                      </div>

                      <h2>{productName}</h2>

                      {product?.description && (
                        <p className="og-product-description">
                          {product.description}
                        </p>
                      )}

                      <div className="og-product-bottom">
                        <div>
                          <small>Current Price</small>
                          <strong>
                            {formatNaira(getPrice(product))}
                          </strong>
                        </div>

                        {sizes.length > 0 && (
                          <span className="og-product-sizes">
                            {sizes.slice(0, 4).join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {!isLoading &&
            !displayError &&
            visibleCount < filteredProducts.length && (
              <div className="og-load-more">
                <span className="og-eyebrow">
                  Curated Acquisition Archive
                </span>

                <p>
                  Showing {visibleProducts.length} of{" "}
                  {filteredProducts.length} pieces
                </p>

                <div className="og-progress">
                  <span
                    style={{
                      width: `${
                        filteredProducts.length
                          ? (visibleProducts.length /
                              filteredProducts.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((count) => count + 8)
                  }
                >
                  Load More Atelier Pieces
                </button>
              </div>
            )}

          {/* Concierge */}
          <div className="og-concierge">
            <div>
              <span className="og-eyebrow">
                Personal Service
              </span>

              <h2>
                Searching for something exceptional?
              </h2>

              <p>
                Contact our team about a particular piece or a
                bespoke enquiry.
              </p>
            </div>

            <Link to="/contact">
              Contact the Concierge ↗
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}