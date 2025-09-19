// src/app/(admin)/resources/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Edit, Trash2, Search, X, Filter } from 'lucide-react';

// Define the Resource type
interface Resource {
  id: string;
  name: string;
  type: string;
  stock: number;
  class: string;
  gender: string;
}

// Mock data for resources with more detail
const mockResources: Resource[] = [
  { id: 'res1', name: 'Grade 5 Mathematics Textbook', type: 'Book', stock: 120, class: 'Grade 5', gender: 'N/A' },
  { id: 'res2', name: 'Medium Summer Uniform Set', type: 'Uniform', stock: 85, class: 'Grade 1-5', gender: 'Male' },
  { id: 'res3', name: 'Grade 5 Science Textbook', type: 'Book', stock: 110, class: 'Grade 5', gender: 'N/A' },
  { id: 'res4', name: 'Large Winter Uniform Set', type: 'Uniform', stock: 75, class: 'Grade 6-10', gender: 'Female' },
  { id: 'res5', name: 'School Diary 2025-26', type: 'Stationery', stock: 200, class: 'All', gender: 'N/A' },
  { id: 'res6', name: 'Medium Summer Uniform Set', type: 'Uniform', stock: 95, class: 'Grade 1-5', gender: 'Female' },
];

const mockClasses = ['All', 'Grade 1-5', 'Grade 5', 'Grade 6-10'];
const mockGenders = ['All', 'Male', 'Female', 'N/A'];

export default function ManageResourcesPage() {
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');

  const filteredResources = useMemo(() => {
    return resources
      .filter(res => activeTab === 'All' || res.type === activeTab)
      .filter(res => res.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(res => classFilter === 'All' || res.class === classFilter)
      .filter(res => genderFilter === 'All' || res.gender === genderFilter);
  }, [resources, activeTab, searchTerm, classFilter, genderFilter]);

  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentResource({ id: '', name: '', type: '', stock: 0, class: 'All', gender: 'N/A' });
    setIsDialogOpen(true);
  };

  const handleEdit = (resource: Resource) => {
    setIsEditing(true);
    setCurrentResource({ ...resource });
    setIsDialogOpen(true);
  };

  const handleDelete = (resourceId: string) => {
    setResources(resources.filter((res) => res.id !== resourceId));
  };

  const handleSave = () => {
    if (!currentResource) return;
    
    if (isEditing) {
      setResources(resources.map((res) => (res.id === currentResource.id ? currentResource : res)));
    } else {
      setResources([...resources, { ...currentResource, id: `res${Date.now()}` }]);
    }
    setIsDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentResource) return;
    
    const { name, value } = e.target;
    setCurrentResource({ ...currentResource, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (!currentResource) return;
    
    setCurrentResource({ ...currentResource, [name]: value });
  };

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Resource Management</CardTitle>
            <CardDescription>Manage books, uniforms, and other school resources.</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Resource
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="All">All Resources</TabsTrigger>
              <TabsTrigger value="Book">Books</TabsTrigger>
              <TabsTrigger value="Uniform">Uniforms</TabsTrigger>
              <TabsTrigger value="Stationery">Stationery</TabsTrigger>
            </TabsList>
            {/* Enhanced Search and Filter Section */}
            <div className="py-4 space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search resources by name..." 
                    className="pl-10 pr-10" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {/* Filter Count Badge */}
                {(searchTerm || classFilter !== 'All' || genderFilter !== 'All') && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Filters active</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setClassFilter('All');
                        setGenderFilter('All');
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Class:</Label>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                {activeTab === 'Uniform' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Gender:</Label>
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Genders" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockGenders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                  {filteredResources.length} of {resources.length} resources
                </div>
              </div>
            </div>
            <TabsContent value={activeTab}>
              {filteredResources.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No resources found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || classFilter !== 'All' || genderFilter !== 'All' 
                      ? "Try adjusting your search criteria or filters"
                      : "No resources available for this category"
                    }
                  </p>
                  {(searchTerm || classFilter !== 'All' || genderFilter !== 'All') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setClassFilter('All');
                        setGenderFilter('All');
                      }}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>{resource.name}</TableCell>
                        <TableCell>{resource.type}</TableCell>
                        <TableCell>{resource.class}</TableCell>
                        <TableCell>{resource.gender}</TableCell>
                        <TableCell>{resource.stock}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(resource)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(resource.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Resource Name</Label>
              <Input id="name" name="name" value={currentResource?.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Resource Type</Label>
              <Select name="type" value={currentResource?.type} onValueChange={(value) => handleSelectChange('type', value)}>
                <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Book">Book</SelectItem>
                  <SelectItem value="Uniform">Uniform</SelectItem>
                  <SelectItem value="Stationery">Stationery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select name="class" value={currentResource?.class} onValueChange={(value) => handleSelectChange('class', value)}>
                <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
                <SelectContent>
                  {mockClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {currentResource?.type === 'Uniform' && (
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select name="gender" value={currentResource?.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                  <SelectTrigger><SelectValue placeholder="Select a gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" name="stock" type="number" value={currentResource?.stock} onChange={handleInputChange} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}