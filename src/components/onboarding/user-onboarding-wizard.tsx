// src/components/onboarding/user-onboarding-wizard.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Users, 
  BookOpen, 
  Calendar,
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  icon: React.ReactNode;
}

export function UserOnboardingWizard() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Show onboarding wizard on first visit or if not completed
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    if (!hasCompletedOnboarding && user) {
      setIsOpen(true);
    }
  }, [user]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AJWS',
      description: 'Get started with our comprehensive school management system',
      icon: <User className="h-6 w-6" />,
      content: (
        <div className="text-center">
          <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">
            Hi {user?.full_name?.split(' ')[0] || 'there'}! Welcome to AJWS, 
            your new school management system. Let&apos;s take a quick tour to help you get started.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 text-left">
            <h3 className="font-medium mb-2">What you can do:</h3>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Manage classes and students
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Create and track homework/classwork
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Communicate with parents
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Track student performance
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: 'Your Dashboard',
      description: 'Your personalized command center',
      icon: <BookOpen className="h-6 w-6" />,
      content: (
        <div className="text-center">
          <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">
            Your dashboard provides a personalized overview of your responsibilities and key information.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 text-left space-y-3">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Quick Actions</h4>
                <p className="text-sm text-muted-foreground">
                  Access common tasks with one click
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Class Overview</h4>
                <p className="text-sm text-muted-foreground">
                  View your classes and student information
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Calendar</h4>
                <p className="text-sm text-muted-foreground">
                  Stay organized with upcoming events
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'navigation',
      title: 'Navigation',
      description: 'Find what you need quickly',
      icon: <Users className="h-6 w-6" />,
      content: (
        <div className="text-center">
          <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">
            Navigate the system using the sidebar on the left or the header at the top.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 text-left space-y-3">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Sidebar Navigation</h4>
                <p className="text-sm text-muted-foreground">
                  Access role-specific features with the sidebar
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Header Actions</h4>
                <p className="text-sm text-muted-foreground">
                  Quick access to profile and notifications
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Search</h4>
                <p className="text-sm text-muted-foreground">
                  Find anything quickly with the search bar
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Key Features',
      description: 'Powerful tools to enhance your experience',
      icon: <Calendar className="h-6 w-6" />,
      content: (
        <div className="text-center">
          <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">
            Discover the powerful features that make AJWS unique.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 text-left space-y-3">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Homework & Classwork</h4>
                <p className="text-sm text-muted-foreground">
                  Create, track, and manage assignments effortlessly
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Messaging</h4>
                <p className="text-sm text-muted-foreground">
                  Communicate with parents and colleagues seamlessly
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Calendar</h4>
                <p className="text-sm text-muted-foreground">
                  Stay organized with smart scheduling
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Performance Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Visualize student progress with charts and metrics
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'support',
      title: 'Getting Help',
      description: 'Support and resources when you need them',
      icon: <MessageSquare className="h-6 w-6" />,
      content: (
        <div className="text-center">
          <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">
            Need help? We&apos;re here to support you every step of the way.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 text-left space-y-3">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">In-App Messages</h4>
                <p className="text-sm text-muted-foreground">
                  Reach out to administrators or support anytime
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Community Forum</h4>
                <p className="text-sm text-muted-foreground">
                  Connect with other educators and share tips
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Knowledge Base</h4>
                <p className="text-sm text-muted-foreground">
                  Access tutorials and documentation
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Quick Tips</h4>
                <p className="text-sm text-muted-foreground">
                  Learn shortcuts and best practices
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const newCompleted = [...completedSteps, steps[currentStep].id];
      setCompletedSteps(newCompleted);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    localStorage.setItem('onboardingCompleted', 'true');
  };

  const handleFinish = () => {
    setIsOpen(false);
    localStorage.setItem('onboardingCompleted', 'true');
  };

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {steps[currentStep].icon}
              <div>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </CardHeader>
        
        <CardContent>
          {steps[currentStep].content}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentStep > 0 ? (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleSkip}
              >
                Skip Tour
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleFinish}
                className="bg-green-500 hover:bg-green-600"
              >
                Get Started
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}