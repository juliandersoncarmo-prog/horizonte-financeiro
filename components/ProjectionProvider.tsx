'use client'

import { createContext, useContext } from 'react'
import type { ProjectionResult } from '@/types'
import LedgerView from './LedgerView'

const ProjectionContext = createContext<ProjectionResult | null>(null)
export function ProjectionProvider({ projection, children }: { projection: ProjectionResult; children: React.ReactNode }) {
  return <ProjectionContext.Provider value={projection}>{children}</ProjectionContext.Provider>
}
export function useProjection() {
  const projection = useContext(ProjectionContext)
  if (!projection) throw new Error('Projeção indisponível')
  return projection
}
export function ProjectionLedger() {
  return <LedgerView projection={useProjection()} />
}
