-- เพิ่มคอลัมน์ "Spec" (รายละเอียด/สเปคงาน) ให้ Sub Activity (BOQ)
-- แล้วใส่ค่า Spec ให้กับรายการที่มีชื่อ (name) ตรงกับที่ระบุไว้ (ใช้ได้กับทุก Activity ID
-- ที่มี Sub Activity ชื่อนี้อยู่ เพราะเป็นสเปคงานเดียวกันไม่ว่าจะอยู่ที่พื้นที่ไหน)
--
-- รันไฟล์นี้ 1 ครั้งใน Supabase SQL editor

alter table project_schedule_sub_activities
  add column if not exists spec text;

-- กลุ่ม 1: งานคอนกรีต ทางเดิน หนา 0.15 ม.
update project_schedule_sub_activities
set spec = 'งาน คอนกรีต ทางเดิน หนา 0.15 ม.'
where name in ('งานขุดดิน', 'ปูชั้นพื้น', 'ผูกเหล็กและเข้าแบบ', 'เทคอนกรีต', 'กลบดิน');

-- กลุ่ม 2: พื้นหินคลุกบดอัด หนา 0.20 ม.
update project_schedule_sub_activities
set spec = 'พื้นหินคลุกบดอัด หนา 0.20 ม.'
where name in ('งานปรับดินให้ได้ระดับ', 'หินคลุก', 'งานบดอัดหินคลุก');
