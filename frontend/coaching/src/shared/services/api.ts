import axios from "axios";
import { getToken } from "./auth";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const API = axios.create({
  baseURL: apiBaseUrl,
});

API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
