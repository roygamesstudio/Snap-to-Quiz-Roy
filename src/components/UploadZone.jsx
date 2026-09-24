import { useRef, useState } from 'react'
import { UploadCloud, Camera, ImageIcon, Loader2, X, Sparkles } from 'lucide-react'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/jpg']
const MAX_SIZE = 10 * 1024 * 1024

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const commaIdx = result.indexOf(',')
      resolve({
        base64: result.slice(commaIdx + 1),
        dataUrl: result,
        mimeType: file.type || 'image/jpeg',
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function UploadZone({ onResult, onError, onScanStart, onRequireAuth }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  async function handleFile(file) {
    if (!onRequireAuth()) return
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      onError('Please upload a JPG or PNG image.')
      return
    }
    if (file.size > MAX_SIZE) {
      onError('Image is too large. Please use an image under 10MB.')
      return
    }

    try {
      const { base64, dataUrl, mimeType } = await fileToBase64(file)
      setPreview(dataUrl)
      setLoading(true)
      onScanStart()
      const result = await onResult(base64, mimeType)
      setLoading(false)
      return result
    } catch (err) {
      setLoading(false)
      onError(err.message || 'Failed to process the image.')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (!onRequireAuth()) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragging(false)
  }

  function clearPreview() {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 ${
            dragging
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
              <ImageIcon size={32} className="text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Upload your lecture notes or textbook page
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Drag &amp; drop or click below. JPG and PNG supported.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (onRequireAuth()) fileInputRef.current?.click()
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <UploadCloud size={18} />
                Choose File
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRequireAuth()) cameraInputRef.current?.click()
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                <Camera size={18} />
                Take Photo
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200">
          <div className="relative">
            <img
              src={preview}
              alt="Uploaded study material"
              className="w-full max-h-[400px] object-contain bg-slate-50"
            />
            {!loading && (
              <button
                onClick={clearPreview}
                className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="Remove image"
              >
                <X size={18} />
              </button>
            )}
            {loading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Loader2 size={28} className="text-white animate-spin" />
                </div>
                <p className="text-white font-medium flex items-center gap-2">
                  <Sparkles size={16} />
                  Analyzing your image with AI...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
