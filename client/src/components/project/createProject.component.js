import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./createProject.component.css";
import httpClient from "./../../util/httpClient";

export const CreateProject = () => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Planning",
    project_lead_id: "",
  });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  // Load users for the Project Lead dropdown
  useEffect(() => {
    httpClient
      .get("/auth/users")
      .then((res) => setUsers(res.data.users || []))
      .catch((err) => {
        console.log("Error loading users:", err);
        setIsError(true);
        setMessage("Could not load users. Please refresh.");
      })
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.status.trim() ||
      !form.project_lead_id
    ) {
      setIsError(true);
      setMessage("All fields are required.");
      return;
    }

    setLoading(true);

    httpClient
      .post("/projects", form)
      .then((res) => {
        setIsError(false);
        setMessage("Project created successfully! Redirecting...");
        setForm({
          name: "",
          description: "",
          status: "Planning",
          project_lead_id: "",
        });
        setTimeout(() => navigate("/projects"), 1200);
      })
      .catch((err) => {
        console.log("Create project error:", err);
        setIsError(true);
        setMessage(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            "Failed to create project."
        );
      })
      .finally(() => setLoading(false));
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2>Create Project</h2>

      <label>Project Name*</label>
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Enter project name"
      />

      <label>Description*</label>
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Enter project description"
        rows={3}
      />

      <label>Status*</label>
      <select name="status" value={form.status} onChange={handleChange}>
        <option value="Planning">Planning</option>
        <option value="Active">Active</option>
        <option value="Completed">Completed</option>
      </select>

      <label>Project Lead*</label>
      <select
        name="project_lead_id"
        value={form.project_lead_id}
        onChange={handleChange}
        disabled={loadingUsers}
      >
        <option value="">
          {loadingUsers ? "Loading users..." : "-- Select a user --"}
        </option>
        {users.map((u) => (
          <option key={u._id} value={u._id}>
            {u.f_name} {u.l_name} ({u.username})
          </option>
        ))}
      </select>

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Project"}
      </button>

      <p>
        <Link to="/projects">Back to Projects</Link>
      </p>

      {message && <p className={isError ? "error" : "success"}>{message}</p>}
    </form>
  );
};