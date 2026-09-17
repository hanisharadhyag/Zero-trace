import axios from "axios";

const API = "http://127.0.0.1:8000/api";

const getAuthToken = () => {
  return (
    localStorage.getItem("zero_trace_token") ||
    sessionStorage.getItem("zero_trace_token")
  );
};

const axiosInstance = axios.create({
  baseURL: API,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ======================================================
// Authentication
// ======================================================

export const loginUser = async (email, password) => {
  const response = await axiosInstance.post("/auth/login", { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

// ======================================================
// Upload Configuration
// ======================================================

export const uploadConfig = async (formData) => {
  const response = await axiosInstance.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// ======================================================
// Dashboard
// ======================================================

export const getDevice = async () => {
  const res = await axiosInstance.get("/device");
  return res.data;
};

export const getRiskScore = async () => {
  const res = await axiosInstance.get("/risk-score");
  return res.data;
};

// ======================================================
// Configuration Drift
// ======================================================

export const compareDrift = async (payload) => {
  const res = await axiosInstance.post("/drift/compare", payload);
  return res.data;
};

export const getDeviceVersions = async (hostname) => {
  const res = await axiosInstance.get(`/drift/versions/${encodeURIComponent(hostname)}`);
  return res.data;
};

// ======================================================
// Zero Trust File Access & Audit
// ======================================================

export const getZeroTrustStatus = async () => {
  const res = await axiosInstance.get("/zero-trust/status");
  return res.data;
};

export const getAuditLogs = async () => {
  const res = await axiosInstance.get("/zero-trust/audit");
  return res.data;
};

export const getProjectFiles = async () => {
  const res = await axiosInstance.get("/zero-trust/files");
  return res.data;
};

export const viewSanitizedFile = async (fileId) => {
  const res = await axiosInstance.get(`/zero-trust/files/${fileId}/view`);
  return res.data;
};

export const deleteProtectedFile = async (fileId) => {
  const res = await axiosInstance.delete(`/zero-trust/files/${fileId}`);
  return res.data;
};

// ======================================================
// Findings
// ======================================================

export const getFindings = async () => {
  const res = await axiosInstance.get("/findings");
  return res.data;
};

// ======================================================
// Attack Path
// ======================================================

export const getAttackPath = async () => {
  const res = await axiosInstance.get("/attack-path");
  return res.data;
};

// ======================================================
// AI Copilot
// ======================================================

export const askCopilot = async (message) => {
  const res = await axiosInstance.post("/copilot", {
    question: message,
  });

  return res.data;
};

// ======================================================
// Executive Report
// ======================================================

export const getReport = async () => {
  const res = await axiosInstance.get("/report");
  return res.data;
};

// ======================================================
// Reset Session
// ======================================================

export const resetSession = async () => {
  const res = await axiosInstance.delete("/reset");
  return res.data;
};
