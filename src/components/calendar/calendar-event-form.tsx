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
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/date-picker';

// This component should receive real data as props instead of using mock data
// The parent component should fetch and pass the required data

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

interface ClassDivision {
  id: string;
  level: {
    name: string;
  };
  division: string;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface CalendarEventFormProps {
  initialData?: Partial<CalendarEventFormData>;
  onSubmit: (data: CalendarEventFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  classDivisions?: ClassDivision[];
  rooms?: Room[];
  teachers?: Teacher[];
}

export function CalendarEventForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  classDivisions = [],
  rooms = [],
  teachers = []
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

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Format date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setFormData(prev => ({
        ...prev,
        eventDate: formattedDate
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        eventDate: ''
      }));
    }
  };

  const handleStartTimeChange = (time: string) => {
    setFormData(prev => ({
      ...prev,
      startTime: time
    }));
  };

  const handleEndTimeChange = (time: string) => {
    setFormData(prev => ({
      ...prev,
      endTime: time
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      type: eventType
    });
  };

  // Convert string date to Date object for DatePicker
  const selectedDate = formData.eventDate ? new Date(formData.eventDate) : undefined;

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
                <DatePicker 
                  date={selectedDate} 
                  onDateChange={handleDateChange} 
                  placeholder="Pick a date"
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
                className="border rounded-md px-3 py-2 w-full dark:bg-background dark:border-gray-700 dark:text-foreground"
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
                <TimePicker 
                  time={formData.startTime} 
                  onTimeChange={handleStartTimeChange} 
                  placeholder="Select start time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <TimePicker 
                  time={formData.endTime} 
                  onTimeChange={handleEndTimeChange} 
                  placeholder="Select end time"
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
                  {classDivisions.map(division => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.level.name} - Section {division.division}
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
                  {rooms.map(room => (
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
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
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
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
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