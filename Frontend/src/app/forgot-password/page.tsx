'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

type Step = 'email' | 'otp' | 'password' | 'done'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await authApi.forgotPassword({ email })
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await authApi.verifyOtp({ email, otp })
      setStep('password')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
      await authApi.resetPassword({ email, otp, newPassword })
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const stepIndicator = (
    <div className="mb-6 flex items-center justify-center gap-2">
      {(['email', 'otp', 'password'] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
              step === s
                ? 'bg-primary text-white'
                : ['email', 'otp', 'password'].indexOf(step) > i
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {['email', 'otp', 'password'].indexOf(step) > i ? '✓' : i + 1}
          </div>
          {i < 2 && (
            <div
              className={`h-px w-8 ${['email', 'otp', 'password'].indexOf(step) > i ? 'bg-green-500' : 'bg-muted'}`}
            />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="animate-fade-in flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <Card className="animate-scale-in w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="text-foreground text-2xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
            {step === 'password' && 'Create your new password'}
            {step === 'done' && 'Password updated!'}
          </p>
        </div>

        {step !== 'done' && stepIndicator}

        {error && (
          <div className="animate-slide-down mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">6-Digit Code</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="text-center text-2xl tracking-[0.5em]"
              />
              <p className="text-muted-foreground mt-1 text-xs">Code expires in 15 minutes</p>
            </div>
            <Button type="submit" disabled={isLoading || otp.length !== 6} className="w-full">
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setOtp('')
              }}
              className="text-muted-foreground hover:text-foreground w-full text-center text-sm underline-offset-4 hover:underline"
            >
              Use a different email
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-foreground mb-2 block text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
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
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Resetting...' : 'Set New Password'}
            </Button>
          </form>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>
            <p className="text-muted-foreground text-sm">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Back to Sign In
            </Button>
          </div>
        )}

        {step === 'email' && (
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            >
              ← Back to Sign In
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
