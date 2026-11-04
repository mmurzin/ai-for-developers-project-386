export const DURATIONS = [15, 30] as const

export type Duration = (typeof DURATIONS)[number]

export function parseDuration(value: string): Duration | null {
  const parsed = Number(value)

  return (DURATIONS as readonly number[]).includes(parsed) ? (parsed as Duration) : null
}
