import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
export default defineConfig({ root: file('./'), plugins: [react()], resolve: { alias: [
{ find: '@/app/actions', replacement: file('./actions.ts') },
{ find: '@/app/card-actions', replacement: file('./actions.ts') },
{ find: 'next/navigation', replacement: file('./navigation.ts') },
{ find: 'next/link', replacement: file('./link.tsx') },
{ find: '@', replacement: file('../') }
]}, build: { outDir: file('../preview-dist'), emptyOutDir: true } })
