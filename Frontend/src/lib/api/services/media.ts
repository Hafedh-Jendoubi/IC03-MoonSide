import { apiFetch, tokenStorage } from '../client'
import type { MediaResponse } from '../types/media'
import type { ApiResponse } from '../types/common'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

/**
 * Upload a file to the Media-Service.
 * Uses a raw fetch (not apiFetch) so we can send multipart/form-data
 * without the Content-Type: application/json header override.
 */
async function uploadFile(path: string, formData: FormData): Promise<MediaResponse> {
  const token = tokenStorage.getAccessToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Upload failed: ${res.status}`)
  }

  const body: ApiResponse<MediaResponse> = await res.json()
  return body.data
}

export const mediaApi = {
  /**
   * Upload any file. Returns the stored metadata including the public URL.
   * @param file     The File object from an <input type="file">
   * @param context  Logical context tag: AVATAR | POST_ATTACHMENT | GENERAL
   */
  upload: (file: File, context: string = 'GENERAL'): Promise<MediaResponse> => {
    const form = new FormData()
    form.append('file', file)
    form.append('context', context)
    return uploadFile('/media/upload', form)
  },

  getById: (id: string) => apiFetch<MediaResponse>(`/media/${id}`),
}
