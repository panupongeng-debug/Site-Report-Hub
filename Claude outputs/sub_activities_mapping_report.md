# Sub-Activity Mapping Report

Generated 2026-09-07 from `Progress_Calculation_Sheet_Monthly.xlsx` against the 723-task `project_schedule_activities` table.

## Summary

| Sheet | Total | High | Medium | Low | Unmatched | Match rate |
|---|---|---|---|---|---|---|
| Tempo Detail | 5 | 5 | 0 | 0 | 0 | 100% |
| Pile Detail | 16 | 12 | 0 | 0 | 4 | 75% |
| Infrastructure Work | 102 | 86 | 6 | 0 | 10 | 90% |
| Building Work | 314 | 184 | 80 | 5 | 45 | 86% |
| Steel Structure Work | 110 | 94 | 16 | 0 | 0 | 100% |
| Sanitary Work | 77 | 69 | 4 | 0 | 4 | 95% |
| Electrical Work | 189 | 142 | 35 | 3 | 9 | 95% |
| **TOTAL** | **813** | **592** | **141** | **8** | **72** | **91%** |

- poc_own carried through as a **fraction** (0-1), matching the source workbook's `%POC(own)` column values.
- unit_boq carried through as-is from the workbook's Unit BOQ column (Thai unit labels such as ชุด/ชิ้น/เมตร kept verbatim).

## โรงฉ่ำ building — needs a decision from the user

**โรงฉ่ำ is a confirmed real 7th building in the Excel workbook with no corresponding area code in the 723-task schedule** (checked against COM, DRA, EXT, FEN, GHB, MPB, ROD, SPL, SPLB, TLB, WHA, WHB, WSB — none fit). All its leaf items across Pile Detail, Building Work, Steel Structure Work, Sanitary Work and Electrical Work have been left **unmatched (task_code = null)** rather than guess-mapped, and are included below (and in the JSON) for review.

Please decide: (a) add โรงฉ่ำ as a new area with its own schedule tasks, or (b) tell us which existing area/building it should be merged into.

| Sheet | # leaf items (โรงฉ่ำ) | Sum of Estimate BOQ (mixed units, indicative only) |
|---|---|---|
| Pile Detail | 2 | 108.0 |
| Building Work | 25 | 12364.3 |
| **TOTAL** | **27** | — |

Key quantities: 54 piles (driving + testing, Pile Detail rows 34-35), 86 m3 building-structure concrete (Building Work row 14 total; detailed foundation/beam/pedestal/floor/pit rebar-formwork-concrete breakdown in rows 239-270).

## Unmatched items by sheet (excluding โรงฉ่ำ, listed above)

### Pile Detail (2 unmatched)

| Row | Name | Est. BOQ | Unit | Reason |
|---|---|---|---|---|
| 19 | งานตอกเสาเข็ม | 1257 | Nos | Infrastructure-wide piling group spans multiple areas (road/drainage/fence) - cannot attribute to a single task |
| 20 | งานทดสอบเสาเข็ม | 1257 | Nos | Infrastructure-wide piling group spans multiple areas (road/drainage/fence) - cannot attribute to a single task |

### Infrastructure Work (10 unmatched)

| Row | Name | Est. BOQ | Unit | Reason |
|---|---|---|---|---|
| 121 | งานขุดดิน | 215 | m3 | Fence/Retaining Wall Type D has no corresponding task in the 723-task schedule (only Type A, B, C, and generic ABC fence installation exist) - scope gap, needs clarification |
| 122 | ปูชั้นพื้น  | 2 | m3 | Fence/Retaining Wall Type D has no corresponding task in the 723-task schedule (only Type A, B, C, and generic ABC fence installation exist) - scope gap, needs clarification |
| 123 | ผูกเหล็กและเข้าแบบ | 91 | m2 | Fence/Retaining Wall Type D has no corresponding task in the 723-task schedule (only Type A, B, C, and generic ABC fence installation exist) - scope gap, needs clarification |
| 124 | เทคอนกรีต | 40 | m3 | Fence/Retaining Wall Type D has no corresponding task in the 723-task schedule (only Type A, B, C, and generic ABC fence installation exist) - scope gap, needs clarification |
| 125 | ติดตั้งเสารั้วสำเร็จ | 29 | Ea | Fence/Retaining Wall Type D has no corresponding task in the 723-task schedule (only Type A, B, C, and generic ABC fence installation exist) - scope gap, needs clarification |
| 126 | ติดตั้งแผ่นรั้วสำเร็จ | 225 | Ea | Fence/Retaining Wall Type D has no corresponding task in the 723-task schedule (only Type A, B, C, and generic ABC fence installation exist) - scope gap, needs clarification |
| 127 | ติดตั้งทับหลังรั้วสำเร็จ | 25 | Ea | Fence/Retaining Wall Type D has no corresponding task in the 723-task schedule (only Type A, B, C, and generic ABC fence installation exist) - scope gap, needs clarification |
| 128 | ติดตั้งรั้วสำเร็จ | 72 | m | Fence/Retaining Wall Type D has no corresponding task in the 723-task schedule (only Type A, B, C, and generic ABC fence installation exist) - scope gap, needs clarification |
| 129 | ทาสีภายนอก | 485 | m2 | Fence/Retaining Wall Type D has no corresponding task in the 723-task schedule (only Type A, B, C, and generic ABC fence installation exist) - scope gap, needs clarification |
| 130 | พื้นคอนกรีตขัดมัน | 114 | m2 | Fence/Retaining Wall Type D has no corresponding task in the 723-task schedule (only Type A, B, C, and generic ABC fence installation exist) - scope gap, needs clarification |

### Building Work (20 unmatched)

| Row | Name | Est. BOQ | Unit | Reason |
|---|---|---|---|---|
| 89 | ถังดับเพลิง | 64 | Ea | no mapping rule for component "ถังดับเพลิง" (leaf="ถังดับเพลิง") |
| 126 | รางระบายน้ำบนหลังคา | 78 | m | no task matched keywords ['Downspout Installation'] in area WSB |
| 151 | ถังดับเพลิงและป้าย | 56 | Ea | no mapping rule for component "ถังดับเพลิงและป้าย" (leaf="ถังดับเพลิงและป้าย") |
| 183 | ผนังกรุกระเบื้อง | 22 | m2 | no task matched keywords ['Tile installation for Wall'] in area GHB |
| 187 | ฝ้าเพดาน | 34 | m2 | no task matched keywords ['Ceiling Installation'] in area GHB |
| 193 | รางระบายน้ำ | 20 | m | no task matched keywords ['Downspout Installation'] in area GHB |
| 194 | Downspout | 32 | m | no task matched keywords ['Downspout Installation'] in area GHB |
| 195 | ถังดับเพลิง | 4 | Ea | no mapping rule for component "ถังดับเพลิง" (leaf="ถังดับเพลิง") |
| 196 | เฟอร์นิเจอร์ | 100 | % | no task matched keywords ['Furniture Installation Work'] in area GHB |
| 228 | ผนังกรุกระเบื้อง | 242 | m2 | no task matched keywords ['Tile installation for Wall'] in area TLB |
| 234 | Aluminum Composite Board thk. 4 mm. | 32 | m2 | no task matched keywords ['Siding, Louver Installation', 'Metal Sheet for Siding'] in area TLB |
| 235 | แผงบังแดด ขนาด 0.60 x 2.10 ม | 7 | Ea | no mapping rule for component "แผงบังแดด ขนาด 0.60 x 2.10 ม" (leaf="แผงบังแดด ขนาด 0.60 x 2.10 ม") |
| 236 | ถังดับเพลิง | 4 | Ea | no mapping rule for component "ถังดับเพลิง" (leaf="ถังดับเพลิง") |
| 237 | Counter โถปัสสาวะชายกรุกระเบื้องเซรามิค  กว้าง 0.20 ม. | 7 | m | no mapping rule for component "Counter โถปัสสาวะชายกรุกระเบื้องเซรามิค  กว้าง 0.20 ม." (leaf="Counter โถปัสสาวะชายกรุกระเบื้องเซรามิค  กว้าง 0.20 ม.") |
| 338 | บันได Ladder | 6 | Set | no task matched keywords ['Tile installation for Stair', 'Handrail Installation for Stair'] in area WHA |
| 339 | ราวบันไดและราวกันตก | 584 | m | no task matched keywords ['Handrail Installation for Stair'] in area WHA |
| 344 | ถังดับเพลิง | 56 | Ea | no mapping rule for component "ถังดับเพลิง" (leaf="ถังดับเพลิง") |
| 413 | บันได Ladder | 4 | Ea | no task matched keywords ['Tile installation for Stair', 'Handrail Installation for Stair'] in area WHB |
| 414 | ราวบันไดและราวกันตก | 771 | m | no task matched keywords ['Handrail Installation for Stair'] in area WHB |
| 419 | ถังดับเพลิง | 56 | Ea | no mapping rule for component "ถังดับเพลิง" (leaf="ถังดับเพลิง") |

### Sanitary Work (4 unmatched)

| Row | Name | Est. BOQ | Unit | Reason |
|---|---|---|---|---|
| 105 | งานฐานรากถังถังน้ำ | 1 | Ea | no task matched for area TLB, component=งานถังน้ำ 2,000 ลิตร |
| 106 | ติดตั้งถังน้ำ | 1 | Ea | no task matched for area TLB, component=งานถังน้ำ 2,000 ลิตร |
| 108 | ฐานรากสำหรับปั้มน้ำ  | 1 | Ea | no task matched for area TLB, component=งานปั้มน้ำอินเวอเตอร์ (CW Pump) |
| 109 | ติดตั้งปั้มน้ำอินเวอเตอร์ (CW Pump) | 1 | Ea | no task matched for area TLB, component=งานปั้มน้ำอินเวอเตอร์ (CW Pump) |

### Electrical Work (9 unmatched)

| Row | Name | Est. BOQ | Unit | Reason |
|---|---|---|---|---|
| 197 | ติดตั้งตู้ไฟฟ้าย่อย | 1 | Ea | no rule matched: area=WHB, category=งานระบบไฟฟ้าส่องสว่าง, component=ติดตั้งตู้ย่อยและเครื่องปรับอากาศ, leaf=ติดตั้งตู้ไฟฟ้าย่อย |
| 198 | การเข้าหัวสายเคเบิล | 1 | Ea | no rule matched: area=WHB, category=งานระบบไฟฟ้าส่องสว่าง, component=ติดตั้งตู้ย่อยและเครื่องปรับอากาศ, leaf=การเข้าหัวสายเคเบิล |
| 231 | ตั้งตั้ง 3P FIXED MODULE FEEDER 400V 20kVA | 1 | Ea | no rule matched: area=WHB, category=ห้องไฟฟ้า, component=ตั้งตั้ง 3P FIXED MODULE FEEDER 400V 20kVA, leaf=ตั้งตั้ง 3P FIXED MODULE FEEDER 400V 20kVA |
| 232 | ติดตั้ง MCB 6A FOR MAIN GATE (INSTALLED IN LP--04) | 1 | Ea | no rule matched: area=WHB, category=ห้องไฟฟ้า, component=ติดตั้ง MCB 6A FOR MAIN GATE (INSTALLED IN LP--04), leaf=ติดตั้ง MCB 6A FOR MAIN GATE (INSTALLED IN LP--04) |
| 233 | ติดตั้งตู้ไฟฟ้าย่อย | 1 | Ea | no rule matched: area=WHB, category=ห้องไฟฟ้า, component=ติดตั้งตู้ไฟฟ้าย่อย, leaf=ติดตั้งตู้ไฟฟ้าย่อย |
| 239 | MDB & DB FUNCTION TEST | 100 | % | no rule matched: area=WHB, category=ห้องไฟฟ้า, component=MDB & DB FUNCTION TEST, leaf=MDB & DB FUNCTION TEST |
| 265 | ลากสายดิน | 111 | m | no grounding/lightning task exists at ROD/site level for external electrical scope |
| 266 | การเข้าหัวสายเคเบิล | 100 | % | no grounding/lightning task exists at ROD/site level for external electrical scope |
| 273 | ติดตั้ง MDB | 1 | Ea | no area-level task for MDB install on this inter-building LV feeder scope |

## Notes on methodology

- Hierarchy for Infrastructure Work, Building Work, Steel Structure Work, Sanitary Work and Electrical Work was reconstructed from the raw Excel file using cell indent level (`cell.alignment.indent`) and formula-vs-literal detection on the Unit BOQ column, via a top-down stack tracker — not the possibly-misleading parent/grandparent/ggparent fields in all_leaves.json.
- Where a building has a granular breakdown of a schedule phase (e.g. WSB's separate "Concrete for Ground Beam" / "Concrete for Pedestal" / "Concrete Slab 1st Floor" tasks), the more specific task_code was preferred over a generic fallback.
- "low" confidence rows (5 total, all in Building Work) still carry a task_code but are a rough best-guess (e.g. gypsum wall trims, steel roof vents mapped to the closest door/window task) and are worth a human spot-check.
- Rows 10-16 of Building Work (whole-building structural-concrete total rows) were approximated to each building's "Concrete Foundation Work" task at medium confidence — they are building-wide rollups, not a single true leaf activity, and are worth reviewing.
- GHB and TLB carry only one electrical task ("Lighting and Receptacle Installation") in the schedule; all their Electrical Work leaves that had no more specific task were rolled up into it at medium confidence.