// src/components/students/parent-linking.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, User, Search } from 'lucide-react';

interface ParentData {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface ParentLinkingProps {
  onLinkParent: (parentId: string, relationship: string, isPrimary: boolean, accessLevel: string) => void;
  onCancel: () => void;
}

export function ParentLinking({ onLinkParent, onCancel }: ParentLinkingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [relationship, setRelationship] = useState('father');
  const [isPrimary, setIsPrimary] = useState(false);
  const [accessLevel, setAccessLevel] = useState('full');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Mock parent data - in a real app this would come from an API
  const mockParents: ParentData[] = [
    { id: '1', name: 'Rajesh Patel', phone: '+91 98765 43210', email: 'rajesh.patel@example.com' },
    { id: '2', name: 'Priya Patel', phone: '+91 98765 43215', email: 'priya.patel@example.com' },
    { id: '3', name: 'Manoj Nair', phone: '+91 98765 43211', email: 'manoj.nair@example.com' },
    { id: '4', name: 'Sunita Reddy', phone: '+91 98765 43212', email: 'sunita.reddy@example.com' },
    { id: '5', name: 'Vikram Sharma', phone: '+91 98765 43213', email: 'vikram.sharma@example.com' }
  ];

  // Filter parents based on search term
  const filteredParents = mockParents.filter(parent => 
    parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.phone.includes(searchTerm) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLinkParent = () => {
    if (!selectedParentId) {
      setError('Please select a parent');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      try {
        onLinkParent(selectedParentId, relationship, isPrimary, accessLevel);
        setSuccess(true);
        // Reset success after 2 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      } catch {
        setError('Failed to link parent. Please try again.');
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
          <AlertDescription>Parent linked successfully!</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="parent-search">Search Parent</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="parent-search"
            placeholder="Search by name, phone, or email"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {searchTerm && (
        <div className="space-y-2">
          <Label>Select Parent</Label>
          <Select value={selectedParentId} onValueChange={setSelectedParentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a parent from search results" />
            </SelectTrigger>
            <SelectContent>
              {filteredParents.map((parent) => (
                <SelectItem key={parent.id} value={parent.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{parent.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {parent.phone} • {parent.email}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
              {filteredParents.length === 0 && (
                <div className="p-2 text-muted-foreground">
                  No parents found. Try a different search term.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {selectedParentId && (
        <>
          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger id="relationship">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="grandparent">Grandparent</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="primary-guardian"
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="primary-guardian">Primary Guardian</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="access-level">Access Level</Label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger id="access-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Access</SelectItem>
                <SelectItem value="limited">Limited Access</SelectItem>
                <SelectItem value="view-only">View Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      
      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleLinkParent}
          disabled={isLoading || !selectedParentId}
        >
          {isLoading ? 'Linking...' : 'Link Parent'}
        </Button>
      </div>
    </div>
  );
}