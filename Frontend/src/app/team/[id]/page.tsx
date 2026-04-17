'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Users } from 'lucide-react'
import { teamApi, TeamResponse } from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { useAuth } from '@/lib/auth-context'
import { Post, User } from '@/lib/types'

export default function TeamFeedPage() {
  const params = useParams()
  const { user } = useAuth()
  const teamId = params?.id as string

  const [team, setTeam] = useState<TeamResponse | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teamId) return

    const loadData = async () => {
      try {
        setLoading(true)
        const teamData = await teamApi.getById(teamId)

        setTeam(teamData)

        // Load posts from localStorage
        const storedPosts = localStorage.getItem(`team_posts_${teamId}`)
        if (storedPosts) {
          try {
            setPosts(JSON.parse(storedPosts))
          } catch {
            console.error('Failed to parse stored posts')
          }
        }
      } catch (e: any) {
        setError(e.message ?? 'Failed to load team')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [teamId])

  const handlePostCreate = (content: string) => {
    if (!user) return
    const newPost: Post = {
      id: Date.now().toString(),
      authorId: user.id,
      content,
      timestamp: new Date(),
      likes: [],
      comments: [],
    }
    const updatedPosts = [newPost, ...posts]
    setPosts(updatedPosts)
    localStorage.setItem(`team_posts_${teamId}`, JSON.stringify(updatedPosts))
  }

  const handleLike = (postId: string) => {
    if (!user) return
    const updatedPosts = posts.map((post) => {
      if (post.id !== postId) return post
      const hasLiked = post.likes.includes(user.id)
      return {
        ...post,
        likes: hasLiked ? post.likes.filter((id) => id !== user.id) : [...post.likes, user.id],
      }
    })
    setPosts(updatedPosts)
    localStorage.setItem(`team_posts_${teamId}`, JSON.stringify(updatedPosts))
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="text-primary h-12 w-12 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  if (error || !team) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h1 className="text-foreground text-2xl font-bold">Team not found</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </AuthLayout>
    )
  }

  if (!user) return null

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cover Banner */}
        <div className="from-primary/20 to-secondary/20 mb-6 h-48 rounded-xl bg-gradient-to-r"></div>

        {/* Team Header Card */}
        <div className="bg-background mb-8 flex items-end gap-6">
          {/* Team Icon */}
          <div className="bg-muted flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full border-4 border-white shadow-lg dark:border-slate-800">
            <Users className="text-foreground h-16 w-16" />
          </div>

          {/* Team Info */}
          <div className="flex-1 pb-2">
            <h1 className="text-foreground text-3xl font-bold">{team.name}</h1>
            {team.description && (
              <p className="text-muted-foreground mt-1 text-sm">{team.description}</p>
            )}
            {team.lead && (
              <p className="text-muted-foreground mt-2 text-xs">
                Led by {team.lead.firstName} {team.lead.lastName}
              </p>
            )}
            <p className="text-muted-foreground mt-2 text-xs">{team.memberCount} members</p>
          </div>
        </div>

        {/* Main Content - Full Width Feed */}
        <div className="space-y-6">
          {/* Create Post */}
          <CreatePost user={user} onPostCreate={handlePostCreate} />

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-6xl">📝</div>
                <h2 className="text-foreground mb-2 text-xl font-semibold">No posts yet</h2>
                <p className="text-muted-foreground">
                  Be the first to share something with your team!
                </p>
              </div>
            ) : (
              posts.map((post, index) => (
                <div key={post.id} style={{ animation: `slide-up 0.3s ease-out ${index * 50}ms` }}>
                  <PostCard
                    post={post}
                    currentUserId={user.id}
                    onLike={handleLike}
                    usersMap={usersMap}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
