import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { ToastContainer } from '@/components/ui/Toast'
import type { DbUser } from '@/types/database'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login')
  }

  // Fetch profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, username, plan, plan_expires_at, timezone, language, blueprint_count, api_tokens_used, deployment_count, created_at, updated_at')
    .eq('id', authUser.id)
    .single()

  // If profile not yet created (trigger delay), create fallback
  const user: DbUser = (profile as DbUser | null) ?? {
    id: authUser.id,
    email: authUser.email ?? '',
    full_name: authUser.user_metadata?.full_name ?? null,
    avatar_url: authUser.user_metadata?.avatar_url ?? null,
    username: null,
    plan: 'free',
    plan_expires_at: null,
    timezone: 'Europe/Istanbul',
    language: 'tr',
    blueprint_count: 0,
    api_tokens_used: 0,
    deployment_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <div data-theme="light" className="flex h-screen bg-[var(--bg)] overflow-hidden">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        <Topbar user={user} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[var(--bg)] [&:has([data-full-bleed])]:p-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--border-2)] [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="[&:not(:has([data-full-bleed]))]:max-w-[860px] [&:not(:has([data-full-bleed]))]:mx-auto [&:not(:has([data-full-bleed]))]:px-8 [&:not(:has([data-full-bleed]))]:py-8">
            {children}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
