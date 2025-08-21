// src/app/birthdays/page.tsx

'use client';

import { useTheme } from '@/lib/theme/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cake, Send, Calendar, Users, Gift, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useBirthdays, BirthdayData } from '@/hooks/use-birthdays';



// Birthday card component
const BirthdayCard = ({ 
  birthday,
  onSendWish
}: { 
  birthday: BirthdayData;
  onSendWish: (birthday: BirthdayData) => void;
}) => {
  const isToday = birthday.daysUntil === 0;
  const { colorScheme } = useTheme();
  
  // Get theme color classes
  const getColorClasses = () => {
    switch (colorScheme) {
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300';
      case 'green':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300';
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300';
      case 'orange':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300';
      default:
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300';
    }
  };
  
  const getBorderClasses = () => {
    switch (colorScheme) {
      case 'blue':
        return 'border-blue-500';
      case 'green':
        return 'border-green-500';
      case 'purple':
        return 'border-purple-500';
      case 'orange':
        return 'border-orange-500';
      default:
        return 'border-pink-500';
    }
  };
  
  const getTypeLabel = () => {
    switch (birthday.type) {
      case 'student':
        return 'Student';
      case 'teacher':
        return 'Teacher';
      case 'staff':
        return 'Staff';
      default:
        return 'Person';
    }
  };

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${isToday ? `border-2 ${getBorderClasses()}` : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 relative">
            <div className={`w-12 h-12 rounded-full ${getColorClasses()} flex items-center justify-center`}>
              <span className="font-semibold">{birthday.avatar}</span>
            </div>
            {isToday && (
              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${getColorClasses().replace('bg-', 'bg-').split(' ')[0]} flex items-center justify-center`}>
                <Gift className="h-3 w-3" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{birthday.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                    {getTypeLabel()}
                  </span>
                  {birthday.class && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{birthday.class}</p>
                  )}
                  {birthday.department && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{birthday.department}</p>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{birthday.date}</span>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <div className={`text-sm ${isToday ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                {isToday ? (
                  <span className="flex items-center gap-1">
                    <Cake className="h-4 w-4" />
                    🎉 Today! 🎉
                  </span>
                ) : (
                  <span>{birthday.daysUntil} days</span>
                )}
              </div>
              {isToday && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onSendWish(birthday)}
                  className={`${getColorClasses().replace('bg-', 'hover:bg-').replace('text-', 'hover:text-')} hover:bg-opacity-20`}
                >
                  <Send className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Send Wish</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Stats card component
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description 
}: { 
  title: string; 
  value: number; 
  icon: React.ComponentType<{ className?: string }>; 
  description: string;
}) => {
  const { colorScheme } = useTheme();
  
  // Get theme color classes
  const getColorClasses = () => {
    switch (colorScheme) {
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300';
      case 'green':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300';
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300';
      case 'orange':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300';
      default:
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getColorClasses()}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function BirthdaysPage() {

  const [filter, setFilter] = useState<'all' | 'today' | 'this-week' | 'this-month'>('all');
  
  // Use the birthday hook
  const {
    loading,
    error,
    birthdayStats,
    useFallback,
    getAllBirthdays,
    getBirthdaysByDateRange,
    clearError
  } = useBirthdays();
  
  // Filter birthdays based on selected filters
  const filteredBirthdays = (() => {
    let filtered: BirthdayData[] = [];

    // Apply date filter
    if (filter === 'today') {
      filtered = getBirthdaysByDateRange('today');
    } else if (filter === 'this-week') {
      filtered = getBirthdaysByDateRange('this-week');
    } else if (filter === 'this-month') {
      filtered = getBirthdaysByDateRange('this-month');
    } else {
      filtered = getAllBirthdays();
    }

    return filtered;
  })();

  const handleSendWish = (birthday: BirthdayData) => {
    // Here you would typically send the wish to your API or open a message composer
    console.log(`Sending birthday wish to ${birthday.name}`);
    // For now, we'll just show an alert
    alert(`Birthday wish sent to ${birthday.name}!`);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <Cake className="h-8 w-8 text-pink-500" />
          </div>
        </div>

        {/* Fallback Data Warning */}
        {useFallback && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">Using Demo Data</p>
                <p className="text-yellow-700 text-sm">
                  The API is currently unavailable. Showing sample birthday data for demonstration purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-800">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Today" 
            value={birthdayStats.today} 
            icon={Cake} 
            description="birthdays today" 
          />
          <StatsCard 
            title="This Week" 
            value={birthdayStats.thisWeek} 
            icon={Calendar} 
            description="upcoming birthdays" 
          />
          <StatsCard 
            title="This Month" 
            value={birthdayStats.thisMonth} 
            icon={Users} 
            description="total birthdays" 
          />
          <StatsCard 
            title="Next Month" 
            value={birthdayStats.nextMonth} 
            icon={Gift} 
            description="planned celebrations" 
          />
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Birthdays</CardTitle>
              <CardDescription>
                Birthdays for students, teachers, and staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All Dates
                  </Button>
                  <Button
                    variant={filter === 'today' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('today')}
                  >
                    Today
                  </Button>
                  <Button
                    variant={filter === 'this-week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('this-week')}
                  >
                    This Week
                  </Button>
                  <Button
                    variant={filter === 'this-month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('this-month')}
                  >
                    This Month
                  </Button>
                </div>

              </div>
              
              {/* Loading State */}
              {loading && (
                <div className="text-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600 mx-auto mb-3"></div>
                  <p className="text-gray-500 dark:text-gray-300">Loading birthdays...</p>
                </div>
              )}
              
              {/* Birthday Cards Grid */}
              {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBirthdays.length > 0 ? (
                    filteredBirthdays
                      .sort((a, b) => a.daysUntil - b.daysUntil)
                      .map((birthday) => (
                        <BirthdayCard
                          key={birthday.id}
                          birthday={birthday}
                          onSendWish={handleSendWish}
                        />
                      ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <Cake className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No birthdays found for the selected filters
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}