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
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';

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
            <div className="py-4 flex items-center space-x-4">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  {mockClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {activeTab === 'Uniform' && (
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockGenders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <TabsContent value={activeTab}>
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