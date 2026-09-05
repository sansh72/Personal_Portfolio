import { useRef, useState } from 'react'
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogContent,
  DialogTitle, IconButton, Stack, Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'
import type { QuotaStatus } from '../services/suggestionsApi'

const PLAN_LABELS: Record<string, string> = { free: 'Free', basic: 'Basic', pro: 'Pro' }

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function ProfileDialog({
  open,
  onClose,
  uid,
  username,
  email,
  avatarUrl,
  fallbackPhoto,
  quota,
  onAvatarChange,
  onUpgrade,
}: {
  open: boolean
  onClose: () => void
  uid: string
  username: string | null
  email?: string | null
  avatarUrl?: string
  fallbackPhoto?: string | null
  quota: QuotaStatus | null
  onAvatarChange: (url: string) => void
  onUpgrade?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    // Validate before uploading, so a bad file fails instantly and locally
    // rather than after a slow round trip.
    if (!ACCEPTED.includes(file.type)) {
      setError('Pick a JPEG, PNG, WebP or GIF image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('That image is over 5MB. Try a smaller one.')
      return
    }

    setError(null)
    setUploading(true)
    try {
      // One object per user, overwritten on each change, so old avatars don't
      // pile up in storage.
      const objectRef = ref(storage, `avatars/${uid}`)
      await uploadBytes(objectRef, file, { contentType: file.type })
      onAvatarChange(await getDownloadURL(objectRef))
    } catch {
      setError('Upload failed. Check that Firebase Storage is enabled and its rules are deployed.')
    } finally {
      setUploading(false)
    }
  }

  const shown = avatarUrl || fallbackPhoto || undefined

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { bgcolor: 'background.default', backgroundImage: 'none', border: 1, borderColor: 'divider', borderRadius: 2 } } }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        Profile
        <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar src={shown} sx={{ width: 84, height: 84 }} />
            <IconButton
              size="small"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              sx={{
                position: 'absolute', bottom: -4, right: -4,
                bgcolor: 'background.paper', border: 1, borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {uploading ? <CircularProgress size={16} /> : <PhotoCameraIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }}>{username}</Typography>
            {email && (
              <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
                {email}
              </Typography>
            )}
            <Button
              size="small"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              sx={{ textTransform: 'none', ml: -0.5, mt: 0.5 }}
            >
              {uploading ? 'Uploading…' : shown ? 'Change photo' : 'Add a photo'}
            </Button>
          </Box>
        </Stack>

        <input
          type="file"
          accept={ACCEPTED.join(',')}
          ref={inputRef}
          style={{ display: 'none' }}
          onChange={handleFile}
        />

        <Typography variant="overline" sx={{ color: 'text.disabled', letterSpacing: '0.1em' }}>
          Plan
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
          <Chip
            size="small"
            variant="outlined"
            label={PLAN_LABELS[quota?.plan ?? 'free'] ?? quota?.plan}
            sx={{ borderColor: 'divider' }}
          />
          {quota && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {quota.remaining_credits} of {quota.daily_limit} AI credits left today
            </Typography>
          )}
        </Stack>
        {quota && quota.plan !== 'pro' && onUpgrade && (
          <Button size="small" onClick={onUpgrade} sx={{ textTransform: 'none', ml: -0.5, mt: 0.5 }}>
            Upgrade plan
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
