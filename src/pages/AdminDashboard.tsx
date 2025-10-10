import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  CreditCard, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Eye,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: 'pending' | 'approved' | 'declined' | 'deactivated';
  kyc_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  status: 'pending' | 'approved' | 'declined' | 'delayed';
  description: string;
  external_account_name: string;
  external_account_number: string;
  external_routing_number: string;
  created_at: string;
  profiles?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    date_of_birth?: string;
    ssn_last_4?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
}

export default function AdminDashboard() {
  const { user, profile, signOut, isLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kycDocuments, setKYCDocuments] = useState<KYCDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user && profile?.is_admin) {
      fetchUsers();
      fetchTransactions();
      fetchKYCDocuments();
    }
  }, [user, profile]);

  // Redirect if not admin
  if (!user && !isLoading) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile?.is_admin && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get user profiles for transactions
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(t => t.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, first_name, last_name')
          .in('user_id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const transactionsWithProfiles = data.map(transaction => ({
          ...transaction,
          profiles: profileMap.get(transaction.user_id)
        }));
        
        setTransactions(transactionsWithProfiles || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchKYCDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get full user profiles for KYC documents including all signup data
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(d => d.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const documentsWithProfiles = data.map(doc => ({
          ...doc,
          profiles: profileMap.get(doc.user_id)
        }));
        
        setKYCDocuments(documentsWithProfiles || []);
      } else {
        setKYCDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
    }
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'declined' | 'deactivated') => {
    try {
      console.log('Attempting to update user:', userId, 'to status:', status);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('user_id', userId)
        .select();

      console.log('Update result:', { data, error });

      if (error) throw error;

      // Send email notification
      const userProfile = data?.[0];
      if (userProfile?.email) {
        try {
          await supabase.functions.invoke('send-admin-notification', {
            body: {
              user_email: userProfile.email,
              subject: `Account Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
              message: `Your account status has been updated to "${status}". ${
                status === 'approved' 
                  ? 'You can now access all banking features.' 
                  : status === 'declined'
                  ? 'Please contact support for more information.'
                  : 'Your account has been temporarily deactivated.'
              }`,
              action_type: 'user_status',
              details: { status, updated_by: profile?.email }
            }
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }

      toast({
        title: "User Status Updated",
        description: `User status changed to ${status}`
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: 'approved' | 'declined' | 'delayed') => {
    try {
      const notes = adminNotes[transactionId];
      
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status,
          admin_notes: notes,
          processed_by: user!.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      // Send detailed email notification
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction?.profiles?.email) {
        try {
          // Get account details
          const { data: accountData } = await supabase
            .from('accounts')
            .select('account_number')
            .eq('user_id', transaction.user_id)
            .single();

          // Send transaction notification email
          await supabase.functions.invoke('send-transaction-notification', {
            body: {
              user_email: transaction.profiles.email,
              user_name: `${transaction.profiles.first_name} ${transaction.profiles.last_name}`,
              transaction_type: transaction.type,
              amount: Number(transaction.amount),
              status,
              description: transaction.description || notes,
              account_number: accountData?.account_number,
              external_account: transaction.external_account_number 
                ? `${transaction.external_account_name || ''} (${transaction.external_account_number})`
                : undefined,
              transaction_id: transactionId,
            }
          });

          // Also send in-app notification
          await supabase.functions.invoke('send-admin-notification', {
            body: {
              user_email: transaction.profiles.email,
              subject: `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)} - ${formatCurrency(transaction.amount)}`,
              message: `Your ${transaction.type} transaction of ${formatCurrency(transaction.amount)} has been ${status}.${
                notes ? ` Admin notes: ${notes}` : ''
              }${
                status === 'approved' 
                  ? ' The funds should be reflected in your account shortly.' 
                  : status === 'declined'
                  ? ' Please contact support if you have questions.'
                  : ' There may be a delay in processing. We\'ll update you soon.'
              }`,
              action_type: 'transaction',
              details: { 
                transaction_id: transactionId,
                amount: transaction.amount,
                type: transaction.type,
                status,
                notes,
                processed_by: profile?.email 
              }
            }
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }

      toast({
        title: "Transaction Updated",
        description: `Transaction ${status}`
      });

      setAdminNotes(prev => ({ ...prev, [transactionId]: '' }));
      fetchTransactions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateKYCStatus = async (docId: string, status: 'approved' | 'rejected', customNotes?: string) => {
    try {
      const notes = customNotes || adminNotes[docId];

      const { error } = await supabase
        .from('kyc_documents')
        .update({ 
          status,
          notes,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;

      const kycDoc = kycDocuments.find(d => d.id === docId);
      
      // Check if all required documents are approved
      if (status === 'approved' && kycDoc) {
        const { data: userDocs } = await supabase
          .from('kyc_documents')
          .select('status, document_type')
          .eq('user_id', kycDoc.user_id);

        // Check if user has at least one approved government ID (drivers_license or passport)
        const hasApprovedID = userDocs?.some(doc => 
          (doc.document_type === 'drivers_license' || doc.document_type === 'passport') && 
          doc.status === 'approved'
        );

        // If this approval completes KYC, update profile status
        if (hasApprovedID) {
          await supabase
            .from('profiles')
            .update({ kyc_status: 'approved' })
            .eq('user_id', kycDoc.user_id);
        }
      }

      // If rejecting and this is a required document, update profile status
      if (status === 'rejected' && kycDoc) {
        if (kycDoc.document_type === 'drivers_license' || kycDoc.document_type === 'passport') {
          await supabase
            .from('profiles')
            .update({ kyc_status: 'rejected' })
            .eq('user_id', kycDoc.user_id);
        }
      }

      // Send email notification using the new KYC notification function
      if (kycDoc?.profiles?.email) {
        try {
          await supabase.functions.invoke('send-kyc-notification', {
            body: {
              user_email: kycDoc.profiles.email,
              user_name: `${kycDoc.profiles.first_name} ${kycDoc.profiles.last_name}`,
              status: status === 'approved' ? 'approved' : 'rejected',
              message: status === 'approved' 
                ? 'Congratulations! Your account is now fully activated and you can access all banking features.'
                : undefined,
              rejection_reason: status === 'rejected' && notes ? notes : 'Please ensure your documents are clear, valid, and match your account information.'
            }
          });

          // Also send in-app notification
          await supabase.functions.invoke('send-admin-notification', {
            body: {
              user_email: kycDoc.profiles.email,
              subject: `KYC Document ${status.charAt(0).toUpperCase() + status.slice(1)} - ${kycDoc.document_type}`,
              message: `Your KYC document (${kycDoc.document_type}) has been ${status}.${
                notes ? ` Review notes: ${notes}` : ''
              }${
                status === 'approved' 
                  ? ' Your account verification is now complete.' 
                  : ' Please review the feedback and resubmit if necessary.'
              }`,
              action_type: 'kyc',
              details: { 
                document_id: docId,
                document_type: kycDoc.document_type,
                status,
                notes,
                reviewed_by: profile?.email 
              }
            }
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }

      toast({
        title: "KYC Document Updated",
        description: `Document ${status}`
      });

      setAdminNotes(prev => ({ ...prev, [docId]: '' }));
      fetchKYCDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'declined':
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'delayed': return 'bg-muted/10 text-muted-foreground border-muted/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
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
      <header className="bg-white border-b border-fintech-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-fintech-text">Admin Dashboard</h1>
              <p className="text-sm text-fintech-muted">
                Manage users, transactions, and KYC documents
              </p>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>
                <span className="hidden sm:inline">User View</span>
                <span className="sm:hidden">User</span>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Users</p>
                  <p className="text-2xl font-bold text-warning">
                    {users.filter(u => u.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Transactions</p>
                  <p className="text-2xl font-bold text-warning">
                    {transactions.filter(t => t.status === 'pending').length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending KYC</p>
                  <p className="text-2xl font-bold text-warning">
                    {kycDocuments.filter(k => k.status === 'pending').length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
            <TabsTrigger value="kyc" className="text-xs sm:text-sm">KYC Docs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Pending Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.filter(t => t.status === 'pending').slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{transaction.profiles?.first_name} {transaction.profiles?.last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.type} • {formatCurrency(Number(transaction.amount))}
                        </p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent User Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users
                    .filter(user => 
                      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium">{user.first_name} {user.last_name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Registered: {formatDate(user.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <Badge variant="outline" className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              KYC: {user.kyc_status}
                            </p>
                          </div>
                          {user.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updateUserStatus(user.id, 'approved')}
                                className="bg-success hover:bg-success/90"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateUserStatus(user.id, 'declined')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {transactions
                    .filter(t => t.status === 'pending')
                    .map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">
                                {transaction.profiles?.first_name} {transaction.profiles?.last_name}
                              </h4>
                              <Badge variant="outline" className={getStatusColor(transaction.type)}>
                                {transaction.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{transaction.profiles?.email}</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(Number(transaction.amount))}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)}
                            </p>
                            {transaction.description && (
                              <p className="text-sm">{transaction.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Account Name:</p>
                            <p className="text-muted-foreground">{transaction.external_account_name}</p>
                          </div>
                          <div>
                            <p className="font-medium">Account Number:</p>
                            <p className="text-muted-foreground font-mono">
                              •••• •••• •••• {transaction.external_account_number?.slice(-4)}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Routing Number:</p>
                            <p className="text-muted-foreground font-mono">{transaction.external_routing_number}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Textarea
                            placeholder="Add admin notes..."
                            value={adminNotes[transaction.id] || ''}
                            onChange={(e) => setAdminNotes(prev => ({ 
                              ...prev, 
                              [transaction.id]: e.target.value 
                            }))}
                            rows={2}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            onClick={() => updateTransactionStatus(transaction.id, 'approved')}
                            className="bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => updateTransactionStatus(transaction.id, 'delayed')}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Delay
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => updateTransactionStatus(transaction.id, 'declined')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Documents Tab */}
          <TabsContent value="kyc" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>KYC Document Review</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and approve user verification documents. All user signup information is included. You can change status even after approval.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Group documents by user */}
                  {(() => {
                    const allDocs = kycDocuments; // Show all documents, not just pending
                    const userGroups = allDocs.reduce((acc, doc) => {
                      const userId = doc.user_id;
                      if (!acc[userId]) {
                        acc[userId] = [];
                      }
                      acc[userId].push(doc);
                      return acc;
                    }, {} as Record<string, typeof kycDocuments>);

                    return Object.entries(userGroups).map(([userId, userDocs]) => {
                      const userProfile = userDocs[0]?.profiles;
                      const hasPending = userDocs.some(doc => doc.status === 'pending');
                      const hasApproved = userDocs.some(doc => doc.status === 'approved');
                      const hasRejected = userDocs.some(doc => doc.status === 'rejected');
                      
                      return (
                        <div key={userId} className="border-2 rounded-lg p-6 space-y-4 bg-card">
                          {/* User Header */}
                          <div className="border-b pb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-semibold">
                                  {userProfile?.first_name} {userProfile?.last_name}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {userDocs.length} document{userDocs.length !== 1 ? 's' : ''} • 
                                  {hasPending && ' Pending'}{hasApproved && ' Approved'}{hasRejected && ' Rejected'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {hasPending && (
                                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                                    Pending
                                  </Badge>
                                )}
                                {hasApproved && (
                                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                    Approved
                                  </Badge>
                                )}
                                {hasRejected && (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                    Rejected
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* User Profile Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-sm bg-muted/30 p-4 rounded-lg">
                              <div>
                                <span className="font-medium text-muted-foreground">Email:</span>
                                <p className="text-foreground">{userProfile?.email}</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Phone:</span>
                                <p className="text-foreground">{userProfile?.phone || 'Not provided'}</p>
                              </div>
                              {userProfile?.date_of_birth && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Date of Birth:</span>
                                  <p className="text-foreground">{new Date(userProfile.date_of_birth).toLocaleDateString()}</p>
                                </div>
                              )}
                              {userProfile?.ssn_last_4 && (
                                <div>
                                  <span className="font-medium text-muted-foreground">SSN (Last 4):</span>
                                  <p className="text-foreground">***-**-{userProfile.ssn_last_4}</p>
                                </div>
                              )}
                              {userProfile?.address_line_1 && (
                                <div className="md:col-span-2 lg:col-span-3">
                                  <span className="font-medium text-muted-foreground">Address:</span>
                                  <p className="text-foreground">
                                    {userProfile.address_line_1}
                                    {userProfile.address_line_2 && `, ${userProfile.address_line_2}`}
                                    <br />
                                    {userProfile.city}, {userProfile.state} {userProfile.zip_code}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* User's Documents */}
                          <div className="space-y-4">
                            {userDocs.map((doc) => (
                              <div key={doc.id} className="border rounded-lg p-4 space-y-3 bg-background">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="w-4 h-4 text-primary" />
                                      <span className="font-medium">
                                        {doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {doc.status}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Uploaded: {formatDate(doc.created_at)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const { data, error } = await supabase.storage
                                          .from('kyc-documents')
                                          .download(doc.file_path);
                                        
                                        if (error) throw error;
                                        
                                        const url = URL.createObjectURL(data);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = doc.file_name;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                        
                                        toast({
                                          title: "Download Started",
                                          description: "Document is being downloaded"
                                        });
                                      } catch (error: any) {
                                        toast({
                                          title: "Download Failed",
                                          description: error.message,
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Review Actions for All User's Documents */}
                          <div className="border-t pt-4 space-y-3">
                            <Textarea
                              placeholder="Add review notes for this user..."
                              value={adminNotes[userId] || ''}
                              onChange={(e) => setAdminNotes(prev => ({ 
                                ...prev, 
                                [userId]: e.target.value 
                              }))}
                              rows={3}
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={async () => {
                                  // Approve all user's documents
                                  for (const doc of userDocs) {
                                    await updateKYCStatus(doc.id, 'approved', adminNotes[userId]);
                                  }
                                }}
                                className="bg-success hover:bg-success/90"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve All
                              </Button>
                              <Button
                                variant="outline"
                                onClick={async () => {
                                  // Set all user's documents to pending
                                  for (const doc of userDocs) {
                                    const { error } = await supabase
                                      .from('kyc_documents')
                                      .update({ 
                                        status: 'pending',
                                        notes: adminNotes[userId] || 'Status changed to pending for re-review',
                                        reviewed_by: user!.id,
                                        reviewed_at: new Date().toISOString()
                                      })
                                      .eq('id', doc.id);
                                    
                                    if (!error) {
                                      // Update profile status to pending
                                      await supabase
                                        .from('profiles')
                                        .update({ kyc_status: 'pending' })
                                        .eq('user_id', doc.user_id);
                                    }
                                  }
                                  toast({
                                    title: "Status Updated",
                                    description: "All documents set to pending for re-review"
                                  });
                                  fetchKYCDocuments();
                                }}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Set to Pending
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={async () => {
                                  // Reject all user's documents
                                  for (const doc of userDocs) {
                                    await updateKYCStatus(doc.id, 'rejected', adminNotes[userId]);
                                  }
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject All
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {kycDocuments.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No KYC documents to review</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}