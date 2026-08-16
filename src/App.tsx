import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { Home } from '@mui/icons-material'
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import githubLogo from './assets/github.webp'
import ProfileFetcher from './ProfileFetcher/Realtime'
import './App.css'
import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import HeatMapCom from './ProfileFetcher/HeatMapNew';
import HeatmapSkeleton from './Skeleton.tsx/HeatMap';
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { useAuth } from './contexts/AuthContext'
import { useUserData, usePublicProfile } from './hooks/useUserData'
import type { PortfolioData, LogEntry, CustomSection } from './hooks/useUserData'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  
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

function Portfolio({ editMode, data, updateField, updateExperience, updateProject, updateSkill, addExperience, addProject, addSkill, removeExperience, removeProject, removeSkill, updateEducation, addEducation, removeEducation, updateCustomSection, addCustomSection, removeCustomSection, addCustomSectionItem, removeCustomSectionItem, updateCustomSectionItem, addCustomLink, removeCustomLink, updateCustomLink }: {
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
  updateEducation: (index: number, field: string, value: string) => void
  addEducation: () => void
  removeEducation: (index: number) => void
  updateCustomSection: (sectionId: string, title: string) => void
  addCustomSection: () => void
  removeCustomSection: (sectionId: string) => void
  addCustomSectionItem: (sectionId: string) => void
  removeCustomSectionItem: (sectionId: string, itemIndex: number) => void
  updateCustomSectionItem: (sectionId: string, itemIndex: number, field: 'name' | 'description', value: string) => void
  addCustomLink: () => void
  removeCustomLink: (index: number) => void
  updateCustomLink: (index: number, field: 'label' | 'url', value: string) => void

}) {
    const [contributions, setContributions] = useState(false)
    const { user} = useAuth()
    const [loading, setLoading] = useState(false)
    
    const [weeks, setWeeks] = useState<any[]>([])
    const [month, setMonth] = useState<any[]>([])

    const fetchFromGithub:any = async () => {
    setLoading(true)
    console.log(loading)
    const results = await fetch(`${BACKEND_URL}/github/contributions?uid=${encodeURIComponent(user?.uid ?? '')}`)
    const response = await results.json()
    console.log(response.data.viewer)
    setLoading(false)
    setWeeks(response.data.viewer.contributionsCollection.contributionCalendar.weeks.slice(-24))
    setContributions(true)
  }

const Month = () => {
  if (!weeks.length) return []
  const monthArr: { contributionDays: any[] }[] = [{ contributionDays: [] }]
  let monthIndex = 0
  let currentMonth = new Date(weeks[0].contributionDays[0].date).getMonth()

  for (let i = 0; i < weeks.length; i++) {
    for (let j = 0; j < weeks[i].contributionDays.length; j++) {   // start at 0
      const day = weeks[i].contributionDays[j]
      const m = new Date(day.date).getMonth()

      if (m !== currentMonth) {   // month changed → open a new bucket
        monthIndex++
        monthArr[monthIndex] = { contributionDays: [] }
        currentMonth = m
      }
      monthArr[monthIndex].contributionDays.push(day)  // every day gets pushed
    }
  }

  return monthArr
}

  useEffect(()=>{
    // console.log('Inside here')
    const value = Month()
    console.log(value)
    setMonth(value)
    
  }, [weeks])
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

      {/* Education - only shown if data has education */}
      {data.education && data.education.length > 0 && (
        <Box component="section" sx={{ mb: 6 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
              Education
            </Typography>
            {editMode && (
              <IconButton size="small" onClick={addEducation}>
                <AddIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
          <Stack spacing={4}>
            {data.education.map((edu, i) => (
              <Box key={i} sx={{ position: 'relative' }}>
                {editMode && (
                  <IconButton
                    size="small"
                    onClick={() => removeEducation(i)}
                    sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
                <Stack direction="row" spacing={0.5} alignItems="baseline" flexWrap="wrap">
                  <EditableText value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} editMode={editMode} sx={{ fontWeight: 600 }} />
                  <Typography sx={{ color: 'text.disabled' }}>@</Typography>
                  <EditableText value={edu.institution} onChange={(v) => updateEducation(i, 'institution', v)} editMode={editMode} sx={{ color: 'text.secondary' }} />
                </Stack>
                <EditableText value={edu.period} onChange={(v) => updateEducation(i, 'period', v)} editMode={editMode} variant="body2" sx={{ color: 'text.disabled', mb: 1 }} />
                <EditableText value={edu.description} onChange={(v) => updateEducation(i, 'description', v)} editMode={editMode} sx={{ color: 'text.secondary', lineHeight: 1.6 }} />
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Projects */}
      {(data.projects.length > 0 || editMode) && (
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
              <Paper key={i} variant="outlined" sx={{
                p: 3,
                position: 'relative',
                height: editMode ? 'auto' : 180,
                overflow: 'hidden',
                '&:hover': editMode ? {} : { overflowY: 'auto' },
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(128,128,128,0.4)', borderRadius: '3px' },
              }}>
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
      )}

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
      <Box component="section" sx={{ mb: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
            Get Your Commit History HeatMap 
            {
              contributions && <Typography variant="overline" sx={{ color: '#ffffff', letterSpacing: '0.1em' }}> (Last 24 Weeks)</Typography>
            }
          </Typography>
          
        </Stack>

        {!contributions && !loading &&
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button onClick={()=>{fetchFromGithub() }}>
              Fetch From Github
            </Button>
          </Stack>
        }
        {loading &&
          <HeatmapSkeleton></HeatmapSkeleton>
        }

        {contributions &&
          <Stack direction="row" spacing={0.1}>
                  {month.map((month, index) => (
                      <HeatMapCom key={index} month={month} />
                  ))}
          </Stack>
        }
          
      </Box>

      {/* Custom Sections */}
      {data.customSections?.map((section) => (
        <Box key={section.id} component="section" sx={{ mb: 6 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <EditableText
              value={section.title}
              onChange={(v) => updateCustomSection(section.id, v)}
              editMode={editMode}
              variant="body2"
              sx={{ color: 'text.secondary', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 500 }}
            />
            {editMode && (
              <>
                <IconButton size="small" onClick={() => addCustomSectionItem(section.id)}>
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => removeCustomSection(section.id)} sx={{ color: 'error.main' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 3 }}>
            {section.items.map((item, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 3, position: 'relative' }}>
                {editMode && (
                  <IconButton
                    size="small"
                    onClick={() => removeCustomSectionItem(section.id, i)}
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
                <EditableText value={item.name} onChange={(v) => updateCustomSectionItem(section.id, i, 'name', v)} editMode={editMode} variant="h6" sx={{ fontWeight: 600, mb: 1 }} />
                <EditableText value={item.description} onChange={(v) => updateCustomSectionItem(section.id, i, 'description', v)} editMode={editMode} sx={{ color: 'text.secondary', fontSize: '0.95rem' }} />
              </Paper>
            ))}
          </Box>
        </Box>
      ))}

      {/* Add Section button */}
      {editMode && (
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addCustomSection}>
            Add Section
          </Button>
        </Box>
      )}

      {/* Contact */}
      <Box component="section">
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
            Contact
          </Typography>
          {editMode && (
            <IconButton size="small" onClick={addCustomLink}>
              <AddIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
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
          {data.customLinks?.map((link, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <EditableText value={link.label + ':'} onChange={(v) => updateCustomLink(i, 'label', v.replace(/:$/, ''))} editMode={editMode} sx={{ color: 'text.disabled' }} />
              <EditableText value={link.url} onChange={(v) => updateCustomLink(i, 'url', v)} editMode={editMode} />
              {editMode && (
                <IconButton size="small" onClick={() => removeCustomLink(i)} sx={{ color: 'error.main' }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Stack>
          ))}
        </Stack>
      </Box>
    </>
  )
}

// Public profile view (read-only)
function PublicProfile({ username }: { username: string }) {
  const searchParams = new URLSearchParams(window.location.search)
  const templateId = searchParams.get('template') || undefined
  const { portfolio, logs, loading, notFound } = usePublicProfile(username, templateId)
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
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 4, mt:-8}}>
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
          updateEducation={noopUpdate}
          addEducation={noopUpdate}
          removeEducation={noopUpdate}
          updateCustomSection={noopUpdate}
          addCustomSection={noopUpdate}
          removeCustomSection={noopUpdate}
          addCustomSectionItem={noopUpdate}
          removeCustomSectionItem={noopUpdate}
          updateCustomSectionItem={noopUpdate}
          addCustomLink={noopUpdate}
          removeCustomLink={noopUpdate}
          updateCustomLink={noopUpdate}
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
  const searchParams = new URLSearchParams(window.location.search)
  const template = searchParams.get('template') || 'sde'
  const isViewingOwnProfile = !profileUsername || profileUsername === username
  const isViewingPublicProfile = profileUsername && profileUsername !== username
  const { portfolio, logs, isPublished, loading: dataLoading, updatePortfolio, updateLogs, publish, unpublish } = useUserData(
    isViewingOwnProfile ? (user?.uid || null) : null,
    template
  )
  const [open, setOpen] = useState(false)

  useEffect(()=>{
    console.log('Called Once')
    ProfileFetcher()
  },[])
  
  const location = useLocation()
  useEffect(()=>{
    if(location.state?.parsedResume){
      updatePortfolio(location.state.parsedResume)
      window.history.replaceState({}, '')
    }
  }, [])
  const [editMode, setEditMode] = useState(false)
  const [view, setView] = useState<'portfolio' | 'logs'>('portfolio')

  // Reset edit mode when user signs out
  useEffect(() => {
    if (!user) setEditMode(false)
  }, [user])

  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    if (location.state?.parsedResume) {
      setSnackbar({ open: true, message: 'Resume uploaded successfully!', severity: 'success' })
    }
    if (location.state?.alreadyFound) {
      setSnackbar({ open: true, message: 'Portfolio already found!', severity: 'success' })
    }
  }, [])

  const theme = createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
  })

  const [snacking, setSnacking] = useState(false)

  const resumeInputRef = useRef<HTMLInputElement>(null)
  const [uploadingResume, setUploadingResume] = useState(false)

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingResume(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${BACKEND_URL}/parse-resume`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      updatePortfolio(data)
      setSnackbar({ open: true, message: 'Resume parsed and applied!', severity: 'success' })
    } catch (err) {
      console.error(err)
      setSnackbar({ open: true, message: 'Failed to parse resume. Try again in a minute.', severity: 'error' })
    } finally {
      setUploadingResume(false)
      e.target.value = ''
    }
  }

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

  const updateEducation = (index: number, field: string, value: string) => {
    const newEdu = [...(portfolio.education || [])]
    newEdu[index] = { ...newEdu[index], [field]: value }
    updatePortfolio({ ...portfolio, education: newEdu })
  }

  const addEducation = () => {
    updatePortfolio({ ...portfolio, education: [...(portfolio.education || []), { institution: "University Name", degree: "Degree", period: "Year - Year", description: "Description" }] })
  }

  const removeEducation = (index: number) => {
    updatePortfolio({ ...portfolio, education: (portfolio.education || []).filter((_, i) => i !== index) })
  }

  const updateCustomSection = (sectionId: string, title: string) => {
    const sections = (portfolio.customSections || []).map(s => s.id === sectionId ? { ...s, title } : s)
    updatePortfolio({ ...portfolio, customSections: sections })
  }

  const addCustomSection = () => {
    const newSection: CustomSection = { id: Date.now().toString(), title: 'New Section', items: [{ name: 'Item Name', description: 'Item description' }] }
    updatePortfolio({ ...portfolio, customSections: [...(portfolio.customSections || []), newSection] })
  }

  const removeCustomSection = (sectionId: string) => {
    updatePortfolio({ ...portfolio, customSections: (portfolio.customSections || []).filter(s => s.id !== sectionId) })
  }

  const addCustomSectionItem = (sectionId: string) => {
    const sections = (portfolio.customSections || []).map(s => s.id === sectionId ? { ...s, items: [...s.items, { name: 'Item Name', description: 'Item description' }] } : s)
    updatePortfolio({ ...portfolio, customSections: sections })
  }

  const removeCustomSectionItem = (sectionId: string, itemIndex: number) => {
    const sections = (portfolio.customSections || []).map(s => s.id === sectionId ? { ...s, items: s.items.filter((_, i) => i !== itemIndex) } : s)
    updatePortfolio({ ...portfolio, customSections: sections })
  }

  const updateCustomSectionItem = (sectionId: string, itemIndex: number, field: 'name' | 'description', value: string) => {
    const sections = (portfolio.customSections || []).map(s => s.id === sectionId ? { ...s, items: s.items.map((item, i) => i === itemIndex ? { ...item, [field]: value } : item) } : s)
    updatePortfolio({ ...portfolio, customSections: sections })
  }

  const addCustomLink = () => {
    updatePortfolio({ ...portfolio, customLinks: [...(portfolio.customLinks || []), { label: 'Website', url: 'https://' }] })
  }

  const removeCustomLink = (index: number) => {
    updatePortfolio({ ...portfolio, customLinks: (portfolio.customLinks || []).filter((_, i) => i !== index) })
  }

  const updateCustomLink = (index: number, field: 'label' | 'url', value: string) => {
    const links = [...(portfolio.customLinks || [])]
    links[index] = { ...links[index], [field]: value }
    updatePortfolio({ ...portfolio, customLinks: links })
  }

  const handlePublish = async () => {
    if (!user || !username) {
      setSnackbar({ open: true, message: 'Please sign in to publish', severity: 'error' })
      return
    }
    try {
      await publish()
      const url = `${window.location.origin}/${username}?template=${template}`
      await navigator.clipboard.writeText(url)
      setSnackbar({ open: true, message: `Published! Link copied: ${url}`, severity: 'success' })
      navigate(`/${username}?template=${template}`)
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
  const [githubConnected, setGithubConnected] = useState(false)
  const githubConnection = async () => {
    if (!user?.uid) return
    const result = await fetch(`${BACKEND_URL}/github/status?uid=${encodeURIComponent(user?.uid ?? '')}`)
    const response = await result.json()
    setGithubConnected(response.connected === true)
  }
  useEffect(()=>{
    githubConnection()
  },[user?.uid])

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
  const handleClose = () => {
    setOpen(false);
  };
  const handleOpen = () => {
    setOpen(true);
  };
  const handleConnectGithub = () => {
    window.location.href = `${BACKEND_URL}/auth/github/login?uid=${encodeURIComponent(user?.uid ?? '')}`;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Container maxWidth="md" sx={{ py: 6 }}>
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
          <Stack direction='row'>
            <IconButton component={Link} to='/' size="small" sx={{ mr: 1 }}>
              <Home />
            </IconButton>
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
          </Stack>
          </Box>

         
          
          {/* Right side - Actions */}
          {isViewingOwnProfile && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {user ? (
                <>
                <Button
                  variant={editMode ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? 'Exit' : 'Edit'}
                </Button>
                <Button
                  variant={editMode ? 'contained' : 'outlined'}
                  size="small"
                  onClick={handleOpen}
                  >
                Sync
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={uploadingResume}
                >
                  {uploadingResume ? 'Parsing…' : 'Upload Resume'}
                </Button>
                <input
                  type="file"
                  accept=".pdf"
                  ref={resumeInputRef}
                  style={{ display: 'none' }}
                  onChange={handleResumeUpload}
                />
                </>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<GoogleIcon />}
                  onClick={signInWithGoogle}
                >
                  Sign in to Edit
                </Button>
              )}
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

        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          role="alertdialog"
        >
          <DialogTitle id="alert-dialog-title">
            {"Connect To Sync Platforms"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Connect your platforms to get realtime updates in your portfolio Website
              <Stack sx={{
                alignContent:'center'
              }}>
                <Button onClick={handleConnectGithub}
                sx={{
                  maxWidth:100,
                  ml:25
                }}
                disabled={githubConnected}>
                  <img
                    src={githubLogo}
                    alt="GitHub"
                    width="80"
                    height="80"
                  />
                  {githubConnected && (
                    <CheckCircleIcon
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        color: "success.main",
                        backgroundColor: "white",
                        borderRadius: "50%",
                        fontSize: 28,
                      }}
                    />
                  )}
                </Button>
              </Stack>
            </DialogContentText>
          </DialogContent>
      </Dialog>

      <Dialog open={uploadingResume} PaperProps={{ sx: { backgroundColor: '#1a1a1a', color: '#ffffff' } }}>
        <DialogContent>
          <Stack alignItems="center" gap={2} sx={{ p: 2 }}>
            <CircularProgress sx={{ color: '#ffffff' }} />
            <Typography sx={{ fontSize: { xs: 18, sm: 24, md: 30 }, fontFamily: 'ui-sans-serif', fontWeight: 500 }}>
              Analysing your <span style={{ fontStyle: 'italic', color: '#8f8f8f' }}>Resume</span>
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snacking}
        autoHideDuration={4000}
        onClose={() => setSnacking(false)}
        message="GitHub connected successfully!"
      />

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
            updateEducation={updateEducation}
            addEducation={addEducation}
            removeEducation={removeEducation}
            updateCustomSection={updateCustomSection}
            addCustomSection={addCustomSection}
            removeCustomSection={removeCustomSection}
            addCustomSectionItem={addCustomSectionItem}
            removeCustomSectionItem={removeCustomSectionItem}
            updateCustomSectionItem={updateCustomSectionItem}
            addCustomLink={addCustomLink}
            removeCustomLink={removeCustomLink}
            updateCustomLink={updateCustomLink}
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
