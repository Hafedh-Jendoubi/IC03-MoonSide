// Matches the backend UserResponse DTO from User-Service
export interface User {
  id: string
  roleId: string | null
  email: string
  firstName: string
  lastName: string
  birthDate: string | null
  phoneNumber: string | null
  jobTitle: string | null
  bio: string | null
  avatar: string | null
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

// Computed helper — use wherever a display name is needed
export function getFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim()
}

// Post types — kept for future post service integration
export interface Post {
  id: string
  authorId: string
  content: string
  timestamp: Date
  likes: string[]
  comments: Comment[]
}

export interface Comment {
  id: string
  authorId: string
  content: string
  timestamp: Date
  likes: string[]
}

export interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'mention'
  message: string
  read: boolean
  timestamp: Date
}

export interface Message {
  id: string
  senderId: string
  recipientId: string
  content: string
  timestamp: Date
  read: boolean
}
