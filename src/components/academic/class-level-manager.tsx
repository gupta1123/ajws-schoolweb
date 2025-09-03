// src/components/academic/class-level-manager.tsx

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
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAcademicStructure } from '@/hooks/use-academic-structure';

export function ClassLevelManager() {
  // Use real data from the hook
  const {
    classLevels,
    loading,
    error,
    clearError,
    createClassLevel,
    updateClassLevel,
    deleteClassLevel
  } = useAcademicStructure();
  
  const [newClassLevel, setNewClassLevel] = useState({
    name: '',
    sequence_number: 1
  });
  
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddClassLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClassLevel.name) {
      setLocalError('Please enter a grade name');
      return;
    }
    
    // Check if sequence number is valid
    if (newClassLevel.sequence_number < 1) {
      setLocalError('Sequence number must be greater than 0');
      return;
    }
    
    // Check if a class level with this name already exists
    const existingLevel = classLevels.find(level => 
      level.name.toLowerCase() === newClassLevel.name.toLowerCase()
    );
    
    if (existingLevel) {
      setLocalError('A grade with this name already exists');
      return;
    }
    
    const success = await createClassLevel({
      name: newClassLevel.name,
      sequence_number: newClassLevel.sequence_number
    });
    
    if (success) {
      setNewClassLevel({ name: '', sequence_number: 1 });
      setSuccess('Grade level created successfully');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } else {
      setLocalError('Failed to create grade level');
    }
  };
  
  const handleDeleteClassLevel = async (id: string) => {
    // Check if this class level has any divisions
    // In a real implementation, you might want to check this with the API
    // For now, we'll just prevent deletion with a message
    
    const success = await deleteClassLevel(id);
    if (success) {
      setSuccess('Grade level deleted successfully');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } else {
      setLocalError('Failed to delete grade level. It may have associated class divisions.');
    }
  };
  
  const handleUpdateSequence = async (id: string, newSequence: number) => {
    if (newSequence < 1) {
      setLocalError('Sequence number must be greater than 0');
      return;
    }
    
    // Find the current class level
    const currentLevel = classLevels.find(level => level.id === id);
    if (!currentLevel) return;
    
    const success = await updateClassLevel(id, {
      name: currentLevel.name,
      sequence_number: newSequence
    });
    
    if (success) {
      setSuccess('Grade level updated successfully');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } else {
      setLocalError('Failed to update grade level');
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
      
      {/* Add New Class Level Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Grade</CardTitle>
          <CardDescription>
            Add a new grade level to your school structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddClassLevel} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="grade-name">Grade Name</Label>
              <Input
                id="grade-name"
                placeholder="e.g., Grade 1, Kindergarten"
                value={newClassLevel.name}
                onChange={(e) => setNewClassLevel({ ...newClassLevel, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="sequence-number">Sequence Number</Label>
              <Input
                id="sequence-number"
                type="number"
                min="1"
                value={newClassLevel.sequence_number}
                onChange={(e) => setNewClassLevel({ ...newClassLevel, sequence_number: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Grade
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Class Levels List */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Levels</CardTitle>
          <CardDescription>
            Manage and organize grade levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade Name</TableHead>
                  <TableHead>Sequence Number</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading grade levels...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : classLevels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <span className="text-muted-foreground">No grade levels found</span>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Sort by sequence number
                  [...classLevels]
                    .sort((a, b) => a.sequence_number - b.sequence_number)
                    .map((level) => (
                      <TableRow key={level.id}>
                        <TableCell className="font-medium">{level.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={level.sequence_number}
                            onChange={(e) => handleUpdateSequence(level.id, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {/* In a real implementation, you would count actual divisions */}
                            <span className="text-muted-foreground">0 sections</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClassLevel(level.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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