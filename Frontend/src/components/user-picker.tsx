'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { UserResponse, userApi } from '@/lib/api'

interface UserPickerProps {
  selectedUserId?: string | null
  onSelect: (user: UserResponse | null) => void
  excludeUserIds?: string[]
  placeholder?: string
  label?: string
  className?: string
}

export function UserPicker({
  selectedUserId,
  onSelect,
  excludeUserIds = [],
  placeholder = 'Search employees by name, email, or role…',
  label = 'Select a user',
  className = '',
}: UserPickerProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserResponse[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load selected user if ID provided
  useEffect(() => {
    if (selectedUserId) {
      const loadUser = async () => {
        try {
          const all = await userApi.getAll()
          const user = all.find((u) => u.id === selectedUserId)
          if (user) {
            setSelectedUser(user)
          }
        } catch {
          // ignore
        }
      }
      loadUser()
    } else {
      setSelectedUser(null)
    }
  }, [selectedUserId])

  // Search users
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    searchRef.current = setTimeout(async () => {
      try {
        const all = await userApi.getAll()
        const excludeSet = new Set(excludeUserIds)
        const q = query.toLowerCase()
        const filtered = all.filter(
          (u) =>
            !excludeSet.has(u.id) &&
            (u.firstName.toLowerCase().includes(q) ||
              u.lastName.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q) ||
              (u.jobTitle ?? '').toLowerCase().includes(q))
        )
        setSearchResults(filtered.slice(0, 8))
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [query, excludeUserIds])

  const handleSelect = (user: UserResponse) => {
    setSelectedUser(user)
    onSelect(user)
    setQuery('')
    setSearchResults([])
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedUser(null)
    onSelect(null)
    setQuery('')
    setSearchResults([])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsOpen(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {label && <label className="text-foreground mb-2 block text-sm font-medium">{label}</label>}
      <div ref={dropdownRef} className="relative" onClick={() => !selectedUser && setIsOpen(true)}>
        {selectedUser ? (
          <div className="border-border bg-background text-foreground flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="bg-muted h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-muted-foreground text-xs font-semibold">
                      {selectedUser.firstName[0]?.toUpperCase()}
                      {selectedUser.lastName[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-foreground text-sm leading-tight font-medium">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                {selectedUser.jobTitle && (
                  <p className="text-muted-foreground truncate text-xs">{selectedUser.jobTitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="bg-background focus:ring-primary w-full rounded-lg border py-2.5 pr-4 pl-9 text-sm focus:ring-2 focus:outline-none"
            />
            {searching && (
              <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
            )}
          </div>
        )}

        {isOpen && searchResults.length > 0 && (
          <ul className="bg-background absolute top-full right-0 left-0 z-10 mt-1 divide-y overflow-hidden rounded-lg border shadow-lg">
            {searchResults.map((u) => (
              <li
                key={u.id}
                className="hover:bg-muted/40 flex cursor-pointer items-center gap-2.5 px-3 py-2.5 transition-colors"
                onClick={() => handleSelect(u)}
              >
                <div className="bg-muted h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={`${u.firstName} ${u.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-muted-foreground text-xs font-semibold">
                        {u.firstName[0]?.toUpperCase()}
                        {u.lastName[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm leading-tight font-medium">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{u.jobTitle || u.email}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
