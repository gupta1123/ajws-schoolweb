// src/components/students/parent-linking.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { AlertCircle, CheckCircle, Search, Loader2, Plus } from 'lucide-react';
import { parentServices } from '@/lib/api/parents';
import { useAuth } from '@/lib/auth/context';
import { CreateParentModal } from './create-parent-modal';

interface ParentData {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  role: string;
  created_at?: string;
  children?: Array<{
    id: string;
    full_name: string;
    admission_number: string;
    class_division?: {
      division: string;
      level: {
        name: string;
        sequence_number: number;
      };
    };
  }>;
}

interface ParentLinkingProps {
  onLinkParent: (parentId: string, relationship: string, isPrimary: boolean, accessLevel: string) => void;
  onCancel: () => void;
  existingParentMappings?: Array<{
    relationship: string;
    parent: {
      id: string;
      full_name: string;
    };
  }>;
  studentAdmissionNumber?: string;
  relationship?: string;
}

export function ParentLinking({ onLinkParent, onCancel, existingParentMappings = [], studentAdmissionNumber, relationship }: ParentLinkingProps) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'phone' | 'email'>('name');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState('father');
  const [isPrimary] = useState(true); // Default to primary guardian
  const [accessLevel] = useState('full'); // Default to full access
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [parents, setParents] = useState<ParentData[]>([]);
  const [filteredParents, setFilteredParents] = useState<ParentData[]>([]);
  const [showCreateParent, setShowCreateParent] = useState(false);

  const fetchParents = useCallback(async () => {
    if (!token) return;

    try {
      setIsSearching(true);
      const response = await parentServices.getAllParents(token, { limit: 10 });

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        setError('Unexpected response format from API');
        return;
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        setError(response.message || 'Failed to fetch parents. Please try again.');
        return;
      }

      // Handle successful response
      if ('status' in response && response.status === 'success' && response.data) {
        setParents(response.data.parents || []);
        setFilteredParents(response.data.parents || []);
      } else {
        setError('Failed to fetch parents. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching parents:', err);
      setError('Failed to fetch parents. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [token]);

  // Fetch parents when component mounts
  useEffect(() => {
    if (token) {
      fetchParents();
    }
  }, [token, fetchParents]);

  // Filter parents when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredParents(parents);
    } else {
      const filtered = parents.filter(parent =>
        parent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.phone_number.includes(searchTerm) ||
        (parent.email && parent.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredParents(filtered);
    }
  }, [searchTerm, parents]);

  // Get available relationships (filter out existing ones)
  const getAvailableRelationships = useCallback(() => {
    const allRelationships = [
      { value: 'father', label: 'Father' },
      { value: 'mother', label: 'Mother' },
      { value: 'guardian', label: 'Guardian' },
      { value: 'grandparent', label: 'Grandparent' },
      { value: 'other', label: 'Other' }
    ];

    // Filter out relationships that already exist
    return allRelationships.filter(rel =>
      !existingParentMappings.some(mapping => mapping.relationship === rel.value)
    );
  }, [existingParentMappings]);

  // Update relationship when existing mappings change
  useEffect(() => {
    const availableRelationships = getAvailableRelationships();
    if (availableRelationships.length > 0 && !availableRelationships.some(rel => rel.value === selectedRelationship)) {
      setSelectedRelationship(availableRelationships[0].value);
    }
  }, [existingParentMappings, selectedRelationship, getAvailableRelationships]);

  const handleSearch = async () => {
    if (!token || !searchTerm.trim()) return;

    try {
      setIsSearching(true);
      const response = await parentServices.getAllParents(token, { 
        search: searchTerm.trim(),
        limit: 50 
      });

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        setError('Unexpected response format from API');
        return;
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        setError(response.message || 'Search failed. Please try again.');
        return;
      }

      // Handle successful response
      if ('status' in response && response.status === 'success' && response.data) {
        setFilteredParents(response.data.parents || []);
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (err) {
      console.error('Error searching parents:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkParent = () => {
    if (!selectedParentId) {
      setError('Please select a parent');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      onLinkParent(selectedParentId, selectedRelationship, isPrimary, accessLevel);
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
  };

  const handleCreateParentSuccess = (parentId: string) => {
    // Refresh the parents list to include the newly created parent
    fetchParents();
    // Optionally select the newly created parent
    setSelectedParentId(parentId);
  };

  const handleParentSelect = (parentId: string) => {
    setSelectedParentId(parentId);
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
      
      {/* Search Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="parent-search">Search Parents by {searchType.charAt(0).toUpperCase() + searchType.slice(1)}</Label>
          <Button 
            onClick={() => setShowCreateParent(true)}
            variant="outline"
            className="bg-primary hover:bg-primary/90 text-white border-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Parent
          </Button>
        </div>
        <div className="flex gap-2">
          <Select value={searchType} onValueChange={(value) => {
            setSearchType(value as 'name' | 'phone' | 'email');
            setSearchTerm(''); // Clear search when changing type
            setFilteredParents(parents); // Reset to initial parents
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="parent-search"
              placeholder={
                searchType === 'name' ? 'Enter parent name...' :
                searchType === 'phone' ? 'Enter phone number...' :
                'Enter email address...'
              }
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              title={`Search parents by ${searchType}`}
            />
          </div>
          {searchTerm && (
            <Button 
              onClick={() => {
                setSearchTerm('');
                setFilteredParents(parents);
              }}
              variant="ghost"
              size="sm"
              title="Clear search and show initial 10 parents"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* Parents Table */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Available Parents</Label>
          {!searchTerm ? (
            <span className="text-sm text-muted-foreground">
              Showing first 10 parents. Use search to find more.
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Search results for {searchType}: &quot;{searchTerm}&quot; ({filteredParents.length} found)
            </span>
          )}
        </div>
        <div className="border rounded-md max-h-64 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Select</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Children</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSearching ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Searching parents...</p>
                  </TableCell>
                </TableRow>
              ) : filteredParents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? (
                      <div className="space-y-2">
                        <p>No parents found matching your search.</p>
                        <p className="text-sm">Try a different search term or create a new parent.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p>No parents available.</p>
                        <p className="text-sm">Try searching by name, phone, or email, or create a new parent.</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredParents.map((parent) => (
                  <TableRow 
                    key={parent.id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      selectedParentId === parent.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleParentSelect(parent.id)}
                  >
                    <TableCell>
                      <input
                        type="radio"
                        name="selectedParent"
                        value={parent.id}
                        checked={selectedParentId === parent.id}
                        onChange={() => handleParentSelect(parent.id)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{parent.full_name}</TableCell>
                    <TableCell>{parent.phone_number}</TableCell>
                    <TableCell>{parent.email || 'Not provided'}</TableCell>
                                         <TableCell>
                       <Badge variant="outline">
                         {parent.children?.length || 0} child{(parent.children?.length || 0) !== 1 ? 'ren' : ''}
                       </Badge>
                     </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Configuration Section - Only show when a parent is selected */}
      {selectedParentId && (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
              <SelectTrigger id="relationship">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getAvailableRelationships().map((rel) => (
                  <SelectItem key={rel.value} value={rel.value}>
                    {rel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getAvailableRelationships().length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                All relationship types are already assigned to this student.
              </p>
            )}
          </div>
          

        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
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

      {/* Create Parent Modal */}
      <CreateParentModal
        isOpen={showCreateParent}
        onClose={() => setShowCreateParent(false)}
        onSuccess={handleCreateParentSuccess}
        studentAdmissionNumber={studentAdmissionNumber}
        relationship={relationship}
      />
    </div>
  );
}