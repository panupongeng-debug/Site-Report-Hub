-- ทำให้เปลี่ยน Activity ID (task_code) ของงานที่มี Sub Activities (BOQ) ผูกอยู่ได้
-- โดยไม่ต้องลบ Sub Activities ก่อน — เดิม foreign key จาก project_schedule_sub_activities
-- ไปยัง project_schedule_activities(task_code) ไม่มี "on update cascade" ทำให้การเปลี่ยน
-- Activity ID ของงานที่มี Sub Activities อยู่แล้วจะถูก Postgres บล็อกไว้ (foreign key violation)
--
-- รันไฟล์นี้ 1 ครั้งใน Supabase SQL editor เพื่อเปิดให้เปลี่ยน Activity ID ได้จากหน้าเว็บ
-- (ปุ่ม 💾 บันทึก ในมุมมองตาราง ของ Dashboard "Project Schedule (Gantt)")

alter table project_schedule_sub_activities
  drop constraint if exists project_schedule_sub_activities_task_code_fkey;

alter table project_schedule_sub_activities
  add constraint project_schedule_sub_activities_task_code_fkey
  foreign key (task_code) references project_schedule_activities(task_code)
  on delete cascade on update cascade;
