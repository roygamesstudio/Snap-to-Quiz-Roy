import { useEffect, useState } from 'react'
import { Sparkles, Zap, Brain, Camera, Crown, RefreshCw, Ticket } from 'lucide-react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdBanner from './components/AdBanner'
import UploadZone from './components/UploadZone'
import StudyHub from './components/StudyHub'
import { PaywallModal } from './components/Paywall'
import { PromoCodeModal } from './components/PromoCodeModal'
import { SubscriptionExpirationModal } from './components/SubscriptionExpirationModal'
import { ToastProvider, useToast } from './components/Toast'
import { supabase, supabaseAvailable } from './lib/supabase'
import { generateQuizFromImage, GeminiError } from './services/geminiService'
import {
  getCredits,
  deductCredit,
  isPro,
  refundCredit,
  getProExpirationDate,
} from './services/creditService'
import { isGeminiConfigured } from './config'

function AppContent() {
  const toast = useToast()
  const [authOpen, setAuthOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [credits, setCredits] = useState(0)
  const [proUser, setProUser] = useState(false)
  const [proExpiresAt, setProExpiresAt] = useState(null)
  const [result, setResult] = useState(null)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [promoCodeOpen, setPromoCodeOpen] = useState(false)
  const [expirationModalOpen, setExpirationModalOpen] = useState(false)
  const [justSubscribed, setJustSubscribed] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [stats, setStats] = useState({ completed: 0, streak: 0, bestScore: 0 })

  async function refreshCredits() {
    const c = await getCredits()
    setCredits(c)
    const p = await isPro()
    setProUser(p)
    const exp = await getProExpirationDate()
    setProExpiresAt(exp)
  }

  useEffect(() => {
    refreshCredits()

    if (supabaseAvailable && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          setUser(data.session.user)
          refreshCredits()
        }
      })

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
          if (session?.user) {
            refreshCredits()
          } else {
            setProUser(false)
            setProExpiresAt(null)
            setCredits(0)
            setResult(null)
            setStats({ completed: 0, streak: 0, bestScore: 0 })
          }
        }
      )

      return () => {
        authListener?.subscription?.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (!isGeminiConfigured()) {
      toast.info(
        'No Gemini API key found. Add VITE_GEMINI_API_KEY to your .env file to enable AI scanning.',
        6000
      )
    }
  }, [])

  async function handleScan(base64, mimeType) {
    const { data: authData } = supabase?.auth
      ? await supabase.auth.getUser()
      : { data: null }
    if (!authData?.user) {
      toast.info('Sign in now to claim your 5 free daily scans and generate your quiz!')
      setAuthOpen(true)
      return null
    }

    if (!isGeminiConfigured()) {
      toast.error(
        'Gemini API key is not configured. Please add it to your .env file.'
      )
      return null
    }

    const hasCredit = await deductCredit()
    if (!hasCredit) {
      toast.error('You have no scans left. Upgrade to Pro or watch an ad for a free credit.')
      setPaywallOpen(true)
      return null
    }

    try {
      const res = await generateQuizFromImage(base64, mimeType, proUser)
      setResult(res)
      refreshCredits()
      toast.success(
        `Generated ${res.questions.length} questions and ${res.flashcards.length} flashcards!`
      )
      return res
    } catch (err) {
      if (err instanceof GeminiError) {
        toast.error(err.message, 6000)
      } else {
        toast.error('Something went wrong while processing your image. Please try again.')
      }
      await refundCredit()
      refreshCredits()
      return null
    }
  }

  function requireAuthForScan() {
    if (user) return true
    toast.info('Sign in now to claim your 5 free daily scans and generate your quiz!')
    setAuthOpen(true)
    return false
  }

  function handleReset() {
    setResult(null)
  }

  async function handleCreditGranted() {
    await refreshCredits()
  }

  async function handlePromoRedeemed() {
    await refreshCredits()
  }

  function handleQuizComplete({ score, total }) {
    setStats((current) => ({
      completed: current.completed + 1,
      streak: current.streak + 1,
      bestScore: Math.max(current.bestScore, Math.round((score / total) * 100)),
    }))
  }

  async function handleAuthSuccess() {
    if (supabase) {
      const { data } = await supabase.auth.getUser()
      if (data?.user) setUser(data.user)
    }
    await refreshCredits()
  }

  function handleSignOut() {
    setUser(null)
    setProUser(false)
    setProExpiresAt(null)
    setCredits(0)
    setResult(null)
    setStats({ completed: 0, streak: 0, bestScore: 0 })
  }

  async function handlePaymentSuccess() {
    setJustSubscribed(true)
    await refreshCredits()
    setExpirationModalOpen(true)
  }

  const creditsDisplay = `${credits} left`
  const currency = user?.user_metadata?.country === 'Nigeria' ? 'NGN' : 'USD'

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={user}
        onAuthSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
        authOpen={authOpen}
        onAuthOpenChange={setAuthOpen}
        isProUser={proUser}
        toast={toast}
        proExpiresAt={proExpiresAt}
        onShowExpiration={() => {
          setJustSubscribed(false)
          setExpirationModalOpen(true)
        }}
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {!result && (
          <>
            <div className="text-center mb-8 sm:mb-10 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-5">
                <Sparkles size={15} />
                AI-Powered Active Recall
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4 leading-tight">
                Snap a photo.
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Master the material.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                Upload a photo of your lecture notes or textbook page. AI instantly
                turns it into interactive quizzes and flashcards.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Zap size={16} className="text-amber-500" />
                <span className="font-medium">{creditsDisplay}</span>
                <span className="text-slate-400">scans</span>
              </div>
              {!proUser && (
                <button
                  onClick={() => setPaywallOpen(true)}
                  className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium hover:bg-amber-100 transition-colors"
                >
                  <Crown size={14} />
                  Go Pro
                </button>
              )}
              <button
                onClick={() => setPromoCodeOpen(true)}
                className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full font-medium hover:bg-green-100 transition-colors"
              >
                <Ticket size={14} />
                Promo Code
              </button>
            </div>

            <UploadZone
              onResult={handleScan}
              onError={(msg) => toast.error(msg)}
              onScanStart={() => setScanning(true)}
              onRequireAuth={requireAuthForScan}
            />

            {!result && !scanning && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
                  {[
                    {
                      icon: Camera,
                      title: '1. Snap or Upload',
                      desc: 'Take a photo of your notes or drag in an image file.',
                    },
                    {
                      icon: Brain,
                      title: '2. AI Analyzes',
                      desc: 'Gemini AI extracts key concepts and generates questions.',
                    },
                    {
                      icon: Zap,
                      title: '3. Study & Test',
                      desc: 'Quiz yourself with instant feedback or flip flashcards.',
                    },
                  ].map((step) => (
                    <div
                      key={step.title}
                      className="bg-white rounded-xl border border-slate-200 p-5 text-center"
                    >
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                        <step.icon size={22} className="text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {!proUser && (
                  <div className="mt-8">
                    <AdBanner />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {result && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-5">
              <RefreshCw size={20} className="text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Your Study Set</h2>
            </div>
            <StudyHub
              result={result}
              onReset={handleReset}
              toast={toast}
              isProUser={proUser}
              onQuizComplete={handleQuizComplete}
              stats={stats}
            />
          </div>
        )}
      </main>

      <Footer user={user} onRequestAuth={() => setAuthOpen(true)} toast={toast} />

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        currency={currency}
        user={user}
        isProUser={proUser}
        onRequestAuth={() => {
          setPaywallOpen(false)
          setAuthOpen(true)
        }}
        onCreditGranted={handleCreditGranted}
        onPaymentSuccess={handlePaymentSuccess}
        onOpenPromoCode={() => {
          setPaywallOpen(false)
          setPromoCodeOpen(true)
        }}
        toast={toast}
      />

      <PromoCodeModal
        open={promoCodeOpen}
        onClose={() => setPromoCodeOpen(false)}
        onRedeemed={handlePromoRedeemed}
        toast={toast}
      />

      <SubscriptionExpirationModal
        open={expirationModalOpen}
        onClose={() => setExpirationModalOpen(false)}
        proExpiresAt={proExpiresAt}
        justSubscribed={justSubscribed}
      />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
