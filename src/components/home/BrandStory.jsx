
import "./BrandStory.css";

export default function BrandStory() {
  return (
    <section className="brand-story" id="about-us">
      <div className="brand-story__image">
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85"
          alt="Editorial fashion portrait"
          loading="lazy"
        />

        <span className="brand-story__image-caption">
          THE ART OF PERSONAL STYLE
        </span>
      </div>

      <div className="brand-story__content">
        <p className="brand-story__eyebrow">
          THE ONISHAKARA PERSPECTIVE
        </p>

        <h2 className="brand-story__title">
          Style is personal.
          <br />
          <em>Presence is timeless.</em>
        </h2>

        <div className="brand-story__divider" />

        <p className="brand-story__paragraph">
          Fashion is more than what you wear. It is how you express yourself,
          how you enter a room, and how you choose to be remembered.
        </p>

        <p className="brand-story__paragraph">
          Onishakara brings together distinctive style and considered
          selections for those who value individuality, quality, and
          confidence in every detail.
        </p>

        <a className="brand-story__link" href="#collections">
          Discover Our World
          <span aria-hidden="true">↗</span>
        </a>

        <div className="brand-story__signature" aria-hidden="true">
          O.
        </div>
      </div>
    </section>
  );
}
