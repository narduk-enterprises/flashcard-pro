/**
 * App-level auth: PBKDF2 password hashing (Web Crypto), session in cookie.
 * Uses layer's users + sessions tables. Do not use Node.js crypto or bcrypt.
 */
import { getCookie, setCookie, deleteCookie } from 'h3'
import type { H3Event } from 'h3'
import { eq, and, gt } from 'drizzle-orm'
import { users, sessions } from '../database/schema'
import { useDatabase } from '#layer/server/utils/database'

const PBKDF2_ITERATIONS = 100_000
const SESSION_COOKIE = 'sid'
const SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export type AuthUser = { id: string; email: string; name: string | null }

function b64ToU8(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function u8ToB64(u8: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]!)
  return btoa(bin)
}

/** Hash password with PBKDF2-SHA256; returns "iterations:salt:hash" for storage. */
export async function hashPassword(password: string): Promise<string> {
  const saltArr = new Uint8Array(16)
  crypto.getRandomValues(saltArr)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltArr as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  return `${PBKDF2_ITERATIONS}:${u8ToB64(saltArr)}:${u8ToB64(new Uint8Array(derived))}`
}

/** Verify password against stored "iterations:salt:hash" string. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  if (parts.length !== 3) return false
  const iterStr = parts[0]
  const saltB64 = parts[1]
  const hashB64 = parts[2]
  if (saltB64 === undefined || hashB64 === undefined) return false
  const iterations = Number.parseInt(iterStr ?? '0', 10)
  if (!Number.isFinite(iterations) || iterations < 1) return false
  const salt = b64ToU8(saltB64)
  const expected = b64ToU8(hashB64)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const actual = new Uint8Array(derived)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= (actual[i] ?? 0) ^ (expected[i] ?? 0)
  return diff === 0
}

/** Create session row and set cookie. Returns user (no password). */
export async function createSession(event: H3Event, userId: string): Promise<AuthUser> {
  const db = useDatabase(event)
  const [user] = await db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq(users.id, userId))
  if (!user) throw createError({ statusCode: 401, message: 'User not found' })
  const id = crypto.randomUUID()
  const expiresAt = Math.floor((Date.now() + SESSION_AGE_MS) / 1000)
  await db.insert(sessions).values({
    id,
    userId: user.id,
    expiresAt,
    createdAt: new Date().toISOString(),
  })
  setCookie(event, SESSION_COOKIE, id, {
    httpOnly: true,
    secure: import.meta.dev ? false : true,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_AGE_MS / 1000),
  })
  return { id: user.id, email: user.email, name: user.name }
}

/** Get current user from session cookie or null. */
export async function getSessionFromEvent(event: H3Event): Promise<AuthUser | null> {
  const sid = getCookie(event, SESSION_COOKIE)
  if (!sid) return null
  const db = useDatabase(event)
  const now = Math.floor(Date.now() / 1000)
  const [session] = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(and(eq(sessions.id, sid), gt(sessions.expiresAt, now)))
  if (!session) return null
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, session.userId))
  if (!user) return null
  return { id: user.id, email: user.email, name: user.name }
}

/** Require authenticated user; throws 401 if not logged in. */
export async function requireUser(event: H3Event): Promise<AuthUser> {
  const user = await getSessionFromEvent(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
  return user
}

/** Clear session cookie and delete session row. */
export async function destroySession(event: H3Event): Promise<void> {
  const sid = getCookie(event, SESSION_COOKIE)
  if (sid) {
    const db = useDatabase(event)
    await db.delete(sessions).where(eq(sessions.id, sid))
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}
