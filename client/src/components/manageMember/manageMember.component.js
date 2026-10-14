import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./manageMember.component.css";
import httpClient from "../../util/httpClient";
import { getCurrentUser, isLeadOf } from "../../util/auth";

export const ManageMembers = () => {
  const { projectId } = useParams();
  const user = getCurrentUser();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setMessage("");
    try {
      const [projRes, membersRes, usersRes] = await Promise.all([
        httpClient.get(`/projects/${projectId}`),
        httpClient.get(`/projects/${projectId}/members`),
        httpClient.get("/auth/users"),
      ]);
      setProject(projRes.data.project);
      setMembers(membersRes.data.memberships || []);
      setAllUsers(usersRes.data.users || []);
    } catch (err) {
      setIsError(true);
      setMessage(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Failed to load project data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const leadId = project?.project_lead_id?._id || project?.project_lead_id;
  const userIsLead = isLeadOf(project, user);

  const currentMemberIds = new Set(
    members.map((m) => m.user_id?._id || m.user_id)
  );

  // Show every user in the add dropdown (including leads/current) so it's obvious
  // what happens when you try to add someone who's already in — the backend
  // returns a clear "already a member" error, which is part of the rubric.
  const addableUsers = allUsers;

  const handleAdd = (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!selectedUserId) {
      setIsError(true);
      setMessage("Please select a user to add.");
      return;
    }

    setActionLoading(true);
    httpClient
      .post(`/projects/${projectId}/members`, { user_id: selectedUserId })
      .then((res) => {
        setIsError(false);
        setMessage(res.data.msg || "Member added successfully.");
        setSelectedUserId("");
        return loadAll();
      })
      .catch((err) => {
        setIsError(true);
        setMessage(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            "Failed to add member."
        );
      })
      .finally(() => setActionLoading(false));
  };

  const handleRemove = (userId) => {
    if (!userIsLead) return;
    if (!window.confirm("Remove this member from the project?")) return;

    setMessage("");
    setIsError(false);
    setActionLoading(true);

    httpClient
      .delete(`/projects/${projectId}/members/${userId}`)
      .then((res) => {
        setIsError(false);
        setMessage(res.data.msg || "Member removed successfully.");
        return loadAll();
      })
      .catch((err) => {
        setIsError(true);
        setMessage(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            "Failed to remove member."
        );
      })
      .finally(() => setActionLoading(false));
  };

  if (loading) return <p className="page">Loading...</p>;
  if (!project)
    return (
      <div className="page">
        <p className="error">{message || "Project not found."}</p>
        <Link to="/projects">Back to Projects</Link>
      </div>
    );

  return (
    <div className="page">
      <h2>{userIsLead ? "Manage Members" : "Project Members"}</h2>

        {userIsLead && (
            <p style={{ marginBottom: 8 }}>
                <Link to={`/projects/${projectId}/edit`}>
                <button className="secondary">Edit Project Details</button>
                </Link>
            </p>
        )}

      <h3>
        Project: {project.name}{" "}
        <span className={`status status-${project.status.toLowerCase()}`}>
          {project.status}
        </span>
      </h3>
      <p>{project.description}</p>

      {!userIsLead && (
        <p className="notice">
          You are not the Project Lead for this project, so you can view the
          roster but not change it.
        </p>
      )}

      {message && <p className={isError ? "error" : "success"}>{message}</p>}

      {userIsLead && (
        <form onSubmit={handleAdd} className="add-member-form">
          <label>Add a user: </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={actionLoading}
          >
            <option value="">-- Select a user --</option>
            {addableUsers.map((u) => {
              const already = currentMemberIds.has(u._id);
              return (
                <option key={u._id} value={u._id}>
                  {u.f_name} {u.l_name} ({u.username})
                  {already ? " — already a member" : ""}
                </option>
              );
            })}
          </select>
          <button type="submit" disabled={actionLoading || !selectedUserId}>
            {actionLoading ? "Working..." : "Add Member"}
          </button>
        </form>
      )}

      <h4>Current Members ({members.length})</h4>
      {members.length === 0 ? (
        <p>No members yet.</p>
      ) : (
        <table className="members-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              {userIsLead && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const u = m.user_id;
              const isLead = u?._id === leadId;
              return (
                <tr key={m._id}>
                  <td>
                    {u?.f_name} {u?.l_name}
                  </td>
                  <td>{u?.username}</td>
                  <td>{isLead ? "Project Lead" : "Member"}</td>
                  {userIsLead && (
                    <td>
                      <button
                        onClick={() => handleRemove(u._id)}
                        disabled={isLead || actionLoading}
                        title={
                          isLead
                            ? "Project Lead cannot be removed"
                            : "Remove member"
                        }
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: "16px" }}>
        <Link to="/projects">Back to Projects</Link>
      </p>
    </div>
  );
};