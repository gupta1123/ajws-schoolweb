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
}

export interface BirthdayStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  nextMonth: number;
}

// Fallback mock data for when API is not available
const fallbackBirthdays: BirthdayData[] = [
  {
    id: '1',
    name: 'Aarav Patel',
    class: 'Grade 5 - Section A',
    date: '2025-08-15',
    daysUntil: 0,
    avatar: 'AP',
    type: 'student'
  },
  {
    id: '2',
    name: 'Diya Nair',
    class: 'Grade 6 - Section B',
    date: '2025-08-22',
    daysUntil: 7,
    avatar: 'DN',
    type: 'student'
  }
];

const fallbackStats: BirthdayStats = {
  today: 1,
  thisWeek: 2,
  thisMonth: 5,
  nextMonth: 8
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
    const today = new Date();
    const birthDate = new Date(student.date_of_birth);
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    // If this year's birthday has passed, calculate for next year
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get initials for avatar
    const initials = student.full_name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      id: student.id,
      name: student.full_name,
      class: student.academic_records && student.academic_records.length > 0 && student.academic_records[0]?.class_division
        ? `${student.academic_records[0].class_division.level.name} - Section ${student.academic_records[0].class_division.division}`
        : undefined,
      date: student.date_of_birth,
      daysUntil,
      avatar: initials,
      type: 'student',
      admissionNumber: student.admission_number,
      rollNumber: student.academic_records && student.academic_records.length > 0 ? student.academic_records[0]?.roll_number : undefined
    };
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
      
      const response = await birthdayServices.getTodayBirthdays(token);
      
      if (response.status === 'success' && response.data.birthdays) {
        const converted = response.data.birthdays.map(convertStudentToBirthdayData);
        setTodayBirthdays(converted);
        setUseFallback(false);
      }
    } catch (err: unknown) {
      console.error('Error fetching today\'s birthdays:', err);
      
      // If it's a network error or API unavailable, use fallback data
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('Network'))) {
        setUseFallback(true);
        setTodayBirthdays(fallbackBirthdays.filter(b => b.daysUntil === 0));
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today\'s birthdays';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [token, convertStudentToBirthdayData]);

  // Fetch upcoming birthdays
  const fetchUpcomingBirthdays = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (user?.role === 'teacher') {
        // For teachers, get birthdays for their classes
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 60); // Get next 60 days
        
        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        response = await birthdayServices.getMyClassBirthdays(startDateStr, endDateStr, token);
      } else {
        // For admin/principal, get all upcoming birthdays
        response = await birthdayServices.getUpcomingBirthdays(token);
      }
      
      if (response.status === 'success') {
        const allUpcoming: BirthdayData[] = [];
        
        if (user?.role === 'teacher' && response.data.upcoming_birthdays) {
          // For teachers, process class birthdays
          response.data.upcoming_birthdays.forEach((monthData: { students: BirthdayStudent[] }) => {
            monthData.students.forEach((student: BirthdayStudent) => {
              allUpcoming.push(convertStudentToBirthdayData(student));
            });
          });
        } else if (response.data.upcoming_birthdays) {
          // For admin/principal, process upcoming birthdays
          response.data.upcoming_birthdays.forEach((monthData: { students: BirthdayStudent[] }) => {
            monthData.students.forEach((student: BirthdayStudent) => {
              allUpcoming.push(convertStudentToBirthdayData(student));
            });
          });
        }
        
        setUpcomingBirthdays(allUpcoming);
        setUseFallback(false);
      }
    } catch (err: unknown) {
      console.error('Error fetching upcoming birthdays:', err);

      // If it's a network error or API unavailable, use fallback data
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('Network'))) {
        setUseFallback(true);
        setUpcomingBirthdays(fallbackBirthdays.filter(b => b.daysUntil > 0));
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch upcoming birthdays';
        setError(errorMessage);
      }
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
        return all.filter(birthday => birthday.daysUntil <= 30);
      default:
        return all;
    }
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
    refresh: () => Promise.all([fetchTodayBirthdays(), fetchUpcomingBirthdays()]),
    clearError: () => setError(null)
  };
};
