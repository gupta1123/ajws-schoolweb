
// src/app/(admin)/academic/subjects/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

// Define the Subject type
interface Subject {
  id: string;
  name: string;
  description: string;
}

// Mock data for subjects
const mockSubjects: Subject[] = [
  { id: 'sub1', name: 'Mathematics', description: 'Core mathematical concepts' },
  { id: 'sub2', name: 'Science', description: 'Physics, Chemistry, Biology' },
  { id: 'sub3', name: 'English', description: 'Language and Literature' },
  { id: 'sub4', name: 'History', description: 'Study of past events' },
];

export default function ManageSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(mockSubjects);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);

  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentSubject({ id: '', name: '', description: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setIsEditing(true);
    setCurrentSubject({ ...subject });
    setIsDialogOpen(true);
  };

  const handleDelete = (subjectId: string) => {
    setSubjects(subjects.filter((sub) => sub.id !== subjectId));
  };

  const handleSave = () => {
    if (!currentSubject) return;
    
    if (isEditing) {
      setSubjects(subjects.map((sub) => (sub.id === currentSubject.id ? currentSubject : sub)));
    } else {
      setSubjects([...subjects, { ...currentSubject, id: `sub${Date.now()}` }]);
    }
    setIsDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentSubject) return;
    
    const { name, value } = e.target;
    setCurrentSubject({ ...currentSubject, [name]: value });
  };

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Subject Management</CardTitle>
            <CardDescription>Manage academic subjects offered by the school.</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Subject
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>{subject.description}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(subject)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(subject.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input id="name" name="name" value={currentSubject?.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" value={currentSubject?.description} onChange={handleInputChange} />
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
