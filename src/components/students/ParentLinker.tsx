
// src/components/students/ParentLinker.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for existing parents
const mockParents = [
  { id: 'p1', name: 'Rajesh Patel' },
  { id: 'p2', name: 'Priya Patel' },
  { id: 'p3', name: 'Amit Singh' },
];

interface Parent {
  id: string;
  name: string;
}

interface NewParentData {
  name: string;
  email: string;
  phone: string;
}

interface ParentLinkerProps {
  onParentLink: (parentId: string) => void;
  onParentCreate: (parentData: { id: string; full_name: string; phone_number: string; email: string }) => void;
}

export function ParentLinker({ onParentLink, onParentCreate }: ParentLinkerProps) {
  const [activeTab, setActiveTab] = useState('link');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [newParentData, setNewParentData] = useState<NewParentData>({
    name: '',
    email: '',
    phone: '',
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedParent(null); // Reset selection on new search
  };

  const handleSelectParent = (parent: Parent) => {
    setSelectedParent(parent);
    onParentLink(parent.id);
  };

  const handleNewParentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewParentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateParent = () => {
    // In a real app, you'd get the created parent object back from the API
    const createdParent = { 
      id: `p${Date.now()}`,
      full_name: newParentData.name,
      phone_number: newParentData.phone,
      email: newParentData.email
    };
    onParentCreate(createdParent);
  };

  const filteredParents = mockParents.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Parent/Guardian</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Link Existing</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>
          <TabsContent value="link">
            <div className="space-y-4 py-4">
              <Input
                placeholder="Search for a parent by name..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="space-y-2">
                {searchTerm && filteredParents.map((parent) => (
                  <div
                    key={parent.id}
                    className={`p-2 border rounded-md cursor-pointer ${
                      selectedParent?.id === parent.id ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleSelectParent(parent)}
                  >
                    {parent.name}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="create">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={newParentData.name} onChange={handleNewParentChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={newParentData.email} onChange={handleNewParentChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={newParentData.phone} onChange={handleNewParentChange} />
              </div>
              <Button onClick={handleCreateParent} className="mt-2">Create and Link Parent</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
