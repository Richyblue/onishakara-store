
import { useEffect, useMemo, useState } from "react";
import ProductCard from "../shop/ProductCard";
import {
  getStoreCategories,
  getStoreProducts,
} from "../../services/storeApi";
import "./NewArrivals.css";

function getCategoryId(product) {
  return (
    product.categoryId ??
    product.Category?.id ??
    product.category?.id ??
    null
  );
}

function getProductId(product) {
  return product.id ?? product._id;
}

export default function NewArrivals({
  products,
  onAddToCart,
  onToggleWishlist,
  wishlistIds = [],
}) {
  const [categories, setCategories] = useState([]);
  const [apiProducts, setApiProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(
    !Array.isArray(products)
  );

  const [categoryError, setCategoryError] = useState("");
  const [productError, setProductError] = useState("");

  // Load active categories from the public storefront API.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoadingCategories(true);
      setCategoryError("");

      try {
        const result = await getStoreCategories();

        if (!cancelled) {
          setCategories(result);
        }
      } catch (error) {
        if (!cancelled) {
          setCategoryError(
            error.message || "Unable to load categories."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Use products supplied by the parent when available.
  // Otherwise, load the live storefront catalogue.
  useEffect(() => {
    if (Array.isArray(products)) {
      setApiProducts(products);
      setLoadingProducts(false);
      setProductError("");
      return;
    }

    let cancelled = false;

    async function loadProducts() {
      setLoadingProducts(true);
      setProductError("");

      try {
        const result = await getStoreProducts();

        if (!cancelled) {
          setApiProducts(result);
        }
      } catch (error) {
        if (!cancelled) {
          setApiProducts([]);
          setProductError(
            error.message || "Unable to load products."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [products]);

  const productList = Array.isArray(products)
    ? products
    : apiProducts;

  const visibleProducts = useMemo(() => {
    // Only show active products in the public storefront.
    const activeProducts = productList.filter(
      (product) =>
        product.status === undefined ||
        product.status === "active"
    );

    if (activeFilter === "all") {
      return activeProducts;
    }

    return activeProducts.filter(
      (product) =>
        String(getCategoryId(product)) === String(activeFilter)
    );
  }, [productList, activeFilter]);

  function selectCategory(categoryId) {
    setActiveFilter(String(categoryId));
  }

  return (
    <section className="new-arrivals" id="new-arrivals">
      <div className="new-arrivals__inner">
        <div className="new-arrivals__heading">
          <div>
            <p className="new-arrivals__eyebrow">JUST ARRIVED</p>

            <h2 className="new-arrivals__title">
              The Latest <em>Expressions</em>
            </h2>

            <p className="new-arrivals__description">
              Discover considered pieces selected for a distinctive wardrobe.
            </p>
          </div>

          <a className="new-arrivals__view-all" href="#shop-all">
            Explore the collection <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div
          className="new-arrivals__filters"
          aria-label="Filter products by category"
        >
          <button
            type="button"
            className={`new-arrivals__filter ${
              activeFilter === "all" ? "is-active" : ""
            }`}
            onClick={() => selectCategory("all")}
            aria-pressed={activeFilter === "all"}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`new-arrivals__filter ${
                activeFilter === String(category.id)
                  ? "is-active"
                  : ""
              }`}
              onClick={() => selectCategory(category.id)}
              aria-pressed={
                activeFilter === String(category.id)
              }
            >
              {category.name}
            </button>
          ))}
        </div>

        {loadingCategories && (
          <p className="new-arrivals__empty">
            Loading categories...
          </p>
        )}

        {categoryError && (
          <p className="new-arrivals__empty" role="alert">
            Unable to load categories: {categoryError}
          </p>
        )}

        {loadingProducts ? (
          <p className="new-arrivals__empty">
            Loading the latest collection...
          </p>
        ) : productError ? (
          <p className="new-arrivals__empty" role="alert">
            Unable to load products: {productError}
          </p>
        ) : visibleProducts.length > 0 ? (
          <div className="new-arrivals__grid">
            {visibleProducts.map((product) => {
              const productId = getProductId(product);

              return (
                <ProductCard
                  key={productId}
                  product={product}
                  onAddToCart={onAddToCart}
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={wishlistIds.some(
                    (id) => String(id) === String(productId)
                  )}
                />
              );
            })}
          </div>
        ) : (
          <p className="new-arrivals__empty">
            {activeFilter === "all"
              ? "No products are available at the moment."
              : "No products are available in this category yet."}
          </p>
        )}

        <div className="new-arrivals__bottom">
          <a href="#shop-all" className="new-arrivals__all-button">
            Discover All Pieces
          </a>
        </div>
      </div>
    </section>
  );
}
