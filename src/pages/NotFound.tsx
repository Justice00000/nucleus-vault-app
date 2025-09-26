import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Landmark, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-fintech-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-fintech-text">404</h1>
          <p className="text-lg text-fintech-muted mb-6">Page not found</p>
          <p className="text-sm text-fintech-muted mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild className="w-full">
            <a href="/dashboard" className="flex items-center justify-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
