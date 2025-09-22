// src/components/calendar/event-creation-wizard.tsx

'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Edit3,
  User
} from 'lucide-react';
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
import { useI18n } from '@/lib/i18n/context';


interface EventFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  isFullDay: boolean;
  eventType: 'school_wide' | 'class_specific' | 'teacher_specific';
  classDivisionIds: string[];
  eventCategory: 'general' | 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';
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
  const { token, user } = useAuth();
  const { t } = useI18n();
  const [classDivisions, setClassDivisions] = useState<ClassDivision[]>([]);
  const [loadingClassDivisions, setLoadingClassDivisions] = useState(false);
  
  

  

  
  // Get default form data based on edit mode or initial values
  const defaultFormData = useMemo((): EventFormData => {
    if (event) {
      // Edit mode - populate form with existing event data
      return {
        title: event.title || '',
        description: event.description || '',
        date: event.event_date ? event.event_date.split('T')[0] : '',
        startTime: event.start_time ? event.start_time.substring(0, 5) : '09:00',
        endTime: event.end_time ? event.end_time.substring(0, 5) : '10:00',
        isFullDay: !event.start_time && !event.end_time,
        eventType: (event.event_type as 'school_wide' | 'class_specific' | 'teacher_specific') || 'school_wide',
        classDivisionIds: event.class_division_id ? [event.class_division_id] : [],
        eventCategory: (event.event_category as 'general' | 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other') || 'general'
      };
    } else {
      // Create mode - set default values
      return {
        title: '',
        description: '',
        date: initialDate || '',
        startTime: '09:00',
        endTime: '10:00',
        isFullDay: false,
        eventType: 'school_wide' as 'school_wide' | 'class_specific' | 'teacher_specific',
        classDivisionIds: [],
        eventCategory: 'general' as const
      };
    }
  }, [event, initialDate]);

  // Set form data when defaultFormData changes
  useEffect(() => {
    setFormData(defaultFormData);
  }, [defaultFormData]);

  const [formData, setFormData] = useState<EventFormData>(defaultFormData);

  // Update form data when event or initialDate changes (for edit mode)
  useEffect(() => {
    if (event || initialDate) {
      console.log('Setting form data for edit mode:', defaultFormData);
      setFormData(defaultFormData);
    }
  }, [event, initialDate, defaultFormData]);

  // Fetch class divisions on component mount
  useEffect(() => {
    const fetchClassDivisions = async () => {
      if (!token) {
        return;
      }
      
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



  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-2xl flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit3 className="h-6 w-6" />
                {t('calendar.form.editTitle', 'Edit Event')}
              </>
            ) : (
              t('calendar.form.createTitle', 'Create New Event')
            )}
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? t('calendar.form.editSubtitle', 'Update the details for this event') 
              : t('calendar.form.createSubtitle', 'Fill in the details for your new event')}
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
                    {t('calendar.form.labels.title', 'Event Title')}
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder={t('calendar.form.placeholders.title', 'e.g., School Assembly, Sports Day, etc.')}
                    required
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('calendar.form.labels.description', 'Description')}
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t('calendar.form.placeholders.description', 'Enter event description')}
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
                        {t('calendar.form.labels.selectClassDivisions', 'Select Class Divisions')}
                      </Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleSelectAllDivisions}
                        className="h-9 px-3"
                      >
                        {formData.classDivisionIds.length === classDivisions.length ? t('calendar.form.actions.deselectAll', 'Deselect All') : t('calendar.form.actions.selectAll', 'Select All')}
                      </Button>
                    </div>
                    
                    {loadingClassDivisions ? (
                      <div className="flex items-center justify-center p-6">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('calendar.form.loadingClasses', 'Loading classes...')}
                      </div>
                    ) : classDivisions.length === 0 ? (
                      <div className="text-center p-6 text-muted-foreground border rounded-lg">
                        {t('calendar.form.noClasses', 'No classes found.')}
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
                    {t('calendar.form.section.details', 'Event Details')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Date Field */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('calendar.form.labels.date', 'Date')}
                    </Label>
                    <Input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="h-10"
                      required
                    />
                  </div>
                  
                  {/* Time Fields */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t('calendar.form.labels.time', 'Time')}
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
                        <Label htmlFor="sidebar-isFullDay" className="text-sm">{t('calendar.form.labels.fullDay', 'Full Day')}</Label>
                      </div>
                    </div>
                    
                    {!formData.isFullDay && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">{t('calendar.form.labels.start', 'Start')}</Label>
                          <Input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleInputChange}
                            className="h-10"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">{t('calendar.form.labels.end', 'End')}</Label>
                          <Input
                            type="time"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleInputChange}
                            className="h-10"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Event Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('calendar.form.labels.eventType', 'Event Type')}</Label>
                    <Select 
                      value={formData.eventType} 
                      onValueChange={(value) => handleSelectChange('eventType', value)}
                    >
                      <SelectTrigger className="h-10 text-base">
                        <SelectValue placeholder={t('calendar.form.placeholders.eventType', 'Select event type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school_wide">
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4" />
                            <span>{t('calendar.form.eventType.school_wide', 'School Wide')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="class_specific">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{t('calendar.form.eventType.class_specific', 'Class Specific')}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="teacher_specific">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{t('calendar.form.eventType.teacher_specific', 'Teacher Specific')}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Event Category */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('calendar.form.labels.category', 'Event Category')}</Label>
                    <Select 
                      value={formData.eventCategory} 
                      onValueChange={(value) => handleSelectChange('eventCategory', value)}
                    >
                      <SelectTrigger className="h-10 text-base">
                        <SelectValue placeholder={t('calendar.form.placeholders.category', 'Select category')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{t('calendar.form.category.general', 'General')}</SelectItem>
                        <SelectItem value="academic">{t('calendar.form.category.academic', 'Academic')}</SelectItem>
                        <SelectItem value="sports">{t('calendar.form.category.sports', 'Sports')}</SelectItem>
                        <SelectItem value="cultural">{t('calendar.form.category.cultural', 'Cultural')}</SelectItem>
                        <SelectItem value="holiday">{t('calendar.form.category.holiday', 'Holiday')}</SelectItem>
                        <SelectItem value="exam">{t('calendar.form.category.exam', 'Exam')}</SelectItem>
                        <SelectItem value="meeting">{t('calendar.form.category.meeting', 'Meeting')}</SelectItem>
                        <SelectItem value="other">{t('calendar.form.category.other', 'Other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Event Summary */}
                  <div className="space-y-3 pt-2 border-t dark:border-gray-700">
                    <h3 className="text-sm font-medium text-muted-foreground">{t('calendar.form.summary.title', 'Event Summary')}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('calendar.form.summary.date', 'Date:')}</span>
                        <span className="font-medium">
                          {formData.date 
                            ? new Date(formData.date).toLocaleDateString(undefined, { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : t('calendar.form.summary.notSelected', 'Not selected')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('calendar.form.summary.time', 'Time:')}</span>
                        <span className="font-medium">
                          {formData.isFullDay ? t('calendar.form.labels.fullDay', 'Full Day') : `${formatTime(formData.startTime)} - ${formatTime(formData.endTime)}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('calendar.form.summary.type', 'Type:')}</span>
                        <span className="font-medium">
                          {formData.eventType === 'school_wide' ? t('calendar.form.eventType.school_wide', 'School Wide') : formData.eventType === 'class_specific' ? t('calendar.form.eventType.class_specific', 'Class Specific') : t('calendar.form.eventType.teacher_specific', 'Teacher Specific')}
                        </span>
                      </div>
                      {formData.eventType === 'class_specific' && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('calendar.form.summary.classes', 'Classes:')}</span>
                          <span className="font-medium">
                            {formData.classDivisionIds.length} {t('calendar.form.summary.selected', 'selected')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('calendar.form.summary.category', 'Category:')}</span>
                        <span className="font-medium capitalize">
                          {t(`calendar.form.category.${formData.eventCategory}`, formData.eventCategory)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium">{t('calendar.form.approvalRequiredTitle', 'Approval Required')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('calendar.form.approvalRequiredDesc', 'All events require approval from the Principal before they appear on the calendar.')}
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
            {t('actions.cancel', 'Cancel')}
          </Button>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="h-11 px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? t('calendar.form.updating', 'Updating...') : t('calendar.form.creating', 'Creating...')}
              </>
            ) : (
              isEditMode ? t('calendar.form.update', 'Update Event') : t('calendar.form.create', 'Create Event')
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
