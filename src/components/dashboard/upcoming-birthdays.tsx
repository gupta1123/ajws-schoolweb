// src/components/dashboard/upcoming-birthdays.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cake, Calendar, Users, Gift } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { birthdayServices } from '@/lib/api';

interface BirthdayData {
  id: string;
  student_name: string;
  date_of_birth: string;
  class_name?: string;
  division?: string;
  age?: number;
  days_until_birthday?: number;
}

export function UpcomingBirthdays() {
  const { user, token } = useAuth();
  const [birthdays, setBirthdays] = useState<BirthdayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingBirthdays = async () => {
      if (!token) return;

      // Get current date and next 30 days for date range
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);

      const startDateStr = today.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      try {
        setLoading(true);

        let response;
        
        if (user?.role === 'teacher') {
          // For teachers, get birthdays for their classes with date range
          response = await birthdayServices.getTeacherClassesBirthdays(token, {
            start_date: startDateStr,
            end_date: endDateStr
          });
        } else if (user?.role === 'parent') {
          // For parents, get birthdays for their children's class
          // Using upcoming birthdays with date range
          response = await birthdayServices.getUpcomingBirthdays(token, {
            start_date: startDateStr,
            end_date: endDateStr
          });
        } else if (user?.role === 'admin' || user?.role === 'principal') {
          // For admin/principal, get all upcoming birthdays with date range
          response = await birthdayServices.getUpcomingBirthdays(token, {
            start_date: startDateStr,
            end_date: endDateStr
          });
        } else {
          // Default fallback
          response = await birthdayServices.getUpcomingBirthdays(token, {
            start_date: startDateStr,
            end_date: endDateStr
          });
        }

        // Handle Blob response (shouldn't happen for this endpoint)
        if (response instanceof Blob) {
          console.error('Unexpected Blob response');
          setError('Unexpected response format');
          return;
        }

        if (response.status === 'success') {
          try {
            let processedBirthdays: BirthdayData[] = [];
            
            if (user?.role === 'teacher' && 'birthdays' in response.data) {
              // For teachers, process the birthdays array directly
              processedBirthdays = response.data.birthdays.map((birthday: {
                id: string;
                full_name: string;
                date_of_birth: string;
                student_academic_records?: Array<{
                  class_division: {
                    division: string;
                    level: {
                      name: string;
                      sequence_number: number;
                    };
                  };
                  roll_number: string;
                }>;
              }) => {
                try {
                  const birthDate = new Date(birthday.date_of_birth);
                  const today = new Date();

                  // Calculate next birthday
                  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                  if (nextBirthday < today) {
                    nextBirthday.setFullYear(today.getFullYear() + 1);
                  }

                  const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const age = today.getFullYear() - birthDate.getFullYear();

                  // Extract class info from academic records
                  const classInfo = birthday.student_academic_records?.[0];
                  const className = classInfo?.class_division?.level?.name;
                  const division = classInfo?.class_division?.division;

                  return {
                    id: birthday.id,
                    student_name: birthday.full_name,
                    date_of_birth: birthday.date_of_birth,
                    class_name: className,
                    division: division,
                    age: age,
                    days_until_birthday: daysUntilBirthday
                  };
                } catch (birthdayError) {
                  console.warn('Error processing birthday data for student:', birthday.full_name, birthdayError);
                  return null;
                }
              }).filter(Boolean) as BirthdayData[]; // Filter out null entries
            } else if ('upcoming_birthdays' in response.data) {
              // For admin/principal, process the upcoming_birthdays array
              processedBirthdays = response.data.upcoming_birthdays.flatMap((monthData: {
                date: string;
                students: Array<{
                  id: string;
                  full_name: string;
                  date_of_birth: string;
                  student_academic_records?: Array<{
                    class_division: {
                      division: string;
                      level: {
                        name: string;
                        sequence_number: number;
                      };
                    };
                    roll_number: string;
                  }>;
                }>;
              }) => {
                if (!monthData?.students) return [];

                return monthData.students.map((birthday) => {
                  try {
                    const birthDate = new Date(birthday.date_of_birth);
                    const today = new Date();

                    // Calculate next birthday
                    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                    if (nextBirthday < today) {
                      nextBirthday.setFullYear(today.getFullYear() + 1);
                    }

                    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const age = today.getFullYear() - birthDate.getFullYear();

                    // Extract class info from academic records
                    const classInfo = birthday.student_academic_records?.[0];
                    const className = classInfo?.class_division?.level?.name;
                    const division = classInfo?.class_division?.division;

                    return {
                      id: birthday.id,
                      student_name: birthday.full_name,
                      date_of_birth: birthday.date_of_birth,
                      class_name: className,
                      division: division,
                      age: age,
                      days_until_birthday: daysUntilBirthday
                    };
                  } catch (birthdayError) {
                    console.warn('Error processing birthday data for student:', birthday.full_name, birthdayError);
                    return null;
                  }
                });
              }).filter(Boolean) as BirthdayData[]; // Filter out null entries
            }

            // Sort by days until birthday (closest first)
            const sortedBirthdays = processedBirthdays
              .filter((birthday) => birthday !== null)
              .sort((a, b) => (a!.days_until_birthday || 0) - (b!.days_until_birthday || 0))
              .slice(0, 5); // Show only next 5 birthdays

            setBirthdays(sortedBirthdays);
          } catch (processingError) {
            console.error('Error processing birthday data:', processingError);
            setBirthdays([]); // Set empty array on error
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching upcoming birthdays:', {
          error,
          timestamp: new Date().toISOString(),
          userRole: user?.role,
          token: token ? `${token.substring(0, 10)}...` : 'no-token',
          dateRange: {
            startDate: startDateStr,
            endDate: endDateStr
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingBirthdays();
  }, [token, user?.role]);

  const formatBirthday = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric'
    });
  };

  const getBirthdayStatus = (daysUntil: number) => {
    if (daysUntil === 0) return { text: 'Today!', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' };
    if (daysUntil === 1) return { text: 'Tomorrow!', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' };
    if (daysUntil <= 7) return { text: `${daysUntil} days`, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' };
    return { text: `${daysUntil} days`, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            Upcoming Birthdays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading birthdays...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            Upcoming Birthdays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <Cake className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Failed to load birthdays</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            Upcoming Birthdays
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/birthdays">
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {birthdays.length > 0 ? (
          <div className="space-y-3">
            {birthdays.map((birthday) => {
              const status = getBirthdayStatus(birthday.days_until_birthday || 0);
              return (
                <div key={birthday.id} className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-pink-50 dark:bg-pink-900/20">
                        <Gift className="h-4 w-4 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{birthday.student_name}</h4>
                        {birthday.class_name && birthday.division && (
                          <p className="text-xs text-muted-foreground">
                            {birthday.class_name} - {birthday.division}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.text}
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatBirthday(birthday.date_of_birth)}</span>
                    </div>
                    
                    {birthday.age !== undefined && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Turning {birthday.age + 1} years old</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Cake className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No upcoming birthdays</p>
            <p className="text-xs">Birthdays will appear here when approaching</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
