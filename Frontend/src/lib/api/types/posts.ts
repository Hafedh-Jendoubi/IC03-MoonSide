export type PostType =
  | 'ANNOUNCEMENT'
  | 'UPDATE'
  | 'QUESTION'
  | 'DISCUSSION'
  | 'EVENT'
  | 'ACHIEVEMENT'

export type PostVisibility = 'PUBLIC' | 'PRIVATE' | 'TEAM_ONLY' | 'DEPARTMENT_ONLY' | 'DRAFT'
export type ClientPostVisibility = 'PUBLIC' | 'PRIVATE'

export interface AttachmentResponse {
  id: string
  url: string
  fileName: string
  fileType: string
  fileSize: number
}

export interface PostResponse {
  id: string
  authorId: string
  teamId: string | null
  departmentId: string | null
  updatedBy: string | null
  content: string
  postType: PostType
  postVisibility: PostVisibility
  isPinned: boolean
  isAIGenerated: boolean
  viewCount: number
  commentCount: number
  reactionCount: number
  attachments: AttachmentResponse[]
  createdAt: string
  updatedAt: string
}

export interface PostRequest {
  content: string
  postType?: PostType
  postVisibility?: ClientPostVisibility
  teamId?: string
  departmentId?: string
  isPinned?: boolean
  isAIGenerated?: boolean
}

export interface CommentResponse {
  id: string
  authorId: string
  postId: string
  content: string
  postVisibility: PostVisibility
  isPinned: boolean
  isEdited: boolean
  parentId: string | null
  reactionCount: number
  replyCount: number
  createdAt: string
  updatedAt: string
}

export interface CommentRequest {
  content: string
  postVisibility?: PostVisibility
  parentId?: string
}

export interface ReactionTypeResponse {
  id: string
  code: string
  label: string
  emoji: string
}

export interface ReactionResponse {
  id: string
  userId: string
  reactionTypeId: string
  reactionTypeCode: string
  reactionTypeEmoji: string
  reactableType: string
  reactableId: string
  createdAt: string
}

export interface ReactionSummaryResponse {
  total: number
  byEmoji: Record<string, number>
  userReaction: ReactionResponse | null
}

export interface ReactionRequest {
  reactionTypeCode: string
}
