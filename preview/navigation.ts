import { useSyncExternalStore } from 'react'
export function refresh() { window.dispatchEvent(new Event('hf-demo-change')) }
function subscribe(callback: () => void) { window.addEventListener('hf-demo-change', callback); return () => window.removeEventListener('hf-demo-change', callback) }
export function usePathname() { return useSyncExternalStore(subscribe, () => location.hash === '#/configuracoes' ? '/configuracoes' : '/') }
export function useRouter() { return { refresh, push: (path: string) => { location.hash = path; refresh() } } }
