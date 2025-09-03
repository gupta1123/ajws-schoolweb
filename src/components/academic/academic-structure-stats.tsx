// src/components/academic/academic-structure-stats.tsx

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { 
  BookOpen, 
  Users, 
  Calendar,
  TrendingUp
} from 'lucide-react';

interface AcademicStructureStatsProps {
  classLevels: number;
  classDivisions: number;
  academicYears: number;
  totalStudents: number;
}

export function AcademicStructureStats({
  classLevels,
  classDivisions,
  academicYears,
  totalStudents
}: AcademicStructureStatsProps) {
  const stats = [
    {
      title: 'Class Levels',
      value: classLevels,
      icon: BookOpen,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Class Divisions',
      value: classDivisions,
      icon: Users,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Academic Years',
      value: academicYears,
      icon: Calendar,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Total Students',
      value: totalStudents,
      icon: TrendingUp,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4 flex items-center">
              <div className={`rounded-full ${stat.bgColor} p-3 mr-4`}>
                <Icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}