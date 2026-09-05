import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { bumpSectionVersions, writeSectionPath } from '../utils/sectionPaths'
import { sdeTemplate } from '../templates/softwareDev'
import { bdaTemplate } from '../templates/bda'
import { customTemplate } from '../templates/custom'

export interface CustomSection {
  id: string
  title: string
  items: { name: string; description: string }[]
}

export interface PortfolioData {
  name: string
  title: string
  /** Uploaded profile picture. Falls back to the Google account photo. */
  avatarUrl?: string
  bio: string
  experience: { company: string; role: string; period: string; description: string }[]
  education?: { institution: string; degree: string; period: string; description: string }[]
  projects: { name: string; description: string; link?: string }[]
  skills: string[]
  email: string
  github: string
  linkedin: string
  customLinks?: { label: string; url: string }[]
  customSections?: CustomSection[]
}

export interface LogEntry {
  id: string
  date: string
  content: string
}

export interface ContributionDay {
  contributionCount: number
  date: string
  weekday: number
  color: string
}

/**
 * A snapshot of the GitHub heatmap, saved when the owner fetches it.
 *
 * Fetching live needs the owner's GitHub token, which a visitor obviously
 * doesn't have - so without persisting this, a published portfolio showed
 * visitors an empty "Connect GitHub" panel instead of the owner's history.
 */
export interface GithubContributions {
  months: { contributionDays: ContributionDay[] }[]
  totalContributions: number
  username?: string
  fetchedAt: string
}

export interface UserData {
  portfolio: PortfolioData
  logs: LogEntry[]
  isPublished: boolean
  githubContributions?: GithubContributions
  /**
   * Per-section content version, keyed by section path (`bio`,
   * `experience.0.description`, ...). A missing entry means version 0.
   * Suggest a Fix uses this to refuse suggestions generated against text the
   * user has since edited.
   */
  sectionVersions?: Record<string, number>
}

const defaultPortfolio: PortfolioData = {
  name: "Your Name",
  title: "Software Developer",
  bio: "I'm a passionate developer who loves building beautiful and functional applications. Double-click any text to edit it when edit mode is on.",
  experience: [
    { company: "Company Name", role: "Senior Developer", period: "2022 - Present", description: "Led development of key features and mentored junior developers." },
    { company: "Previous Company", role: "Developer", period: "2020 - 2022", description: "Built and maintained web applications using modern technologies." }
  ],
  projects: [
    { name: "Project One", description: "A cool project that solves interesting problems." },
    { name: "Project Two", description: "Another awesome project showcasing my skills." }
  ],
  skills: ["React", "TypeScript", "Node.js", "Python", "CSS"],
  email: "your.email@example.com",
  github: "github.com/yourusername",
  linkedin: "linkedin.com/in/yourusername"
}

const defaultLogs: LogEntry[] = [
  { id: '1', date: new Date().toISOString().split('T')[0], content: "Started my portfolio. Feeling productive today." }
]

/**
 * Fill in anything a stored or parsed portfolio is missing.
 *
 * PortfolioData declares these arrays as required, but the data arrives from
 * Gemini parsing a PDF and from documents written by older versions of the
 * app - neither honours the type. One missing key used to crash the whole
 * page on `data.experience.map(...)`.
 */
export function normalizePortfolio(input: Partial<PortfolioData> | null | undefined): PortfolioData {
  const p = input ?? {}
  const normalized: PortfolioData = {
    ...p,
    name: p.name ?? '',
    title: p.title ?? '',
    bio: p.bio ?? '',
    email: p.email ?? '',
    github: p.github ?? '',
    linkedin: p.linkedin ?? '',
    experience: Array.isArray(p.experience) ? p.experience : [],
    projects: Array.isArray(p.projects) ? p.projects : [],
    skills: Array.isArray(p.skills) ? p.skills : [],
  }

  // Optional fields are deleted rather than set to undefined: Firestore
  // rejects an undefined value outright, and setting these unconditionally
  // broke every save, publish included.
  for (const key of ['education', 'customSections', 'customLinks'] as const) {
    if (Array.isArray(p[key])) {
      normalized[key] = p[key] as never
    } else {
      delete normalized[key]
    }
  }

  return normalized
}

// Hook for current user's data (editable)
export function useUserData(userId: string | null, templateId?: string) {
  // Determine which collection to use based on template
  const collectionName = templateId === 'bda' ? 'bda' : templateId === 'custom' ? 'custom' : 'sde'

  const getDefaultPortfolio = () => {
    if (templateId === 'bda') return bdaTemplate as PortfolioData
    if (templateId === 'custom') return customTemplate as PortfolioData
    if (templateId === 'sde') return sdeTemplate as PortfolioData
    return defaultPortfolio
  }

  const [portfolio, setPortfolio] = useState<PortfolioData>(getDefaultPortfolio)
  const [logs, setLogs] = useState<LogEntry[]>(defaultLogs)
  const [isPublished, setIsPublished] = useState(false)
  const [sectionVersions, setSectionVersions] = useState<Record<string, number>>({})
  const [githubContributions, setGithubContributions] = useState<GithubContributions | null>(null)

  /**
   * Which (user, template) pair the data in state actually belongs to.
   *
   * Derived rather than a plain `loading` flag: on a fresh load `userId` is
   * null until Firebase auth resolves, so the first pass finishes and clears
   * the flag while holding template defaults. A second pass then starts for
   * the real uid with nothing marking it as loading, which is what let the
   * empty template render for a moment before real data arrived.
   */
  const dataKey = `${userId ?? 'anon'}:${collectionName}`
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const loading = loadedKey !== dataKey

  useEffect(() => {
    if (!userId) {
      // Load from localStorage for non-authenticated users (with template key)
      const storageKey = `portfolioData_${collectionName}`
      const logsKey = `logsData_${collectionName}`
      const savedPortfolio = localStorage.getItem(storageKey)
      const savedLogs = localStorage.getItem(logsKey)
      if (savedPortfolio) {
        setPortfolio(normalizePortfolio(JSON.parse(savedPortfolio)))
      } else {
        setPortfolio(getDefaultPortfolio())
      }
      if (savedLogs) setLogs(JSON.parse(savedLogs))
      setLoadedKey(dataKey)
      return
    }

    // Load from Firestore using template-specific collection
    const loadData = async () => {
      try {
      const userDataDoc = await getDoc(doc(db, collectionName, userId))
      if (userDataDoc.exists()) {
        const data = userDataDoc.data() as UserData
        setPortfolio(normalizePortfolio(data.portfolio))
        setLogs(data.logs || defaultLogs)
        setIsPublished(data.isPublished || false)
        setSectionVersions(data.sectionVersions || {})
        setGithubContributions(data.githubContributions || null)
      } else {
        // No saved data, use template defaults
        setPortfolio(getDefaultPortfolio())
      }
      } catch (e) {
        // Permission denied or offline. Fall through to the defaults rather
        // than leaving the page stuck on a skeleton with nothing to explain it.
        console.error('Could not load portfolio', e)
      } finally {
        setLoadedKey(dataKey)
      }
    }
    loadData()
  }, [userId, collectionName, dataKey])

  const saveData = async (
    newPortfolio: PortfolioData,
    newLogs: LogEntry[],
    published?: boolean,
    versions?: Record<string, number>
  ) => {
    if (!userId) {
      // Save to localStorage with template key
      const storageKey = `portfolioData_${collectionName}`
      const logsKey = `logsData_${collectionName}`
      localStorage.setItem(storageKey, JSON.stringify(newPortfolio))
      localStorage.setItem(logsKey, JSON.stringify(newLogs))
      return
    }

    // Save to Firestore using template-specific collection.
    // merge: true so a concurrent Suggest Fix write (which the backend makes
    // directly) isn't clobbered by a stale full-document overwrite.
    await setDoc(doc(db, collectionName, userId), {
      portfolio: newPortfolio,
      logs: newLogs,
      isPublished: published ?? isPublished,
      sectionVersions: versions ?? sectionVersions,
      updatedAt: new Date().toISOString()
    }, { merge: true })
  }

  const updatePortfolio = async (incoming: PortfolioData) => {
    // Also covers the parsed resume handed over through navigation state.
    const newPortfolio = normalizePortfolio(incoming)
    // Bump the version of every section whose text actually changed, so a
    // suggestion generated before this edit can no longer overwrite it.
    const versions = bumpSectionVersions(portfolio, newPortfolio, sectionVersions)
    setPortfolio(newPortfolio)
    setSectionVersions(versions)
    await saveData(newPortfolio, logs, undefined, versions)
  }

  /**
   * Persist the heatmap so visitors to the published portfolio can see it.
   *
   * Written on its own with merge rather than through saveData, so refreshing
   * the heatmap never rewrites the portfolio text.
   */
  const saveGithubContributions = async (data: GithubContributions) => {
    setGithubContributions(data)
    if (!userId) return
    await setDoc(doc(db, collectionName, userId), { githubContributions: data }, { merge: true })
  }

  /**
   * Adopt a rewrite the backend has already committed.
   *
   * Deliberately does not write to Firestore: the Apply Fix transaction
   * persisted both the content and the new version. Pulling them into local
   * state is what stops the next autosave from reverting the change.
   */
  const applyAiFix = (sectionId: string, content: string, version: number) => {
    setPortfolio(current => writeSectionPath(current, sectionId, content))
    setSectionVersions(current => ({ ...current, [sectionId]: version }))
  }

  const updateLogs = async (newLogs: LogEntry[]) => {
    setLogs(newLogs)
    await saveData(portfolio, newLogs)
  }

  const publish = async () => {
    setIsPublished(true)
    await saveData(portfolio, logs, true)
  }

  const unpublish = async () => {
    setIsPublished(false)
    await saveData(portfolio, logs, false)
  }

  return { portfolio, logs, isPublished, loading, updatePortfolio, updateLogs, publish, unpublish, sectionVersions, applyAiFix, githubContributions, saveGithubContributions }
}

// Hook for viewing another user's public data (read-only)
export function usePublicProfile(username: string | null, templateId?:string) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [githubContributions, setGithubContributions] = useState<GithubContributions | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!username) {
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      // Find user by username
      const usersQuery = query(collection(db, 'users'), where('username', '==', username))
      const usersSnapshot = await getDocs(usersQuery)

      if (usersSnapshot.empty) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const userId = usersSnapshot.docs[0].id

      const collectionName = templateId === 'bda' ? 'bda' : templateId === 'custom' ? 'custom' : 'sde'
      const portfolioDoc = await getDoc(doc(db, collectionName, userId))
      if (portfolioDoc.exists()) {
        const data = portfolioDoc.data() as UserData
        if (data.isPublished) {
          setPortfolio(normalizePortfolio(data.portfolio))
          setGithubContributions(data.githubContributions || null)
          setLogs(data.logs || [])
          setLoading(false)
          return
        }
      }

      // No published portfolio found
      setNotFound(true)
      setLoading(false)
    }

    loadProfile()
  }, [username, templateId])

  return { portfolio, logs, loading, notFound, githubContributions }
}
