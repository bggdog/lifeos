import { supabase } from './supabaseClient'

const LS = () => globalThis.localStorage

/** Tracks whether legacy browser KV was scanned/imported */
const LS_IMPORT_FLAG = 'lifeos.supabase.ls_import_done'

type KvRow = { bucket: string; key: string; value: unknown }

function cacheKey(bucket: string, key: string): string {
  return `${bucket}\u001f${key}`
}

/** Parsed rows keyed by bucket\u001fkey */
const cache = new Map<string, unknown>()

const kvListeners = new Set<() => void>()
let notifyScheduled = false

export function subscribeKv(listener: () => void): () => void {
  kvListeners.add(listener)
  return () => kvListeners.delete(listener)
}

function notifyKvListeners(): void {
  if (notifyScheduled) return
  notifyScheduled = true
  queueMicrotask(() => {
    notifyScheduled = false
    for (const fn of kvListeners) fn()
  })
}

function seedCacheFromLocalStorage(): void {
  const ls = LS()
  for (let i = 0; i < ls.length; i++) {
    const full = ls.key(i)
    if (!full) continue
    const raw = ls.getItem(full)
    if (raw == null || raw === '') continue
    let value: unknown
    try {
      value = JSON.parse(raw) as unknown
    } catch {
      continue
    }
    if (full.startsWith('shared.')) {
      cache.set(cacheKey('shared', full.slice('shared.'.length)), value)
      continue
    }
    const dot = full.indexOf('.')
    if (dot <= 0) continue
    const bucket = full.slice(0, dot)
    if (bucket !== 'Branson' && bucket !== 'Kelsee') continue
    cache.set(cacheKey(bucket, full.slice(dot + 1)), value)
  }
}

function collectMigrateRowsFromLs(): KvRow[] {
  const ls = LS()
  const rows: KvRow[] = []
  for (let i = 0; i < ls.length; i++) {
    const full = ls.key(i)
    if (!full) continue
    const raw = ls.getItem(full)
    if (raw == null || raw === '') continue
    let value: unknown
    try {
      value = JSON.parse(raw) as unknown
    } catch {
      continue
    }
    if (full.startsWith('shared.')) {
      rows.push({
        bucket: 'shared',
        key: full.slice('shared.'.length),
        value,
      })
      continue
    }
    const dot = full.indexOf('.')
    if (dot <= 0) continue
    const bucket = full.slice(0, dot)
    if (bucket !== 'Branson' && bucket !== 'Kelsee') continue
    rows.push({ bucket, key: full.slice(dot + 1), value })
  }
  return rows
}

async function upsertRemote(row: KvRow): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('lifeos_kv').upsert(row, {
    onConflict: 'bucket,key',
  })
  if (error) console.error('[lifeos_kv]', error.message)
}

let realtimeStarted = false

function subscribeRealtime(): void {
  if (!supabase || realtimeStarted) return
  realtimeStarted = true
  supabase
    .channel('lifeos_kv')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lifeos_kv' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const old = payload.old as { bucket?: string; key?: string }
          if (old.bucket != null && old.key != null) {
            cache.delete(cacheKey(old.bucket, old.key))
          }
        } else {
          const row = payload.new as {
            bucket?: string
            key?: string
            value?: unknown
          }
          if (row.bucket != null && row.key != null) {
            cache.set(cacheKey(row.bucket, row.key), row.value)
          }
        }
        notifyKvListeners()
      },
    )
    .subscribe()
}

let hydratePromise: Promise<void> | null = null

async function runHydrate(): Promise<void> {
  cache.clear()

  if (!supabase) {
    seedCacheFromLocalStorage()
    return
  }

  const { data, error } = await supabase.from('lifeos_kv').select('bucket,key,value')
  if (error) throw error

  for (const row of data ?? []) {
    cache.set(cacheKey(row.bucket, row.key), row.value)
  }

  if ((data?.length ?? 0) > 0) {
    LS().setItem(LS_IMPORT_FLAG, '1')
  } else if (!LS().getItem(LS_IMPORT_FLAG)) {
    const batch = collectMigrateRowsFromLs()
    if (batch.length > 0) {
      const { error: upErr } = await supabase.from('lifeos_kv').upsert(batch, {
        onConflict: 'bucket,key',
      })
      if (upErr) console.error('[lifeos_kv migrate]', upErr.message)
      else {
        for (const r of batch) cache.set(cacheKey(r.bucket, r.key), r.value)
      }
    }
    LS().setItem(LS_IMPORT_FLAG, '1')
  }

  subscribeRealtime()
}

/** Load remote/local KV before rendering the app. Safe to call multiple times. */
export function hydrateLifeOsStorage(): Promise<void> {
  hydratePromise ??= runHydrate()
  return hydratePromise
}

export function getUserData(user: string, key: string): unknown {
  return cache.get(cacheKey(user, key))
}

export function setUserData(user: string, key: string, value: unknown): void {
  cache.set(cacheKey(user, key), value)
  notifyKvListeners()
  if (!supabase) {
    LS().setItem(`${user}.${key}`, JSON.stringify(value))
    return
  }
  void upsertRemote({ bucket: user, key, value })
}

export function getSharedData(key: string): unknown {
  return cache.get(cacheKey('shared', key))
}

export function setSharedData(key: string, value: unknown): void {
  cache.set(cacheKey('shared', key), value)
  notifyKvListeners()
  if (!supabase) {
    LS().setItem(`shared.${key}`, JSON.stringify(value))
    return
  }
  void upsertRemote({ bucket: 'shared', key, value })
}
