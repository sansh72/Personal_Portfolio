import { Button, CircularProgress } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

export function SuggestFixButton({
  onClick,
  analyzing,
  disabled,
}: {
  onClick: () => void
  analyzing: boolean
  disabled?: boolean
}) {
  return (
    <Button
      size="small"
      onClick={onClick}
      // Disabled while a request is in flight so a double click can't start a
      // second logical operation (and spend a second credit).
      disabled={disabled || analyzing}
      startIcon={
        analyzing ? <CircularProgress size={14} /> : <AutoAwesomeIcon fontSize="small" />
      }
      sx={{ textTransform: 'none', color: 'text.secondary', minWidth: 0, px: 1 }}
    >
      {analyzing ? 'Analyzing…' : 'Suggest Fix'}
    </Button>
  )
}
