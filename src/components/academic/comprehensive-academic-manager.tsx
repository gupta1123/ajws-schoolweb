// src/components/academic/comprehensive-academic-manager.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, User, Loader2, AlertTriangle } from 'lucide-react';
import { AcademicStructureManager } from './academic-structure-manager';
import { AcademicYearManager } from './academic-year-manager';
import { SubjectManager } from './SubjectManager';
import { ClassLevelManager } from './class-level-manager';
import { useAcademicStructure } from '@/hooks/use-academic-structure';

export function ComprehensiveAcademicManager() {
  const [activeView, setActiveView] = useState<'current' | 'years' | 'subjects' | 'levels'>('current');
  const { 
    classLevels, 
    classDivisions, 
    teachers, 
    loading, 
    error, 
    clearError 
  } = useAcademicStructure();

  return (
    <div className="space-y-6">
      {/* Navigation Tabs - Moved to top */}
      <div className="flex justify-center">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'current' | 'years' | 'subjects' | 'levels')} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="current" onClick={() => setActiveView('current')}>
              Current Structure
            </TabsTrigger>
            <TabsTrigger value="years" onClick={() => setActiveView('years')}>
              Academic Years
            </TabsTrigger>
            <TabsTrigger value="levels" onClick={() => setActiveView('levels')}>
              Grades
            </TabsTrigger>
            <TabsTrigger value="subjects" onClick={() => setActiveView('subjects')}>
              Subjects
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {activeView === 'current' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Grades</p>
                    <p className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : classLevels.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sections</p>
                    <p className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : classDivisions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teachers</p>
                    <p className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : teachers.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <AcademicStructureManager />
        </div>
      )}

      {activeView === 'years' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Academic Years</h2>
              <p className="text-muted-foreground">
                Manage academic years and their configurations
              </p>
            </div>
          </div>

          <AcademicYearManager />
        </div>
      )}



      {activeView === 'levels' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Grade Levels</h2>
              <p className="text-muted-foreground">
                Manage grade levels and their configurations
              </p>
            </div>
          </div>

          <ClassLevelManager />
        </div>
      )}


      {activeView === 'subjects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Subjects</h2>
              <p className="text-muted-foreground">
                Manage academic subjects and their assignments
              </p>
            </div>
          </div>

          <SubjectManager />
        </div>
      )}
    </div>
  );
}