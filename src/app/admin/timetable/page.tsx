// src/app/admin/timetable/page.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { timetableApi, TimetableConfig, TimetableEntry, ClassDivisionTeachersResponse } from '@/lib/api/timetable';
import { classDivisionsServices, ClassDivision } from '@/lib/api/class-divisions';
import { academicServices } from '@/lib/api/academic';
import { apiClient } from '@/lib/api/client';
import { AcademicYear } from '@/types/academic';
import { TimetableGrid } from '@/components/timetable/timetable-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Plus,
  Settings,
  Edit,
  Save,
  Clock,
  BookOpen,
  User,
  AlertTriangle,

  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Only allow admins and principals to access this page
function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Only admins and principals can access timetable management.</p>
      </div>
    </div>
  );
}

export default function TimetablePage() {
  const { user, token } = useAuth();
  const [configs, setConfigs] = useState<TimetableConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<TimetableConfig | null>(null);
  const [classDivisions, setClassDivisions] = useState<ClassDivision[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classDivisionTeachers, setClassDivisionTeachers] = useState<ClassDivisionTeachersResponse['data']['teachers']>([]);
  const [classDivisionSubjects, setClassDivisionSubjects] = useState<Array<{id: string, name: string, code: string}>>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [timetableData, setTimetableData] = useState<Record<string, TimetableEntry[]>>({});

  // UI states
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TimetableConfig | null>(null);
  const [entryError, setEntryError] = useState<{
    type: string;
    title: string;
    message: string;
    suggestion?: string;
    constraint?: string;
  } | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const modalCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close modal when teacher conflict error occurs
  useEffect(() => {
    if (entryError && entryError.type === 'teacher_conflict' && showEntryDialog) {
      // Clear any existing timeout
      if (modalCloseTimeoutRef.current) {
        clearTimeout(modalCloseTimeoutRef.current);
      }

      // Show error alert
      setShowErrorAlert(true);

      // Auto-close modal after 3 seconds
      modalCloseTimeoutRef.current = setTimeout(() => {
        console.log('Auto-closing modal due to teacher conflict');
        setShowEntryDialog(false);
        setShowErrorAlert(false);
        setEntryError(null);
      }, 3000);
    }

    // Cleanup timeout on unmount
    return () => {
      if (modalCloseTimeoutRef.current) {
        clearTimeout(modalCloseTimeoutRef.current);
      }
    };
  }, [entryError, showEntryDialog]);


  // Form states
  const [configForm, setConfigForm] = useState({
    name: '',
    description: '',
    academic_year_id: '',
    total_periods: 8,
    days_per_week: 5
  });

  const [entryForm, setEntryForm] = useState({
    config_id: '',
    class_division_id: '',
    period_number: 1,
    day_of_week: 1,
    subject: '',
    teacher_id: '',
    notes: ''
  });
  const [customSubject, setCustomSubject] = useState('');

  // Define all hooks before any conditional logic
  const loadConfigs = useCallback(async () => {
    if (!token) return;
    try {
      const response = await timetableApi.getConfigs(token, undefined);
      if (response.status === 'success') {
        setConfigs(response.data.configs);
        // Auto-select the first active config
        const activeConfig = response.data.configs.find(c => c.is_active);
        if (activeConfig) {
          setSelectedConfig(activeConfig);
          setEntryForm(prev => ({ ...prev, config_id: activeConfig.id }));
        }
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    }
  }, [token]);

  const loadClassDivisions = useCallback(async () => {
    if (!token) return;
    try {
      const response = await classDivisionsServices.getClassDivisions(token);
      if (response.status === 'success') {
        setClassDivisions(response.data.class_divisions);
      }
    } catch (error) {
      console.error('Error loading class divisions:', error);
    }
  }, [token]);

  const loadAcademicYears = useCallback(async () => {
    if (!token) return;
    try {
      // First try to get the active academic year
      const activeResponse = await academicServices.getActiveAcademicYear(token);
      if (activeResponse.status === 'success') {
        const activeYear = activeResponse.data.academic_year;
        setConfigForm(prev => ({ ...prev, academic_year_id: activeYear.id }));
        setAcademicYears([activeYear]);
      } else {
        // If no active year, get all academic years
        const allResponse = await academicServices.getAcademicYears(token);
        if (allResponse.status === 'success') {
          setAcademicYears(allResponse.data.academic_years);
          // Set the first active year as default, or first year if none active
          const activeYear = allResponse.data.academic_years.find(y => y.is_active) ||
                           allResponse.data.academic_years[0];
          if (activeYear) {
            setConfigForm(prev => ({ ...prev, academic_year_id: activeYear.id }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
    }
  }, [token]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadConfigs(),
        loadClassDivisions(),
        loadAcademicYears()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadConfigs, loadClassDivisions, loadAcademicYears]);

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token, loadInitialData]);

  const loadTimetableData = async (classDivisionId: string) => {
    if (!token || !selectedConfig) return;
    try {
      setLoading(true);

      // Load timetable data, teachers, and subjects in parallel
      const [timetableResponse, teachersResponse, subjectsResponse] = await Promise.all([
        timetableApi.getEntries(classDivisionId, token, selectedConfig.academic_year_id),
        timetableApi.getClassDivisionTeachers(classDivisionId, token),
        // Load subjects using the academic API
        apiClient.get(`/api/academic/class-divisions/${classDivisionId}/subjects`, token)
      ]);

      if (timetableResponse.status === 'success') {
        setTimetableData(timetableResponse.data.timetable);
        toast({
          title: "Timetable Loaded",
          description: `Found ${timetableResponse.data.total_entries} timetable entries for this class.`,
        });
      }

      if (teachersResponse.status === 'success') {
        setClassDivisionTeachers(teachersResponse.data.teachers);
      }

      // Handle subjects response
      if (subjectsResponse && typeof subjectsResponse === 'object' && 'status' in subjectsResponse && subjectsResponse.status === 'success') {
        setClassDivisionSubjects((subjectsResponse as { data: { subjects?: Array<{id: string, name: string, code: string}> } }).data.subjects || []);
      }
    } catch (error) {
      console.error('Error loading timetable data:', error);
      toast({
        title: "Error",
        description: "Failed to load timetable data",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    if (!token) return;

    // Validate required fields
    if (!configForm.name.trim()) {
      toast({
        title: "Error",
        description: "Configuration name is required",
        variant: "error",
      });
      return;
    }

    if (!configForm.academic_year_id) {
      toast({
        title: "Error",
        description: "Please select an academic year",
        variant: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await timetableApi.createConfig(configForm, token);

      if (response && typeof response === 'object' && 'status' in response) {
        if (response.status === 'success') {
          toast({
            title: "Success",
            description: "Timetable configuration created successfully",
          });
          setShowConfigDialog(false);
          setConfigForm({
            name: '',
            description: '',
            academic_year_id: configForm.academic_year_id, // Keep the current academic year
            total_periods: 8,
            days_per_week: 5
          });
          await loadConfigs();
        } else if (response.status === 'error' && 'message' in response) {
          // Handle case where configuration already exists
          if (response.message.includes('already exists')) {
            toast({
              title: "Configuration Exists",
              description: response.message,
            });
            setShowConfigDialog(false);
            await loadConfigs(); // Refresh to show existing config
          } else {
            toast({
              title: "Error",
              description: response.message,
              variant: "error",
            });
          }
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: unknown) {
      console.error('Error creating configuration:', error);

      // Handle network errors or other exceptions
      const errorMessage = error instanceof Error ? error.message : 'Failed to create configuration';
      if (errorMessage.includes('already exists')) {
        toast({
          title: "Configuration Exists",
          description: errorMessage,
        });
        setShowConfigDialog(false);
        await loadConfigs(); // Refresh to show existing config
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!token || !editingConfig) return;

    // Validate required fields
    if (!configForm.name.trim()) {
      toast({
        title: "Error",
        description: "Configuration name is required",
        variant: "error",
      });
      return;
    }

    if (!configForm.academic_year_id) {
      toast({
        title: "Error",
        description: "Please select an academic year",
        variant: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await timetableApi.updateConfig(editingConfig.id, {
        name: configForm.name,
        description: configForm.description,
        total_periods: configForm.total_periods,
        days_per_week: configForm.days_per_week
      }, token);

      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Configuration updated successfully",
        });
        setShowConfigDialog(false);
        setEditingConfig(null);
        await loadConfigs();
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await timetableApi.createEntry(entryForm, token);

      // Check if response indicates teacher conflict (might be in response.data instead of throwing error)
      if (response.status === 'error' &&
          (response.error_code === 'TEACHER_CONFLICT_DB' ||
           response.message?.includes('Teacher schedule conflict'))) {

        // Set error state - useEffect will handle auto-closing
        setEntryError({
          type: 'teacher_conflict',
          title: 'Teacher Schedule Conflict',
          message: typeof response.details === 'string' ? response.details : 'This teacher is already assigned to another class during the same period and day.',
          suggestion: typeof response.suggestion === 'string' ? response.suggestion : 'Please choose a different teacher, period, or day for this assignment.',
          constraint: response.constraint_violated
        });

        // Show toast notification
        const errorDetails = typeof response.details === 'string' ? response.details : "This teacher is already assigned to another class during the same period and day";
        const errorSuggestion = typeof response.suggestion === 'string' ? response.suggestion : "Please choose a different teacher, period, or day for this assignment.";

        toast({
          title: "Teacher Schedule Conflict",
          description: `${errorDetails}\n\n💡 ${errorSuggestion}`,
          variant: "error",
          duration: 8000,
        });

        return; // Exit early, don't process as success
      }

      if (response.status === 'success') {
        toast({
          title: "Success",
          description: "Timetable entry created successfully",
        });
        setShowEntryDialog(false);
        setEntryForm(prev => ({
          ...prev,
          period_number: 1,
          day_of_week: 1,
          subject: '',
          teacher_id: '',
          notes: ''
        }));
        setCustomSubject('');
        if (selectedClass) {
          await loadTimetableData(selectedClass);
        }
      }
    } catch (error: unknown) {
      console.error('Error creating timetable entry:', error);

      // Check if it's a teacher conflict error in the caught error
      const errorObj = error as { error_code?: string; message?: string; details?: string; suggestion?: string; constraint_violated?: string }; // Type assertion for error object
      if (errorObj?.error_code === 'TEACHER_CONFLICT_DB' ||
          (error instanceof Error && error.message?.includes('Teacher schedule conflict'))) {

        // Set error state - useEffect will handle auto-closing
        setEntryError({
          type: 'teacher_conflict',
          title: 'Teacher Schedule Conflict',
          message: typeof errorObj?.details === 'string' ? errorObj.details : 'This teacher is already assigned to another class during the same period and day.',
          suggestion: typeof errorObj?.suggestion === 'string' ? errorObj.suggestion : 'Please choose a different teacher, period, or day for this assignment.',
          constraint: errorObj?.constraint_violated
        });

        // Show toast notification
        const errorDetails = typeof errorObj?.details === 'string' ? errorObj.details : "This teacher is already assigned to another class during the same period and day";
        const errorSuggestion = typeof errorObj?.suggestion === 'string' ? errorObj.suggestion : "Please choose a different teacher, period, or day for this assignment.";

        toast({
          title: "Teacher Schedule Conflict",
          description: `${errorDetails}\n\n💡 ${errorSuggestion}`,
          variant: "error",
          duration: 8000,
        });

      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create entry",
          variant: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditConfig = (config: TimetableConfig) => {
    setEditingConfig(config);
    setConfigForm({
      name: config.name,
      description: config.description || '',
      academic_year_id: config.academic_year_id,
      total_periods: config.total_periods,
      days_per_week: config.days_per_week
    });
    setShowConfigDialog(true);
  };

  // Only allow admins and principals
  if (user && user.role !== 'admin' && user.role !== 'principal') {
    return <AccessDenied />;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <Card className="border-0 shadow-none bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Timetable Management</h1>
              </div>
              <p className="text-muted-foreground">
                Create and manage school timetables for all classes
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={loadInitialData}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="entries">Manage Entries</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Configs</CardTitle>
                <Settings className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {configs.filter(c => c.is_active).length}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{classDivisions.length}</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Periods/Day</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedConfig?.total_periods || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Days/Week</CardTitle>
                <Calendar className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {selectedConfig?.days_per_week || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Configuration */}
          {selectedConfig && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Active Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">{selectedConfig.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{selectedConfig.description}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedConfig.days_per_week} days/week • {selectedConfig.total_periods} periods/day
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditConfig(selectedConfig)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Config
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Configurations Tab */}
        <TabsContent value="configurations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Timetable Configurations</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage timetable structures for different academic years
              </p>
            </div>
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingConfig(null);
                  setConfigForm({
                    name: '',
                    description: '',
                    academic_year_id: configForm.academic_year_id, // Keep current academic year
                    total_periods: 8,
                    days_per_week: 5
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Configuration
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingConfig ? 'Edit Configuration' : 'Create New Configuration'}
                  </DialogTitle>
                  <DialogDescription>
                    Set up the basic structure for your school timetable
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="config-name">Configuration Name</Label>
                    <Input
                      id="config-name"
                      value={configForm.name}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Primary School Schedule 2025-26"
                    />
                  </div>

                  <div>
                    <Label htmlFor="config-description">Description (Optional)</Label>
                    <Textarea
                      id="config-description"
                      value={configForm.description}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this timetable configuration"
                    />
                  </div>

                  <div>
                    <Label htmlFor="academic-year">Academic Year</Label>
                    <Select
                      value={configForm.academic_year_id}
                      onValueChange={(value) => setConfigForm(prev => ({ ...prev, academic_year_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Academic Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.year_name} {year.is_active && '(Active)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="periods">Periods per Day</Label>
                      <Input
                        id="periods"
                        type="number"
                        min="1"
                        max="20"
                        value={configForm.total_periods}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, total_periods: parseInt(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="days">Days per Week</Label>
                      <Input
                        id="days"
                        type="number"
                        min="1"
                        max="7"
                        value={configForm.days_per_week}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, days_per_week: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfigDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingConfig ? handleUpdateConfig : handleCreateConfig}
                      disabled={loading || !configForm.name.trim() || !configForm.academic_year_id}
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {editingConfig ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {configs.map((config) => (
              <Card key={config.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{config.name}</h3>
                        {config.is_active && (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Structure:</span> {config.days_per_week} days/week, {config.total_periods} periods/day
                        </div>
                        <div>
                          <span className="font-medium">Academic Year:</span> {config.academic_year?.year_name}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Created: {new Date(config.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditConfig(config)}
                        title="Edit configuration"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedConfig?.id === config.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedConfig(config)}
                        className={selectedConfig?.id === config.id ? '' : 'hover:bg-primary/10'}
                      >
                        {selectedConfig?.id === config.id ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {configs.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No timetable configurations found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first configuration to get started with timetable management
                  </p>
                </CardContent>
              </Card>
            )}

            {configs.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded">
                    <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Configuration Management</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Select a configuration to manage timetable entries for that academic year.
                      You can create multiple configurations for different academic years or school structures.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Entries Tab */}
        <TabsContent value="entries" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Manage Timetable Entries</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add and manage subjects, teachers, and schedules for each class
              </p>
            </div>

            {selectedConfig && (
              <div className="flex gap-2">
                <Select
                  value={selectedClass}
                  onValueChange={(value) => {
                    setSelectedClass(value);
                    if (value) {
                      loadTimetableData(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classDivisions.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.class_level.name} - Section {division.division}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog open={showEntryDialog} onOpenChange={(open) => {
                  setShowEntryDialog(open);
                  if (!open) {
                    // Clear error states and timeout when dialog closes
                    setEntryError(null);
                    setShowErrorAlert(false);
                    if (modalCloseTimeoutRef.current) {
                      clearTimeout(modalCloseTimeoutRef.current);
                    }
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={!selectedClass || !selectedConfig}
                      onClick={() => {
                        // Clear error states and timeout when opening dialog
                        setEntryError(null);
                        setShowErrorAlert(false);
                        if (modalCloseTimeoutRef.current) {
                          clearTimeout(modalCloseTimeoutRef.current);
                        }
                        setEntryForm(prev => ({
                          ...prev,
                          config_id: selectedConfig?.id || '',
                          class_division_id: selectedClass
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Entry
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Timetable Entry</DialogTitle>
                      <DialogDescription>
                        Add a new subject entry to the timetable
                      </DialogDescription>
                    </DialogHeader>

                    {entryError && showErrorAlert && (
                      <Alert className="border-red-200 bg-red-50 animate-in fade-in-50 duration-300">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <div className="space-y-3">
                            <div className="font-semibold text-base">{entryError.title}</div>
                            <div className="text-sm leading-relaxed">{entryError.message}</div>
                            {entryError.suggestion && (
                              <div className="bg-red-100 p-3 rounded-md border border-red-200">
                                <div className="text-sm font-medium text-red-800 mb-1">
                                  💡 Suggested Solution:
                                </div>
                                <div className="text-sm text-red-700">{entryError.suggestion}</div>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}



                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Day of Week</Label>
                          <Select
                            value={entryForm.day_of_week.toString()}
                            onValueChange={(value) => setEntryForm(prev => ({ ...prev, day_of_week: parseInt(value) }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Monday</SelectItem>
                              <SelectItem value="2">Tuesday</SelectItem>
                              <SelectItem value="3">Wednesday</SelectItem>
                              <SelectItem value="4">Thursday</SelectItem>
                              <SelectItem value="5">Friday</SelectItem>
                              <SelectItem value="6">Saturday</SelectItem>
                              <SelectItem value="7">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Period Number</Label>
                          <Input
                            type="number"
                            min="1"
                            max={selectedConfig?.total_periods || 8}
                            value={entryForm.period_number}
                            onChange={(e) => setEntryForm(prev => ({ ...prev, period_number: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Subject</Label>
                        <Select
                          value={customSubject ? 'custom' : entryForm.subject}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              setCustomSubject('');
                              setEntryForm(prev => ({ ...prev, subject: '' }));
                            } else {
                              setCustomSubject('');
                              setEntryForm(prev => ({ ...prev, subject: value }));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {classDivisionSubjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.name}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{subject.name}</span>
                                  <span className="text-xs text-muted-foreground">{subject.code}</span>
                                </div>
                              </SelectItem>
                            ))}
                            {/* Allow manual entry if no subjects are assigned or always allow custom */}
                            <SelectItem value="custom">Enter Custom Subject</SelectItem>
                          </SelectContent>
                        </Select>
                        {(customSubject || (!entryForm.subject && classDivisionSubjects.length === 0)) && (
                          <Input
                            className="mt-2"
                            placeholder="Enter custom subject name"
                            value={customSubject}
                            onChange={(e) => {
                              setCustomSubject(e.target.value);
                              setEntryForm(prev => ({ ...prev, subject: e.target.value }));
                            }}
                          />
                        )}
                        {classDivisionSubjects.length === 0 && !customSubject && (
                          <p className="text-sm text-muted-foreground mt-2">
                            No subjects assigned to this class. You can enter a custom subject.
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Teacher</Label>
                        <Select
                          value={entryForm.teacher_id}
                          onValueChange={(value) => setEntryForm(prev => ({ ...prev, teacher_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {classDivisionTeachers
                              .filter(teacher => teacher.is_active)
                              .map((teacher, index) => (
                                <SelectItem key={teacher.assignment_id || `teacher-select-${teacher.teacher_id}-${index}`} value={teacher.teacher_id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{teacher.teacher_info.full_name}</span>
                                    {teacher.assignment_type === 'subject_teacher' && teacher.subject && (
                                      <span className="text-xs text-muted-foreground">
                                        Subject: {teacher.subject}
                                      </span>
                                    )}
                                    {teacher.assignment_type === 'class_teacher' && (
                                      <span className="text-xs text-muted-foreground">
                                        Class Teacher
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {classDivisionTeachers.length === 0 && selectedClass && (
                          <p className="text-sm text-muted-foreground mt-2">
                            No teachers assigned to this class yet
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Notes (Optional)</Label>
                        <Textarea
                          value={entryForm.notes}
                          onChange={(e) => setEntryForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional notes or instructions"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowEntryDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateEntry} disabled={loading}>
                          {loading ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Create Entry
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {!selectedConfig && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please select a timetable configuration from the &quot;Configurations&quot; tab to start managing timetable entries.
                </AlertDescription>
              </Alert>

              {configs.length > 0 && (
                <div className="grid gap-3">
                  <h3 className="font-medium text-sm">Available Configurations:</h3>
                  {configs.slice(0, 3).map((config) => (
                    <Card key={config.id} className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50" onClick={() => setSelectedConfig(config)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{config.name}</h4>
                            <p className="text-sm text-muted-foreground">{config.academic_year?.year_name}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Select This
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedClass && selectedConfig && (
            <div className="space-y-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timetable for Selected Class
                  </CardTitle>
                  <CardDescription>
                    {classDivisions.find(c => c.id === selectedClass)?.class_level.name} - Section {classDivisions.find(c => c.id === selectedClass)?.division}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => loadTimetableData(selectedClass)}
                        disabled={loading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setEntryForm(prev => ({
                            ...prev,
                            config_id: selectedConfig?.id || '',
                            class_division_id: selectedClass
                          }));
                          setShowEntryDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                      </Button>
                    </div>

                    {/* Timetable Statistics */}
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-lg">
                          {Object.values(timetableData).reduce((total, entries) => total + entries.length, 0)}
                        </div>
                        <div className="text-muted-foreground">Total Entries</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg">
                          {new Set(Object.values(timetableData).flat().map(entry => entry.subject)).size}
                        </div>
                        <div className="text-muted-foreground">Subjects</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg">
                          {new Set(Object.values(timetableData).flat().map(entry => entry.teacher_id)).size}
                        </div>
                        <div className="text-muted-foreground">Teachers</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {Object.values(timetableData).reduce((total, entries) => total + entries.length, 0) === 0 && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded">
                          <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">No Timetable Entries Yet</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            This class doesn&apos;t have any timetable entries yet. Click &quot;Add Entry&quot; to create the first schedule for this class.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subjects Information */}
              {classDivisionSubjects.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Available Subjects
                    </CardTitle>
                    <CardDescription>
                      Subjects assigned to this class division
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {classDivisionSubjects.map((subject) => (
                        <div key={subject.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{subject.name}</h4>
                            <p className="text-xs text-muted-foreground">{subject.code}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Teachers Information */}
              {classDivisionTeachers.length > 0 && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Available Teachers
                    </CardTitle>
                    <CardDescription>
                      Teachers assigned to this class division
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classDivisionTeachers
                        .filter(teacher => teacher.is_active)
                        .map((teacher, index) => (
                          <div key={teacher.assignment_id || `teacher-card-${teacher.teacher_id}-${index}`} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{teacher.teacher_info.full_name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {teacher.assignment_type === 'class_teacher' && (
                                  <Badge variant="outline" className="text-xs">Class Teacher</Badge>
                                )}
                                {teacher.assignment_type === 'subject_teacher' && teacher.subject && (
                                  <Badge variant="outline" className="text-xs">Subject: {teacher.subject}</Badge>
                                )}
                              </div>
                              {teacher.teacher_info.phone_number && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {teacher.teacher_info.phone_number}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <TimetableGrid
                timetableData={timetableData}
                config={selectedConfig}
                onEditEntry={(entry) => {
                  // Handle edit entry
                  setEntryForm({
                    config_id: entry.config_id,
                    class_division_id: entry.class_division_id,
                    period_number: entry.period_number,
                    day_of_week: entry.day_of_week,
                    subject: entry.subject,
                    teacher_id: entry.teacher_id,
                    notes: entry.notes || ''
                  });
                  setShowEntryDialog(true);
                }}
                onDeleteEntry={async (entryId) => {
                  if (confirm('Are you sure you want to delete this timetable entry?')) {
                    try {
                      await timetableApi.deleteEntry(entryId, token || '');
                      toast({
                        title: "Success",
                        description: "Timetable entry deleted successfully",
                      });
                      if (selectedClass) {
                        await loadTimetableData(selectedClass);
                      }
                    } catch (error) {
                      console.error('Error deleting entry:', error);
                      toast({
                        title: "Error",
                        description: "Failed to delete entry",
                        variant: "error",
                      });
                    }
                  }
                }}
              />
            </div>
          )}

          {!selectedClass && selectedConfig && (
            <div className="space-y-4">
              <Alert>
                <BookOpen className="h-4 w-4" />
                <AlertDescription>
                  Select a class from the dropdown above to view and manage its timetable entries.
                </AlertDescription>
              </Alert>

              {classDivisions.length > 0 && (
                <div className="grid gap-3">
                  <h3 className="font-medium text-sm">Available Classes:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classDivisions.slice(0, 6).map((division) => (
                      <Card
                        key={division.id}
                        className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                        onClick={() => {
                          setSelectedClass(division.id);
                          loadTimetableData(division.id);
                        }}
                      >
                        <CardContent className="p-4 text-center">
                          <h4 className="font-medium">{division.class_level.name}</h4>
                          <p className="text-sm text-muted-foreground">Section {division.division}</p>
                          <Button variant="outline" size="sm" className="mt-2 w-full">
                            View Timetable
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
