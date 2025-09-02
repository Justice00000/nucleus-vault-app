-- Fix function security issues by setting proper search path
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    target_account_id uuid;
BEGIN
    -- Only update balance when status changes to 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Handle deposits (add to balance)
        IF NEW.type = 'deposit' THEN
            UPDATE accounts 
            SET balance = balance + NEW.amount 
            WHERE id = NEW.account_id;
        
        -- Handle withdrawals (subtract from balance)
        ELSIF NEW.type = 'withdrawal' THEN
            UPDATE accounts 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
        
        -- Handle transfers (subtract from sender, add to recipient)
        ELSIF NEW.type = 'transfer' THEN
            -- Update sender's account (subtract amount)
            UPDATE accounts 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
            
            -- Find recipient account by account number and update (add amount)
            SELECT id INTO target_account_id 
            FROM accounts 
            WHERE account_number = NEW.external_account_number;
            
            IF target_account_id IS NOT NULL THEN
                UPDATE accounts 
                SET balance = balance + NEW.amount 
                WHERE id = target_account_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;