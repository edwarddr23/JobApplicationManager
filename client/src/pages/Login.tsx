import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, TextInputBox } from '../components/UIComponents'
import { useAuth } from "../contexts/AuthContext";

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { setUser } = useAuth();

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });


      if (res.ok) {
        const data: { user: any } = await res.json();
        setUser(data.user);
        navigate("/");
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
        {error && <p>{error}</p>}

        <TextInputBox
          label="Username"
          type="text"
          value={username}
          onChange={setUsername}
          required={true}
        />

        <TextInputBox
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required={true}
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
