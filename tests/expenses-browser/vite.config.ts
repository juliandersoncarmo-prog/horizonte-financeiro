import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {fileURLToPath} from 'node:url'
const path=(p:string)=>fileURLToPath(new URL(p,import.meta.url))
export default defineConfig({root:path('./'),plugins:[react()],resolve:{alias:[
 {find:'./ProjectionProvider',replacement:path('./projection.ts')},
 {find:'./AddTransactionModal',replacement:path('./modal.tsx')},
 {find:'./CreditCardsModal',replacement:path('./modal.tsx')},
 {find:'./DiarioModal',replacement:path('./modal.tsx')},
 {find:'./MonthlySummaryModal',replacement:path('./modal.tsx')},
 {find:'@/app/actions',replacement:path('./sidebar-actions.ts')},
 {find:'@/app/expense-actions',replacement:path('./actions.ts')},
 {find:'next/link',replacement:path('./link.tsx')},
 {find:'next/navigation',replacement:path('./navigation.ts')},
 {find:'@',replacement:path('../../')}
]},server:{host:'0.0.0.0',fs:{allow:[path('../../')]}}})
