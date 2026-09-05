import { Chip } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import type { QuotaStatus } from '../../services/suggestionsApi'

export function QuotaIndicator({
  quota,
  onUpgrade,
}: {
  quota: QuotaStatus | null
  onUpgrade?: () => void
}) {
  if (!quota) return null

  const exhausted = quota.remaining_credits === 0
  const canUpgrade = exhausted && quota.plan !== 'pro' && Boolean(onUpgrade)

  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<AutoAwesomeIcon fontSize="small" />}
      label={
        exhausted
          ? canUpgrade
            ? 'Daily AI limit reached — Upgrade'
            : 'Daily AI limit reached'
          : `${quota.remaining_credits} AI suggestion${
              quota.remaining_credits === 1 ? '' : 's'
            } left today`
      }
      // Only clickable when there's somewhere useful to go.
      onClick={canUpgrade ? onUpgrade : undefined}
      sx={{
        // No colour anywhere else on the page, so the empty state signals by
        // going full-contrast rather than by turning amber.
        color: exhausted ? 'text.primary' : 'text.secondary',
        borderColor: exhausted ? 'text.disabled' : 'divider',
        '& .MuiChip-icon': { color: exhausted ? 'text.primary' : 'text.disabled' },
      }}
    />
  )
}
