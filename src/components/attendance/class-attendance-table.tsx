// src/components/attendance/class-attendance-table.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Search,
  Eye,
  CheckCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { ClassAttendanceSummary } from '@/lib/api/attendance';

interface ClassAttendanceTableProps {
  classAttendanceList: ClassAttendanceSummary[];
  onClassSelect: (classId: string) => void;
  selectedClassId: string | null;
  loading?: boolean;
  selectedDate?: string;
}

export function ClassAttendanceTable({
  classAttendanceList,
  onClassSelect,
  selectedClassId,
  loading = false,
  selectedDate
}: ClassAttendanceTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'marked' | 'unmarked' | 'holiday'>('all');

  // Filter classes based on search term and filter
  const filteredClasses = classAttendanceList.filter(classData => {
    const matchesSearch = classData.class_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'marked' && classData.attendance_marked) ||
      (filter === 'unmarked' && !classData.attendance_marked && !classData.is_holiday) ||
      (filter === 'holiday' && classData.is_holiday);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (classData: ClassAttendanceSummary) => {
    if (classData.is_holiday) {
      return <Badge className="bg-purple-100 text-purple-800">Holiday</Badge>;
    }
    
    if (classData.attendance_marked) {
      return <Badge className="bg-green-100 text-green-800">Marked</Badge>;
    }
    
    return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
  };

  const getAttendancePercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (classData: ClassAttendanceSummary) => {
    if (classData.is_holiday) {
      return <Calendar className="h-4 w-4 text-purple-500" />;
    }

    if (classData.attendance_marked) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  };

  const handleViewDetails = (classId: string) => {
    if (selectedDate) {
      router.push(`/admin/attendance/${classId}?date=${selectedDate}`);
    } else {
      // If no date is selected, use today's date
      const today = new Date().toISOString().split('T')[0];
      router.push(`/admin/attendance/${classId}?date=${today}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg font-semibold">Class Attendance Overview</CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'marked' | 'unmarked' | 'holiday')}
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="all">All Classes</option>
              <option value="marked">Attendance Marked</option>
              <option value="unmarked">Pending Attendance</option>
              <option value="holiday">Holidays</option>
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No classes found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Attendance %</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((classData) => (
                  <TableRow
                    key={classData.class_division_id}
                    className={`hover:bg-muted/50 cursor-pointer transition-colors ${
                      selectedClassId === classData.class_division_id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                    }`}
                    onClick={() => onClassSelect(classData.class_division_id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(classData)}
                        {classData.class_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(classData)}
                    </TableCell>
                    <TableCell className="text-center">
                      {classData.total_students}
                    </TableCell>
                    <TableCell className="text-center text-green-600 font-medium">
                      {classData.present_count}
                    </TableCell>
                    <TableCell className="text-center text-red-600 font-medium">
                      {classData.absent_count}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${getAttendancePercentageColor(classData.attendance_percentage)}`}>
                        {classData.attendance_percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(classData.class_division_id);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {filteredClasses.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {filteredClasses.length} of {classAttendanceList.length} classes
          </div>
        )}
      </CardContent>
    </Card>
  );
}
