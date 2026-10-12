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
  uniqueIndex,
  foreignKey,
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
  incluido_diario: boolean('incluido_diario').notNull().default(false),
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
  incluido_diario: boolean('incluido_diario').notNull().default(false),
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

export const dailyActualsTable = pgTable('daily_actuals', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  data: date('data').notNull(),
  valor: numeric('valor', { precision: 15, scale: 2 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex('daily_actuals_user_date_idx').on(t.user_id, t.data)])

// SQL migrations remain authoritative for auth.users FKs, RLS and checks.
export const creditCardsTable = pgTable('credit_cards', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  nome: text('nome').notNull(),
  dia_vencimento: integer('dia_vencimento').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex('credit_cards_id_user_idx').on(t.id, t.user_id), index('credit_cards_user_idx').on(t.user_id)])

export const cardInvoicesTable = pgTable('card_invoices', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  card_id: uuid('card_id').notNull(),
  mes_referencia: text('mes_referencia').notNull(),
  valor: numeric('valor', { precision: 15, scale: 2 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex('card_invoices_owner_card_month_idx').on(t.user_id, t.card_id, t.mes_referencia),
  foreignKey({ columns: [t.card_id, t.user_id], foreignColumns: [creditCardsTable.id, creditCardsTable.user_id] }).onDelete('cascade')])
