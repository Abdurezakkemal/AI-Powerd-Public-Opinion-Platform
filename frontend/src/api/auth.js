import { apiClient } from "./client";

export const authApi = {
  login(email, password) {
    return apiClient.post("/auth/login", { email, password });
  },
};
