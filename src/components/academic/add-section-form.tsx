// src/components/academic/add-section-form.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { ClassLevel } from '@/types/academic';

interface AddSectionFormProps {
  classLevels: ClassLevel[];
  onAddSection: (levelId: string, name: string) => void;
  onCancel: () => void;
}

export function AddSectionForm({ 
  classLevels, 
  onAddSection,
  onCancel
}: AddSectionFormProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [sectionName, setSectionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleAddSection = () => {
    if (!selectedLevelId) {
      setError('Please select a grade level');
      return;
    }
    
    if (!sectionName.trim()) {
      setError('Please enter a section name (A, B, C, etc.)');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      try {
        onAddSection(selectedLevelId, sectionName.trim().toUpperCase());
        setSuccess(true);
        // Reset form
        setSelectedLevelId('');
        setSectionName('');
        // Reset success after 2 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      } catch {
        setError('Failed to add section. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Section added successfully!</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="grade-level">Grade Level</Label>
          <Select 
            value={selectedLevelId} 
            onValueChange={setSelectedLevelId}
          >
            <SelectTrigger id="grade-level">
              <SelectValue placeholder="Select grade level" />
            </SelectTrigger>
            <SelectContent>
              {classLevels
                .sort((a, b) => a.sequence_number - b.sequence_number)
                .map(level => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="section-name">Section Name</Label>
          <Input
            id="section-name"
            placeholder="A, B, C, etc."
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            className="w-full"
            maxLength={1}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleAddSection}
          disabled={isLoading}
        >
          {isLoading ? 'Adding...' : 'Add Section'}
        </Button>
      </div>
    </div>
  );
}