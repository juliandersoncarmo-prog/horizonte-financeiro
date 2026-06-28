import { getProjectionData } from '@/app/actions'
import LedgerView from '@/components/LedgerView'

export default async function HomePage() {
  const now = new Date()
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const endYear = now.getFullYear() + 5
  const months = (endYear - now.getFullYear()) * 12 + (12 - now.getMonth())
  const projection = await getProjectionData(startDate, months)
  console.log('page projection:', JSON.stringify(projection).slice(0, 500))
  return <LedgerView projection={projection} />
}
