import React from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import "./welcome.component.css";

export const Welcome = () => {
  const { name } = useParams();
  const { state } = useLocation();

  const initial = name?.charAt(0).toUpperCase() || "?";
  const firstName = state?.f_name || "";

  return (
    <div className="welcome-page">
      <div className="welcome-card">
        <div className="avatar">{initial}</div>

        <h1 className="welcome-title">
          Welcome, <span className="welcome-name">{name}</span>
        </h1>

        <p className="welcome-subtitle">
          {firstName ? `Hi ${firstName}, ` : ""}you have successfully logged in 🎉
        </p>

        <Link to="/" className="welcome-btn">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
};