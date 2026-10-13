// src/components/dashboard/upcoming-birthdays.tsx

'use client';

import { useEffect, useState } from 'react';
import { Cake, Gift } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { birthdayServices } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';
import { Panel, RowList, ListRow, IconChip, Pill, EmptyState, InlineError, PanelSkeleton } from '@/components/ui/page-kit';
import type { Tone } from '@/lib/design/tokens';

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
  const { t } = useI18n();
  const [birthdays, setBirthdays] = useState<BirthdayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingBirthdays = async () => {
      if (!token) return;

      // Get current month date range from today onwards
      const today = new Date();
      const startDate = new Date(today); // Start from today
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];

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

                    // Calculate this year's birthday
                    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                    
                    let daysUntilBirthday: number;
                    
                    // Check if birthday is today
                    if (thisYearBirthday.toDateString() === today.toDateString()) {
                      daysUntilBirthday = 0;
                    } else if (thisYearBirthday > today) {
                      // Birthday is later this year
                      daysUntilBirthday = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    } else {
                      // Birthday has passed this year, calculate for next year
                      const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
                      daysUntilBirthday = Math.ceil((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    }
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

  const getBirthdayStatus = (daysUntil: number): { text: string; tone: Tone } => {
    if (daysUntil === 0) return { text: 'Today!', tone: 'danger' };
    if (daysUntil === 1) return { text: 'Tomorrow!', tone: 'warning' };
    if (daysUntil <= 7) return { text: `${daysUntil} days`, tone: 'info' };
    return { text: `${daysUntil} days`, tone: 'neutral' };
  };

  const panelProps = {
    title: t('birthdays.upcoming', 'Upcoming Birthdays'),
    icon: <Cake />,
    href: '/birthdays',
    hrefLabel: t('common.viewAll', 'View All'),
    flush: true,
  };

  if (loading) {
    return (
      <Panel {...panelProps}>
        <PanelSkeleton />
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel {...panelProps}>
        <InlineError title={t('birthdays.loadFailed', 'Failed to load birthdays')} detail={error} />
      </Panel>
    );
  }

  return (
    <Panel {...panelProps}>
      {birthdays.length > 0 ? (
        <RowList>
          {birthdays.map((birthday) => {
            const status = getBirthdayStatus(birthday.days_until_birthday || 0);
            return (
              <ListRow
                key={birthday.id}
                icon={
                  <IconChip tone="rose">
                    <Gift />
                  </IconChip>
                }
                title={birthday.student_name}
                subtitle={
                  birthday.class_name && birthday.division
                    ? `${birthday.class_name} - ${birthday.division}`
                    : undefined
                }
                trailing={<Pill tone={status.tone}>{status.text}</Pill>}
                meta={[
                  <span key="d">{formatBirthday(birthday.date_of_birth)}</span>,
                  birthday.age !== undefined && <span key="a">Turning {birthday.age + 1} years old</span>,
                ]}
              />
            );
          })}
        </RowList>
      ) : (
        <EmptyState
          icon={<Cake />}
          title={t('birthdays.widgetEmpty.title', 'No upcoming birthdays')}
          help={t('birthdays.widgetEmpty.help', 'Birthdays will appear here when approaching')}
        />
      )}
    </Panel>
  );
}
