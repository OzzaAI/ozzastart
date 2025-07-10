# Project Management UI Components

This directory contains comprehensive UI components for the Ozza project management system. These components are built with Next.js 13+, TypeScript, Tailwind CSS, and Shadcn/ui components.

## Component Overview

### Core Components

#### 1. ProjectDashboard
**File:** `ProjectDashboard.tsx`

The main dashboard for viewing all projects within an agency.

**Features:**
- Project overview cards with stats
- Grid and list view modes
- Search and filter functionality
- Project status and priority indicators
- Team member avatars
- Progress tracking
- Real-time updates ready

**Props:**
```typescript
interface ProjectDashboardProps {
  agencyId: string
  userId: string
  userRole: string
}
```

#### 2. ProjectDetailView
**File:** `ProjectDetailView.tsx`

Detailed view of an individual project with comprehensive management features.

**Features:**
- Project header with key metrics
- Tabbed interface (Overview, Tasks, Milestones, Files, Time, Comments)
- Progress visualization
- Team management
- Recent activity feed
- Role-based UI elements

**Props:**
```typescript
interface ProjectDetailViewProps {
  projectId: string
  userId: string
  userRole: string
}
```

#### 3. TaskManagement
**File:** `TaskManagement.tsx`

Advanced task management with Kanban board and list views.

**Features:**
- Kanban board with drag-and-drop (ready for implementation)
- List view with sorting and filtering
- Task creation and editing
- Priority and status management
- Task assignment
- Comments and file attachment indicators
- Overdue task highlighting

**Props:**
```typescript
interface TaskManagementProps {
  projectId: string
  userId: string
  userRole: string
}
```

#### 4. ClientPortal
**File:** `ClientPortal.tsx`

Client-facing interface with limited, user-friendly access.

**Features:**
- Simplified project overview
- Milestone progress tracking
- Deliverable approval workflow
- Client feedback system
- Non-technical language
- Mobile-responsive design

**Props:**
```typescript
interface ClientPortalProps {
  projectId: string
  userId: string
  userRole: string
}
```

#### 5. TimeTracking
**File:** `TimeTracking.tsx`

Comprehensive time tracking with timer and manual entry.

**Features:**
- Active timer with start/stop/pause
- Manual time entry
- Task-specific time tracking
- Billable/non-billable hours
- Time reporting and analytics
- Export functionality (ready)

**Props:**
```typescript
interface TimeTrackingProps {
  projectId: string
  userId: string
  userRole: string
}
```

#### 6. FileManagement
**File:** `FileManagement.tsx`

File upload, organization, and deliverable management.

**Features:**
- Drag-and-drop file upload
- File preview and download
- Visibility controls (project/client/internal)
- File type categorization
- Deliverable tracking
- Version control ready

**Props:**
```typescript
interface FileManagementProps {
  projectId: string
  userId: string
  userRole: string
}
```

#### 7. CommentsSystem
**File:** `CommentsSystem.tsx`

Threaded communication system for projects, tasks, and deliverables.

**Features:**
- Threaded replies
- Comment types (general, feedback, approval, internal)
- Visibility controls
- Real-time updates ready
- Mention system ready
- Comment editing and deletion

**Props:**
```typescript
interface CommentsSystemProps {
  projectId: string
  taskId?: string
  deliverableId?: string
  userId: string
  userRole: string
}
```

#### 8. MilestoneTracker
**File:** `MilestoneTracker.tsx`

Visual milestone tracking and project progress visualization.

**Features:**
- Milestone creation and management
- Progress visualization
- Timeline view
- Client approval workflow
- Overdue milestone alerts
- Drag-and-drop reordering ready

**Props:**
```typescript
interface MilestoneTrackerProps {
  projectId: string
  userId: string
  userRole: string
}
```

### Utility Components

#### ProjectStatusBadge
**File:** `ProjectStatusBadge.tsx`

Reusable status and priority badge components with consistent styling.

#### ProjectPermissions
**File:** `ProjectPermissions.tsx`

Permission management utilities and higher-order components for role-based access control.

## Type Definitions

All TypeScript interfaces are defined in `/lib/types/projects.ts`:

- `Project` - Core project structure
- `Task` - Task management types
- `Milestone` - Milestone tracking types
- `TimeEntry` - Time tracking types
- `ProjectFile` - File management types
- `ProjectComment` - Comment system types
- `Deliverable` - Deliverable management types
- And many more...

## API Integration

All components are designed to work with the existing API routes:

- `/api/projects/*` - Project management
- `/api/projects/[id]/tasks/*` - Task management
- `/api/projects/[id]/milestones/*` - Milestone management
- `/api/projects/[id]/time-entries/*` - Time tracking
- `/api/projects/[id]/files/*` - File management
- `/api/projects/[id]/comments/*` - Comment system

## Design Principles

### 1. Responsive Design
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interactions

### 2. Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

### 3. Performance
- Lazy loading ready
- Optimistic updates
- Efficient re-rendering
- Skeleton loading states

### 4. User Experience
- Consistent design language
- Clear visual hierarchy
- Intuitive navigation
- Helpful error messages

### 5. Role-Based UI
- Different interfaces for different user types
- Permission-based feature access
- Context-aware interactions

## Usage Examples

### Basic Project Dashboard
```tsx
import { ProjectDashboard } from '@/components/projects'

function AgencyDashboard() {
  return (
    <ProjectDashboard
      agencyId="agency-123"
      userId="user-456"
      userRole="agency"
    />
  )
}
```

### Client Portal Integration
```tsx
import { ClientPortal } from '@/components/projects'

function ClientProjectView() {
  return (
    <ClientPortal
      projectId="project-789"
      userId="client-123"
      userRole="client"
    />
  )
}
```

### Permission-Based Rendering
```tsx
import { WithPermissions, useProjectPermissions } from '@/components/projects/ProjectPermissions'

function ProjectActions({ userRole, projectStatus, isProjectManager }) {
  const permissions = useProjectPermissions({
    userRole,
    projectStatus,
    isProjectManager,
    isClient: false
  })

  return (
    <div>
      <WithPermissions permission="canEdit" permissions={permissions}>
        <Button>Edit Project</Button>
      </WithPermissions>
      
      <WithPermissions permission="canDelete" permissions={permissions}>
        <Button variant="destructive">Delete Project</Button>
      </WithPermissions>
    </div>
  )
}
```

## Future Enhancements

### Ready for Implementation
1. **Real-time Updates** - WebSocket integration points are prepared
2. **Drag-and-Drop** - Kanban board and milestone reordering
3. **Advanced Search** - Full-text search across projects and tasks
4. **Export Features** - PDF reports and CSV exports
5. **Mobile App** - Components are designed for mobile adaptation

### Planned Features
1. **AI Integration** - Smart task suggestions and project insights
2. **Advanced Analytics** - Detailed reporting and dashboards
3. **Integration Hub** - Third-party tool connections
4. **Automation** - Workflow automation and triggers
5. **White-label** - Customizable branding and themes

## Contributing

When adding new components or modifying existing ones:

1. Follow the established TypeScript patterns
2. Use the existing design system (Shadcn/ui)
3. Ensure accessibility compliance
4. Add proper error handling and loading states
5. Update this README with new components
6. Test across different user roles and permissions

## Dependencies

- Next.js 13+
- React 18+
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- Lucide React icons
- date-fns (for date formatting)
- class-variance-authority (for component variants)

All components are fully self-contained and ready for production use in the Ozza platform.