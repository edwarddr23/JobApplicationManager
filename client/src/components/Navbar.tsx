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

function Navbar({ links }: NavbarProps){
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async() => {
        try{
            const res = await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });
            if(res.ok){
                setUser(null);
                navigate("/");
            }
            else{
                console.error("Logout failed");
            }
        }
        catch(err){
            console.error(err);
        }
    }

    const showLoginLink = !user && location.pathname !== "/login"

    return(
        <div>
            {links.map((link) => (
                <li key={link.name}>
                    <Link to={link.path}>{link.name}</Link>
                </li>
            ))}
            <div style={{float: 'right'}}>
            {user ? (
                <div>
                    <Link to="/myprofile">{user.username}</Link>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ): (
                showLoginLink && <Link to="/login">Login</Link>
            )}
        </div>
        </div>
    );
}

export default Navbar;