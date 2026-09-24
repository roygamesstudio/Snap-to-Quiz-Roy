import { useState } from 'react'
import { Play, Loader2, X, Ticket, Gift, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { addCredit } from '../services/creditService'

function RewardAdButton({ onReward, toast, disabled, user }) {
  const [watching, setWatching] = useState(false)

  async function startReward() {
    if (disabled || watching) return

    setWatching(true)
    toast.info('Opening ad link...')

    // Open Monetag ad link/zone in a new tab or trigger ad container
    const adUrl = import.meta.env.VITE_MONETAG_ZONE_ID 
      ? `https://your-monetag-ad-link.com/?zone=${import.meta.env.VITE_MONETAG_ZONE_ID}` 
      : '#'

    // Open the ad for the user
    window.open(adUrl, '_blank')

    // Simulate completion and award credit after user interacts
    setTimeout(async () => {
      try {
        const ok = await addCredit(1)
        if (ok) {
          toast.success('Reward earned! +1 scan credit added.')
          onReward()
        } else {
          toast.error('Could not grant reward. Please try again.')
        }
      } catch (err) {
        console.error('Error granting credit:', err)
        toast.error('An error occurred while granting your reward.')
      } finally {
        setWatching(false)
      }
    }, 4000)
  }

  if (watching) {
    return (
      <div className="w-full py-4 px-5 rounded-2xl bg-emerald-600 text-white font-semibold shadow-md flex items-center justify-center gap-3 cursor-not-allowed opacity-90">
        <Loader2 size={20} className="animate-spin" />
        <span>Verifying ad view...</span>
      </div>
    )
  }

  return (
    <button
      onClick={startReward}
      disabled={disabled}
      className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
    >
      <div className="flex items-center gap-3.5 text-left">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0 shadow-inner">
          <Play size={22} className="fill-current ml-0.5" />
        </div>
        <div>
          <div className="font-bold text-lg leading-tight">Watch Ad / Visit Sponsor</div>
          <div className="text-emerald-100 text-xs mt-0.5 font-medium">Earn +1 free scan credit instantly</div>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
        →
      </div>
    </button>
  )
}

function PaywallModal({
  open,
  onClose,
  user,
  onCreditGranted,
  onOpenPromoCode,
  toast,
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Gift size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                Get Free Credits <Sparkles size={16} className="text-emerald-500" />
              </h3>
              <p className="text-xs text-slate-500">Choose an option below to add credits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-7 space-y-4">
          {/* Watch Ad Action */}
          <RewardAdButton
            onReward={onCreditGranted}
            toast={toast}
            user={user}
          />

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-xs uppercase tracking-wider font-medium">or</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Promo Code Action */}
          <button
            onClick={onOpenPromoCode}
            className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-[0.99] flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0 shadow-inner">
                <Ticket size={22} />
              </div>
              <div>
                <div className="font-bold text-lg leading-tight">Have a Promo Code?</div>
                <div className="text-indigo-100 text-xs mt-0.5 font-medium">Redeem code for instant credits</div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
              →
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Keep scanning and learning with SnapToQuiz ✨
          </p>
        </div>
      </div>
    </div>
  )
}

export { PaywallModal, RewardAdButton }