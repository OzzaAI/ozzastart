-- Project Management Schema Migration
-- Generated for Ozza project management system

-- Project Templates Table
CREATE TABLE IF NOT EXISTS "project_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"estimated_duration_days" integer,
	"template_data" jsonb,
	"agency_account_id" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Projects Table
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'planning' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"budget" integer,
	"currency" text DEFAULT 'USD',
	"start_date" timestamp,
	"due_date" timestamp,
	"completed_at" timestamp,
	"agency_account_id" text NOT NULL,
	"client_account_id" text,
	"client_user_id" text,
	"project_manager_id" text NOT NULL,
	"template_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Project Members Table
CREATE TABLE IF NOT EXISTS "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"permissions" jsonb,
	"hourly_rate" integer,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"removed_at" timestamp
);

-- Milestones Table
CREATE TABLE IF NOT EXISTS "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"requires_client_approval" boolean DEFAULT false NOT NULL,
	"client_approved_at" timestamp,
	"client_approved_by" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"milestone_id" uuid,
	"parent_task_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assigned_to" text,
	"estimated_hours" integer,
	"actual_hours" integer DEFAULT 0,
	"start_date" timestamp,
	"due_date" timestamp,
	"completed_at" timestamp,
	"tags" jsonb,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Deliverables Table
CREATE TABLE IF NOT EXISTS "deliverables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"milestone_id" uuid,
	"task_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"file_url" text,
	"file_name" text,
	"file_size" integer,
	"file_type" text,
	"requires_client_approval" boolean DEFAULT true NOT NULL,
	"submitted_at" timestamp,
	"submitted_by" text,
	"reviewed_at" timestamp,
	"reviewed_by" text,
	"approval_notes" text,
	"due_date" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Project Files Table
CREATE TABLE IF NOT EXISTS "project_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"deliverable_id" uuid,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"file_type" text,
	"description" text,
	"visibility" text DEFAULT 'project' NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Time Entries Table
CREATE TABLE IF NOT EXISTS "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"user_id" text NOT NULL,
	"description" text,
	"hours" integer NOT NULL,
	"billable" boolean DEFAULT true NOT NULL,
	"hourly_rate" integer,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"invoiced" boolean DEFAULT false NOT NULL,
	"invoice_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Project Comments Table
CREATE TABLE IF NOT EXISTS "project_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"task_id" uuid,
	"deliverable_id" uuid,
	"parent_comment_id" uuid,
	"content" text NOT NULL,
	"comment_type" text DEFAULT 'general' NOT NULL,
	"visibility" text DEFAULT 'project' NOT NULL,
	"mentions" jsonb,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

-- Project Activity Log Table
CREATE TABLE IF NOT EXISTS "project_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"details" jsonb,
	"old_values" jsonb,
	"new_values" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Recurring Workflows Table
CREATE TABLE IF NOT EXISTS "recurring_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"agency_account_id" text NOT NULL,
	"template_id" uuid,
	"frequency" text NOT NULL,
	"interval_value" integer DEFAULT 1 NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"auto_create" boolean DEFAULT false NOT NULL,
	"create_days_before" integer DEFAULT 0,
	"default_client_account_id" text,
	"default_project_manager_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Foreign Key Constraints
DO $$ BEGIN
 ALTER TABLE "project_templates" ADD CONSTRAINT "project_templates_agency_account_id_ozza_accounts_id_fk" FOREIGN KEY ("agency_account_id") REFERENCES "ozza_accounts"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_templates" ADD CONSTRAINT "project_templates_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_agency_account_id_ozza_accounts_id_fk" FOREIGN KEY ("agency_account_id") REFERENCES "ozza_accounts"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_client_account_id_ozza_accounts_id_fk" FOREIGN KEY ("client_account_id") REFERENCES "ozza_accounts"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_client_user_id_user_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "user"("id") ON DELETE set null;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_id_user_id_fk" FOREIGN KEY ("project_manager_id") REFERENCES "user"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_template_id_project_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE set null;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "milestones" ADD CONSTRAINT "milestones_client_approved_by_user_id_fk" FOREIGN KEY ("client_approved_by") REFERENCES "user"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE set null;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "user"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE set null;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_submitted_by_user_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "user"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_files" ADD CONSTRAINT "project_files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_files" ADD CONSTRAINT "project_files_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_files" ADD CONSTRAINT "project_files_deliverable_id_deliverables_id_fk" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_files" ADD CONSTRAINT "project_files_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_deliverable_id_deliverables_id_fk" FOREIGN KEY ("deliverable_id") REFERENCES "deliverables"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_parent_comment_id_project_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "project_comments"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_activity_log" ADD CONSTRAINT "project_activity_log_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project_activity_log" ADD CONSTRAINT "project_activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE set null;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recurring_workflows" ADD CONSTRAINT "recurring_workflows_agency_account_id_ozza_accounts_id_fk" FOREIGN KEY ("agency_account_id") REFERENCES "ozza_accounts"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recurring_workflows" ADD CONSTRAINT "recurring_workflows_template_id_project_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recurring_workflows" ADD CONSTRAINT "recurring_workflows_default_client_account_id_ozza_accounts_id_fk" FOREIGN KEY ("default_client_account_id") REFERENCES "ozza_accounts"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recurring_workflows" ADD CONSTRAINT "recurring_workflows_default_project_manager_id_user_id_fk" FOREIGN KEY ("default_project_manager_id") REFERENCES "user"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "recurring_workflows" ADD CONSTRAINT "recurring_workflows_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS "projects_agency_idx" ON "projects" ("agency_account_id");
CREATE INDEX IF NOT EXISTS "projects_client_idx" ON "projects" ("client_account_id");
CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects" ("status");
CREATE INDEX IF NOT EXISTS "projects_priority_idx" ON "projects" ("priority");
CREATE INDEX IF NOT EXISTS "projects_manager_idx" ON "projects" ("project_manager_id");

CREATE INDEX IF NOT EXISTS "tasks_project_idx" ON "tasks" ("project_id");
CREATE INDEX IF NOT EXISTS "tasks_assigned_idx" ON "tasks" ("assigned_to");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status");
CREATE INDEX IF NOT EXISTS "tasks_milestone_idx" ON "tasks" ("milestone_id");

CREATE INDEX IF NOT EXISTS "milestones_project_idx" ON "milestones" ("project_id");
CREATE INDEX IF NOT EXISTS "milestones_status_idx" ON "milestones" ("status");

CREATE INDEX IF NOT EXISTS "deliverables_project_idx" ON "deliverables" ("project_id");
CREATE INDEX IF NOT EXISTS "deliverables_status_idx" ON "deliverables" ("status");
CREATE INDEX IF NOT EXISTS "deliverables_task_idx" ON "deliverables" ("task_id");

CREATE INDEX IF NOT EXISTS "time_entries_project_idx" ON "time_entries" ("project_id");
CREATE INDEX IF NOT EXISTS "time_entries_user_idx" ON "time_entries" ("user_id");
CREATE INDEX IF NOT EXISTS "time_entries_date_idx" ON "time_entries" ("started_at");

CREATE INDEX IF NOT EXISTS "project_members_project_idx" ON "project_members" ("project_id");
CREATE INDEX IF NOT EXISTS "project_members_user_idx" ON "project_members" ("user_id");

CREATE INDEX IF NOT EXISTS "project_comments_project_idx" ON "project_comments" ("project_id");
CREATE INDEX IF NOT EXISTS "project_comments_task_idx" ON "project_comments" ("task_id");
CREATE INDEX IF NOT EXISTS "project_comments_author_idx" ON "project_comments" ("author_id");

CREATE INDEX IF NOT EXISTS "project_activity_project_idx" ON "project_activity_log" ("project_id");
CREATE INDEX IF NOT EXISTS "project_activity_date_idx" ON "project_activity_log" ("created_at");

CREATE INDEX IF NOT EXISTS "project_files_project_idx" ON "project_files" ("project_id");
CREATE INDEX IF NOT EXISTS "project_files_task_idx" ON "project_files" ("task_id");

-- Comments for documentation
COMMENT ON TABLE "project_templates" IS 'Reusable project templates for agencies';
COMMENT ON TABLE "projects" IS 'Core project management table linking agencies to clients';
COMMENT ON TABLE "project_members" IS 'Team members assigned to projects with roles and permissions';
COMMENT ON TABLE "milestones" IS 'Project milestones with client approval workflow';
COMMENT ON TABLE "tasks" IS 'Individual tasks within projects, supports subtasks';
COMMENT ON TABLE "deliverables" IS 'Project deliverables with approval workflow';
COMMENT ON TABLE "project_files" IS 'File attachments for projects, tasks, and deliverables';
COMMENT ON TABLE "time_entries" IS 'Time tracking for billing and project management';
COMMENT ON TABLE "project_comments" IS 'Comments and communication on projects and tasks';
COMMENT ON TABLE "project_activity_log" IS 'Audit trail for all project-related activities';
COMMENT ON TABLE "recurring_workflows" IS 'Automated recurring project creation';