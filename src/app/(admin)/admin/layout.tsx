import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await admin
    .from('users')
    .select('role, name, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/dashboard')

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)' }}>
      <AdminSidebar user={profile} />
      <main className="flex-1 overflow-auto" style={{ color: 'var(--text-primary)' }}>
        {children}
      </main>
    </div>
  )
}
