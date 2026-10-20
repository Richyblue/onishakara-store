
import "./HeroSection.css";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB-sIGNsxME7fBSJR9j4EDA2Eq9Z7Uco_J8PdfRm7FmH-KgcM57gvU9TPXNVJPuxpyyehULEKy1oktxAtWqqDoHsg-GXUaGq7BtKhpvOUNjX1R8JR2_lQU3MYq1LtjrxZfNubniIrOgXnyckOU9gqgTrZhRSkDltFlhldYD8Qusmls6BLq3lJRnjmT-PntG2vizWw9vvq2cL3DD0xc1zTCQlpSF1n1d98l0Le-7uX3AIH3Xhk3TcBQ";

export default function HeroSection() {
  return (
    <section className="hero-campaign" id="home">
      <div
        className="hero-campaign__background"
        style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        role="img"
        aria-label="Luxury African fashion campaign featuring an indigo and gold brocade gown"
      />

      <div className="hero-campaign__overlay hero-campaign__overlay--bottom" />
      <div className="hero-campaign__overlay hero-campaign__overlay--side" />

      <div className="hero-campaign__content">
        <div className="hero-campaign__eyebrow">
          <span className="hero-campaign__eyebrow-line" />
          <span>AUTUMN / WINTER 2025 ATELIER</span>
        </div>

        <h1 className="hero-campaign__title">
          The Sovereign
          <br />
          <span>Silhouette</span>
        </h1>

        <p className="hero-campaign__description">
          Sculpted tailoring and gilded hand-embellished velvet,
          inspired by timeless Lagosian royalty. Handcrafted in
          our Victoria Island private salon.
        </p>

        <div className="hero-campaign__actions">
          <a
            href="#collections"
            className="hero-campaign__button hero-campaign__button--primary"
          >
            <span>SHOP THE COLLECTION</span>
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </a>

          <a
            href="#new-arrivals"
            className="hero-campaign__button hero-campaign__button--secondary"
          >
            <span>EXPLORE NEW ARRIVALS</span>
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              north_east
            </span>
          </a>
        </div>
      </div>

      <div className="hero-campaign__edition">
        <span>EDITION NO. 04</span>
        <span>VICTORIA ISLAND · NIGERIA</span>
        <span>POS SALON LIVE SYNC</span>
      </div>

      <div className="hero-campaign__scroll">
        <span />
        <span>THE ONISHAKARA EDIT</span>
      </div>
    </section>
  );
}
