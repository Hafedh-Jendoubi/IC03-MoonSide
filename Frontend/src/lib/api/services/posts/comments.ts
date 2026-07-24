import { apiFetch } from '../../client'
import type { CommentResponse, CommentRequest } from '../../types/posts'
import type { PageResponse } from '../../types/common'

export const commentApi = {
  getComments: (postId: string, page = 0, size = 20) =>
    apiFetch<PageResponse<CommentResponse>>(`/posts/${postId}/comments?page=${page}&size=${size}`),

  getReplies: (postId: string, commentId: string, page = 0, size = 20) =>
    apiFetch<PageResponse<CommentResponse>>(
      `/posts/${postId}/comments/${commentId}/replies?page=${page}&size=${size}`
    ),

  addComment: (postId: string, data: CommentRequest) =>
    apiFetch<CommentResponse>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateComment: (postId: string, commentId: string, data: CommentRequest) =>
    apiFetch<CommentResponse>(`/posts/${postId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteComment: (postId: string, commentId: string) =>
    apiFetch<void>(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),

  /** Every comment authored by this user, across all posts — used by the profile activity feed. */
  getByAuthor: (authorId: string, page = 0, size = 20) =>
    apiFetch<PageResponse<CommentResponse>>(
      `/posts/comments/author/${authorId}?page=${page}&size=${size}`
    ),
}
