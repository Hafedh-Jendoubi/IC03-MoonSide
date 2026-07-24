import { apiFetch, tokenStorage } from '../../client'
import type { AttachmentResponse } from '../../types/posts'
import type { ApiResponse } from '../../types/common'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const attachmentApi = {
  /**
   * Upload a file and attach it to a post.
   * Accepts any file up to 500 MB (limit set on the server side).
   * Optionally accepts an onProgress callback to track upload progress.
   */
  upload: (
    postId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AttachmentResponse> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100
            onProgress(percentComplete)
          }
        })
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 201 || xhr.status === 200) {
          try {
            const response: ApiResponse<AttachmentResponse> = JSON.parse(xhr.responseText)
            resolve(response.data)
          } catch (e) {
            reject(new Error('Failed to parse upload response'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.message || `Upload failed: ${xhr.status}`))
          } catch {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: network error'))
      })

      // Handle abort
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'))
      })

      // Setup and send request
      const formData = new FormData()
      formData.append('file', file)

      const token = tokenStorage.getAccessToken()
      xhr.open('POST', `${API_BASE_URL}/posts/${postId}/attachments`)
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }
      xhr.send(formData)
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
