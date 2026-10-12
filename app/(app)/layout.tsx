import Sidebar from '@/components/Sidebar'
import FirstAccess from '@/components/FirstAccess'
import { getProjectionData, hasInitialSettings } from '@/app/actions'
import { ProjectionProvider } from '@/components/ProjectionProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasInitialSettings())) return <FirstAccess />
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Fortaleza' }).format(new Date())
  const [year, month] = today.split('-').map(Number)
  const projection = await getProjectionData(`${year}-${String(month).padStart(2, '0')}-01`, 60 + 13 - month)
  return (
    <ProjectionProvider projection={projection}>
      <div className="flex h-full">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
      </div>
    </ProjectionProvider>
  )
}
