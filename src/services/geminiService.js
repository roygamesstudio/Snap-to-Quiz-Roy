import { getGeminiEndpoint, isGeminiConfigured, TIER_CONFIG } from '../config'

export class GeminiError extends Error {
  constructor(message, type) {
    super(message)
    this.name = 'GeminiError'
    this.type = type
  }
}

function classifyError(status, apiMessage = '') {
  switch (status) {
    case 400:
      if (/api.?key|invalid_argument/i.test(apiMessage)) {
        return {
          type: 'INVALID_KEY',
          message:
            'Invalid Gemini API key (HTTP 400). Create a new key in Google AI Studio and update VITE_GEMINI_API_KEY in your .env file.',
        }
      }
      return {
        type: 'API_ERROR',
        message: `The Gemini request was rejected (HTTP 400). ${apiMessage || 'Check the API key and request configuration.'}`,
      }
    case 404:
      return {
        type: 'MODEL_NOT_FOUND',
        message:
          `Gemini model not found (HTTP 404). ${apiMessage || 'Check that your API key has access to the configured model and that the model name is current.'}`,
      }
    case 403:
      return {
        type: 'DOMAIN_BLOCKED',
        message:
          'Access blocked (HTTP 403). Your Gemini API key may have domain restrictions preventing this request. Check your API key settings in Google AI Studio.',
      }
    case 429:
      return {
        type: 'RATE_LIMITED',
        message:
          'Rate limit reached (HTTP 429). You have sent too many requests. Please wait a moment and try again.',
      }
    case 503:
      return {
        type: 'SERVICE_UNAVAILABLE',
        message:
          `Gemini is temporarily unavailable (HTTP 503). ${apiMessage || 'Please wait a moment and try again.'}`,
      }
    case 401:
      return {
        type: 'INVALID_KEY',
        message:
          'Invalid API key (HTTP 401). Please check that your Gemini API key is correct.',
      }
    default:
      return {
        type: 'API_ERROR',
        message: `The AI service returned an error (HTTP ${status}). Please try again.`,
      }
  }
}

function extractText(response) {
  if (
    response.candidates &&
    response.candidates.length > 0 &&
    response.candidates[0].content &&
    response.candidates[0].content.parts &&
    response.candidates[0].content.parts.length > 0
  ) {
    return response.candidates[0].content.parts[0].text || ''
  }
  return ''
}

function parseJsonFromText(text) {
  if (!text) return null
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  cleaned = cleaned.trim()

  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1)
  }

  try {
    return JSON.parse(cleaned)
  } catch (_) {
    return null
  }
}

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generateQuizFromImage(base64Image, mimeType, isProUser = false) {
  if (!isGeminiConfigured()) {
    throw new GeminiError(
      'No Gemini API key configured. Please add your Google Gemini API key in the settings or .env file to use this feature.',
      'MISSING_KEY'
    )
  }

  const prompt = `You are an expert educator. Analyze this image (lecture notes, textbook page, or study material) and generate study materials.

Return ONLY valid JSON in this exact structure:
{
  "questions": [
    {
      "question": "Clear question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Why the correct answer is right"
    }
  ],
  "flashcards": [
    {
      "front": "Question or term",
      "back": "Answer or definition"
    }
  ]
}

${isProUser
  ? `Generate ${TIER_CONFIG.pro.minQuestions}-${TIER_CONFIG.pro.maxQuestions} detailed multiple choice questions and ${TIER_CONFIG.pro.minFlashcards}-${TIER_CONFIG.pro.maxFlashcards} detailed flashcards. Include nuanced explanations and useful distinctions for advanced performance analytics.`
  : `Generate exactly ${TIER_CONFIG.free.questions} multiple choice questions and exactly ${TIER_CONFIG.free.flashcards} flashcards.`}
Make sure the answers are accurate based on what is shown. If the image is not legible or contains no study content, return empty arrays.`

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType || 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: isProUser ? 8192 : 4096,
      responseMimeType: 'application/json',
    },
  }

  let response
  let apiMessage = ''
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      response = await fetch(getGeminiEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (_) {
      if (attempt === 2) {
        throw new GeminiError(
          'Network error connecting to the AI service. Please check your internet connection and try again.',
          'NETWORK_ERROR'
        )
      }
      await wait(800 * 2 ** attempt)
      continue
    }

    if (response.ok || !RETRYABLE_STATUSES.has(response.status) || attempt === 2) {
      break
    }
    await wait(800 * 2 ** attempt)
  }

  if (!response.ok) {
    try {
      const errorBody = await response.json()
      apiMessage = errorBody?.error?.message || ''
    } catch (_) {
      apiMessage = ''
    }
    const { type, message } = classifyError(response.status, apiMessage)
    throw new GeminiError(message, type)
  }

  let data
  try {
    data = await response.json()
  } catch (_) {
    throw new GeminiError(
      'The AI service returned an unexpected response. Please try again.',
      'PARSE_ERROR'
    )
  }

  const text = extractText(data)
  const parsed = parseJsonFromText(text)

  if (!parsed) {
    throw new GeminiError(
      'Could not parse the AI response. Please try uploading a clearer image.',
      'PARSE_ERROR'
    )
  }

  if (
    !parsed.questions ||
    !Array.isArray(parsed.questions) ||
    !parsed.flashcards ||
    !Array.isArray(parsed.flashcards)
  ) {
    throw new GeminiError(
      'The AI response was incomplete. Please try again with a different image.',
      'PARSE_ERROR'
    )
  }

  return {
    questions: parsed.questions,
    flashcards: parsed.flashcards,
  }
}