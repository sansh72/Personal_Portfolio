import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { sdeTemplate } from '../templates/softwareDev'
import { bdaTemplate } from '../templates/BDA'

export interface PortfolioData {
  name: string
  title: string
  bio: string
  experience: { company: string; role: string; period: string; description: string }[]
  projects: { name: string; description: string }[]
  skills: string[]
  email: string
  github: string
  linkedin: string
}

export interface LogEntry {
  id: string
  date: string
  content: string
}

export interface UserData {
  portfolio: PortfolioData
  logs: LogEntry[]
  isPublished: boolean
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

// Hook for current user's data (editable)
export function useUserData(userId: string | null, templateId?: string) {
  // Determine which collection to use based on template
  const collectionName = templateId === 'bda' ? 'bda' : 'sde'

  const getDefaultPortfolio = () => {
    if (templateId === 'bda') return bdaTemplate as PortfolioData
    if (templateId === 'sde') return sdeTemplate as PortfolioData
    return defaultPortfolio
  }

  const [portfolio, setPortfolio] = useState<PortfolioData>(getDefaultPortfolio)
  const [logs, setLogs] = useState<LogEntry[]>(defaultLogs)
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      // Load from localStorage for non-authenticated users (with template key)
      const storageKey = `portfolioData_${collectionName}`
      const logsKey = `logsData_${collectionName}`
      const savedPortfolio = localStorage.getItem(storageKey)
      const savedLogs = localStorage.getItem(logsKey)
      if (savedPortfolio) {
        setPortfolio(JSON.parse(savedPortfolio))
      } else {
        setPortfolio(getDefaultPortfolio())
      }
      if (savedLogs) setLogs(JSON.parse(savedLogs))
      setLoading(false)
      return
    }

    // Load from Firestore using template-specific collection
    const loadData = async () => {
      const userDataDoc = await getDoc(doc(db, collectionName, userId))
      if (userDataDoc.exists()) {
        const data = userDataDoc.data() as UserData
        setPortfolio(data.portfolio)
        setLogs(data.logs || defaultLogs)
        setIsPublished(data.isPublished || false)
      } else {
        // No saved data, use template defaults
        setPortfolio(getDefaultPortfolio())
      }
      setLoading(false)
    }
    loadData()
  }, [userId, collectionName])

  const saveData = async (newPortfolio: PortfolioData, newLogs: LogEntry[], published?: boolean) => {
    if (!userId) {
      // Save to localStorage with template key
      const storageKey = `portfolioData_${collectionName}`
      const logsKey = `logsData_${collectionName}`
      localStorage.setItem(storageKey, JSON.stringify(newPortfolio))
      localStorage.setItem(logsKey, JSON.stringify(newLogs))
      return
    }

    // Save to Firestore using template-specific collection
    await setDoc(doc(db, collectionName, userId), {
      portfolio: newPortfolio,
      logs: newLogs,
      isPublished: published ?? isPublished,
      updatedAt: new Date().toISOString()
    })
  }

  const updatePortfolio = async (newPortfolio: PortfolioData) => {
    setPortfolio(newPortfolio)
    await saveData(newPortfolio, logs)
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

  return { portfolio, logs, isPublished, loading, updatePortfolio, updateLogs, publish, unpublish }
}

// Hook for viewing another user's public data (read-only)
export function usePublicProfile(username: string | null) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
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

      // Check both sde and bda collections for published portfolio
      const collections = ['sde', 'bda']

      for (const collName of collections) {
        const portfolioDoc = await getDoc(doc(db, collName, userId))
        if (portfolioDoc.exists()) {
          const data = portfolioDoc.data() as UserData
          if (data.isPublished) {
            setPortfolio(data.portfolio)
            setLogs(data.logs || [])
            setLoading(false)
            return
          }
        }
      }

      // No published portfolio found
      setNotFound(true)
      setLoading(false)
    }

    loadProfile()
  }, [username])

  return { portfolio, logs, loading, notFound }
}
