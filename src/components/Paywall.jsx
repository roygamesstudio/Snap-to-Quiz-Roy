import { useEffect, useRef, useState } from 'react'
import { usePaystackPayment } from 'react-paystack'
import { Crown, Lock, Play, Loader as Loader2, X, CircleCheck as CheckCircle2, Ticket } from 'lucide-react'
import { config, CURRENCIES, isPaystackConfigured } from '../config'
import { supabase } from '../lib/supabase'
import { addCredit } from '../services/creditService'

function RewardAdButton({ onReward, toast, disabled, isProUser }) {
  const [watching, setWatching] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const intervalRef = useRef(null)
  const rewardTimeoutRef = useRef(null)

  useEffect(() => () => {
    clearInterval(intervalRef.current)
    clearTimeout(rewardTimeoutRef.current)
  }, [])

  async function startReward() {
    if (disabled || isProUser || watching) return
    setWatching(true)
    setCountdown(3)

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)

    rewardTimeoutRef.current = setTimeout(async () => {
      rewardTimeoutRef.current = null
      const ok = await addCredit(1)
      if (ok) {
        toast.success('Reward earned! +1 scan credit added.')
        onReward()
      } else {
        toast.error('Could not grant reward. Please try again.')
      }
      setWatching(false)
    }, 3000)
  }

  if (isProUser) {
    return (
      <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-medium">
        <Crown size={16} />
        Pro access active
      </div>
    )
  }

  if (watching) {
    return (
      <button
        disabled
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 font-medium"
      >
        <Loader2 size={18} className="animate-spin" />
        Watching ad... {countdown}s
      </button>
    )
  }

  return (
    <button
      onClick={startReward}
      disabled={disabled}
      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Play size={16} />
      Watch Ad (+1 Credit)
    </button>
  )
}

function PaywallModal({
  open,
  onClose,
  currency,
  user,
  isProUser,
  onRequestAuth,
  onCreditGranted,
  onPaymentSuccess,
  onOpenPromoCode,
  toast,
}) {
  const [paying, setPaying] = useState(false)
  const cur = CURRENCIES[currency] || CURRENCIES.USD

  const configPaystack = {
    reference: `stq-${Date.now()}`,
    email: user?.email || 'guest@snaptoquiz.app',
    amount: cur.subunit,
    currency: cur.code,
    publicKey: config.PAYSTACK_PUBLIC_KEY,
    text: `Upgrade to Pro — ${cur.symbol}${cur.amount}`,
    metadata: {
      custom_fields: [
        {
          display_name: 'User ID',
          variable_name: 'supabase_user_id',
          value: user?.id || '',
        },
        {
          display_name: 'Email',
          variable_name: 'supabase_email',
          value: user?.email || '',
        },
      ],
    },
  }

  const onSuccess = async (_) => {
    setPaying(false)
    toast.success('Payment received! Your Pro subscription is now active for 1 month.')
    onClose()
    onPaymentSuccess?.()
  }

  const onClosePaystack = () => {
    setPaying(false)
  }

  const initializePayment = usePaystackPayment(configPaystack)

  async function handlePay() {
    if (!supabase) {
      toast.info('Please sign in or create an account before checking out.')
      onRequestAuth()
      return
    }

    const { data, error } = await supabase.auth.getSession()
    const sessionUser = data?.session?.user

    if (error || !sessionUser || !user?.id || sessionUser.id !== user.id) {
      setPaying(false)
      toast.info('Please sign in or create an account before checking out.')
      onRequestAuth()
      return
    }

    if (!isPaystackConfigured()) {
      toast.info(
        'Paystack is in test mode. Add your Paystack public key to enable real payments.'
      )
      return
    }
    setPaying(true)
    initializePayment(onSuccess, onClosePaystack)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Crown size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Upgrade to Pro</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-slate-900">
              {cur.symbol}{cur.amount}
              <span className="text-lg font-normal text-slate-500"> /month</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">300 AI scans per month, no ads</p>
          </div>

          <div className="space-y-2.5">
            {[
              '300 photo-to-quiz scans per month',
              'No advertisements anywhere',
              'Unlimited flashcards & quizzes',
              'Export and copy study materials',
              'Priority AI processing',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                <span className="text-sm text-slate-700">{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {paying ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock size={18} />
                Pay {cur.symbol}{cur.amount} {cur.code} via Paystack
              </>
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <button
              onClick={onOpenPromoCode}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 font-medium hover:bg-green-100 transition-colors"
            >
              <Ticket size={16} />
              Have a Promo Code?
            </button>
            <p className="text-xs text-center text-slate-400">
              Or earn a free credit without paying
            </p>
            <RewardAdButton
              onReward={onCreditGranted}
              toast={toast}
              isProUser={isProUser}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export { PaywallModal, RewardAdButton }
