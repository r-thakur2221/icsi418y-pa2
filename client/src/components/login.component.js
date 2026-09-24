import { useState } from "react";
import "./login.component.css";
import { Link, useNavigate } from "react-router-dom";
import httpClient from "./../util/httpClient";

export const Login = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // reset previous messages
    setMessage("");
    setIsError(false);

    if (!form.username.trim() || !form.password.trim()) {
      setIsError(true);
      setMessage("Username and password are required.");
      return;
    }

    setLoading(true);

    httpClient
      .post("/auth/login", form)
      .then((response) => {
        console.log("i am response>>", response);
        navigate(`/welcome/${form.username}`);
      })
      .catch((err) => {
        console.log("Error:", err);
        setIsError(true);
        setMessage(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            "Login failed. Please try again."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>Login</h2>

      <label>Username</label>
      <input
        type="text"
        name="username"
        value={form.username}
        onChange={handleChange}
        placeholder="Enter username"
      />

      <label>Password</label>
      <input
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Enter password"
      />

      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <p>
        Don't have an Account? <Link to="/register">Sign Up</Link>
      </p>

      {message && <p className={isError ? "error" : "success"}>{message}</p>}
    </form>
  );
};