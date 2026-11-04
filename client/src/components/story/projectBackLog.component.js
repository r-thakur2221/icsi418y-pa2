import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./story.component.css";
import httpClient from "./../../util/httpClient";

const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["To Do", "In Progress", "Done"];

const priorityClass = (p) =>
  `priority-${(p || "").toLowerCase()}`;

const statusClass = (s) =>
  `story-status-${(s || "").toLowerCase().replace(/\s+/g, "")}`;

const emptyForm = {
  title: "",
  description: "",
  priority: "Medium",
  status: "To Do",
  assigned_user_id: "",
};

const assigneeLabel = (story) => {
  const u = story.assigned_user_id;
  if (!u) return "Unassigned";
  if (typeof u === "string") return u;
  return `${u.f_name || ""} ${u.l_name || ""} (${u.username || ""})`.trim();
};

export const ProjectBacklog = () => {
  const { projectId: routeProjectId } = useParams();

  // project switcher
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(routeProjectId || "");

  const [project, setProject] = useState(null);
  const [stories, setStories] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // create form
  const [createForm, setCreateForm] = useState(emptyForm);

  // edit state — holds the story id being edited (or null)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  // simple client-side filter (all statuses always loaded; filter is only a view toggle)
  const [statusFilter, setStatusFilter] = useState("All");

  // Load project list for the switcher once
  useEffect(() => {
    httpClient
      .get("/projects")
      .then((res) => setProjects(res.data.projects || []))
      .catch(() => setProjects([]));
  }, []);

  // Whenever the selected project changes: reset everything, then load
  useEffect(() => {
    if (!selectedProjectId) {
      setProject(null);
      setStories([]);
      setMembers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setMessage("");
    setIsError(false);
    // Assignment/editing rules: clear any open editing form on project switch
    setEditingId(null);
    setEditForm(emptyForm);
    setCreateForm(emptyForm);
    setStatusFilter("All");

    Promise.all([
      httpClient.get(`/projects/${selectedProjectId}`),
      httpClient.get(`/projects/${selectedProjectId}/stories`),
      httpClient.get(`/projects/${selectedProjectId}/members`),
    ])
      .then(([projRes, storiesRes, membersRes]) => {
        if (cancelled) return;
        setProject(projRes.data.project);
        setStories(storiesRes.data.stories || []);
        setMembers(membersRes.data.memberships || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setIsError(true);
        setMessage(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            "Failed to load project backlog."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  // Members for the assignment dropdown: current project members only
  // (the backend already auto-adds the Project Lead as a member on project create,
  // so the Lead appears here naturally).
  const memberOptions = useMemo(
    () =>
      members.map((m) => ({
        _id: m.user_id?._id || m.user_id,
        label: `${m.user_id?.f_name || ""} ${m.user_id?.l_name || ""}`.trim() +
          (m.user_id?.username ? ` (${m.user_id.username})` : ""),
      })),
    [members]
  );

  const refreshStories = async () => {
    if (!selectedProjectId) return;
    const res = await httpClient.get(
      `/projects/${selectedProjectId}/stories`
    );
    setStories(res.data.stories || []);
  };

  /* ---------------- CREATE ---------------- */
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!createForm.title.trim()) {
      setIsError(true);
      setMessage("Title is required.");
      return;
    }
    if (!createForm.description.trim()) {
      setIsError(true);
      setMessage("Description is required.");
      return;
    }
    if (!PRIORITIES.includes(createForm.priority)) {
      setIsError(true);
      setMessage("Priority must be High, Medium, or Low.");
      return;
    }

    setSaving(true);
    try {
      // status is ignored by backend on create (forced to "To Do")
      await httpClient.post(`/projects/${selectedProjectId}/stories`, {
        title: createForm.title,
        description: createForm.description,
        priority: createForm.priority,
        assigned_user_id: createForm.assigned_user_id || null,
      });
      setIsError(false);
      setMessage("Story created.");
      setCreateForm(emptyForm);
      await refreshStories();
    } catch (err) {
      setIsError(true);
      setMessage(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Failed to create story."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- EDIT ---------------- */
  const startEdit = (story) => {
    setEditingId(story._id);
    setEditForm({
      title: story.title,
      description: story.description,
      priority: story.priority,
      status: story.status,
      assigned_user_id: story.assigned_user_id?._id || "",
    });
    setMessage("");
    setIsError(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
    setMessage("");
    setIsError(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!editForm.title.trim()) {
      setIsError(true);
      setMessage("Title cannot be blank.");
      return;
    }
    if (!editForm.description.trim()) {
      setIsError(true);
      setMessage("Description cannot be blank.");
      return;
    }
    if (!PRIORITIES.includes(editForm.priority)) {
      setIsError(true);
      setMessage("Priority must be High, Medium, or Low.");
      return;
    }
    if (!STATUSES.includes(editForm.status)) {
      setIsError(true);
      setMessage("Status must be To Do, In Progress, or Done.");
      return;
    }

    setSaving(true);
    try {
      await httpClient.put(
        `/projects/${selectedProjectId}/stories/${editingId}`,
        {
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          status: editForm.status,
          assigned_user_id: editForm.assigned_user_id || null,
        }
      );
      setIsError(false);
      setMessage("Story updated.");
      setEditingId(null);
      setEditForm(emptyForm);
      await refreshStories();
    } catch (err) {
      setIsError(true);
      setMessage(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Failed to update story."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (story) => {
    if (!window.confirm(`Delete story "${story.title}"? This cannot be undone.`))
      return;

    setMessage("");
    setIsError(false);
    setSaving(true);
    try {
      await httpClient.delete(
        `/projects/${selectedProjectId}/stories/${story._id}`
      );
      setIsError(false);
      setMessage("Story deleted.");
      // If we were editing that story, clear the form
      if (editingId === story._id) {
        setEditingId(null);
        setEditForm(emptyForm);
      }
      await refreshStories();
    } catch (err) {
      setIsError(true);
      setMessage(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Failed to delete story."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  const visibleStories =
    statusFilter === "All"
      ? stories
      : stories.filter((s) => s.status === statusFilter);

  return (
    <div className="page">
      <h2>Project Backlog</h2>

      <div className="row">
        <Link to="/projects">
          <button className="secondary">Back to Projects</button>
        </Link>
        {selectedProjectId && (
          <Link to={`/projects/${selectedProjectId}/members`}>
            <button className="secondary">Manage Members</button>
          </Link>
        )}
      </div>

      <label style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>
        Select Project:
      </label>
      <select
        value={selectedProjectId}
        onChange={(e) => setSelectedProjectId(e.target.value)}
        style={{
          padding: "8px 10px",
          border: "1px solid #cbd5e1",
          borderRadius: 6,
          marginLeft: 8,
          marginBottom: 16,
          minWidth: 260,
        }}
      >
        <option value="">-- Choose a project --</option>
        {projects.map((p) => (
          <option key={p._id} value={p._id}>
            {p.name}
          </option>
        ))}
      </select>

      {message && (
        <p className={`message ${isError ? "error" : "success"}`}>{message}</p>
      )}

      {!selectedProjectId && (
        <p className="empty">Select a project to view its backlog.</p>
      )}

      {loading && selectedProjectId && <p>Loading backlog...</p>}

      {!loading && project && (
        <>
          <h3>
            {project.name}
            <span
              className={`status status-${project.status.toLowerCase()}`}
            >
              {project.status}
            </span>
          </h3>
          <p className="subtitle">{project.description}</p>

          {/* CREATE FORM */}
          <form className="form" onSubmit={handleCreate}>
            <h4 style={{ margin: 0, color: "#1e293b" }}>Create Story</h4>

            <label>Title*</label>
            <input
              type="text"
              name="title"
              value={createForm.title}
              onChange={handleCreateChange}
              placeholder="e.g. View campus event details"
            />

            <label>Description* (As a [user], I want [goal], so that [benefit].)</label>
            <textarea
              name="description"
              rows={3}
              value={createForm.description}
              onChange={handleCreateChange}
              placeholder="As a student, I want to view details of a campus event, so that I can decide whether to attend."
            />

            <label>Priority*</label>
            <select
              name="priority"
              value={createForm.priority}
              onChange={handleCreateChange}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <label>Assign To</label>
            <select
              name="assigned_user_id"
              value={createForm.assigned_user_id}
              onChange={handleCreateChange}
            >
              <option value="">Unassigned</option>
              {memberOptions.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.label}
                </option>
              ))}
            </select>

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create Story"}
            </button>
          </form>

          {/* EDIT FORM (shown above the list when editing) */}
          {editingId && (
            <form className="form" onSubmit={handleSaveEdit}>
              <h4 style={{ margin: 0, color: "#1e293b" }}>Edit Story</h4>

              <label>Title*</label>
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
              />

              <label>Description*</label>
              <textarea
                name="description"
                rows={3}
                value={editForm.description}
                onChange={handleEditChange}
              />

              <label>Priority*</label>
              <select
                name="priority"
                value={editForm.priority}
                onChange={handleEditChange}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <label>Status*</label>
              <select
                name="status"
                value={editForm.status}
                onChange={handleEditChange}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <label>Assign To</label>
              <select
                name="assigned_user_id"
                value={editForm.assigned_user_id}
                onChange={handleEditChange}
              >
                <option value="">Unassigned</option>
                {memberOptions.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="row" style={{ marginTop: 8 }}>
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* FILTER (view-only; all statuses still loaded) */}
          <h3>Stories ({stories.length})</h3>
          <div className="filter-row">
            {["All", ...STATUSES].map((f) => (
              <button
                key={f}
                className={statusFilter === f ? "active" : ""}
                onClick={() => setStatusFilter(f)}
                type="button"
              >
                {f}
              </button>
            ))}
          </div>

          {visibleStories.length === 0 ? (
            <p className="empty">
              {stories.length === 0
                ? "This project has no stories yet. Create one above."
                : "No stories match the selected filter."}
            </p>
          ) : (
            <ul className="story-list">
              {visibleStories.map((s) => (
                <li className="story-card" key={s._id}>
                  <div className="story-head">
                    <div>
                      <h4 className="story-title">{s.title}</h4>
                      <div className="story-meta">
                        <span className={`badge ${priorityClass(s.priority)}`}>
                          {s.priority}
                        </span>
                        <span className={`badge ${statusClass(s.status)}`}>
                          {s.status}
                        </span>
                        <span className="story-assignee">
                          Assignee: {assigneeLabel(s)}
                        </span>
                      </div>
                    </div>
                    <div className="story-actions">
                      <button onClick={() => startEdit(s)} type="button">
                        Edit
                      </button>
                      <button
                        className="danger"
                        onClick={() => handleDelete(s)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="story-description">{s.description}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};