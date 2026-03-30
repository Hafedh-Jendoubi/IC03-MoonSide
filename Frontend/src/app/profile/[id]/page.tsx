'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mail, MessageSquare, MapPin } from 'lucide-react'
import { User, getFullName } from '@/lib/types'
import { userApi } from '@/lib/api'

export default function ProfilePage() {
  const params = useParams()
  const { user: currentUser } = useAuth()
  const userId = params.id as string

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const data = await userApi.getById(userId)
        setProfileUser(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'User not found')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) fetchUser()
  }, [userId])

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
        </div>
      </AuthLayout>
    )
  }

  if (error || !profileUser) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h1 className="text-foreground text-2xl font-bold">User not found</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </AuthLayout>
    )
  }

  const isOwnProfile = currentUser?.id === profileUser.id
  const displayName = getFullName(profileUser)

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cover Image */}
        <div className="from-primary/20 to-secondary/20 animate-fade-in mb-6 h-48 rounded-lg bg-gradient-to-r"></div>

        {/* Profile Card */}
        <Card className="animate-scale-in relative -mt-24 mb-8 p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Avatar */}
            {profileUser.avatar ? (
              <img
                src={profileUser.avatar}
                alt={displayName}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="bg-primary/10 text-primary flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full border-4 border-white text-4xl font-bold shadow-lg">
                {profileUser.firstName?.[0]?.toUpperCase()}
                {profileUser.lastName?.[0]?.toUpperCase()}
              </div>
            )}

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-foreground text-3xl font-bold">{displayName}</h1>
                  {profileUser.jobTitle && (
                    <p className="text-primary text-lg font-medium">{profileUser.jobTitle}</p>
                  )}
                  <p className="text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin size={16} />
                    {profileUser.isActive ? 'Active Member' : 'Inactive'}
                  </p>
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                      <Mail size={18} />
                      Message
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 gap-2 text-white">
                      <MessageSquare size={18} />
                      Connect
                    </Button>
                  </div>
                )}
              </div>

              {profileUser.bio && (
                <p className="text-foreground mb-4 leading-relaxed">{profileUser.bio}</p>
              )}
            </div>
          </div>
        </Card>

        {/* About Section */}
        <Card className="animate-slide-up mb-8 p-6">
          <h2 className="text-foreground mb-4 text-2xl font-bold">About</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Email</p>
              <p className="text-foreground font-medium">{profileUser.email}</p>
            </div>
            {profileUser.jobTitle && (
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Job Title</p>
                <p className="text-foreground font-medium">{profileUser.jobTitle}</p>
              </div>
            )}
            {profileUser.phoneNumber && (
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Phone</p>
                <p className="text-foreground font-medium">{profileUser.phoneNumber}</p>
              </div>
            )}
            {profileUser.birthDate && (
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Birthday</p>
                <p className="text-foreground font-medium">
                  {new Date(profileUser.birthDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {profileUser.bio && (
              <div className="md:col-span-2">
                <p className="text-muted-foreground mb-1 text-sm">Bio</p>
                <p className="text-foreground">{profileUser.bio}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Member Since</p>
              <p className="text-foreground font-medium">
                {new Date(profileUser.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="animate-slide-up p-6" style={{ animationDelay: '100ms' }}>
          <h2 className="text-foreground mb-4 text-2xl font-bold">Recent Activity</h2>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Posts will appear here</p>
          </div>
        </Card>
      </div>
    </AuthLayout>
  )
}
