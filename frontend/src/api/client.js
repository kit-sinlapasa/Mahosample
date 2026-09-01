import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const baseURL =
  configuredBaseUrl && !configuredBaseUrl.startsWith("http")
    ? `https://${configuredBaseUrl}`
    : configuredBaseUrl;

export const apiClient = axios.create({
  baseURL,
});
