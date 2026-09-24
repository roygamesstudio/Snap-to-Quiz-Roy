import { useEffect, useRef } from 'react'
import { config, isAdsterraConfigured } from '../config'

function getScriptUrl() {
  return config.ADSTERRA_SCRIPT_URL.replace(
    '{ZONE_ID}',
    encodeURIComponent(config.ADSTERRA_KEY),
  )
}

function loadAdsterraScript(container) {
  const existingScript = container.querySelector('script[data-adsterra-script]')
  if (existingScript) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.async = true
    script.src = getScriptUrl()
    script.dataset.adsterraScript = 'true'
    script.dataset.zoneId = config.ADSTERRA_KEY
    script.addEventListener('load', resolve, { once: true })
    script.addEventListener('error', reject, { once: true })
    container.appendChild(script)
  })

}

export default function AdBanner({ className = '' }) {
  const insRef = useRef(null)
  const adsEnabled = isAdsterraConfigured()

  useEffect(() => {
    if (!adsEnabled || !insRef.current) return undefined

    let active = true

    loadAdsterraScript(insRef.current).catch(() => {
      if (active) insRef.current?.classList.add('ad-load-failed')
    })

    return () => {
      active = false
    }
  }, [adsEnabled])

  return (
    <div
      ref={insRef}
      className={`ad-container min-h-[90px] overflow-hidden ${className}`}
      data-ad-network="adsterra"
      data-zone-id={config.ADSTERRA_KEY || undefined}
      aria-label="Advertisement"
    >
      {!adsEnabled && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200">
          <div className="flex items-center justify-center py-4 px-6">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-0.5">
                Sponsored
              </p>
              <p className="text-sm text-slate-500">
                Ad Space (Test Mode)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
