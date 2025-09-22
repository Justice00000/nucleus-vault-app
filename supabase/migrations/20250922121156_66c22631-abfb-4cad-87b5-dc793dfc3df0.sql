-- Remove auto-approval for transfers to require admin approval
DROP TRIGGER IF EXISTS auto_approve_transfers_trigger ON public.transactions;
DROP FUNCTION IF EXISTS public.auto_approve_transfers();