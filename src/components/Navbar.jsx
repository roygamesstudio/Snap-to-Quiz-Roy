import { useState } from 'react'
import { Camera, LogIn, LogOut, User, X, Crown, MailCheck } from 'lucide-react'
import { supabase, supabaseAvailable } from '../lib/supabase'

// Replaced the invalid Intl 'region' call with a safe, static array of countries.
// You can easily add more countries to this list by following the same format.
const countries = [
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'IN', name: 'India' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }
];

function AuthModal({ onClose, onAuthSuccess, onVerifyNeeded, toast }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [country, setCountry] = useState('Nigeria')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!supabaseAvailable || !supabase) {
      toast.error('Database is not configured. Using local mode — sign in is unavailable.')
      onClose()
      return
    }
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Signed in successfully!')
          onAuthSuccess()
          onClose()
        }
      } else {
        const selectedCountry = country || 'Nigeria'
        const autoCurrency = selectedCountry === 'Nigeria' ? 'NGN' : 'USD'
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              country: selectedCountry,
              currency: autoCurrency,
            },
          },
        })
        if (error) {
          toast.error(error.message)
        } else {
          if (!data.session) {
            onClose()
            onVerifyNeeded(email)
          } else {
            toast.success('Account created! You are now signed in.')
            onAuthSuccess()
            onClose()
          }
        }
      }
    } catch (_) {
      toast.error('An unexpected error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
              placeholder="At least 6 characters"
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1.5">
                Country
              </label>
              <select
                id="country"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-900"
              >
                {countries.map((option) => (
                  <option key={option.code} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
          </button>
          <p className="text-center text-sm text-slate-500">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-blue-600 font-medium hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

function VerifyEmailModal({ email, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Verify Your Email</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
            <MailCheck size={32} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Check your email
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            We sent a verification link to
          </p>
          <p className="text-base font-semibold text-slate-900 mb-5 break-all">
            {email}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Click the link in that email to activate your account. You'll be able to sign in once your email is verified.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Navbar({
  user,
  onAuthSuccess,
  onSignOut,
  authOpen,
  onAuthOpenChange,
  isProUser,
  proExpiresAt,
  onShowExpiration,
  toast,
}) {
  const [verifyEmail, setVerifyEmail] = useState(null)
  
  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut()
    }
    onSignOut()
    toast.info('Signed out.')
  }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
              <Camera size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 hidden sm:block">
              Snap-to-Quiz
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isProUser && (
              <button
                onClick={onShowExpiration}
                className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors"
                title="View subscription details"
              >
                <Crown size={14} />
                Pro
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm text-slate-600 max-w-[120px]">
                  <User size={16} className="flex-shrink-0" />
                  <span className="truncate hidden sm:block">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                  aria-label="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAuthOpenChange(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                <LogIn size={16} />
                <span className="hidden sm:block">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {authOpen && (
        <AuthModal
          onClose={() => onAuthOpenChange(false)}
          onAuthSuccess={onAuthSuccess}
          onVerifyNeeded={(emailVal) => setVerifyEmail(emailVal)}
          toast={toast}
        />
      )}

      {verifyEmail && (
        <VerifyEmailModal
          email={verifyEmail}
          onClose={() => setVerifyEmail(null)}
        />
      )}
    </>
  )
}