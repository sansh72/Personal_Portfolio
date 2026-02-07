// Run this with: npx tsx scripts/listPortfolios.ts

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAAUc0BOOjkPAPYINh7yUXg9-SRWqs0YEw",
  authDomain: "personalportfolio-50693.firebaseapp.com",
  projectId: "personalportfolio-50693",
  storageBucket: "personalportfolio-50693.firebasestorage.app",
  messagingSenderId: "935704602901",
  appId: "1:935704602901:web:8d04986406dfa4da2d611c",
  measurementId: "G-4R9158B03E"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function listPortfolios() {
  console.log('\n📋 Fetching portfolios from Firebase...\n')

  const snapshot = await getDocs(collection(db, 'portfolios'))

  if (snapshot.empty) {
    console.log('No portfolios found.')
    return
  }

  console.log('Found', snapshot.size, 'portfolios:\n')
  console.log('─'.repeat(60))

  snapshot.forEach((doc) => {
    const data = doc.data()
    const title = data.portfolio?.title || 'No title'
    const name = data.portfolio?.name || 'No name'
    const isPublished = data.isPublished ? '✓ Published' : '✗ Draft'
    const logsCount = data.logs?.length || 0

    console.log(`${doc.id}`)
    console.log(`  Name: ${name}`)
    console.log(`  Title: ${title}`)
    console.log(`  Status: ${isPublished}`)
    console.log(`  Logs: ${logsCount} entries`)
    if (logsCount > 0) {
      data.logs.slice(0, 3).forEach((log: any) => {
        console.log(`    - ${log.date}: ${log.content.substring(0, 50)}...`)
      })
      if (logsCount > 3) console.log(`    ... and ${logsCount - 3} more`)
    }
    console.log('─'.repeat(60))
  })

  console.log('\n✅ Done!\n')
  process.exit(0)
}

listPortfolios().catch(console.error)
