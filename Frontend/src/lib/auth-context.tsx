'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from './types'
import { authApi, userApi, tokenStorage, RegisterRequest } from './api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export interface SignupData {
  firstName: string
  lastName: string
  email: string
  password: string
  jobTitle?: string
  bio?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, rehydrate session from stored token
  useEffect(() => {
    const initSession = async () => {
      const token = tokenStorage.getAccessToken()
      if (!token) {
        setIsLoading(false)
        return
      }
      try {
        const me = await userApi.getMe()
        setUser(me)
      } catch {
        // Token invalid or expired — attempt refresh
        const refreshToken = tokenStorage.getRefreshToken()
        if (refreshToken) {
          try {
            const refreshed = await authApi.refreshToken(refreshToken)
            tokenStorage.setTokens(refreshed.accessToken, refreshed.refreshToken)
            setUser(refreshed.user)
          } catch {
            tokenStorage.clear()
          }
        } else {
          tokenStorage.clear()
        }
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await authApi.login({ email, password })
      tokenStorage.setTokens(response.accessToken, response.refreshToken)
      setUser(response.user)
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (data: SignupData) => {
    setIsLoading(true)
    try {
      const payload: RegisterRequest = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        jobTitle: data.jobTitle,
        bio: data.bio,
      }
      const response = await authApi.register(payload)
      tokenStorage.setTokens(response.accessToken, response.refreshToken)
      setUser(response.user)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    const me = await userApi.getMe()
    setUser(me)
  }

  const logout = () => {
    setUser(null)
    tokenStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
