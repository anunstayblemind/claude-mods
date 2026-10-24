import { test, expect } from 'claude-code/testing'

import { parseChat, summarize } from './chat'
import { ADMIN_NAME } from './persona'

test('parses name: message lines and drops the rest', () => {
  const got = parseChat('Sure, here you go:\nkekw_fan: bro really ran rm\n- pog_champ99: Pog\n\nnot a line')
  expect(got.map(l => l.name)).toEqual(['kekw_fan', 'pog_champ99'])
  expect(got[0].text).toBe('bro really ran rm')
})

test('a name keeps its colour', () => {
  expect(parseChat('abc123: hi')[0].color).toBe(parseChat('abc123: bye')[0].color)
})

test('summaries cut paths to the file name', () => {
  expect(summarize('Read', { file_path: 'C:\\secret\\dir\\notes.txt' })).toBe('read notes.txt')
  expect(summarize('Bash', { command: 'ls   -la' })).toBe('ran: ls -la')
})

test('the admin is flagged, in magenta, whatever the case of the name', () => {
  const got = parseChat(`${ADMIN_NAME.toLowerCase()}: Pick a lane.\nkekw_fan: LUL`)
  expect(got[0].isAdmin).toBe(true)
  expect(got[0].name).toBe(ADMIN_NAME)
  expect(got[0].color).toBe('magenta')
  expect(got[1].isAdmin).toBe(false)
  expect(got[1].color).not.toBe('magenta')
})
