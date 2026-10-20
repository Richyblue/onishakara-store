
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
  } from "react";
  
  const WishlistContext = createContext(null);
  const STORAGE_KEY = "onishakara-wishlist";
  
  const getProductKey = (product) =>
    String(product?.id ?? product?._id ?? product?.sku ?? product?.name ?? "");
  
  export function WishlistProvider({ children }) {
    const [wishlist, setWishlist] = useState(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    });
  
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  
    useEffect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
      } catch (error) {
        console.warn("Could not save wishlist.", error);
      }
    }, [wishlist]);
  
    const addToWishlist = useCallback((product) => {
      if (!product) return;
  
      const key = getProductKey(product);
      if (!key) return;
  
      setWishlist((items) =>
        items.some((item) => getProductKey(item) === key)
          ? items
          : [...items, product]
      );
    }, []);
  
    const removeFromWishlist = useCallback((product) => {
      const key = getProductKey(product);
      setWishlist((items) =>
        items.filter((item) => getProductKey(item) !== key)
      );
    }, []);
  
    const toggleWishlist = useCallback((product) => {
      if (!product) return;
  
      const key = getProductKey(product);
      if (!key) return;
  
      setWishlist((items) =>
        items.some((item) => getProductKey(item) === key)
          ? items.filter((item) => getProductKey(item) !== key)
          : [...items, product]
      );
    }, []);
  
    const isWishlisted = useCallback(
      (product) =>
        wishlist.some(
          (item) => getProductKey(item) === getProductKey(product)
        ),
      [wishlist]
    );
  
    const openWishlist = useCallback(() => setIsWishlistOpen(true), []);
    const closeWishlist = useCallback(() => setIsWishlistOpen(false), []);
    const clearWishlist = useCallback(() => setWishlist([]), []);
  
    return (
      <WishlistContext.Provider
        value={{
          wishlist,
          wishlistCount: wishlist.length,
          isWishlistOpen,
          addToWishlist,
          removeFromWishlist,
          toggleWishlist,
          isWishlisted,
          openWishlist,
          closeWishlist,
          clearWishlist,
        }}
      >
        {children}
      </WishlistContext.Provider>
    );
  }
  
  export function useWishlist() {
    const context = useContext(WishlistContext);
  
    if (!context) {
      throw new Error("useWishlist must be used inside WishlistProvider.");
    }
  
    return context;
  }
  