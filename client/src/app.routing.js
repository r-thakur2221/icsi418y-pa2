import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Login } from "./components/login.component";
import { Signup } from "./components/signup.component";
import { Welcome } from "./components/welcome.component";
import notFoundImg from "./images/notfound.png";

const PageNotFound = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>404 - Page Not Found</h1>
      <img
        src={notFoundImg}
        alt="Page not found"
        style={{ width: "400px" }}
      />
    </div>
  );
};

export const AppRouting = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/welcome/:name" element={<Welcome />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
};