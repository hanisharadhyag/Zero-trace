import axios from "axios";

const API = "http://127.0.0.1:8000/api";

// ======================================================
// Upload Configuration
// ======================================================

export const uploadConfig = async (formData) => {
  const response = await axios.post(`${API}/upload`, formData, {
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
  const res = await axios.get(`${API}/device`);
  return res.data;
};

export const getRiskScore = async () => {
  const res = await axios.get(`${API}/risk-score`);
  return res.data;
};

// ======================================================
// Findings
// ======================================================

export const getFindings = async () => {
  const res = await axios.get(`${API}/findings`);
  return res.data;
};

// ======================================================
// Attack Path
// ======================================================

export const getAttackPath = async () => {
  const res = await axios.get(`${API}/attack-path`);
  return res.data;
};

// ======================================================
// AI Copilot
// ======================================================

export const askCopilot = async (message) => {
  const res = await axios.post(`${API}/copilot`, {
    question: message,
  });

  return res.data;
};

// ======================================================
// Executive Report
// ======================================================

export const getReport = async () => {
  const res = await axios.get(`${API}/report`);
  return res.data;
};

// ======================================================
// Reset Session
// ======================================================

export const resetSession = async () => {
  const res = await axios.delete(`${API}/reset`);
  return res.data;
};
