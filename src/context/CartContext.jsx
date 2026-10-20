
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
  } from "react";
  
  const CartContext = createContext(null);
  const STORAGE_KEY = "onishakara-shopping-cart";
  
  function getProductPrice(product) {
    return Number(
      product.price ?? product.sellingPrice ?? product.selling_price ?? 0
    );
  }
  
  function getProductKey(product) {
    return String(product.id ?? product._id ?? product.sku ?? product.name);
  }
  
  export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    });
  
    const [isCartOpen, setIsCartOpen] = useState(false);
  
    useEffect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.warn("Could not save the shopping cart.", error);
      }
    }, [cartItems]);
  
    const addToCart = useCallback((product) => {
      if (!product) return;
  
      const stock = Number(product.stock ?? product.quantity);
      const hasStockValue =
        product.stock != null || product.quantity != null;
  
      if (
        product.stockStatus === "out-of-stock" ||
        (hasStockValue && stock <= 0)
      ) {
        return;
      }
  
      const key = getProductKey(product);
      const price = getProductPrice(product);
  
      setCartItems((currentItems) => {
        const existing = currentItems.find(
          (item) => getProductKey(item) === key
        );
  
        if (existing) {
          const currentQuantity = Number(existing.cartQuantity) || 1;
  
          if (hasStockValue && currentQuantity >= stock) {
            return currentItems;
          }
  
          return currentItems.map((item) =>
            getProductKey(item) === key
              ? { ...item, cartQuantity: currentQuantity + 1 }
              : item
          );
        }
  
        return [
          ...currentItems,
          {
            ...product,
            price,
            cartQuantity: 1,
          },
        ];
      });
  
      // Open the drawer immediately after clicking Add to Bag.
      setIsCartOpen(true);
    }, []);
  
    const removeFromCart = useCallback((product) => {
      const key = getProductKey(product);
      setCartItems((items) =>
        items.filter((item) => getProductKey(item) !== key)
      );
    }, []);
  
    const updateCartQuantity = useCallback((product, quantity) => {
      const key = getProductKey(product);
      const nextQuantity = Math.floor(Number(quantity));
  
      if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
        return;
      }
  
      setCartItems((items) =>
        items.map((item) => {
          if (getProductKey(item) !== key) return item;
  
          const stockValue = Number(item.stock ?? item.quantity);
          const hasStock =
            item.stock != null || item.quantity != null;
  
          return {
            ...item,
            cartQuantity: hasStock
              ? Math.min(nextQuantity, stockValue)
              : nextQuantity,
          };
        })
      );
    }, []);
  
    const clearCart = useCallback(() => {
      setCartItems([]);
    }, []);
  
    const openCart = useCallback(() => setIsCartOpen(true), []);
    const closeCart = useCallback(() => setIsCartOpen(false), []);
  
    const cartCount = cartItems.reduce(
      (total, item) => total + (Number(item.cartQuantity) || 0),
      0
    );
  
    const cartSubtotal = cartItems.reduce(
      (total, item) =>
        total +
        getProductPrice(item) * (Number(item.cartQuantity) || 0),
      0
    );
  
    const value = {
      cartItems,
      cartCount,
      cartSubtotal,
      isCartOpen,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      openCart,
      closeCart,
    };
  
    return (
      <CartContext.Provider value={value}>
        {children}
      </CartContext.Provider>
    );
  }
  
  export function useCart() {
    const context = useContext(CartContext);
  
    if (!context) {
      throw new Error("useCart must be used inside CartProvider.");
    }
  
    return context;
  }
  