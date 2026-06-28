import {
  pgTable,
  pgEnum,
  uuid,
  numeric,
  date,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const tipoTransacaoEnum = pgEnum('tipo_transacao', ['entrada', 'saida'])
export const frequenciaEnum    = pgEnum('frequencia',     ['mensal', 'quinzenal', 'semanal', 'unico'])
export const modoTerminoEnum   = pgEnum('modo_termino',   ['nunca', 'horizonte', 'ocorrencias', 'data'])

// ─── Tables ───────────────────────────────────────────────────────────────────

export const settingsTable = pgTable('settings', {
  id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id:        uuid('user_id').notNull().unique(),
  saldo_abertura: numeric('saldo_abertura', { precision: 15, scale: 2 }).notNull(),
  data_ancora:    date('data_ancora').notNull(),
  created_at:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const transactionsTable = pgTable('transactions', {
  id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id:    uuid('user_id').notNull(),
  tipo:       tipoTransacaoEnum('tipo').notNull(),
  valor:      numeric('valor', { precision: 15, scale: 2 }).notNull(),
  descricao:  text('descricao').notNull(),
  categoria:  text('categoria').notNull(),
  data:       date('data').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('transactions_user_id_idx').on(t.user_id),
  index('transactions_data_idx').on(t.data),
])

export const recurringRulesTable = pgTable('recurring_rules', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id:       uuid('user_id').notNull(),
  tipo:          tipoTransacaoEnum('tipo').notNull(),
  valor:         numeric('valor', { precision: 15, scale: 2 }).notNull(),
  descricao:     text('descricao').notNull(),
  categoria:     text('categoria').notNull(),
  frequencia:    frequenciaEnum('frequencia').notNull(),
  dia_do_mes:    integer('dia_do_mes').notNull(),
  data_inicio:   date('data_inicio').notNull(),
  modo_termino:  modoTerminoEnum('modo_termino').notNull(),
  valor_termino: text('valor_termino'),
  ativo:         boolean('ativo').notNull().default(true),
  created_at:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('recurring_rules_user_id_idx').on(t.user_id),
])

export const dailyBudgetsTable = pgTable('daily_budgets', {
  id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id:        uuid('user_id').notNull(),
  mes_referencia: text('mes_referencia'),
  descricao:      text('descricao').notNull(),
  categoria:      text('categoria').notNull(),
  valor_mensal:   numeric('valor_mensal', { precision: 15, scale: 2 }).notNull(),
  created_at:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('daily_budgets_user_id_idx').on(t.user_id),
])

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Settings       = typeof settingsTable.$inferSelect
export type NewSettings    = typeof settingsTable.$inferInsert

export type Transaction    = typeof transactionsTable.$inferSelect
export type NewTransaction = typeof transactionsTable.$inferInsert

export type RecurringRule    = typeof recurringRulesTable.$inferSelect
export type NewRecurringRule = typeof recurringRulesTable.$inferInsert

export type DailyBudget    = typeof dailyBudgetsTable.$inferSelect
export type NewDailyBudget = typeof dailyBudgetsTable.$inferInsert
