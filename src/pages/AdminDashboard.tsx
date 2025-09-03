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
      
      // Get user profiles for KYC documents
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(d => d.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, first_name, last_name')
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

      // Send email notification
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction?.profiles?.email) {
        try {
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

  const updateKYCStatus = async (docId: string, status: 'approved' | 'rejected') => {
    try {
      const notes = adminNotes[docId];

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

      // Send email notification
      const kycDoc = kycDocuments.find(d => d.id === docId);
      if (kycDoc?.profiles?.email) {
        try {
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
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-fintech-text">Admin Dashboard</h1>
              <p className="text-sm text-fintech-muted">
                Manage users, transactions, and KYC documents
              </p>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                User View
              </Button>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {kycDocuments
                    .filter(doc => doc.status === 'pending')
                    .map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">
                                {doc.profiles?.first_name} {doc.profiles?.last_name}
                              </h4>
                              <Badge variant="outline">
                                {doc.document_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{doc.profiles?.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded: {formatDate(doc.created_at)}
                            </p>
                            <p className="text-sm font-medium">{doc.file_name}</p>
                          </div>
                          <Badge variant="outline" className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <Textarea
                            placeholder="Add review notes..."
                            value={adminNotes[doc.id] || ''}
                            onChange={(e) => setAdminNotes(prev => ({ 
                              ...prev, 
                              [doc.id]: e.target.value 
                            }))}
                            rows={2}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            onClick={() => updateKYCStatus(doc.id, 'approved')}
                            className="bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => updateKYCStatus(doc.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}