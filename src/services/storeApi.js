
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "/api/v1"
  ).replace(/\/+$/, "");
  
  async function apiRequest(path, options = {}) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
    const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  
    const data = await response.json().catch(() => ({}));
  
    if (!response.ok || data.success === false) {
      throw new Error(
        data.message || `Store request failed (${response.status})`
      );
    }
  
    return data;
  }
  
  export async function getStoreProducts({ search = "" } = {}) {
    const params = new URLSearchParams();
  
    if (search.trim()) {
      params.set("search", search.trim());
    }
  
    const query = params.toString();
  
    const data = await apiRequest(
      `/store/products${query ? `?${query}` : ""}`
    );
  
    // Support common Express response structures.
    const products =
      Array.isArray(data) ? data :
      Array.isArray(data.products) ? data.products :
      Array.isArray(data.data) ? data.data :
      Array.isArray(data.data?.products) ? data.data.products :
      null;
  
    if (!products) {
      throw new Error(
        "The store API returned an unexpected product catalogue response."
      );
    }
  
    return products;
  }



  export async function getStoreCategories() {
    const data = await apiRequest("/store/categories");
  
    const categories =
      Array.isArray(data.categories) ? data.categories :
      Array.isArray(data.data?.categories) ? data.data.categories :
      Array.isArray(data.data) ? data.data :
      null;
  
    if (!categories) {
      throw new Error(
        "Invalid category response from the storefront API."
      );
    }
  
    // The public backend endpoint already returns active categories.
    // Do not filter on status because it may not be included in the response.
    return categories;
  }
  
  
  
  export async function startPaystackCheckout({ customer, items }) {
    const data = await apiRequest("/store/checkout/paystack", {
      method: "POST",
      body: JSON.stringify({ customer, items }),
    });
  
    if (!data.authorizationUrl) {
      throw new Error("The payment gateway did not return a checkout URL.");
    }
  
    window.location.assign(data.authorizationUrl);
  }
  
  export default apiRequest;
  