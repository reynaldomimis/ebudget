import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// // Plan Info API calls
// export const planInfoAPI = {
//   getAll: () => api.get("/plan-info"),
//   getById: (id) => api.get(`/plan-info/${id}`),
//   getByPlanId: (planId) => api.get(`/plan-info/plan/${planId}`),
//   create: (data) => api.post("/plan-info", data),
//   update: (id, data) => api.put(`/plan-info/${id}`, data),
//   delete: (id) => api.delete(`/plan-info/${id}`),
// };

// Activities API calls
// export const activitiesAPI = {
//   getAll: () => api.get("/activities"),
//   getById: (id) => api.get(`/activities/${id}`),
//   getByPlanId: (planId) => api.get(`/activities/plan/${planId}`),
//   create: (data) => api.post("/activities", data),
//   createPlanWithActivities: (data) => api.post("/activities", data), // Uses the same endpoint as create
//   createBulk: (activities) => api.post("/activities/bulk", { activities }),
//   update: (id, data) => api.put(`/activities/${id}`, data),
//   delete: (id) => api.delete(`/activities/${id}`),
//   deleteByPlanId: (planId) => api.delete(`/activities/plan/${planId}`),
//   // Dynamic querying methods
//   getByKey: (key, value) =>
//     api.get(`/activities/key/${key}?value=${encodeURIComponent(value)}`),
//   getByFilters: (filters) =>
//     api.get("/activities/filters", { params: filters }),
//   getDistinctValues: (field) => api.get(`/activities/distinct/${field}`),
// };

// Activities API calls
export const activitiesAPI = {
  getAll: () => api.get("/activities"),
  getById: (id) => api.get(`/activities/${id}`),
  getByPlanId: (planId) => api.get(`/activities/plan/${planId}`),
  createPlanWithActivities: (data) => api.post("/activities", data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  updateTotalFq: (id, totalFq) =>
    api.put(`/activities/${id}/total-fq`, { totalFq }),
  delete: (id) => api.delete(`/activities/${id}`),
  deleteByPlanId: (planId) => api.delete(`/activities/plan/${planId}`),
  getDistinctValues: (field) => api.get(`/activities/distinct/${field}`),
};

// PR/SO API calls
export const prSoAPI = {
  getAll: () => api.get("/pr"),
  getActivity: () => api.get("/pr/activity"),
  getWithBalance: () => api.get("/pr/activity-balance"),
  getByRecordsId: (recordsId) => api.get(`/pr/records/${recordsId}`),
  getNextNo: (year, month) =>
    api.get("/pr/next-no", {
      params: { year, month },
    }),
  create: (data) => api.post("/pr", data),
  update: (id, data) => api.put(`/pr/${id}`, data),
  // updateUnobligatedAmount: (prno, obligated, unobligated) =>
  //   api.put(`/pr/unobligated/${prno}`, { obligated, unobligated }),
  updateUnobligatedAmount: (prno, data) =>
    api.put(`/pr/unobligated/${prno}`, data),
  delete: (id) => api.delete(`/pr/${id}`),
};

// Obligation API calls
export const obligationAPI = {
  getAll: () => api.get("/obligation"),
  getActivity: () => api.get("/obligation/activity"),
  getNextNo: (year, month) =>
    api.get("/obligation/next-no", {
      params: { year, month },
    }),
  create: (data) => api.post("/obligation", data),
  update: (id, data) => api.put(`/obligation/${id}`, data),
  delete: (id) => api.delete(`/obligation/${id}`),
};

// Health check
export const healthCheck = () => api.get("/health");

export default api;
