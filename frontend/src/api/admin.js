import { apiClient } from "./client";

export const adminApi = {
  dashboardStats() {
    return apiClient.get("/admin/dashboard/stats");
  },
  listPlanners(params = {}) {
    return apiClient.get("/admin/planners", { params });
  },
  createPlanner(payload) {
    return apiClient.post("/admin/planners", payload);
  },
  updatePlanner(id, payload) {
    return apiClient.put(`/admin/planners/${id}`, payload);
  },
  setPlannerStatus(id, active) {
    return apiClient.put(`/admin/planners/${id}/status`, { active });
  },
  listCitizens(params = {}) {
    return apiClient.get("/admin/users/citizens", { params });
  },
  updateCitizenStatus(id, active) {
    return apiClient.put(`/admin/users/${id}/status`, { active });
  },
  initiatePasswordReset(id) {
    return apiClient.post(`/admin/users/${id}/initiate-password-reset`);
  },
  getPendingComments(params = {}) {
    return apiClient.get("/admin/comments/pending", { params });
  },
  getFlaggedComments(params = {}) {
    return apiClient.get("/admin/comments/flagged", { params });
  },
  updateComment(id, payload) {
    return apiClient.put(`/admin/comments/${id}`, payload);
  },
  retryComment(id) {
    return apiClient.post(`/admin/comments/${id}/retry`);
  },
  forceRetryComment(id) {
    return apiClient.post(`/admin/comments/${id}/force-retry`);
  },
  bulkRetryComments(commentIds, params = {}) {
    return apiClient.post("/admin/comments/bulk/retry-by-ids", { commentIds }, { params });
  },
  deleteComment(id) {
    return apiClient.delete(`/admin/comments/${id}`);
  },
  getTrends(params = {}) {
    return apiClient.get("/admin/trends", { params });
  },
  getAuditLogs(params = {}) {
    return apiClient.get("/admin/audit-logs", { params });
  },
  exportAuditLogs(params = {}) {
    return apiClient.get("/admin/audit-logs/export", {
      params,
      responseType: "blob",
    });
  },
  getAIHealth() {
    return apiClient.get("/admin/ai/health");
  },
};
