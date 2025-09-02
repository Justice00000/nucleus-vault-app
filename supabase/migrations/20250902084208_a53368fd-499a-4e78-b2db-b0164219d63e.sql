-- Create function to update account balances when transactions are processed
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update balances
CREATE TRIGGER transaction_balance_update
    AFTER UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

-- Add transfer type to transaction_type enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type' AND typelem = 0) THEN
        CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'transfer');
    ELSE
        -- Add transfer to existing enum if it doesn't exist
        BEGIN
            ALTER TYPE transaction_type ADD VALUE 'transfer';
        EXCEPTION 
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;