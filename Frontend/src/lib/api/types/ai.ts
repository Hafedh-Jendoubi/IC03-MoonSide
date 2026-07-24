export type AiTone = 'PROFESSIONAL' | 'FRIENDLY' | 'CONCISE' | 'ENTHUSIASTIC' | 'FORMAL'

export interface GrammarFixRequest {
  text: string
}

export interface GrammarFixResponse {
  original: string
  corrected: string
  changed: boolean
}

export interface RewriteRequest {
  text: string
  tone?: AiTone
}

export interface RewriteResponse {
  original: string
  rewritten: string
  tone: AiTone
}

export interface GenerateRequest {
  topic: string
  postType?: string
  tone?: AiTone
}

export interface GenerateResponse {
  generated: string
}

export interface CommentSuggestionsRequest {
  postContent: string
  postType?: string
  count?: number
}

export interface CommentSuggestionsResponse {
  suggestions: string[]
}
