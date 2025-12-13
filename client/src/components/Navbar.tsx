// src/components/Navbar.tsx
import React from "react";
import { Link } from "react-router-dom";

interface NavLink {
  name: string;
  path: string;
  element: React.ReactNode;
}

interface NavbarProps {
  links: NavLink[];
}

function Navbar({ links }: NavbarProps) {
  return (
    <div>
      <ul>
        {links.map((link) => (
          <li key={link.name}>
            <Link to={link.path}>{link.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Navbar;
