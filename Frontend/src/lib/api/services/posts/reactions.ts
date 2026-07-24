import { apiFetch } from '../../client'
import type { ReactionResponse, ReactionSummaryResponse, ReactionRequest } from '../../types/posts'
import type { PageResponse } from '../../types/common'

export const reactionApi = {
  reactToPost: (postId: string, data: ReactionRequest) =>
    apiFetch<ReactionResponse | null>(`/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPostReactions: (postId: string) =>
    apiFetch<ReactionSummaryResponse>(`/posts/${postId}/reactions`),

  getPostReactors: (postId: string) =>
    apiFetch<ReactionResponse[]>(`/posts/${postId}/reactions/users`),

  reactToComment: (postId: string, commentId: string, data: ReactionRequest) =>
    apiFetch<ReactionResponse | null>(`/posts/${postId}/comments/${commentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCommentReactions: (postId: string, commentId: string) =>
    apiFetch<ReactionSummaryResponse>(`/posts/${postId}/comments/${commentId}/reactions`),

  getCommentReactors: (postId: string, commentId: string) =>
    apiFetch<ReactionResponse[]>(`/posts/${postId}/comments/${commentId}/reactions/users`),

  /** Every reaction (to posts and comments) made by this user — used by the profile activity feed. */
  getByUser: (userId: string, page = 0, size = 20) =>
    apiFetch<PageResponse<ReactionResponse>>(
      `/posts/reactions/user/${userId}?page=${page}&size=${size}`
    ),
}
