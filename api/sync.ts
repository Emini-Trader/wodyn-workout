// Vercel Function: przechowuje dziennik treningowy w Upstash Redis (Vercel Marketplace → Upstash for Redis).
// Wymagane zmienne środowiskowe:
//   SYNC_SECRET                                 – dowolne hasło, wpisywane w aplikacji (Więcej → Synchronizacja)
//   <PREFIX>_REST_API_URL + <PREFIX>_REST_API_TOKEN – ustawiane automatycznie przez integrację Upstash
//   (dowolny prefiks, np. KV lub STORAGE; alternatywnie UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)

const DATA_KEY = 'wodyn-picp:data'
const MAX_BYTES = 1_000_000

/** Szuka danych dostępowych Upstash niezależnie od prefiksu nadanego przy podłączaniu bazy (KV_, STORAGE_, …). */
function upstash(): { url: string; token: string } | null {
  const e = process.env
  if (e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN) return { url: e.UPSTASH_REDIS_REST_URL, token: e.UPSTASH_REDIS_REST_TOKEN }
  const prefixes = Object.keys(e)
    .filter((k) => k.endsWith('_REST_API_URL'))
    .map((k) => k.slice(0, -'_REST_API_URL'.length))
    .sort((a, b) => (a === 'KV' ? -1 : b === 'KV' ? 1 : 0))
  for (const p of prefixes) {
    const url = e[`${p}_REST_API_URL`]
    const token = e[`${p}_REST_API_TOKEN`]
    if (url && token) return { url, token }
  }
  return null
}

function env() {
  const db = upstash()
  const secret = process.env.SYNC_SECRET
  return db && secret ? { url: db.url.replace(/\/$/, ''), token: db.token, secret } : null
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

async function redis(cfg: NonNullable<ReturnType<typeof env>>, command: (string | number)[]) {
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error(`redis ${res.status}`)
  return ((await res.json()) as { result: unknown }).result
}

function guard(request: Request) {
  const cfg = env()
  if (!cfg) return { error: json({ error: 'not_configured' }, 501) }
  const key = request.headers.get('x-sync-key') ?? ''
  if (!safeEqual(key, cfg.secret)) return { error: json({ error: 'unauthorized' }, 401) }
  return { cfg }
}

export async function GET(request: Request) {
  const g = guard(request)
  if (!g.cfg) return g.error
  try {
    const raw = await redis(g.cfg, ['GET', DATA_KEY])
    return json({ data: typeof raw === 'string' ? JSON.parse(raw) : null })
  } catch {
    return json({ error: 'storage_error' }, 502)
  }
}

export async function PUT(request: Request) {
  const g = guard(request)
  if (!g.cfg) return g.error
  const text = await request.text()
  if (text.length > MAX_BYTES) return json({ error: 'too_large' }, 413)
  let body: { v?: number; weeks?: unknown }
  try {
    body = JSON.parse(text)
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  if (!body || body.v !== 1 || typeof body.weeks !== 'object') return json({ error: 'bad_shape' }, 400)
  try {
    await redis(g.cfg, ['SET', DATA_KEY, text])
    return json({ ok: true })
  } catch {
    return json({ error: 'storage_error' }, 502)
  }
}
