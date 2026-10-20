
import { useState } from "react";
import "./CuratedCollections.css";

const defaultCollections = [
  {
    id: "signature",
    label: "Signature Edit",
    eyebrow: "THE HOUSE SELECTION",
    title: "Pieces That Make a Statement",
    description:
      "Discover distinctive pieces selected for a wardrobe that expresses individuality and confidence.",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Curated contemporary fashion collection",
    link: "#shop-all",
    linkLabel: "Explore the Edit",
  },
  {
    id: "occasion",
    label: "Occasion Wear",
    eyebrow: "DRESSED FOR THE MOMENT",
    title: "Make Every Entrance Count",
    description:
      "Explore considered looks for celebrations, special occasions, and memorable evenings.",
    image:
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Elegant occasion fashion",
    link: "#shop-all",
    linkLabel: "Discover Occasion Wear",
  },
  {
    id: "essentials",
    label: "Modern Essentials",
    eyebrow: "EVERYDAY DISTINCTION",
    title: "Refined by Simplicity",
    description:
      "Build your personal style around versatile pieces with a clean, considered aesthetic.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Modern wardrobe styling",
    link: "#shop-all",
    linkLabel: "Explore Essentials",
  },
];

export default function CuratedCollections({
  collections = defaultCollections,
  onExploreCollection,
}) {
  const [activeId, setActiveId] = useState(
    collections[0]?.id ?? ""
  );

  const activeCollection =
    collections.find((collection) => collection.id === activeId) ??
    collections[0];

  if (!activeCollection) return null;

  return (
    <section className="curated-collections" id="collections">
      <div className="curated-collections__inner">
        <header className="curated-collections__heading">
          <p className="curated-collections__eyebrow">
            A STUDY IN PERSONAL STYLE
          </p>

          <h2 className="curated-collections__title">
            Curated <em>Collections</em>
          </h2>

          <p className="curated-collections__intro">
            Explore the Onishakara world, one considered collection at a time.
          </p>
        </header>

        <div
          className="curated-collections__tabs"
          role="tablist"
          aria-label="Fashion collections"
        >
          {collections.map((collection) => (
            <button
              key={collection.id}
              id={`collection-tab-${collection.id}`}
              type="button"
              role="tab"
              aria-selected={activeCollection.id === collection.id}
              aria-controls="collection-panel"
              className={`curated-collections__tab ${
                activeCollection.id === collection.id ? "is-active" : ""
              }`}
              onClick={() => setActiveId(collection.id)}
            >
              {collection.label}
            </button>
          ))}
        </div>

        <div
          className="curated-collections__panel"
          id="collection-panel"
          role="tabpanel"
          aria-labelledby={`collection-tab-${activeCollection.id}`}
        >
          <div className="curated-collections__image-wrap">
            <img
              key={activeCollection.image}
              className="curated-collections__image"
              src={activeCollection.image}
              alt={activeCollection.imageAlt || activeCollection.title}
              loading="lazy"
            />

            <span className="curated-collections__image-label">
              ONISHAKARA / COLLECTION
            </span>
          </div>

          <div className="curated-collections__content">
            <p className="curated-collections__content-eyebrow">
              {activeCollection.eyebrow}
            </p>

            <h3 className="curated-collections__feature-title">
              {activeCollection.title}
            </h3>

            <div className="curated-collections__rule" />

            <p className="curated-collections__description">
              {activeCollection.description}
            </p>

            <a
              className="curated-collections__link"
              href={activeCollection.link || "#shop-all"}
              onClick={(event) => {
                if (onExploreCollection) {
                  event.preventDefault();
                  onExploreCollection(activeCollection);
                }
              }}
            >
              {activeCollection.linkLabel || "Explore Collection"}
              <span aria-hidden="true">↗</span>
            </a>

            <span className="curated-collections__watermark" aria-hidden="true">
              O.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
