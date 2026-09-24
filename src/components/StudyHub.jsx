import { useState } from 'react'
import {
  Brain,
  Layers,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Trophy,
  Copy,
  Download,
  Shuffle,
  ChevronLeft,
} from 'lucide-react'

function QuizMode({ questions, isProUser, onQuizComplete }) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState([])

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Brain size={40} className="mx-auto mb-3 text-slate-300" />
        <p>No quiz questions were generated. Try a different image.</p>
      </div>
    )
  }

  const q = questions[current]
  const isLast = current === questions.length - 1

  function handleSelect(idx) {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    const correct = idx === q.correctAnswerIndex
    if (correct) setScore((s) => s + 1)
    setAnswers((prev) => [...prev, { questionIdx: current, selected: idx, correct }])
  }

  function next() {
    if (isLast) {
      onQuizComplete?.({
        score,
        total: questions.length,
        weakSpots: answers.filter((answer) => !answer.correct).map((answer) => questions[answer.questionIdx].question),
      })
      setFinished(true)
      return
    }
    setCurrent((c) => c + 1)
    setSelected(null)
    setAnswered(false)
  }

  function restart() {
    setCurrent(0)
    setSelected(null)
    setAnswered(false)
    setScore(0)
    setFinished(false)
    setAnswers([])
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mx-auto mb-4">
          <Trophy size={36} className="text-amber-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Quiz Complete!</h3>
        <p className="text-lg text-slate-600 mb-1">
          You scored <span className="font-bold text-blue-600">{score}</span> out of{' '}
          <span className="font-bold">{questions.length}</span>
        </p>
        <p className="text-3xl font-bold text-slate-900 mb-6">{percentage}%</p>

        {isProUser && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">
            <p className="text-sm font-semibold text-blue-900">Mastery breakdown</p>
            <p className="mt-1 text-sm text-blue-800">
              {percentage >= 80 ? 'Strong mastery' : percentage >= 60 ? 'Developing mastery' : 'Needs review'}
            </p>
            {answers.some((answer) => !answer.correct) && (
              <p className="mt-2 text-xs text-blue-700">
                Weak spots: {answers.filter((answer) => !answer.correct).length} question(s) to revisit.
              </p>
            )}
          </div>
        )}

        <div className="max-w-md mx-auto space-y-2 mb-6 text-left">
          {questions.map((question, i) => {
            const ans = answers.find((a) => a.questionIdx === i)
            const correct = ans?.correct
            return (
              <div
                key={i}
                className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
                  correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}
              >
                {correct ? (
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                )}
                <span className="flex-1">{question.question}</span>
              </div>
            )
          })}
        </div>

        <button
          onClick={restart}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          <RotateCcw size={18} />
          Retry Quiz
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500">
          Question {current + 1} of {questions.length}
        </span>
        <span className="text-sm font-medium text-blue-600">
          Score: {score}
        </span>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-5 leading-relaxed">
        {q.question}
      </h3>

      <div className="space-y-2.5 mb-6">
        {q.options.map((option, idx) => {
          const isSelected = selected === idx
          const isCorrect = idx === q.correctAnswerIndex
          let style = 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50'
          if (answered) {
            if (isCorrect) {
              style = 'border-green-500 bg-green-50'
            } else if (isSelected) {
              style = 'border-red-500 bg-red-50'
            } else {
              style = 'border-slate-200 bg-white opacity-60'
            }
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${style}`}
            >
              <span className="text-sm sm:text-base text-slate-800">{option}</span>
              {answered && isCorrect && (
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
              )}
              {answered && isSelected && !isCorrect && (
                <XCircle size={20} className="text-red-600 flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 animate-fade-in">
          <p className="text-sm text-blue-900 leading-relaxed">
            <span className="font-semibold">Explanation: </span>
            {q.explanation}
          </p>
        </div>
      )}

      {answered && (
        <button
          onClick={next}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors animate-fade-in"
        >
          {isLast ? 'See Results' : 'Next Question'}
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  )
}

function FlashcardMode({ flashcards }) {
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffled, setShuffled] = useState(flashcards || [])

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Layers size={40} className="mx-auto mb-3 text-slate-300" />
        <p>No flashcards were generated. Try a different image.</p>
      </div>
    )
  }

  const card = shuffled[current]

  function goNext() {
    setFlipped(false)
    setTimeout(() => {
      setCurrent((c) => (c + 1) % shuffled.length)
    }, 200)
  }

  function goPrev() {
    setFlipped(false)
    setTimeout(() => {
      setCurrent((c) => (c - 1 + shuffled.length) % shuffled.length)
    }, 200)
  }

  function shuffleCards() {
    const arr = [...flashcards]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setShuffled(arr)
    setCurrent(0)
    setFlipped(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500">
          Card {current + 1} of {shuffled.length}
        </span>
        <button
          onClick={shuffleCards}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 transition-colors"
        >
          <Shuffle size={15} />
          Shuffle
        </button>
      </div>

      <div
        className={`flip-card ${flipped ? 'flipped' : ''} cursor-pointer`}
        style={{ height: '320px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="flip-card-inner">
          <div className="flip-card-front bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-blue-200 mb-3">
                Question
              </p>
              <p className="text-lg sm:text-xl text-white font-medium leading-relaxed">
                {card.front}
              </p>
              <p className="text-xs text-blue-200 mt-6">Click to flip</p>
            </div>
          </div>
          <div className="flip-card-back bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-lg">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-emerald-200 mb-3">
                Answer
              </p>
              <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
                {card.back}
              </p>
              <p className="text-xs text-emerald-200 mt-6">Click to flip back</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goPrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors text-sm"
        >
          Flip Card
        </button>
        <button
          onClick={goNext}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

function exportToText(flashcards) {
  return flashcards
    .map((c, i) => `Card ${i + 1}\nFront: ${c.front}\nBack: ${c.back}`)
    .join('\n\n')
}

export default function StudyHub({ result, onReset, toast, isProUser, onQuizComplete, stats }) {
  const [tab, setTab] = useState('quiz')

  if (!result) return null

  const hasQuiz = result.questions && result.questions.length > 0
  const hasFlashcards = result.flashcards && result.flashcards.length > 0

  async function copyFlashcards() {
    const text = exportToText(result.flashcards)
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Flashcards copied to clipboard!')
    } catch (_) {
      toast.error('Could not copy to clipboard.')
    }
  }

  function downloadFlashcards() {
    const text = exportToText(result.flashcards)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'snap-to-quiz-flashcards.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Flashcards exported as text file.')
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setTab('quiz')}
            disabled={!hasQuiz}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'quiz'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Brain size={16} />
            Quiz
          </button>
          <button
            onClick={() => setTab('flashcards')}
            disabled={!hasFlashcards}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'flashcards'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Layers size={16} />
            Flashcards
          </button>
        </div>

        {tab === 'flashcards' && hasFlashcards && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyFlashcards}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 transition-colors px-2 py-1"
            >
              <Copy size={15} />
              <span className="hidden sm:block">Copy</span>
            </button>
            <button
              onClick={downloadFlashcards}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 transition-colors px-2 py-1"
            >
              <Download size={15} />
              <span className="hidden sm:block">Export</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {tab === 'quiz' ? (
          <QuizMode
            questions={result.questions}
            isProUser={isProUser}
            onQuizComplete={onQuizComplete}
          />
        ) : (
          <FlashcardMode flashcards={result.flashcards} />
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-500">
        Quizzes completed: {stats?.completed || 0} · Current streak: {stats?.streak || 0}
      </div>

      <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex justify-center">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          <RotateCcw size={16} />
          Scan Another Image
        </button>
      </div>
    </div>
  )
}
