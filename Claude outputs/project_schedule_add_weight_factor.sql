-- เพิ่มคอลัมน์ weight_factor ให้แต่ละ Activity ID (project_schedule_activities)
-- ใช้ถ่วงน้ำหนัก % Progress เวลารวมเป็นกลุ่ม (Discipline/Area/Package) และ KPI "% Complete (Weighted)"
-- ค่าเริ่มต้น = 1 (ถ่วงน้ำหนักเท่ากันทุกงาน) ผู้ใช้แก้ไขเองได้ทีละงานในแอป (ช่องสีม่วงข้าง % ความคืบหน้า)
alter table project_schedule_activities add column if not exists weight_factor numeric not null default 1;
