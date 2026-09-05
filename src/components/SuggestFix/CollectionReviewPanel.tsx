import { Alert, Box, Button, IconButton, Paper, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { SuggestFixState } from '../../hooks/useSuggestFix'
import type { CollectionReview, QuotaStatus } from '../../services/suggestionsApi'

/**
 * Verdicts are advice, not actions. Nothing is deleted or rewritten from here -
 * removing a project is a manual edit, and rewriting one goes through that
 * project's own Suggest Fix.
 */
const VERDICT_STYLE: Record<string, { label: string; color: string; opacity: number }> = {
  keep: { label: 'Keep', color: 'success.main', opacity: 1 },
  rewrite: { label: 'Rewrite', color: 'text.primary', opacity: 1 },
  remove: { label: 'Consider removing', color: 'text.disabled', opacity: 0.7 },
}

export function CollectionReviewPanel({
  state,
  review,
  error,
  quota,
  onDismiss,
  onRetry,
  onUpgrade,
}: {
  state: SuggestFixState
  review: CollectionReview | null
  error: string | null
  quota: QuotaStatus | null
  onDismiss: () => void
  onRetry: () => void
  onUpgrade?: () => void
}) {
  if (state === 'QUOTA_REACHED') {
    return (
      <Paper variant="outlined" sx={{ p: 2, mt: 1.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Daily AI limit reached
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          {quota
            ? `You've used all ${quota.daily_limit} credits for today.`
            : "You've used all your credits for today."}
        </Typography>
        <Stack direction="row" spacing={1}>
          {quota?.plan !== 'pro' && onUpgrade && (
            <Button size="small" variant="contained" onClick={onUpgrade} sx={{ textTransform: 'none' }}>
              Upgrade for more credits
            </Button>
          )}
          <Button size="small" onClick={onDismiss} sx={{ textTransform: 'none' }}>Dismiss</Button>
        </Stack>
      </Paper>
    )
  }

  if (state === 'ERROR') {
    return (
      <Alert
        severity="error"
        sx={{ mt: 1.5 }}
        action={
          <Stack direction="row" spacing={1}>
            <Button size="small" color="inherit" onClick={onRetry} sx={{ textTransform: 'none' }}>Retry</Button>
            <IconButton size="small" color="inherit" onClick={onDismiss}><CloseIcon fontSize="small" /></IconButton>
          </Stack>
        }
      >
        {error ?? 'Something went wrong. Please try again.'}
      </Alert>
    )
  }

  if (!review || state !== 'ANALYZED') return null

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1.5, mb: 2, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
          Which of these to keep
        </Typography>
        <IconButton size="small" onClick={onDismiss}><CloseIcon fontSize="small" /></IconButton>
      </Stack>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
        {review.analysis}
      </Typography>

      <Stack spacing={1.25}>
        {review.items.map((item) => {
          const style = VERDICT_STYLE[item.verdict] ?? VERDICT_STYLE.keep
          return (
            <Box
              key={item.index}
              sx={{
                display: 'flex',
                gap: 1.5,
                opacity: style.opacity,
                pl: 1.5,
                borderLeft: 2,
                borderColor: style.color,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.title || `Item ${item.index + 1}`}
                  </Typography>
                  <Typography variant="caption" sx={{ color: style.color, fontWeight: 600 }}>
                    {style.label}
                  </Typography>
                </Stack>
                {item.reason && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {item.reason}
                  </Typography>
                )}
              </Box>
            </Box>
          )
        })}
      </Stack>

      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 2 }}>
        Advice only — nothing is changed for you. Open a project to rewrite it.
      </Typography>
    </Paper>
  )
}
