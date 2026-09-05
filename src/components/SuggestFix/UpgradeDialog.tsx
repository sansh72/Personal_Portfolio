import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle,
  Stack, Typography,
} from '@mui/material'
import { createSubscription, getPaymentsConfig, loadRazorpayCheckout } from '../../services/paymentsApi'
import type { PaymentsConfig } from '../../services/paymentsApi'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

const PLAN_NAMES: Record<string, string> = { free: 'Free', basic: 'Basic', pro: 'Pro' }

/**
 * The rest of the site is near-black with thin outlined borders and no colour.
 * MUI's Dialog defaults fight that: an elevation overlay turns the surface
 * grey, and Button defaults to primary blue. Both are overridden here rather
 * than in the global theme, which would change every other surface too.
 */
const DIALOG_PAPER = {
  sx: {
    bgcolor: 'background.default',
    backgroundImage: 'none',
    border: 1,
    borderColor: 'divider',
    borderRadius: 2,
  },
}

const CTA_SX = { textTransform: 'none' as const }

/** How long to wait for the webhook before telling the user to check back. */
const CONFIRM_TIMEOUT_MS = 40_000

export function UpgradeDialog({
  open,
  onClose,
  currentPlan,
  dailyLimit,
  userEmail,
  onCheckoutStarted,
}: {
  open: boolean
  onClose: () => void
  /** Live plan from the backend. Changes when the Razorpay webhook lands. */
  currentPlan: string
  dailyLimit?: number
  userEmail?: string | null
  onCheckoutStarted?: () => void
}) {
  const [config, setConfig] = useState<PaymentsConfig | null>(null)
  const [busyPlan, setBusyPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The plan the user paid for. Set once checkout reports success; we then
  // wait for the backend to confirm it independently.
  const [awaitingPlan, setAwaitingPlan] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  // Confirmation comes from the backend agreeing the plan changed - never from
  // the browser's checkout callback, which can't prove a payment happened.
  const confirmed = awaitingPlan !== null && currentPlan === awaitingPlan

  // Reset when the dialog is reopened for a new attempt.
  useEffect(() => {
    if (!open) {
      setAwaitingPlan(null)
      setTimedOut(false)
      setError(null)
    }
  }, [open])

  // The payment did succeed; only the webhook is late. Say that, rather than
  // implying a failure.
  useEffect(() => {
    if (awaitingPlan === null || confirmed) return
    const timer = setTimeout(() => setTimedOut(true), CONFIRM_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [awaitingPlan, confirmed])

  // Let the confirmation land visibly before closing.
  useEffect(() => {
    if (!confirmed) return
    const timer = setTimeout(() => onClose(), 2500)
    return () => clearTimeout(timer)
  }, [confirmed, onClose])

  useEffect(() => {
    if (!open) return
    getPaymentsConfig().then(setConfig).catch(() => setError('Could not load plans.'))
  }, [open])

  const startCheckout = async (plan: string) => {
    setBusyPlan(plan)
    setError(null)
    try {
      const [subscription] = await Promise.all([createSubscription(plan), loadRazorpayCheckout()])
      if (!window.Razorpay) throw new Error('Checkout unavailable.')

      new window.Razorpay({
        key: subscription.key_id,
        subscription_id: subscription.subscription_id,
        name: 'Portflow',
        description: `${PLAN_NAMES[plan] ?? plan} plan`,
        prefill: userEmail ? { email: userEmail } : undefined,
        // The plan is granted by the signed Razorpay webhook, never here. This
        // handler only says "checkout reported success" - the dialog then waits
        // for the backend to confirm it.
        handler: () => {
          setAwaitingPlan(plan)
          onCheckoutStarted?.()
        },
        modal: {
          // User closed checkout without paying.
          ondismiss: () => setBusyPlan(null),
        },
      }).open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout.')
    } finally {
      setBusyPlan(null)
    }
  }

  const awaitedCredits = config?.plans.find(p => p.plan === awaitingPlan)?.daily_credits

  // --- after payment: confirming / confirmed / webhook running late ---
  if (awaitingPlan !== null) {
    return (
      <Dialog open={open} onClose={confirmed || timedOut ? onClose : undefined} maxWidth="xs" fullWidth slotProps={{ paper: DIALOG_PAPER }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {confirmed ? `You’re on ${PLAN_NAMES[awaitingPlan] ?? awaitingPlan}` : 'Payment received'}
        </DialogTitle>
        <DialogContent>
          {confirmed ? (
            <Stack spacing={1.5} sx={{ py: 1 }}>
              <Typography variant="body2">
                Your plan is active. You now get{' '}
                <strong>{dailyLimit ?? awaitedCredits} AI suggestions per day</strong>.
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Your new credits are available immediately.
              </Typography>
            </Stack>
          ) : timedOut ? (
            <Stack spacing={1.5} sx={{ py: 1 }}>
              {/* The payment succeeded - only the confirmation is slow. Saying
                  anything that sounds like failure here would be wrong. */}
              <Typography variant="body2">
                Your payment went through. Your plan is taking a moment to activate.
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                It usually lands within a minute. You don’t need to pay again.
              </Typography>
              <Box>
                <Button size="small" onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
              </Box>
            </Stack>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={22} />
              <Box>
                <Typography variant="body2">Confirming your payment…</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Activating your {PLAN_NAMES[awaitingPlan] ?? awaitingPlan} plan.
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: DIALOG_PAPER }}>
      <DialogTitle sx={{ fontWeight: 600 }}>More AI credits</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!config ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {config.plans.map((option) => {
              const isCurrent = option.plan === currentPlan
              const purchasable = option.plan !== 'free' && config.enabled
              return (
                <Box
                  key={option.plan}
                  sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontWeight: 600 }}>
                          {PLAN_NAMES[option.plan] ?? option.plan}
                        </Typography>
                        {isCurrent && (
                          <Chip
                            size="small"
                            label="Current"
                            variant="outlined"
                            sx={{ borderColor: 'divider', color: 'text.disabled' }}
                          />
                        )}
                      </Stack>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {option.daily_credits} AI suggestions per day
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {option.price_inr === 0 ? 'Free' : `₹${option.price_inr}/mo`}
                      </Typography>
                      {purchasable && !isCurrent && (
                        <Button
                          size="small"
                          variant="contained"
                          disabled={busyPlan !== null}
                          onClick={() => startCheckout(option.plan)}
                          sx={CTA_SX}
                        >
                          {busyPlan === option.plan ? 'Opening…' : 'Choose'}
                        </Button>
                      )}
                    </Box>
                  </Stack>
                </Box>
              )
            })}
            {!config.enabled && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Paid plans aren't available yet.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
