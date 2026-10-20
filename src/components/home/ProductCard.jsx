import { Link } from "react-router-dom";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link to={`/product/${product.slug}`} className="product-card__image">
        <img src={product.image} alt={product.name} loading="lazy" />
      </Link>

      <div className="product-card__details">
        <p className="product-card__category">{product.category}</p>

        <h3>
          <Link to={`/product/${product.slug}`}>
            {product.name}
          </Link>
        </h3>

        <p className="product-card__price">
          ₦{Number(product.price).toLocaleString("en-NG")}
        </p>

        {!product.inStock && (
          <span className="product-card__stock">Out of stock</span>
        )}
      </div>
    </article>
  );
}