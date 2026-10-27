'use client'

import { createContext, useContext, useRef, useState } from 'react'
import { runProjection } from '@/lib/engine/projection'
import type { ProjectionInput, ProjectionResult } from '@/types'
import LedgerView from './LedgerView'
import { ExpenseCacheProvider } from './ExpenseCacheProvider'

const DailyEditorContext = createContext<{ date: string | null; open: (date: string) => boolean; close: () => void; setSaving: (busy: boolean) => void } | null>(null)
export function useDailyEditor() {
  const state = useContext(DailyEditorContext)
  if (!state) throw new Error('Editor indisponível')
  return state
}

const ProjectionContext = createContext<ProjectionResult | null>(null)
const ProjectionUpdateContext = createContext<((change: (input: ProjectionInput) => ProjectionInput) => boolean) | null>(null)
export function useProjectionUpdate() { return useContext(ProjectionUpdateContext) }

export function ProjectionProvider({ projection, children }: { projection: ProjectionResult; children: React.ReactNode }) {
  const [state, setState] = useState(projection)
  const [source, setSource] = useState(projection)
  if (source !== projection) { setSource(projection); setState(projection) }
  function update(change: (input: ProjectionInput) => ProjectionInput) {
    if (!state.inputSnapshot) return false
    setState(current => {
      if (!current.inputSnapshot) return current
      const inputSnapshot = change(current.inputSnapshot)
      return { ...runProjection(inputSnapshot), inputSnapshot, cardData: current.cardData, editorData: { recurringRules: inputSnapshot.recurringRules, dailyBudgets: inputSnapshot.dailyBudgets } }
    })
    return true
  }
  const [date, setDate] = useState<string | null>(null)
  const saving = useRef(false)
  return <ExpenseCacheProvider><ProjectionContext.Provider value={state}><ProjectionUpdateContext.Provider value={update}><DailyEditorContext.Provider value={{ date, setSaving: busy => { saving.current = busy }, open: next => { if (saving.current) return false; setDate(next); return true }, close: () => setDate(null) }}>{children}</DailyEditorContext.Provider></ProjectionUpdateContext.Provider></ProjectionContext.Provider></ExpenseCacheProvider>
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
