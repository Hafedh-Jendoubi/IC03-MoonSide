'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mail, MessageSquare, MapPin } from 'lucide-react'
import { mockUsers } from '@/lib/mock-data'

export default function ProfilePage() {
  const params = useParams()
  const { user: currentUser } = useAuth()
  const userId = params.id as string
  const user = mockUsers.find((u) => u.id === userId)

  if (!user) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h1 className="text-foreground text-2xl font-bold">User not found</h1>
        </div>
      </AuthLayout>
    )
  }

  const isOwnProfile = currentUser?.id === user.id

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cover Image */}
        <div className="from-primary/20 to-secondary/20 animate-fade-in mb-6 h-48 rounded-lg bg-gradient-to-r"></div>

        {/* Profile Card */}
        <Card className="animate-scale-in relative -mt-24 mb-8 p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Avatar */}
            <img
              src={user.avatar}
              alt={user.name}
              className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
            />

            {/* Profile Info */}
            <div className="flex-1">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-foreground text-3xl font-bold">{user.name}</h1>
                  <p className="text-primary text-lg font-medium">{user.title}</p>
                  <p className="text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin size={16} />
                    {user.department} Department
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

              <p className="text-foreground mb-4 leading-relaxed">{user.bio}</p>

              {/* Stats */}
              <div className="flex gap-8">
                <div>
                  <p className="text-primary text-2xl font-bold">42</p>
                  <p className="text-muted-foreground text-sm">Connections</p>
                </div>
                <div>
                  <p className="text-primary text-2xl font-bold">128</p>
                  <p className="text-muted-foreground text-sm">Posts</p>
                </div>
                <div>
                  <p className="text-primary text-2xl font-bold">856</p>
                  <p className="text-muted-foreground text-sm">Likes Received</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* About Section */}
        <Card className="animate-slide-up mb-8 p-6">
          <h2 className="text-foreground mb-4 text-2xl font-bold">About</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Email</p>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-sm">Department</p>
              <p className="text-foreground font-medium">{user.department}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground mb-1 text-sm">Bio</p>
              <p className="text-foreground">{user.bio}</p>
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
