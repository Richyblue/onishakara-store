import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { startPaystackCheckout } from "../services/storeApi";
import "./CheckoutPage.css";

// ============================================================
// API AND IMAGE CONFIGURATION
// ============================================================

// Backend origin used for uploaded product images.
const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  "https://api-onishakara.princesssalon.xyz"
).replace(/\/+$/, "");

// API endpoint used for checkout requests.
const API_ENDPOINT = (
  import.meta.env.VITE_API_BASE_URL ||
  `${API_BASE_URL}/api/v1`
).replace(/\/+$/, "");

// Replace with your real WhatsApp number, including country code.
// Nigerian example: 2348012345678
const STORE_WHATSAPP = "2348152470890";

const CHECKOUT_DETAILS_KEY = "onishakara_checkout_details";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  deliveryNote: "",
};

// ============================================================
// IMAGE URL HELPERS
// ============================================================

function resolveImageUrl(image) {
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

  // Product images saved by the backend.
  if (
    value.startsWith("/uploads/") ||
    value.startsWith("uploads/")
  ) {
    return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
  }

  // Preserve frontend public assets.
  if (value.startsWith("/")) {
    return value;
  }

  return `${API_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

function getFirstProductImage(product, variant) {
  // A variant-specific image takes priority.
  const variantImage =
    variant?.imageUrl ??
    variant?.image_url ??
    variant?.image;

  const resolvedVariantImage = resolveImageUrl(
    typeof variantImage === "object"
      ? variantImage?.url ?? variantImage?.src
      : variantImage
  );

  if (resolvedVariantImage) {
    return resolvedVariantImage;
  }

  // Support JSON arrays and serialized JSON image data.
  let images = product?.images;

  if (typeof images === "string") {
    try {
      images = JSON.parse(images);
    } catch {
      images = [images];
    }
  }

  if (Array.isArray(images)) {
    for (const image of images) {
      const rawImage =
        typeof image === "string"
          ? image
          : image?.url ??
            image?.src ??
            image?.imageUrl ??
            image?.image_url ??
            image?.path;

      const resolved = resolveImageUrl(rawImage);

      if (resolved) {
        return resolved;
      }
    }
  }

  // Legacy single-image fields.
  const directImage =
    product?.imageUrl ??
    product?.image_url ??
    product?.image ??
    product?.thumbnail;

  return (
    resolveImageUrl(
      typeof directImage === "object"
        ? directImage?.url ?? directImage?.src
        : directImage
    ) || "/images/product-placeholder.png"
  );
}

// ============================================================
// PRICE FORMATTER
// ============================================================

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

// ============================================================
// SAVED CHECKOUT DETAILS
// ============================================================

function loadSavedDetails() {
  try {
    const saved = localStorage.getItem(CHECKOUT_DETAILS_KEY);

    if (!saved) return { ...initialForm };

    const parsed = JSON.parse(saved);

    return {
      ...initialForm,
      ...Object.fromEntries(
        Object.keys(initialForm).map((key) => [
          key,
          typeof parsed[key] === "string" ? parsed[key] : "",
        ])
      ),
    };
  } catch {
    return { ...initialForm };
  }
}

// ============================================================
// NORMALIZE CART ITEMS
// ============================================================

function getItem(item) {
  const product = item?.product || item || {};
  const variant = item?.variant || null;

  const rawPrice =
    variant?.sellingPrice ??
    variant?.selling_price ??
    item?.price ??
    item?.sellingPrice ??
    item?.selling_price ??
    product?.sellingPrice ??
    product?.selling_price ??
    product?.price ??
    0;

  const rawProductId =
    item?.productId ??
    product?.id ??
    product?._id;

  const rawVariantId =
    item?.variantId ??
    variant?.id ??
    variant?._id ??
    null;

  const numericProductId =
    rawProductId != null && rawProductId !== ""
      ? Number(rawProductId)
      : NaN;

  const numericVariantId =
    rawVariantId != null && rawVariantId !== ""
      ? Number(rawVariantId)
      : null;

  return {
    product,
    variant,

    name:
      product?.name ||
      product?.productName ||
      product?.product_name ||
      "Fashion item",

    image: getFirstProductImage(product, variant),

    quantity: Math.max(
      1,
      Number(item?.cartQuantity ?? item?.quantity) || 1
    ),

    unitPrice: Number(rawPrice) || 0,

    productId: numericProductId,

    variantId:
      numericVariantId != null &&
      Number.isFinite(numericVariantId)
        ? numericVariantId
        : null,

    size:
      item?.selectedSize ??
      variant?.size ??
      item?.size ??
      "",

    color:
      item?.selectedColour ??
      item?.selectedColor ??
      variant?.color ??
      item?.color ??
      "",

    category:
      product?.Category?.name ||
      product?.category?.name ||
      (typeof product?.category === "string"
        ? product.category
        : "") ||
      product?.categoryName ||
      "",
  };
}

// ============================================================
// CHECKOUT API
// ============================================================

async function postOrder(path, body) {
  const response = await fetch(`${API_ENDPOINT}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(
      data.message ||
        "Unable to place your order. Please try again."
    );
  }

  return data;
}

// ============================================================
// CHECKOUT PAGE
// ============================================================

export default function CheckoutPage({
  cartItems: passedCartItems,
  onOrderComplete,
  onBackToBag,
}) {
  const { cartItems: contextCartItems } = useCart();

  const sourceCartItems = Array.isArray(passedCartItems)
    ? passedCartItems
    : contextCartItems;

  const [form, setForm] = useState(loadSavedDetails);
  const [paymentMethod, setPaymentMethod] = useState("whatsapp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [orderResult, setOrderResult] = useState(null);

  // Save customer details automatically.
  useEffect(() => {
    try {
      localStorage.setItem(
        CHECKOUT_DETAILS_KEY,
        JSON.stringify(form)
      );
    } catch (storageError) {
      console.warn(
        "Unable to save checkout details:",
        storageError
      );
    }
  }, [form]);

  const items = useMemo(
    () =>
      (
        Array.isArray(sourceCartItems)
          ? sourceCartItems
          : []
      ).map(getItem),
    [sourceCartItems]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + item.unitPrice * item.quantity,
        0
      ),
    [items]
  );

  // Estimate only. The backend must calculate the final delivery fee.
  const deliveryFeeEstimate = 0;
  const total = subtotal + deliveryFeeEstimate;

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function clearSavedDetails() {
    try {
      localStorage.removeItem(CHECKOUT_DETAILS_KEY);
    } catch (storageError) {
      console.warn(
        "Unable to clear saved details:",
        storageError
      );
    }

    setForm({ ...initialForm });
  }

  function validate() {
    if (!items.length) {
      return "Your shopping bag is empty.";
    }

    if (!form.name.trim()) {
      return "Please enter your full name.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (form.phone.trim().replace(/\D/g, "").length < 10) {
      return "Please enter a valid phone number.";
    }

    if (!form.address.trim()) {
      return "Please enter your delivery address.";
    }

    if (!form.city.trim()) {
      return "Please enter your city.";
    }

    if (!form.state.trim()) {
      return "Please enter your state.";
    }

    if (
      items.some(
        (item) =>
          !Number.isSafeInteger(item.productId) ||
          item.productId <= 0 ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1 ||
          !Number.isFinite(item.unitPrice) ||
          item.unitPrice < 0 ||
          (item.variantId != null &&
            (!Number.isSafeInteger(item.variantId) ||
              item.variantId <= 0))
      )
    ) {
      return (
        "A product in your bag has invalid information. " +
        "Please remove it and add it again."
      );
    }

    if (
      paymentMethod === "whatsapp" &&
      !/^\d{10,15}$/.test(STORE_WHATSAPP)
    ) {
      return (
        "The store WhatsApp number has not been configured. " +
        "Please contact the store administrator."
      );
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setNotice("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const customer = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      deliveryNote: form.deliveryNote.trim(),
    };

    const orderItems = items.map((item) => ({
      productId: item.productId,
      ...(item.variantId != null
        ? { variantId: item.variantId }
        : {}),
      quantity: item.quantity,
    }));

    try {
      if (paymentMethod === "paystack") {
        // This service should redirect to Paystack or return a payment URL.
        await startPaystackCheckout({
          customer,
          items: orderItems,
        });

        return;
      }

      if (paymentMethod === "delivery") {
        const result = await postOrder(
          "/store/checkout/pay-on-delivery",
          {
            customer,
            items: orderItems,
          }
        );

        setOrderResult(result);

        setNotice(
          `Your order ${
            result.orderNumber ||
            result.order?.orderNumber ||
            result.order?.id ||
            ""
          } has been submitted. We will contact you to confirm delivery.`
        );

        onOrderComplete?.(result);
        return;
      }

      if (paymentMethod === "whatsapp") {
        const result = await postOrder(
          "/store/checkout/whatsapp",
          {
            customer,
            items: orderItems,
          }
        );

        const orderNumber =
          result.orderNumber ||
          result.order?.orderNumber ||
          result.order?.id ||
          "";

        const orderLines = items.map((item, index) => {
          const options = [
            item.size ? `Size: ${item.size}` : "",
            item.color ? `Colour: ${item.color}` : "",
          ]
            .filter(Boolean)
            .join(" | ");

          return [
            `${index + 1}. ${item.name}`,
            options,
            `Quantity: ${item.quantity}`,
          ]
            .filter(Boolean)
            .join("\n");
        });

        const message = [
          "Hello Onishakara Gold Fashion Store!",
          "I would like to confirm my order.",
          orderNumber
            ? `Order reference: ${orderNumber}`
            : "",
          "",
          ...orderLines,
          "",
          `Customer: ${customer.name}`,
          `Phone: ${customer.phone}`,
          `Email: ${customer.email}`,
          `Address: ${customer.address}, ${customer.city}, ${customer.state}`,
          customer.deliveryNote
            ? `Delivery note: ${customer.deliveryNote}`
            : "",
          "",
          `Estimated subtotal: ${money(subtotal)}`,
          "Please confirm availability, final price and delivery fee.",
        ]
          .filter(Boolean)
          .join("\n");

        setOrderResult(result);

        // Open WhatsApp after the backend has accepted the order.
        window.location.assign(
          `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(
            message
          )}`
        );
      }
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Empty bag.
  if (!items.length) {
    return (
      <main className="checkout-page">
        <div className="checkout-empty">
          <span className="checkout-kicker">
            ONISHAKARA GOLD
          </span>

          <h1>Your bag is waiting.</h1>

          <p>
            Discover our collection and add your favourite pieces
            before proceeding to checkout.
          </p>

          <Link
            to="/shop"
            className="checkout-primary-link"
          >
            Explore the collection
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <div className="checkout-heading">
          <span className="checkout-kicker">
            ONISHAKARA GOLD · ATELIER
          </span>

          <h1>Complete your order</h1>

          <p>
            Thoughtfully selected pieces, delivered with care.
          </p>

          <div className="checkout-steps">
            <span className="is-current">01 Your details</span>
            <span>02 Delivery &amp; payment</span>
            <span>03 Confirmation</span>
          </div>
        </div>

        {orderResult && notice ? (
          <section
            className="checkout-success"
            role="status"
          >
            <span className="checkout-success-icon">✓</span>

            <h2>
              Thank you, {form.name.trim().split(" ")[0]}.
            </h2>

            <p>{notice}</p>

            <p>
              Order reference:{" "}
              <strong>
                {orderResult.orderNumber ||
                  orderResult.order?.orderNumber ||
                  orderResult.order?.id ||
                  "Submitted"}
              </strong>
            </p>

            <Link
              to="/shop"
              className="checkout-primary-link"
            >
              Continue shopping
            </Link>
          </section>
        ) : (
          <form
            className="checkout-layout"
            onSubmit={handleSubmit}
          >
            <div className="checkout-form-column">
              {/* Customer details */}
              <section className="checkout-card">
                <div className="checkout-section-title">
                  <span className="checkout-number">01</span>

                  <div>
                    <h2>Your details</h2>
                    <p>
                      No account needed. Your details will be
                      remembered on this device.
                    </p>
                  </div>
                </div>

                <div className="checkout-fields">
                  <label className="checkout-field">
                    Full name <span>*</span>

                    <input
                      name="name"
                      autoComplete="name"
                      value={form.name}
                      onChange={updateField}
                      placeholder="Enter your full name"
                      maxLength={150}
                      required
                    />
                  </label>

                  <label className="checkout-field">
                    Email address <span>*</span>

                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={updateField}
                      placeholder="you@example.com"
                      maxLength={190}
                      required
                    />
                  </label>

                  <label className="checkout-field">
                    Phone number <span>*</span>

                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={updateField}
                      placeholder="Your active phone number"
                      maxLength={30}
                      required
                    />

                    <small>
                      We use this to confirm delivery.
                    </small>
                  </label>
                </div>
              </section>

              {/* Delivery details */}
              <section className="checkout-card">
                <div className="checkout-section-title">
                  <span className="checkout-number">02</span>

                  <div>
                    <h2>Delivery details</h2>
                    <p>
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>

                <div className="checkout-fields">
                  <label className="checkout-field checkout-field-full">
                    Street address <span>*</span>

                    <input
                      name="address"
                      autoComplete="street-address"
                      value={form.address}
                      onChange={updateField}
                      placeholder="House number, street and area"
                      maxLength={2000}
                      required
                    />
                  </label>

                  <label className="checkout-field">
                    City <span>*</span>

                    <input
                      name="city"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={updateField}
                      placeholder="City"
                      maxLength={100}
                      required
                    />
                  </label>

                  <label className="checkout-field">
                    State <span>*</span>

                    <input
                      name="state"
                      autoComplete="address-level1"
                      value={form.state}
                      onChange={updateField}
                      placeholder="State"
                      maxLength={100}
                      required
                    />
                  </label>

                  <label className="checkout-field checkout-field-full">
                    Delivery instructions{" "}
                    <small>(optional)</small>

                    <textarea
                      name="deliveryNote"
                      value={form.deliveryNote}
                      onChange={updateField}
                      placeholder="Landmarks, preferred delivery time or other helpful details"
                      rows={3}
                      maxLength={2000}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="checkout-back-button"
                  onClick={clearSavedDetails}
                >
                  Clear saved delivery details
                </button>
              </section>

              {/* Payment / ordering method */}
              <section className="checkout-card">
                <div className="checkout-section-title">
                  <span className="checkout-number">03</span>

                  <div>
                    <h2>Choose how to order</h2>
                    <p>
                      Select the option that is most convenient for you.
                    </p>
                  </div>
                </div>

                <div className="checkout-payment-options">
                  <label
                    className={`checkout-payment-option ${
                      paymentMethod === "whatsapp"
                        ? "is-selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="whatsapp"
                      checked={paymentMethod === "whatsapp"}
                      onChange={() =>
                        setPaymentMethod("whatsapp")
                      }
                    />

                    <span className="checkout-payment-icon">
                      W
                    </span>

                    <span className="checkout-payment-copy">
                      <strong>Order via WhatsApp</strong>
                      <small>
                        Speak with our team to confirm your order
                        and delivery.
                      </small>
                      <em>Recommended</em>
                    </span>
                  </label>

                  <label
                    className={`checkout-payment-option ${
                      paymentMethod === "delivery"
                        ? "is-selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="delivery"
                      checked={paymentMethod === "delivery"}
                      onChange={() =>
                        setPaymentMethod("delivery")
                      }
                    />

                    <span className="checkout-payment-icon">
                      ₦
                    </span>

                    <span className="checkout-payment-copy">
                      <strong>Pay on Delivery</strong>
                      <small>
                        Pay when your order arrives, subject to
                        confirmation.
                      </small>
                      <em>No online payment required</em>
                    </span>
                  </label>

                  <label
                    className={`checkout-payment-option ${
                      paymentMethod === "paystack"
                        ? "is-selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      checked={paymentMethod === "paystack"}
                      onChange={() =>
                        setPaymentMethod("paystack")
                      }
                    />

                    <span className="checkout-payment-icon">
                      ↗
                    </span>

                    <span className="checkout-payment-copy">
                      <strong>Pay securely online</strong>
                      <small>
                        Complete your payment through Paystack.
                      </small>
                      <em>Online payment</em>
                    </span>
                  </label>
                </div>

                {paymentMethod === "delivery" && (
                  <p className="checkout-inline-note">
                    Our team may contact you to confirm availability,
                    delivery charges and your preferred delivery time.
                  </p>
                )}

                {paymentMethod === "whatsapp" && (
                  <p className="checkout-inline-note">
                    We will submit your order and open WhatsApp so you
                    can confirm it with our team.
                  </p>
                )}
              </section>

              {error && (
                <div
                  className="checkout-error"
                  role="alert"
                >
                  <strong>
                    We couldn't complete that request.
                  </strong>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="checkout-submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : paymentMethod === "whatsapp"
                    ? "Continue to WhatsApp"
                    : paymentMethod === "delivery"
                      ? "Place order · Pay on Delivery"
                      : "Continue to secure payment"}

                {!loading && (
                  <span aria-hidden="true"> →</span>
                )}
              </button>

              <p className="checkout-privacy-note">
                Your details are saved in this browser to make future
                checkouts easier. Do not use this feature on a shared device.
              </p>
            </div>

            {/* Order summary */}
            <aside className="checkout-summary">
              <div className="checkout-summary-header">
                <span className="checkout-kicker">
                  YOUR SELECTION
                </span>

                <h2>
                  Order summary <span>({items.length})</span>
                </h2>
              </div>

              <div className="checkout-summary-items">
                {items.map((item, index) => (
                  <div
                    className="checkout-summary-item"
                    key={`${item.productId}-${item.variantId ?? "base"}-${index}`}
                  >
                    <div className="checkout-item-image">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        onError={(event) => {
                          const img = event.currentTarget;

                          if (
                            img.dataset.fallbackApplied === "true"
                          ) {
                            return;
                          }

                          img.dataset.fallbackApplied = "true";
                          img.src =
                            "/images/product-placeholder.png";
                        }}
                      />

                      <span className="checkout-item-quantity">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="checkout-item-details">
                      <strong>{item.name}</strong>

                      {item.category && (
                        <small>{item.category}</small>
                      )}

                      {item.size && (
                        <small>Size: {item.size}</small>
                      )}

                      {item.color && (
                        <small>Colour: {item.color}</small>
                      )}

                      <span>
                        {money(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-calculation">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>

                <div>
                  <span>Delivery</span>
                  <strong>To be confirmed</strong>
                </div>

                <div className="checkout-summary-total">
                  <span>Estimated total</span>
                  <strong>{money(total)}</strong>
                </div>
              </div>

              <p className="checkout-summary-disclaimer">
                The server must confirm current prices, availability and
                delivery charges before accepting your order. The final
                total may differ from this estimate.
              </p>

              {onBackToBag && (
                <button
                  type="button"
                  className="checkout-back-button"
                  onClick={onBackToBag}
                >
                  ← Return to shopping bag
                </button>
              )}
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}