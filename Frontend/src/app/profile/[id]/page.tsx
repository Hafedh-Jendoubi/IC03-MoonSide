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
  const user = mockUsers.find(u => u.id === userId)

  if (!user) {
    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">User not found</h1>
        </div>
      </AuthLayout>
    )
  }

  const isOwnProfile = currentUser?.id === user.id

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg mb-6 animate-fade-in"></div>

        {/* Profile Card */}
        <Card className="relative -mt-24 p-6 mb-8 animate-scale-in">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <img
              src={user.avatar}
              alt={user.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
                  <p className="text-lg text-primary font-medium">{user.title}</p>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
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
                    <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                      <MessageSquare size={18} />
                      Connect
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-foreground leading-relaxed mb-4">{user.bio}</p>

              {/* Stats */}
              <div className="flex gap-8">
                <div>
                  <p className="text-2xl font-bold text-primary">42</p>
                  <p className="text-sm text-muted-foreground">Connections</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">128</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">856</p>
                  <p className="text-sm text-muted-foreground">Likes Received</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* About Section */}
        <Card className="p-6 mb-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-foreground mb-4">About</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Department</p>
              <p className="text-foreground font-medium">{user.department}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Bio</p>
              <p className="text-foreground">{user.bio}</p>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl font-bold text-foreground mb-4">Recent Activity</h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Posts will appear here</p>
          </div>
        </Card>
      </div>
    </AuthLayout>
  )
}
