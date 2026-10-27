'use client'

import { useRef, type TouchEvent, type MouseEvent } from 'react'

const INTERACTIVE = 'button, a, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="menu"], [role="slider"], [data-no-swipe]'
type Gesture = { x: number; y: number; id: number; horizontal: boolean }

/** One month per deliberate horizontal touch gesture; vertical scroll stays native. */
export function useMobileSwipe(navigate: (direction: -1 | 1) => void, blocked?: () => boolean, swipeSurface?: string) {
  const gesture = useRef<Gesture | null>(null)
  const suppressClickUntil = useRef(0)
  const suppressTarget = useRef<EventTarget | null>(null)
  function available() { return window.innerWidth < 640 && !blocked?.() }
  function movement(event: TouchEvent<HTMLElement>) {
    const start = gesture.current
    if (!start) return null
    const touch = Array.from(event.touches.length ? event.touches : event.changedTouches).find(touch => touch.identifier === start.id)
    if (!touch) { gesture.current = null; return null }
    const dx = touch.clientX - start.x, dy = touch.clientY - start.y
    // Once a vertical/diagonal scroll begins, never reinterpret it as navigation.
    if (!start.horizontal && Math.max(Math.abs(dx), Math.abs(dy)) >= 12) {
      if (Math.abs(dx) <= Math.abs(dy) * 1.5) { gesture.current = null; return null }
      start.horizontal = true
    }
    return { dx, dy, start }
  }
  return {
    onTouchStart(event: TouchEvent<HTMLElement>) {
      gesture.current = null
      if (!available() || event.touches.length !== 1) return
      const target = event.target as Element
      if (target.closest(INTERACTIVE) && !(swipeSurface && target.closest(swipeSurface))) return
      if (document.activeElement?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return
      const touch = event.touches[0]
      gesture.current = { x: touch.clientX, y: touch.clientY, id: touch.identifier, horizontal: false }
    },
    onTouchMove(event: TouchEvent<HTMLElement>) {
      if (event.touches.length !== 1 || !available()) { gesture.current = null; return }
      movement(event)
    },
    onTouchEnd(event: TouchEvent<HTMLElement>) {
      const move = movement(event)
      gesture.current = null
      if (!move || !available() || event.touches.length || !move.start.horizontal) return
      // Block the trailing click so a drag never opens a day or edits a field.
      if (Math.abs(move.dx) >= 12) { suppressClickUntil.current = Date.now() + 400; suppressTarget.current = event.target }
      if (Math.abs(move.dx) < 56 || Math.abs(move.dx) <= Math.abs(move.dy) * 1.5) return
      navigate(move.dx < 0 ? 1 : -1)
    },
    onTouchCancel() { gesture.current = null },
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (Date.now() < suppressClickUntil.current && event.target === suppressTarget.current) { event.preventDefault(); event.stopPropagation(); suppressClickUntil.current = 0 }
    },
  }
}
