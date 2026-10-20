
import { NavLink } from "react-router-dom";
import "./Navigation.css";

const links = [
  { label: "Home", path: "/", end: true },
  { label: "Shop All", path: "/shop" },
  { label: "New Arrivals", path: "/new-arrivals" },
  { label: "Collections", path: "/collections" },
  { label: "Categories", path: "/categories" },
  { label: "About Us", path: "/about-us" },
];

export default function Navigation() {
  return (
    <nav className="main-navigation" aria-label="Main navigation">
      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          end={link.end}
          className={({ isActive }) =>
            `main-navigation__link ${
              isActive ? "main-navigation__link--active" : ""
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
