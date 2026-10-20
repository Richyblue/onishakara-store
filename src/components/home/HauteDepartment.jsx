
import "./HauteDepartment.css";

const departments = [
  {
    id: "ready-to-wear",
    number: "01",
    title: "Ready-to-Wear",
    subtitle: "THE MODERN WARDROBE",
    description:
      "Considered silhouettes for the moments that define you.",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Contemporary luxury fashion editorial",
    href: "#shop-all",
  },
  {
    id: "haute-couture",
    number: "02",
    title: "Haute Couture",
    subtitle: "ARTISTRY IN EVERY STITCH",
    description:
      "Exceptional craftsmanship, expressive forms and enduring elegance.",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Elegant couture-inspired eveningwear",
    href: "#collections",
  },
  {
    id: "leather-goods",
    number: "03",
    title: "Leather Goods",
    subtitle: "OBJECTS OF DISTINCTION",
    description:
      "Elevated finishing touches, selected for a life well considered.",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Designer leather handbag",
    href: "#shop-all",
  },
  {
    id: "fine-jewellery",
    number: "04",
    title: "Fine Jewellery",
    subtitle: "THE ART OF ADORNMENT",
    description:
      "Distinctive accents that make a statement without saying a word.",
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Gold jewellery detail",
    href: "#shop-all",
  },
];

function DepartmentCard({ department }) {
  return (
    <article className="department-card">
      <a
        className="department-card__link"
        href={department.href}
        aria-label={`Explore ${department.title}`}
      >
        <div className="department-card__image-wrap">
          <img
            className="department-card__image"
            src={department.image}
            alt={department.imageAlt}
            loading="lazy"
          />

          <span className="department-card__number">
            {department.number}
          </span>

          <span
            className="department-card__image-arrow material-symbols-outlined"
            aria-hidden="true"
          >
            north_east
          </span>
        </div>

        <div className="department-card__content">
          <span className="department-card__subtitle">
            {department.subtitle}
          </span>

          <div className="department-card__heading-row">
            <h3 className="department-card__title">
              {department.title}
            </h3>

            <span
              className="material-symbols-outlined department-card__arrow"
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </div>

          <p className="department-card__description">
            {department.description}
          </p>
        </div>
      </a>
    </article>
  );
}

export default function HauteDepartment({
  items = departments,
  heading = "A World of Distinction",
  eyebrow = "THE ONISHAKARA DEPARTMENTS",
  description = "Explore a considered expression of personal style, where modern design meets timeless African elegance.",
}) {
  return (
    <section className="haute-department" id="categories">
      <div className="haute-department__inner">
        <header className="haute-department__header">
          <div className="haute-department__intro">
            <span className="haute-department__eyebrow">
              <span />
              {eyebrow}
            </span>

            <h2 className="haute-department__heading">
              {heading}
            </h2>

            <p className="haute-department__description">
              {description}
            </p>
          </div>

          <a
            className="haute-department__view-all"
            href="#shop-all"
          >
            <span>EXPLORE ALL DEPARTMENTS</span>
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              arrow_outward
            </span>
          </a>
        </header>

        <div className="haute-department__grid">
          {items.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
            />
          ))}
        </div>

        <div className="haute-department__footer">
          <span>01 — 04</span>
          <span className="haute-department__footer-line" />
          <span>DISCOVER YOUR SIGNATURE</span>
        </div>
      </div>
    </section>
  );
}
