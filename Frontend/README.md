# Connect - Corporate Social Network

A professional internal employee collaboration platform built with Next.js 16, TypeScript, and Tailwind CSS. Inspired by Yammer/Viva Engage with smooth animations and polished interfaces.

## Features

### 🔐 Authentication
- Login and signup forms with email-based authentication
- Demo accounts for testing
- Session persistence with localStorage
- Protected routes with automatic redirect

### 📱 Navbar
- Fixed navigation header with Feed, Messages, and Notifications
- Search functionality
- Notification badge with unread count
- User avatar dropdown menu with:
  - Profile view
  - Settings access
  - Sign out

### 📰 Feed
- Create posts with smooth animations
- Like and comment on posts
- Expandable comment threads
- Real-time post interactions
- Staggered post loading animations

### 👤 User Profile
- Profile cover image
- User information and stats
- Bio and department details
- Connection and activity statistics
- Action buttons to connect with others

### 💬 Messages
- Conversation list with search
- Message preview
- User avatars and status
- Ready for real-time messaging integration

### 🔔 Notifications
- Activity notifications (likes, comments, mentions)
- Notification icons and badges
- Mark as read functionality
- Delete notifications
- Animation-driven UI

### ⚙️ Settings
- Profile management
- Notification preferences
- Privacy controls
- Display options
- Security settings

## Demo Accounts

Login with any of these demo accounts (password can be anything):

- **alex.johnson@company.com** - Senior Product Manager
- **sarah.chen@company.com** - Lead Designer
- **marcus.williams@company.com** - Engineering Manager
- **emma.davis@company.com** - Data Scientist
- **david.park@company.com** - Marketing Manager

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS with custom theme
- **UI Components**: shadcn/ui
- **State Management**: React Context API + localStorage
- **Icons**: Lucide React
- **Animations**: Custom CSS animations

## Color Scheme

- **Primary**: Modern Blue (oklch(0.45 0.25 270))
- **Secondary**: Sky Blue (oklch(0.6 0.15 200))
- **Background**: Clean White (oklch(0.98 0.001 0))
- **Foreground**: Deep Navy (oklch(0.15 0.01 280))
- **Muted**: Light Gray (oklch(0.92 0.01 280))

## Animations

Smooth transitions throughout the app:
- **Slide Down**: Dropdown menus and notifications
- **Slide Up**: Post feed and expandable content
- **Fade In**: Page load effects
- **Scale In**: Modal and card appearances
- **Pulse Glow**: Active notifications and badges

## Project Structure

```
app/
├── layout.tsx                 # Root layout with auth provider
├── page.tsx                   # Home redirect
├── login/page.tsx             # Login page
├── signup/page.tsx            # Signup page
├── feed/page.tsx              # Main feed
├── profile/[id]/page.tsx      # User profile
├── messages/page.tsx          # Messages hub
├── notifications/page.tsx     # Notifications center
└── settings/page.tsx          # User settings

components/
├── navbar.tsx                 # Top navigation bar
├── auth-layout.tsx            # Protected layout wrapper
├── create-post.tsx            # Post composition form
└── post-card.tsx              # Individual post component

lib/
├── types.ts                   # TypeScript interfaces
├── mock-data.ts               # Demo data
└── auth-context.tsx           # Authentication context
```

## Getting Started

1. The app automatically redirects to the login page if not authenticated
2. Use any demo account to sign in
3. Explore the feed, create posts, and interact with other users
4. Check your profile, messages, and notifications

## Future Enhancements

- Real-time messaging with WebSockets
- File uploads and media sharing
- Search across posts and users
- Following/follower system
- Hashtags and trending topics
- Dark mode support
- Mobile-optimized responsive design improvements
- Advanced notification filtering

## Notes

- Data is stored in localStorage for demo purposes
- Posts and interactions persist during the session
- Logging out clears all user data
- The messaging section is ready for WebSocket integration
