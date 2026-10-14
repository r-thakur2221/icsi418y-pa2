import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./welcome.component.css";
import httpClient from "./../../util/httpClient";
import { getCurrentUser, clearCurrentUser, isLeadOf } from "./../../util/auth";

export const Welcome = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }
    httpClient
      .get(`/projects?mine=${user._id}`)
      .then((res) => setProjects(res.data.projects || []))
      .catch((err) =>
        setMessage(err.response?.data?.msg || "Failed to load your projects.")
      )
      .finally(() => setLoading(false));
  }, [user?._id]);

  const led = projects.filter((p) => isLeadOf(p, user));
  const joined = projects.filter((p) => !isLeadOf(p, user));

  const handleLogout = () => {
    clearCurrentUser();
    navigate("/");
  };

  return (
    <div className="welcome-page">
      <h1>Welcome, {name}!</h1>
      {user && (
        <p className="subtitle">
          Signed in as <strong>{user.username}</strong>
        </p>
      )}

      <div className="welcome-actions">
        <Link to="/projects">
          <button>Browse All Projects</button>
        </Link>
        <Link to="/projects/create">
          <button>+ Create Project</button>
        </Link>
        <button className="secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {message && <p className="error">{message}</p>}

      {loading ? (
        <p>Loading your projects...</p>
      ) : (
        <div className="dash-grid">
          <section className="dash-col">
            <h3>Projects I Lead ({led.length})</h3>
            {led.length === 0 ? (
              <p className="muted">No projects yet.</p>
            ) : (
              <ul className="dash-list">
                {led.map((p) => (
                  <li key={p._id}>
                  <div>
                    <strong>{p.name}</strong>
                    <span className={`status status-${p.status.toLowerCase()}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="li-actions">
                    <Link to={`/projects/${p._id}/edit`}>
                      <button>Edit</button>
                    </Link>
                    <Link to={`/projects/${p._id}/members`}>
                      <button className="secondary">Members</button>
                    </Link>
                  </div>
                </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dash-col">
            <h3>Projects I'm In ({joined.length})</h3>
            {joined.length === 0 ? (
              <p className="muted">You're not a member of any project yet.</p>
            ) : (
              <ul className="dash-list">
                {joined.map((p) => (
                  <li key={p._id}>
                    <div>
                      <strong>{p.name}</strong>
                      <span className={`status status-${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </div>
                    <small className="muted">
                      Lead:{" "}
                      {p.project_lead_id?.f_name
                        ? `${p.project_lead_id.f_name} ${p.project_lead_id.l_name}`
                        : "—"}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
};