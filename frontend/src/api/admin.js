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
};
