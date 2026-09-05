import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

interface AuthContextType {
  user: User | null
  username: string | null
  loading: boolean
  /** Resolves with the signed-in user so callers can continue immediately. */
  signInWithGoogle: () => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        // Check if user has a username
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setUsername(userDoc.data().username)
        } else {
          // Create username from email (before @)
          const generatedUsername = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || user.uid.slice(0, 8)
          await setDoc(doc(db, 'users', user.uid), {
            username: generatedUsername,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date().toISOString()
          })
          setUsername(generatedUsername)
        }
      } else {
        setUsername(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider)
    // Returned rather than read from context: `user` state has not updated yet
    // in the caller's closure at this point.
    return credential.user
  }

  const logout = async () => {
    await signOut(auth)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ user, username, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
