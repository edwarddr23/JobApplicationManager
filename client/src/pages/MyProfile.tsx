import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

function MyProfile() {
  const { user } = useAuth();

  if (!user) {
    // Show a fallback if user is not logged in
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <div>
      <h1>My Profile</h1>
      <p>Username: {user.username}</p>
      <p>First Name: {user.firstname}</p>
      <p>Last Name: {user.lastname}</p>
      <p>Type: {user.type}</p>
      <Link to="/changepassword">Change Password</Link>
    </div>
  );
}

export default MyProfile;
