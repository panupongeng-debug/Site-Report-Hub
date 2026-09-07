-- ตารางเก็บประวัติ %Progress ต่อวัน ของแต่ละ Activity — ใช้วาดกราฟ S-Curve (แผน vs จริง)
-- แอปจะบันทึกภาพรวม %Progress ปัจจุบันของทุก Activity ทับเข้าตารางนี้อัตโนมัติ (upsert ตาม
-- task_code + snapshot_date) ทุกครั้งที่มีคนเปิด Dashboard "Project Schedule (Gantt)" — ไม่ต้องกด
-- ปุ่มบันทึกเอง กราฟ Actual จะค่อยๆมีข้อมูลมากขึ้นเรื่อยๆ ตามวันที่มีคนเปิดหน้านี้
--
-- ข้อจำกัด: ไม่มีข้อมูลย้อนหลังก่อนวันที่รันไฟล์นี้ (เพราะระบบไม่ได้เก็บ history มาก่อน) กราฟ Actual
-- จะเริ่มมีจุดข้อมูลตั้งแต่วันที่เริ่มใช้งานฟีเจอร์นี้เป็นต้นไป
--
-- รันไฟล์นี้ 1 ครั้งใน Supabase SQL editor

create table if not exists project_schedule_progress_history (
  id bigserial primary key,
  task_code text not null,
  snapshot_date date not null,
  progress_pct numeric,
  weight_factor numeric,
  package text,
  discipline text,
  area text,
  created_at timestamptz not null default now()
);

drop index if exists project_schedule_progress_history_task_date_key;
create unique index project_schedule_progress_history_task_date_key on project_schedule_progress_history (task_code, snapshot_date);

create index if not exists project_schedule_progress_history_date_idx on project_schedule_progress_history (snapshot_date);
