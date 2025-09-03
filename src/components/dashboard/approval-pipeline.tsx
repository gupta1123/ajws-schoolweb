// src/components/dashboard/approval-pipeline.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  User,
  Check,
  X,
  Clock
} from 'lucide-react';
import Link from 'next/link';

// Mock data - in a real app this would come from an API
const mockApprovals = [
  {
    id: '1',
    type: 'message',
    title: 'Parent Meeting Announcement',
    description: 'From Rajesh Kumar to Grade 5A parents',
    status: 'pending',
    time: '2 hours ago',
    requester: 'Rajesh Kumar'
  },
  {
    id: '2',
    type: 'leave',
    title: 'Student Leave Request',
    description: 'Aarav Patel - 2 days (Fever)',
    status: 'pending',
    time: '4 hours ago',
    requester: 'Parent - Rajesh Patel'
  },
  {
    id: '3',
    type: 'alert',
    title: 'School Holiday Notice',
    description: 'Annual Sports Day - October 15th',
    status: 'pending',
    time: '1 day ago',
    requester: 'Dr. Priya Sharma'
  }
];

export function ApprovalPipeline() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Approval Pipeline
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/messages">
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockApprovals.map((approval) => (
            <div key={approval.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {approval.type === 'message' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                  {approval.type === 'leave' && <User className="h-5 w-5 text-green-500" />}
                  {approval.type === 'alert' && <MessageSquare className="h-5 w-5 text-orange-500" />}
                </div>
                <div>
                  <h3 className="font-medium text-sm">{approval.title}</h3>
                  <p className="text-muted-foreground text-xs">{approval.description}</p>
                  <p className="text-muted-foreground text-xs mt-1">{approval.requester} • {approval.time}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}