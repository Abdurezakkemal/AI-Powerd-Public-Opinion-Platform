import { apiClient } from "./client";

export const analyticsApi = {
  summary(policyId, params = {}) {
    return apiClient.get(`/analytics/${policyId}`, { params });
  },
  comments(policyId, params = {}) {
    return apiClient.get(`/analytics/${policyId}/comments`, { params });
  },
  async exportCsv(policyId, params = {}) {
    const response = await apiClient.get(`/analytics/${policyId}/export`, {
      params,
      responseType: "blob",
    });
    return response;
  },
};
