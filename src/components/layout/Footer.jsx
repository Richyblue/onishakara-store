
import { useState } from "react";
import "./Footer.css";

const defaultLinkGroups = [
  {
    title: "EXPLORE",
    links: [
      { label: "Shop All", href: "#shop-all" },
      { label: "New Arrivals", href: "#new-arrivals" },
      { label: "Categories", href: "#categories" },
      { label: "Collections", href: "#collections" },
    ],
  },
  {
    title: "THE HOUSE",
    links: [
      { label: "Our Story", href: "#about-us" },
      { label: "Contact Us", href: "#contact" },
      { label: "Shipping Information", href: "#shipping" },
      { label: "Returns & Exchanges", href: "#returns" },
    ],
  },
];

export default function Footer({
  linkGroups = defaultLinkGroups,
  contactEmail,
  instagramUrl,
  facebookUrl,
  onSubscribe,
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubscribe(event) {
    event.preventDefault();
    setMessage("");

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    if (!onSubscribe) {
      setMessage("Newsletter signup is not connected yet.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubscribe(email.trim());
      setMessage("Thank you for joining our mailing list.");
      setEmail("");
    } catch {
      setMessage("We couldn't process your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="site-footer__brand">
          <a className="site-footer__logo" href="#home" aria-label="Onishakara home">
            ONISHAKARA<span>.</span>
          </a>

          <p className="site-footer__tagline">
            Personal style. Distinctive presence.
          </p>

          <p className="site-footer__brand-copy">
            A considered destination for distinctive fashion and personal
            expression.
          </p>

          {(instagramUrl || facebookUrl) && (
            <div className="site-footer__socials">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Visit Onishakara on Instagram"
                >
                  IG
                </a>
              )}

              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Visit Onishakara on Facebook"
                >
                  FB
                </a>
              )}
            </div>
          )}
        </div>

        {linkGroups.map((group) => (
          <nav
            className="site-footer__links"
            key={group.title}
            aria-label={group.title}
          >
            <h2 className="site-footer__heading">{group.title}</h2>

            <ul>
              {group.links.map((link) => (
                <li key={`${group.title}-${link.label}`}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="site-footer__newsletter">
          <h2 className="site-footer__heading">A NOTE FROM THE HOUSE</h2>

          <p className="site-footer__newsletter-copy">
            Receive collection updates, style inspiration and news from
            Onishakara.
          </p>

          <form
            className="site-footer__form"
            onSubmit={handleSubscribe}
          >
            <label className="site-footer__sr-only" htmlFor="footer-email">
              Email address
            </label>

            <input
              id="footer-email"
              type="email"
              autoComplete="email"
              placeholder="Your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isSubmitting}
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "PLEASE WAIT..." : "SUBSCRIBE"}
            </button>
          </form>

          {message && (
            <p className="site-footer__form-message" role="status">
              {message}
            </p>
          )}

          {contactEmail && (
            <p className="site-footer__contact">
              For enquiries:{" "}
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </p>
          )}
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>
          © {new Date().getFullYear()} Onishakara. All rights reserved.
        </p>

        <p className="site-footer__bottom-note">
          CONSIDERED STYLE · DISTINCTIVE LIVING
        </p>

        <a className="site-footer__back-top" href="#home">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
