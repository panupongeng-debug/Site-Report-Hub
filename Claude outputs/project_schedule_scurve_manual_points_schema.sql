-- ตารางจุดข้อมูล Actual ย้อนหลังที่กรอกด้วยมือ สำหรับกราฟ S-Curve
-- ใช้เติมช่วงเวลาที่ระบบยังไม่มี snapshot อัตโนมัติ (ก่อนวันที่ติดตั้งฟีเจอร์ S-Curve/history)
-- เก็บเป็น %รวมต่อ Package เท่านั้น (ไม่ลงรายละเอียดราย Activity) — package='' หมายถึงค่าที่ใช้ตอน
-- ตัวกรอง Package ในหน้าเว็บถูกเลือกเป็น "ทั้งหมด"
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

drop index if exists project_schedule_scurve_manual_points_key;
create unique index project_schedule_scurve_manual_points_key on project_schedule_scurve_manual_points (package, snapshot_date);
