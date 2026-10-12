import { useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ArrowRight, Compass, Menu, UserRound, X } from "lucide-react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import logoUrl from "../logo.jpg";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import PackagePage from "./pages/PackagePage";
import ContactPage from "./pages/ContactPage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import OperationsPage from "./pages/OperationsPage";
import BookingPage from "./pages/BookingPage";
import NotificationBell from "./components/NotificationBell";

function SiteLayout() {
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link
          className="brand"
          to="/"
          onClick={closeMenu}
          aria-label="TravexGo home"
        >
          <span className="brand-logo-window">
            <img className="brand-logo" src={logoUrl} alt="TravexGo Travel and Tours" />
          </span>
        </Link>
        <button
          className="icon-button menu-trigger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        {user && <NotificationBell />}
        <nav
          className={`main-nav ${menuOpen ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          <Link
            className={location.pathname === "/packages" ? "active" : ""}
            to="/packages"
            onClick={closeMenu}
          >
            Find a trip
          </Link>
          <Link
            className={location.pathname === "/about" ? "active" : ""}
            to="/about"
            onClick={closeMenu}
          >
            Our story
          </Link>
          <Link
            className={location.pathname === "/contact" ? "active" : ""}
            to="/contact"
            onClick={closeMenu}
          >
            Contact
          </Link>
          {user ? (
            <Link
              className="nav-account"
              to={
                profile?.role === "administrator" || profile?.role === "staff"
                  ? "/manage"
                  : "/account"
              }
              onClick={closeMenu}
            >
              <UserRound size={16} /> My{" "}
              {profile?.role === "administrator" || profile?.role === "staff"
                ? "workspace"
                : "trips"}
            </Link>
          ) : (
            <Link className="nav-account" to="/login" onClick={closeMenu}>
              Log in <ArrowRight size={15} />
            </Link>
          )}
        </nav>
      </header>
      <main key={location.pathname} className="page-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/packages" element={<CatalogPage />} />
          <Route path="/packages/:slug" element={<PackagePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/about"
            element={
              <section className="editorial-page">
                <span className="eyebrow">ROOTED IN PANGASINAN</span>
                <h1>
                  Good journeys
                  <br />
                  start with <em>good people.</em>
                </h1>
                <p>
                  TravexGo is a travel and tour team based in San Carlos City,
                  Pangasinan. We bring people closer to the Philippines through
                  thoughtfully planned trips, local knowledge, and the kind of
                  care that makes travel feel easy.
                </p>
                <Link className="button button-dark" to="/packages">
                  Explore our trips <ArrowRight size={17} />
                </Link>
              </section>
            }
          />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage register />} />
          <Route path="/reset-password" element={<AuthPage recovery />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/book/:scheduleId" element={<BookingPage />} />
          <Route path="/manage" element={<OperationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="footer-main">
          <Link className="brand brand-footer" to="/">
            <span className="brand-logo-window">
              <img className="brand-logo" src={logoUrl} alt="TravexGo Travel and Tours" />
            </span>
          </Link>
          <p>
            Closer to the places
            <br />
            that stay with you.
          </p>
          <Link to="/contact">
            Get in touch <ArrowRight size={15} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} TravexGo, San Carlos City</span>
          <span>
            Pangasinan, Philippines <Compass size={14} />
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteLayout />
    </AuthProvider>
  );
}
