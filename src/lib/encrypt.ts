import crypto from 'crypto'

const RAW = process.env.API_KEYS_ENCRYPTION_SECRET ?? 'dev-secret-replace-in-prod'
const KEY = crypto.scryptSync(RAW, 'nutrition-app-v1', 32)

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

export function decrypt(stored: string): string {
  const [ivHex, tagHex, encHex] = stored.split(':')
  const iv  = Buffer.from(ivHex,  'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const enc = Buffer.from(encHex, 'hex')
  const d = crypto.createDecipheriv('aes-256-gcm', KEY, iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8')
}
