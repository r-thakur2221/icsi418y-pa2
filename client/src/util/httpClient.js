import axios from "axios";
import { getCurrentUser } from "./auth";

const BaseURL = process.env.REACT_APP_BASEURL;

const httpClient = axios.create({
  baseURL: BaseURL,
  headers: { "Content-Type": "application/json" },
});

// Attach the current user id as a header for ownership checks
httpClient.interceptors.request.use((config) => {
  const user = getCurrentUser();
  if (user?._id) {
    config.headers["x-user-id"] = user._id;
  }
  return config;
});

export default httpClient;