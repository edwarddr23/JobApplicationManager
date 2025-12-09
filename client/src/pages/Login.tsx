// src/pages/Login.tsx
import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, TextInputBox } from "../components/UIComponents";
import { useAuth, User } from "../contexts/AuthContext";

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { login } = useAuth(); // use context login function
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data: { user: User } = await res.json();

        // The user object returned from backend must include token
        login(data.user); // login sets user in context
        navigate("/"); // redirect after login
      } else if (res.status === 401) {
        setError("Invalid username or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <TextInputBox
          label="Username"
          type="text"
          value={username}
          onChange={setUsername}
          required
        />

        <TextInputBox
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
        />

        <Button type="submit">Submit</Button>
      </form>

      <p>
        Don't have an account? <Link to="/createuser">Make an account</Link>
      </p>
    </div>
  );
};

export default Login;
