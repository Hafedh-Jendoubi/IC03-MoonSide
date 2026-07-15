import { apiFetch } from '../client'
import type {
  CommentSuggestionsRequest,
  CommentSuggestionsResponse,
  GenerateRequest,
  GenerateResponse,
  GrammarFixRequest,
  GrammarFixResponse,
  RewriteRequest,
  RewriteResponse,
} from '../types/ai'

export const aiApi = {
  fixGrammar: (data: GrammarFixRequest) =>
    apiFetch<GrammarFixResponse>('/ai/grammar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  rewrite: (data: RewriteRequest) =>
    apiFetch<RewriteResponse>('/ai/rewrite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generate: (data: GenerateRequest) =>
    apiFetch<GenerateResponse>('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  suggestComments: (data: CommentSuggestionsRequest) =>
    apiFetch<CommentSuggestionsResponse>('/ai/comments/suggest', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
