// src/app/(admin)/academic/classes/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

// Mock data - in a real application, this would come from an API
interface ClassData {
  id: string;
  name: string;
  section: string;
  teacher: { id: string; name: string } | null;
  subjects: string[];
}

const mockClasses: ClassData[] = [
  { id: 'c1', name: 'Grade 1', section: 'A', teacher: null, subjects: ['sub1', 'sub2'] },
  { id: 'c2', name: 'Grade 1', section: 'B', teacher: { id: 't2', name: 'Jane Smith' }, subjects: ['sub1', 'sub3'] },
  { id: 'c3', name: 'Grade 2', section: 'A', teacher: null, subjects: [] },
  { id: 'c4', name: 'Grade 2', section: 'B', teacher: null, subjects: ['sub2'] },
];

const mockTeachers = [
  { id: 't1', name: 'John Doe' },
  { id: 't2', name: 'Jane Smith' },
  { id: 't3', name: 'Peter Jones' },
  { id: 't4', name: 'Mary Williams' },
];

const mockSubjects = [
  { id: 'sub1', name: 'Mathematics' },
  { id: 'sub2', name: 'Science' },
  { id: 'sub3', name: 'English' },
  { id: 'sub4', name: 'History' },
];

export default function ManageClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>(mockClasses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClass, setCurrentClass] = useState<ClassData | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const handleAddNewClass = () => {
    setIsEditing(false);
    setCurrentClass({ id: '', name: '', section: '', teacher: null, subjects: [] });
    setSelectedTeacherId('');
    setSelectedSubjects([]);
    setIsDialogOpen(true);
  };

  const handleEditClass = (classData: ClassData) => {
    setIsEditing(true);
    setCurrentClass({ ...classData });
    setSelectedTeacherId(classData.teacher?.id || '');
    setSelectedSubjects(classData.subjects || []);
    setIsDialogOpen(true);
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(classes.filter((cls) => cls.id !== classId));
  };

  const handleSaveClass = () => {
    if (!currentClass) return;
    
    if (isEditing) {
      setClasses(classes.map((cls) =>
        cls.id === currentClass.id
          ? { 
              ...currentClass,
              teacher: mockTeachers.find((t) => t.id === selectedTeacherId) || null,
              subjects: selectedSubjects,
            }
          : cls
      ));
    } else {
      setClasses([
        ...classes,
        {
          ...currentClass,
          id: `c${Date.now()}`,
          teacher: mockTeachers.find((t) => t.id === selectedTeacherId) || null,
          subjects: selectedSubjects,
        },
      ]);
    }
    setIsDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (currentClass) {
      setCurrentClass({ ...currentClass, [name]: value });
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Class Management</CardTitle>
            <CardDescription>Manage classes, sections, teachers, and subjects.</CardDescription>
          </div>
          <Button onClick={handleAddNewClass}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Class
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classes.map((classItem) => (
              <div key={classItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">{classItem.name} - {classItem.section}</p>
                  <p className="text-sm text-gray-500">
                    {classItem.teacher ? `Teacher: ${classItem.teacher.name}` : 'No teacher assigned'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Subjects: {classItem.subjects.length > 0 
                      ? classItem.subjects.map(subId => mockSubjects.find(s => s.id === subId)?.name).join(', ')
                      : 'None'}
                  </p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClass(classItem)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(classItem.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Class' : 'Add New Class'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input id="name" name="name" value={currentClass?.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input id="section" name="section" value={currentClass?.section} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">Assign Teacher</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {mockTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign Subjects</Label>
              <div className="grid grid-cols-2 gap-2">
                {mockSubjects.map((subject) => (
                  <Button
                    key={subject.id}
                    variant={selectedSubjects.includes(subject.id) ? 'default' : 'outline'}
                    onClick={() => handleSubjectToggle(subject.id)}
                  >
                    {subject.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveClass}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
