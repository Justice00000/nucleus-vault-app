import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Building2, Shield, Users } from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function Auth() {
  const { user, signIn, signUp, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    ssnLast4: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Redirect if already logged in
  if (user && !isLoading) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    setIsSubmitting(false);
    
    if (!error) {
      // Navigation will be handled by the auth context
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (signupForm.password !== signupForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (signupForm.password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    
    if (signupForm.ssnLast4.length !== 4) {
      alert('Please enter the last 4 digits of your SSN');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(signupForm.email, signupForm.password, {
      first_name: signupForm.firstName,
      last_name: signupForm.lastName,
      phone: signupForm.phone,
      date_of_birth: signupForm.dateOfBirth,
      ssn_last_4: signupForm.ssnLast4,
      address_line_1: signupForm.addressLine1,
      address_line_2: signupForm.addressLine2,
      city: signupForm.city,
      state: signupForm.state,
      zip_code: signupForm.zipCode
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fintech-bg to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-fintech-text">Community Reserve</h1>
            <p className="text-fintech-muted mt-2">Secure Digital Banking Platform</p>
          </div>
          
          {/* Trust indicators */}
          <div className="flex justify-center items-center space-x-6 text-xs text-fintech-muted">
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Bank-Grade Security</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>FDIC Insured</span>
            </div>
          </div>
        </div>

        <Card className="border-fintech-border bg-fintech-card">
          <CardHeader className="space-y-1 pb-4">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Open Account</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login" className="mt-6">
                <CardTitle className="text-2xl">Welcome back</CardTitle>
                <CardDescription>
                  Sign in to access your account
                </CardDescription>
                
                <form onSubmit={handleLogin} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
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
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-6">
                <CardTitle className="text-2xl">Open your account</CardTitle>
                <CardDescription>
                  Join thousands who trust us with their finances
                </CardDescription>
                
                <form onSubmit={handleSignup} className="space-y-4 mt-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-fintech-text">Personal Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          placeholder="First name"
                          value={signupForm.firstName}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          placeholder="Last name"
                          value={signupForm.lastName}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Email address</Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder="your.email@example.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={signupForm.phone}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={signupForm.dateOfBirth}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ssn">Last 4 digits of SSN</Label>
                      <Input
                        id="ssn"
                        placeholder="1234"
                        maxLength={4}
                        value={signupForm.ssnLast4}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, ssnLast4: e.target.value.replace(/\D/g, '') }))}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-fintech-text">Address Information</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address1">Street address</Label>
                      <Input
                        id="address1"
                        placeholder="123 Main Street"
                        value={signupForm.addressLine1}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address2">Apt, suite, etc. (optional)</Label>
                      <Input
                        id="address2"
                        placeholder="Apt 4B"
                        value={signupForm.addressLine2}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="New York"
                          value={signupForm.city}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, city: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Select
                          value={signupForm.state}
                          onValueChange={(value) => setSignupForm(prev => ({ ...prev, state: value }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map(state => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP code</Label>
                      <Input
                        id="zip"
                        placeholder="10001"
                        maxLength={5}
                        value={signupForm.zipCode}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, '') }))}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Security */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-fintech-text">Account Security</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Create password</Label>
                      <div className="relative">
                        <Input
                          id="signupPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
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
                      <p className="text-xs text-fintech-muted">Must be at least 8 characters</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating account...' : 'Open my account'}
                  </Button>
                  
                  <p className="text-xs text-fintech-muted text-center">
                    By creating an account, you agree to our Terms of Service and Privacy Policy. 
                    Your account will be reviewed and approved within 1-2 business days.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}