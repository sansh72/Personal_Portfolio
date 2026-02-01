import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './App.css'
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  TextField,
  Container,
  Stack,
  IconButton,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
  Divider,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import PublishIcon from '@mui/icons-material/Publish'
import GoogleIcon from '@mui/icons-material/Google'
import { useAuth } from './contexts/AuthContext'
import { useUserData, usePublicProfile } from './hooks/useUserData'
import type { PortfolioData, LogEntry } from './hooks/useUserData'

function EditableText({
  value,
  onChange,
  editMode,
  variant = 'body1',
  sx = {}
}: {
  value: string
  onChange: (value: string) => void
  editMode: boolean
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'subtitle1' | 'subtitle2'
  sx?: object
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setTempValue(value)
  }, [value])

  const handleDoubleClick = () => {
    if (editMode) {
      setIsEditing(true)
      setTempValue(value)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    onChange(tempValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
    if (e.key === 'Escape') {
      setTempValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <TextField
        inputRef={inputRef}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        multiline
        fullWidth
        variant="outlined"
        size="small"
        sx={{ ...sx }}
      />
    )
  }

  return (
    <Typography
      variant={variant}
      sx={{
        ...sx,
        cursor: editMode ? 'pointer' : 'inherit',
        px: editMode ? 0.5 : 0,
        py: editMode ? 0.25 : 0,
        borderRadius: 0.5,
        transition: 'background 0.2s',
        '&:hover': editMode ? { bgcolor: 'action.hover' } : {}
      }}
      onDoubleClick={handleDoubleClick}
    >
      {value}
    </Typography>
  )
}

function Logs({ editMode, logs, onUpdate }: {
  editMode: boolean
  logs: LogEntry[]
  onUpdate: (logs: LogEntry[]) => void
}) {
  const addLog = () => {
    const today = new Date().toISOString().split('T')[0]
    const newLog: LogEntry = {
      id: Date.now().toString(),
      date: today,
      content: "What did you do today?"
    }
    onUpdate([newLog, ...logs])
  }

  const updateLog = (id: string, field: 'date' | 'content', value: string) => {
    onUpdate(logs.map(log => log.id === id ? { ...log, [field]: value } : log))
  }

  const removeLog = (id: string) => {
    onUpdate(logs.filter(log => log.id !== id))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
          Daily Logs
        </Typography>
        {editMode && (
          <IconButton size="small" onClick={addLog}>
            <AddIcon />
          </IconButton>
        )}
      </Stack>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        A simple journal to track your daily progress.
      </Typography>

      <Stack spacing={0}>
        {logs.map((log, index) => (
          <Box key={log.id}>
            <Box sx={{ py: 3, position: 'relative' }}>
              {editMode && (
                <IconButton
                  size="small"
                  onClick={() => removeLog(log.id)}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 0,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                    width: 24,
                    height: 24
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                {formatDate(log.date)}
              </Typography>

              <EditableText
                value={log.content}
                onChange={(v) => updateLog(log.id, 'content', v)}
                editMode={editMode}
                sx={{ color: 'text.primary', lineHeight: 1.8 }}
              />
            </Box>
            {index < logs.length - 1 && <Divider />}
          </Box>
        ))}
      </Stack>

      {logs.length === 0 && (
        <Typography sx={{ color: 'text.disabled', textAlign: 'center', py: 8 }}>
          No logs yet. {editMode && 'Click + to add your first entry.'}
        </Typography>
      )}
    </Box>
  )
}

function Portfolio({ editMode, data, updateField, updateExperience, updateProject, updateSkill, addExperience, addProject, addSkill, removeExperience, removeProject, removeSkill }: {
  editMode: boolean
  data: PortfolioData
  updateField: <K extends keyof PortfolioData>(field: K, value: PortfolioData[K]) => void
  updateExperience: (index: number, field: keyof PortfolioData['experience'][0], value: string) => void
  updateProject: (index: number, field: keyof PortfolioData['projects'][0], value: string) => void
  updateSkill: (index: number, value: string) => void
  addExperience: () => void
  addProject: () => void
  addSkill: () => void
  removeExperience: (index: number) => void
  removeProject: (index: number) => void
  removeSkill: (index: number) => void
}) {
  return (
    <>
      {/* Header */}
      <Box component="header" sx={{ mb: 8 }}>
        <EditableText
          value={data.name}
          onChange={(v) => updateField('name', v)}
          editMode={editMode}
          variant="h3"
          sx={{ fontWeight: 600, letterSpacing: '-0.02em', mb: 1 }}
        />
        <EditableText
          value={data.title}
          onChange={(v) => updateField('title', v)}
          editMode={editMode}
          variant="h6"
          sx={{ color: 'text.secondary', fontWeight: 400 }}
        />
      </Box>

      {/* About */}
      <Box component="section" sx={{ mb: 6 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em', mb: 2, display: 'block' }}>
          About
        </Typography>
        <EditableText
          value={data.bio}
          onChange={(v) => updateField('bio', v)}
          editMode={editMode}
          variant="body1"
          sx={{ color: 'text.secondary', lineHeight: 1.7, fontSize: '1.1rem' }}
        />
      </Box>

      {/* Experience */}
      <Box component="section" sx={{ mb: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
            Experience
          </Typography>
          {editMode && (
            <IconButton size="small" onClick={addExperience}>
              <AddIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
        <Stack spacing={4}>
          {data.experience.map((exp, i) => (
            <Box key={i} sx={{ position: 'relative' }}>
              {editMode && (
                <IconButton
                  size="small"
                  onClick={() => removeExperience(i)}
                  sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
              <Stack direction="row" spacing={0.5} alignItems="baseline" flexWrap="wrap">
                <EditableText value={exp.role} onChange={(v) => updateExperience(i, 'role', v)} editMode={editMode} sx={{ fontWeight: 600 }} />
                <Typography sx={{ color: 'text.disabled' }}>@</Typography>
                <EditableText value={exp.company} onChange={(v) => updateExperience(i, 'company', v)} editMode={editMode} sx={{ color: 'text.secondary' }} />
              </Stack>
              <EditableText value={exp.period} onChange={(v) => updateExperience(i, 'period', v)} editMode={editMode} variant="body2" sx={{ color: 'text.disabled', mb: 1 }} />
              <EditableText value={exp.description} onChange={(v) => updateExperience(i, 'description', v)} editMode={editMode} sx={{ color: 'text.secondary', lineHeight: 1.6 }} />
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Projects */}
      <Box component="section" sx={{ mb: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
            Projects
          </Typography>
          {editMode && (
            <IconButton size="small" onClick={addProject}>
              <AddIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 3 }}>
          {data.projects.map((project, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 3, position: 'relative' }}>
              {editMode && (
                <IconButton
                  size="small"
                  onClick={() => removeProject(i)}
                  sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
              <EditableText value={project.name} onChange={(v) => updateProject(i, 'name', v)} editMode={editMode} variant="h6" sx={{ fontWeight: 600, mb: 1 }} />
              <EditableText value={project.description} onChange={(v) => updateProject(i, 'description', v)} editMode={editMode} sx={{ color: 'text.secondary', fontSize: '0.95rem' }} />
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Skills */}
      <Box component="section" sx={{ mb: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
            Skills
          </Typography>
          {editMode && (
            <IconButton size="small" onClick={addSkill}>
              <AddIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {data.skills.map((skill, i) => (
            <Chip
              key={i}
              label={
                <EditableText value={skill} onChange={(v) => updateSkill(i, v)} editMode={editMode} variant="body2" />
              }
              onDelete={editMode ? () => removeSkill(i) : undefined}
              variant="outlined"
            />
          ))}
        </Stack>
      </Box>

      {/* Contact */}
      <Box component="section">
        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em', mb: 2, display: 'block' }}>
          Contact
        </Typography>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <Typography sx={{ color: 'text.disabled' }}>Email:</Typography>
            <EditableText value={data.email} onChange={(v) => updateField('email', v)} editMode={editMode} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Typography sx={{ color: 'text.disabled' }}>GitHub:</Typography>
            <EditableText value={data.github} onChange={(v) => updateField('github', v)} editMode={editMode} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Typography sx={{ color: 'text.disabled' }}>LinkedIn:</Typography>
            <EditableText value={data.linkedin} onChange={(v) => updateField('linkedin', v)} editMode={editMode} />
          </Stack>
        </Stack>
      </Box>
    </>
  )
}

// Public profile view (read-only)
function PublicProfile({ username }: { username: string }) {
  const { portfolio, logs, loading, notFound } = usePublicProfile(username)
  const [view, setView] = useState<'portfolio' | 'logs'>('portfolio')

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (notFound || !portfolio) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Profile not found</Typography>
        <Typography color="text.secondary">
          This profile doesn't exist or hasn't been published yet.
        </Typography>
      </Box>
    )
  }

  const noopUpdate = () => {}

  return (
    <>
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 4 }}>
        <Button
          variant={view === 'logs' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setView(view === 'portfolio' ? 'logs' : 'portfolio')}
        >
          {view === 'logs' ? 'Portfolio' : 'Logs'}
        </Button>
      </Stack>

      {view === 'portfolio' ? (
        <Portfolio
          editMode={false}
          data={portfolio}
          updateField={noopUpdate}
          updateExperience={noopUpdate}
          updateProject={noopUpdate}
          updateSkill={noopUpdate}
          addExperience={noopUpdate}
          addProject={noopUpdate}
          addSkill={noopUpdate}
          removeExperience={noopUpdate}
          removeProject={noopUpdate}
          removeSkill={noopUpdate}
        />
      ) : (
        <Logs editMode={false} logs={logs} onUpdate={noopUpdate} />
      )}
    </>
  )
}

function App() {
  const { username: profileUsername } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user, username, loading: authLoading, signInWithGoogle, logout } = useAuth()
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const isViewingOwnProfile = !profileUsername || profileUsername === username
  const isViewingPublicProfile = profileUsername && profileUsername !== username

  const { portfolio, logs, isPublished, loading: dataLoading, updatePortfolio, updateLogs, publish, unpublish } = useUserData(
    isViewingOwnProfile ? (user?.uid || null) : null
  )

  const [editMode, setEditMode] = useState(false)
  const [view, setView] = useState<'portfolio' | 'logs'>('portfolio')
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const theme = createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
  })

  const updateField = <K extends keyof PortfolioData>(field: K, value: PortfolioData[K]) => {
    updatePortfolio({ ...portfolio, [field]: value })
  }

  const updateExperience = (index: number, field: keyof PortfolioData['experience'][0], value: string) => {
    const newExp = [...portfolio.experience]
    newExp[index] = { ...newExp[index], [field]: value }
    updatePortfolio({ ...portfolio, experience: newExp })
  }

  const updateProject = (index: number, field: keyof PortfolioData['projects'][0], value: string) => {
    const newProjects = [...portfolio.projects]
    newProjects[index] = { ...newProjects[index], [field]: value }
    updatePortfolio({ ...portfolio, projects: newProjects })
  }

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...portfolio.skills]
    newSkills[index] = value
    updatePortfolio({ ...portfolio, skills: newSkills })
  }

  const addExperience = () => {
    updatePortfolio({ ...portfolio, experience: [...portfolio.experience, { company: "New Company", role: "Role", period: "Year - Year", description: "Description" }] })
  }

  const addProject = () => {
    updatePortfolio({ ...portfolio, projects: [...portfolio.projects, { name: "New Project", description: "Project description" }] })
  }

  const addSkill = () => {
    updatePortfolio({ ...portfolio, skills: [...portfolio.skills, "New Skill"] })
  }

  const removeExperience = (index: number) => {
    updatePortfolio({ ...portfolio, experience: portfolio.experience.filter((_, i) => i !== index) })
  }

  const removeProject = (index: number) => {
    updatePortfolio({ ...portfolio, projects: portfolio.projects.filter((_, i) => i !== index) })
  }

  const removeSkill = (index: number) => {
    updatePortfolio({ ...portfolio, skills: portfolio.skills.filter((_, i) => i !== index) })
  }

  const handlePublish = async () => {
    if (!user || !username) {
      setSnackbar({ open: true, message: 'Please sign in to publish', severity: 'error' })
      return
    }
    try {
      await publish()
      const url = `${window.location.origin}/${username}`
      await navigator.clipboard.writeText(url)
      setSnackbar({ open: true, message: `Published! Link copied: ${url}`, severity: 'success' })
      navigate(`/${username}`)
    } catch {
      setSnackbar({ open: true, message: 'Failed to publish', severity: 'error' })
    }
  }

  const handleUnpublish = async () => {
    try {
      await unpublish()
      setSnackbar({ open: true, message: 'Profile unpublished', severity: 'success' })
    } catch {
      setSnackbar({ open: true, message: 'Failed to unpublish', severity: 'error' })
    }
  }

  if (authLoading || dataLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 8 }}>
        {/* Top bar */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ mb: 4 }}
        >
          {/* Left side - User info */}
          <Box>
            {user ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar src={user.photoURL || undefined} sx={{ width: 32, height: 32 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {username}
                </Typography>
                <Button size="small" onClick={logout}>
                  Sign out
                </Button>
              </Stack>
            ) : (
              <Button
                variant="outlined"
                size="small"
                startIcon={<GoogleIcon />}
                onClick={signInWithGoogle}
              >
                Sign in
              </Button>
            )}
          </Box>

          {/* Right side - Actions */}
          {isViewingOwnProfile && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant={editMode ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Exit' : 'Edit'}
              </Button>
              <Button
                variant={view === 'logs' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setView(view === 'portfolio' ? 'logs' : 'portfolio')}
              >
                {view === 'logs' ? 'Portfolio' : 'Logs'}
              </Button>
              {user && username && (
                <Button
                  variant={isPublished ? 'contained' : 'outlined'}
                  size="small"
                  color={isPublished ? 'success' : 'primary'}
                  startIcon={<PublishIcon />}
                  onClick={isPublished ? handleUnpublish : handlePublish}
                >
                  {isPublished ? 'Published' : 'Publish'}
                </Button>
              )}
            </Stack>
          )}
        </Stack>

        {/* Content */}
        {isViewingPublicProfile ? (
          <PublicProfile username={profileUsername} />
        ) : view === 'portfolio' ? (
          <Portfolio
            editMode={editMode}
            data={portfolio}
            updateField={updateField}
            updateExperience={updateExperience}
            updateProject={updateProject}
            updateSkill={updateSkill}
            addExperience={addExperience}
            addProject={addProject}
            addSkill={addSkill}
            removeExperience={removeExperience}
            removeProject={removeProject}
            removeSkill={removeSkill}
          />
        ) : (
          <Logs editMode={editMode} logs={logs} onUpdate={updateLogs} />
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  )
}

export default App
