// Run this with: npx tsx scripts/migratePortfolios.ts

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore'

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

// Map each portfolio ID to target collection (sde or bda)
// Based on the titles from listPortfolios output:
// - Software Developer/Engineer -> sde
// - Project Manager, PMO, Civil Engineer, Mechanical Engineer, Video Editor -> bda (business/non-dev roles)
const migrationMap: Record<string, 'sde' | 'bda'> = {
  '8JCw3mWd66ZOXtY6Yfwe1bLN7l13': 'sde',  // "Nice website" - Software Developer
  'FI9HGSLPyefHOmEXgVBWBnsHgNY2': 'sde',  // "Sanshray Singh" - Software Engineer
  'LrRTDFDPVpahXr1PBk3yFEJ33mU2': 'bda',  // "Rajbir Singh" - Assistant Manager - PMO
  'XVZ9EP8lGoSvGH0kStD4CXaJbcB3': 'bda',  // "Priyanshu Priydarshi" - Video Editor
  'ct69JAPbPZTQGU2aN44g1tDSXiI3': 'bda',  // "Prabh Karan Singh Jolly" - Project Manager
  'fQHMjzteifYc7yinpKIx7uN9bOJ3': 'bda',  // "HARDIK HANS" - Civil Engineer
  'zstYhGBeLNYg2GcoiH0Il2EKnAF3': 'bda',  // "Altamash" - Mechanical Engineer
}

async function migratePortfolios() {
  console.log('\n🚀 Starting migration from portfolios to sde/bda collections...\n')

  const snapshot = await getDocs(collection(db, 'portfolios'))

  if (snapshot.empty) {
    console.log('No portfolios found to migrate.')
    return
  }

  console.log(`Found ${snapshot.size} portfolios to migrate\n`)
  console.log('─'.repeat(60))

  let sdeCount = 0
  let bdaCount = 0
  let skippedCount = 0

  for (const docSnapshot of snapshot.docs) {
    const userId = docSnapshot.id
    const data = docSnapshot.data()
    const targetCollection = migrationMap[userId]

    if (!targetCollection) {
      console.log(`⚠️  Skipping ${userId} - not in migration map`)
      skippedCount++
      continue
    }

    const name = data.portfolio?.name || 'Unknown'
    const title = data.portfolio?.title || 'Unknown'
    const logsCount = data.logs?.length || 0

    console.log(`📦 Migrating: ${name} (${title})`)
    console.log(`   From: portfolios/${userId}`)
    console.log(`   To: ${targetCollection}/${userId}`)
    console.log(`   Data: portfolio + ${logsCount} logs + isPublished: ${data.isPublished}`)

    // Copy full document to new collection
    await setDoc(doc(db, targetCollection, userId), {
      portfolio: data.portfolio,
      logs: data.logs || [],
      isPublished: data.isPublished || false,
      updatedAt: data.updatedAt || new Date().toISOString(),
      migratedAt: new Date().toISOString()
    })

    console.log(`   ✅ Done!`)
    console.log('─'.repeat(60))

    if (targetCollection === 'sde') sdeCount++
    else bdaCount++
  }

  console.log('\n📊 Migration Summary:')
  console.log(`   SDE collection: ${sdeCount} portfolios`)
  console.log(`   BDA collection: ${bdaCount} portfolios`)
  console.log(`   Skipped: ${skippedCount}`)
  console.log('\n✅ Migration complete!\n')

  process.exit(0)
}

migratePortfolios().catch(console.error)
