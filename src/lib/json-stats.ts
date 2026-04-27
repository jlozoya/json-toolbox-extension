export type JsonStats = {
  objects: number
  arrays: number
  keys: number
  primitives: number
  bytes: number
}

export function getJsonStats(value: unknown, source = ""): JsonStats {
  const stats: JsonStats = {
    objects: 0,
    arrays: 0,
    keys: 0,
    primitives: 0,
    bytes: new Blob([source]).size,
  }

  walk(value, stats)

  return stats
}

function walk(value: unknown, stats: JsonStats) {
  if (Array.isArray(value)) {
    stats.arrays += 1

    for (const item of value) {
      walk(item, stats)
    }

    return
  }

  if (value !== null && typeof value === "object") {
    stats.objects += 1

    const entries = Object.entries(value as Record<string, unknown>)
    stats.keys += entries.length

    for (const [, childValue] of entries) {
      walk(childValue, stats)
    }

    return
  }

  stats.primitives += 1
}