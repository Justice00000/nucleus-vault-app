import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, DollarSign } from 'lucide-react';

interface TransactionFormProps {
  onSuccess: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit');
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    externalAccountName: '',
    externalAccountNumber: '',
    externalRoutingNumber: '',
    recipientAccountNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (amount > 10000) {
      toast({
        title: "Amount Too Large", 
        description: "Maximum transaction amount is $10,000",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First get the user's account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id, balance')
        .eq('user_id', user.id)
        .single();

      if (accountError) throw accountError;

      // Check if user has sufficient balance for withdrawal or transfer
      if ((transactionType === 'withdrawal' || transactionType === 'transfer') && account.balance < amount) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough balance for this transaction",
          variant: "destructive"
        });
        return;
      }

      // For transfers, verify recipient account exists
      if (transactionType === 'transfer') {
        const { data: recipientAccount, error: recipientError } = await supabase
          .from('accounts')
          .select('id, user_id')
          .eq('account_number', formData.recipientAccountNumber)
          .maybeSingle();

        if (recipientError) throw recipientError;
        
        if (!recipientAccount) {
          toast({
            title: "Invalid Account Number",
            description: "The recipient account number does not exist",
            variant: "destructive"
          });
          return;
        }

        if (recipientAccount.user_id === user.id) {
          toast({
            title: "Invalid Transfer",
            description: "You cannot transfer to your own account",
            variant: "destructive"
          });
          return;
        }
      }

      // Create the transaction
      const transactionData = {
        account_id: account.id,
        user_id: user.id,
        type: transactionType,
        amount: amount,
        description: formData.description,
        status: 'pending' as const
      };

      // Add external account details for deposits/withdrawals or recipient for transfers
      if (transactionType === 'transfer') {
        Object.assign(transactionData, {
          external_account_number: formData.recipientAccountNumber,
          external_account_name: 'Internal Transfer'
        });
      } else {
        Object.assign(transactionData, {
          external_account_name: formData.externalAccountName,
          external_account_number: formData.externalAccountNumber,
          external_routing_number: formData.externalRoutingNumber
        });
      }

      const { error } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (error) throw error;

      const actionText = transactionType === 'transfer' ? 'transfer' : `${transactionType} request`;
      toast({
        title: "Request Submitted",
        description: `Your ${actionText} has been submitted${transactionType === 'transfer' ? ' and will be processed immediately' : ' and is pending approval'}.`
      });

      // Reset form
      setFormData({
        amount: '',
        description: '',
        externalAccountName: '',
        externalAccountNumber: '',
        externalRoutingNumber: '',
        recipientAccountNumber: ''
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit transaction request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Transaction Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Transaction Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant={transactionType === 'deposit' ? 'default' : 'outline'}
              onClick={() => setTransactionType('deposit')}
              className="h-20 flex-col space-y-2"
            >
              <ArrowDownLeft className="w-6 h-6" />
              <span className="text-xs">Deposit</span>
            </Button>
            <Button
              type="button"
              variant={transactionType === 'withdrawal' ? 'default' : 'outline'}
              onClick={() => setTransactionType('withdrawal')}
              className="h-20 flex-col space-y-2"
            >
              <ArrowUpRight className="w-6 h-6" />
              <span className="text-xs">Withdrawal</span>
            </Button>
            <Button
              type="button"
              variant={transactionType === 'transfer' ? 'default' : 'outline'}
              onClick={() => setTransactionType('transfer')}
              className="h-20 flex-col space-y-2"
            >
              <ArrowRightLeft className="w-6 h-6" />
              <span className="text-xs">Transfer</span>
            </Button>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">
              {transactionType === 'deposit' && 'Deposit Funds'}
              {transactionType === 'withdrawal' && 'Withdraw Funds'}
              {transactionType === 'transfer' && 'Transfer to User'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {transactionType === 'deposit' && 'Transfer money from your external bank account to your FinTech Pro account.'}
              {transactionType === 'withdrawal' && 'Transfer money from your FinTech Pro account to your external bank account.'}
              {transactionType === 'transfer' && 'Transfer money to another FinTech Pro user instantly using their account number.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>
              {transactionType === 'deposit' && 'Deposit Request'}
              {transactionType === 'withdrawal' && 'Withdrawal Request'}
              {transactionType === 'transfer' && 'Transfer Money'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="10000"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum: $10,000 per transaction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a note for this transaction..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {transactionType === 'transfer' ? (
              <div className="space-y-4">
                <h4 className="font-medium text-sm">
                  Recipient Details
                </h4>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientAccount">Recipient Account Number</Label>
                  <Input
                    id="recipientAccount"
                    placeholder="Enter recipient's account number"
                    value={formData.recipientAccountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientAccountNumber: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the account number of another FinTech Pro user
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium text-sm">
                  External Bank Account Details
                </h4>
                
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Holder Name</Label>
                  <Input
                    id="accountName"
                    placeholder="John Doe"
                    value={formData.externalAccountName}
                    onChange={(e) => setFormData(prev => ({ ...prev, externalAccountName: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="1234567890"
                    value={formData.externalAccountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, externalAccountNumber: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    placeholder="123456789"
                    maxLength={9}
                    value={formData.externalRoutingNumber}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      externalRoutingNumber: e.target.value.replace(/\D/g, '') 
                    }))}
                    required
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Submitting...' 
                : transactionType === 'transfer' 
                  ? 'Transfer Money'
                  : `Submit ${transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'} Request`
              }
            </Button>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Important:</strong> 
                {transactionType === 'transfer' 
                  ? ' Transfers between FinTech Pro users are processed instantly once submitted.'
                  : ' All deposit and withdrawal requests are reviewed by our team for security purposes. You will receive an email notification once your request is processed (typically within 1-2 business days).'
                }
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}