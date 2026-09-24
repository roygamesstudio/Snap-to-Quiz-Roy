import { useState } from 'react'
import { Ticket, Loader as Loader2, X, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react'
import { redeemPromoCode } from '../services/creditService'

export function PromoCodeModal({ open, onClose, onRedeemed, toast }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim() || loading) return
    setLoading(true)
    setResult(null)
    const res = await redeemPromoCode(code)
    setLoading(false)

    if (res?.success) {
      setResult({ success: true, credits: res.credits_awarded })
      toast.success(`Promo code applied! +${res.credits_awarded} scan credits added.`)
      onRedeemed?.()
      setTimeout(() => {
        setCode('')
        setResult(null)
        onClose()
      }, 2500)
    } else {
      setResult({ success: false, error: res?.error || 'Could not redeem promo code.' })
    }
  }

  function handleClose() {
    setCode('')
    setResult(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Ticket size={20} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Redeem Promo Code</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <p className="text-sm text-slate-500 text-center">
            Enter a promo code to receive bonus scan credits.
          </p>

          {result?.success && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 animate-fade-in">
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 font-medium">
                {result.credits} credits added to your account!
              </p>
            </div>
          )}

          {result && !result.success && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 animate-fade-in">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{result.error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter promo code"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-slate-900 text-center text-lg font-medium tracking-wider uppercase"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Redeeming...
                </>
              ) : (
                <>
                  <Ticket size={18} />
                  Redeem Code
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
