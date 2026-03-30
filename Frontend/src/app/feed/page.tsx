'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { Post } from '@/lib/types'
import { User } from '@/lib/types'
import { userApi } from '@/lib/api'

export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})

  // Fetch all users once for author resolution in PostCard
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await userApi.getAll()
        const map: Record<string, User> = {}
        allUsers.forEach((u) => {
          map[u.id] = u
        })
        setUsersMap(map)
      } catch (err) {
        console.error('Failed to fetch users', err)
      }
    }
    fetchUsers()
  }, [])

  // Load posts from localStorage (post service not yet implemented)
  useEffect(() => {
    const storedPosts = localStorage.getItem('posts')
    if (storedPosts) {
      try {
        setPosts(JSON.parse(storedPosts))
      } catch {
        console.error('Failed to parse stored posts')
      }
    }
  }, [])

  const handlePostCreate = (content: string) => {
    const newPost: Post = {
      id: Date.now().toString(),
      authorId: user!.id,
      content,
      timestamp: new Date(),
      likes: [],
      comments: [],
    }
    const updatedPosts = [newPost, ...posts]
    setPosts(updatedPosts)
    localStorage.setItem('posts', JSON.stringify(updatedPosts))
  }

  const handleLike = (postId: string) => {
    const updatedPosts = posts.map((post) => {
      if (post.id !== postId) return post
      const hasLiked = post.likes.includes(user!.id)
      return {
        ...post,
        likes: hasLiked ? post.likes.filter((id) => id !== user!.id) : [...post.likes, user!.id],
      }
    })
    setPosts(updatedPosts)
    localStorage.setItem('posts', JSON.stringify(updatedPosts))
  }

  if (!user) return null

  return (
    <AuthLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="animate-fade-in mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">Your Feed</h1>
          <p className="text-muted-foreground">Stay connected with your team</p>
        </div>

        {/* Create Post */}
        <CreatePost user={user} onPostCreate={handlePostCreate} />

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post, index) => (
            <div key={post.id} style={{ animation: `slide-up 0.3s ease-out ${index * 50}ms` }}>
              <PostCard
                post={post}
                currentUserId={user.id}
                onLike={handleLike}
                usersMap={usersMap}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">📝</div>
            <h2 className="text-foreground mb-2 text-xl font-semibold">No posts yet</h2>
            <p className="text-muted-foreground">Be the first to share something with your team!</p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
