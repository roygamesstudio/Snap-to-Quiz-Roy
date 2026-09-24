import { Calendar, Crown, X, Clock } from 'lucide-react'

function formatDateTime(isoString) {
  if (!isoString) return null
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return null
  return {
    date: date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }
}

export function SubscriptionExpirationModal({ open, onClose, proExpiresAt, justSubscribed }) {
  if (!open) return null

  const formatted = formatDateTime(proExpiresAt)

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
            <h3 className="text-lg font-bold text-slate-900">
              {justSubscribed ? 'Pro Subscription Active!' : 'Pro Subscription Details'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-8 pt-2">
          {justSubscribed && (
            <div className="text-center mb-6 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mx-auto mb-4">
                <Crown size={36} className="text-amber-500" />
              </div>
              <p className="text-lg font-semibold text-slate-900">
                Welcome to Pro!
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Your subscription is now active.
              </p>
            </div>
          )}

          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Calendar size={20} className="text-amber-600" />
              <p className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                Subscription Expires
              </p>
            </div>

            {formatted ? (
              <>
                <p className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
                  {formatted.date}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-amber-700">
                  <Clock size={16} />
                  <p className="text-lg font-semibold">{formatted.time}</p>
                </div>
              </>
            ) : (
              <p className="text-lg font-semibold text-slate-700">
                No expiration date available
              </p>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
            Your Pro plan includes 300 AI scans per month. After the expiration
            date, your account will automatically revert to the free tier.
          </p>

          <button
            onClick={onClose}
            className="w-full mt-6 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export { formatDateTime }
