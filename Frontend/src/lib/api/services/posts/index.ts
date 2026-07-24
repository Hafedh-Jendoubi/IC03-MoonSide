// Posts service
export { attachmentApi } from './attachments'
export { savedPostApi } from './posts'
import { apiFetch } from '../../client'
import type {
  PostResponse,
  PostRequest,
  CommentResponse,
  CommentRequest,
  ReactionResponse,
  ReactionSummaryResponse,
  ReactionRequest,
  SurveyResponse,
  SurveyVoteRequest,
} from '../../types/posts'
import type { PageResponse } from '../../types/common'

export const postApi = {
  getFeed: (page = 0, size = 20) =>
    apiFetch<PageResponse<PostResponse>>(`/posts/feed?page=${page}&size=${size}`),

  getFollowingFeed: (page = 0, size = 20) =>
    apiFetch<PageResponse<PostResponse>>(`/posts/feed/following?page=${page}&size=${size}`),

  getConnectionsFeed: (page = 0, size = 20) =>
    apiFetch<PageResponse<PostResponse>>(`/posts/feed/connections?page=${page}&size=${size}`),

  /**
   * The main home feed: posts from followed/joined departments and teams,
   * plus posts from accepted connections, plus the user's own posts —
   * merged and sorted newest-first server-side.
   */
  getPersonalizedFeed: (page = 0, size = 20) =>
    apiFetch<PageResponse<PostResponse>>(`/posts/feed/personalized?page=${page}&size=${size}`),

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

  togglePin: (postId: string) =>
    apiFetch<PostResponse>(`/posts/${postId}/pin`, { method: 'PATCH' }),

  delete: (postId: string) => apiFetch<void>(`/posts/${postId}`, { method: 'DELETE' }),
}

export const surveyApi = {
  vote: (postId: string, data: SurveyVoteRequest) =>
    apiFetch<SurveyResponse>(`/posts/${postId}/survey/vote`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
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

  /** Every comment authored by this user, across all posts — used by the profile activity feed. */
  getByAuthor: (authorId: string, page = 0, size = 20) =>
    apiFetch<PageResponse<CommentResponse>>(
      `/posts/comments/author/${authorId}?page=${page}&size=${size}`
    ),
}

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
