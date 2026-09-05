import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import {
  ApiError,
  analyzeSection,
  applySuggestion,
  getQuota,
} from '../services/suggestionsApi'
import type { QuotaStatus, Suggestion } from '../services/suggestionsApi'

export type SuggestFixState =
  | 'IDLE'
  | 'ANALYZING'
  | 'ANALYZED'
  | 'APPLYING'
  | 'APPLIED'
  | 'ERROR'
  | 'QUOTA_REACHED'

interface Options {
  documentId: string
  enabled: boolean
  /** Authenticated uid, for the live plan subscription below. */
  uid: string | null
  /** Called once the backend has committed the rewrite. */
  onApplied: (sectionId: string, content: string, version: number) => void
}

const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError'

export function useSuggestFix({ documentId, enabled, uid, onApplied }: Options) {
  const [state, setState] = useState<SuggestFixState>('IDLE')
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quota, setQuota] = useState<QuotaStatus | null>(null)

  const controllerRef = useRef<AbortController | null>(null)
  // One key per logical operation. A retry of the same click reuses it so the
  // backend replays the original suggestion instead of charging again.
  const keyRef = useRef<string | null>(null)
  const pendingRef = useRef<{ sectionId: string } | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  /**
   * A response is stale if its request was superseded or the component went
   * away. AbortController can't stop work already running on the backend, so
   * the frontend still has to check before touching state.
   */
  const isCurrent = (controller: AbortController) =>
    mountedRef.current && controllerRef.current === controller

  const refreshQuota = useCallback(async () => {
    if (!enabled) return
    try {
      const status = await getQuota()
      if (!mountedRef.current) return
      setQuota(status)
      setState((s) =>
        status.remaining_credits === 0 && (s === 'IDLE' || s === 'QUOTA_REACHED')
          ? 'QUOTA_REACHED'
          : s
      )
    } catch {
      // The indicator is cosmetic; the backend transaction is authoritative.
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    void (async () => {
      try {
        const status = await getQuota()
        if (cancelled || !mountedRef.current) return
        setQuota(status)
        if (status.remaining_credits === 0) setState('QUOTA_REACHED')
      } catch {
        // The indicator is cosmetic; the backend transaction is authoritative.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled])

  /**
   * Watch the user document for plan changes.
   *
   * Payment confirmation arrives as a Razorpay webhook to the backend, which
   * can land after the browser's checkout callback has already fired. Polling
   * would be guesswork, so instead this listens to the document the webhook
   * writes: Firestore pushes the change and the credit count updates on its
   * own. Also covers cancellations and renewals that happen with no browser
   * involved at all.
   */
  useEffect(() => {
    if (!enabled || !uid) return
    let previous: string | null = null
    const unsubscribe = onSnapshot(
      doc(db, 'users', uid),
      (snapshot) => {
        const data = snapshot.data()
        const signature = `${data?.plan ?? 'free'}:${data?.subscription_status ?? ''}`
        // Skip the first callback: it's the current state, not a change.
        if (previous !== null && signature !== previous) refreshQuota()
        previous = signature
      },
      () => {
        // Losing the listener only costs liveness; the backend stays authoritative.
      }
    )
    return unsubscribe
  }, [enabled, uid, refreshQuota])

  const handleFailure = (e: unknown) => {
    if (e instanceof ApiError && e.code === 'SUGGEST_FIX_QUOTA_REACHED') {
      setState('QUOTA_REACHED')
      setError(e.message)
      setQuota((q) => (q ? { ...q, remaining_credits: 0, used_today: q.daily_limit } : q))
      return
    }
    setState('ERROR')
    setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
  }

  const run = useCallback(
    async (sectionId: string, idempotencyKey: string) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      keyRef.current = idempotencyKey
      pendingRef.current = { sectionId }
      setActiveSectionId(sectionId)
      setSuggestion(null)
      setError(null)
      setState('ANALYZING')

      try {
        const result = await analyzeSection(
          documentId,
          sectionId,
          idempotencyKey,
          controller.signal
        )
        if (!isCurrent(controller)) return
        setSuggestion(result)
        setState('ANALYZED')
        setQuota({
          plan: result.plan,
          daily_limit: result.daily_limit,
          used_today: result.daily_limit - result.remaining_credits,
          remaining_credits: result.remaining_credits,
        })
      } catch (e) {
        // An aborted request means a newer operation replaced this one; its
        // response must not touch the UI.
        if (isAbort(e) || !isCurrent(controller)) return
        handleFailure(e)
      }
    },
    [documentId]
  )

  const analyze = useCallback(
    (sectionId: string) => {
      if (!enabled) return
      if (state === 'ANALYZING' || state === 'APPLYING') return
      // A fresh click is a new logical operation, so it gets a new key.
      run(sectionId, crypto.randomUUID())
    },
    [enabled, state, run]
  )

  /** Retry the same logical operation. Reuses the key, so no second credit. */
  const retry = useCallback(() => {
    const pending = pendingRef.current
    if (!pending) return
    run(pending.sectionId, keyRef.current ?? crypto.randomUUID())
  }, [run])

  const apply = useCallback(
    async (tag: string) => {
      if (!suggestion || state === 'APPLYING') return

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setState('APPLYING')
      setError(null)

      try {
        const applied = await applySuggestion(suggestion.suggestion_id, tag, controller.signal)
        if (!isCurrent(controller)) return
        onApplied(applied.section_id, applied.content, applied.version)
        setState('APPLIED')
        setSuggestion(null)
        setActiveSectionId(null)
      } catch (e) {
        if (isAbort(e) || !isCurrent(controller)) return
        if (e instanceof ApiError && e.code === 'SECTION_CHANGED') {
          // The suggestion is stale; keeping it around would only let the user
          // try again and fail again.
          setSuggestion(null)
          setActiveSectionId(null)
          setState('ERROR')
          setError(e.message)
          return
        }
        handleFailure(e)
      }
    },
    [suggestion, state, onApplied]
  )

  const dismiss = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    pendingRef.current = null
    setSuggestion(null)
    setActiveSectionId(null)
    setError(null)
    setState(quota && quota.remaining_credits === 0 ? 'QUOTA_REACHED' : 'IDLE')
  }, [quota])

  return {
    state,
    activeSectionId,
    suggestion,
    error,
    quota,
    analyze,
    apply,
    retry,
    dismiss,
    refreshQuota,
    isBusy: state === 'ANALYZING' || state === 'APPLYING',
  }
}
