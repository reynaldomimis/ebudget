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
  getBudgetRegistry: (planId) => api.get("/financial/registry", { params: { plan_id: planId } }),
  getFilters: (params) => api.get("/financial/filters", { params }),
  getBalance: (id, type) => api.get("/financial/balance", { params: { id, type } }),
};

export const dashboardAPI = {
  getExecutiveSummary: (planId) => api.get("/dashboard/executive-summary", { params: { plan_id: planId } }),
  getAuditFeed: (planId) => api.get("/dashboard/audit-feed", { params: { plan_id: planId } }),
  getRecentTransactions: (planId) => api.get("/dashboard/recent-transactions", { params: { plan_id: planId } }),
};

export const mooeAPI = {
  createPlanWithMOOE: (data) => api.post("/mooe", data),
  update: (id, data) => api.put(`/mooe/${id}`, data),
  delete: (id) => api.delete(`/mooe/${id}`),
  deleteByPlanId: (planId) => api.delete(`/mooe/plan/${planId}`),
};

export const psAPI = {
  createPlanWithPS: (data) => api.post("/ps", data),
  update: (id, data) => api.put(`/ps/${id}`, data),
  delete: (id) => api.delete(`/ps/${id}`),
};

export const prAPI = {
  getNextNo: (year, month) => api.get("/pr/next-no", { params: { year, month } }),
  create: (data) => api.post("/pr", data),
  getById: (id) => api.get(`/pr/${id}`),
  update: (id, data) => api.put(`/pr/${id}`, data),
  delete: (id) => api.delete(`/pr/${id}`),
  submit: (id) => api.post(`/pr/${id}/submit`),
  approve: (id) => api.post(`/pr/${id}/approve`),
  finalize: (id) => api.post(`/pr/${id}/finalize`),
  reject: (id, remarks) => api.post(`/pr/${id}/reject`, { remarks }),
};

export const obligationAPI = {
  getNextNo: (year, month) => api.get("/obligation/next-no", { params: { year, month } }),
  create: (data) => api.post("/obligation", data),
  update: (id, data) => api.put(`/obligation/${id}`, data),
  delete: (id) => api.delete(`/obligation/${id}`),
};

export const monitoringAPI = {
  getOverview: (planId) => api.get("/monitoring/overview", { params: { plan_id: planId } }),
  getPRs: () => api.get("/monitoring/prs"),
  getObligations: () => api.get("/monitoring/obligations"),
};

export const reportAPI = {
  getStandard: () => api.get("/reports/standard"),
};

export const aiAPI = {
  getContext: () => api.get("/ai/context"),
};

export const healthCheck = () => api.get("/health");

export default api;
