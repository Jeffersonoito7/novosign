import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single()

  const credits = (profile?.companies as any)?.credits ?? 0

  return (
    <div className="flex h-screen transition-colors" style={{ background: 'var(--bg)' }}>
      <Sidebar user={profile} credits={credits} />
      <main className="flex-1 overflow-auto" style={{ color: 'var(--text-primary)' }}>
        {children}
      </main>
    </div>
  )
}
