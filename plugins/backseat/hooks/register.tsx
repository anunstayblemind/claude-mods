import type { Register } from 'claude-code'

import { parseChat, summarize } from './chat'
import { PERSONA } from './persona'
import type { Line } from '../types'

const LINES = { plugin: 'backseat', key: 'lines' } as const
const IS_ON = { plugin: 'backseat', key: 'isOn' } as const
const CALLS = { plugin: 'backseat', key: 'calls' } as const
const PANE = 'backseat'

const MIN_GAP_MS = 12000 // at most one model call per 12 seconds
const MAX_CALLS = 80 // per session; each call is one small Haiku request on the subscription

let buffer: string[] = []
let lastAt = 0
let isBusy = false

// Turn what happened since the last reaction into a few chat lines.
const react = async ($: any, isForced: boolean) => {
  if (isBusy || buffer.length === 0) return
  const isOn = (await $.state.get(IS_ON)).value ?? true
  if (!isOn) {
    buffer = []
    return
  }
  const calls = (await $.state.get(CALLS)).value ?? 0
  const now = await $.clock.now()
  if (calls >= MAX_CALLS || (!isForced && now - lastAt < MIN_GAP_MS)) return

  isBusy = true
  lastAt = now
  const events = buffer.slice(-10)
  buffer = []
  try {
    const r = await $.model.complete({
      model: 'haiku',
      maxTokens: 220,
      system: PERSONA,
      prompt: `What just happened:\n${events.join('\n')}\n\nWrite the chat messages now.`,
    })
    await $.state.set(CALLS, calls + 1)
    if (r.isAnswered) {
      const old: Line[] = (await $.state.get(LINES)).value ?? []
      await $.state.set(LINES, [...old, ...parseChat(r.text)].slice(-60))
    }
  } catch {
    // a failed request just means a quiet chat
  } finally {
    isBusy = false
  }
}

// The band above the prompt holds one tree. Keep what the mods beneath drew and stack ours under it.
function stackBand($: any, e: any, rest: any, mine: any) {
  if (!rest) return mine
  const { Box } = $.ui.resolve(e)
  return (
    <Box flexDirection="column">
      {rest}
      {mine}
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'backseat', description: 'Open the fake Twitch chat' })
    // Unasked, a pane is only drawn on a wide window; the Side chat button asks, which works at any width.
    void $.ui.open({ id: PANE, title: 'Chat' })
    return next(e)
  })

  on('command.run', { command: 'backseat' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Chat' })
    return { text: 'Chat opened.' }
  })

  on('prompt.submit', ($, e, next) => {
    if (!e.isMeta && e.origin.kind === 'user') buffer.push(`streamer asked: ${e.text.replace(/\s+/g, ' ').slice(0, 100)}`)
    return next(e)
  })

  on('tool.call', ($, e, next) => {
    buffer.push(summarize(e.tool, (e as any).input))
    void react($, false)
    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    buffer.push('Claude finished the turn')
    void react($, true)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const rest = await next(e)
    if (e.props.hasSurvey) return rest
    const isOn = (await $.state.get(IS_ON)).value ?? true
    const lines: Line[] = (await $.state.get(LINES)).value ?? []
    const isUp = (await $.ui.panes()).some(p => p.id === PANE && p.isPlaced)
    const { Box, Button, Text } = $.ui.resolve(e)
    return stackBand($, e, rest, (
      <Box flexDirection="column">
        {isOn &&
          !isUp &&
          lines.slice(-3).map((l, i) => (
            <Text key={`l${i}${l.name}`}>
              <Text bold={l.isAdmin} color={l.color as any}>{l.isAdmin ? '[ADMIN] ' : ''}{l.name}</Text>: {l.text}
            </Text>
          ))}
        <Box>
          <Button key="chat" label={isOn ? 'Chat: on' : 'Chat: off'} onPress={() => $.state.set(IS_ON, !isOn)} />
          {!isUp && <Button key="side" label="Side chat" onPress={() => $.ui.open({ id: PANE, title: 'Chat' })} />}
        </Box>
      </Box>
    ))
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const lines: Line[] = (await $.state.get(LINES)).value ?? []
    const room = Math.max(3, (e.viewport?.rows ?? 24) - 4)
    return (
      <Box flexDirection="column">
        {lines.length === 0 && <Text dimColor>Chat is quiet. Give Claude something to do.</Text>}
        {lines.slice(-room).map((l, i) => (
          <Text key={`p${i}${l.name}`}>
            <Text bold={l.isAdmin} color={l.color as any}>{l.isAdmin ? '[ADMIN] ' : ''}{l.name}</Text>: {l.text}
          </Text>
        ))}
        <Button key="clear" label="Clear chat" onPress={() => $.state.set(LINES, [])} />
      </Box>
    )
  })
}
