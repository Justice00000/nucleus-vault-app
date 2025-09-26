import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building2, 
  Shield, 
  Users, 
  Smartphone, 
  CreditCard, 
  TrendingUp,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const Index = () => {
  const { user, isLoading } = useAuth();

  // Redirect to dashboard if already logged in
  if (user && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-fintech-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Your money and data are protected with military-grade encryption and security protocols."
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Manage your finances on the go with our intuitive mobile-first platform."
    },
    {
      icon: TrendingUp,
      title: "Smart Savings",
      description: "Grow your wealth with competitive interest rates and intelligent savings tools."
    },
    {
      icon: Users,
      title: "24/7 Support",
      description: "Get help whenever you need it with our round-the-clock customer support team."
    }
  ];

  const benefits = [
    "No monthly fees or minimum balance requirements",
    "Instant transfers and real-time notifications",
    "FDIC insured up to $250,000",
    "Advanced budgeting and spending insights",
    "High-yield savings accounts",
    "Seamless bill pay and money transfers"
  ];

  return (
    <div className="min-h-screen bg-fintech-bg">
      {/* Navigation */}
      <nav className="bg-white border-b border-fintech-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-fintech-text">Community Reserve</h1>
            </div>
            <div className="flex space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                <a href="/auth">Sign In</a>
              </Button>
              <Button size="sm" className="text-xs sm:text-sm" asChild>
                <a href="/auth">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-fintech-text">
                Banking Made
                <span className="text-primary block">Simple & Secure</span>
              </h2>
              <p className="text-xl text-fintech-muted max-w-3xl mx-auto">
                Experience the future of digital banking with Community Reserve. 
                Manage your money effortlessly with our cutting-edge platform 
                designed for the modern financial lifestyle.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-fintech-muted">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="text-xs sm:text-sm font-medium">FDIC Insured</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="text-xs sm:text-sm font-medium">500K+ Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="text-xs sm:text-sm font-medium">A+ Security Rating</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-4" asChild>
                <a href="/auth" className="flex items-center space-x-2">
                  <span>Open Your Account</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4" asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </div>

            <p className="text-sm text-fintech-muted">
              Get started in under 5 minutes • No fees • No commitments
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold text-fintech-text mb-4">
              Why Choose Community Reserve?
            </h3>
            <p className="text-lg text-fintech-muted max-w-2xl mx-auto">
              We're not just another bank. We're your financial partner, 
              built for the digital age with features you'll actually use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center p-6 border-fintech-border">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-xl font-semibold text-fintech-text mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-fintech-muted">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-fintech-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-fintech-text mb-4">
                  Everything You Need in One Place
                </h3>
                <p className="text-lg text-fintech-muted">
                  From everyday banking to long-term savings goals, 
                  we've got you covered with a comprehensive suite 
                  of financial tools and services.
                </p>
              </div>

              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-fintech-text">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" asChild>
                <a href="/auth" className="flex items-center space-x-2">
                  <span>Get Started Today</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-8 h-8 text-primary" />
                    <div>
                      <h4 className="font-semibold text-fintech-text">Your Account</h4>
                      <p className="text-sm text-fintech-muted">•••• •••• •••• 1234</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-fintech-muted">Available Balance</p>
                    <p className="text-3xl font-bold text-fintech-text">$12,847.92</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-fintech-bg rounded-lg">
                      <p className="text-xs text-fintech-muted">This Month</p>
                      <p className="font-semibold text-success">+$2,140</p>
                    </div>
                    <div className="p-3 bg-fintech-bg rounded-lg">
                      <p className="text-xs text-fintech-muted">Savings Goal</p>
                      <p className="font-semibold text-fintech-text">78%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Take Control of Your Finances?
          </h3>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of thousands of users who trust Community Reserve 
            with their financial future. Open your account today and 
            experience banking the way it should be.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="px-8 py-4" 
              asChild
            >
              <a href="/auth" className="flex items-center space-x-2">
                <span>Open Your Account</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/60 mt-6">
            Account opening takes less than 5 minutes • No hidden fees • FDIC insured
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-fintech-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-fintech-text">Community Reserve</span>
            </div>
            <p className="text-fintech-muted text-sm">
              © 2024 Community Reserve. All rights reserved. 
              Member FDIC. Equal Housing Lender.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
