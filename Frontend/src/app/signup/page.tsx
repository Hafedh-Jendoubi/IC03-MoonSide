'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Circle, Eye, EyeOff, Mail, ArrowLeft, RefreshCw } from 'lucide-react'

// --- Password rules ----------------------------------------------------------

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a–z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number (0–9)', test: (p: string) => /\d/.test(p) },
  {
    id: 'special',
    label: 'One special character (!@#$…)',
    test: (p: string) => /[@$!%*?&_.\-#]/.test(p),
  },
]

function PasswordStrengthIndicator({ password }: { password: string }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length
  const pct = (passed / PASSWORD_RULES.length) * 100

  const color =
    passed <= 1
      ? 'bg-red-500'
      : passed <= 2
        ? 'bg-orange-500'
        : passed <= 3
          ? 'bg-yellow-500'
          : passed <= 4
            ? 'bg-blue-500'
            : 'bg-green-500'

  const label =
    passed === 0
      ? ''
      : passed <= 1
        ? 'Very weak'
        : passed <= 2
          ? 'Weak'
          : passed <= 3
            ? 'Fair'
            : passed <= 4
              ? 'Strong'
              : 'Very strong'

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {label && (
          <span className="text-muted-foreground min-w-[6rem] text-right text-xs">{label}</span>
        )}
      </div>
      {/* Rules checklist */}
      {password.length > 0 && (
        <ul className="space-y-1">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(password)
            return (
              <li
                key={rule.id}
                className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                {ok ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0" />
                )}
                {rule.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// --- Email Verification Modal -------------------------------------------------

function EmailVerificationModal({
  email,
  onVerified,
  onResend,
}: {
  email: string
  onVerified: (otp: string) => Promise<void>
  onResend: () => Promise<void>
}) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  const startCountdown = () => {
    setResendCountdown(60)
    const interval = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onVerified(otp)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      await onResend()
      setSuccess('A new code was sent to your email.')
      startCountdown()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900">
        {/* Icon */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Mail className="text-primary h-8 w-8" />
          </div>
          <h2 className="text-foreground text-2xl font-bold">Check your inbox</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="otp" className="text-foreground mb-2 block text-sm font-medium">
              Verification Code
            </label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setOtp(val)
              }}
              className="text-center text-2xl tracking-[0.5em]"
              required
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="bg-primary hover:bg-primary/90 w-full text-white"
          >
            {loading ? 'Verifying…' : 'Verify Email'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-sm">
            Didn&apos;t receive the code?{' '}
            {resendCountdown > 0 ? (
              <span className="text-muted-foreground">Resend in {resendCountdown}s</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-primary inline-flex items-center gap-1 font-semibold hover:underline disabled:opacity-60"
              >
                {resending && <RefreshCw className="h-3 w-3 animate-spin" />}
                Resend code
              </button>
            )}
          </p>
        </div>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          The code expires in 15 minutes.
        </p>
      </div>
    </div>
  )
}

// --- Signup Page --------------------------------------------------------------

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Verification modal state
  const [showVerification, setShowVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  const { signup, verifyEmail, resendVerification } = useAuth()
  const router = useRouter()

  const allRulesPassed = PASSWORD_RULES.every((r) => r.test(password))

  // --- Max birthdate = 13 years ago -----------------------------------------
  const maxBirthDate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 13)
    return d.toISOString().split('T')[0]
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!allRulesPassed) {
      setError('Password does not meet all requirements')
      return
    }

    if (!birthDate) {
      setError('Birth date is required')
      return
    }

    setIsLoading(true)
    try {
      const result = await signup({
        firstName,
        lastName,
        email,
        password,
        birthDate,
        jobTitle: jobTitle || undefined,
      })

      if (result.emailVerificationRequired) {
        setPendingEmail(email)
        setShowVerification(true)
      } else {
        router.push('/feed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerified = async (otp: string) => {
    await verifyEmail(pendingEmail, otp)
    // Email is verified — redirect to login so they get a proper session
    router.push('/login?verified=1')
  }

  const handleResend = async () => {
    await resendVerification(pendingEmail)
  }

  return (
    <>
      {showVerification && (
        <EmailVerificationModal
          email={pendingEmail}
          onVerified={handleVerified}
          onResend={handleResend}
        />
      )}

      <div className="animate-fade-in flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-10">
        <Card className="animate-scale-in w-full max-w-md p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg text-2xl font-bold text-white">
              WS
            </div>
            <h1 className="text-foreground text-3xl font-bold">Join WorkSphere</h1>
            <p className="text-muted-foreground mt-2">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="animate-slide-down rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="text-foreground mb-2 block text-sm font-medium"
                >
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="text-foreground mb-2 block text-sm font-medium"
                >
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Birth date */}
            <div>
              <label htmlFor="birthDate" className="text-foreground mb-2 block text-sm font-medium">
                Date of Birth
              </label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={maxBirthDate}
                required
                className="w-full"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                You must be at least 13 years old to register.
              </p>
            </div>

            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className="text-foreground mb-2 block text-sm font-medium">
                Job Title <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="jobTitle"
                type="text"
                placeholder="e.g. Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-foreground mb-2 block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="text-foreground mb-2 block text-sm font-medium"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full pr-10 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-red-400 focus-visible:ring-red-400'
                      : confirmPassword && confirmPassword === password
                        ? 'border-green-400 focus-visible:ring-green-400'
                        : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !allRulesPassed || password !== confirmPassword}
              className="bg-primary hover:bg-primary/90 w-full text-white transition-all"
            >
              {isLoading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
