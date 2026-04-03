'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Mail,
  MessageSquare,
  MapPin,
  Pencil,
  Phone,
  Briefcase,
  Calendar,
  X,
  Save,
  Loader2,
} from 'lucide-react'
import { User, getFullName } from '@/lib/types'
import { userApi, UpdateUserRequest } from '@/lib/api'
import { useRouter } from 'next/navigation'

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

interface EditProfileModalProps {
  user: User
  onClose: () => void
  onSaved: (updated: User) => void
}

function EditProfileModal({ user, onClose, onSaved }: EditProfileModalProps) {
  const { refreshUser } = useAuth()
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    jobTitle: user.jobTitle ?? '',
    phoneNumber: user.phoneNumber ?? '',
    bio: user.bio ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: UpdateUserRequest = {
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        jobTitle: form.jobTitle || undefined,
        phoneNumber: form.phoneNumber || undefined,
        bio: form.bio || undefined,
      }
      const updated = await userApi.update(user.id, payload)
      await refreshUser()
      onSaved(updated as unknown as User)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="animate-scale-in w-full max-w-lg rounded-2xl bg-white p-0 shadow-2xl dark:bg-slate-900">
        {/* Modal header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-foreground text-lg font-semibold">Edit Profile</h2>
            <p className="text-muted-foreground text-sm">Update your personal information</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Avatar row */}
        <div className="border-border flex items-center gap-4 border-b px-6 py-4 dark:border-slate-700">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={getFullName(user)}
              className="ring-primary/20 h-16 w-16 rounded-full object-cover ring-4"
            />
          ) : (
            <div className="bg-primary/10 text-primary ring-primary/20 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ring-4">
              {user.firstName?.[0]?.toUpperCase()}
              {user.lastName?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-foreground font-medium">{getFullName(user)}</p>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">First Name</label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Last Name</label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Job Title</label>
            <Input
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              placeholder="e.g. Software Engineer"
            />
          </div>

          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Phone Number</label>
            <Input
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
              placeholder="+1 (555) 000-0000"
              type="tel"
            />
          </div>

          <div>
            <label className="text-foreground mb-1 block text-sm font-medium">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Tell people a bit about yourself..."
              rows={3}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary/90 gap-2 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const userId = params.id as string

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const data = await userApi.getById(userId)
        setProfileUser(data as unknown as User)
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
      {/* Edit Profile Modal */}
      {showEditModal && isOwnProfile && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setProfileUser(updated)
            setShowEditModal(false)
          }}
        />
      )}

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cover Image */}
        <div className="animate-fade-in from-primary/20 to-secondary/20 mb-6 h-48 rounded-xl bg-gradient-to-r"></div>

        {/* Profile Card */}
        <Card className="animate-scale-in relative -mt-24 mb-8 p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Avatar */}
            {profileUser.avatar ? (
              <img
                src={profileUser.avatar}
                alt={displayName}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg dark:border-slate-800"
              />
            ) : (
              <div className="bg-primary/10 text-primary flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full border-4 border-white text-4xl font-bold shadow-lg dark:border-slate-800">
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
                    {profileUser.active ? 'Active Member' : 'Inactive'}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Pencil size={16} />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" className="gap-2">
                        <Mail size={18} />
                        Message
                      </Button>
                      <Button className="bg-primary hover:bg-primary/90 gap-2 text-white">
                        <MessageSquare size={18} />
                        Connect
                      </Button>
                    </>
                  )}
                </div>
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
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                <Mail className="text-primary h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                  Email
                </p>
                <p className="text-foreground font-medium">{profileUser.email}</p>
              </div>
            </div>

            {profileUser.jobTitle && (
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                  <Briefcase className="text-primary h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                    Job Title
                  </p>
                  <p className="text-foreground font-medium">{profileUser.jobTitle}</p>
                </div>
              </div>
            )}

            {profileUser.phoneNumber && (
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                  <Phone className="text-primary h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                    Phone
                  </p>
                  <p className="text-foreground font-medium">{profileUser.phoneNumber}</p>
                </div>
              </div>
            )}

            {profileUser.birthDate && (
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                  <Calendar className="text-primary h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                    Birthday
                  </p>
                  <p className="text-foreground font-medium">
                    {new Date(profileUser.birthDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                <Calendar className="text-primary h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                  Member Since
                </p>
                <p className="text-foreground font-medium">
                  {new Date(profileUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {profileUser.bio && (
              <div className="flex items-start gap-3 md:col-span-2">
                <div>
                  <p className="text-muted-foreground mb-0.5 text-xs font-medium tracking-wide uppercase">
                    Bio
                  </p>
                  <p className="text-foreground">{profileUser.bio}</p>
                </div>
              </div>
            )}
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
