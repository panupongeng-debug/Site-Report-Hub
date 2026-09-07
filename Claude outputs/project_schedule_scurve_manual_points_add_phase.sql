-- เพิ่มคอลัมน์ "phase" ให้จุดข้อมูล Actual ย้อนหลังที่กรอกด้วยมือ (S-Curve)
-- เดิมกรอกได้แค่ %รวมระดับ Package เท่านั้น ตอนนี้แยกกรอกต่อ Phase ได้ด้วย (CON/PRO/ENG/ASB/...)
-- phase = '' (string ว่าง) หมายถึงจุดที่ใช้ตอนตัวกรอง Phase ในหน้าเว็บถูกเลือกเป็น "ทั้งหมด"
--
-- สคริปต์นี้ปลอดภัยทั้งกรณียังไม่เคยรัน SQL ตัวก่อนหน้าเลย (สร้างตารางให้ครบตั้งแต่ต้น)
-- และกรณีเคยรัน project_schedule_scurve_manual_points_schema.sql ไปแล้ว (เพิ่มคอลัมน์ phase
-- ให้แถวเดิมเป็นค่าเริ่มต้น '' แล้วปรับ unique index ให้ครอบคลุม phase ด้วย)
--
-- รันไฟล์นี้ 1 ครั้งใน Supabase SQL editor

create table if not exists project_schedule_scurve_manual_points (
  id bigserial primary key,
  package text not null default '',
  snapshot_date date not null,
  pct numeric not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table project_schedule_scurve_manual_points add column if not exists phase text not null default '';

drop index if exists project_schedule_scurve_manual_points_key;
create unique index project_schedule_scurve_manual_points_key on project_schedule_scurve_manual_points (package, phase, snapshot_date);
