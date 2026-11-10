
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import NewlyArrived from "./pages/NewlyArrived";
import { Seo, getProductUrl } from "./utils/seo";
import { Link } from "react-router-dom";

// Shared store layout
function StoreLayout() {
  const location = useLocation();
  const navigate = useNavigate();

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
        onSelectProduct={(product) => navigate(getProductUrl(product))}
      />

      <main className="store-main">
        <Routes>
          <Route path="/" element={<><Seo title="Onishakara | Contemporary Nigerian Fashion & Ready-to-Wear" description="Discover contemporary Nigerian fashion, ready-to-wear, statement pieces and new arrivals at Onishakara." /><HomePage /></>} />
          <Route path="/shop" element={<><Seo title="Shop All | Onishakara" description="Explore Onishakara's ready-to-wear fashion, contemporary Nigerian designs and curated collections." /><ShopPage /></>} />

          {/* Add more store pages here */}
          {/* <Route path="/about" element={<AboutPage />} /> */}
          {/* <Route path="/contact" element={<ContactPage />} /> */}

          <Route path="/products/:productSlug" element={<ProductDetailsPage />} />
          <Route path="/product/:productId" element={<ProductDetailsPage />} />
          <Route path="/new-arrivals" element={<><Seo title="New Arrivals | Onishakara" description="Explore the latest fashion arrivals and new pieces from Onishakara." /><NewlyArrived /></>} />
          <Route path="/checkout" element={<><Seo title="Checkout | Onishakara" noindex /><CheckoutPage /></>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found | Onishakara" noindex />
      <section style={{ minHeight: "50vh", display: "grid", placeContent: "center", textAlign: "center", padding: "48px 20px" }}>
        <p>ONISHAKARA</p>
        <h1>Page not found</h1>
        <p>The page may have moved or is no longer available.</p>
        <Link to="/">Return to the homepage</Link>
      </section>
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
