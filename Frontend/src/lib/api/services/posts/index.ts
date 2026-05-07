// Posts service
import { apiFetch } from '../../client'
import type {
  PostResponse,
  PostRequest,
  CommentResponse,
  CommentRequest,
  ReactionResponse,
  ReactionSummaryResponse,
  ReactionRequest,
} from '../../types/posts'
import type { PageResponse } from '../../types/common'

export const postApi = {
  getFeed: (page = 0, size = 20) =>
    apiFetch<PageResponse<PostResponse>>(`/posts/feed?page=${page}&size=${size}`),

  getByAuthor: (authorId: string, page = 0, size = 20) =>
    apiFetch<PageResponse<PostResponse>>(`/posts/author/${authorId}?page=${page}&size=${size}`),

  getByTeam: (teamId: string, page = 0, size = 20) =>
    apiFetch<PageResponse<PostResponse>>(`/posts/team/${teamId}?page=${page}&size=${size}`),

  getByDepartment: (departmentId: string, page = 0, size = 20) =>
    apiFetch<PageResponse<PostResponse>>(
      `/posts/department/${departmentId}?page=${page}&size=${size}`
    ),

  getById: (postId: string) => apiFetch<PostResponse>(`/posts/${postId}`),

  create: (data: PostRequest) =>
    apiFetch<PostResponse>('/posts', { method: 'POST', body: JSON.stringify(data) }),

  update: (postId: string, data: PostRequest) =>
    apiFetch<PostResponse>(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (postId: string) => apiFetch<void>(`/posts/${postId}`, { method: 'DELETE' }),
}

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
}

export const reactionApi = {
  reactToPost: (postId: string, data: ReactionRequest) =>
    apiFetch<ReactionResponse | null>(`/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPostReactions: (postId: string) =>
    apiFetch<ReactionSummaryResponse>(`/posts/${postId}/reactions`),

  reactToComment: (postId: string, commentId: string, data: ReactionRequest) =>
    apiFetch<ReactionResponse | null>(`/posts/${postId}/comments/${commentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCommentReactions: (postId: string, commentId: string) =>
    apiFetch<ReactionSummaryResponse>(`/posts/${postId}/comments/${commentId}/reactions`),
}
