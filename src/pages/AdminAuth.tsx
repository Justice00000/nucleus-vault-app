import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Shield, Lock } from 'lucide-react';

export default function AdminAuth() {
  const { user, profile, signIn, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Redirect if already logged in as admin
  if (user && profile && profile.is_admin && !isLoading) {
    return <Navigate to="/admin" replace />;
  }

  // Redirect if logged in but not admin
  if (user && profile && !profile.is_admin && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    setIsSubmitting(false);
    
    // Navigation will be handled by the redirect logic above
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-fintech-text">Admin Portal</h1>
            <p className="text-fintech-muted mt-2">Administrative Access Only</p>
          </div>
          
          {/* Security indicator */}
          <div className="flex justify-center items-center space-x-2 text-xs text-fintech-muted">
            <Lock className="w-3 h-3" />
            <span>Restricted Access</span>
          </div>
        </div>

        <Card className="border-red-200 bg-fintech-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl">Administrator Sign In</CardTitle>
            <CardDescription>
              Enter your administrator credentials to access the admin portal
            </CardDescription>
            
            <form onSubmit={handleLogin} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@company.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Access Admin Portal'}
              </Button>
            </form>
          </CardHeader>
        </Card>
        
        {/* Back to regular login */}
        <div className="text-center">
          <Link 
            to="/auth" 
            className="text-sm text-fintech-muted hover:text-fintech-text transition-colors"
          >
            Back to customer login
          </Link>
        </div>
      </div>
    </div>
  );
}