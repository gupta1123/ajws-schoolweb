// src/app/components-demo/full/page.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { DataChart } from '@/components/ui/data-chart';
import { SearchFilter } from '@/components/ui/search-filter';
import { CommentThread } from '@/components/ui/comment-thread';
import { Timeline } from '@/components/ui/timeline';
import { BulkActionToolbar } from '@/components/ui/bulk-action-toolbar';
import { FileUploader } from '@/components/ui/file-uploader';
import { SortableList } from '@/components/ui/sortable-list';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { StatCard } from '@/components/ui/stat-card';
import { QuickActionButton } from '@/components/ui/quick-action-button';
import { 
  BookOpen, 
  Users, 
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Mail,
  Download,
  Trash2,
  Bell,
  BarChart,
  Search,
  List,
  Upload,
  Zap
} from 'lucide-react';
import { useState } from 'react';

// Mock data for charts
const mockChartData = [
  { name: 'Math', score: 85 },
  { name: 'Science', score: 78 },
  { name: 'English', score: 92 },
  { name: 'History', score: 88 },
  { name: 'Art', score: 95 },
];

// Mock data for comments
const mockComments = [
  {
    id: '1',
    author: {
      id: '1',
      name: 'John Doe',
      role: 'teacher'
    },
    content: 'Great progress on the mathematics assignment!',
    timestamp: '2025-08-15T10:30:00Z',
    likes: 5,
    replies: [
      {
        id: '1-1',
        author: {
          id: '2',
          name: 'Jane Smith',
          role: 'parent'
        },
        content: 'Thank you! Aarav worked really hard on it.',
        timestamp: '2025-08-15T11:15:00Z',
        likes: 2,
        replies: []
      }
    ]
  },
  {
    id: '2',
    author: {
      id: '3',
      name: 'Robert Johnson',
      role: 'teacher'
    },
    content: 'Reminder: Parent-teacher conferences next week.',
    timestamp: '2025-08-14T14:20:00Z',
    likes: 8,
    replies: []
  }
];

// Mock data for timeline
const mockTimelineEvents = [
  {
    id: '1',
    title: 'Homework Assigned',
    description: 'Mathematics - Chapter 3 exercises',
    type: 'info' as const,
    timestamp: '2025-08-15T09:00:00Z',
    author: {
      name: 'Sarah Wilson',
      role: 'teacher'
    }
  },
  {
    id: '2',
    title: 'Exam Results Published',
    description: 'Science mid-term results are now available',
    type: 'success' as const,
    timestamp: '2025-08-14T15:30:00Z',
    author: {
      name: 'Dr. Johnson',
      role: 'teacher'
    }
  },
  {
    id: '3',
    title: 'Parent Meeting Scheduled',
    description: 'Monthly parent-teacher conference',
    type: 'warning' as const,
    timestamp: '2025-08-13T11:00:00Z'
  }
];

// Mock data for sortable list
const mockSortableItems = [
  { id: '1', content: 'Mathematics Homework - Fractions', priority: 'high' },
  { id: '2', content: 'Science Project - Photosynthesis', priority: 'medium' },
  { id: '3', content: 'English Essay - My Summer Vacation', priority: 'low' },
  { id: '4', content: 'History Presentation - Ancient Civilizations', priority: 'medium' },
];

export default function FullComponentsDemoPage() {
  const [selectedCount, setSelectedCount] = useState(0);
  const [sortableItems, setSortableItems] = useState(mockSortableItems);

  const handleSortableItemsChange = (items: Array<{ id: string; content: React.ReactNode; [key: string]: unknown }>) => {
    // Convert back to our specific type
    const convertedItems = items.map(item => ({
      id: item.id,
      content: typeof item.content === 'string' ? item.content : 'Unknown content',
      priority: (item as { priority?: string }).priority || 'medium'
    }));
    setSortableItems(convertedItems);
  };

  const handleBulkAction = (action: string) => {
    alert(`Performing ${action} on ${selectedCount} items`);
    setSelectedCount(0);
  };

  const handleFilesSelected = (files: File[]) => {
    console.log('Selected files:', files);
  };

  const handleUpload = async (files: File[]) => {
    // Simulate upload process
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Uploaded files:', files);
        resolve();
      }, 2000);
    });
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Advanced Components Demo</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Showcase of all new advanced UI components
        </p>
      </div>

      {/* Notification Badges */}
      <section id="notification-badges" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Badges
            </CardTitle>
            <CardDescription>
              Display unread message counts or notification indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span>Messages</span>
              <NotificationBadge count={5} variant="destructive" />
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <span>Notifications</span>
              <NotificationBadge count={12} variant="default" />
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Alerts</span>
              <NotificationBadge count={3} variant="warning" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Data Charts */}
      <section id="data-charts" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Data Charts
            </CardTitle>
            <CardDescription>
              Interactive visualization components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DataChart
                title="Student Performance by Subject"
                data={mockChartData}
                type="bar"
                dataKey="score"
                xAxisKey="name"
                height={300}
              />
              <DataChart
                title="Assignment Completion Rate"
                data={[
                  { week: 'Week 1', completion: 75 },
                  { week: 'Week 2', completion: 82 },
                  { week: 'Week 3', completion: 88 },
                  { week: 'Week 4', completion: 92 },
                ]}
                type="line"
                dataKey="completion"
                xAxisKey="week"
                height={300}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Search Filter */}
      <section id="search-filter" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Filter
            </CardTitle>
            <CardDescription>
              Advanced search and filtering capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchFilter
              onSearch={(query) => console.log('Searching for:', query)}
              filters={[
                { key: 'status', label: 'Status', type: 'select', options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'pending', label: 'Pending' }
                ]},
                { key: 'featured', label: 'Featured', type: 'checkbox' }
              ]}
            />
          </CardContent>
        </Card>
      </section>

      {/* Progress Indicators */}
      <section id="progress-indicators" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Progress Indicators
            </CardTitle>
            <CardDescription>
              Status-based progress indication
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <ProgressIndicator status="pending" />
            <ProgressIndicator status="in-progress" />
            <ProgressIndicator status="completed" />
            <ProgressIndicator status="failed" />
            <ProgressIndicator status="cancelled" />
          </CardContent>
        </Card>
      </section>

      {/* Stat Cards */}
      <section id="stat-cards" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stat Cards
            </CardTitle>
            <CardDescription>
              Metric display with trend information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Students"
                value="1,247"
                description="Across all grades"
                trend="up"
                trendValue="+12%"
                icon={<Users className="h-5 w-5" />}
              />
              <StatCard
                title="Attendance Rate"
                value="94.2%"
                description="This month"
                trend="up"
                trendValue="+2.3%"
                icon={<CheckCircle className="h-5 w-5" />}
              />
              <StatCard
                title="Pending Approvals"
                value="12"
                description="Awaiting review"
                trend="down"
                trendValue="-3"
                icon={<Clock className="h-5 w-5" />}
              />
              <StatCard
                title="Messages Sent"
                value="89"
                description="This week"
                trend="neutral"
                trendValue="Stable"
                icon={<MessageSquare className="h-5 w-5" />}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Action Buttons */}
      <section id="quick-action-buttons" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Action Buttons
            </CardTitle>
            <CardDescription>
              Vertically oriented action buttons with icons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickActionButton
                href="#"
                icon={<BookOpen className="h-6 w-6" />}
                label="Homework"
                description="Create assignments"
              />
              <QuickActionButton
                href="#"
                icon={<FileText className="h-6 w-6" />}
                label="Classwork"
                description="Record activities"
              />
              <QuickActionButton
                href="#"
                icon={<Users className="h-6 w-6" />}
                label="Students"
                description="Manage roster"
              />
              <QuickActionButton
                href="#"
                icon={<Calendar className="h-6 w-6" />}
                label="Calendar"
                description="Schedule events"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bulk Action Toolbar */}
      <section id="bulk-action-toolbar" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Bulk Action Toolbar
            </CardTitle>
            <CardDescription>
              Multi-item selection and batch operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkActionToolbar
              selectedCount={selectedCount}
              onClearSelection={() => setSelectedCount(0)}
              actions={[
                {
                  label: 'Message',
                  icon: <Mail className="h-4 w-4" />,
                  onClick: () => handleBulkAction('message'),
                  variant: 'outline'
                },
                {
                  label: 'Export',
                  icon: <Download className="h-4 w-4" />,
                  onClick: () => handleBulkAction('export'),
                  variant: 'outline'
                },
                {
                  label: 'Delete',
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: () => handleBulkAction('delete'),
                  variant: 'destructive'
                }
              ]}
            />
            
            <div className="mt-4 space-y-2">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 rounded-lg border">
                  <input
                    type="checkbox"
                    checked={selectedCount >= item}
                    onChange={(e) => setSelectedCount(e.target.checked ? item : item - 1)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Item {item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* File Uploader */}
      <section id="file-uploader" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Uploader
            </CardTitle>
            <CardDescription>
              Drag-and-drop file upload interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              onFilesSelected={handleFilesSelected}
              onUpload={handleUpload}
              maxFiles={3}
              maxSize={5}
              accept=".pdf,.doc,.docx,.jpg,.png"
            />
          </CardContent>
        </Card>
      </section>

      {/* Sortable List */}
      <section id="sortable-list" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Sortable List
            </CardTitle>
            <CardDescription>
              Reorderable list with drag-and-drop functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SortableList
              items={sortableItems}
              onChange={handleSortableItemsChange}
              renderItem={(item) => (
                <div className="flex items-center justify-between p-3">
                  <span>{item.content}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                    {(item as { priority?: string }).priority}
                  </span>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </section>

      {/* Comment Thread */}
      <section id="comment-thread" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comment Thread
            </CardTitle>
            <CardDescription>
              Threaded conversation interface for discussions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CommentThread
              comments={mockComments}
              onAddComment={(content, parentId) => {
                console.log('Adding comment:', { content, parentId });
              }}
            />
          </CardContent>
        </Card>
      </section>

      {/* Timeline */}
      <section id="timeline" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
            <CardDescription>
              Chronological event visualization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline events={mockTimelineEvents} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}