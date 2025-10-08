import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KYCUpload } from '@/components/KYCUpload';
import { CheckCircle, Clock } from 'lucide-react';

export default function KYCSubmission() {
  const { user, profile, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  // Allow access even if not logged in - they need to submit KYC to get account
  // If they're logged in but not approved, they can still access this page

  // Redirect to dashboard if KYC is approved and user is logged in
  if (user && profile?.kyc_status === 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  // Show pending review message if documents are submitted (only for logged in users)
  if (user && profile?.kyc_status === 'pending') {
    return (
      <div className="min-h-screen bg-fintech-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-warning rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-warning-foreground" />
            </div>
            <CardTitle className="text-xl">Documents Under Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Thank you for submitting your documents! Your KYC verification is currently being reviewed by our team. 
              You'll receive an email notification once your documents are approved and you can access your account.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium">What happens next?</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 text-left">
                <li>• Our team reviews your documents (usually within 24-48 hours)</li>
                <li>• You'll receive an email with the verification status</li>
                <li>• Once approved, you can access your account</li>
              </ul>
            </div>
            <Button variant="outline" onClick={signOut} className="w-full mt-4">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show rejected message (only for logged in users)
  if (user && profile?.kyc_status === 'rejected') {
    return (
      <div className="min-h-screen bg-fintech-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-xl text-destructive">Verification Declined</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Unfortunately, your KYC verification was declined. Please contact support for more information.
            </p>
            <Button variant="outline" onClick={signOut} className="w-full mt-4">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show KYC upload form for 'not_started' status
  return (
    <div className="min-h-screen bg-fintech-bg">
      {/* Header with Sign In link */}
      {!user && (
        <nav className="bg-white border-b border-fintech-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-fintech-text">Account Verification</h1>
              </div>
              <Button variant="default" size="sm" asChild>
                <a href="/auth">Sign In to Upload</a>
              </Button>
            </div>
          </div>
        </nav>
      )}
      
      <div className="max-w-6xl mx-auto p-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              Complete Your Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Before you can access your account, we need to verify your identity. Please upload the required documents below.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Why do we need this?</p>
              <p className="text-sm text-muted-foreground">
                Federal regulations require us to verify the identity of all our customers. This helps us protect your account and prevent fraud.
              </p>
            </div>
          </CardContent>
        </Card>

        <KYCUpload />

        {user && (
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
