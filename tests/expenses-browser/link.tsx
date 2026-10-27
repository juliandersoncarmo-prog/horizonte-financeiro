import type {ReactNode} from 'react'
export default function Link({prefetch,children,...props}:{href:string;prefetch?:boolean;children:ReactNode}){void prefetch;return <a {...props}>{children}</a>}
