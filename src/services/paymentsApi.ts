import { auth } from '../firebase'
import { ApiError } from './suggestionsApi'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export interface PlanOption {
  plan: string
  price_inr: number
  daily_credits: number
}

export interface PaymentsConfig {
  key_id: string | null
  enabled: boolean
  plans: PlanOption[]
}

export async function getPaymentsConfig(): Promise<PaymentsConfig> {
  const response = await fetch(`${BACKEND_URL}/api/v1/payments/config`)
  if (!response.ok) throw new ApiError('PAYMENTS_UNAVAILABLE', 'Could not load plans.', response.status)
  return response.json()
}

export async function createSubscription(
  plan: string
): Promise<{ subscription_id: string; key_id: string; plan: string }> {
  const user = auth.currentUser
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Sign in to upgrade.', 401)

  const response = await fetch(`${BACKEND_URL}/api/v1/payments/subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify({ plan }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(
      body.code ?? 'PAYMENT_PROVIDER_ERROR',
      body.message ?? 'Could not start checkout.',
      response.status
    )
  }
  return body
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

/** Load Razorpay's checkout script once, on demand. */
export function loadRazorpayCheckout(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${CHECKOUT_SRC}"]`)) return resolve()
    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Razorpay checkout.'))
    document.body.appendChild(script)
  })
}
