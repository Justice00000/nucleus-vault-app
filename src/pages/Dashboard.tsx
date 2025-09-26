import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft,
  ArrowRightLeft, 
  Clock, 
  Eye, 
  EyeOff, 
  CreditCard,
  FileText,
  Bell,
  Upload,
  Menu,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TransactionForm } from '@/components/TransactionForm';
import { KYCUpload } from '@/components/KYCUpload';

interface Account {
  id: string;
  account_number: string;
  balance: number;
  account_type: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  status: 'pending' | 'approved' | 'declined' | 'delayed';
  description: string;
  created_at: string;
  external_account_number?: string;
  external_account_name?: string;
}

export default function Dashboard() {
  const { user, profile, signOut, isLoading } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAccount();
      fetchTransactions();
    }
  }, [user]);

  // Redirect to auth if not logged in
  if (!user && !isLoading) {
    return <Navigate to="/auth" replace />;
  }

  // Show pending approval message
  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-fintech-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-warning rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-warning-foreground" />
            </div>
            <CardTitle className="text-xl">Account Under Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Thank you for applying! Your account is currently being reviewed by our team. 
              You'll receive an email notification once your account is approved.
            </p>
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              Pending Admin Approval
            </Badge>
            <Button variant="outline" onClick={signOut} className="w-full mt-4">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show declined message
  if (profile?.status === 'declined') {
    return (
      <div className="min-h-screen bg-fintech-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-xl text-destructive">Account Application Declined</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Unfortunately, we were unable to approve your account application at this time. 
              Please contact our support team for more information.
            </p>
            <Button variant="outline" onClick={signOut} className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      
      if (error) throw error;
      setAccount(data);
    } catch (error) {
      console.error('Error fetching account:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'declined': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'delayed': return 'bg-muted/10 text-muted-foreground border-muted/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-fintech-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fintech-bg">
      {/* Header */}
      <header className="bg-white border-b border-fintech-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-fintech-text">Community Reserve</h1>
              {!isHeaderCollapsed && (
                <p className="text-sm text-fintech-muted">
                  Welcome back, {profile?.first_name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle Button */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                className="p-2"
              >
                {isHeaderCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              
              {/* Mobile Menu Button */}
              <div className="sm:hidden">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                  className="p-2"
                >
                  {isHeaderCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </Button>
              </div>
              
              {/* Desktop Navigation - Always visible */}
              <div className="hidden sm:flex items-center gap-2">
                {profile?.is_admin && (
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin'}>
                    Admin Panel
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/settings'}>
                  Settings
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
          
          {/* Collapsible Mobile Navigation */}
          <div className={`sm:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isHeaderCollapsed ? 'max-h-0 opacity-0' : 'max-h-48 opacity-100 pb-4'
          }`}>
            <div className="flex flex-col gap-2 pt-2 border-t border-fintech-border">
              {profile?.is_admin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/admin'}
                  className="justify-start"
                >
                  Admin Panel
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/settings'}
                className="justify-start"
              >
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="justify-start"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Account Balance */}
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-primary-foreground/80 text-sm">Available Balance</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-3xl font-bold">
                      {showBalance ? formatCurrency(account?.balance || 0) : '••••••'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBalance(!showBalance)}
                      className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <CreditCard className="w-8 h-8 text-primary-foreground/80" />
              </div>
              <div className="space-y-1">
                <p className="text-primary-foreground/80 text-sm">Account Number</p>
                <p className="font-mono text-sm">{account?.account_number}</p>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
              <TabsTrigger value="transfer" className="text-xs sm:text-sm">Money</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                    <ArrowDownLeft className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {formatCurrency(
                        transactions
                          .filter(t => t.type === 'deposit' && t.status === 'approved')
                          .reduce((sum, t) => sum + Number(t.amount), 0)
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        transactions
                          .filter(t => t.type === 'transfer' && t.status === 'approved')
                          .reduce((sum, t) => sum + Number(t.amount), 0)
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                    <Clock className="h-4 w-4 text-warning" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">
                      {transactions.filter(t => t.status === 'pending').length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No transactions yet. Start by making a deposit or transfer.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {transaction.type === 'deposit' ? (
                              <ArrowDownLeft className="w-5 h-5 text-success" />
                            ) : (
                              <ArrowRightLeft className="w-5 h-5 text-primary" />
                            )}
                            <div>
                              <p className="font-medium capitalize">{transaction.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.type === 'transfer' 
                                  ? `To: ${transaction.external_account_number}`
                                  : formatDate(transaction.created_at)
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${
                              transaction.type === 'deposit' 
                                ? 'text-success' 
                                : 'text-primary'
                            }`}>
                              {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                            </p>
                            <Badge variant="outline" className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No transactions found.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            {transaction.type === 'deposit' ? (
                              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                                <ArrowDownLeft className="w-5 h-5 text-success" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <ArrowRightLeft className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium capitalize">{transaction.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.type === 'transfer' 
                                  ? `To Account: ${transaction.external_account_number}`
                                  : transaction.description || 'No description'
                                }
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(transaction.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${
                              transaction.type === 'deposit' 
                                ? 'text-success' 
                                : 'text-primary'
                            }`}>
                              {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                            </p>
                            <Badge variant="outline" className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transfer Tab */}
            <TabsContent value="transfer" className="space-y-6">
              <TransactionForm onSuccess={() => {
                fetchAccount();
                fetchTransactions();
              }} />
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <KYCUpload />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}