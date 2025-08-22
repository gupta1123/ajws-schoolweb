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
  BookOpen, 
  School,
  Loader2,
  Check,
  Users,
  Info,
  Hash,
  FileText,
  Edit3
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
import type { CalendarEvent } from '@/lib/api/calendar';
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/date-picker';

interface EventFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  isFullDay: boolean;
  eventType: 'school_wide' | 'class_specific';
  classDivisionIds: string[];
}

interface EventCreationWizardProps {
  initialDate?: string;
  event?: CalendarEvent; // Optional event for edit mode
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function EventCreationWizard({ 
  initialDate, 
  event, // Event prop for edit mode
  onSubmit, 
  onCancel, 
  isLoading 
}: EventCreationWizardProps) {
  const searchParams = useSearchParams();
  const { token } = useAuth();
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
  
  // Initialize form data - with event data for edit mode or defaults for create mode
  const initializeFormData = () => {
    if (event) {
      // Edit mode - populate form with existing event data
      // Convert event_date to local date string
      let eventDateStr = '';
      if (event.event_date_ist) {
        // Parse the IST date manually to avoid timezone conversion issues
        const istDateMatch = event.event_date_ist.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (istDateMatch) {
          const [, year, month, day] = istDateMatch;
          eventDateStr = `${year}-${month}-${day}`;
        } else {
          // Fallback to regular parsing
          const eventDate = new Date(event.event_date_ist);
          eventDateStr = eventDate.toISOString().split('T')[0];
        }
      } else {
        // Use regular event_date if IST is not available
        const eventDate = new Date(event.event_date);
        eventDateStr = eventDate.toISOString().split('T')[0];
      }
      
      return {
        title: event.title || '',
        description: event.description || '',
        date: eventDateStr,
        startTime: event.start_time || '09:00',
        endTime: event.end_time || '10:00',
        isFullDay: event.is_single_day ?? false,
        eventType: (event.event_type as 'school_wide' | 'class_specific') || 'school_wide',
        classDivisionIds: event.class_division_id ? [event.class_division_id] : [] as string[]
      };
    } else {
      // Create mode - use defaults
      const dateFromParams = getDefaultDate();
      return {
        title: '',
        description: '',
        date: dateFromParams,
        startTime: '09:00',
        endTime: '10:00',
        isFullDay: false,
        eventType: 'school_wide' as 'school_wide' | 'class_specific',
        classDivisionIds: [] as string[]
      };
    }
  };
  
  const [formData, setFormData] = useState<EventFormData>(initializeFormData());

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
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClassDivisionChange = (divisionId: string) => {
    setFormData(prev => {
      const newClassDivisionIds = prev.classDivisionIds.includes(divisionId)
        ? prev.classDivisionIds.filter(id => id !== divisionId)
        : [...prev.classDivisionIds, divisionId];
      
      return {
        ...prev,
        classDivisionIds: newClassDivisionIds
      };
    });
  };

  // Handle date change from DatePicker
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Format date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setFormData(prev => ({
        ...prev,
        date: formattedDate
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        date: ''
      }));
    }
  };

  // Handle time changes from TimePicker
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

  // Select all divisions for a specific grade
  const handleSelectAllGradeDivisions = (grade: string) => {
    const gradeDivisions = classDivisions.filter(d => d.class_level?.name === grade);
    const allGradeDivisionIds = gradeDivisions.map(d => d.id);
    
    // Check if all divisions of this grade are already selected
    const allSelected = allGradeDivisionIds.every(id => formData.classDivisionIds.includes(id));
    
    if (allSelected) {
      // Deselect all divisions of this grade
      setFormData(prev => ({
        ...prev,
        classDivisionIds: prev.classDivisionIds.filter(id => !allGradeDivisionIds.includes(id))
      }));
    } else {
      // Select all divisions of this grade
      setFormData(prev => ({
        ...prev,
        classDivisionIds: [...new Set([...prev.classDivisionIds, ...allGradeDivisionIds])]
      }));
    }
  };

  // Select all divisions
  const handleSelectAllDivisions = () => {
    if (formData.classDivisionIds.length === classDivisions.length) {
      // Deselect all
      setFormData(prev => ({
        ...prev,
        classDivisionIds: []
      }));
    } else {
      // Select all
      setFormData(prev => ({
        ...prev,
        classDivisionIds: classDivisions.map(d => d.id)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Set requiresApproval to true by default for all events
    onSubmit({
      ...formData,
      classDivisionIds: formData.eventType === 'class_specific' ? formData.classDivisionIds : []
    });
  };

  // Group class divisions by grade level
  const groupedClassDivisions = classDivisions.reduce((acc, division) => {
    const grade = division.class_level?.name || 'Unknown';
    if (!acc[grade]) {
      acc[grade] = [];
    }
    acc[grade].push(division);
    return acc;
  }, {} as Record<string, ClassDivision[]>);

  // Check if all divisions of a grade are selected
  const isGradeFullySelected = (grade: string) => {
    const gradeDivisions = classDivisions.filter(d => d.class_level?.name === grade);
    const allGradeDivisionIds = gradeDivisions.map(d => d.id);
    return allGradeDivisionIds.every(id => formData.classDivisionIds.includes(id));
  };

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Determine if we're in edit mode
  const isEditMode = !!event;

  // Convert string date to Date object for DatePicker
  const selectedDate = formData.date ? new Date(formData.date) : undefined;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-2xl flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit3 className="h-6 w-6" />
                Edit Event
              </>
            ) : (
              'Create New Event'
            )}
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Update the details for this event' 
              : 'Fill in the details for your new event'}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form Content - Title, Description, and Class Selection */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Event Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., School Assembly, Sports Day, etc."
                    required
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter event description"
                    rows={4}
                    className="text-base min-h-[120px]"
                  />
                </div>

                {/* Class Selection (only for class_specific events) */}
                {formData.eventType === 'class_specific' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Select Class Divisions
                      </Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleSelectAllDivisions}
                        className="h-9 px-3"
                      >
                        {formData.classDivisionIds.length === classDivisions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    
                    {loadingClassDivisions ? (
                      <div className="flex items-center justify-center p-6">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading classes...
                      </div>
                    ) : classDivisions.length === 0 ? (
                      <div className="text-center p-6 text-muted-foreground border rounded-lg">
                        No classes found.
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto p-1 rounded-lg border bg-muted/30 dark:bg-muted/10">
                        {Object.entries(groupedClassDivisions).map(([grade, divisions]) => {
                          const isGradeSelected = isGradeFullySelected(grade);
                          return (
                            <div key={grade} className="space-y-2 bg-background dark:bg-muted/10 rounded-lg p-3 shadow-sm">
                              <div 
                                className="flex justify-between items-center cursor-pointer p-2 rounded-md hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
                                onClick={() => handleSelectAllGradeDivisions(grade)}
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <h3 className="font-semibold text-base">{grade}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {divisions.filter(d => formData.classDivisionIds.includes(d.id)).length}/{divisions.length} selected
                                  </span>
                                  <div className={cn(
                                    "w-5 h-5 rounded border flex items-center justify-center",
                                    isGradeSelected 
                                      ? "bg-primary border-primary" 
                                      : "border-gray-300 dark:border-gray-600"
                                  )}>
                                    {isGradeSelected && (
                                      <Check className="h-3.5 w-3.5 text-white" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pl-2">
                                {divisions.map(division => (
                                  <div 
                                    key={division.id} 
                                    className={cn(
                                      "flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-all",
                                      formData.classDivisionIds.includes(division.id)
                                        ? "bg-primary/10 border border-primary shadow-sm dark:bg-primary/20"
                                        : "border hover:bg-muted dark:border-gray-700 dark:hover:bg-muted/20"
                                    )}
                                    onClick={() => handleClassDivisionChange(division.id)}
                                  >
                                    <div className={cn(
                                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                                      formData.classDivisionIds.includes(division.id)
                                        ? "bg-primary border-primary dark:bg-primary dark:border-primary"
                                        : "border-gray-300 dark:border-gray-600"
                                    )}>
                                      {formData.classDivisionIds.includes(division.id) && (
                                        <Check className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                    <span className="text-sm font-medium">Section {division.division}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Sidebar with Key-Value Fields */}
            <div className="space-y-6">
              <Card className="bg-muted/30 dark:bg-muted/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Date Field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date
                    </Label>
                    <DatePicker 
                      date={selectedDate} 
                      onDateChange={handleDateChange} 
                      placeholder="Pick a date"
                    />
                  </div>
                  
                  {/* Time Fields */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Time
                      </Label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="sidebar-isFullDay"
                          name="isFullDay"
                          type="checkbox"
                          checked={formData.isFullDay}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                        />
                        <Label htmlFor="sidebar-isFullDay" className="text-sm">Full Day</Label>
                      </div>
                    </div>
                    
                    {!formData.isFullDay && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Start</Label>
                                              <TimePicker 
                      time={formData.startTime} 
                      onTimeChange={handleStartTimeChange} 
                      placeholder="Select start time"
                    />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">End</Label>
                                                      <TimePicker 
                              time={formData.endTime} 
                              onTimeChange={handleEndTimeChange} 
                              placeholder="Select end time"
                            />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Event Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Event Type</Label>
                    <Select 
                      value={formData.eventType} 
                      onValueChange={(value) => handleSelectChange('eventType', value)}
                    >
                      <SelectTrigger className="h-10 text-base">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school_wide">
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4" />
                            <span>School Wide</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="class_specific">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>Class Specific</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Event Summary */}
                  <div className="space-y-3 pt-2 border-t dark:border-gray-700">
                    <h3 className="text-sm font-medium text-muted-foreground">Event Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">
                          {formData.date 
                            ? new Date(formData.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : 'Not selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">
                          {formData.isFullDay ? 'Full Day' : `${formatTime(formData.startTime)} - ${formatTime(formData.endTime)}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">
                          {formData.eventType === 'school_wide' ? 'School Wide' : 'Class Specific'}
                        </span>
                      </div>
                      {formData.eventType === 'class_specific' && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Classes:</span>
                          <span className="font-medium">
                            {formData.classDivisionIds.length} selected
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium">Approval Required</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All events require approval from the Principal before they appear on the calendar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/30 dark:bg-muted/10 py-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="h-11 px-6"
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-11 px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditMode ? 'Update Event' : 'Create Event'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}