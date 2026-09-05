/**
 * Backend base URL.
 *
 * Vite inlines env vars at build time, so a missing VITE_BACKEND_URL doesn't
 * fail loudly - it compiles to the literal `undefined`, and requests end up at
 * `https://yoursite.com/undefined/...`. The fallback below keeps production
 * working even when the build environment forgets the variable; setting
 * VITE_BACKEND_URL still overrides it.
 *
 * Falling back to localhost in production would be worse than useless: in a
 * visitor's browser that points at *their* machine, not a server.
 */
const FALLBACK = import.meta.env.DEV
  ? 'http://localhost:8000'
  : 'https://portflow-backend-m7jo.onrender.com'

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || FALLBACK
