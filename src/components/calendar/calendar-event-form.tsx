// src/components/calendar/calendar-event-form.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, X, Users, MapPin, BookOpen, User } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Mock data
const mockClassDivisions = [
  { id: '1', name: 'Grade 5 - Section A' },
  { id: '2', name: 'Grade 6 - Section B' },
  { id: '3', name: 'Grade 7 - Section C' }
];

const mockRooms = [
  { id: '1', name: 'Science Lab', capacity: 30 },
  { id: '2', name: 'Computer Lab', capacity: 25 },
  { id: '3', name: 'Auditorium', capacity: 200 },
  { id: '4', name: 'Library', capacity: 50 }
];

const mockTeachers = [
  { id: '1', name: 'Rajesh Kumar' },
  { id: '2', name: 'Sunita Reddy' },
  { id: '3', name: 'Priya Sharma' }
];

interface CalendarEventFormData {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  classDivisionId: string;
  roomId: string;
  teacherId: string;
  eventCategory: string;
  requiredApproval: boolean;
  type: 'school_wide' | 'class_specific' | 'room_booking' | 'leave_request';
}

interface CalendarEventFormProps {
  initialData?: Partial<CalendarEventFormData>;
  onSubmit: (data: CalendarEventFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function CalendarEventForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}: CalendarEventFormProps) {
  const [eventType, setEventType] = useState<'school_wide' | 'class_specific' | 'room_booking' | 'leave_request'>(
    initialData?.type || 'school_wide'
  );
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    eventDate: initialData?.eventDate || '',
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    classDivisionId: initialData?.classDivisionId || '',
    roomId: initialData?.roomId || '',
    teacherId: initialData?.teacherId || '',
    eventCategory: initialData?.eventCategory || 'general',
    requiredApproval: initialData?.requiredApproval || false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      type: eventType
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Edit Event' : 'Create New Event'}</CardTitle>
          <CardDescription>
            {initialData 
              ? 'Update the details for this calendar event' 
              : 'Add a new event to the school calendar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Event Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                type="button"
                variant={eventType === 'school_wide' ? 'default' : 'outline'}
                onClick={() => setEventType('school_wide')}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                School Wide
              </Button>
              <Button
                type="button"
                variant={eventType === 'class_specific' ? 'default' : 'outline'}
                onClick={() => setEventType('class_specific')}
                className="flex-1"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Class
              </Button>
              <Button
                type="button"
                variant={eventType === 'room_booking' ? 'default' : 'outline'}
                onClick={() => setEventType('room_booking')}
                className="flex-1"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Room
              </Button>
              <Button
                type="button"
                variant={eventType === 'leave_request' ? 'default' : 'outline'}
                onClick={() => setEventType('leave_request')}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-2" />
                Leave
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Parent-Teacher Meeting"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventCategory">Event Category</Label>
              <select
                id="eventCategory"
                name="eventCategory"
                value={formData.eventCategory}
                onChange={handleInputChange}
                className="border rounded-md px-3 py-2 w-full"
                required
              >
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
                <option value="holiday">Holiday</option>
                <option value="exam">Exam</option>
                <option value="meeting">Meeting</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {eventType === 'class_specific' && (
            <div className="space-y-2">
              <Label htmlFor="classDivisionId">Class Division</Label>
              <Select 
                value={formData.classDivisionId} 
                onValueChange={(value) => handleSelectChange('classDivisionId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a class</SelectItem>
                  {mockClassDivisions.map(division => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {eventType === 'room_booking' && (
            <div className="space-y-2">
              <Label htmlFor="roomId">Room</Label>
              <Select 
                value={formData.roomId} 
                onValueChange={(value) => handleSelectChange('roomId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a room</SelectItem>
                  {mockRooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} (Capacity: {room.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {eventType === 'leave_request' && (
            <div className="space-y-2">
              <Label htmlFor="teacherId">Teacher</Label>
              <Select 
                value={formData.teacherId} 
                onValueChange={(value) => handleSelectChange('teacherId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select a teacher</SelectItem>
                  {mockTeachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              id="requiredApproval"
              type="checkbox"
              checked={formData.requiredApproval}
              onChange={(e) => setFormData(prev => ({ ...prev, requiredApproval: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="requiredApproval">Requires Approval</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : (initialData ? 'Update Event' : 'Create Event')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}