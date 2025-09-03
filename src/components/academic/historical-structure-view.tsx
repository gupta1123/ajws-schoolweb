// src/components/academic/historical-structure-view.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  User,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface ClassLevel {
  id: string;
  name: string;
  sequence: number;
}

interface ClassDivision {
  id: string;
  levelId: string;
  name: string;
  teacherId?: string;
  academicYearId: string;
}

interface Teacher {
  id: string;
  name: string;
  subject?: string;
  department?: string;
}

interface HistoricalStructureViewProps {
  onBack: () => void;
}

export function HistoricalStructureView({ onBack }: HistoricalStructureViewProps) {
  const [selectedYearId, setSelectedYearId] = useState('2');
  
  // Mock data
  const academicYears: AcademicYear[] = [
    { id: '1', name: '2024-2025', startDate: '2024-06-01', endDate: '2025-03-31' },
    { id: '2', name: '2023-2024', startDate: '2023-06-01', endDate: '2024-03-31' },
    { id: '3', name: '2022-2023', startDate: '2022-06-01', endDate: '2023-03-31' }
  ];
  
  const classLevels: ClassLevel[] = [
    { id: '1', name: '1st Grade', sequence: 1 },
    { id: '2', name: '2nd Grade', sequence: 2 },
    { id: '3', name: '3rd Grade', sequence: 3 },
    { id: '4', name: '4th Grade', sequence: 4 },
    { id: '5', name: '5th Grade', sequence: 5 },
    { id: '6', name: '6th Grade', sequence: 6 },
    { id: '7', name: '7th Grade', sequence: 7 },
    { id: '8', name: '8th Grade', sequence: 8 },
    { id: '9', name: '9th Grade', sequence: 9 },
    { id: '10', name: '10th Grade', sequence: 10 },
    { id: '11', name: '11th Grade', sequence: 11 },
    { id: '12', name: '12th Grade', sequence: 12 }
  ];
  
  const classDivisions: ClassDivision[] = [
    { id: '1', levelId: '1', name: 'A', teacherId: '1', academicYearId: '2' },
    { id: '2', levelId: '1', name: 'B', teacherId: '2', academicYearId: '2' },
    { id: '3', levelId: '2', name: 'A', teacherId: '3', academicYearId: '2' },
    { id: '4', levelId: '2', name: 'B', teacherId: '4', academicYearId: '2' },
    { id: '5', levelId: '3', name: 'A', academicYearId: '2' },
    // Previous year data
    { id: '6', levelId: '1', name: 'A', teacherId: '5', academicYearId: '3' },
    { id: '7', levelId: '1', name: 'B', teacherId: '1', academicYearId: '3' },
    { id: '8', levelId: '2', name: 'A', teacherId: '2', academicYearId: '3' }
  ];
  
  const teachers: Teacher[] = [
    { id: '1', name: 'Rajesh Kumar', subject: 'Mathematics', department: 'Mathematics' },
    { id: '2', name: 'Sunita Reddy', subject: 'Science', department: 'Science' },
    { id: '3', name: 'Priya Sharma', subject: 'English', department: 'English' },
    { id: '4', name: 'Manoj Nair', subject: 'Social Studies', department: 'Social Studies' },
    { id: '5', name: 'Anita Desai', subject: 'Art', department: 'Arts' }
  ];
  
  // Filter divisions for selected year
  const divisionsForSelectedYear = classDivisions.filter(
    division => division.academicYearId === selectedYearId
  );
  
  // Group divisions by level
  const getDivisionsByLevel = (levelId: string) => {
    return divisionsForSelectedYear
      .filter(division => division.levelId === levelId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };
  
  // Get selected year
  const selectedYear = academicYears.find(year => year.id === selectedYearId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Historical Structure</h2>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Previous Academic Years</CardTitle>
              <CardDescription>
                View class structures from previous years for reference and planning
              </CardDescription>
            </div>
            <div className="w-64">
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedYear && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-medium">{selectedYear.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedYear.startDate)} -
                    {formatDate(selectedYear.endDate)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Assigned Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classLevels.map(level => {
                  const divisions = getDivisionsByLevel(level.id);
                  return divisions.length > 0 ? divisions.map((division, index) => {
                    const assignedTeacher = teachers.find(t => t.id === division.teacherId);
                    
                    // Show grade name only for the first division of each level
                    const showGradeName = index === 0;
                    
                    return (
                      <TableRow key={division.id}>
                        <TableCell className={showGradeName ? "font-medium" : "text-muted-foreground"}>
                          {showGradeName ? level.name : ""}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">Section {division.name}</span>
                        </TableCell>
                        <TableCell>
                          {assignedTeacher ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{assignedTeacher.name}</div>
                                {assignedTeacher.subject && (
                                  <div className="text-xs text-muted-foreground">
                                    {assignedTeacher.subject}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">No teacher assigned</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }) : null;
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}