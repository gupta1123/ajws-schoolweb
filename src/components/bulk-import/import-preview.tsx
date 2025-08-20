// src/components/bulk-import/import-preview.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { FileText } from 'lucide-react';

type StudentData = {
  fullName: string;
  admissionNumber: string;
  dateOfBirth: string;
  classLevel: string;
  division: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  address: string;
};

type ParentData = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  studentName: string;
  studentAdmissionNumber: string;
};

type TeacherData = {
  fullName: string;
  phone: string;
  email: string;
  department: string;
  subject: string;
  qualification: string;
  experience: string;
};

interface ImportPreviewProps {
  data: StudentData[] | ParentData[] | TeacherData[];
  type: 'students' | 'parents' | 'teachers';
}

export function ImportPreview({ data, type }: ImportPreviewProps) {
  const renderStudentHeaders = () => (
    <>
      <TableHead>Full Name</TableHead>
      <TableHead>Admission Number</TableHead>
      <TableHead>Date of Birth</TableHead>
      <TableHead>Class</TableHead>
      <TableHead>Division</TableHead>
      <TableHead>Father Name</TableHead>
      <TableHead>Mother Name</TableHead>
      <TableHead>Phone</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Address</TableHead>
    </>
  );

  const renderStudentRow = (item: StudentData, index: number) => (
    <TableRow key={index}>
      <TableCell className="font-medium">{item.fullName}</TableCell>
      <TableCell>{item.admissionNumber}</TableCell>
      <TableCell>{item.dateOfBirth}</TableCell>
      <TableCell>{item.classLevel}</TableCell>
      <TableCell>{item.division}</TableCell>
      <TableCell>{item.fatherName}</TableCell>
      <TableCell>{item.motherName}</TableCell>
      <TableCell>{item.phone}</TableCell>
      <TableCell>{item.email}</TableCell>
      <TableCell>{item.address}</TableCell>
    </TableRow>
  );

  const renderParentHeaders = () => (
    <>
      <TableHead>Full Name</TableHead>
      <TableHead>Phone</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Address</TableHead>
      <TableHead>Student Name</TableHead>
      <TableHead>Student Admission Number</TableHead>
    </>
  );

  const renderParentRow = (item: ParentData, index: number) => (
    <TableRow key={index}>
      <TableCell className="font-medium">{item.fullName}</TableCell>
      <TableCell>{item.phone}</TableCell>
      <TableCell>{item.email}</TableCell>
      <TableCell>{item.address}</TableCell>
      <TableCell>{item.studentName}</TableCell>
      <TableCell>{item.studentAdmissionNumber}</TableCell>
    </TableRow>
  );

  const renderTeacherHeaders = () => (
    <>
      <TableHead>Full Name</TableHead>
      <TableHead>Phone</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Department</TableHead>
      <TableHead>Subject</TableHead>
      <TableHead>Qualification</TableHead>
      <TableHead>Experience</TableHead>
    </>
  );

  const renderTeacherRow = (item: TeacherData, index: number) => (
    <TableRow key={index}>
      <TableCell className="font-medium">{item.fullName}</TableCell>
      <TableCell>{item.phone}</TableCell>
      <TableCell>{item.email}</TableCell>
      <TableCell>{item.department}</TableCell>
      <TableCell>{item.subject}</TableCell>
      <TableCell>{item.qualification}</TableCell>
      <TableCell>{item.experience}</TableCell>
    </TableRow>
  );

  const getTitle = () => {
    switch (type) {
      case 'students': return 'Student Data Preview';
      case 'parents': return 'Parent Data Preview';
      case 'teachers': return 'Teacher Data Preview';
      default: return 'Data Preview';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'students': return 'Review the student data before importing';
      case 'parents': return 'Review the parent data before importing';
      case 'teachers': return 'Review the teacher data before importing';
      default: return 'Review the data before importing';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <CardTitle>{getTitle()}</CardTitle>
        </div>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {type === 'students' && renderStudentHeaders()}
                {type === 'parents' && renderParentHeaders()}
                {type === 'teachers' && renderTeacherHeaders()}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <>
                  {type === 'students' && renderStudentRow(item as StudentData, index)}
                  {type === 'parents' && renderParentRow(item as ParentData, index)}
                  {type === 'teachers' && renderTeacherRow(item as TeacherData, index)}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Showing {data.length} records. Please verify all data is correct before importing.
        </p>
      </CardContent>
    </Card>
  );
}