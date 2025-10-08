import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KYCUpload } from '@/components/KYCUpload';
import { CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function KYCSubmission() {
  const { user, profile, signUp, signOut } = useAuth();
  const { toast } = useToast();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    ssnLast4: '',
    addressLine1: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Redirect to dashboard if KYC is approved and user is logged in
  if (user && profile?.kyc_status === 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth,
          ssn_last_4: formData.ssnLast4,
          address_line_1: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
        }
      );

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account, then return here to upload your KYC documents.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  };

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

  // Show signup form if not logged in, otherwise show KYC upload
  if (!user) {
    return (
      <div className="min-h-screen bg-fintech-bg">
        <nav className="bg-white border-b border-fintech-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-fintech-text">Open Your Account</h1>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/auth">Already have an account? Sign In</a>
              </Button>
            </div>
          </div>
        </nav>
        
        <div className="max-w-2xl mx-auto p-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <p className="text-muted-foreground">
                Fill in your details to get started. After creating your account, you'll be able to upload your verification documents.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ssnLast4">Last 4 Digits of SSN *</Label>
                  <Input
                    id="ssnLast4"
                    maxLength={4}
                    required
                    value={formData.ssnLast4}
                    onChange={(e) => setFormData({ ...formData, ssnLast4: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address *</Label>
                  <Input
                    id="addressLine1"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      required
                      maxLength={2}
                      placeholder="CA"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      required
                      maxLength={5}
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSigningUp}>
                  {isSigningUp ? 'Creating Account...' : 'Create Account & Continue to Document Upload'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show KYC upload form for logged in users
  return (
    <div className="min-h-screen bg-fintech-bg">
      <nav className="bg-white border-b border-fintech-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-fintech-text">Account Verification</h1>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>
      
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
              Please upload the required documents below to verify your identity and activate your account.
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
      </div>
    </div>
  );
}
