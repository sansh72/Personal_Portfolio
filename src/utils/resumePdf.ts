import type { PortfolioData } from '../hooks/useUserData'

/**
 * Draw the resume as a PDF in the browser.
 *
 * Not a LaTeX compile: that needs a ~30MB WASM TeX engine, which is not worth
 * it for a one-page CV. This lays out the same content and section order as
 * the .tex export, so the two read as the same document. Overleaf remains the
 * route to a real LaTeX build for anyone who wants to tweak the source.
 */

const PAGE = { width: 210, height: 297 }          // A4 in mm
const MARGIN = 18                                  // left/right
// Tighter top and bottom: a CV wants the vertical space for content, and
// 10mm still clears the non-printable edge on a typical printer.
const MARGIN_Y = 10
const CONTENT = PAGE.width - MARGIN * 2

export async function downloadResumePdf(p: PortfolioData) {
  // Imported on demand so ~350KB of PDF library stays out of the main bundle.
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  let y = MARGIN_Y

  /** Start a new page when the next block would run off the bottom. */
  const room = (needed: number) => {
    if (y + needed > PAGE.height - MARGIN_Y) {
      doc.addPage()
      y = MARGIN_Y
    }
  }

  const text = (
    value: string,
    { size = 10, style = 'normal', gap = 4.6, color = 40, x = MARGIN, width = CONTENT } = {}
  ) => {
    if (!value?.trim()) return
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(color)
    for (const line of doc.splitTextToSize(value.trim(), width)) {
      room(gap)
      doc.text(line, x, y)
      y += gap
    }
  }

  const heading = (label: string) => {
    room(12)
    y += 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0)
    doc.text(label.toUpperCase(), MARGIN, y)
    y += 1.6
    doc.setDrawColor(190)
    doc.setLineWidth(0.2)
    doc.line(MARGIN, y, PAGE.width - MARGIN, y)
    y += 4.5
  }

  /** Title on the left, dates right-aligned on the same line. */
  const entry = (left: string, right: string, sub: string) => {
    room(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(0)
    doc.text(left || '', MARGIN, y)
    if (right) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9.5)
      doc.setTextColor(110)
      doc.text(right, PAGE.width - MARGIN, y, { align: 'right' })
    }
    y += 4.6
    text(sub, { size: 9.5, style: 'italic', gap: 4.3, color: 95 })
  }

  // --- header ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(0)
  doc.text(p.name?.trim() || 'Your Name', PAGE.width / 2, y, { align: 'center' })
  y += 7
  if (p.title?.trim()) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(90)
    doc.text(p.title.trim(), PAGE.width / 2, y, { align: 'center' })
    y += 6
  }

  const contacts = [p.email, p.github, p.linkedin, ...(p.customLinks ?? []).map((l) => l.url)]
    .map((c) => (c ?? '').trim())
    .filter(Boolean)
    .join('  ·  ')
  if (contacts) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(110)
    for (const line of doc.splitTextToSize(contacts, CONTENT)) {
      doc.text(line, PAGE.width / 2, y, { align: 'center' })
      y += 4.2
    }
  }
  y += 2

  // --- body, same order as the LaTeX export ---
  if (p.bio?.trim()) {
    heading('Summary')
    text(p.bio, { color: 60 })
  }

  if (p.experience?.length) {
    heading('Experience')
    p.experience.forEach((e, i) => {
      entry(`${e.role || ''}${e.company ? ` — ${e.company}` : ''}`, e.period || '', '')
      text(e.description, { size: 9.5, gap: 4.3, color: 60 })
      if (i < p.experience.length - 1) y += 2
    })
  }

  if (p.education?.length) {
    heading('Education')
    p.education.forEach((e) => {
      entry(`${e.degree || ''}${e.institution ? ` — ${e.institution}` : ''}`, e.period || '', '')
      text(e.description, { size: 9.5, gap: 4.3, color: 60 })
    })
  }

  if (p.projects?.length) {
    heading('Projects')
    for (const project of p.projects) {
      room(9)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(0)
      doc.text(project.name || '', MARGIN, y)
      y += 4.4
      text(project.description, { size: 9.5, gap: 4.3, color: 60 })
      if (project.link?.trim()) {
        text(project.link.trim(), { size: 8.5, gap: 4, color: 120 })
      }
      y += 1.5
    }
  }

  if (p.skills?.length) {
    heading('Skills')
    text(p.skills.join('  ·  '), { size: 9.5, gap: 4.4, color: 60 })
  }

  for (const custom of p.customSections ?? []) {
    if (!custom.items?.length) continue
    heading(custom.title || 'More')
    for (const item of custom.items) {
      room(8)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(0)
      doc.text(item.name || '', MARGIN, y)
      y += 4.4
      text(item.description, { size: 9.5, gap: 4.3, color: 60 })
      y += 1
    }
  }

  const slug = (p.name || 'resume').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'resume'
  doc.save(`${slug}.pdf`)
}
