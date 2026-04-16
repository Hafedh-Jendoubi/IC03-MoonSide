'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Building2 } from 'lucide-react'
import { departmentApi, teamApi, DepartmentResponse, TeamResponse } from '@/lib/api'
import { AuthLayout } from '@/components/auth-layout'
import { CreatePost } from '@/components/create-post'
import { PostCard } from '@/components/post-card'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { Post, User } from '@/lib/types'
import Link from 'next/link'

export default function DepartmentFeedPage() {
  const params = useParams()
  const { user } = useAuth()
  const deptId = params?.id as string

  const [department, setDepartment] = useState<DepartmentResponse | null>(null)
  const [teams, setTeams] = useState<TeamResponse[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!deptId) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [dept, allTeams] = await Promise.all([
          departmentApi.getById(deptId),
          teamApi.getPublic(),
        ])

        setDepartment(dept)
        const deptTeams = allTeams.filter((t) => t.departmentId === deptId)
        setTeams(deptTeams)

        // Load posts from localStorage
        const storedPosts = localStorage.getItem(`dept_posts_${deptId}`)
        if (storedPosts) {
          try {
            setPosts(JSON.parse(storedPosts))
          } catch {
            console.error('Failed to parse stored posts')
          }
        }
      } catch (e: any) {
        setError(e.message ?? 'Failed to load department')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [deptId])

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
    localStorage.setItem(`dept_posts_${deptId}`, JSON.stringify(updatedPosts))
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
    localStorage.setItem(`dept_posts_${deptId}`, JSON.stringify(updatedPosts))
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

  if (error || !department) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h1 className="text-foreground text-2xl font-bold">Department not found</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </AuthLayout>
    )
  }

  if (!user) return null

  return (
    <AuthLayout>
      <div>
        {/* Cover Banner */}
        <div className="from-primary/20 to-secondary/20 h-48 bg-gradient-to-r"></div>

        {/* Department Header Card */}
        <div className="bg-background border-border sticky top-0 z-40 border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-24 mb-8 flex items-end gap-6">
              {/* Department Icon */}
              <div className="bg-muted flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full border-4 border-white shadow-lg dark:border-slate-800">
                <Building2 className="text-foreground h-16 w-16" />
              </div>

              {/* Department Info */}
              <div className="flex-1 pb-2">
                <h1 className="text-foreground text-3xl font-bold">{department.name}</h1>
                {department.description && (
                  <p className="text-muted-foreground mt-1 text-sm">{department.description}</p>
                )}
                {department.manager && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    Led by {department.manager.firstName} {department.manager.lastName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Feed Section (Main) */}
            <div className="space-y-6 lg:col-span-2">
              {/* Create Post */}
              <CreatePost user={user} onPostCreate={handlePostCreate} />

              {/* Posts Feed */}
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mb-4 text-6xl">📝</div>
                    <h2 className="text-foreground mb-2 text-xl font-semibold">No posts yet</h2>
                    <p className="text-muted-foreground">
                      Be the first to share something with your department!
                    </p>
                  </div>
                ) : (
                  posts.map((post, index) => (
                    <div
                      key={post.id}
                      style={{ animation: `slide-up 0.3s ease-out ${index * 50}ms` }}
                    >
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

            {/* Sidebar - Teams */}
            <div className="lg:col-span-1">
              {teams.length > 0 && (
                <Card className="sticky top-20 p-6">
                  <h2 className="text-foreground mb-4 text-lg font-semibold">
                    Teams in this Department
                  </h2>
                  <div className="space-y-3">
                    {teams.map((team) => (
                      <Link key={team.id} href={`/team/${team.id}`}>
                        <div className="bg-muted/50 hover:bg-muted cursor-pointer rounded-lg p-3 transition-colors">
                          <h3 className="text-foreground line-clamp-1 text-sm font-medium">
                            {team.name}
                          </h3>
                          {team.description && (
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                              {team.description}
                            </p>
                          )}
                          <p className="text-muted-foreground mt-2 text-xs">
                            {team.memberCount} members
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
