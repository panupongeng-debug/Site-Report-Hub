-- ตาราง Phase (CON/PRO/ENG/ASB/MIL/PAC) + Weight % ต่อ Package สำหรับคำนวณ Overall Progress รวมทุก Phase
-- (แยกจากตาราง project_schedule_wbs_weights ซึ่งเป็น Weight ของ Discipline *ภายใน* Phase "CON" เท่านั้น)
--
-- โครงสร้างใหม่ของ Overall Progress ต่อ Package:
--   Overall = Σ( phase_progress(phase) × phase_weight(phase)/100 )
--   โดย phase_progress('CON') ใช้สูตรถ่วงน้ำหนักตาม Discipline (ตาราง project_schedule_wbs_weights) เหมือนเดิม
--   ส่วน phase อื่น (PRO/ENG/ASB/MIL/PAC) ใช้ค่าเฉลี่ยถ่วงน้ำหนักด้วย Weight Factor ของ Activity ในเฉพาะ Phase+Package นั้นตรงๆ
--
-- ค่าเริ่มต้นที่ seed ให้ (CON = 100% ของทุก Package) ทำให้ผลลัพธ์ Overall Progress เหมือนเดิมทุกประการ
-- จนกว่าจะเข้าไปกด "⚙️ Phase / Weight" แล้วเพิ่ม/แก้ % ของ Phase อื่นเอง (เช่น ลด CON ลงมา 85% แล้วเพิ่ม PRO 10%, ENG 5%)
--
-- รันไฟล์นี้ 1 ครั้งใน Supabase SQL editor

create table if not exists project_schedule_phase_weights (
  id bigserial primary key,
  package text not null,
  phase text not null,
  weight numeric not null default 0,
  sort_order int,
  updated_at timestamptz not null default now()
);

drop index if exists project_schedule_phase_weights_pkg_phase_key;
create unique index project_schedule_phase_weights_pkg_phase_key on project_schedule_phase_weights (package, phase);

-- seed ค่าเริ่มต้น (CON = 100%) ให้ทุก Package ที่มีจริง เฉพาะตอนที่ตารางยังไม่มีข้อมูลเลย (ไม่ทับของเดิมถ้ารันซ้ำ)
do $$
declare pkg text;
begin
  if not exists (select 1 from project_schedule_phase_weights) then
    for pkg in select distinct package from project_schedule_activities where package is not null loop
      insert into project_schedule_phase_weights (package, phase, weight, sort_order) values
        (pkg, 'CON', 100, 1)
      on conflict (package, phase) do nothing;
    end loop;
  end if;
end $$;
