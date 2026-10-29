import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:8080/api");

export const BASEURL = import.meta.env.VITE_BASE_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:8080");
export const BASE_URL = BASEURL;

const clearAuthStorage = () => {
  ["token", "userId", "email", "role"].forEach((key) => localStorage.removeItem(key));
};

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default client;
