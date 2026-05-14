import { apiFetch } from '../../client'
import type { AttachmentResponse } from '../../types/posts'

export const attachmentApi = {
  /**
   * Upload a file and attach it to a post.
   * Accepts any file up to 500 MB (limit set on the server side).
   */
  upload: (postId: string, file: File): Promise<AttachmentResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    return apiFetch<AttachmentResponse>(`/posts/${postId}/attachments`, {
      method: 'POST',
      body: formData,
    })
  },

  /**
   * List all attachments for a given post.
   */
  list: (postId: string): Promise<AttachmentResponse[]> =>
    apiFetch<AttachmentResponse[]>(`/posts/${postId}/attachments`),

  /**
   * Delete a single attachment. Only the uploader is authorised.
   */
  delete: (postId: string, attachmentId: string): Promise<void> =>
    apiFetch<void>(`/posts/${postId}/attachments/${attachmentId}`, { method: 'DELETE' }),
}
