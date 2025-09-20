// src/hooks/use-birthdays.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { birthdayServices, BirthdayStudent } from '@/lib/api/birthdays';

export interface BirthdayData {
  id: string;
  name: string;
  class?: string;
  department?: string;
  date: string;
  daysUntil: number;
  avatar: string;
  type: 'student' | 'teacher' | 'staff';
  admissionNumber?: string;
  rollNumber?: string;
  academicRecords?: Array<{
    roll_number: string;
    class_division: {
      division: string;
      level: {
        name: string;
        sequence_number: number;
      };
    };
  }>;
}

export interface BirthdayStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  nextMonth: number;
}

// Fallback mock data for when API is not available
const fallbackStats: BirthdayStats = {
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
  nextMonth: 0
};

export const useBirthdays = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayBirthdays, setTodayBirthdays] = useState<BirthdayData[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayData[]>([]);
  const [birthdayStats, setBirthdayStats] = useState<BirthdayStats>(fallbackStats);
  const [useFallback, setUseFallback] = useState(false);

  // Convert API student data to UI format
  const convertStudentToBirthdayData = useCallback((student: BirthdayStudent): BirthdayData => {
    console.log('Converting student:', student);
    console.log('Academic records:', student.student_academic_records);
    
    const today = new Date();
    const birthDate = new Date(student.date_of_birth);
    
    // Calculate this year's birthday
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    let daysUntil: number;
    
    // Check if birthday is today
    if (thisYearBirthday.toDateString() === today.toDateString()) {
      daysUntil = 0;
    } else if (thisYearBirthday > today) {
      // Birthday is later this year
      daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // Birthday has passed this year, calculate for next year
      const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
      daysUntil = Math.ceil((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Get initials for avatar
    const initials = student.full_name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const result = {
      id: student.id,
      name: student.full_name,
      class: student.student_academic_records && student.student_academic_records.length > 0 && student.student_academic_records[0]?.class_division
        ? `${student.student_academic_records[0].class_division.level.name} - Section ${student.student_academic_records[0].class_division.division}`
        : undefined,
      date: student.date_of_birth,
      daysUntil,
      avatar: initials,
      type: 'student' as const,
      admissionNumber: student.admission_number,
      rollNumber: student.student_academic_records && student.student_academic_records.length > 0 ? student.student_academic_records[0]?.roll_number : undefined,
      academicRecords: student.student_academic_records
    };
    
    console.log('Converted result:', result);
    return result;
  }, []);

  // Calculate stats from actual birthday data
  const calculateStatsFromData = useCallback((allBirthdays: BirthdayData[]): BirthdayStats => {
    const today = allBirthdays.filter(b => b.daysUntil === 0).length;
    const thisWeek = allBirthdays.filter(b => b.daysUntil <= 7).length;
    const thisMonth = allBirthdays.filter(b => b.daysUntil <= 30).length;
    const nextMonth = allBirthdays.filter(b => b.daysUntil > 30 && b.daysUntil <= 60).length;
    
    return { today, thisWeek, thisMonth, nextMonth };
  }, []);

  // Fetch today's birthdays
  const fetchTodayBirthdays = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (user?.role === 'teacher') {
        // For teachers, use the my-classes API to get birthdays for their assigned classes
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        response = await birthdayServices.getTeacherClassesBirthdays(token, {
          date: todayStr
        });

        // Handle Blob response (shouldn't happen for this endpoint)
        if (response instanceof Blob) {
          console.error('Unexpected Blob response');
          return;
        }

        if (response.status === 'success' && response.data.birthdays) {
          const converted = response.data.birthdays.map(convertStudentToBirthdayData);
          setTodayBirthdays(converted);
          setUseFallback(false);
        }
      } else {
        // For admin/principal, use the original today's birthdays API
        response = await birthdayServices.getTodayBirthdays(token);

        // Handle Blob response (shouldn't happen for this endpoint)
        if (response instanceof Blob) {
          console.error('Unexpected Blob response');
          return;
        }

        if (response.status === 'success' && response.data.birthdays) {
          const converted = response.data.birthdays.map(convertStudentToBirthdayData);
          setTodayBirthdays(converted);
          setUseFallback(false);
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching today\'s birthdays:', err);
      
      // Set error state but don't use fallback data
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today\'s birthdays';
      setError(errorMessage);
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  }, [token, convertStudentToBirthdayData, user?.role]);

  // Fetch upcoming birthdays
  const fetchUpcomingBirthdays = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      // Set date range for current month from today onwards
      const today = new Date();
      const startDate = new Date(today); // Start from today
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];
      
      if (user?.role === 'teacher') {
        // For teachers, get birthdays for their classes with date range
        response = await birthdayServices.getMyClassBirthdays(startDateStr, endDateStr, token);
      } else {
        // For admin/principal, get all upcoming birthdays with date range
        response = await birthdayServices.getUpcomingBirthdays(token, {
          start_date: startDateStr,
          end_date: endDateStr
        });
      }

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        return;
      }

      if (response.status === 'success') {
        console.log('API Response:', response.data);
        const allUpcoming: BirthdayData[] = [];
        
        if (user?.role === 'teacher' && 'birthdays' in response.data) {
          // For teachers, process the birthdays array directly
          response.data.birthdays.forEach((student: BirthdayStudent) => {
            console.log('Processing student:', student);
            allUpcoming.push(convertStudentToBirthdayData(student));
          });
        } else if ('upcoming_birthdays' in response.data) {
          // For admin/principal, process the upcoming_birthdays array
          response.data.upcoming_birthdays.forEach((monthData: { students: BirthdayStudent[] }) => {
            console.log('Month data:', monthData);
            monthData.students.forEach((student: BirthdayStudent) => {
              console.log('Processing student:', student);
              allUpcoming.push(convertStudentToBirthdayData(student));
            });
          });
        }
        
        console.log('Final upcoming birthdays:', allUpcoming);
        setUpcomingBirthdays(allUpcoming);
        setUseFallback(false);
      }
    } catch (err: unknown) {
      console.error('Error fetching upcoming birthdays:', err);

      // Set error state but don't use fallback data
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch upcoming birthdays';
      setError(errorMessage);
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  }, [token, convertStudentToBirthdayData, user?.role]);

  // Get combined birthdays for display
  const getAllBirthdays = useCallback((): BirthdayData[] => {
    const combined = [...todayBirthdays, ...upcomingBirthdays];
    
    // Remove duplicates based on ID
    const unique = combined.filter((birthday, index, self) => 
      index === self.findIndex(b => b.id === birthday.id)
    );
    
    // Sort by days until birthday
    return unique.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [todayBirthdays, upcomingBirthdays]);

  // Update stats whenever birthday data changes
  useEffect(() => {
    const allBirthdays = getAllBirthdays();
    const newStats = calculateStatsFromData(allBirthdays);
    setBirthdayStats(newStats);
  }, [todayBirthdays, upcomingBirthdays, getAllBirthdays, calculateStatsFromData]);

  // Filter birthdays by type
  const getBirthdaysByType = useCallback((type: 'student' | 'teacher' | 'staff' | 'all'): BirthdayData[] => {
    const all = getAllBirthdays();
    if (type === 'all') return all;
    return all.filter(birthday => birthday.type === type);
  }, [getAllBirthdays]);

  // Filter birthdays by date range
  const getBirthdaysByDateRange = useCallback((range: 'today' | 'this-week' | 'this-month' | 'all'): BirthdayData[] => {
    const all = getAllBirthdays();
    
    switch (range) {
      case 'today':
        return all.filter(birthday => birthday.daysUntil === 0);
      case 'this-week':
        return all.filter(birthday => birthday.daysUntil <= 7);
      case 'this-month':
        // Filter by current calendar month, excluding past birthdays
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentDay = today.getDate();
        
        return all.filter(birthday => {
          const birthDate = new Date(birthday.date);
          const birthMonth = birthDate.getMonth();
          const birthYear = birthDate.getFullYear();
          const birthDay = birthDate.getDate();
          
          // Check if birthday is in current month and hasn't passed yet
          if (birthMonth === currentMonth) {
            // If it's the current year, check if the day hasn't passed
            if (birthYear === currentYear) {
              return birthDay >= currentDay;
            }
            // If it's a future year, always include it
            return birthYear > currentYear;
          }
          return false;
        });
      default:
        return all;
    }
  }, [getAllBirthdays]);

  // Filter birthdays for tomorrow
  const getBirthdaysForTomorrow = useCallback((): BirthdayData[] => {
    const all = getAllBirthdays();
    return all.filter(birthday => birthday.daysUntil === 1);
  }, [getAllBirthdays]);

  // Initialize data on mount
  useEffect(() => {
    if (token) {
      Promise.all([
        fetchTodayBirthdays(),
        fetchUpcomingBirthdays()
      ]);
    }
  }, [token, fetchTodayBirthdays, fetchUpcomingBirthdays]);

  return {
    loading,
    error,
    todayBirthdays,
    upcomingBirthdays,
    birthdayStats,
    useFallback,
    getAllBirthdays,
    getBirthdaysByType,
    getBirthdaysByDateRange,
    getBirthdaysForTomorrow,
    refresh: () => Promise.all([fetchTodayBirthdays(), fetchUpcomingBirthdays()]),
    clearError: () => setError(null)
  };
};
