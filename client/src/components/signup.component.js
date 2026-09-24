import { useState } from "react";
import "./signup.component.css";
import { Link, useNavigate } from "react-router-dom";
import httpClient from "./../util/httpClient";

export const Signup = () => {
  const [form, setForm] = useState({
    f_name: "",
    l_name: "",
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // reset previous messages
    setMessage("");
    setIsError(false);

    if (
      !form.f_name.trim() ||
      !form.l_name.trim() ||
      !form.username.trim() ||
      !form.password.trim()
    ) {
      setIsError(true);
      setMessage("All fields are required.");
      return;
    }

    setLoading(true);

    httpClient
      .post("/auth/register", form)
      .then((response) => {
        console.log("Signup success >>", response.data);
        setIsError(false);
        setMessage("Signup successful! Redirecting to login...");
        // clear form
        setForm({ f_name: "", l_name: "", username: "", password: "" });
        // redirect to login after a short delay
        setTimeout(() => navigate("/"), 1500);
      })
      .catch((err) => {
        console.log("Signup error >>", err);
        setIsError(true);
        setMessage(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            "Signup failed. Please try again."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>Signup</h2>

      <label>First Name</label>
      <input
        type="text"
        name="f_name"
        value={form.f_name}
        onChange={handleChange}
        placeholder="Enter first name"
      />

      <label>Last Name</label>
      <input
        type="text"
        name="l_name"
        value={form.l_name}
        onChange={handleChange}
        placeholder="Enter last name"
      />

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
        {loading ? "Submitting..." : "Sign Up"}
      </button>

      <p>
        Already have an Account? <Link to="/">Login</Link>
      </p>

      {message && <p className={isError ? "error" : "success"}>{message}</p>}
    </form>
  );
};