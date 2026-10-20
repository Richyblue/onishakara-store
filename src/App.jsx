
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import NewlyArrived from "./pages/NewlyArrived";

// Shared store layout
function StoreLayout() {
  const location = useLocation();

  const activePath =
    location.pathname === "/"
      ? "home"
      : location.pathname.startsWith("/shop")
        ? "shop"
        : location.pathname.slice(1).split("/")[0];

  return (
    <>
      <Header
        cartCount={0}
        wishlistCount={0}
        activePath={activePath}
        onSearch={() => {
          // Connect your product search here
          console.log("Open product search");
        }}
        onWishlist={() => {
          // Connect your wishlist page or drawer here
          console.log("Open wishlist");
        }}
        onCart={() => {
          // Connect your shopping bag here
          console.log("Open shopping bag");
        }}
        onAccount={() => {
          // Connect your account page here
          console.log("Open client account");
        }}
        onMenuToggle={() => {
          // Connect your mobile navigation here
          console.log("Toggle mobile navigation");
        }}
      />

      <main className="store-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />

          {/* Add more store pages here */}
          {/* <Route path="/about" element={<AboutPage />} /> */}
          {/* <Route path="/contact" element={<ContactPage />} /> */}

          {/* Unknown routes return to the homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/product/:productId" element={<ProductDetailsPage />} />
          <Route path="/new-arrivals" element={<NewlyArrived />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <StoreLayout />
    </BrowserRouter>
  );
}

export default App;
