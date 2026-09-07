-- Sub-activity import for โรงฉ่ำ (mapped to area code SPL per user instruction 2026-09-07)
-- SPL schedule only has 2 tasks (Pile driving Work / Concrete Foundation Work), so all
-- non-foundation structural items (ground beam, pedestal, floor, pit, stair, manhole)
-- are also folded into 'Concrete Foundation Work' since there is no separate
-- 'Concrete Structural Work' task for SPL in the 723-task schedule.
insert into project_schedule_sub_activities
    (task_code, name, weight_factor, unit_boq, estimate_boq, actual_boq, poc_manual, sort_order, source_sheet, source_row)
values
    ('CON.PKG1.SPL.C.0010', 'งานตอกเสาเข็ม', 0.95, 'Nos', 54, NULL, NULL, 1, 'Pile Detail', 34),
    ('CON.PKG1.SPL.C.0010', 'งานทดสอบเสาเข็ม', 0.05, 'Nos', 54, 0, NULL, 2, 'Pile Detail', 35),
    ('CON.PKG1.SPL.C.0020', 'งานขุดดิน', 0.1, 'm3', 249, NULL, NULL, 1, 'Building Work', 241),
    ('CON.PKG1.SPL.C.0020', 'เทคอนกรีตปรับพื้น', 0.1, 'm3', 11, NULL, NULL, 2, 'Building Work', 242),
    ('CON.PKG1.SPL.C.0020', 'ผูกเหล็ก', 0.3, 'kg', 1458, NULL, NULL, 3, 'Building Work', 243),
    ('CON.PKG1.SPL.C.0020', 'เข้าแบบ', 0.2, 'm2', 42, NULL, NULL, 4, 'Building Work', 244),
    ('CON.PKG1.SPL.C.0020', 'เทคอนกรีต', 0.2, 'm3', 11, NULL, NULL, 5, 'Building Work', 245),
    ('CON.PKG1.SPL.C.0020', 'กลบดิน', 0.1, 'm3', 100, NULL, NULL, 6, 'Building Work', 246),
    ('CON.PKG1.SPL.C.0020', 'ผูกเหล็ก (คานคอดิน)', 0.4, 'kg', 1141, NULL, NULL, 7, 'Building Work', 248),
    ('CON.PKG1.SPL.C.0020', 'เข้าแบบ (คานคอดิน)', 0.3, 'm2', 50, NULL, NULL, 8, 'Building Work', 249),
    ('CON.PKG1.SPL.C.0020', 'เทคอนกรีต (คานคอดิน)', 0.3, 'm3', 5, NULL, NULL, 9, 'Building Work', 250),
    ('CON.PKG1.SPL.C.0020', 'ผูกเหล็ก (Pedestal)', 0.4, 'kg', 977, NULL, NULL, 10, 'Building Work', 252),
    ('CON.PKG1.SPL.C.0020', 'เข้าแบบ (Pedestal)', 0.3, 'm2', 25, NULL, NULL, 11, 'Building Work', 253),
    ('CON.PKG1.SPL.C.0020', 'เทคอนกรีต (Pedestal)', 0.3, 'm3', 4, NULL, NULL, 12, 'Building Work', 254),
    ('CON.PKG1.SPL.C.0020', 'ผูกเหล็ก (พื้นชั้น 1)', 0.4, 'kg', 3611, NULL, NULL, 13, 'Building Work', 256),
    ('CON.PKG1.SPL.C.0020', 'เข้าแบบ (พื้นชั้น 1)', 0.3, 'm2', 68, NULL, NULL, 14, 'Building Work', 257),
    ('CON.PKG1.SPL.C.0020', 'เทคอนกรีต Topping (พื้นชั้น 1)', 0.3, 'm3', 32, NULL, NULL, 15, 'Building Work', 258),
    ('CON.PKG1.SPL.C.0020', 'ผูกเหล็ก (บ่อ)', 0.3, 'kg', 3829, NULL, NULL, 16, 'Building Work', 260),
    ('CON.PKG1.SPL.C.0020', 'เข้าแบบ (บ่อ)', 0.2, 'm2', 163, NULL, NULL, 17, 'Building Work', 261),
    ('CON.PKG1.SPL.C.0020', 'เทคอนกรีต (บ่อ)', 0.2, 'm3', 33, NULL, NULL, 18, 'Building Work', 262),
    ('CON.PKG1.SPL.C.0020', 'กลบดิน (บ่อ)', 0.1, 'm3', 100, NULL, NULL, 19, 'Building Work', 263),
    ('CON.PKG1.SPL.C.0020', 'ผูกเหล็ก (Pedestal บ่อ)', 0.4, 'kg', 360, NULL, NULL, 20, 'Building Work', 265),
    ('CON.PKG1.SPL.C.0020', 'เข้าแบบ (Pedestal บ่อ)', 0.3, 'm2', 7, NULL, NULL, 21, 'Building Work', 266),
    ('CON.PKG1.SPL.C.0020', 'เทคอนกรีต (Pedestal บ่อ)', 0.3, 'm3', 1, NULL, NULL, 22, 'Building Work', 267),
    ('CON.PKG1.SPL.C.0020', 'บันไดเหล็ก', 1, 'm', 1.32, NULL, NULL, 23, 'Building Work', 269),
    ('CON.PKG1.SPL.C.0020', 'ฝาปิด Man Hole', 0, '%', 0, NULL, NULL, 24, 'Building Work', 270);
