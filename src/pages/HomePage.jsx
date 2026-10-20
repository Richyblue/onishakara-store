
import HeroSection from "../components/home/HeroSection";
import TrustStrip from "../components/home/TrustStrip";
import HauteDepartment from "../components/home/HauteDepartment";
import NewArrivals from "../components/home/NewArrivals";
import BrandStory from "../components/home/BrandStory";
import CuratedCollections from "../components/home/CuratedCollections";
import FeaturedProducts from "../components/home/FeaturedProducts";

export default function HomePage(props) {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <HauteDepartment />

      <NewArrivals
        products={props.products}
        onAddToCart={props.onAddToCart}
        onToggleWishlist={props.onToggleWishlist}
        wishlistIds={props.wishlistIds}
      />



      {/* <BrandStory /> */}
      <CuratedCollections />
      <FeaturedProducts
  title="Shop Our Collection"
  subtitle="Explore our latest styles and everyday essentials."
/>
    </>
  );
}
