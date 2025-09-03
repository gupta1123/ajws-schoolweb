// src/components/homework/homework-overview-card.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Calendar,
  Users,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

interface HomeworkOverviewCardProps {
  id: string;
  subject: string;
  title: string;
  class: string;
  dueDate: string;
  submissionRate: number;
  avgScore: number;
  status: 'pending' | 'active' | 'completed';
}

export function HomeworkOverviewCard({
  id,
  subject,
  title,
  class: className,
  dueDate,
  submissionRate,
  avgScore,
  status,
}: HomeworkOverviewCardProps) {
  const getStatusColor = (submissionRate: number) => {
    if (submissionRate >= 90) return 'text-green-500';
    if (submissionRate >= 75) return 'text-blue-500';
    return 'text-yellow-500';
  };

  const getStatusBackground = (submissionRate: number) => {
    if (submissionRate >= 90) return 'bg-green-100 dark:bg-green-900/20';
    if (submissionRate >= 75) return 'bg-blue-100 dark:bg-blue-900/20';
    return 'bg-yellow-100 dark:bg-yellow-900/20';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'active':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">
            {title}
          </CardTitle>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBackground(submissionRate)}`}>
            <span className={getStatusColor(submissionRate)}>
              {avgScore}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>{subject} • {className}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Submissions</span>
            <span className="font-medium">{submissionRate}%</span>
          </div>
          <Progress value={submissionRate} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Due Date</div>
              <div className="font-medium">{dueDate}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Students</div>
              <div className="font-medium">32</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <span className="capitalize">{getStatusText(status)}</span>
          </div>
          <div className={`font-medium ${submissionRate >= 90 ? 'text-green-500' : submissionRate >= 75 ? 'text-blue-500' : 'text-yellow-500'}`}>
            {submissionRate}% submitted
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
            <Link href={`/homework/${id}`}>
              <BookOpen className="h-3 w-3 mr-1" />
              View
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
            <Link href={`/homework/edit/${id}`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              Grade
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}