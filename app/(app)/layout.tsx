import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import FirstAccess from '@/components/FirstAccess'
import { getProjectionData, hasInitialSettings } from '@/app/actions'
import { ProjectionProvider } from '@/components/ProjectionProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')
  const name = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : user.email?.split('@')[0] || 'Minha conta'
  const profile = { name, email: user.email || '', initials: name.trim().split(/\s+/).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase() }
  if (!(await hasInitialSettings())) return <FirstAccess />
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Fortaleza' }).format(new Date())
  const [year, month] = today.split('-').map(Number)
  const projection = await getProjectionData(`${year}-${String(month).padStart(2, '0')}-01`, 60 + 13 - month)
  return (
    <ProjectionProvider projection={projection}>
      <div className="app-shell flex h-full">
        <Sidebar profile={profile} />
        <main className="app-main min-w-0 flex-1 overflow-hidden flex flex-col">{children}</main>
      </div>
    </ProjectionProvider>
  )
}
