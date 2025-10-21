import React, { useState, FormEvent } from "react";
import { TextInputBox } from "../components/UIComponents";
import { useNavigate } from "react-router-dom";
import { useAuth, User } from "../contexts/AuthContext";

const CreateUser: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [firstname, setFirstname] = useState<string>("");
  const [lastname, setLastname] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmpassword, setConfirmpassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmpassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("/createuser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, firstname, lastname, password }),
      });

      if (res.ok) {
        const data: { user: User } = await res.json();
        setUser(data.user);
        navigate("/");
      } else if (res.status === 409) {
        setError("Username already exists.");
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
      <h1>Create User</h1>
      <form onSubmit={handleSubmit}>
        {error && <p>{error}</p>}

        <TextInputBox
          label="Username"
          type="text"
          value={username}
          onChange={setUsername}
          required
        />
        <TextInputBox
          label="First Name"
          type="text"
          value={firstname}
          onChange={setFirstname}
          required
        />
        <TextInputBox
          label="Last Name"
          type="text"
          value={lastname}
          onChange={setLastname}
          required
        />
        <TextInputBox
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
        />
        <TextInputBox
          label="Confirm Password"
          type="password"
          value={confirmpassword}
          onChange={setConfirmpassword}
          required
        />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default CreateUser;
