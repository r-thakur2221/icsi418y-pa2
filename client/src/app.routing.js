import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Login } from "./components/login/login.component";
import { Signup } from "./components/signup/signup.component";
import { Welcome } from "./components/Dashboard/welcome.component";
import { CreateProject } from "./components/project/createProject.component";
import { ViewProjects } from "./components/project/viewProject.component";
import { ManageMembers } from "./components/manageMember/manageMember.component";
import { EditProject } from "./components/project/editProject.component";

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

        <Route path="/projects" element={<ViewProjects />} />
        <Route path="/projects/create" element={<CreateProject />} />
        <Route path="/projects/:projectId/members" element={<ManageMembers />} />

        <Route path="/projects/:projectId/edit" element={<EditProject />} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
};