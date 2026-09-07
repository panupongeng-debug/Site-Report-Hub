-- ตาราง Discipline (หมวดงานหลัก) + Weight % สำหรับคำนวณ Overall Progress (Weighted WBS)
-- ย้ายจากค่าคงที่ในโค้ด (WBS_WEIGHTS) มาเก็บในฐานข้อมูล เพื่อให้แก้ % และเพิ่ม/ลบ Discipline
-- ได้จากหน้าเว็บโดยไม่ต้องแก้โค้ด
--
-- รันไฟล์นี้ 1 ครั้งใน Supabase SQL editor

create table if not exists project_schedule_wbs_weights (
  id bigserial primary key,
  discipline text not null unique,
  weight numeric not null default 0,
  sort_order int,
  updated_at timestamptz not null default now()
);

insert into project_schedule_wbs_weights (discipline, weight, sort_order) values
  ('Site Preparation Work', 1, 1),
  ('Piling Work', 15, 2),
  ('Concrete Structure Work', 67, 3),
  ('Steel Structure Work', 12, 4),
  ('Sanitary Work', 1, 5),
  ('Electrical Structure', 4, 6)
on conflict (discipline) do nothing;
