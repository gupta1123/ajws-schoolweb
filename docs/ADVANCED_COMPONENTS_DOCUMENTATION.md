# Advanced UI Components Documentation

## Introduction
This documentation provides comprehensive guidance on using the 18 new advanced UI components created for the School Management System. These components extend the basic shadcn/ui components to provide rich, interactive user experiences.

## Component Catalog

### 1. Notification Badge
**Purpose**: Display unread message counts or notification indicators

#### Props
```typescript
interface NotificationBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
  maxCount?: number;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}
```

#### Usage
```tsx
import { NotificationBadge } from '@/components/ui/notification-badge';

// Basic usage
<NotificationBadge count={5} />

// With custom max count
<NotificationBadge count={150} maxCount={99} />

// With different variants
<NotificationBadge count={3} variant="warning" />
<NotificationBadge count={12} variant="destructive" />
```

#### Features
- Automatically hides when count is 0
- Supports custom maximum count (e.g., "99+" for counts > 99)
- Multiple color variants for different notification types
- Responsive sizing that adapts to container

### 2. Data Chart
**Purpose**: Interactive data visualization with multiple chart types

#### Props
```typescript
interface DataChartProps {
  title?: string;
  description?: string;
  data: any[];
  type: 'bar' | 'line' | 'pie';
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  colors?: string[];
  className?: string;
}
```

#### Usage
```tsx
import { DataChart } from '@/components/ui/data-chart';

// Bar chart
<DataChart
  title="Student Performance"
  data={[
    { subject: 'Math', score: 85 },
    { subject: 'Science', score: 78 },
    { subject: 'English', score: 92 }
  ]}
  type="bar"
  dataKey="score"
  xAxisKey="subject"
  height={300}
/>

// Line chart
<DataChart
  title="Attendance Trends"
  data={[
    { week: 'Week 1', rate: 92 },
    { week: 'Week 2', rate: 88 },
    { week: 'Week 3', rate: 95 }
  ]}
  type="line"
  dataKey="rate"
  xAxisKey="week"
  height={300}
  colors={['#10b981']}
/>
```

#### Features
- Three chart types: bar, line, and pie
- Responsive design with Recharts
- Customizable colors and dimensions
- Interactive tooltips and legends
- Support for complex data structures

### 3. Search Filter
**Purpose**: Advanced search and filtering capabilities

#### Props
```typescript
interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  placeholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    type: 'select' | 'checkbox' | 'date';
    options?: Array<{ value: string; label: string }>;
  }>;
  className?: string;
}
```

#### Usage
```tsx
import { SearchFilter } from '@/components/ui/search-filter';

<SearchFilter
  placeholder="Search students..."
  onSearch={(query) => console.log('Search query:', query)}
  onFilter={(filters) => console.log('Active filters:', filters)}
  filters={[
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    {
      key: 'featured',
      label: 'Featured',
      type: 'checkbox'
    }
  ]}
/>
```

#### Features
- Text search with enter key support
- Multiple filter types (select, checkbox, date)
- Visual filter indicators
- Clear all filters functionality
- Responsive layout for different screen sizes

### 4. Comment Thread
**Purpose**: Threaded conversation interface for discussions

#### Props
```typescript
interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies: Comment[];
}

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => void;
  className?: string;
}
```

#### Usage
```tsx
import { CommentThread } from '@/components/ui/comment-thread';

<CommentThread
  comments={comments}
  onAddComment={(content, parentId) => {
    // Handle adding comment
    console.log('Adding comment:', { content, parentId });
  }}
/>
```

#### Features
- Nested reply support
- User avatars and role identification
- Like functionality
- Timestamp formatting
- Rich text comment input

### 5. Timeline
**Purpose**: Chronological event visualization

#### Props
```typescript
interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  author?: {
    name: string;
    role: string;
  };
  details?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}
```

#### Usage
```tsx
import { Timeline } from '@/components/ui/timeline';

<Timeline
  events={[
    {
      id: '1',
      title: 'Homework Assigned',
      description: 'Mathematics - Chapter 3 exercises',
      type: 'info',
      timestamp: '2025-08-15T09:00:00Z',
      author: {
        name: 'Sarah Wilson',
        role: 'teacher'
      }
    }
  ]}
/>
```

#### Features
- Color-coded event types (info, success, warning, error)
- Expandable event details
- Author and timestamp information
- Vertical timeline layout with decorative elements
- Responsive design

### 6. Bulk Action Toolbar
**Purpose**: Multi-item selection and batch operations

#### Props
```typescript
interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  className?: string;
}
```

#### Usage
```tsx
import { BulkActionToolbar } from '@/components/ui/bulk-action-toolbar';

<BulkActionToolbar
  selectedCount={selectedItems.length}
  onClearSelection={() => setSelectedItems([])}
  actions={[
    {
      label: 'Message',
      icon: <Mail className="h-4 w-4" />,
      onClick: () => handleBulkAction('message'),
      variant: 'outline'
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => handleBulkAction('delete'),
      variant: 'destructive'
    }
  ]}
/>
```

#### Features
- Selection count display
- Customizable action buttons
- Clear selection functionality
- Responsive layout

### 7. File Uploader
**Purpose**: Drag-and-drop file upload interface

#### Props
```typescript
interface FileUploaderProps {
  onFilesSelected?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
}
```

#### Usage
```tsx
import { FileUploader } from '@/components/ui/file-uploader';

<FileUploader
  onFilesSelected={(files) => console.log('Selected files:', files)}
  onUpload={async (files) => {
    // Handle file upload
    console.log('Uploading files:', files);
  }}
  accept=".pdf,.doc,.docx,.jpg,.png"
  maxFiles={5}
  maxSize={10} // 10MB
/>
```

#### Features
- Drag and drop support
- File validation (size, count, type)
- Upload progress visualization
- Success/error status indicators
- File size formatting

### 8. Sortable List
**Purpose**: Reorderable list with drag-and-drop functionality

#### Props
```typescript
interface SortableItem {
  id: string;
  content: React.ReactNode;
  [key: string]: any;
}

interface SortableListProps {
  items: SortableItem[];
  onChange: (items: SortableItem[]) => void;
  renderItem?: (item: SortableItem, index: number) => React.ReactNode;
  className?: string;
}
```

#### Usage
```tsx
import { SortableList } from '@/components/ui/sortable-list';

<SortableList
  items={sortableItems}
  onChange={setSortableItems}
  renderItem={(item) => (
    <div className="p-3">
      <span>{item.content}</span>
      <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
        {item.priority}
      </span>
    </div>
  )}
/>
```

#### Features
- Drag-and-drop reordering
- Manual move up/down controls
- Item removal functionality
- Visual drag handles
- Empty state handling

### 9. Progress Indicator
**Purpose**: Status-based progress indication

#### Props
```typescript
interface ProgressIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressIndicatorVariants> {
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  showIcon?: boolean;
}
```

#### Usage
```tsx
import { ProgressIndicator } from '@/components/ui/progress-indicator';

<ProgressIndicator status="pending" />
<ProgressIndicator status="in-progress" />
<ProgressIndicator status="completed" />
<ProgressIndicator status="failed" />
<ProgressIndicator status="cancelled" />
```

#### Features
- Five status types with appropriate visual styling
- Optional icons for each status
- Multiple size variants
- Color-coded status indication

### 10. Stat Card
**Purpose**: Metric display with trend information

#### Props
```typescript
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}
```

#### Usage
```tsx
import { StatCard } from '@/components/ui/stat-card';

<StatCard
  title="Total Students"
  value="1,247"
  description="Across all grades"
  trend="up"
  trendValue="+12%"
  icon={<Users className="h-5 w-5" />}
/>
```

#### Features
- Metric value with descriptive title
- Trend information with directional indicators
- Optional icon support
- Responsive design

### 11. Quick Action Button
**Purpose**: Vertically oriented action buttons with icons

#### Props
```typescript
interface QuickActionButtonProps extends ButtonProps {
  href?: string;
  icon?: React.ReactNode;
  label: string;
  description?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
}
```

#### Usage
```tsx
import { QuickActionButton } from '@/components/ui/quick-action-button';

<QuickActionButton
  href="/homework/create"
  icon={<BookOpen className="h-6 w-6" />}
  label="Homework"
  description="Create assignments"
/>
```

#### Features
- Icon and text combination in vertical layout
- Link support for navigation
- Multiple variant options
- Responsive sizing

## Implementation Guidelines

### Performance Optimization
1. **Lazy Loading**: Use dynamic imports for heavy components
```tsx
import dynamic from 'next/dynamic';

const DataChart = dynamic(
  () => import('@/components/ui/data-chart'),
  { ssr: false }
);
```

2. **Virtualization**: For large lists, implement virtual scrolling
3. **Memoization**: Use React.memo for components with expensive renders
4. **Debouncing**: For search inputs and filters

### Accessibility
1. **Semantic HTML**: Proper element usage for screen readers
2. **Keyboard Navigation**: Full keyboard support for all interactive elements
3. **ARIA Attributes**: Proper labeling and roles
4. **Color Contrast**: WCAG 2.1 AA compliance

### Responsive Design
1. **Mobile-First**: Design for mobile screens first
2. **Flexible Grids**: Use CSS Grid and Flexbox for layouts
3. **Touch Targets**: Minimum 44px tap targets for mobile
4. **Breakpoints**: Consistent media query breakpoints

## Best Practices

### Component Composition
1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Use TypeScript interfaces for clear prop definitions
3. **Default Props**: Provide sensible defaults for optional props
4. **Children Pattern**: Support composition through children props

### State Management
1. **Local State**: Keep component state local when possible
2. **Controlled Components**: Prefer controlled over uncontrolled components
3. **Callback Props**: Use callback props for parent-child communication
4. **State Lifting**: Lift state up when components need to share data

### Error Handling
1. **Graceful Degradation**: Components should work even when data is missing
2. **Error Boundaries**: Wrap components in error boundaries for production
3. **Validation**: Validate props with PropTypes or TypeScript
4. **Loading States**: Show appropriate loading indicators

## Testing Recommendations

### Unit Tests
1. **Rendering**: Test component rendering with various props
2. **Interactions**: Test user interactions and event handling
3. **Edge Cases**: Test empty states, error conditions, and boundary values
4. **Accessibility**: Test keyboard navigation and screen reader support

### Integration Tests
1. **Component Composition**: Test how components work together
2. **Data Flow**: Test parent-child data flow and state updates
3. **API Integration**: Test component integration with backend APIs

### Visual Regression
1. **Snapshot Testing**: Use snapshot testing for UI consistency
2. **Cross-Browser**: Test components across different browsers
3. **Responsive**: Test components at different viewport sizes

## Maintenance Guidelines

### Versioning
1. **Semantic Versioning**: Follow semver for component APIs
2. **Breaking Changes**: Clearly document breaking changes
3. **Deprecation**: Provide deprecation warnings before removing features
4. **Migration Guides**: Provide clear migration guides for major updates

### Documentation
1. **Inline Comments**: Document complex logic with inline comments
2. **README Updates**: Keep component documentation up to date
3. **Examples**: Provide clear usage examples
4. **Best Practices**: Document recommended usage patterns

This comprehensive documentation should help developers effectively use and maintain the new advanced UI components in the School Management System.