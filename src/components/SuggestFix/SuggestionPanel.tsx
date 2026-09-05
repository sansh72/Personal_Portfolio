import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, CircularProgress, Collapse, Fade, IconButton,
  Paper, Skeleton, Stack, Typography, useMediaQuery,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { SuggestionTags } from './SuggestionTags'
import { useTypewriter } from '../../hooks/useTypewriter'
import type { SuggestFixState } from '../../hooks/useSuggestFix'
import type { QuotaStatus, Suggestion } from '../../services/suggestionsApi'

const CTA_SX = { textTransform: 'none' as const }

/** text types out → chip skeletons → chips fade in → Apply button. */
type Stage = 'text' | 'skeleton' | 'chips' | 'ready'

export function SuggestionPanel({
  state,
  suggestion,
  error,
  quota,
  onApply,
  onDismiss,
  onRetry,
  onUpgrade,
}: {
  state: SuggestFixState
  suggestion: Suggestion | null
  error: string | null
  quota: QuotaStatus | null
  onApply: (tag: string) => void
  onDismiss: () => void
  onRetry: () => void
  onUpgrade?: () => void
}) {
  // Remounted per suggestion (see the `key` where this is rendered), so a new
  // suggestion starts with nothing selected.
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Respect the OS setting: an animation someone asked not to see is worse
  // than no animation.
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [stage, setStage] = useState<Stage>(reduceMotion ? 'ready' : 'text')

  const { shown, done } = useTypewriter(suggestion?.analysis ?? '', { instant: reduceMotion })

  // Each step schedules the next. setState only happens in the timeout
  // callback, never synchronously in an effect body.
  useEffect(() => {
    if (stage !== 'text' || !done) return
    const t = setTimeout(() => setStage('skeleton'), 250)
    return () => clearTimeout(t)
  }, [stage, done])

  useEffect(() => {
    if (stage !== 'skeleton') return
    const t = setTimeout(() => setStage('chips'), 650)
    return () => clearTimeout(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'chips') return
    const t = setTimeout(() => setStage('ready'), 450)
    return () => clearTimeout(t)
  }, [stage])

  if (state === 'QUOTA_REACHED') {
    return (
      <Paper variant="outlined" sx={{ p: 2, mt: 1.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Daily AI limit reached
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
          {quota
            ? `You've used all ${quota.daily_limit} Suggest a Fix credit${
                quota.daily_limit === 1 ? '' : 's'
              } for today.`
            : "You've used all your Suggest a Fix credits for today."}
        </Typography>
        <Stack direction="row" spacing={1}>
          {quota?.plan !== 'pro' && onUpgrade && (
            <Button size="small" variant="contained" onClick={onUpgrade} sx={CTA_SX}>
              Upgrade for more credits
            </Button>
          )}
          <Button size="small" onClick={onDismiss} sx={{ textTransform: 'none' }}>
            Dismiss
          </Button>
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
            <Button size="small" color="inherit" onClick={onRetry} sx={{ textTransform: 'none' }}>
              Retry
            </Button>
            <IconButton size="small" color="inherit" onClick={onDismiss}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      >
        {error ?? 'Something went wrong. Please try again.'}
      </Alert>
    )
  }

  if (!suggestion || (state !== 'ANALYZED' && state !== 'APPLYING')) return null

  const applying = state === 'APPLYING'

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1.5, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
          What could be improved?
        </Typography>
        <IconButton size="small" onClick={onDismiss} disabled={applying}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
        {shown}
        {!done && (
          <Box
            component="span"
            sx={{
              display: 'inline-block', width: '0.5em', height: '1em', ml: '2px',
              verticalAlign: 'text-bottom', bgcolor: 'text.disabled',
              animation: 'sfCaret 1s steps(2) infinite',
              '@keyframes sfCaret': { '50%': { opacity: 0 } },
            }}
          />
        )}
      </Typography>

      <Collapse in={stage !== 'text'} timeout={300}>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
          Suggested improvements
        </Typography>

        {stage === 'skeleton' ? (
          // Same shape and rhythm as the real chips, so nothing jumps on swap.
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {suggestion.suggested_tags.map((tag, i) => (
              <Skeleton
                key={tag}
                variant="rounded"
                height={24}
                width={[110, 96, 124, 108, 100, 118][i % 6]}
                sx={{ borderRadius: 999 }}
              />
            ))}
          </Stack>
        ) : (
          <Fade in timeout={450}>
            <Box>
              <SuggestionTags
                tags={suggestion.suggested_tags}
                labels={suggestion.tag_labels}
                selected={selectedTag}
                onSelect={setSelectedTag}
                disabled={applying}
              />
            </Box>
          </Fade>
        )}
      </Collapse>

      <Collapse in={stage === 'ready'} timeout={300}>
      <Box>
        <Button
          size="small"
          variant="contained"
          disabled={!selectedTag || applying}
          onClick={() => selectedTag && onApply(selectedTag)}
          startIcon={applying ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={CTA_SX}
        >
          {applying ? 'Applying fix…' : 'Apply Fix'}
        </Button>
        <Typography variant="caption" sx={{ color: 'text.disabled', ml: 1.5 }}>
          Applying is free
        </Typography>
      </Box>
      </Collapse>
    </Paper>
  )
}
