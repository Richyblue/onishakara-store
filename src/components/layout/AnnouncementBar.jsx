
import "./AnnouncementBar.css";

export default function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <div className="announcement-bar__inner">
        <span className="announcement-bar__location">
          Lagos Atelier • Global Delivery
        </span>

        <p className="announcement-bar__message">
          COMPLIMENTARY LAGOS &amp; ABUJA DOORSTEP COURIER
          ON ORDERS OVER ₦150,000 | WORLDWIDE DHL EXPRESS
        </p>

        <div className="announcement-bar__currency">
          <button type="button" className="is-active">
            NGN (₦)
          </button>
          <span>/</span>
          <button type="button" disabled>
            USD ($)
          </button>
        </div>
      </div>
    </div>
  );
}
