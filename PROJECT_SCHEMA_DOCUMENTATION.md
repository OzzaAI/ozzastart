# Ozza Project Management Schema Documentation

## Overview

This document describes the comprehensive project management schema additions for the Ozza platform. The schema supports the Coach→Agency→Client hierarchy with full project lifecycle management, time tracking, client approvals, and recurring workflows.

## Architecture

### Core Hierarchy
```
Coach (User with role='coach')
  └── Agency (ozza_accounts owned by coach)
      └── Projects (managed for clients)
          ├── Milestones
          ├── Tasks
          ├── Deliverables
          └── Time Tracking
```

## Table Descriptions

### 1. project_templates
**Purpose**: Reusable project templates for agencies to standardize project creation.

**Key Features**:
- Global templates (agency_account_id = null) available to all agencies
- Agency-specific templates for internal use
- Template data stored as JSONB for flexibility
- Categorization for easy discovery

**Integration**: Links to `ozza_accounts` and `user` tables.

### 2. projects
**Purpose**: Core project management table linking agencies to clients.

**Key Features**:
- Flexible client assignment (either account-based or direct user)
- Budget tracking in cents for precision
- Status workflow (planning → active → completed)
- Priority management
- Template-based project creation

**Relationships**:
- `agency_account_id` → Agency managing the project
- `client_account_id` → Client's account (if they have one)
- `client_user_id` → Direct client user reference
- `project_manager_id` → User responsible for project

### 3. project_members
**Purpose**: Team assignment and role management within projects.

**Key Features**:
- Flexible role system (project-manager, developer, designer, qa, client-contact)
- Individual hourly rates for accurate billing
- Permission system via JSONB for granular access control
- Temporal tracking (added_at, removed_at)

### 4. milestones
**Purpose**: Major project checkpoints with client approval workflow.

**Key Features**:
- Client approval workflow with digital signatures
- Progress tracking (0-100% completion)
- Ordered milestones for project phases
- Automatic status management (pending → in-progress → completed)

### 5. tasks
**Purpose**: Granular work items with assignment and time tracking.

**Key Features**:
- Hierarchical task structure (parent-child relationships)
- Kanban-style status workflow (todo → in-progress → review → completed)
- Time estimation vs. actual tracking
- Tag system for categorization
- Milestone association for organization

### 6. deliverables
**Purpose**: Client-facing outputs with approval workflow.

**Key Features**:
- Multi-version support for iterative delivery
- Client approval workflow with review notes
- File attachment support
- Type categorization (document, design, code, report)
- Integration with tasks and milestones

### 7. project_files
**Purpose**: File management with access control.

**Key Features**:
- Visibility controls (project, client, internal)
- Association with projects, tasks, or deliverables
- File metadata tracking (size, type, description)
- User attribution for uploads

### 8. time_entries
**Purpose**: Comprehensive time tracking for billing and project management.

**Key Features**:
- Minute-precision time tracking
- Billable/non-billable classification
- Rate capture at time of entry for accurate billing
- Invoice integration support
- Project and task association

### 9. project_comments
**Purpose**: Communication and collaboration system.

**Key Features**:
- Threaded comments (replies to comments)
- Visibility controls (project, client, internal)
- User mentions with notification support
- Comment types (general, approval, feedback, internal)
- Soft delete with deleted_at timestamp

### 10. project_activity_log
**Purpose**: Comprehensive audit trail for all project activities.

**Key Features**:
- Action tracking (created, updated, deleted, status_changed, assigned)
- Entity tracking (project, task, milestone, deliverable, comment)
- Before/after value tracking for updates
- System and user action attribution

### 11. recurring_workflows
**Purpose**: Automated recurring project creation for ongoing client work.

**Key Features**:
- Flexible recurrence patterns (daily, weekly, monthly, quarterly, yearly)
- Template-based project creation
- Configurable lead times (create projects X days before due)
- Default client and project manager assignment

## Performance Optimizations

### Indexes
The schema includes comprehensive indexing for optimal query performance:

- **Projects**: agency, client, status, priority, manager
- **Tasks**: project, assignee, status, milestone
- **Time Entries**: project, user, date range
- **Comments**: project, task, author
- **Activity Log**: project, date range

### Query Patterns
Common query patterns optimized:
- Projects by agency and status
- Tasks assigned to user
- Time entries for billing periods
- Activity logs for audit trails
- Comments for project communication

## Integration Points

### Existing Ozza Schema
The project management schema seamlessly integrates with existing tables:

- **Users**: Project managers, assignees, clients
- **Ozza Accounts**: Agencies and client organizations
- **Client Invitations**: Extended to support project assignment

### External Systems
Designed for integration with:
- **Billing Systems**: Via invoice_id in time_entries
- **File Storage**: Via file_url fields
- **Notification Systems**: Via mentions and activity logs
- **Calendar Systems**: Via due dates and milestones

## Security Considerations

### Access Control
- Row-level security based on agency membership
- Visibility controls for client data protection
- Permission system for granular access

### Data Privacy
- Soft deletes for audit trail preservation
- Metadata fields for compliance tracking
- JSONB fields for flexible data requirements

## Usage Examples

### Creating a New Project
```sql
-- Create project from template
INSERT INTO projects (
  name, agency_account_id, client_user_id, 
  project_manager_id, template_id, status
) VALUES (
  'Website Redesign', 'agency_123', 'client_456', 
  'pm_789', 'template_web', 'planning'
);
```

### Time Tracking Query
```sql
-- Get billable hours for a project this month
SELECT 
  SUM(hours) as total_minutes,
  SUM(hours * hourly_rate / 100) as total_cost
FROM time_entries 
WHERE project_id = 'proj_123' 
  AND billable = true 
  AND started_at >= date_trunc('month', current_date);
```

### Project Dashboard Query
```sql
-- Get project overview with progress
SELECT 
  p.name,
  p.status,
  p.budget,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
  COUNT(DISTINCT m.id) as total_milestones,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_milestones
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN milestones m ON p.id = m.project_id
WHERE p.agency_account_id = 'agency_123'
GROUP BY p.id, p.name, p.status, p.budget;
```

## Migration Strategy

### Phase 1: Core Tables
1. Create project_templates, projects, project_members
2. Migrate existing client relationships
3. Set up basic project creation

### Phase 2: Work Management
1. Add milestones, tasks, deliverables
2. Implement assignment workflows
3. Enable time tracking

### Phase 3: Advanced Features
1. Add comments and activity logging
2. Implement recurring workflows
3. Enable file management

### Phase 4: Optimization
1. Add remaining indexes
2. Optimize queries
3. Implement caching strategies

## Future Enhancements

### Planned Features
- **Resource Management**: Team capacity and allocation
- **Budget Forecasting**: Predictive cost analysis
- **Client Portal**: Self-service project visibility
- **API Integration**: Third-party tool connections
- **Reporting Dashboard**: Advanced analytics and insights

### Extensibility
The schema is designed for easy extension:
- JSONB metadata fields for custom attributes
- Flexible permission system
- Plugin-ready architecture
- API-first design principles

## Conclusion

This project management schema provides a comprehensive foundation for the Ozza platform, supporting the full project lifecycle from initial client engagement through delivery and billing. The design balances flexibility with performance, ensuring scalability as agencies grow their client base and project complexity.