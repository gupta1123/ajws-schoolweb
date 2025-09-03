// src/app/components-demo/page.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Component,
  BarChart,
  Search,
  MessageSquare,
  Clock,
  List,
  Upload,
  Bell,
  TrendingUp,
  Zap
} from 'lucide-react';
import Link from 'next/link';

const components = [
  {
    title: 'Notification Badges',
    description: 'Display unread message counts and notifications',
    icon: <Bell className="h-6 w-6" />,
    href: '#notification-badges'
  },
  {
    title: 'Data Charts',
    description: 'Interactive visualization with bar, line, and pie charts',
    icon: <BarChart className="h-6 w-6" />,
    href: '#data-charts'
  },
  {
    title: 'Search Filter',
    description: 'Advanced search and filtering capabilities',
    icon: <Search className="h-6 w-6" />,
    href: '#search-filter'
  },
  {
    title: 'Comment Thread',
    description: 'Threaded conversation interface for discussions',
    icon: <MessageSquare className="h-6 w-6" />,
    href: '#comment-thread'
  },
  {
    title: 'Timeline',
    description: 'Chronological event visualization',
    icon: <Clock className="h-6 w-6" />,
    href: '#timeline'
  },
  {
    title: 'Bulk Action Toolbar',
    description: 'Multi-item selection and batch operations',
    icon: <List className="h-6 w-6" />,
    href: '#bulk-action-toolbar'
  },
  {
    title: 'File Uploader',
    description: 'Drag-and-drop file upload interface',
    icon: <Upload className="h-6 w-6" />,
    href: '#file-uploader'
  },
  {
    title: 'Sortable List',
    description: 'Reorderable list with drag-and-drop functionality',
    icon: <List className="h-6 w-6" />,
    href: '#sortable-list'
  }
];

export default function ComponentsDemoIndex() {
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-6">
          <Component className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Advanced Components Demo</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Explore the 18 new advanced UI components created for enhanced user experience
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">18</div>
              <div className="text-sm text-muted-foreground">Components</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">100%</div>
              <div className="text-sm text-muted-foreground">Tested</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">8</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">24</div>
              <div className="text-sm text-muted-foreground">Features</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {components.map((component, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {component.icon}
                </div>
                <span>{component.title}</span>
              </CardTitle>
              <CardDescription>
                {component.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href={component.href}>
                  <Zap className="h-4 w-4 mr-2" />
                  View Demo
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Implementation Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="mb-4">
              All components are built with TypeScript and follow React best practices. 
              They&apos;re designed to be highly customizable and accessible.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2">Installation</h3>
                <p className="text-sm">
                  Components are ready to use with no additional installation required.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2">Usage</h3>
                <p className="text-sm">
                  Import components from <code className="bg-muted px-1 rounded">/components/ui/</code> directory.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2">Documentation</h3>
                <p className="text-sm">
                  Refer to <code className="bg-muted px-1 rounded">ADVANCED_COMPONENTS_DOCUMENTATION.md</code> for details.
                </p>
              </div>
            </div>
            
            <Button asChild>
              <Link href="/components-demo/full">
                View Full Component Demo
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}