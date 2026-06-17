import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // window.location.href = "/login"; // This might cause infinite loops if not handled carefully
    }
    return Promise.reject(error);
  },
);

export const activitiesAPI = {
  getAll: (filters) => api.get("/activities", { params: filters }),
  getById: (id) => api.get(`/activities/${id}`),
  createPlanWithActivities: (data) => api.post("/activities", data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  delete: (id) => api.delete(`/activities/${id}`),
  deleteByPlanId: (planId) => api.delete(`/activities/plan/${planId}`),
  getDistinctValues: (field) => api.get(`/activities/distinct/${field}`),
};

export const prAPI = {
  getAll: () => api.get("/pr"),
  getActivity: () => api.get("/pr/activity"),
  getWithBalance: () => api.get("/pr/activity-balance"),
  getByActivityId: (id) => api.get(`/pr/records/${id}`),
  getNextNo: (year, month) => api.get("/pr/next-no", { params: { year, month } }),
  create: (data) => api.post("/pr", data),
  update: (id, data) => api.put(`/pr/${id}`, data),
  updateUnobligatedAmount: (prno, data) => api.put(`/pr/unobligated/${prno}`, data),
};

export const obligationAPI = {
  getAll: () => api.get("/obligation"),
  getActivity: () => api.get("/obligation/activity"),
  getNextNo: (year, month) => api.get("/obligation/next-no", { params: { year, month } }),
  create: (data) => api.post("/obligation", data),
};

export const healthCheck = () => api.get("/health");

export default api;
