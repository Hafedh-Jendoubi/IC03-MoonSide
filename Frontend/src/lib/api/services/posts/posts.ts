import { apiFetch } from '../../client'
import type { PostResponse, PostRequest } from '../../types/posts'
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
