async function loginAndFetchPlans() {
  const baseUrl = 'http://localhost:3000'
  const email = 'student1@local.test'
  const password = 'Test1234!'

  const cookieJar = new Map<string, string>()

  const parseCookies = (setCookieHeader: string | null) => {
    if (!setCookieHeader) return
    const cookies = setCookieHeader.split(',').map(c => c.trim().split(';')[0])
    for (const c of cookies) {
      const [name, ...rest] = c.split('=')
      if (name && rest.length > 0) {
        cookieJar.set(name, rest.join('='))
      }
    }
  }

  const getCookieHeader = () => {
    return Array.from(cookieJar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  // 1. Obtener CSRF token
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {
    headers: { Accept: 'application/json' },
  })
  parseCookies(csrfRes.headers.get('set-cookie'))
  const csrfData = await csrfRes.json()
  const csrfToken = csrfData.csrfToken

  // 2. Login con credentials
  const params = new URLSearchParams()
  params.append('email', email)
  params.append('password', password)
  params.append('csrfToken', csrfToken)
  params.append('callbackUrl', `${baseUrl}/choose-plan`)
  params.append('json', 'true')

  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Cookie: getCookieHeader(),
    },
    body: params.toString(),
    redirect: 'manual',
  })
  parseCookies(loginRes.headers.get('set-cookie'))

  // Seguir redirect si existe
  let redirectUrl = loginRes.headers.get('location')
  while (redirectUrl && redirectUrl !== `${baseUrl}/choose-plan`) {
    const redirectRes = await fetch(redirectUrl, {
      headers: { Cookie: getCookieHeader() },
      redirect: 'manual',
    })
    parseCookies(redirectRes.headers.get('set-cookie'))
    redirectUrl = redirectRes.headers.get('location')
  }

  // 3. Fetch session para confirmar login
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      Accept: 'application/json',
      Cookie: getCookieHeader(),
    },
  })
  parseCookies(sessionRes.headers.get('set-cookie'))
  const session = await sessionRes.json()
  console.log('Session:', JSON.stringify(session, null, 2))

  // 4. Fetch planes
  const plansRes = await fetch(`${baseUrl}/api/subscription-plans`, {
    headers: {
      Accept: 'application/json',
      Cookie: getCookieHeader(),
    },
  })
  const plans = await plansRes.json()
  console.log('\nPlanes listados:', JSON.stringify(plans, null, 2))

  // 5. Fetch plan personalizado por ID (sin auth)
  const planRes = await fetch(`${baseUrl}/api/subscription-plans/5`)
  const plan = await planRes.json()
  console.log('\nPlan personalizado por ID:', JSON.stringify(plan, null, 2))
}

loginAndFetchPlans().catch(console.error)
