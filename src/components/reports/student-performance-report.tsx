// src/components/reports/student-performance-report.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, BookOpen, Users, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for student performance
const studentPerformanceData = [
  { grade: 'Grade 5', boys: 85, girls: 88, overall: 86.5 },
  { grade: 'Grade 6', boys: 78, girls: 82, overall: 80 },
  { grade: 'Grade 7', boys: 92, girls: 89, overall: 90.5 },
  { grade: 'Grade 8', boys: 76, girls: 84, overall: 80 },
  { grade: 'Grade 9', boys: 88, girls: 91, overall: 89.5 },
  { grade: 'Grade 10', boys: 83, girls: 87, overall: 85 }
];

const subjectPerformanceData = [
  { subject: 'Mathematics', average: 85, boys: 82, girls: 88 },
  { subject: 'Science', average: 88, boys: 86, girls: 90 },
  { subject: 'English', average: 82, boys: 79, girls: 85 },
  { subject: 'Social Studies', average: 79, boys: 77, girls: 81 },
  { subject: 'Art', average: 92, boys: 90, girls: 94 }
];

const performanceDistributionData = [
  { name: 'Excellent (90-100)', value: 25 },
  { name: 'Good (75-89)', value: 45 },
  { name: 'Average (60-74)', value: 20 },
  { name: 'Below Average (0-59)', value: 10 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function StudentPerformanceReport() {
  const handleExport = () => {
    // In a real app, this would export the report data
    alert('Student performance report exported successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Student Performance Report</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Academic performance metrics across grades and subjects
          </p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Performance by Grade */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-500" />
            <CardTitle>Performance by Grade</CardTitle>
          </div>
          <CardDescription>
            Average scores by grade level and gender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={studentPerformanceData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis domain={[70, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="boys" fill="#3b82f6" name="Boys" />
                <Bar dataKey="girls" fill="#ec4899" name="Girls" />
                <Bar dataKey="overall" fill="#10b981" name="Overall" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance by Subject */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              <CardTitle>Performance by Subject</CardTitle>
            </div>
            <CardDescription>
              Average scores across different subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectPerformanceData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[70, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#8b5cf6" name="Average" />
                  <Bar dataKey="boys" fill="#3b82f6" name="Boys" />
                  <Bar dataKey="girls" fill="#ec4899" name="Girls" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <CardTitle>Performance Distribution</CardTitle>
            </div>
            <CardDescription>
              Distribution of students across performance categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  >
                    {performanceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            <CardTitle>Performance Trend</CardTitle>
          </div>
          <CardDescription>
            Performance trends over the academic year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { month: 'Apr', performance: 78 },
                  { month: 'May', performance: 82 },
                  { month: 'Jun', performance: 85 },
                  { month: 'Jul', performance: 87 },
                  { month: 'Aug', performance: 89 },
                  { month: 'Sep', performance: 91 },
                  { month: 'Oct', performance: 92 }
                ]}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[75, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="#10b981" 
                  activeDot={{ r: 8 }} 
                  name="Overall Performance" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}