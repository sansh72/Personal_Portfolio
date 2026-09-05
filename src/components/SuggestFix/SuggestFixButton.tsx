import { Button, CircularProgress } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

export function SuggestFixButton({
  onClick,
  analyzing,
  disabled,
  label = 'Suggest Fix',
}: {
  onClick: () => void
  analyzing: boolean
  disabled?: boolean
  label?: string
}) {
  return (
    <Button
      size="small"
      variant="outlined"
      onClick={onClick}
      // Disabled while a request is in flight so a double click can't start a
      // second logical operation (and spend a second credit).
      disabled={disabled || analyzing}
      startIcon={
        analyzing ? <CircularProgress size={13} /> : <AutoAwesomeIcon sx={{ fontSize: 15 }} />
      }
      sx={{
        // Sat in body-text colour at body size directly under a paragraph, it
        // read as another line of prose. A bordered pill reads as a control.
        textTransform: 'none',
        borderRadius: 999,
        py: 0.25,
        px: 1.5,
        fontSize: '0.78rem',
        letterSpacing: '0.01em',
        color: 'text.secondary',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        '&:hover': {
          color: 'text.primary',
          borderColor: 'text.disabled',
          bgcolor: 'action.selected',
        },
      }}
    >
      {analyzing ? 'Analyzing…' : label}
    </Button>
  )
}
