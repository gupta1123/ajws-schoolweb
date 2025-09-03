// src/components/reports/communication-report.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, MessageSquare, Mail, Bell, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for communication reports
const messageVolumeData = [
  { month: 'Apr', teacherToParent: 120, adminToStaff: 45, adminToParent: 30 },
  { month: 'May', teacherToParent: 150, adminToStaff: 52, adminToParent: 35 },
  { month: 'Jun', teacherToParent: 180, adminToStaff: 48, adminToParent: 40 },
  { month: 'Jul', teacherToParent: 200, adminToStaff: 55, adminToParent: 45 },
  { month: 'Aug', teacherToParent: 220, adminToStaff: 60, adminToParent: 50 },
  { month: 'Sep', teacherToParent: 190, adminToStaff: 58, adminToParent: 48 },
  { month: 'Oct', teacherToParent: 160, adminToStaff: 50, adminToParent: 42 }
];

const messageTypeData = [
  { type: 'Homework', count: 320, percentage: 45 },
  { type: 'General Announcement', count: 180, percentage: 25 },
  { type: 'Meeting Invitation', count: 120, percentage: 17 },
  { type: 'Leave Request', count: 90, percentage: 13 }
];

const responseRateData = [
  { name: 'Within 1 hour', value: 25 },
  { name: 'Within 1 day', value: 50 },
  { name: 'Within 3 days', value: 20 },
  { name: 'More than 3 days', value: 5 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function CommunicationReport() {
  const handleExport = () => {
    // In a real app, this would export the report data
    alert('Communication report exported successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Communication Report</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Communication metrics and statistics
          </p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Message Volume */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <CardTitle>Message Volume</CardTitle>
          </div>
          <CardDescription>
            Number of messages sent by different user types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={messageVolumeData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="teacherToParent" fill="#3b82f6" name="Teacher to Parent" />
                <Bar dataKey="adminToStaff" fill="#10b981" name="Admin to Staff" />
                <Bar dataKey="adminToParent" fill="#8b5cf6" name="Admin to Parent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Message Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-500" />
              <CardTitle>Message Types</CardTitle>
            </div>
            <CardDescription>
              Distribution of messages by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={messageTypeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8b5cf6" name="Message Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Response Rate */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" />
              <CardTitle>Response Rate</CardTitle>
            </div>
            <CardDescription>
              Time taken to respond to messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={responseRateData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  >
                    {responseRateData.map((entry, index) => (
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

      {/* Communication Trend */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            <CardTitle>Communication Trend</CardTitle>
          </div>
          <CardDescription>
            Communication trends over the academic year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { month: 'Apr', totalMessages: 195, responseRate: 78 },
                  { month: 'May', totalMessages: 237, responseRate: 82 },
                  { month: 'Jun', totalMessages: 268, responseRate: 85 },
                  { month: 'Jul', totalMessages: 315, responseRate: 87 },
                  { month: 'Aug', totalMessages: 360, responseRate: 89 },
                  { month: 'Sep', totalMessages: 308, responseRate: 91 },
                  { month: 'Oct', totalMessages: 252, responseRate: 92 }
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
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[70, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="totalMessages" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 8 }} 
                  name="Total Messages" 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="responseRate" 
                  stroke="#10b981" 
                  activeDot={{ r: 8 }} 
                  name="Response Rate (%)" 
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