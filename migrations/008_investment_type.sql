-- Incremental enum addition; commit before using its new value.
ALTER TYPE public.tipo_transacao ADD VALUE IF NOT EXISTS 'investimento';
