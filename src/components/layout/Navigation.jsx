
import { NavLink } from "react-router-dom";
import "./Navigation.css";

const links = [
  { label: "Home", path: "/", end: true },
  { label: "Shop All", path: "/shop" },
  { label: "New Arrivals", path: "/new-arrivals" },
  { label: "Collections", path: "/shop" },
  { label: "Categories", path: "/shop" },
  { label: "About Us", path: "/" },
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
