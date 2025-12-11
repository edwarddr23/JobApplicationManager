// src/components/Navbar.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface NavLink {
  name: string;
  path: string;
  element: React.ReactNode;
}

interface NavbarProps {
  links: NavLink[];
}

function Navbar({ links }: NavbarProps) {
  const { user, logout } = useAuth(); // <-- use logout from context
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout(); // context handles clearing user
      navigate("/");  // redirect to home
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const showLoginLink = !user && location.pathname !== "/login";

  return (
    <div>
      <ul>
        {links.map((link) => (
          <li key={link.name}>
            <Link to={link.path}>{link.name}</Link>
          </li>
        ))}
      </ul>

      {/* <div style={{ float: "right" }}>
        {user ? (
          <div>
            <Link to="/myprofile">{user.username}</Link>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          showLoginLink && <Link to="/login">Login</Link>
        )}
      </div> */}
    </div>
  );
}

export default Navbar;
