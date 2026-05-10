import { apiClient } from "./client";

export const commentApi = {
  addToVote(voteId, text) {
    // POST /comments/:voteId
    return apiClient.post(`/comments/${voteId}`, { text });
  },
};
