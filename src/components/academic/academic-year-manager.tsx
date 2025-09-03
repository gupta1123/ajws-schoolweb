// src/components/academic/academic-year-manager.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Trash2, 
  Settings,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAcademicStructure } from '@/hooks/use-academic-structure';
import { formatDate } from '@/lib/utils';

export function AcademicYearManager() {
  // Use real data from the hook
  const {
    academicYears,
    classLevels,
    classDivisions,
    loading,
    error,
    clearError,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear
  } = useAcademicStructure();
  
  const [newAcademicYear, setNewAcademicYear] = useState({
    year_name: '',
    start_date: '',
    end_date: ''
  });
  
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAcademicYear.year_name || !newAcademicYear.start_date || !newAcademicYear.end_date) {
      setLocalError('Please fill in all fields');
      return;
    }
    
    // Validate date range
    if (new Date(newAcademicYear.start_date) >= new Date(newAcademicYear.end_date)) {
      setLocalError('Start date must be before end date');
      return;
    }
    
    const success = await createAcademicYear({
      year_name: newAcademicYear.year_name,
      start_date: newAcademicYear.start_date,
      end_date: newAcademicYear.end_date,
      is_active: false
    });
    
    if (success) {
      setNewAcademicYear({ year_name: '', start_date: '', end_date: '' });
      setSuccess('Academic year created successfully');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };
  
  const handleDeleteAcademicYear = async (id: string) => {
    // Don't allow deletion of active year
    const year = academicYears.find(y => y.id === id);
    if (year?.is_active) {
      setLocalError('Cannot delete the active academic year');
      setTimeout(() => {
        setLocalError(null);
      }, 3000);
      return;
    }
    
    const success = await deleteAcademicYear(id);
    if (success) {
      setSuccess('Academic year deleted successfully');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };
  
  const handleSetCurrentYear = async (id: string) => {
    const success = await updateAcademicYear(id, { is_active: true });
    if (success) {
      setSuccess('Academic year set as current successfully');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-red-800">{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
              ×
            </Button>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}
      
      {/* Local Error Display */}
      {localError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-red-800">{localError}</span>
            <Button variant="ghost" size="sm" onClick={() => setLocalError(null)} className="ml-auto">
              ×
            </Button>
          </div>
        </div>
      )}
      
      {/* Add New Academic Year Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Academic Year</CardTitle>
          <CardDescription>
            Set up a new academic year for planning and scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAcademicYear} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="year-name">Academic Year</Label>
              <Input
                id="year-name"
                placeholder="e.g., 2025-2026"
                value={newAcademicYear.year_name}
                onChange={(e) => setNewAcademicYear({ ...newAcademicYear, year_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={newAcademicYear.start_date}
                onChange={(e) => setNewAcademicYear({ ...newAcademicYear, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={newAcademicYear.end_date}
                onChange={(e) => setNewAcademicYear({ ...newAcademicYear, end_date: e.target.value })}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Year
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Academic Years List */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Years</CardTitle>
          <CardDescription>
            Manage and switch between academic years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Structure</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading academic years...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : academicYears.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <span className="text-muted-foreground">No academic years found</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  academicYears.map((year) => (
                    <TableRow key={year.id}>
                      <TableCell className="font-medium">{year.year_name}</TableCell>
                      <TableCell>{formatDate(year.start_date)}</TableCell>
                      <TableCell>{formatDate(year.end_date)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {year.is_active && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Current
                            </span>
                          )}
                          {!year.is_active && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              <Settings className="h-3 w-3 mr-1" />
                              Planning
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {classLevels.length} grades, 
                            {classDivisions.filter((d) => d.academic_year_id === year.id).length} sections
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!year.is_active && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => handleSetCurrentYear(year.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Make Current
                            </Button>
                          )}
                          {!year.is_active && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteAcademicYear(year.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}