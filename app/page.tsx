import { getProjectionData } from '@/app/actions'
import LedgerView from '@/components/LedgerView'

export default async function HomePage() {
  const now = new Date()
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const projection = await getProjectionData(startDate, 4)
  console.log('page projection:', JSON.stringify(projection).slice(0, 500))
  return <LedgerView projection={projection} />
}
