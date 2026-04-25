import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <>
      <div className="top-stripe" />
      <nav className="navbar" style={{ marginTop: 3 }}>
        {/* Logo */}
        <NavLink to="/" className="navbar-logo">
          <div className="navbar-logo-mark">
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <ellipse cx="14" cy="14" rx="11" ry="7" stroke="white" strokeWidth="2.2" />
              <circle cx="14" cy="14" r="3.5" fill="white" />
              <circle cx="15.3" cy="12.7" r="1.3" fill="#DC2626" />
            </svg>
          </div>
          <span className="navbar-logo-text">
            Truth<span>Prism</span>
          </span>
        </NavLink>

        {/* Links */}
        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Dashboard
          </NavLink>
        </div>
      </nav>
    </>
  );
}
