import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./viewProject.component.css";
import httpClient from "./../../util/httpClient";

const formatLead = (lead) => {
  if (!lead) return "—";
  if (typeof lead === "string") return lead; // raw ObjectId fallback
  return `${lead.f_name} ${lead.l_name} (${lead.username})`;
};

export const ViewProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const loadProjects = () => {
    setLoading(true);
    setMessage("");
    httpClient
      .get("/projects")
      .then((res) => setProjects(res.data.projects || []))
      .catch((err) => {
        console.log("Load projects error:", err);
        setIsError(true);
        setMessage(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            "Failed to load projects."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="projects-container">
      <h2>Projects</h2>

      <div className="actions">
        <Link to="/projects/create">
          <button>+ Create Project</button>
        </Link>
        <Link to="/">
          <button className="secondary">Logout</button>
        </Link>
      </div>

      {message && <p className={isError ? "error" : "success"}>{message}</p>}

      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p>No projects yet. Create one!</p>
      ) : (
        <table className="projects-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Project Lead</th>
              <th>Members</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.description}</td>
                <td>
                  <span className={`status status-${p.status.toLowerCase()}`}>
                    {p.status}
                  </span>
                </td>
                <td>{formatLead(p.project_lead_id)}</td>
                <td>
                  <button
                    onClick={() =>
                      navigate(`/projects/${p._id}/members`)
                    }
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};