export type Line = { name: string; text: string; color: string; isAdmin?: boolean }

declare module 'claude-code' {
  interface PluginState {
    backseat: { lines: Line[]; isOn: boolean; calls: number }
  }
}
