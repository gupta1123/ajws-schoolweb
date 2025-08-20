// src/components/calendar/event-creation-wizard.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  User,
  School,
  CheckCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { academicServices } from '@/lib/api/academic';
import { useAuth } from '@/lib/auth/context';
import type { ClassDivision } from '@/types/academic';
import { formatDate } from '@/lib/utils';

// Mock data for other fields (keeping these for now)
const mockRooms = [
  { id: '1', name: 'Science Lab', capacity: 30 },
  { id: '2', name: 'Computer Lab', capacity: 25 },
  { id: '3', name: 'Auditorium', capacity: 200 },
  { id: '4', name: 'Library', capacity: 50 },
  { id: '5', name: 'Art Room', capacity: 20 }
];

interface EventFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  eventType: 'school_wide' | 'class_specific' | 'teacher_specific';
  classDivisionId: string | undefined;
  roomId: string | undefined;
  requiresApproval: boolean;
  category: 'uniform' | 'birthday' | 'leave' | 'meeting' | 'room_booking';
  uniform: string;
}

interface EventCreationWizardProps {
  initialDate?: string;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function EventCreationWizard({ 
  initialDate, 
  onSubmit, 
  onCancel, 
  isLoading 
}: EventCreationWizardProps) {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [classDivisions, setClassDivisions] = useState<ClassDivision[]>([]);
  const [loadingClassDivisions, setLoadingClassDivisions] = useState(false);
  
  // Initialize form data with date from URL params or initialDate
  const getDefaultDate = () => {
    if (searchParams.get('date')) return searchParams.get('date')!;
    if (initialDate) return initialDate;
    
    // Create date in local timezone without UTC conversion
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const dateFromParams = getDefaultDate();
  
  // Debug: log the date processing
  console.log('Event Creation Wizard: searchParams.get("date"):', searchParams.get('date'));
  console.log('Event Creation Wizard: initialDate:', initialDate);
  console.log('Event Creation Wizard: dateFromParams:', dateFromParams);
  console.log('Event Creation Wizard: current timezone offset:', new Date().getTimezoneOffset());
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: dateFromParams,
    startTime: '09:00',
    endTime: '10:00',
    eventType: 'school_wide' as 'school_wide' | 'class_specific' | 'teacher_specific',
    classDivisionId: undefined as string | undefined,
    roomId: undefined as string | undefined,
    requiresApproval: false,
    category: 'meeting' as 'uniform' | 'birthday' | 'leave' | 'meeting' | 'room_booking',
    uniform: ''
  });

  // Fetch class divisions on component mount
  useEffect(() => {
    const fetchClassDivisions = async () => {
      if (!token) return;
      
      try {
        setLoadingClassDivisions(true);
        const response = await academicServices.getClassDivisions(token);
        
        if (response.status === 'success' && response.data) {
          setClassDivisions(response.data.class_divisions);
        }
      } catch (err) {
        console.error('Error fetching class divisions:', err);
      } finally {
        setLoadingClassDivisions(false);
      }
    };

    fetchClassDivisions();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const getCategoryOptions = () => {
    return [
      { value: 'uniform', label: 'Uniform' },
      { value: 'birthday', label: 'Birthday' },
      { value: 'leave', label: 'Leave' },
      { value: 'meeting', label: 'Meeting' },
      { value: 'room_booking', label: 'Room Booking' }
    ];
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>
            Step {step} of 3 - Fill in the details for your new event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= stepNum 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {step > stepNum ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    stepNum
                  )}
                </div>
                {stepNum < 3 && (
                  <div className={`h-1 w-16 mx-2 ${
                    step > stepNum ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Event Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

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

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select 
                  value={formData.eventType} 
                  onValueChange={(value) => handleSelectChange('eventType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school_wide">
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4" />
                        School Wide Event
                      </div>
                    </SelectItem>
                    <SelectItem value="class_specific">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Class Specific Event
                      </div>
                    </SelectItem>
                    <SelectItem value="teacher_specific">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Teacher Specific Event
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoryOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Additional Details */}
          {step === 2 && (
            <div className="space-y-4">
              {formData.eventType === 'class_specific' && (
                <div className="space-y-2">
                  <Label htmlFor="classDivisionId">Class Division</Label>
                  <Select 
                    value={formData.classDivisionId || ''} 
                    onValueChange={(value) => handleSelectChange('classDivisionId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingClassDivisions ? (
                        <div className="flex items-center px-2 py-1.5 text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading classes...
                        </div>
                      ) : classDivisions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No classes found.
                        </div>
                      ) : (
                        classDivisions.map(division => (
                          <SelectItem key={division.id} value={division.id}>
                            {division.class_level?.name} - Section {division.division}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

                  {formData.category === 'meeting' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="roomId">Room</Label>
                        <Select
                          value={formData.roomId || ''}
                          onValueChange={(value) => handleSelectChange('roomId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a room" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockRooms.map(room => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.name} (Capacity: {room.capacity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {formData.category === 'room_booking' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="roomId">Room</Label>
                        <Select
                          value={formData.roomId || ''}
                          onValueChange={(value) => handleSelectChange('roomId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a room" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockRooms.map(room => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.name} (Capacity: {room.capacity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {formData.category === 'uniform' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="uniform">Uniform Type</Label>
                        <Input
                          id="uniform"
                          name="uniform"
                          value={formData.uniform}
                          onChange={handleInputChange}
                          placeholder="e.g., Summer, Winter, Sports"
                        />
                      </div>
                    </div>
                  )}

              <div className="flex items-center space-x-2 pt-4">
                <input
                  id="requiresApproval"
                  type="checkbox"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="requiresApproval">Requires Approval</Label>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <Card className="border">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">{formData.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {formData.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(formData.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.startTime} - {formData.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{formData.eventType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{formData.category}</span>
                    </div>
                  </div>
                  
                  {formData.classDivisionId && (
                    <div className="mt-2 pt-2 border-t flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {classDivisions.find(d => d.id === formData.classDivisionId)?.class_level?.name} - Section {classDivisions.find(d => d.id === formData.classDivisionId)?.division}
                      </span>
                    </div>
                  )}
                  
                  {formData.uniform && (
                    <div className="mt-2 pt-2 border-t flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <strong>Uniform:</strong> {formData.uniform}
                      </span>
                    </div>
                  )}
                  
                  {formData.roomId && (
                    <div className="mt-2 pt-2 border-t flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {mockRooms.find(r => r.id === formData.roomId)?.name}
                      </span>
                    </div>
                  )}
                  
                  {formData.requiresApproval && (
                    <div className="mt-2 pt-2 border-t flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Requires Approval</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-md p-3">
                <p className="text-sm">
                  <span className="font-medium">Note:</span> After creating this event, 
                  {formData.requiresApproval ? (
                    <span> it will need to be approved before it appears on the calendar.</span>
                  ) : (
                    <span> it will be added to the calendar immediately.</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={step === 1 ? onCancel : prevStep}
            disabled={isLoading}
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          {step < 3 ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}