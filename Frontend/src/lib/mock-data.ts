import { User, Post, Notification } from './types'

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@company.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    title: 'Senior Product Manager',
    department: 'Product',
    bio: 'Leading innovative product strategies. Coffee enthusiast.',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    title: 'Lead Designer',
    department: 'Design',
    bio: 'Design systems and UX/UI. Always learning.',
  },
  {
    id: '3',
    name: 'Marcus Williams',
    email: 'marcus.williams@company.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    title: 'Engineering Manager',
    department: 'Engineering',
    bio: 'Building scalable systems. Tech speaker.',
  },
  {
    id: '4',
    name: 'Emma Davis',
    email: 'emma.davis@company.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    title: 'Data Scientist',
    department: 'Analytics',
    bio: 'Data-driven insights. Machine learning enthusiast.',
  },
  {
    id: '5',
    name: 'David Park',
    email: 'david.park@company.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    title: 'Marketing Manager',
    department: 'Marketing',
    bio: 'Growth marketing and storytelling.',
  },
]

export const mockPosts: Post[] = [
  {
    id: '1',
    authorId: '1',
    content:
      'Excited to announce our new product launch next week! 🚀 This has been a long journey and I cannot wait to share it with everyone.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likes: ['2', '3', '4'],
    comments: [
      {
        id: 'c1',
        authorId: '2',
        content: "This is amazing! Can't wait to see what you've built.",
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        likes: ['1', '3'],
      },
      {
        id: 'c2',
        authorId: '4',
        content: 'Congratulations on the launch! Looking forward to it.',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        likes: ['1'],
      },
    ],
  },
  {
    id: '2',
    authorId: '2',
    content:
      'Just finished the design system overhaul. Huge thanks to the entire team for the collaboration! The consistency across products is now much better.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    likes: ['1', '3', '5'],
    comments: [
      {
        id: 'c3',
        authorId: '3',
        content: 'The new design system looks incredible. Great work!',
        timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
        likes: ['2', '4'],
      },
    ],
  },
  {
    id: '3',
    authorId: '3',
    content:
      'Our backend services are now 40% faster after the recent optimization. Performance matters! 📊',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    likes: ['1', '2', '4', '5'],
    comments: [],
  },
  {
    id: '4',
    authorId: '4',
    content:
      'New quarterly insights just released: user engagement is up 25% month-over-month. Huge milestone for our team!',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    likes: ['1', '2', '3', '5'],
    comments: [
      {
        id: 'c4',
        authorId: '5',
        content: 'Outstanding results! This is fantastic news for the company.',
        timestamp: new Date(Date.now() - 7.5 * 60 * 60 * 1000),
        likes: ['1', '2'],
      },
    ],
  },
  {
    id: '5',
    authorId: '5',
    content:
      'Just wrapped up our annual company summit! Great discussions about the future direction. Thanks everyone for the amazing energy!',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
    likes: ['1', '2', '3', '4'],
    comments: [],
  },
]

export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'like',
    message: 'Sarah Chen liked your post',
    read: false,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '2',
    userId: '1',
    type: 'comment',
    message: 'Marcus Williams commented on your post',
    read: false,
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: '3',
    userId: '1',
    type: 'mention',
    message: 'Emma Davis mentioned you in a post',
    read: true,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
]
