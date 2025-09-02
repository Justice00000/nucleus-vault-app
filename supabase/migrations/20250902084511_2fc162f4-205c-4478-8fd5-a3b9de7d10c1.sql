-- Auto-approve transfer transactions when they are created
CREATE OR REPLACE FUNCTION auto_approve_transfers()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a transfer transaction, automatically approve it
    IF NEW.type = 'transfer' THEN
        NEW.status = 'approved';
        NEW.processed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger to auto-approve transfers on insert
CREATE TRIGGER auto_approve_transfers_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    WHEN (NEW.type = 'transfer')
    EXECUTE FUNCTION auto_approve_transfers();