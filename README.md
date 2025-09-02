# School AJWS - School Management System

A comprehensive school management web application built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Admin Panel
- **Academic Structure Management**: Manage academic years, classes, sections, and subjects
- **Staff Management**: Handle teacher assignments, roles, and permissions
- **Student Management**: Student enrollment and profile management
- **Parent Management**: Parent information and communication
- **Bulk Import**: Import students, teachers, and parents via CSV
- **Reports & Analytics**: Comprehensive reporting system
- **Approvals System**: Manage leave requests and approvals

### Teacher Dashboard
- **Attendance Management**: Take and manage class attendance
- **Homework & Classwork**: Create and manage assignments
- **Assessments**: Create and grade assessments
- **Announcements**: Communicate with students and parents
- **Study Materials**: Share learning resources
- **Timetable Management**: View and manage class schedules

### Additional Features
- **Calendar System**: Event management and scheduling
- **Messaging System**: Internal communication between staff, students, and parents
- **Leave Request System**: Manage staff leave requests
- **Birthday Tracking**: Track and celebrate student birthdays
- **Reports Generation**: Generate various school reports

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ajws-schoolweb-main
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (admin)/           # Admin protected routes
│   ├── (auth)/            # Authentication pages
│   ├── (teacher)/         # Teacher protected routes
│   └── ...                # Other pages
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── academic/         # Academic management components
│   ├── attendance/       # Attendance components
│   └── ...               # Other feature components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── api/             # API client functions
│   ├── auth/            # Authentication utilities
│   └── utils/           # General utilities
└── types/               # TypeScript type definitions
```

## Authentication

The application uses role-based authentication with the following user types:
- **Admin**: Full system access and management
- **Teacher**: Class and student management
- **Staff**: Limited access based on assigned roles

## API Documentation

API documentation can be found in the `docs/` directory:
- `api.md` - Main API documentation
- `newapi.md` - Updated API specifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is private and proprietary.
