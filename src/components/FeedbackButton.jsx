import { useState } from 'react'
import { Bug, MessageSquare, Send, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function FeedbackButton({ user, onRequestAuth, toast }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState('feedback')
  const [sending, setSending] = useState(false)

  function handleOpen() {
    if (!user) {
      toast.info('Please sign in before sending feedback.')
      onRequestAuth()
      return
    }
    setOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user || !supabase || !message.trim() || sending) return
    setSending(true)
    const { error } = await supabase.functions.invoke('send-feedback', {
      body: { message: message.trim(), type },
    })
    setSending(false)
    if (error) {
      toast.error('Feedback could not be sent. Please try again.')
      return
    }
    toast.success('Thanks! Your feedback was sent.')
    setMessage('')
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <MessageSquare size={16} />
        Send Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                <h2 className="font-semibold text-slate-900">Send Feedback</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Close feedback form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('feedback')}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${type === 'feedback' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                >
                  Feedback
                </button>
                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={`flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium ${type === 'bug' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600'}`}
                >
                  <Bug size={15} />
                  Bug report
                </button>
              </div>
              <textarea
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                placeholder="Tell us what happened or how we can improve..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                {sending ? 'Sending...' : 'Send feedback'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
