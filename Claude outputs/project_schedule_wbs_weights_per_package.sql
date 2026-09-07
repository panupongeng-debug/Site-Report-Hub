-- อัปเดตตาราง Discipline/Weight ให้แยกเป็นรายชุดต่อ Package (PKG1/PKG2/PKG3...)
-- เพราะแต่ละ Package อาจมี % Weight ของแต่ละ Discipline ไม่เท่ากัน
--
-- สคริปต์นี้ปลอดภัยทั้ง 2 กรณี:
--  1) ยังไม่เคยรันไฟล์ project_schedule_wbs_weights_schema.sql มาก่อน (ยังไม่มีตาราง) -> สร้างตาราง + seed
--     ค่าเริ่มต้นเดิม (6 หมวด) ให้ทุก Package ที่มีจริงในตาราง schedule แยกชุดกัน
--  2) เคยรันไฟล์เดิมไปแล้ว (มีตาราง + 6 แถวแบบไม่มี package) -> clone ให้ทุก Package แล้วลบแถวเดิมที่ไม่มี
--     package ออก จากนั้นค่อยแก้ % ของแต่ละ Package ให้ไม่เท่ากันได้จากปุ่ม "⚙️ Discipline / Weight" ในแอป
--
-- รันไฟล์นี้ 1 ครั้งใน Supabase SQL editor

create table if not exists project_schedule_wbs_weights (
  id bigserial primary key,
  package text,
  discipline text not null,
  weight numeric not null default 0,
  sort_order int,
  updated_at timestamptz not null default now()
);

alter table project_schedule_wbs_weights add column if not exists package text;

-- เอา unique constraint แบบเดิม (unique แค่ discipline เดี่ยว) ออกก่อน ถ้ามี
alter table project_schedule_wbs_weights drop constraint if exists project_schedule_wbs_weights_discipline_key;

-- clone แถวเดิมที่ยังไม่มี package (จากไฟล์เวอร์ชันก่อนหน้า) ไปให้ทุก Package ที่มีจริงในตาราง schedule
do $$
declare pkg text;
begin
  for pkg in select distinct package from project_schedule_activities where package is not null loop
    insert into project_schedule_wbs_weights (package, discipline, weight, sort_order)
    select pkg, discipline, weight, sort_order
    from project_schedule_wbs_weights
    where package is null;
  end loop;
end $$;

delete from project_schedule_wbs_weights where package is null;

-- ถ้าเป็นการติดตั้งครั้งแรก (ยังไม่มีแถวเลยในตาราง) ให้ seed ค่าเริ่มต้นเดิมให้ทุก Package ที่มีจริง
do $$
declare pkg text;
begin
  if not exists (select 1 from project_schedule_wbs_weights) then
    for pkg in select distinct package from project_schedule_activities where package is not null loop
      insert into project_schedule_wbs_weights (package, discipline, weight, sort_order) values
        (pkg, 'Site Preparation Work', 1, 1),
        (pkg, 'Piling Work', 15, 2),
        (pkg, 'Concrete Structure Work', 67, 3),
        (pkg, 'Steel Structure Work', 12, 4),
        (pkg, 'Sanitary Work', 1, 5),
        (pkg, 'Electrical Structure', 4, 6);
    end loop;
  end if;
end $$;

alter table project_schedule_wbs_weights alter column package set not null;
drop index if exists project_schedule_wbs_weights_pkg_disc_key;
create unique index project_schedule_wbs_weights_pkg_disc_key on project_schedule_wbs_weights (package, discipline);
