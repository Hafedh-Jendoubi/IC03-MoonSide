export interface User {
  id: string
  name: string
  email: string
  avatar: string
  title: string
  department: string
  bio: string
}

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
