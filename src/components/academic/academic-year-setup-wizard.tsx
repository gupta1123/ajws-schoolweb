// src/components/academic/academic-year-setup-wizard.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  BookOpen, 
  Users, 
  Settings,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Copy,
  AlertTriangle,
  Plus
} from 'lucide-react';

interface ClassLevel {
  id: string;
  name: string;
  sequence: number;
}

interface ClassDivision {
  id: string;
  levelId: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function AcademicYearSetupWizard() {
  // Wizard state
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data
  const [academicYearData, setAcademicYearData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });
  
  const [templateOption, setTemplateOption] = useState<'blank' | 'previous' | 'custom'>('previous');
  const [selectedTemplateYear, setSelectedTemplateYear] = useState<string>('');
  
  // Mock data for templates
  const previousYears: AcademicYear[] = [
    { id: '1', name: '2023-2024', startDate: '2023-06-01', endDate: '2024-03-31', isActive: false },
    { id: '2', name: '2022-2023', startDate: '2022-06-01', endDate: '2023-03-31', isActive: false }
  ];
  
  const classLevels: ClassLevel[] = [
    { id: '1', name: 'Grade 1', sequence: 1 },
    { id: '2', name: 'Grade 2', sequence: 2 },
    { id: '3', name: 'Grade 3', sequence: 3 },
    { id: '4', name: 'Grade 4', sequence: 4 },
    { id: '5', name: 'Grade 5', sequence: 5 }
  ];
  
  const classDivisions: ClassDivision[] = [
    { id: '1', levelId: '1', name: 'Section A' },
    { id: '2', levelId: '1', name: 'Section B' },
    { id: '3', levelId: '2', name: 'Section A' },
    { id: '4', levelId: '2', name: 'Section B' }
  ];
  
  // Wizard steps
  const steps: WizardStep[] = [
    {
      id: 'year-info',
      title: 'Academic Year Information',
      description: 'Set up the basic details for your academic year',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'template',
      title: 'Template Selection',
      description: 'Choose a template to speed up setup',
      icon: <Copy className="h-5 w-5" />
    },
    {
      id: 'levels',
      title: 'Class Levels',
      description: 'Review and customize class levels',
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      id: 'divisions',
      title: 'Class Divisions',
      description: 'Review and customize class divisions',
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'review',
      title: 'Review & Confirm',
      description: 'Review your setup before finalizing',
      icon: <CheckCircle className="h-5 w-5" />
    }
  ];
  
  // Wizard navigation
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleOpenWizard = () => {
    setIsOpen(true);
  };
  
  const handleCloseWizard = () => {
    setIsOpen(false);
    setCurrentStep(0);
  };
  
  const handleFinish = () => {
    // In a real app, this would submit the data
    console.log('Academic year setup completed', {
      academicYearData,
      templateOption,
      selectedTemplateYear
    });
    setIsOpen(false);
    setCurrentStep(0);
    alert('Academic year setup completed successfully!');
  };
  
  // Progress calculation
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  if (!isOpen) {
    return (
      <div className="text-center py-8">
        <Button onClick={handleOpenWizard} className="flex items-center gap-2 mx-auto">
          <Settings className="h-4 w-4" />
          Setup New Academic Year
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Use the setup wizard to quickly configure a new academic year
        </p>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {steps[currentStep].icon}
              <div>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCloseWizard}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Step 1: Academic Year Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearName">Academic Year Name</Label>
                  <Input
                    id="yearName"
                    placeholder="e.g., 2025-2026"
                    value={academicYearData.name}
                    onChange={(e) => setAcademicYearData({...academicYearData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={academicYearData.startDate}
                    onChange={(e) => setAcademicYearData({...academicYearData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={academicYearData.endDate}
                    onChange={(e) => setAcademicYearData({...academicYearData, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-2">Tips for Academic Year Setup</h3>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Academic years typically follow June to March or April to March patterns
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Ensure dates don&apos;t overlap with existing academic years
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Consider holidays and vacation periods when setting dates
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Step 2: Template Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className={`cursor-pointer border-2 ${templateOption === 'blank' ? 'border-primary' : ''}`}
                  onClick={() => setTemplateOption('blank')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-muted">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <h3 className="font-medium">Blank Setup</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Start from scratch and create everything manually
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer border-2 ${templateOption === 'previous' ? 'border-primary' : ''}`}
                  onClick={() => setTemplateOption('previous')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-muted">
                        <Copy className="h-5 w-5" />
                      </div>
                      <h3 className="font-medium">Previous Year</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Copy structure from a previous academic year
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer border-2 ${templateOption === 'custom' ? 'border-primary' : ''}`}
                  onClick={() => setTemplateOption('custom')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-muted">
                        <Settings className="h-5 w-5" />
                      </div>
                      <h3 className="font-medium">Custom Template</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use a custom template for your specific needs
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {templateOption === 'previous' && (
                <div className="space-y-2">
                  <Label>Select Previous Academic Year</Label>
                  <select 
                    className="border rounded-md px-3 py-2 w-full"
                    value={selectedTemplateYear}
                    onChange={(e) => setSelectedTemplateYear(e.target.value)}
                  >
                    <option value="">Choose a previous year</option>
                    {previousYears.map(year => (
                      <option key={year.id} value={year.id}>
                        {year.name} ({year.startDate} to {year.endDate})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {templateOption === 'previous' && selectedTemplateYear && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Template Preview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Class Levels</p>
                      <p className="font-medium">{classLevels.length} levels</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Divisions</p>
                      <p className="font-medium">{classDivisions.length} sections</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Students</p>
                      <p className="font-medium">1,247 total</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Teachers</p>
                      <p className="font-medium">45 assigned</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Class Levels */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Class Levels</h3>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Level
                </Button>
              </div>
              
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Sequence</th>
                      <th className="text-left p-3 font-medium">Level Name</th>
                      <th className="text-left p-3 font-medium">Divisions</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classLevels
                      .sort((a, b) => a.sequence - b.sequence)
                      .map((level) => {
                        const divisionCount = classDivisions.filter(div => div.levelId === level.id).length;
                        return (
                          <tr key={level.id} className="border-b last:border-b-0">
                            <td className="p-3 font-medium">{level.sequence}</td>
                            <td className="p-3">{level.name}</td>
                            <td className="p-3">{divisionCount} sections</td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-2">Level Management Tips</h3>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Sequence numbers determine the order of classes (1, 2, 3...)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Each level can have multiple divisions (sections)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Consider future expansion when setting up levels
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Step 4: Class Divisions */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Class Divisions</h3>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Division
                </Button>
              </div>
              
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Class Level</th>
                      <th className="text-left p-3 font-medium">Division Name</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classDivisions.map((division) => {
                      const level = classLevels.find(l => l.id === division.levelId);
                      return (
                        <tr key={division.id} className="border-b last:border-b-0">
                          <td className="p-3 font-medium">{level?.name || 'Unknown'}</td>
                          <td className="p-3">{division.name}</td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-2">Division Management Tips</h3>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Divisions help manage class sizes and teacher assignments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Common naming conventions: Section A, B, C or Alpha, Beta, Gamma
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Consider student-teacher ratios when creating divisions
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Step 5: Review & Confirm */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-3">Academic Year Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{academicYearData.name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="font-medium">{academicYearData.startDate || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span className="font-medium">{academicYearData.endDate || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Template:</span>
                      <span className="font-medium">
                        {templateOption === 'blank' && 'Blank Setup'}
                        {templateOption === 'previous' && 'Previous Year'}
                        {templateOption === 'custom' && 'Custom Template'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class Levels:</span>
                      <span className="font-medium">{classLevels.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class Divisions:</span>
                      <span className="font-medium">{classDivisions.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800 dark:text-blue-200">Important Notice</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Once created, the academic year structure cannot be modified. 
                      You can only add new levels or divisions, but not change existing ones.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                <input type="checkbox" id="confirm" className="h-4 w-4" />
                <Label htmlFor="confirm" className="text-sm">
                  I confirm that all information is correct and I understand the implications of creating this academic year
                </Label>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentStep > 0 ? (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleCloseWizard}
              >
                Cancel
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={handleNext}
                className="flex items-center gap-2"
                disabled={
                  (currentStep === 0 && (!academicYearData.name || !academicYearData.startDate || !academicYearData.endDate)) ||
                  (currentStep === 1 && templateOption === 'previous' && !selectedTemplateYear)
                }
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleFinish}
                className="bg-green-500 hover:bg-green-600"
              >
                Create Academic Year
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}