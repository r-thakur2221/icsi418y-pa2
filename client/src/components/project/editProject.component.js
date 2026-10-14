import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./editProject.component.css";
import httpClient from "./../../util/httpClient";
import { getCurrentUser, isLeadOf } from "./../../util/auth";

export const EditProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = user?._id; // stable primitive for the dependency array

  const [project, setProject] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Planning",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [notAllowed, setNotAllowed] = useState(false);

  // Load project once per projectId (and when user changes)
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    httpClient
      .get(`/projects/${projectId}`)
      .then((res) => {
        if (cancelled) return;
        const p = res.data.project;
        setProject(p);
        setForm({
          name: p.name,
          description: p.description,
          status: p.status,
        });
        setNotAllowed(!isLeadOf(p, user));
      })
      .catch((err) => {
        if (cancelled) return;
        setIsError(true);
        setMessage(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            "Failed to load project."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!form.name.trim() || !form.description.trim() || !form.status) {
      setIsError(true);
      setMessage("Name, description and status are required.");
      return;
    }

    setSaving(true);

    httpClient
      .put(`/projects/${projectId}`, form)
      .then((res) => {
        setIsError(false);
        setMessage(res.data.msg || "Project updated successfully.");
        setProject(res.data.project);
        // No need to reset form — server echoed back what we sent
      })
      .catch((err) => {
        setIsError(true);
        setMessage(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            "Failed to update project."
        );
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this project and all its memberships?")) return;

    httpClient
      .delete(`/projects/${projectId}`)
      .then(() => navigate("/projects"))
      .catch((err) => {
        setIsError(true);
        setMessage(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            "Failed to delete project."
        );
      });
  };

  if (loading) return <p className="page">Loading...</p>;

  if (!project)
    return (
      <div className="page">
        <p className="error">{message || "Project not found."}</p>
        <Link to="/projects">Back to Projects</Link>
      </div>
    );

  if (notAllowed)
    return (
      <div className="page">
        <h2>Edit Project</h2>
        <p className="notice">
          Only the Project Lead can edit this project. You can view the members
          instead.
        </p>
        <div className="row">
          <Link to={`/projects/${projectId}/members`}>
            <button>View Members</button>
          </Link>
          <Link to="/projects">
            <button className="secondary">Back to Projects</button>
          </Link>
        </div>
      </div>
    );

  return (
    <div className="page">
      <h2>Edit Project</h2>
      <p className="subtitle">
        Lead:{" "}
        <strong>
          {project.project_lead_id?.f_name} {project.project_lead_id?.l_name} (
          {project.project_lead_id?.username})
        </strong>
      </p>

      {message && <p className={isError ? "error" : "success"}>{message}</p>}

      <form onSubmit={handleSubmit} className="form">
        <label>Project Name*</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
        />

        <label>Description*</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
        />

        <label>Status*</label>
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>

        <div className="row">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <Link to={`/projects/${projectId}/members`}>
            <button type="button" className="secondary">
              Manage Members
            </button>
          </Link>

          <button type="button" className="danger" onClick={handleDelete}>
            Delete Project
          </button>
        </div>
      </form>

      <p style={{ marginTop: 16 }}>
        <Link to="/projects">Back to Projects</Link>
      </p>
    </div>
  );
};