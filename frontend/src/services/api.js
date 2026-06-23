import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  timeout: 15000,
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
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    const errorData = error.response?.data || {
      success: false,
      code: "NETWORK_ERROR",
      message: error.message
    };
    return Promise.reject(errorData);
  },
);

export const financialAPI = {
  getExecutiveSummary: () => api.get("/financial/summary/executive"),
  getPapSummary: (planId) => api.get("/financial/summary/pap", { params: { plan_id: planId } }),
  getPapDetail: (params) => api.get("/financial/pap-detail", { params }),
  getBudgetRegistry: () => api.get("/financial/registry"),
  getFilters: () => api.get("/financial/filters"),
};

export const dashboardAPI = {
  getExecutiveSummary: (planId) => api.get("/dashboard/executive-summary", { params: { plan_id: planId } }),
  getAuditFeed: (planId) => api.get("/dashboard/audit-feed", { params: { plan_id: planId } }),
  getRecentTransactions: (planId) => api.get("/dashboard/recent-transactions", { params: { plan_id: planId } }),
};

export const mooeAPI = {
  getAll: (filters) => api.get("/mooe", { params: filters }),
  getById: (id) => api.get(`/mooe/${id}`),
  createPlanWithMOOE: (data) => api.post("/mooe", data),
  update: (id, data) => api.put(`/mooe/${id}`, data),
  delete: (id) => api.delete(`/mooe/${id}`),
  deleteByPlanId: (planId) => api.delete(`/mooe/plan/${planId}`),
  getDistinctValues: (field, filters) => api.get(`/mooe/distinct/${field}`, { params: filters }),
};

export const psAPI = {
  getAll: (filters) => api.get("/ps", { params: filters }),
  getById: (id) => api.get(`/ps/${id}`),
  createPlanWithPS: (data) => api.post("/ps", data),
  update: (id, data) => api.put(`/ps/${id}`, data),
  delete: (id) => api.delete(`/ps/${id}`),
  getDistinctValues: (field) => api.get(`/ps/distinct/${field}`),
};

export const prAPI = {
  getAll: () => api.get("/pr"),
  getMOOE: () => api.get("/pr/mooe"),
  getWithBalance: () => api.get("/pr/mooe-balance"),
  getByMOOEId: (id) => api.get(`/pr/mooe/${id}`),
  getNextNo: (year, month) => api.get("/pr/next-no", { params: { year, month } }),
  create: (data) => api.post("/pr", data),
  update: (id, data) => api.put(`/pr/${id}`, data),
  delete: (id) => api.delete(`/pr/${id}`),
  submit: (id) => api.post(`/pr/${id}/submit`),
  approve: (id) => api.post(`/pr/${id}/approve`),
  reject: (id, remarks) => api.post(`/pr/${id}/reject`, { remarks }),
  updateUnobligatedAmount: (prno, data) => api.put(`/pr/unobligated/${prno}`, data),
};

export const obligationAPI = {
  getAll: () => api.get("/obligation"),
  getMOOE: () => api.get("/obligation/mooe"),
  getNextNo: (year, month) => api.get("/obligation/next-no", { params: { year, month } }),
  create: (data) => api.post("/obligation", data),
  update: (id, data) => api.put(`/obligation/${id}`, data),
  delete: (id) => api.delete(`/obligation/${id}`),
};

export const monitoringAPI = {
  getOverview: () => api.get("/monitoring/overview"),
};

export const reportAPI = {
  getStandard: () => api.get("/reports/standard"),
};

export const aiAPI = {
  getContext: () => api.get("/ai/context"),
};

export const healthCheck = () => api.get("/health");

export default api;
