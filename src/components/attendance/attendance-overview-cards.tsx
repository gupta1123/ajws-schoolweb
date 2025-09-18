// src/components/attendance/attendance-overview-cards.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CheckCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface AttendanceOverviewCardsProps {
  totalClasses: number;
  classesWithAttendance: number;
  classesWithoutAttendance: number;
  overallAttendancePercentage: number;
  date: string;
}

export function AttendanceOverviewCards({
  totalClasses,
  classesWithAttendance,
  classesWithoutAttendance,
  overallAttendancePercentage,
  date
}: AttendanceOverviewCardsProps) {
  const { t, lang } = useI18n();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString(lang, { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day} ${month} '${year}`;
  };

  const getAttendanceStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceStatusBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">{t('attendanceMgmt.status.excellent', 'Excellent')}</Badge>;
    if (percentage >= 75) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{t('attendanceMgmt.status.good', 'Good')}</Badge>;
    return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">{t('attendanceMgmt.status.needsAttention', 'Needs Attention')}</Badge>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Classes */}
      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendanceMgmt.cards.totalClasses', 'Total Classes')}</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{totalClasses}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(date)}
          </p>
        </CardContent>
      </Card>

      {/* Classes with Attendance */}
      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendanceMgmt.cards.attendanceMarked', 'Attendance Marked')}</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{classesWithAttendance}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalClasses > 0 ? `${Math.round((classesWithAttendance / totalClasses) * 100)}% ${t('attendanceMgmt.ofClasses', 'of classes')}` : t('attendanceMgmt.noClasses', 'No classes')}
          </p>
        </CardContent>
      </Card>

      {/* Classes without Attendance */}
      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendanceMgmt.cards.pendingAttendance', 'Pending Attendance')}</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{classesWithoutAttendance}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {classesWithoutAttendance > 0 
              ? t('attendanceMgmt.status.needsAttention', 'Needs Attention') 
              : t('attendanceMgmt.status.allMarked', 'All marked')}
          </p>
        </CardContent>
      </Card>

      {/* Overall Attendance Percentage */}
      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('attendanceMgmt.cards.overallAttendance', 'Overall Attendance')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getAttendanceStatusColor(overallAttendancePercentage)}`}>
            {overallAttendancePercentage.toFixed(1)}%
          </div>
          <div className="flex items-center gap-2 mt-1">
            {getAttendanceStatusBadge(overallAttendancePercentage)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
