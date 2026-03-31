'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Mail, Lock, ShieldCheck } from 'lucide-react'
import { authApi } from '@/lib/api'

// ── Step types ────────────────────────────────────────────────────────────────
type Step =
  | 'login' // email + password
  | '2fa' // TOTP code after successful password auth
  | 'forgot' // enter email to receive OTP
  | 'verify-otp' // enter the 6-digit OTP from email
  | 'new-password' // set the new password

export default function LoginPage() {
  const { login, complete2FALogin, user } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<Step>('login')

  // Login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Reset password flow
  const [resetEmail, setResetEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (user && step === 'login') {
    router.push('/feed')
    return null
  }

  const clearMessages = () => {
    setError('')
    setSuccessMsg('')
  }

  // ── Step: Login ────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setIsLoading(true)
    try {
      const { twoFactorRequired } = await login(email, password)
      if (twoFactorRequired) {
        setStep('2fa')
      } else {
        router.push('/feed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step: 2FA verify ───────────────────────────────────────────────────────
  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setIsLoading(true)
    try {
      await complete2FALogin(email, otp)
      router.push('/feed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step: Forgot — send OTP ────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setIsLoading(true)
    try {
      await authApi.forgotPassword({ email: resetEmail })
      setSuccessMsg(`A 6-digit code was sent to ${resetEmail}`)
      setStep('verify-otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step: Verify OTP ───────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setIsLoading(true)
    try {
      await authApi.verifyOtp({ email: resetEmail, otp })
      setSuccessMsg('Code verified! Choose your new password.')
      setStep('new-password')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step: Reset Password ───────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setIsLoading(true)
    try {
      await authApi.resetPassword({ email: resetEmail, otp, newPassword })
      setSuccessMsg('Password reset! You can now sign in.')
      // Reset to login step after short delay
      setTimeout(() => {
        setStep('login')
        setOtp('')
        setNewPassword('')
        setConfirmPassword('')
        clearMessages()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Shared UI pieces ───────────────────────────────────────────────────────
  const FeedbackBanner = () => (
    <>
      {error && (
        <div className="animate-slide-down rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="animate-slide-down rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}
    </>
  )

  const BackToLogin = ({ label = 'Back to sign in' }: { label?: string }) => (
    <button
      type="button"
      onClick={() => {
        setStep('login')
        clearMessages()
        setOtp('')
      }}
      className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
    >
      <ArrowLeft size={14} /> {label}
    </button>
  )

  return (
    <div className="animate-fade-in flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <Card className="animate-scale-in w-full max-w-md p-8">
        {/* ── STEP: Login ─────────────────────────────────────────────────── */}
        {step === 'login' && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-foreground text-3xl font-bold">WorkSphere</h1>
              <p className="text-muted-foreground mt-2">Welcome back to your workspace</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <FeedbackBanner />

              <div>
                <label htmlFor="email" className="text-foreground mb-2 block text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="text-foreground text-sm font-medium">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email)
                      clearMessages()
                      setStep('forgot')
                    }}
                    className="text-primary hover:text-primary/80 text-sm font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 w-full text-white transition-all"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </>
        )}

        {/* ── STEP: 2FA ───────────────────────────────────────────────────── */}
        {step === '2fa' && (
          <>
            <div className="mb-8 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                <ShieldCheck size={28} className="text-primary" />
              </div>
              <h1 className="text-foreground text-2xl font-bold">Two-Factor Authentication</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Open your authenticator app and enter the 6-digit code for <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handle2FA} className="space-y-4">
              <FeedbackBanner />

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Authentication Code
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full text-center text-xl tracking-widest"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="bg-primary hover:bg-primary/90 w-full text-white"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </form>

            <div className="mt-4">
              <BackToLogin />
            </div>
          </>
        )}

        {/* ── STEP: Forgot Password — enter email ─────────────────────────── */}
        {step === 'forgot' && (
          <>
            <div className="mb-8">
              <BackToLogin />
              <div className="mt-4 text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                  <Mail size={28} className="text-primary" />
                </div>
                <h1 className="text-foreground text-2xl font-bold">Reset Password</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  Enter your email and we&apos;ll send you a 6-digit code.
                </p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <FeedbackBanner />

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 w-full text-white"
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          </>
        )}

        {/* ── STEP: Verify OTP ────────────────────────────────────────────── */}
        {step === 'verify-otp' && (
          <>
            <div className="mb-8">
              <div className="text-center">
                <div className="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                  <Lock size={28} className="text-primary" />
                </div>
                <h1 className="text-foreground text-2xl font-bold">Check Your Email</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  We sent a 6-digit code to <strong>{resetEmail}</strong>. It expires in 15 minutes.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <FeedbackBanner />

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Verification Code
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full text-center text-xl tracking-widest"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="bg-primary hover:bg-primary/90 w-full text-white"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between">
              <BackToLogin />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  clearMessages()
                  authApi
                    .forgotPassword({ email: resetEmail })
                    .then(() => setSuccessMsg('New code sent!'))
                    .catch((e) => setError(e.message))
                }}
                className="text-primary hover:text-primary/80 text-sm hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </>
        )}

        {/* ── STEP: New Password ───────────────────────────────────────────── */}
        {step === 'new-password' && (
          <>
            <div className="mb-8 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                <Lock size={28} className="text-primary" />
              </div>
              <h1 className="text-foreground text-2xl font-bold">New Password</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Choose a strong password for your account.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <FeedbackBanner />

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 w-full text-white"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
