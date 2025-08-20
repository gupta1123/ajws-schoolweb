// src/components/dashboard/welcome-banner.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sun,
  Moon,
  Coffee,
  Cloud
} from 'lucide-react';
import { useTheme } from '@/lib/theme/context';
import { useEffect, useState } from 'react';

export function WelcomeBanner() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [greeting, setGreeting] = useState({ text: '', icon: <Sun className="h-5 w-5" /> });
  const [weather, setWeather] = useState({ temp: 24, condition: 'Sunny' });

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ text: 'Good morning', icon: <Coffee className="h-5 w-5" /> });
    } else if (hour < 17) {
      setGreeting({ text: 'Good afternoon', icon: <Sun className="h-5 w-5" /> });
    } else {
      setGreeting({ text: 'Good evening', icon: <Moon className="h-5 w-5" /> });
    }
  }, []);

  // Mock weather data - in a real app this would come from an API
  useEffect(() => {
    // Simulate API call
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = Math.floor(Math.random() * 15) + 15; // 15-30°C
    setWeather({ temp, condition: randomCondition });
  }, []);

  const getRoleSpecificSubtitle = () => {
    switch (user?.role) {
      case 'teacher':
        return 'Manage your classes and students';
      case 'admin':
        return 'Oversee school operations and resources';
      case 'principal':
        return 'Lead your educational institution';
      default:
        return 'Access your account';
    }
  };

  const getWeatherIcon = () => {
    switch (weather.condition.toLowerCase()) {
      case 'sunny':
        return <Sun className="h-4 w-4" />;
      case 'cloudy':
        return <Cloud className="h-4 w-4" />;
      case 'rainy':
        return <Cloud className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-0 shadow-none bg-gradient-to-r from-primary/10 to-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                {greeting.icon}
              </div>
              <h1 className="text-2xl font-bold">
                {greeting.text}, {user?.full_name?.split(' ')[0] || 'User'}!
              </h1>
            </div>
            <p className="text-muted-foreground">
              {getRoleSpecificSubtitle()}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="p-2 rounded-lg bg-muted">
                {getWeatherIcon()}
              </div>
              <div>
                <div className="font-medium">{weather.temp}°C</div>
                <div className="text-muted-foreground text-xs">{weather.condition}</div>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="p-2 rounded-lg bg-muted">
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <div>
                <div className="font-medium capitalize">{theme} Mode</div>
                <div className="text-muted-foreground text-xs">Theme</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}