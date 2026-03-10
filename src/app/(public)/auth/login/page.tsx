// Server Component — disables prerendering
// No 'use client': force-dynamic only works in Server Components
export const dynamic = 'force-dynamic'

import LoginForm from './LoginForm'

export default function LoginPage() {
  return <LoginForm />
}
