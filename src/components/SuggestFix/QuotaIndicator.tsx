import { Box, Button, Stack, Typography } from '@mui/material'
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

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
      <AutoAwesomeIcon
        fontSize="small"
        sx={{ color: exhausted ? 'warning.main' : 'text.disabled' }}
      />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {exhausted
          ? 'Daily AI limit reached'
          : `${quota.remaining_credits} AI suggestion${
              quota.remaining_credits === 1 ? '' : 's'
            } remaining today`}
      </Typography>
      {exhausted && quota.plan !== 'pro' && onUpgrade && (
        <Box>
          <Button size="small" onClick={onUpgrade} sx={{ textTransform: 'none', py: 0 }}>
            Upgrade
          </Button>
        </Box>
      )}
    </Stack>
  )
}
