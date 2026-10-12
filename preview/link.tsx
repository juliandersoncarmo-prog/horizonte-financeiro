import type { AnchorHTMLAttributes } from 'react'
import { refresh } from './navigation'
export default function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) { return <a {...props} href={'#' + href} onClick={() => { location.hash = href ?? '/'; refresh() }}>{children}</a> }
