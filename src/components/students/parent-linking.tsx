// src/components/students/parent-linking.tsx

'use client';

import { useState, useEffect } from 'react';
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
import { AlertCircle, CheckCircle, User, Search, Loader2 } from 'lucide-react';
import { parentServices } from '@/lib/api/parents';
import { useAuth } from '@/lib/auth/context';

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
}

export function ParentLinking({ onLinkParent, onCancel, existingParentMappings = [] }: ParentLinkingProps) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [relationship, setRelationship] = useState('father');
  const [isPrimary, setIsPrimary] = useState(true); // Default to primary guardian
  const [accessLevel, setAccessLevel] = useState('full'); // Default to full access
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [parents, setParents] = useState<ParentData[]>([]);
  const [filteredParents, setFilteredParents] = useState<ParentData[]>([]);

  // Fetch parents when component mounts
  useEffect(() => {
    if (token) {
      fetchParents();
    }
  }, [token]);

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
  const getAvailableRelationships = () => {
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
  };

  // Update relationship when existing mappings change
  useEffect(() => {
    const availableRelationships = getAvailableRelationships();
    if (availableRelationships.length > 0 && !availableRelationships.some(rel => rel.value === relationship)) {
      setRelationship(availableRelationships[0].value);
    }
  }, [existingParentMappings]);

  const fetchParents = async () => {
    if (!token) return;

    try {
      setIsSearching(true);
      const response = await parentServices.getAllParents(token, { limit: 100 });

      if (response.status === 'success' && response.data) {
        setParents(response.data.parents || []);
        setFilteredParents(response.data.parents || []);
      } else if (response.status === 'error') {
        setError('Failed to fetch parents. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching parents:', err);
      setError('Failed to fetch parents. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!token || !searchTerm.trim()) return;

    try {
      setIsSearching(true);
      const response = await parentServices.getAllParents(token, { 
        search: searchTerm.trim(),
        limit: 100 
      });

      if (response.status === 'success' && response.data) {
        setFilteredParents(response.data.parents || []);
      } else if (response.status === 'error') {
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
      onLinkParent(selectedParentId, relationship, isPrimary, accessLevel);
      setSuccess(true);
      // Reset success after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError('Failed to link parent. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        <Label htmlFor="parent-search">Search Parents</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="parent-search"
              placeholder="Search by name, phone, or email"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchTerm.trim()}
            variant="outline"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </div>
      
      {/* Parents Table */}
      <div className="space-y-2">
        <Label>Available Parents</Label>
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
                    {searchTerm ? 'No parents found matching your search.' : 'No parents available.'}
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
            <Select value={relationship} onValueChange={setRelationship}>
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
    </div>
  );
}