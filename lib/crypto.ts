import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTED_PREFIX = 'enc:'

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(keyHex, 'hex')
}

/**
 * Encripta un token OAuth para almacenarlo en la DB.
 * Formato resultante: "enc:<iv_hex>:<tag_hex>:<encrypted_hex>"
 */
export function encryptToken(text: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return ENCRYPTED_PREFIX + [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':')
}

/**
 * Desencripta un token OAuth.
 * Si el valor no tiene el prefijo "enc:", lo retorna tal cual (compatibilidad con tokens legacy en texto plano).
 */
export function decryptToken(value: string): string {
  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    // Token legacy en texto plano — se usa tal cual hasta que el coach reconecte su cuenta
    return value
  }
  const key = getKey()
  const parts = value.slice(ENCRYPTED_PREFIX.length).split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }
  const [ivHex, tagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}
