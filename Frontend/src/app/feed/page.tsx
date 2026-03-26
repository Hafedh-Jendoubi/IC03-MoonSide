'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { Post } from '@/lib/types'
import { mockPosts } from '@/lib/mock-data'

export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>(mockPosts)

  useEffect(() => {
    const storedPosts = localStorage.getItem('posts')
    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts)
        
        const normalizedPosts = parsedPosts.map((post: any) => ({
          ...post,
          timestamp: new Date(post.timestamp),
          comments: post.comments.map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp),
          })),
        }))

        setPosts(normalizedPosts)
      } catch (e) {
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
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const hasLiked = post.likes.includes(user!.id)
        return {
          ...post,
          likes: hasLiked
            ? post.likes.filter(id => id !== user!.id)
            : [...post.likes, user!.id],
        }
      }
      return post
    })

    setPosts(updatedPosts)
    localStorage.setItem('posts', JSON.stringify(updatedPosts))
  }

  if (!user) return null

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Feed</h1>
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
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No posts yet</h2>
            <p className="text-muted-foreground">Be the first to share something with your team!</p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
