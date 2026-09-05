import { auth } from '../firebase'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export interface Suggestion {
  suggestion_id: string
  section_id: string
  source_version: number
  analysis: string
  suggested_tags: string[]
  tag_labels: Record<string, string>
  remaining_credits: number
  daily_limit: number
  plan: string
}

export interface AppliedSection {
  section_id: string
  version: number
  content: string
}

export interface QuotaStatus {
  plan: string
  daily_limit: number
  used_today: number
  remaining_credits: number
}

/** Error carrying the backend's machine-readable code, so callers can branch. */
export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Sign in to use AI suggestions.', 401)
  return { Authorization: `Bearer ${await user.getIdToken()}` }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeader()),
      ...(init.headers as Record<string, string> | undefined),
    },
  })

  let body: Record<string, unknown> = {}
  try {
    body = await response.json()
  } catch {
    // A proxy or crash can return a non-JSON body; fall through to a generic error.
  }

  if (!response.ok) {
    throw new ApiError(
      typeof body.code === 'string' ? body.code : 'UNKNOWN_ERROR',
      typeof body.message === 'string' ? body.message : 'Something went wrong. Please try again.',
      response.status
    )
  }
  return body as T
}

export function getQuota(signal?: AbortSignal) {
  return request<QuotaStatus>('/api/v1/suggest-fix/quota', { method: 'GET', signal })
}

/**
 * Analyze a section. Consumes one daily credit.
 *
 * `idempotencyKey` identifies one logical Suggest Fix operation, not one HTTP
 * transmission: retrying a failed send with the same key returns the original
 * suggestion instead of spending a second credit.
 */
export function analyzeSection(
  documentId: string,
  sectionId: string,
  idempotencyKey: string,
  signal?: AbortSignal
) {
  return request<Suggestion>('/api/v1/suggestions', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ document_id: documentId, section_id: sectionId }),
    signal,
  })
}

/** Apply one suggested tag. Consumes no credits. */
export function applySuggestion(suggestionId: string, tag: string, signal?: AbortSignal) {
  return request<AppliedSection>(
    `/api/v1/suggestions/${encodeURIComponent(suggestionId)}/apply`,
    { method: 'POST', body: JSON.stringify({ tag }), signal }
  )
}
