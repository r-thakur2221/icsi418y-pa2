import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./viewProject.component.css";
import httpClient from "./../../util/httpClient";
import { getCurrentUser, isLeadOf } from "./../../util/auth";

const formatLead = (lead) => {
  if (!lead) return "—";
  if (typeof lead === "string") return lead;
  return `${lead.f_name} ${lead.l_name} (${lead.username})`;
};

export const ViewProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [scope, setScope] = useState("all");
  const navigate = useNavigate();
  const user = getCurrentUser();

  const loadProjects = () => {
    setLoading(true);
    setMessage("");
    const url = scope === "all" ? "/projects" : `/projects?mine=${user?._id}`;
    httpClient
      .get(url)
      .then((res) => setProjects(res.data.projects || []))
      .catch((err) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const visible =
    scope === "leading" ? projects.filter((p) => isLeadOf(p, user)) : projects;

  return (
    <div className="projects-container">
      <h2>Projects</h2>

      <div className="actions">
        <Link to="/projects/create">
          <button>+ Create Project</button>
        </Link>
        <Link to={`/welcome/${user?.username || ""}`}>
          <button className="secondary">Back to Dashboard</button>
        </Link>
      </div>

      <div className="filters">
        <button
          className={scope === "all" ? "active" : ""}
          onClick={() => setScope("all")}
        >
          All Projects
        </button>
        <button
          className={scope === "mine" ? "active" : ""}
          onClick={() => setScope("mine")}
        >
          My Projects
        </button>
        <button
          className={scope === "leading" ? "active" : ""}
          onClick={() => setScope("leading")}
        >
          Projects I Lead
        </button>
      </div>

      {message && <p className={isError ? "error" : "success"}>{message}</p>}

      {loading ? (
        <p>Loading projects...</p>
      ) : visible.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <table className="projects-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Project Lead</th>
              <th>Members</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const userIsLead = isLeadOf(p, user);
              return (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.description}</td>
                  <td>
                    <span className={`status status-${p.status.toLowerCase()}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{formatLead(p.project_lead_id)}</td>
                  <td>{p.member_count ?? "—"}</td>
                  <td className="action-cell">
                    {userIsLead ? (
                      <>
                        <button
                          onClick={() => navigate(`/projects/${p._id}/edit`)}
                        >
                          Edit
                        </button>
                        <button
                          className="secondary"
                          onClick={() =>
                            navigate(`/projects/${p._id}/members`)
                          }
                        >
                          Manage Members
                        </button>
                      </>
                    ) : (
                      <button
                        className="secondary"
                        onClick={() => navigate(`/projects/${p._id}/members`)}
                      >
                        View Members
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};