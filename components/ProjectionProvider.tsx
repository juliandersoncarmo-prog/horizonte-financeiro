'use client'

import { createContext, useContext, useRef, useState } from 'react'
import type { ProjectionResult } from '@/types'
import LedgerView from './LedgerView'

const DailyEditorContext = createContext<{ date: string | null; open: (date: string) => boolean; close: () => void; setSaving: (busy: boolean) => void } | null>(null)
export function useDailyEditor() {
  const state = useContext(DailyEditorContext)
  if (!state) throw new Error('Editor indisponível')
  return state
}

const ProjectionContext = createContext<ProjectionResult | null>(null)
export function ProjectionProvider({ projection, children }: { projection: ProjectionResult; children: React.ReactNode }) {
  const [date, setDate] = useState<string | null>(null)
  const saving = useRef(false)
  return <ProjectionContext.Provider value={projection}><DailyEditorContext.Provider value={{ date, setSaving: busy => { saving.current = busy }, open: next => { if (saving.current) return false; setDate(next); return true }, close: () => setDate(null) }}>{children}</DailyEditorContext.Provider></ProjectionContext.Provider>
}
export function useOptionalProjection() { return useContext(ProjectionContext) }
export function useProjection() {
  const projection = useContext(ProjectionContext)
  if (!projection) throw new Error('Projeção indisponível')
  return projection
}
export function ProjectionLedger() {
  return <LedgerView projection={useProjection()} />
}
