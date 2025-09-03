-- Fix the balance update trigger to fire on both INSERT and UPDATE
DROP TRIGGER IF EXISTS transaction_balance_update ON transactions;

CREATE TRIGGER transaction_balance_update
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

-- Also ensure the trigger happens after the auto_approve trigger
DROP TRIGGER IF EXISTS auto_approve_transfers_trigger ON transactions;

CREATE TRIGGER auto_approve_transfers_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_transfers();