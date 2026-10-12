// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import ModalPortal from './ModalPortal'
vi.stubGlobal('React', React)
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
it.each(['Diário', 'Nova entrada', 'Nova saída'])('portals %s, traps focus and restores wizard focus/state on dismissal', async label => {
  const host = document.createElement('div'); document.body.append(host)
  const trigger = document.createElement('button'); host.append(trigger); trigger.focus()
  const rootHost = document.createElement('div'); host.append(rootHost)
  const root = createRoot(rootHost), close = vi.fn()
  try {
    await act(() => root.render(<ModalPortal onClose={close} label={label}><button>Primeiro</button><input /><button>Último</button></ModalPortal>))
    const dialog = document.querySelector('[role=dialog]') as HTMLElement
    expect(host.contains(dialog)).toBe(false)
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(host.inert).toBe(true)
    const buttons = dialog.querySelectorAll('button')
    expect(document.activeElement).toBe(buttons[0])
    buttons[1].focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }))
    expect(document.activeElement).toBe(buttons[0])
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true }))
    expect(document.activeElement).toBe(buttons[1])
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))
    expect(close).toHaveBeenCalledTimes(1)
    await act(() => root.unmount())
    expect(host.inert).toBe(false)
    expect(document.activeElement).toBe(trigger)
    expect(document.querySelector('[role=dialog]')).toBeNull()
  } finally { host.remove() }
})
