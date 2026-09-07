-- รวม area code SPLB เข้ากับ SPL (ทั้งสองคือ "Sampling Unit" อาคารเดียวกัน แค่ P6 ตั้งรหัสไม่ตรงกันระหว่าง phase)
-- มีผลกับ 1 กิจกรรม: ENG.PKG1.SPLB.C.0020 (Shop Drawing for Structural Drawing for Sampling Unit)
update project_schedule_activities set area = 'SPL' where area = 'SPLB';
