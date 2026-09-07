-- Add work-progress % tracking to Project Schedule
-- Run once in Supabase SQL editor (idempotent - safe to re-run)

alter table project_schedule_activities add column if not exists progress_pct numeric not null default 0;

-- backfill: activities already marked Completed in the original import get 100%
update project_schedule_activities set progress_pct = 100 where status_code = 'Completed' and progress_pct = 0;
