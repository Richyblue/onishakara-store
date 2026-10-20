
import "./TrustStrip.css";

const benefits = [
  {
    icon: "verified",
    title: "CURATED WITH INTENTION",
    description:
      "Discover thoughtfully selected fashion, accessories and statement pieces.",
  },
  {
    icon: "lock",
    title: "SECURE CHECKOUT",
    description:
      "A considered shopping experience with secure payment integration.",
  },
  {
    icon: "support_agent",
    title: "PRIVATE CONCIERGE",
    description:
      "Personal assistance for styling, sizing and special requests.",
  },
  {
    icon: "local_shipping",
    title: "CONSIDERED DELIVERY",
    description:
      "Clear delivery information and order updates from dispatch to arrival.",
  },
];

export default function TrustStrip() {
  return (
    <section
      className="trust-strip"
      aria-label="The Onishakara shopping experience"
    >
      <div className="trust-strip__inner">
        {benefits.map((benefit) => (
          <article className="trust-strip__item" key={benefit.title}>
            <div className="trust-strip__icon" aria-hidden="true">
              <span className="material-symbols-outlined">
                {benefit.icon}
              </span>
            </div>

            <div className="trust-strip__content">
              <h2 className="trust-strip__title">
                {benefit.title}
              </h2>

              <p className="trust-strip__description">
                {benefit.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
