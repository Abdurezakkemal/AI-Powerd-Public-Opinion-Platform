import { apiClient } from "./client";

export const userApi = {
  me() {
    return apiClient.get("/users/me");
  },
};
