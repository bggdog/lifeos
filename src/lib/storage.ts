const LS = () => globalThis.localStorage

function parseJson(raw: string | null): unknown {
  if (raw == null || raw === '') return undefined
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

export function getUserData(user: string, key: string): unknown {
  return parseJson(LS().getItem(`${user}.${key}`))
}

export function setUserData(user: string, key: string, value: unknown): void {
  LS().setItem(`${user}.${key}`, JSON.stringify(value))
}

export function getSharedData(key: string): unknown {
  return parseJson(LS().getItem(`shared.${key}`))
}

export function setSharedData(key: string, value: unknown): void {
  LS().setItem(`shared.${key}`, JSON.stringify(value))
}
