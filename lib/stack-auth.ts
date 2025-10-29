// Stack Auth Configuration
// Using JWKS for JWT verification
import { jwtVerify, importJWK, JWK } from 'jose'

const STACK_AUTH_PROJECT_ID = 'a657e53b-e894-4d8a-bda2-e7f205976b5a'
const JWKS_URL = `https://api.stack-auth.com/api/v1/projects/${STACK_AUTH_PROJECT_ID}/.well-known/jwks.json`

let jwksCache: JWK[] | null = null
let jwksCacheTime: number = 0
const CACHE_DURATION = 3600000 // 1 hour in milliseconds

async function getJWKS(): Promise<JWK[]> {
  const now = Date.now()
  
  if (jwksCache && (now - jwksCacheTime) < CACHE_DURATION) {
    return jwksCache
  }
  
  try {
    const response = await fetch(JWKS_URL)
    if (!response.ok) {
      throw new Error('Failed to fetch JWKS')
    }
    
    const data = await response.json()
    const keys = data.keys || []
    jwksCache = keys
    jwksCacheTime = now
    
    return keys
  } catch (error) {
    console.error('Failed to fetch JWKS:', error)
    throw error
  }
}

// Verificar token JWT de Stack Auth
export async function verifyStackAuthToken(token: string): Promise<any | null> {
  try {
    const jwks = await getJWKS()
    
    for (const jwk of jwks) {
      try {
        const publicKey = await importJWK(jwk)
        
        const { payload } = await jwtVerify(token, publicKey, {
          issuer: 'https://api.stack-auth.com',
          audience: STACK_AUTH_PROJECT_ID
        })
        
        return payload
      } catch (err) {
        // Try next key
        continue
      }
    }
    
    throw new Error('No matching key found')
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// Obtener usuario desde el token
export async function getStackAuthUser(token: string): Promise<any | null> {
  const payload = await verifyStackAuthToken(token)
  return payload
}

export { STACK_AUTH_PROJECT_ID }