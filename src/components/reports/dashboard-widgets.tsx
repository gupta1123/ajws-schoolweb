// src/components/reports/dashboard-widgets.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, BookOpen, MessageSquare, TrendingUp } from 'lucide-react';

// Mock data for dashboard widgets
const studentEnrollmentData = [
  { month: 'Apr', count: 1200 },
  { month: 'May', count: 1220 },
  { month: 'Jun', count: 1235 },
  { month: 'Jul', count: 1240 },
  { month: 'Aug', count: 1247 },
  { month: 'Sep', count: 1247 },
  { month: 'Oct', count: 1247 }
];

const homeworkSubmissionData = [
  { month: 'Apr', rate: 85 },
  { month: 'May', rate: 87 },
  { month: 'Jun', rate: 89 },
  { month: 'Jul', rate: 91 },
  { month: 'Aug', rate: 92 },
  { month: 'Sep', rate: 93 },
  { month: 'Oct', rate: 94 }
];

export function DashboardWidgets() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Student Enrollment Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <CardTitle>Student Enrollment</CardTitle>
          </div>
          <CardDescription>
            Total student enrollment trend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={studentEnrollmentData}
                margin={{
                  top: 5,
                  right: 5,
                  left: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 6 }} 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-bold">1,247</span>
            <span className="text-sm text-green-500 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              3.2%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Homework Submission Rate */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-500" />
            <CardTitle>Homework Submission</CardTitle>
          </div>
          <CardDescription>
            Average submission rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={homeworkSubmissionData}
                margin={{
                  top: 5,
                  right: 5,
                  left: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" hide />
                <YAxis hide domain={[80, 100]} />
                <Tooltip />
                <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-bold">94%</span>
            <span className="text-sm text-green-500 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              2.1%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Active Communication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            <CardTitle>Active Communication</CardTitle>
          </div>
          <CardDescription>
            Messages sent this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-purple-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">127</div>
              <div className="text-sm text-muted-foreground">messages</div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">8 teachers active</span>
            <span className="text-sm text-green-500 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              12%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}