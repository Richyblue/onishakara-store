import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getStoreProducts } from "../services/storeApi";
import { useCart } from "../context/CartContext";
import "./ProductDetailsPage.css";


const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  "https://api-onishakara.princesssalon.xyz"
).replace(/\/+$/, "");

const resolveImageUrl = (image) => {
  if (typeof image !== "string" || !image.trim()) {
    return "";
  }

  const value = image.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  if (
    value.startsWith("/uploads/") ||
    value.startsWith("uploads/")
  ) {
    return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
  }

  return value.startsWith("/")
    ? value
    : `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
};

const formatPrice = (price, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(price || 0));

const getProductId = (product) =>
  product?.id ?? product?._id ?? product?.productId;

const getProductName = (product) =>
  product?.name ?? product?.productName ?? "Untitled piece";

const getProductPrice = (product) =>
  Number(
    product?.sellingPrice ??
      product?.selling_price ??
      product?.price ??
      0
  );

const getProductCategory = (product) =>
  product?.Category?.name ??
  product?.category?.name ??
  (typeof product?.category === "string" ? product.category : "") ??
  product?.categoryName ??
  "";


  const getProductImages = (product) => {
    let rawImages = product?.images;
  
    // Support images returned as a JSON string.
    if (typeof rawImages === "string") {
      try {
        rawImages = JSON.parse(rawImages);
      } catch {
        rawImages = [rawImages];
      }
    }
  
    const normalizedImages = Array.isArray(rawImages)
      ? rawImages
          .map((image, index) => {
            const rawSrc =
              typeof image === "string"
                ? image
                : image?.url ??
                  image?.src ??
                  image?.imageUrl ??
                  image?.image_url;
  
            const src = resolveImageUrl(rawSrc);
  
            return src
              ? {
                  src,
                  alt:
                    image?.alt ??
                    `${getProductName(product)} image ${index + 1}`,
                  label: image?.label ?? `View ${index + 1}`,
                }
              : null;
          })
          .filter(Boolean)
      : [];
  
    if (normalizedImages.length) {
      return normalizedImages;
    }
  
    // Fall back to existing single-image fields.
    const singleImage =
      product?.imageUrl ??
      product?.image_url ??
      product?.image ??
      product?.thumbnail;
  
    const src = resolveImageUrl(singleImage);
  
    return src
      ? [
          {
            src,
            alt: getProductName(product),
            label: "Product image",
          },
        ]
      : [];
  };
  
const getProductVariants = (product) =>
  Array.isArray(product?.Variants)
    ? product.Variants
    : Array.isArray(product?.variants)
      ? product.variants
      : [];

const isActive = (item) =>
  item?.status == null ||
  item?.status === "active" ||
  item?.status === "available";

const getProductSizes = (product) => {
  const explicitSizes = Array.isArray(product?.sizes)
    ? product.sizes
    : [];

  const variantSizes = getProductVariants(product)
    .filter(isActive)
    .map((variant) => variant?.size)
    .filter(Boolean);

  return [
    ...new Set([...explicitSizes, ...variantSizes]),
  ];
};

const getStock = (product) => {
  const variants = getProductVariants(product).filter(isActive);

  if (variants.length) {
    return variants.reduce(
      (total, variant) =>
        total + Math.max(0, Number(variant?.quantity) || 0),
      0
    );
  }

  const stockValue = product?.quantity ?? product?.stock;

  // Null means the API did not provide a stock value.
  return stockValue == null
    ? null
    : Math.max(0, Number(stockValue) || 0);
};

const getProductColours = (product) => {
  if (Array.isArray(product?.colours)) return product.colours;
  if (Array.isArray(product?.colors)) return product.colors;

  const variants = getProductVariants(product);
  const colourNames = [
    ...new Set(
      variants
        .filter(isActive)
        .map((variant) => variant?.colour ?? variant?.color)
        .filter(Boolean)
    ),
  ];

  return colourNames.map((name) => ({
    name,
    description: name,
    swatch: "#111111",
  }));
};

const getApiProduct = (result, id) => {
  const products = Array.isArray(result)
    ? result
    : Array.isArray(result?.products)
      ? result.products
      : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.data?.products)
          ? result.data.products
          : result?.data
            ? [result.data]
            : [];

  return products.find(
    (product) => String(getProductId(product)) === String(id)
  );
};

function ProductDetailsPage({
  product: suppliedProduct,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
}) {
  const { id, productId } = useParams();
  const routeProductId = productId ?? id;

  const { addToCart } = useCart();

  const [apiProduct, setApiProduct] = useState(null);
  const [loading, setLoading] = useState(!suppliedProduct);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColour, setSelectedColour] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState("details");
  const [addingToBag, setAddingToBag] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const loadProduct = useCallback(async () => {
    if (suppliedProduct) {
      setApiProduct(suppliedProduct);
      setLoading(false);
      setLoadError("");
      return;
    }

    if (!routeProductId) {
      setApiProduct(null);
      setLoading(false);
      setLoadError("No product ID was provided in the page URL.");
      return;
    }

    setLoading(true);
    setLoadError("");
    setApiProduct(null);

    try {
      // Uses the public store API already used by ShopPage.
      const result = await getStoreProducts({});
      const foundProduct = getApiProduct(result, routeProductId);

      if (!foundProduct) {
        setLoadError("This product could not be found in the store catalogue.");
        return;
      }

      setApiProduct(foundProduct);
    } catch (error) {
      setLoadError(
        error?.message ||
          "We could not load this product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [suppliedProduct, routeProductId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct, retryKey]);

  const product = apiProduct;

  const images = useMemo(
    () => (product ? getProductImages(product) : []),
    [product]
  );

  const colours = useMemo(
    () => (product ? getProductColours(product) : []),
    [product]
  );

  const sizes = useMemo(
    () => (product ? getProductSizes(product) : []),
    [product]
  );

  useEffect(() => {
    setActiveImage(0);
    setSelectedSize("");
    setSelectedColour(colours[0]?.name ?? "");
    setQuantity(1);
    setCartMessage("");
  }, [product, colours]);

  const currentImage = images[activeImage];

  const selectedColourData = colours.find(
    (colour) => colour.name === selectedColour
  );

  const stock = product ? getStock(product) : null;
  const stockIsKnown = stock !== null;
  const outOfStock = stockIsKnown && stock <= 0;
  const productName = product ? getProductName(product) : "";

  const toggleAccordion = (key) => {
    setOpenAccordion((current) => (current === key ? "" : key));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (sizes.length > 0 && !selectedSize) {
      setCartMessage("Please select your size before adding to your bag.");
      return;
    }

    if (colours.length > 0 && !selectedColour) {
      setCartMessage("Please select a colour before adding to your bag.");
      return;
    }

    if (outOfStock) {
      setCartMessage("This item is currently unavailable.");
      return;
    }

    if (stockIsKnown && quantity > stock) {
      setCartMessage(`Only ${stock} unit(s) are currently available.`);
      return;
    }

    setAddingToBag(true);
    setCartMessage("");

    try {
      /*
       * Pass the selected options with the product.
       * CartContext should preserve these options if it supports
       * size/colour-specific cart lines.
       */
      const cartProduct = {
        ...product,
        id: getProductId(product),
        name: productName,
        price: getProductPrice(product),
        selectedSize: selectedSize || null,
        selectedColour: selectedColour || null,
        quantity,
      };

      // Use the shared cart as the source of truth.
      // Do not call onAddToCart as well, because that can add twice.
      await addToCart(cartProduct);

      setCartMessage("Your selection has been added to your bag.");
    } catch (error) {
      setCartMessage(
        error?.message || "Unable to add this item. Please try again."
      );
    } finally {
      setAddingToBag(false);
    }
  };

  const toggleWishlist = () => {
    if (product) onToggleWishlist?.(product);
  };

  if (loading) {
    return (
      <main className="pd-page">
        <div className="pd-container">
          <div className="pd-empty-state" role="status">
            <p className="pd-eyebrow">Onishakara Gold</p>
            <h1>Opening the atelier...</h1>
            <p>Loading product details from the live catalogue.</p>
          </div>
        </div>
      </main>
    );
  }

  if (loadError || !product) {
    return (
      <main className="pd-page">
        <div className="pd-container">
          <nav className="pd-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/shop">Ready-to-Wear</Link>
            <span>/</span>
            <span>Product</span>
          </nav>

          <div className="pd-empty-state" role="alert">
            <p className="pd-eyebrow">Product catalogue</p>
            <h1>We couldn't open this piece.</h1>
            <p>{loadError || "This product is no longer available."}</p>

            <div className="pd-error-actions">
              <button
                type="button"
                onClick={() => setRetryKey((key) => key + 1)}
              >
                Try Again
              </button>

              <Link to="/shop">Return to Shop</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const productDescription =
    product.description ||
    "Discover this piece from the Onishakara Gold collection.";

  const price = getProductPrice(product);
  const currency = product.currency || "NGN";

  return (
    <div className="pd-page">
      <div className="pd-container">
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Ready-to-Wear</Link>
          <span>/</span>
          <span>{getProductCategory(product) || "Product"}</span>
        </nav>

        <div className="pd-layout">
          {/* Product gallery */}
          <section className="pd-gallery" aria-label="Product images">
            <div className="pd-main-image">
              {currentImage ? (
                <img
                  key={currentImage.src}
                  src={currentImage.src}
                  alt={currentImage.alt || productName}
                />
              ) : (
                <div className="pd-image-placeholder">
                  Product image coming soon
                </div>
              )}

              <span className="pd-image-label">
                {product.collection || "Atelier Collection"}
              </span>

              <span className="pd-zoom-label">
                <span aria-hidden="true">⌕</span> Editorial detail
              </span>
            </div>

            {images.length > 1 && (
              <div className="pd-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={`${image.src}-${index}`}
                    type="button"
                    className={`pd-thumbnail ${
                      activeImage === index ? "is-active" : ""
                    }`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`View ${image.label || `image ${index + 1}`}`}
                    aria-pressed={activeImage === index}
                  >
                    <img
                      src={image.src}
                      alt={image.alt || `${productName} ${index + 1}`}
                    />
                    <span>{image.label || `View ${index + 1}`}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="pd-model-card">
              <div className="pd-model-icon" aria-hidden="true">
                ↔
              </div>
              <div>
                <p className="pd-eyebrow">Model silhouette reference</p>
                <p className="pd-muted">
                  Consult our team for garment measurements and fit advice.
                </p>
              </div>
              <span className="pd-model-tag">Atelier Fit</span>
            </div>

            <section className="pd-heritage">
              <div className="pd-heritage-image">
                {images[2] && (
                  <img src={images[2].src} alt={images[2].alt} />
                )}
              </div>
              <div>
                <p className="pd-eyebrow">Craft heritage</p>
                <h2>Designed with a distinctive African perspective</h2>
                <p>
                  Explore the craftsmanship, textile choices and design
                  inspiration behind this piece. Contact our atelier for
                  confirmed details about materials and production.
                </p>
              </div>
            </section>
          </section>

          {/* Purchase panel */}
          <aside className="pd-purchase">
            <div className="pd-product-heading">
              <div className="pd-product-meta">
                <span className="pd-eyebrow">
                  {product.collection ||
                    getProductCategory(product) ||
                    "Atelier Collection"}
                </span>

                {product.sku && (
                  <span className="pd-sku">SKU: {product.sku}</span>
                )}
              </div>

              <h1>{productName}</h1>

              <p className="pd-price">{formatPrice(price, currency)}</p>

              <p className="pd-description">{productDescription}</p>
            </div>

            <div className="pd-stock">
              <span
                className={`pd-stock-dot ${outOfStock ? "is-out" : ""}`}
              />
              <span>
                {outOfStock
                  ? "Currently unavailable"
                  : stockIsKnown
                    ? `${stock} unit${stock === 1 ? "" : "s"} available`
                    : "Contact us to confirm availability"}
              </span>

              <span className="pd-stock-location">
                {product.stockLocation ||
                  "Availability subject to confirmation"}
              </span>
            </div>

            {/* Colour selection */}
            {colours.length > 0 && (
              <section className="pd-option-section">
                <div className="pd-option-heading">
                  <span className="pd-eyebrow">Colour selection</span>
                  <span className="pd-option-value">
                    {selectedColourData?.description || selectedColour}
                  </span>
                </div>

                <div className="pd-colours">
                  {colours.map((colour) => (
                    <button
                      key={colour.name}
                      type="button"
                      className={`pd-colour ${
                        selectedColour === colour.name ? "is-selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedColour(colour.name);
                        setCartMessage("");
                      }}
                      aria-pressed={selectedColour === colour.name}
                      title={colour.description || colour.name}
                    >
                      <span
                        className="pd-colour-swatch"
                        style={{ backgroundColor: colour.swatch || "#111" }}
                      />
                      <span>{colour.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Size selection */}
            {sizes.length > 0 && (
              <section className="pd-option-section">
                <div className="pd-option-heading">
                  <span className="pd-eyebrow">Select your size</span>

                  <button
                    type="button"
                    className="pd-text-button"
                    onClick={() => setSizeGuideOpen(true)}
                  >
                    Size guide ↗
                  </button>
                </div>

                <div className="pd-sizes">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`pd-size ${
                        selectedSize === size ? "is-selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedSize(size);
                        setCartMessage("");
                      }}
                      aria-pressed={selectedSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                <p className="pd-helper">
                  Not sure about your fit? Contact our team for sizing advice.
                </p>
              </section>
            )}

            {/* Quantity and Add to Bag */}
            <div className="pd-actions">
              <div className="pd-quantity" aria-label="Quantity selector">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.max(1, value - 1))
                  }
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <output aria-live="polite">{quantity}</output>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => {
                      const next = value + 1;
                      return stockIsKnown ? Math.min(stock, next) : next;
                    })
                  }
                  disabled={stockIsKnown && quantity >= stock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="pd-add-button"
                onClick={handleAddToCart}
                disabled={addingToBag || outOfStock}
              >
                {addingToBag
                  ? "Adding..."
                  : outOfStock
                    ? "Out of Stock"
                    : `Add to Bag — ${formatPrice(price * quantity, currency)}`}
              </button>
            </div>

            {cartMessage && (
              <p className="pd-feedback" role="status">
                {cartMessage}
              </p>
            )}

            <div className="pd-secondary-actions">
              <button
                type="button"
                className="pd-secondary-button"
                onClick={toggleWishlist}
              >
                <span aria-hidden="true">{isWishlisted ? "♥" : "♡"}</span>
                {isWishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
              </button>

              <a
                className="pd-secondary-button"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hello Onishakara Gold, I would like to enquire about ${productName}.`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Enquire on WhatsApp
              </a>
            </div>

            <div className="pd-payment-note">
              <p className="pd-eyebrow">Secure checkout</p>
              <p>
                Available payment methods and delivery options will be shown
                during checkout.
              </p>
            </div>

            {/* Product information accordions */}
            <div className="pd-accordions">
              {[
                {
                  id: "details",
                  title: "Product details",
                  body: productDescription,
                },
                {
                  id: "sizing",
                  title: "Fit & sizing advice",
                  body: "Choose your usual size as a starting point. For personalised measurements or alterations, contact our atelier before ordering.",
                },
                {
                  id: "delivery",
                  title: "Delivery & returns",
                  body: "Delivery timelines, shipping charges and return eligibility depend on your location and the store's current policies. Confirm these details at checkout or with our team.",
                },
              ].map((item) => (
                <section className="pd-accordion" key={item.id}>
                  <button
                    type="button"
                    className="pd-accordion-trigger"
                    onClick={() => toggleAccordion(item.id)}
                    aria-expanded={openAccordion === item.id}
                  >
                    <span>{item.title}</span>
                    <span aria-hidden="true">
                      {openAccordion === item.id ? "−" : "+"}
                    </span>
                  </button>

                  {openAccordion === item.id && (
                    <div className="pd-accordion-content">{item.body}</div>
                  )}
                </section>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {/* Editorial feature */}
      <section className="pd-editorial">
        <div className="pd-editorial-inner">
          <div>
            <p className="pd-eyebrow">The Onishakara perspective</p>
            <h2>Distinctive style. Thoughtful details.</h2>
            <p>
              Discover statement pieces designed to bring confidence,
              individuality and contemporary African elegance to your wardrobe.
            </p>
          </div>

          <div className="pd-editorial-stats">
            <div>
              <strong>01</strong>
              <span>Personal style</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Distinctive details</span>
            </div>
            <div>
              <strong>03</strong>
              <span>Made to stand out</span>
            </div>
          </div>
        </div>
      </section>

      {/* Size guide modal */}
      {sizeGuideOpen && (
        <div
          className="pd-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSizeGuideOpen(false);
            }
          }}
        >
          <section
            className="pd-size-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pd-size-guide-title"
          >
            <button
              type="button"
              className="pd-modal-close"
              onClick={() => setSizeGuideOpen(false)}
              aria-label="Close size guide"
            >
              ×
            </button>

            <p className="pd-eyebrow">Find your fit</p>
            <h2 id="pd-size-guide-title">Size guide</h2>

            <p>
              Size conversions can vary by garment. Contact our team for
              measurements specific to this item before placing your order.
            </p>

            <div className="pd-size-guide-list">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={selectedSize === size ? "is-selected" : ""}
                  onClick={() => {
                    setSelectedSize(size);
                    setSizeGuideOpen(false);
                  }}
                >
                  {size}
                  <span>
                    {selectedSize === size ? "Selected" : "Choose size"}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ProductDetailsPage;