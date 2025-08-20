// src/components/academic/academic-structure-manager.test.tsx

import { render, screen } from '@testing-library/react';
import { AcademicStructureManager } from './academic-structure-manager';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the useAuth hook
jest.mock('@/lib/auth/context', () => ({
  useAuth: () => ({
    user: { role: 'admin' },
  }),
}));

describe('AcademicStructureManager', () => {
  it('renders without crashing', () => {
    render(<AcademicStructureManager />);
    expect(screen.getByText('Academic Structure Hierarchy')).toBeInTheDocument();
  });

  it('displays navigation tabs', () => {
    render(<AcademicStructureManager />);
    expect(screen.getByText('Hierarchy View')).toBeInTheDocument();
    expect(screen.getByText('Class Levels')).toBeInTheDocument();
    expect(screen.getByText('Class Divisions')).toBeInTheDocument();
    expect(screen.getByText('Academic Years')).toBeInTheDocument();
  });
});