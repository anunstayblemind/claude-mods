import { ADMIN_NAME } from './persona'

// magenta is the admin's; viewers never get it
export const COLORS = ['cyan', 'green', 'yellow', 'red', 'blue'] as const

export type ParsedLine = { name: string; text: string; color: string; isAdmin: boolean }

const pick = (name: string): string => {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length] ?? COLORS[0]
}

// "name: message" lines from the model; anything else is dropped.
export function parseChat(reply: string): ParsedLine[] {
  const out: ParsedLine[] = []
  for (const raw of reply.split('\n')) {
    const m = /^\s*[-*]?\s*([A-Za-z0-9_]{3,20})\s*:\s*(.+?)\s*$/.exec(raw)
    const name = m?.[1]
    const text = m?.[2]
    if (name && text) {
      const isAdmin = name.toUpperCase() === ADMIN_NAME.toUpperCase()
      out.push({ name: isAdmin ? ADMIN_NAME : name, text: text.slice(0, 100), color: isAdmin ? 'magenta' : pick(name), isAdmin })
    }
  }
  return out.slice(0, 7)
}

const base = (p: string) => p.split(/[\\/]/).pop() ?? p

// One short line describing a tool call. Paths are cut to the file name, commands to 70 characters.
export function summarize(tool: string, input: any): string {
  const i = input ?? {}
  if (tool === 'Bash') return `ran: ${String(i.command ?? '').replace(/\s+/g, ' ').slice(0, 70)}`
  if (tool === 'Read') return `read ${base(String(i.file_path ?? ''))}`
  if (tool === 'Write') return `wrote ${base(String(i.file_path ?? ''))}`
  if (tool === 'Edit') return `edited ${base(String(i.file_path ?? ''))}`
  if (tool === 'Grep' || tool === 'Glob') return `searched for ${String(i.pattern ?? '').slice(0, 40)}`
  return `used ${tool}`
}
