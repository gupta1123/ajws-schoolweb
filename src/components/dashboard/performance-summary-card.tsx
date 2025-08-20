// src/components/dashboard/performance-summary-card.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  CheckCircle,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { DataChart } from '@/components/ui/data-chart';

// Mock data for charts
const mockClassPerformance = [
  { class: 'Grade 5A', score: 85 },
  { class: 'Grade 5B', score: 78 },
  { class: 'Grade 6A', score: 92 },
  { class: 'Grade 6B', score: 88 },
  { class: 'Grade 7A', score: 95 },
];

const mockTrendData = [
  { month: 'Jan', performance: 75 },
  { month: 'Feb', performance: 78 },
  { month: 'Mar', performance: 82 },
  { month: 'Apr', performance: 85 },
  { month: 'May', performance: 88 },
  { month: 'Jun', performance: 92 },
];

export function PerformanceSummaryCard() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Summary
            </CardTitle>
            <CardDescription>
              Overall school and class performance metrics
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/reports">
              View Full Report
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Metrics */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/20 text-center">
                <div className="text-2xl font-bold text-blue-500">94.2%</div>
                <div className="text-xs text-muted-foreground">Avg. Attendance</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 text-center">
                <div className="text-2xl font-bold text-green-500">87.5%</div>
                <div className="text-xs text-muted-foreground">Homework Completion</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 text-center">
                <div className="text-2xl font-bold text-purple-500">1,247</div>
                <div className="text-xs text-muted-foreground">Total Students</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 text-center">
                <div className="text-2xl font-bold text-orange-500">45</div>
                <div className="text-xs text-muted-foreground">Total Staff</div>
              </div>
            </div>
            
            {/* Performance Indicators */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Class Performance</span>
                  <span className="font-medium">88%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: '88%' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Student Engagement</span>
                  <span className="font-medium">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: '92%' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Parent Communication</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: '75%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="space-y-4">
            <DataChart
              title="Class Performance"
              data={mockClassPerformance}
              type="bar"
              dataKey="score"
              xAxisKey="class"
              height={150}
            />
            
            <DataChart
              title="Performance Trend"
              data={mockTrendData}
              type="line"
              dataKey="performance"
              xAxisKey="month"
              height={150}
            />
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link href="/reports/attendance">
                <CheckCircle className="h-3 w-3 mr-1" />
                Attendance Report
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link href="/reports/homework">
                <BookOpen className="h-3 w-3 mr-1" />
                Homework Analytics
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link href="/reports/behavior">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Behavior Report
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}