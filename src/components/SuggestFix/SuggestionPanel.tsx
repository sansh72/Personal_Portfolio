import { useState } from 'react'
import { Alert, Box, Button, CircularProgress, IconButton, Paper, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { SuggestionTags } from './SuggestionTags'
import type { SuggestFixState } from '../../hooks/useSuggestFix'
import type { QuotaStatus, Suggestion } from '../../services/suggestionsApi'

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
            <Button size="small" variant="contained" onClick={onUpgrade} sx={{ textTransform: 'none' }}>
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
        {suggestion.analysis}
      </Typography>

      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
        Suggested improvements
      </Typography>

      <SuggestionTags
        tags={suggestion.suggested_tags}
        labels={suggestion.tag_labels}
        selected={selectedTag}
        onSelect={setSelectedTag}
        disabled={applying}
      />

      <Box>
        <Button
          size="small"
          variant="contained"
          disabled={!selectedTag || applying}
          onClick={() => selectedTag && onApply(selectedTag)}
          startIcon={applying ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ textTransform: 'none' }}
        >
          {applying ? 'Applying fix…' : 'Apply Fix'}
        </Button>
        <Typography variant="caption" sx={{ color: 'text.disabled', ml: 1.5 }}>
          Applying is free
        </Typography>
      </Box>
    </Paper>
  )
}
