import type { PortfolioData } from '../hooks/useUserData'

/**
 * A "section" is a dotted path into the portfolio object. The backend keeps the
 * same allowlist; these helpers exist so the frontend can bump the right
 * `sectionVersions` entry when the user edits a section by hand.
 *
 *   bio
 *   experience.0.description
 *   education.1.description
 *   projects.2.description
 *   customSections.<id>.items.0.description
 */
export type SectionPath = string

export const sectionPath = {
  bio: (): SectionPath => 'bio',
  experience: (i: number): SectionPath => `experience.${i}.description`,
  education: (i: number): SectionPath => `education.${i}.description`,
  project: (i: number): SectionPath => `projects.${i}.description`,
  customItem: (sectionId: string, i: number): SectionPath =>
    `customSections.${sectionId}.items.${i}.description`,
}

/** Sections shorter than this aren't worth an LLM call; the backend agrees. */
export const MIN_SECTION_CHARS = 30

/** Every allowlisted path that currently resolves in this portfolio. */
export function listSectionPaths(p: PortfolioData | null | undefined): SectionPath[] {
  if (!p) return []
  const paths: SectionPath[] = ['bio']
  p.experience?.forEach((_, i) => paths.push(sectionPath.experience(i)))
  p.education?.forEach((_, i) => paths.push(sectionPath.education(i)))
  p.projects?.forEach((_, i) => paths.push(sectionPath.project(i)))
  p.customSections?.forEach((s) =>
    s.items?.forEach((_, i) => paths.push(sectionPath.customItem(s.id, i)))
  )
  return paths
}

export function readSectionPath(
  p: PortfolioData | null | undefined,
  path: SectionPath
): string | null {
  if (!p) return null
  let node: unknown = p
  for (const part of path.split('.')) {
    if (Array.isArray(node)) {
      if (/^\d+$/.test(part)) {
        node = node[Number(part)]
      } else {
        node = (node as { id?: string }[]).find((item) => item?.id === part)
      }
    } else if (node && typeof node === 'object') {
      node = (node as Record<string, unknown>)[part]
    } else {
      return null
    }
    if (node === undefined || node === null) return null
  }
  return typeof node === 'string' ? node : null
}

const ARRAY_FIELDS = ['experience', 'education', 'projects'] as const

/**
 * Versions after an edit.
 *
 * Without this, a suggestion generated before the user hand-edited a section
 * would still match on version and silently overwrite their newer text. Any
 * path whose text changed gets bumped.
 *
 * Array reshuffles are the awkward case: deleting experience[0] shifts every
 * later entry down an index, so paths no longer refer to the same text. Rather
 * than track identity we bump every version under that array, which makes any
 * in-flight suggestion for it fail closed with a 409.
 */
export function bumpSectionVersions(
  previous: PortfolioData | null | undefined,
  next: PortfolioData,
  versions: Record<string, number>
): Record<string, number> {
  if (!previous) return versions

  const toBump = new Set<SectionPath>()

  for (const field of ARRAY_FIELDS) {
    const before = previous[field]?.length ?? 0
    const after = next[field]?.length ?? 0
    if (before !== after) {
      Object.keys(versions).forEach((path) => {
        if (path.startsWith(`${field}.`)) toBump.add(path)
      })
      ;(next[field] ?? []).forEach((_, i) => toBump.add(`${field}.${i}.description`))
    }
  }

  const beforeCustom = new Map(
    (previous.customSections ?? []).map((s) => [s.id, s.items?.length ?? 0])
  )
  for (const section of next.customSections ?? []) {
    if (beforeCustom.get(section.id) !== (section.items?.length ?? 0)) {
      Object.keys(versions).forEach((path) => {
        if (path.startsWith(`customSections.${section.id}.`)) toBump.add(path)
      })
      ;(section.items ?? []).forEach((_, i) =>
        toBump.add(sectionPath.customItem(section.id, i))
      )
    }
  }

  for (const path of listSectionPaths(next)) {
    const before = readSectionPath(previous, path)
    const after = readSectionPath(next, path)
    if (before !== null && after !== null && before !== after) toBump.add(path)
  }

  if (toBump.size === 0) return versions

  const updated = { ...versions }
  toBump.forEach((path) => {
    updated[path] = (updated[path] ?? 0) + 1
  })
  return updated
}

/** Immutably set a section's text. Returns the original if the path is gone. */
export function writeSectionPath(
  portfolio: PortfolioData,
  path: SectionPath,
  value: string
): PortfolioData {
  const clone: PortfolioData = JSON.parse(JSON.stringify(portfolio))
  const parts = path.split('.')
  let node: unknown = clone

  for (const part of parts.slice(0, -1)) {
    if (Array.isArray(node)) {
      node = /^\d+$/.test(part)
        ? node[Number(part)]
        : (node as { id?: string }[]).find((item) => item?.id === part)
    } else if (node && typeof node === 'object') {
      node = (node as Record<string, unknown>)[part]
    } else {
      return portfolio
    }
    if (node === undefined || node === null) return portfolio
  }

  const leaf = parts[parts.length - 1]
  if (!node || typeof node !== 'object' || Array.isArray(node)) return portfolio
  ;(node as Record<string, unknown>)[leaf] = value
  return clone
}
