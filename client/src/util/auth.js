const KEY = "pa3_user";

export const setCurrentUser = (user) => {
  if (user) localStorage.setItem(KEY, JSON.stringify(user));
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};

export const clearCurrentUser = () => localStorage.removeItem(KEY);

export const isLeadOf = (project, user) => {
  if (!project || !user) return false;
  const lead = project.project_lead_id;
  const leadId = typeof lead === "string" ? lead : lead?._id;
  return leadId && user._id && leadId.toString() === user._id.toString();
};