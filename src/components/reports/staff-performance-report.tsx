// src/components/reports/staff-performance-report.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, User, Users, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for staff performance
const staffPerformanceData = [
  { department: 'Mathematics', teachers: 5, averageRating: 4.2, studentFeedback: 4.5 },
  { department: 'Science', teachers: 4, averageRating: 4.0, studentFeedback: 4.3 },
  { department: 'English', teachers: 6, averageRating: 4.3, studentFeedback: 4.6 },
  { department: 'Social Studies', teachers: 3, averageRating: 3.9, studentFeedback: 4.1 },
  { department: 'Arts', teachers: 2, averageRating: 4.5, studentFeedback: 4.7 }
];

const teacherPerformanceData = [
  { name: 'Rajesh Kumar', department: 'Mathematics', rating: 4.5, classes: 3 },
  { name: 'Sunita Reddy', department: 'Science', rating: 4.2, classes: 2 },
  { name: 'Priya Sharma', department: 'English', rating: 4.7, classes: 4 },
  { name: 'Manoj Nair', department: 'Social Studies', rating: 3.8, classes: 2 },
  { name: 'Anita Desai', department: 'Arts', rating: 4.8, classes: 1 }
];

const performanceDistributionData = [
  { name: 'Excellent (4.5-5.0)', value: 30 },
  { name: 'Good (3.5-4.4)', value: 50 },
  { name: 'Average (2.5-3.4)', value: 15 },
  { name: 'Below Average (0-2.4)', value: 5 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function StaffPerformanceReport() {
  const handleExport = () => {
    // In a real app, this would export the report data
    alert('Staff performance report exported successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Staff Performance Report</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Performance metrics for teaching and administrative staff
          </p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Performance by Department */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <CardTitle>Performance by Department</CardTitle>
          </div>
          <CardDescription>
            Average performance ratings by department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={staffPerformanceData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis domain={[3, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageRating" fill="#3b82f6" name="Average Rating" />
                <Bar dataKey="studentFeedback" fill="#10b981" name="Student Feedback" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Teachers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <CardTitle>Top Performing Teachers</CardTitle>
            </div>
            <CardDescription>
              Highest rated teachers by performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={teacherPerformanceData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[3, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rating" fill="#8b5cf6" name="Performance Rating" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              <CardTitle>Performance Distribution</CardTitle>
            </div>
            <CardDescription>
              Distribution of staff across performance categories
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
            <TrendingUp className="h-5 w-5 text-green-500" />
            <CardTitle>Performance Trend</CardTitle>
          </div>
          <CardDescription>
            Staff performance trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { month: 'Apr', rating: 3.8 },
                  { month: 'May', rating: 4.0 },
                  { month: 'Jun', rating: 4.1 },
                  { month: 'Jul', rating: 4.2 },
                  { month: 'Aug', rating: 4.3 },
                  { month: 'Sep', rating: 4.4 },
                  { month: 'Oct', rating: 4.5 }
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
                <YAxis domain={[3, 5]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="rating" 
                  stroke="#10b981" 
                  activeDot={{ r: 8 }} 
                  name="Average Rating" 
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