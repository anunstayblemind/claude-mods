import { test, expect } from 'claude-code/testing'

import { parseChat, summarize } from './chat'
import { ADMIN_NAME } from './persona'

test('parses name: message lines and drops the rest', () => {
  const got = parseChat('Sure, here you go:\nkekw_fan: bro really ran rm\n- pog_champ99: Pog\n\nnot a line')
  expect(got.map(l => l.name)).toEqual(['kekw_fan', 'pog_champ99'])
  expect(got[0]?.text).toBe('bro really ran rm')
})

test('a name keeps its colour', () => {
  expect(parseChat('abc123: hi')[0]?.color).toBe(parseChat('abc123: bye')[0]?.color)
})

test('summaries cut paths to the file name', () => {
  expect(summarize('Read', { file_path: 'C:\\secret\\dir\\notes.txt' })).toBe('read notes.txt')
  expect(summarize('Bash', { command: 'ls   -la' })).toBe('ran: ls -la')
})

test('the admin is flagged, in magenta, whatever the case of the name', () => {
  const [admin, viewer] = parseChat(`${ADMIN_NAME.toLowerCase()}: Pick a lane.\nkekw_fan: LUL`)
  expect(admin?.isAdmin).toBe(true)
  expect(admin?.name).toBe(ADMIN_NAME)
  expect(admin?.color).toBe('magenta')
  expect(viewer?.isAdmin).toBe(false)
  expect(viewer?.color).not.toBe('magenta')
})
