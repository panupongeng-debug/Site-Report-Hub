
(function(){
  const SUPABASE_URL = "https://gkbqauxjariovuseoydi.supabase.co";
  const SUPABASE_KEY = "sb_publishable_PuNS8PUd323lbU-gi4vzeA_46oMYVtx";
  const BUCKET = "evidence-photos";
  const STORAGE_OBJ = SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/';
  const STORAGE_PUBLIC = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/';
  const HEADERS = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' };

  // ============================================================================================
  // โหมด "ดูอย่างเดียว" (View Only) — เพิ่ม 2026-09-08
  // เปิดด้วย query param ?view=readonly ต่อท้าย URL เช่น https://.../index.html?view=readonly
  // ใช้แจกลิงก์ให้คนนอกทีม/ผู้บริหาร/ลูกค้าดูข้อมูล โดยไม่ให้แก้ไข/เพิ่ม/ลบข้อมูลได้เลย
  //
  // สำคัญ: การป้องกันหลักคือ "บล็อกที่ระดับ fetch" ด้านล่าง (ปฏิเสธทุก request ที่ไม่ใช่ GET ไป Supabase
  // ตั้งแต่ต้นทาง) ซึ่งกันได้จริงไม่ว่า UI จะซ่อนปุ่มครบหรือไม่ — ส่วนการซ่อนปุ่ม/ช่องกรอกข้างล่างเป็นแค่
  // ทำให้ผู้ใช้ไม่เห็นปุ่มที่กดแล้วจะไม่ทำงานเฉยๆ (ประสบการณ์ใช้งานที่ดีขึ้น ไม่ใช่ชั้นความปลอดภัยหลัก)
  // หมายเหตุด้านความปลอดภัย: SUPABASE_KEY ข้างบนเป็น anon key ที่ยังไม่ได้เปิด Row Level Security (RLS)
  // ในฐานข้อมูล ผู้ใช้ที่มีความรู้ด้านเทคนิคสามารถเปิด Developer Tools แล้วเรียก Supabase REST API ตรงๆ
  // ด้วย key เดียวกันนี้เพื่อเขียนข้อมูลได้ ข้ามการบล็อกที่ fetch นี้ไปเลย — ถ้าต้องการการันตีว่าคนนอกทีม
  // เขียนข้อมูลไม่ได้จริงๆ 100% (ไม่ใช่แค่กันคนทั่วไปที่ใช้ผ่านหน้าเว็บปกติ) ต้องเปิด RLS ที่ฝั่ง Supabase
  // แยก role/สิทธิ์เขียนออกจาก role ที่ใช้แจกลิงก์ดูอย่างเดียว
  // ตรวจจากชื่อโดเมนตรงๆ ด้วย (ไม่พึ่ง vercel.json rewrite อย่างเดียว) — โดเมนนี้เปิดมาต้อง
  // เป็นโหมดดูอย่างเดียวเสมอไม่ว่า query string จะมีหรือไม่ กันกรณี rewrite ที่ฝั่ง Vercel ไม่ทำงานตามคาด
  const VIEW_ONLY_HOSTS = ['site-report-hub-view.vercel.app'];
  const VIEW_ONLY = new URLSearchParams(location.search).get('view') === 'readonly'
    || VIEW_ONLY_HOSTS.indexOf(location.hostname) !== -1;
  if (VIEW_ONLY) {
    const _origFetch = window.fetch.bind(window);
    window.fetch = function(url, opts){
      const method = ((opts && opts.method) || 'GET').toUpperCase();
      const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
      if (urlStr.indexOf(SUPABASE_URL) === 0 && method !== 'GET' && method !== 'HEAD') {
        try{ showToast('โหมดดูอย่างเดียว — ไม่สามารถบันทึก/แก้ไขข้อมูลได้', true); }catch(e){}
        return Promise.reject(new Error('VIEW_ONLY_MODE_BLOCKED: ' + method + ' ' + urlStr));
      }
      return _origFetch(url, opts);
    };

    document.documentElement.classList.add('view-only-mode');
    const vostyle = document.createElement('style');
    vostyle.textContent = `
      /* โหมดดูอย่างเดียว — ซ่อนปุ่ม/ช่องกรอกที่ใช้แก้ไข/เพิ่ม/ลบ/นำเข้าข้อมูล (รู้จักชื่อ class/id แน่ชัด) */
      .view-only-mode .gantt-save-btn, .view-only-mode .gantt-task-del-btn,
      .view-only-mode .sa-save-btn, .view-only-mode .sa-add-btn, .view-only-mode .sa-del-btn, .view-only-mode .sa-apply-btn,
      .view-only-mode .tv-save-btn, .view-only-mode .tv-del-btn,
      .view-only-mode .list-add-btn, .view-only-mode .kpi-addrow, .view-only-mode .btn-add,
      .view-only-mode .gantt-io-btn-add, .view-only-mode .upload-btn, .view-only-mode .copy-prev-btn,
      .view-only-mode #schAddTaskBtn, .view-only-mode #schImportBtn, .view-only-mode #schImportFile,
      .view-only-mode #schWbsWeightBtn, .view-only-mode #schPhaseWeightBtn, .view-only-mode #scurveManualBtn,
      .view-only-mode #btnAddKpiCategory, .view-only-mode #btnEditPlan, .view-only-mode #btnEditThis,
      .view-only-mode .rm-row, .view-only-mode .wbsw-del, .view-only-mode .phw-del, .view-only-mode .scmp-del {
        display: none !important;
      }
      .view-only-mode input.gantt-progress-input, .view-only-mode input.gantt-weight-input,
      .view-only-mode input.kpi-input, .view-only-mode input.plan-input, .view-only-mode input.pour-input,
      .view-only-mode input.sa-input, .view-only-mode input.sa-name-input,
      .view-only-mode .tv-area-input, .view-only-mode .tv-code-input, .view-only-mode .tv-disc-input,
      .view-only-mode .tv-end-input, .view-only-mode input.tv-input, .view-only-mode .tv-name-input,
      .view-only-mode .tv-pkg-input, .view-only-mode .tv-start-input, .view-only-mode .tv-status-input,
      .view-only-mode .tv-wbsdisc-input {
        pointer-events: none !important; opacity: .6 !important; background: #f1f5f9 !important;
      }
      .view-only-mode-banner {
        position: sticky; top: 0; z-index: 9999; background: #FEF3C7; color: #92400E;
        font-size: 13px; font-weight: 600; text-align: center; padding: 6px 10px;
        border-bottom: 1px solid #FDE68A;
      }
    `;
    document.head.appendChild(vostyle);
    function insertViewOnlyBanner(){
      if (!document.body || document.getElementById('viewOnlyBanner')) return;
      const banner = document.createElement('div');
      banner.id = 'viewOnlyBanner';
      banner.className = 'view-only-mode-banner';
      banner.textContent = '👁️ โหมดดูอย่างเดียว (View Only) — ไม่สามารถแก้ไข/เพิ่ม/ลบข้อมูลได้ในหน้านี้';
      document.body.insertBefore(banner, document.body.firstChild);
    }
    if (document.body) insertViewOnlyBanner();
    else window.addEventListener('DOMContentLoaded', insertViewOnlyBanner);

    // ตาข่ายนิรภัยเพิ่มเติม: ซ่อนปุ่มที่อาจไม่ได้ระบุ class/id ไว้ข้างบนครบทุกตัว โดยดูจาก emoji ที่แอปนี้
    // ใช้เป็นธรรมเนียมเดียวกันทั้งแอปสำหรับปุ่มแก้ไข/เพิ่ม/ลบ/นำเข้า/ตั้งค่า (🗑 ➕ 💾 ⬆️ 📝 ⚙️) — ใช้
    // MutationObserver แทนการซ่อนครั้งเดียวตอนโหลดหน้า เพราะแอปนี้ re-render DOM บ่อยมากทุก Dashboard
    const EDIT_EMOJI = ['🗑','➕','💾','⬆️','📝','⚙️'];
    function hideEditAffordances(){
      document.querySelectorAll('button').forEach(btn=>{
        const t = btn.textContent || '';
        if (EDIT_EMOJI.some(e => t.indexOf(e) !== -1)) btn.style.display = 'none';
      });
    }
    hideEditAffordances();
    new MutationObserver(()=> hideEditAffordances()).observe(document.documentElement, { childList:true, subtree:true });
  }

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  // build the ISO date string from the Date object's LOCAL calendar fields, not toISOString()
  // (which converts to UTC first) — using toISOString() shifts the date back by one whenever the
  // browser's local timezone is ahead of UTC (e.g. Thailand, UTC+7), which was breaking every
  // date computed via setDate() (addDays, mondayOfWeek, week labels, ...)
  function toISODate(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  }
  function addDays(iso, n){ const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate()+n); return toISODate(d); }
  function todayISO(){ return toISODate(new Date()); }
  function slug(s){ return (s||'').toLowerCase().replace(/\s+/g,'-'); }
  function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function uid(){ return Date.now().toString(36) + Math.random().toString(16).slice(2); }
  function calcDuration(s, e){
    if(!s || !e) return '--';
    const [sh,sm] = s.split(':').map(Number), [eh,em] = e.split(':').map(Number);
    const m = (eh*60+em) - (sh*60+sm);
    if(m <= 0) return '--';
    const h = Math.floor(m/60), r = m%60;
    return r > 0 ? `${h} hrs ${r} min` : `${h} hrs`;
  }
  // returns the Monday that CLOSES the week containing iso (the "ตัดรอบ" cutoff day),
  // so weeks run Tuesday -> Monday: e.g. 2026-08-25..2026-08-31, 2026-09-01..2026-09-07, ...
  // (a date that already falls on Monday belongs to the week ending that same day)
  function mondayOfWeek(iso){
    const d = new Date(iso + 'T00:00:00');
    const day = d.getDay(); // 0=Sun..6=Sat, Mon=1
    const diff = (1 - day + 7) % 7; // days forward to reach the closing Monday
    d.setDate(d.getDate() + diff);
    return toISODate(d);
  }
  // weekEndMonday is the cutoff Monday (as returned by mondayOfWeek); the week's start is 6 days before it
  function weekLabel(weekEndMonday){
    const startIso = addDays(weekEndMonday, -6);
    const fmt = (iso) => { const [,m,dd] = iso.split('-'); return dd + '/' + m; };
    return fmt(startIso) + '-' + fmt(weekEndMonday);
  }

  // สภาพอากาศราย 4 ช่วงเวลา (Daily Report) — ใช้ทั้งในฟอร์มและ "นาฬิกาอากาศ" ใน Dashboard Daily
  const WEATHER_OPTIONS = ['Sunny (ท้องฟ้าโปร่งใส)','Cloudy (มีเมฆ)','Rainy (ฝนตก)','Windy (ลมแรง)'];
  const WEATHER_COLORS = {
    'Sunny (ท้องฟ้าโปร่งใส)': '#F0A93B',
    'Cloudy (มีเมฆ)': '#9AA3B0',
    'Rainy (ฝนตก)': '#2563EB',
    'Windy (ลมแรง)': '#0EA394',
    'ไม่ระบุ': '#E5E7EB',
  };
  function weatherColor(w){ return WEATHER_COLORS[w || 'ไม่ระบุ'] || '#E5E7EB'; }
  const WEATHER_ICONS = {
    'Sunny (ท้องฟ้าโปร่งใส)': '☀️',
    'Cloudy (มีเมฆ)': '☁️',
    'Rainy (ฝนตก)': '🌧️',
    'Windy (ลมแรง)': '💨',
  };
  function weatherIcon(w){ return WEATHER_ICONS[w] || '➖'; }
  const WEATHER_PERIODS = [
    {key:'weather_0609', label:'06:00–09:00'},
    {key:'weather_0912', label:'09:00–12:00'},
    {key:'weather_1215', label:'12:00–15:00'},
    {key:'weather_1518', label:'15:00–18:00'},
  ];
  // ลำดับสำหรับวาด "นาฬิกาอากาศ" ให้ตรงกับตำแหน่งจริงบนหน้าปัดนาฬิกา (12=บน, 3=ขวา, 6=ล่าง, 9=ซ้าย)
  // เริ่มวาดจาก 12 นาฬิกาตามเข็ม: 12→3 (บนขวา) = 12:00-15:00, 3→6 (ล่างขวา) = 15:00-18:00,
  // 6→9 (ล่างซ้าย) = 06:00-09:00, 9→12 (บนซ้าย) = 09:00-12:00
  const WEATHER_CLOCK_ORDER = [
    WEATHER_PERIODS.find(p=>p.key==='weather_1215'),
    WEATHER_PERIODS.find(p=>p.key==='weather_1518'),
    WEATHER_PERIODS.find(p=>p.key==='weather_0609'),
    WEATHER_PERIODS.find(p=>p.key==='weather_0912'),
  ];

  // ================= MODULE DEFINITIONS =================
  // RIG. <-> RIG. Code: 1 rig = 1 code เสมอ เลือกช่องใดช่องหนึ่งอีกช่องจะเปลี่ยนตามอัตโนมัติ
  const RIG_RIG_CODE_MAP = [
    ['1','22T15'], ['2','18T15'], ['3','6C19'], ['4','4C19'], ['5','2C19'],
    ['6','16T15'], ['7','NO.3'], ['8','6HL1'], ['9','NO.9'],
  ];
  const MODULES = [
    {
      id:'findings', label:'Safety Findings', icon:'⚠️', table:'findings',
      dateField:'finding_date', hasAutoNumber:true, numberField:'finding_number',
      accentField:'severity', accentMap:{Low:'sev-low',Medium:'sev-medium',High:'sev-high',Critical:'sev-critical'},
      titleField:'description', badgeFields:['location','status'],
      badgeColorMap:{Open:'status-open','In Progress':'status-in-progress',Closed:'status-closed',Overdue:'status-overdue'},
      statusFilterField:'status', statusFilterOptions:['Open','In Progress','Closed','Overdue'],
      fields:[
        {key:'finding_date', label:'FindingDate — วันที่ตรวจพบ', type:'date', required:true},
        {key:'location', label:'Location', type:'select', required:true, options:['Construction Site','Warehouse','Office','Workshop','ROAD & PAVING','WH-A','WH-B','อาคารอเนกประสงค์','อาคารซ่อมบำรุง','ห้องน้ำพนักงานขับรถ','โรงฉ่ำ','ป้อม รปภ.','All']},
        {key:'finding_type', label:'FindingType', type:'select', required:true, options:['Line Walk','Safety Audit','Inspection','Incident Report','Near Miss','Unsafe Finding']},
        {key:'category', label:'Category', type:'select', required:true, options:['PPE','Housekeeping','House Keeping & 5ส.','Electrical','Working at Height','Fire Safety','Chemical','Machine Guarding','Access way','Unsafe Condition','STD','Environment','Barricade Tag','Recognize','ประสานงาน','ชื่นชม','Other']},
        {key:'severity', label:'Severity', type:'select', required:true, options:['Low','Medium','High','Critical']},
        {key:'description', label:'Description — อธิบายสิ่งที่ตรวจพบ', type:'textarea', required:true},
        {key:'status', label:'Status', type:'select', required:true, options:['Open','In Progress','Closed','Overdue'], default:'Open'},
        {key:'due_date', label:'DueDate', type:'date', note:'ตั้งต้น = วันที่ตรวจพบ + 7 วัน'},
        {key:'responsible_person', label:'ResponsiblePerson', type:'text'},
        {key:'root_cause', label:'RootCause', type:'textarea'},
        {key:'corrective_action', label:'CorrectiveAction', type:'textarea'},
        {key:'date_closed', label:'DateClosed', type:'date'},
      ],
      computeStats(rows){
        const today = todayISO();
        let open=0, progress=0, closed=0, overdue=0;
        rows.forEach(f=>{
          if(f.status === 'Closed'){ closed++; return; }
          if(f.status === 'In Progress'){ progress++; } else if(f.status === 'Open'){ open++; }
          if(f.due_date && f.due_date < today && f.status !== 'Closed'){ overdue++; }
        });
        return [{label:'OPEN',value:open,cls:'c1'},{label:'IN PROGRESS',value:progress,cls:'c2'},{label:'OVERDUE',value:overdue,cls:'c3'},{label:'CLOSED',value:closed,cls:'c4'}];
      },
      idLabel(f){ return f.finding_number; }
    },
    {
      id:'environment', label:'Environment Record', icon:'♻️', table:'environment_reports',
      dateField:'report_date', hasAutoNumber:false,
      accentField:null, titleField:'remarks', badgeFields:[], badgeColorMap:{},
      statusFilterField:null,
      fields:[
        {key:'report_date', label:'📅 Date', type:'date', required:true},
        {key:'concrete_scrap_kg', label:'Concrete Scrap Record (Kg)', type:'number', default:0},
        {key:'soil_disposal_kg', label:'Soil Disposal Record (Kg)', type:'number', default:0},
        {key:'hazardous_waste_kg', label:'Hazardous Waste (Kg)', type:'number', default:0},
        {key:'general_waste_kg', label:'General Waste (Kg)', type:'number', default:0},
        {key:'recyclable_waste_kg', label:'Recyclable Waste (Kg)', type:'number', default:0},
        {key:'remarks', label:'📝 หมายเหตุ', type:'textarea', placeholder:'บันทึกเพิ่มเติม...'},
      ],
      computeStats(rows){
        const sum = (k) => rows.reduce((s,r)=> s + (Number(r[k])||0), 0);
        const totalKg = ENV_CATEGORIES.reduce((s,c)=> s + sum(c.key), 0);
        return [{label:'รายงานทั้งหมด',value:rows.length,cls:'c1'},{label:'ขยะรวมทั้งหมด (Kg)',value:Math.round(totalKg*100)/100,cls:'c2'}];
      },
      idLabel(f){ return 'ENV-' + (f.id ? f.id.slice(0,6) : ''); }
    },
    {
      id:'daily', label:'Daily Report', icon:'📋', table:'daily_reports',
      dateField:'report_date', hasAutoNumber:false,
      accentField:null, titleField:'activities', badgeFields:[], badgeColorMap:{},
      statusFilterField:null,
      renderExtraMeta(f){
        return WEATHER_PERIODS.map(p => `<span class="pill loc" title="${p.label}: ${f[p.key] || 'ไม่ระบุ'}">${weatherIcon(f[p.key])} ${p.label}</span>`).join('');
      },
      fields:[
        {key:'report_date', label:'📅 Date', type:'date', required:true},
        {key:'location', label:'📍 Location', type:'text', placeholder:'Site location'},
        {key:'time_start', label:'🕖 Work Start', type:'time', default:'07:00'},
        {key:'time_end', label:'🕕 Work End', type:'time', default:'18:00'},
        {key:'project_name', label:'🏢 Project Name', type:'text', default:'RISE Project'},
        {key:'weather_0609', label:'🌤️ Weather 06:00–09:00', type:'select', options:WEATHER_OPTIONS},
        {key:'weather_0912', label:'🌤️ Weather 09:00–12:00', type:'select', options:WEATHER_OPTIONS},
        {key:'weather_1215', label:'🌤️ Weather 12:00–15:00', type:'select', options:WEATHER_OPTIONS},
        {key:'weather_1518', label:'🌤️ Weather 15:00–18:00', type:'select', options:WEATHER_OPTIONS},
        {key:'repco_personnel', label:'👨‍💼 REPCO Personnel', type:'personnel-list', default:[{position:'Construction Manager',count:1}]},
        {key:'state_personnel_site', label:'👥 State Personnel — Area Construction Site', type:'personnel-list', default:[{position:'Worker (M)',count:1},{position:'Worker (W)',count:1}]},
        {key:'state_personnel_workshop', label:'👥 State Personnel — Area Workshop', type:'personnel-list', default:[]},
        {key:'equipment', label:'🚜 Machinery / Equipment', type:'personnel-list', itemPlaceholder:'Equipment', default:[{position:'',count:1}]},
        {key:'activities', label:'🎯 Daily Activity & Goals', type:'textarea', required:true, placeholder:'Describe completed tasks and goals...'},
        {key:'progress_summary', label:'📊 Progress Summary', type:'textarea', placeholder:'Enter progress summary...'},
      ],
      computeStats(rows){ return [{label:'รายงานทั้งหมด',value:rows.length,cls:'c1'}]; },
      idLabel(f){ return 'DR-' + (f.id ? f.id.slice(0,6) : ''); },
      detailExtra(f){
        const dur = calcDuration(f.time_start, f.time_end);
        return `<div class="detail-field"><label>Working Hours</label><div class="val">${escapeHtml(f.time_start||'--')} – ${escapeHtml(f.time_end||'--')} (${dur})</div></div>`;
      }
    },
    {
      id:'qc', label:'QC Report', icon:'🔍', table:'qc_reports',
      dateField:'inspection_date', hasAutoNumber:false,
      accentField:'result', accentMap:{Pass:'sev-low',Fail:'sev-critical',Rework:'sev-medium'},
      titleField:'task', badgeFields:['location','result'],
      badgeColorMap:{Pass:'status-closed',Fail:'status-overdue',Rework:'status-in-progress'},
      statusFilterField:'result', statusFilterOptions:['Pass','Fail','Rework'],
      fields:[
        {key:'inspection_date', label:'วันที่ตรวจ', type:'date', required:true},
        {key:'location', label:'บริเวณ/ตำแหน่ง', type:'text', required:true},
        {key:'task', label:'งานที่ตรวจ', type:'text', required:true},
        {key:'result', label:'ผลตรวจ', type:'select', required:true, options:['Pass','Fail','Rework']},
        {key:'inspector', label:'ผู้ตรวจสอบ', type:'text'},
        {key:'defect_details', label:'รายละเอียดข้อบกพร่อง', type:'textarea'},
        {key:'corrective_action', label:'การแก้ไข', type:'textarea'},
      ],
      computeStats(rows){
        const pass=rows.filter(r=>r.result==='Pass').length, fail=rows.filter(r=>r.result==='Fail').length, rework=rows.filter(r=>r.result==='Rework').length;
        return [{label:'PASS',value:pass,cls:'c4'},{label:'FAIL',value:fail,cls:'c3'},{label:'REWORK',value:rework,cls:'c2'},{label:'ทั้งหมด',value:rows.length,cls:'c1'}];
      },
      idLabel(f){ return 'QC-' + (f.id ? f.id.slice(0,6) : ''); }
    },
    {
      id:'concrete', label:'Concrete Report', icon:'🧱', table:'concrete_reports',
      dateField:'report_date', hasAutoNumber:false,
      accentField:null, titleField:'remarks', badgeFields:[], badgeColorMap:{},
      statusFilterField:null,
      fields:[
        {key:'report_date', label:'📅 Date', type:'date', required:true},
        {key:'foreman_count', label:'Foreman', type:'number', readOnly:true, default:0, note:'รวมอัตโนมัติจากกำลังคนแยกตามพื้นที่ด้านล่าง'},
        {key:'safety_count', label:'Safety', type:'number', readOnly:true, default:0, note:'รวมอัตโนมัติจากกำลังคนแยกตามพื้นที่ด้านล่าง'},
        {key:'worker_count', label:'Worker', type:'number', readOnly:true, default:0, note:'รวมอัตโนมัติจากกำลังคนแยกตามพื้นที่ด้านล่าง'},
        {key:'other_count', label:'Other', type:'number', readOnly:true, default:0, note:'รวมอัตโนมัติจากกำลังคนแยกตามพื้นที่ด้านล่าง'},
        {key:'manpower_by_location', label:'👥 กำลังคนแยกตามพื้นที่', type:'area-manpower-list', default:[],
          locationOptions:['ROAD & PAVING','WH-A','WH-B','อาคารอเนกประสงค์','อาคารซ่อมบำรุง','ห้องน้ำพนักงานขับรถ','โรงฉ่ำ','ป้อม รปภ.','Workshop','Other']},
        {key:'remarks', label:'📝 หมายเหตุ', type:'textarea', placeholder:'บันทึกเพิ่มเติม...'},
      ],
      computeStats(rows){ return [{label:'รายงานทั้งหมด',value:rows.length,cls:'c1'}]; },
      idLabel(f){ return 'CR-' + (f.id ? f.id.slice(0,6) : ''); }
    },
    {
      id:'piling', label:'Piling Report', icon:'🔨', table:'pile_reports',
      dateField:'piled_date', hasAutoNumber:false,
      accentField:'status', accentMap:{Completed:'sev-low',Pending:'sev-medium',Corrected:'sev-high',Defected:'sev-critical'},
      titleField:'size', badgeFields:['area','status'],
      badgeColorMap:{Completed:'status-closed',Pending:'status-open',Corrected:'status-in-progress',Defected:'status-overdue'},
      statusFilterField:'status', statusFilterOptions:['Pending','Completed','Corrected','Defected'],
      fields:[
        {key:'pile_number', label:'PILE NUMBER', type:'text', required:true, note:'กดปุ่ม 🔍 ค้นหา เพื่อเปิดรายการเดิมมาแก้ไข (ถ้ามีอยู่แล้ว)'},
        {key:'area', label:'AREA', type:'text', readOnly:true},
        {key:'dwg_no', label:'DWG No.', type:'text', readOnly:true},
        {key:'rfi_no', label:'RFI No.', type:'text', readOnly:true},
        {key:'size', label:'SIZE', type:'text', readOnly:true},
        {key:'length_plan', label:'LENGTH(m.) — แผน', type:'number', readOnly:true},
        {key:'type', label:'TYPE', type:'text', readOnly:true},
        {key:'pile_cut', label:'PILE CUT', type:'number', readOnly:true},
        {key:'pile_production_day', label:'PILE PRODUCTION DAY', type:'date', readOnly:true},
        {key:'pile_delivery_day', label:'PILE DELIVERY DAY', type:'date', readOnly:true},
        {key:'plan_date', label:'แผนวันที่ตอก', type:'date', readOnly:true},
        {key:'design_n', label:'Design N', type:'number', readOnly:true},
        {key:'design_e', label:'Design E', type:'number', readOnly:true},
        {key:'status', label:'สถานะ', type:'select', required:true, options:['Pending','Completed','Corrected','Defected'], default:'Pending'},
        {key:'rig', label:'RIG.', type:'select', options:['1','2','3','4','5','6','7','8','9']},
        {key:'rig_code', label:'RIG. Code', type:'select', options:['22T15','18T15','6C19','4C19','2C19','16T15','6HL1','NO.3','NO.9']},
        {key:'driving_time_start', label:'Driving Time (START)', type:'text', placeholder:'เช่น 9:28 AM'},
        {key:'weld_inspection', label:'Weld Inspection', type:'select', options:['Accept','Reject']},
        {key:'driving_time_finish', label:'Driving Time (FINISH)', type:'text', placeholder:'เช่น 10:41 AM'},
        {key:'elevation_pile_top', label:'Elevation PILE TOP', type:'number'},
        {key:'length_actual', label:'LENGTH(m.) — Actual', type:'number'},
        {key:'elevation_pile_tip', label:'Elevation PILE TIP', type:'number', readOnly:true, note:'คำนวณอัตโนมัติ = Elevation PILE TOP − LENGTH(Actual)'},
        {key:'deviation_n', label:'Deviation N (m)', type:'number', note:'กรอกค่าที่วัดได้จากหน้างาน'},
        {key:'deviation_e', label:'Deviation E (m)', type:'number', note:'กรอกค่าที่วัดได้จากหน้างาน'},
        {key:'n_actual', label:'N (Actual)', type:'number', readOnly:true, note:'คำนวณอัตโนมัติ = Design N + Deviation N'},
        {key:'e_actual', label:'E (Actual)', type:'number', readOnly:true, note:'คำนวณอัตโนมัติ = Design E + Deviation E'},
        {key:'piled_date', label:'วันที่ตอก', type:'date'},
        {key:'sequence_no', label:'ลำดับการตอก', type:'number'},
        {key:'remark', label:'REMARK', type:'textarea'},
      ],
      computeStats(rows){
        const done = rows.filter(r=>r.status==='Completed').length;
        const pending = rows.filter(r=>r.status==='Pending').length;
        const corrected = rows.filter(r=>r.status==='Corrected').length;
        return [{label:'ทั้งหมด',value:rows.length,cls:'c1'},{label:'ตอกแล้ว',value:done,cls:'c4'},{label:'รอตอก',value:pending,cls:'c2'},{label:'ตอกแซม',value:corrected,cls:'c3'}];
      },
      idLabel(f){ return 'PILE-' + (f.pile_number || ''); }
    },
    {
      id:'piling_design', label:'Piling Design Data', icon:'📐', table:'pile_reports',
      dateField:'plan_date', hasAutoNumber:false,
      accentField:'status', accentMap:{Completed:'sev-low',Pending:'sev-medium',Corrected:'sev-high',Defected:'sev-critical'},
      titleField:'size', badgeFields:['area','status'],
      badgeColorMap:{Completed:'status-closed',Pending:'status-open',Corrected:'status-in-progress',Defected:'status-overdue'},
      statusFilterField:'status', statusFilterOptions:['Pending','Completed','Corrected','Defected'],
      // ทุกช่องแก้ไขได้ทั้งหมด (ทั้งข้อมูลออกแบบ/แผน และข้อมูลหน้างาน) — ใช้สร้างข้อมูลเสาเข็มเริ่มต้น
      // หรือแก้ไขข้อมูลออกแบบของเสาเข็มที่มีอยู่แล้ว (กดปุ่มค้นหาเพื่อดึงรายการเดิมมาแก้)
      fields:[
        {key:'pile_number', label:'PILE NUMBER', type:'text', required:true, note:'กดปุ่ม 🔍 ค้นหา เพื่อตรวจว่ามีเสาเข็มนี้อยู่แล้วหรือยัง ก่อนสร้างใหม่'},
        {key:'area', label:'AREA', type:'text'},
        {key:'dwg_no', label:'DWG No.', type:'text'},
        {key:'rfi_no', label:'RFI No.', type:'text'},
        {key:'size', label:'SIZE', type:'text'},
        {key:'length_plan', label:'LENGTH(m.) — แผน', type:'number'},
        {key:'type', label:'TYPE', type:'text'},
        {key:'pile_cut', label:'PILE CUT', type:'number'},
        {key:'pile_production_day', label:'PILE PRODUCTION DAY', type:'date'},
        {key:'pile_delivery_day', label:'PILE DELIVERY DAY', type:'date'},
        {key:'plan_date', label:'แผนวันที่ตอก', type:'date'},
        {key:'lower_pile_tag', label:'Lower Pile Tag', type:'text'},
        {key:'upper_pile_tag', label:'Upper Pile Tag', type:'text'},
        {key:'design_n', label:'Design N', type:'number'},
        {key:'design_e', label:'Design E', type:'number'},
        {key:'status', label:'สถานะ', type:'select', required:true, options:['Pending','Completed','Corrected','Defected'], default:'Pending'},
        {key:'rig', label:'RIG.', type:'select', options:['1','2','3','4','5','6','7','8','9']},
        {key:'rig_code', label:'RIG. Code', type:'select', options:['22T15','18T15','6C19','4C19','2C19','16T15','6HL1','NO.3','NO.9']},
        {key:'driving_time_start', label:'Driving Time (START)', type:'text', placeholder:'เช่น 9:28 AM'},
        {key:'weld_inspection', label:'Weld Inspection', type:'select', options:['Accept','Reject']},
        {key:'driving_time_finish', label:'Driving Time (FINISH)', type:'text', placeholder:'เช่น 10:41 AM'},
        {key:'elevation_pile_top', label:'Elevation PILE TOP', type:'number'},
        {key:'length_actual', label:'LENGTH(m.) — Actual', type:'number'},
        {key:'elevation_pile_tip', label:'Elevation PILE TIP', type:'number', readOnly:true, note:'คำนวณอัตโนมัติ = Elevation PILE TOP − LENGTH(Actual)'},
        {key:'piled_date', label:'วันที่ตอก', type:'date'},
        {key:'sequence_no', label:'ลำดับการตอก', type:'number'},
        {key:'remark', label:'REMARK', type:'textarea'},
      ],
      computeStats(rows){
        const done = rows.filter(r=>r.status==='Completed').length;
        const pending = rows.filter(r=>r.status==='Pending').length;
        const corrected = rows.filter(r=>r.status==='Corrected').length;
        return [{label:'ทั้งหมด',value:rows.length,cls:'c1'},{label:'ตอกแล้ว',value:done,cls:'c4'},{label:'รอตอก',value:pending,cls:'c2'},{label:'ตอกแซม',value:corrected,cls:'c3'}];
      },
      idLabel(f){ return 'PILE-' + (f.pile_number || ''); }
    },
  ];

  // waste categories tracked on environment_reports (order matches the "Waste Disposal Record" sheet)
  const ENV_CATEGORIES = [
    {key:'concrete_scrap_kg', label:'Concrete Scrap Record (Kg)', color:'#8B5CF6'},
    {key:'soil_disposal_kg', label:'Soil Disposal Record (Kg)', color:'#F97316'},
    {key:'hazardous_waste_kg', label:'Hazardous Waste (Kg)', color:'#DC2626'},
    {key:'general_waste_kg', label:'General Waste (Kg)', color:'#2563EB'},
    {key:'recyclable_waste_kg', label:'Recyclable Waste (Kg)', color:'#16A34A'},
  ];

  // ================= DASHBOARDS =================
  const chartInstances = {};
  function destroyChart(key){ if(chartInstances[key]){ chartInstances[key].destroy(); delete chartInstances[key]; } }
  function sumPersonnel(arr){ return (Array.isArray(arr)?arr:[]).reduce((s,p)=> s + (parseInt(p.count,10)||0), 0); }
  const CHART_COLORS = ['#0EA394','#2563EB','#F0A93B','#DC2626','#8B5CF6','#EC4899','#059669','#F97316'];

  // ---------- Safety KPI (Reportable KPI + Safe Man-Hours/Safe Working Days) shared helpers ----------
  async function fetchSafetyKpiCategories(){
    const res = await fetch(SUPABASE_URL + '/rest/v1/safety_kpi_categories?select=*&order=sort_order.asc', { headers: HEADERS });
    if(!res.ok) throw new Error('fetch safety_kpi_categories failed: ' + res.status);
    return await res.json();
  }
  async function fetchSafetyHseSettings(){
    const res = await fetch(SUPABASE_URL + "/rest/v1/safety_hse_settings?select=*&id=eq.default", { headers: HEADERS });
    if(!res.ok) throw new Error('fetch safety_hse_settings failed: ' + res.status);
    const rows = await res.json();
    return rows[0] || null;
  }
  function kpiTotal(row){ return (Number(row.prev_acc)||0) + (Number(row.week_actual)||0); }
  function findKpiByName(categories, name){ return categories.find(c => c.name === name) || { prev_acc:0, week_actual:0 }; }
  function daysBetweenInclusive(startIso, endIso){
    const d1 = new Date(startIso + 'T00:00:00'), d2 = new Date(endIso + 'T00:00:00');
    return Math.round((d2 - d1) / 86400000) + 1;
  }

  // 5-tier Incident Performance Pyramid (LTI top ... Unsafe Finding base), cumulative since start_date
  function renderIncidentPyramidHtml(counts, startDate){
    // counts: {lti, mti, propertyDamage, nearMiss, unsafeFinding}
    const tiers = [
      { label:'LTI', value:counts.lti, bg:'#7A0C1E', top:10, bottom:28 },
      { label:'MTI', value:counts.mti, bg:'#DC2626', top:28, bottom:46 },
      { label:'First Aid Case /<br>Property damage', value:counts.propertyDamage, bg:'#EA7D1B', top:46, bottom:64 },
      { label:'Near Miss', value:counts.nearMiss, bg:'#F0B429', top:64, bottom:82 },
      { label:'Unsafe Finding', value:counts.unsafeFinding, bg:'#C7CBD1', top:82, bottom:100 },
    ];
    const tierHtml = tiers.map(t=>{
      const topL = 50 - t.top/2, topR = 50 + t.top/2, botL = 50 - t.bottom/2, botR = 50 + t.bottom/2;
      const clip = `polygon(${topL}% 0%, ${topR}% 0%, ${botR}% 100%, ${botL}% 100%)`;
      return `<div class="pyramid-tier" style="background:${t.bg};clip-path:${clip};">${t.value}</div>`;
    }).join('');
    const rowH = 44;
    const reportableRows = tiers.slice(0,2).map(t=>`<div class="pyramid-label-row">${t.label}</div>`).join('');
    const recordableRows = tiers.slice(2).map(t=>`<div class="pyramid-label-row">${t.label}</div>`).join('');
    const reportableTop = (rowH * 2) / 2;
    const recordableTop = rowH * 2 + (rowH * 3) / 2;
    return `
      <div class="pyramid-wrap">
        <div class="pyramid-viz">${tierHtml}</div>
        <div class="pyramid-labels">
          <div class="pyramid-group">
            ${reportableRows}
          </div>
          <div class="pyramid-group">
            ${recordableRows}
          </div>
          <span class="pyramid-pill reportable" style="top:${reportableTop}px;">Reportable Case</span>
          <span class="pyramid-pill recordable" style="top:${recordableTop}px;">Recordable Case</span>
        </div>
      </div>
      <div class="dash-note" style="margin:12px 0 0;">สะสมตั้งแต่เริ่มนับ (Cumulative)${startDate ? (' · Start ' + escapeHtml(startDate)) : ''}</div>`;
  }

  function renderKpiTableHtml(categories){
    const rows = categories.map((c,i)=>{
      const total = kpiTotal(c);
      const levelHtml = c.level_locked
        ? `<span class="kpi-level-badge">${escapeHtml(c.level||'-')}</span><div class="kpi-level-note">คงที่ตามนิยาม</div>`
        : `<span class="kpi-level-badge">${escapeHtml(c.level||'-')}</span>`;
      return `<tr>
        <td>${i+1}</td>
        <td class="kpi-name">${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.unit||'Case')}</td>
        <td>${Number(c.target)||0}</td>
        <td>${Number(c.prev_acc)||0}</td>
        <td>${Number(c.week_actual)||0}</td>
        <td><span class="kpi-total-badge">${total}</span></td>
      </tr>`;
    }).join('');
    return `
      <div style="overflow-x:auto;">
        <table class="kpi-table" style="min-width:560px;">
          <thead><tr><th>#</th><th>KPI</th><th>Unit</th><th>Target</th><th>Previous Acc.</th><th>This Week</th><th>Total Actual</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderSheIconRowHtml(categories){
    const icons = [
      { label:'LTI /<br>MTI', emoji:'✋', value: kpiTotal(findKpiByName(categories,'Loss Time Injury (LTI)')) + kpiTotal(findKpiByName(categories,'Medical Treatment Injury (MTI)')) },
      { label:'Property<br>Damage', emoji:'🏭', value: kpiTotal(findKpiByName(categories,'Property damage')) },
      { label:'Fire &<br>Explosion', emoji:'🔥', value: kpiTotal(findKpiByName(categories,'Fire & Explosion Incident')) },
      { label:'Transport-<br>ation', emoji:'🚗', value: kpiTotal(findKpiByName(categories,'Zero Transportation Incident')) },
      { label:'Environ-<br>mental', emoji:'🌱', value: kpiTotal(findKpiByName(categories,'Major Environmental Incident')) },
    ];
    return `<div class="she-icon-row">${icons.map(ic=>`
      <div class="she-icon-card">
        <div class="emoji">${ic.emoji}</div>
        <div class="lbl">${ic.label}</div>
        <div class="val">${ic.value}</div>
      </div>`).join('')}</div>`;
  }

  function renderSafeDayCardHtml(settings, ltiWeekCount){
    const today = todayISO();
    const startDate = settings ? settings.start_date : null;
    const safeDays = startDate ? daysBetweenInclusive(startDate, today) : 0;
    const isOk = !ltiWeekCount || ltiWeekCount <= 0;
    return `
      <div class="safeday-card">
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--charcoal);">Safe Working Day Without LTI</div>
          <div class="num">${safeDays}</div>
          <div class="sub">Days (Total Acc.) ${startDate ? ('· เริ่มนับ ' + escapeHtml(startDate)) : '· ยังไม่ตั้งวันเริ่มนับ'}</div>
          <span class="safeday-pill ${isOk?'ok':'warn'}">${isOk ? ('+' + (ltiWeekCount||0) + ' this week') : ('⚠ เกิด LTI ' + ltiWeekCount + ' ครั้งสัปดาห์นี้')}</span>
        </div>
        <div class="safeday-check ${isOk?'ok':'warn'}">${isOk ? '✅' : '⚠️'}</div>
      </div>`;
  }

  function findingSevClassStatic(f){
    const map = {Low:'sev-low',Medium:'sev-medium',High:'sev-high',Critical:'sev-critical'};
    return map[f.severity] || 'sev-none';
  }
  function findingBadgeClassStatic(status){
    const map = {Open:'status-open','In Progress':'status-in-progress',Closed:'status-closed',Overdue:'status-overdue'};
    return map[status] || 'loc';
  }
  // เรนเดอร์ฟิลด์ของ "หน้ารายละเอียด" (อ่านอย่างเดียว) แยกจาก .form-grid/.field ที่ใช้กับฟอร์มกรอกข้อมูล —
  // จัดเป็นกริดสั้นๆ สำหรับฟิลด์ทั่วไป, ฟิลด์ข้อความยาว (textarea) ขึ้นบรรทัดเต็มความกว้างพร้อมกล่องพื้นหลัง,
  // และฟิลด์ที่เป็น accent/badge ของโมดูล (เช่น Severity, Status) ให้ขึ้นเป็นสี/ป้ายให้อ่านง่ายขึ้น
  function renderDetailFieldsHtml(fields, f, mod){
    const m = mod || activeModule;
    const sevColors = { 'sev-low':'#16A34A', 'sev-medium':'#B45309', 'sev-high':'#EA8C2E', 'sev-critical':'#DC2626', 'sev-none':'var(--ink)' };
    return fields.map(fl => {
      const isLong = fl.type === 'textarea';
      const val = f[fl.key];
      let valueHtml;
      if(m.accentField === fl.key && val){
        const cls = (m.accentMap && m.accentMap[val]) || 'sev-none';
        valueHtml = `<div class="val"><span style="font-weight:700;color:${sevColors[cls]||'var(--ink)'};">${escapeHtml(val)}</span></div>`;
      } else if((m.badgeFields||[]).includes(fl.key) && val){
        const cls = (m.badgeColorMap && m.badgeColorMap[val]) || 'loc';
        valueHtml = `<div class="val"><span class="pill ${cls}">${escapeHtml(val)}</span></div>`;
      } else if(isLong){
        valueHtml = `<div class="val-box">${formatFieldDisplay(fl, val)}</div>`;
      } else {
        const disp = formatFieldDisplay(fl, val);
        valueHtml = `<div class="val${(!val || disp === '-') ? ' empty' : ''}">${disp}</div>`;
      }
      return `<div class="detail-field${isLong ? ' full' : ''}"><label>${escapeHtml(fl.label)}</label>${valueHtml}</div>`;
    }).join('');
  }
  function openFindingDetailStatic(f){
    const findingsModule = MODULES.find(m=>m.id==='findings');
    const urls = Array.isArray(f.photo_urls) ? f.photo_urls : [];
    const fieldsHtml = renderDetailFieldsHtml(findingsModule.fields, f, findingsModule);
    const modal = $('#modalContent');
    modal.innerHTML = `
      <div class="modal-head"><h2>${escapeHtml(f.finding_number || '')}</h2><button class="modal-close" id="modalCloseBtn">&times;</button></div>
      <div class="detail-grid">
        ${fieldsHtml}
        <div class="detail-field full detail-photos"><label>Photos</label>
          <div class="photo-grid">${urls.length ? urls.map(u=>`<div class="photo-thumb"><img src="${u}" data-full="${u}"></div>`).join('') : '<span class="photo-status">ยังไม่มีรูปภาพในรายการนี้</span>'}</div>
        </div>
      </div>`;
    $('#modalBg').classList.add('show');
    $('#modalCloseBtn').addEventListener('click', ()=> $('#modalBg').classList.remove('show'));
    modal.querySelectorAll('.photo-thumb img').forEach(img => img.addEventListener('click', ()=> openLightbox(img.dataset.full, img)));
  }
  function renderRecentFindingsSafety(list, containerId){
    const container = document.getElementById(containerId || 'recentFindingsList');
    if(!container || !list.length) return;
    const today = todayISO();
    container.innerHTML = list.map(f=>{
      const urls = Array.isArray(f.photo_urls) ? f.photo_urls : [];
      const coverHtml = urls.length ? `<img src="${urls[0]}" loading="lazy">` : `<div class="ph-empty">⚠️</div>`;
      const dayTag = f.finding_date === today ? 'วันนี้ · ' : '';
      return `
      <div class="finding ${findingSevClassStatic(f)}" data-recent-id="${f.id}">
        <div class="stripe"></div>
        <div class="cover">${coverHtml}</div>
        <div class="body2">
          <div class="f-top"><span class="f-num">${escapeHtml(f.finding_number||'')}</span><span class="f-date">${dayTag}${escapeHtml(f.finding_date||'')}</span></div>
          <div class="f-desc">${escapeHtml(f.description||'(ไม่มีรายละเอียด)')}</div>
          <div class="f-meta">
            <span class="pill loc">${escapeHtml(f.location||'-')}</span>
            <span class="pill ${findingBadgeClassStatic(f.status)}">${escapeHtml(f.status||'-')}</span>
            <span class="pill loc">${escapeHtml(f.severity||'-')}</span>
            ${urls.length ? `<span class="pill photos">📷 ${urls.length}</span>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');
    container.querySelectorAll('.finding').forEach(el => {
      el.addEventListener('click', ()=>{
        const f = list.find(x => String(x.id) === el.dataset.recentId);
        if(f) openFindingDetailStatic(f);
      });
    });
  }
  function renderRecognitionThisWeek(list){
    const container = document.getElementById('recognitionList');
    if(!container || !list.length) return;
    container.innerHTML = list.map(f=>{
      const urls = Array.isArray(f.photo_urls) ? f.photo_urls : [];
      const coverHtml = urls.length ? `<img src="${urls[0]}" loading="lazy">` : `<div class="ph-empty">🎉</div>`;
      return `
      <div class="finding sev-none" data-recognition-id="${f.id}">
        <div class="stripe" style="background:#F0A93B;"></div>
        <div class="cover">${coverHtml}</div>
        <div class="body2">
          <div class="f-top"><span class="f-num">${escapeHtml(f.finding_number||'')}</span><span class="f-date">${escapeHtml(f.finding_date||'')}</span></div>
          <div class="f-desc">${escapeHtml(f.description||'(ไม่มีรายละเอียด)')}</div>
          <div class="f-meta">
            <span class="pill loc">${escapeHtml(f.location||'-')}</span>
            ${urls.length ? `<span class="pill photos">📷 ${urls.length}</span>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');
    container.querySelectorAll('.finding').forEach(el => {
      el.addEventListener('click', ()=>{
        const f = list.find(x => String(x.id) === el.dataset.recognitionId);
        if(f) openFindingDetailStatic(f);
      });
    });
  }
  function renderNotClosedFindings(list, containerId){
    const container = document.getElementById(containerId || 'notClosedList');
    if(!container || !list.length) return;
    const today = todayISO();
    container.innerHTML = list.map(f=>{
      const urls = Array.isArray(f.photo_urls) ? f.photo_urls : [];
      const coverHtml = urls.length ? `<img src="${urls[0]}" loading="lazy">` : `<div class="ph-empty">⚠️</div>`;
      const isOverdue = f.due_date && f.due_date < today;
      return `
      <div class="finding ${findingSevClassStatic(f)}" data-notclosed-id="${f.id}">
        <div class="stripe"></div>
        <div class="cover">${coverHtml}</div>
        <div class="body2">
          <div class="f-top"><span class="f-num">${escapeHtml(f.finding_number||'')}</span><span class="f-date" style="${isOverdue ? 'color:var(--danger);font-weight:700;' : ''}">${escapeHtml(f.finding_date||'')}${f.due_date ? (' · Due ' + escapeHtml(f.due_date)) : ''}</span></div>
          <div class="f-desc">${escapeHtml(f.description||'(ไม่มีรายละเอียด)')}</div>
          <div class="f-meta">
            <span class="pill loc">${escapeHtml(f.location||'-')}</span>
            <span class="pill ${findingBadgeClassStatic(isOverdue ? 'Overdue' : f.status)}">${escapeHtml(isOverdue ? 'Overdue' : (f.status||'-'))}</span>
            <span class="pill loc">${escapeHtml(f.severity||'-')}</span>
            ${urls.length ? `<span class="pill photos">📷 ${urls.length}</span>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');
    container.querySelectorAll('.finding').forEach(el => {
      el.addEventListener('click', ()=>{
        const f = list.find(x => String(x.id) === el.dataset.notclosedId);
        if(f) openFindingDetailStatic(f);
      });
    });
  }

  const DASHBOARDS = [
    {
      id:'dash_safety', label:'Dashboard Safety', icon:'📊', table:'findings',
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        let data;
        try{
          const res = await fetch(SUPABASE_URL + '/rest/v1/findings?select=*', { headers: HEADERS });
          if(!res.ok) throw new Error('fetch failed: ' + res.status);
          data = await res.json();
        }catch(e){ container.innerHTML = '<div class="dash-empty">โหลดข้อมูลไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; return; }

        if(!data.length){ container.innerHTML = '<div class="dash-empty">ยังไม่มีข้อมูล Findings</div>'; return; }

        // Safety KPI (hse_kpi) + Safe Working Days — optional: skip quietly if the tables haven't been created yet
        let kpiCategories = [], hseSettings = null, kpiSectionsHtml = '';
        try{
          [kpiCategories, hseSettings] = await Promise.all([fetchSafetyKpiCategories(), fetchSafetyHseSettings()]);
        }catch(e){ kpiCategories = []; hseSettings = null; }
        if(kpiCategories.length){
          const pyramidStart = hseSettings ? hseSettings.start_date : null;
          const cutoff = pyramidStart || '0000-01-01';
          const nearMissCount = data.filter(f => f.finding_type === 'Near Miss' && f.finding_date >= cutoff).length;
          const unsafeFindingCount = data.filter(f => f.finding_date >= cutoff && f.category !== 'ชื่นชม').length; // ทุก Safety Finding ที่บันทึกไว้ (สะสม) ไม่รวมหมวด "ชื่นชม"
          const pyramidCounts = {
            lti: kpiTotal(findKpiByName(kpiCategories, 'Loss Time Injury (LTI)')),
            mti: kpiTotal(findKpiByName(kpiCategories, 'Medical Treatment Injury (MTI)')),
            propertyDamage: kpiTotal(findKpiByName(kpiCategories, 'Property damage')),
            nearMiss: nearMissCount,
            unsafeFinding: unsafeFindingCount,
          };
          const ltiWeekCount = Number(findKpiByName(kpiCategories, 'Loss Time Injury (LTI)').week_actual) || 0;
          kpiSectionsHtml = `
            <div class="dash-section">
              <h3>Incident Performance Pyramid</h3>
              ${renderIncidentPyramidHtml(pyramidCounts, pyramidStart)}
            </div>
            <div class="dash-section">
              <h3>Reportable KPI (Zero Target)</h3>
              ${renderKpiTableHtml(kpiCategories)}
            </div>
            <div class="dash-section">
              <h3>SHE KPI · Reportable (Zero Target)</h3>
              <div class="dash-note" style="margin-bottom:10px;">ผลจริงสะสม (Previous + This Week)</div>
              ${renderSheIconRowHtml(kpiCategories)}
            </div>
            <div class="dash-section">
              ${renderSafeDayCardHtml(hseSettings, ltiWeekCount)}
            </div>`;
        }

        const today = todayISO();
        // "ชื่นชม" (recognition) is a separate category, not a finding that needs to be tracked/closed —
        // exclude it from the OPEN/IN PROGRESS/OVERDUE/CLOSED KPI cards and closure-rate stats below,
        // and show its own total count in a dedicated card instead
        const recognitionTotal = data.filter(f => f.category === 'ชื่นชม').length;
        const dataExclRecognition = data.filter(f => f.category !== 'ชื่นชม');
        const total = dataExclRecognition.length;
        const open = dataExclRecognition.filter(f=>f.status==='Open').length;
        const inProgress = dataExclRecognition.filter(f=>f.status==='In Progress').length;
        const closed = dataExclRecognition.filter(f=>f.status==='Closed').length;
        const overdue = dataExclRecognition.filter(f=>f.due_date && f.due_date < today && f.status !== 'Closed').length;
        const closureRate = total ? Math.round(closed/total*100) : 0;
        const closedWithDates = dataExclRecognition.filter(f=>f.status==='Closed' && f.finding_date && f.date_closed);
        let avgDaysToClose = 'insufficient data';
        if(closedWithDates.length){
          const totalDays = closedWithDates.reduce((s,f)=>{
            const d1 = new Date(f.finding_date), d2 = new Date(f.date_closed);
            return s + Math.max(0, Math.round((d2-d1)/86400000));
          }, 0);
          avgDaysToClose = (totalDays/closedWithDates.length).toFixed(1) + ' วัน';
        }

        // group by month (ไม่รวมหมวด "ชื่นชม")
        const byMonth = {};
        dataExclRecognition.forEach(f=>{ if(f.finding_date){ const m = f.finding_date.slice(0,7); byMonth[m] = (byMonth[m]||0)+1; } });
        const months = Object.keys(byMonth).sort();

        // group by severity / category / location
        function groupBy(key){
          const g = {};
          data.forEach(f=>{ const v = f[key] || 'ไม่ระบุ'; g[v] = (g[v]||0)+1; });
          return g;
        }
        const bySeverity = groupBy('severity');
        const byCategory = groupBy('category');
        const byLocation = groupBy('location');
        const byStatusEff = { Open:open, 'In Progress':inProgress, Overdue:overdue, Closed:closed };

        // category order follows the original option order defined on the Findings form (not sorted by count)
        // "ชื่นชม" (recognition) is shown as its own weekly list below, not mixed into this chart
        const categoryField = MODULES.find(m=>m.id==='findings').fields.find(fl=>fl.key==='category');
        const categoryOrder = (categoryField ? categoryField.options : []).filter(c => c !== 'ชื่นชม');
        const catKnownOrdered = categoryOrder.filter(c => byCategory[c] != null);
        const catExtra = Object.keys(byCategory).filter(c => !categoryOrder.includes(c) && c !== 'ชื่นชม');
        const catOrdered = catKnownOrdered.concat(catExtra).map(c => [c, byCategory[c]]);


        // findings per week, week starts every Monday (ไม่รวมหมวด "ชื่นชม" — แยกไปกราฟ ชื่นชม ต่อสัปดาห์ ด้านล่าง)
        const byWeek = {};
        dataExclRecognition.forEach(f=>{ if(f.finding_date){ const w = mondayOfWeek(f.finding_date); byWeek[w] = (byWeek[w]||0)+1; } });
        const weeks = Object.keys(byWeek).sort();

        // "ชื่นชม" per week, same Monday cutoff — shown in its own trend chart
        const byWeekRecognition = {};
        data.forEach(f=>{ if(f.category === 'ชื่นชม' && f.finding_date){ const w = mondayOfWeek(f.finding_date); byWeekRecognition[w] = (byWeekRecognition[w]||0)+1; } });
        const weeksRecognition = Object.keys(byWeekRecognition).sort();

        // findings from yesterday and today, with photos and details
        const yesterday = addDays(today, -1);
        const recentFindings = data
          .filter(f => f.finding_date === today || f.finding_date === yesterday)
          .sort((a,b)=> (b.finding_date||'').localeCompare(a.finding_date||''));


        // all findings not yet Closed (Open / In Progress / Overdue), overdue first, then earliest due_date, then newest first
        const notClosedFindings = data
          .filter(f => f.status !== 'Closed')
          .sort((a,b)=>{
            const aOverdue = a.due_date && a.due_date < today;
            const bOverdue = b.due_date && b.due_date < today;
            if(aOverdue !== bOverdue) return aOverdue ? -1 : 1;
            if(a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
            if(a.due_date && !b.due_date) return -1;
            if(!a.due_date && b.due_date) return 1;
            return (b.finding_date||'').localeCompare(a.finding_date||'');
          });

        container.innerHTML = `
          <div class="dash-note">คำนวณจากข้อมูล Findings ทั้งหมด ${total} รายการ ณ เวลาที่โหลดหน้านี้ · Overdue = due_date ผ่านวันนี้และสถานะยังไม่ Closed</div>
          ${kpiSectionsHtml}
          <div class="dash-section">
            <h3>Findings เมื่อวานนี้ &amp; วันนี้ (${escapeHtml(yesterday)} – ${escapeHtml(today)})</h3>
            <div id="recentFindingsList">${recentFindings.length ? '' : '<div class="dash-empty" style="padding:20px;">ไม่มี Findings ในช่วงเมื่อวานนี้และวันนี้</div>'}</div>
          </div>
          <div class="dash-section">
            <h3>Findings ที่ยังไม่ Closed ทั้งหมด (${notClosedFindings.length} รายการ)</h3>
            <div id="notClosedList">${notClosedFindings.length ? '' : '<div class="dash-empty" style="padding:20px;">ไม่มี Findings ที่ยังไม่ Closed</div>'}</div>
          </div>
          <div class="dash-kpi-row">
            <div class="dash-kpi"><div class="v" style="color:#B45309;">${open}</div><div class="l">OPEN</div></div>
            <div class="dash-kpi"><div class="v" style="color:var(--progress);">${inProgress}</div><div class="l">IN PROGRESS</div></div>
            <div class="dash-kpi"><div class="v" style="color:var(--danger);">${overdue}</div><div class="l">OVERDUE</div><div class="f">due_date &lt; today, not closed</div></div>
            <div class="dash-kpi"><div class="v" style="color:var(--closed);">${closed}</div><div class="l">CLOSED</div></div>
          </div>
          <div class="dash-kpi-row">
            <div class="dash-kpi"><div class="v">${total}</div><div class="l">Total Findings</div><div class="f">ไม่รวมหมวด "ชื่นชม"</div></div>
            <div class="dash-kpi"><div class="v">${closureRate}%</div><div class="l">Closure Rate</div><div class="f">closed ÷ total</div></div>
            <div class="dash-kpi"><div class="v">${avgDaysToClose}</div><div class="l">Avg. Days to Close</div><div class="f">avg(date_closed − finding_date)</div></div>
            <div class="dash-kpi"><div class="v" style="color:#DB2777;">${recognitionTotal}</div><div class="l">🎉 ชื่นชม (ทั้งหมด)</div></div>
          </div>
          <div class="dash-section"><h3>แนวโน้มจำนวน Findings ต่อเดือน</h3><div class="chart-wrap"><canvas id="chartSafetyMonth"></canvas></div></div>
          <div class="dash-section"><h3>แนวโน้มจำนวน Findings ต่อสัปดาห์ (ตัดรอบทุกวันจันทร์)</h3><div class="chart-wrap"><canvas id="chartSafetyWeek"></canvas></div></div>
          <div class="dash-section"><h3>🎉 แนวโน้มจำนวน ชื่นชม ต่อสัปดาห์ (ตัดรอบทุกวันจันทร์)</h3><div class="chart-wrap"><canvas id="chartRecognitionWeek"></canvas></div></div>
          <div class="dash-section"><h3>สถานะ (Status)</h3><div class="chart-wrap"><canvas id="chartSafetyStatus"></canvas></div></div>
          <div class="dash-section"><h3>ระดับความรุนแรง (Severity)</h3><div class="chart-wrap"><canvas id="chartSafetySeverity"></canvas></div></div>
          <div class="dash-section"><h3>หมวดหมู่ (Category)</h3><div class="chart-wrap"><canvas id="chartSafetyCategory"></canvas></div></div>
          <div class="dash-section"><h3>พื้นที่ (Location)</h3><div class="chart-wrap"><canvas id="chartSafetyLocation"></canvas></div></div>
        `;

        destroyChart('sm'); destroyChart('sw'); destroyChart('rw'); destroyChart('ss'); destroyChart('sv'); destroyChart('sc'); destroyChart('sl');
        chartInstances.sm = new Chart($('#chartSafetyMonth'), { type:'bar', data:{ labels: months, datasets:[{ label:'Findings', data: months.map(m=>byMonth[m]), backgroundColor:'#0EA394' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} } });
        chartInstances.sw = new Chart($('#chartSafetyWeek'), { type:'bar', data:{ labels: weeks.map(weekLabel), datasets:[{ label:'Findings', data: weeks.map(w=>byWeek[w]), backgroundColor:'#8B5CF6' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} } });
        chartInstances.rw = new Chart($('#chartRecognitionWeek'), { type:'bar', data:{ labels: weeksRecognition.map(weekLabel), datasets:[{ label:'ชื่นชม', data: weeksRecognition.map(w=>byWeekRecognition[w]), backgroundColor:'#DB2777' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} } });
        chartInstances.ss = new Chart($('#chartSafetyStatus'), {
          type:'doughnut',
          data:{ labels:Object.keys(byStatusEff), datasets:[{ data:Object.values(byStatusEff), backgroundColor:['#F0A93B','#2563EB','#DC2626','#16A34A'] }] },
          options:{
            responsive:true, maintainAspectRatio:false,
            plugins:{
              legend:{ position:'bottom' },
              tooltip:{ callbacks:{ label:(ctx)=>{ const t = ctx.dataset.data.reduce((a,b)=>a+b,0); const pct = t ? Math.round(ctx.parsed/t*100) : 0; return ctx.label + ': ' + ctx.parsed + ' (' + pct + '%)'; } } },
              datalabels:{ color:'#fff', font:{ weight:'700', size:12 }, formatter:(value, ctx)=>{ const t = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0); return t ? Math.round(value/t*100) + '%' : '0%'; } }
            }
          },
          plugins: (typeof ChartDataLabels !== 'undefined') ? [ChartDataLabels] : []
        });
        const sevOrder = ['Low','Medium','High','Critical','ไม่ระบุ'].filter(k=>bySeverity[k]!=null);
        $('#chartSafetySeverity').parentElement.style.height = Math.max(220, sevOrder.length * 34 + 40) + 'px';
        chartInstances.sv = new Chart($('#chartSafetySeverity'), { type:'bar', data:{ labels:sevOrder, datasets:[{ data:sevOrder.map(k=>bySeverity[k]), backgroundColor:['#16A34A','#F0A93B','#F97316','#DC2626','#9AA3B0'] }] }, options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ autoSkip:false } } } } });
        $('#chartSafetyCategory').parentElement.style.height = Math.max(220, catOrdered.length * 32 + 40) + 'px';
        chartInstances.sc = new Chart($('#chartSafetyCategory'), { type:'bar', data:{ labels:catOrdered.map(x=>x[0]), datasets:[{ data:catOrdered.map(x=>x[1]), backgroundColor:'#2563EB' }] }, options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ autoSkip:false } } } } });
        const locSorted = Object.entries(byLocation).sort((a,b)=>b[1]-a[1]);
        $('#chartSafetyLocation').parentElement.style.height = Math.max(220, locSorted.length * 34 + 40) + 'px';
        chartInstances.sl = new Chart($('#chartSafetyLocation'), { type:'bar', data:{ labels:locSorted.map(x=>x[0]), datasets:[{ data:locSorted.map(x=>x[1]), backgroundColor:'#F0A93B' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{ ticks:{ autoSkip:false } } } } });

        renderRecentFindingsSafety(recentFindings);
        renderNotClosedFindings(notClosedFindings);
      }
    },
    {
      id:'dash_safety_weekly', label:'Dashboard Safety Weekly', icon:'🗓️', table:'findings',
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        let data;
        try{
          const res = await fetch(SUPABASE_URL + '/rest/v1/findings?select=*', { headers: HEADERS });
          if(!res.ok) throw new Error('fetch failed: ' + res.status);
          data = await res.json();
        }catch(e){ container.innerHTML = '<div class="dash-empty">โหลดข้อมูลไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; return; }

        if(!data.length){ container.innerHTML = '<div class="dash-empty">ยังไม่มีข้อมูล Findings</div>'; return; }

        const today = todayISO();
        const categoryField = MODULES.find(m=>m.id==='findings').fields.find(fl=>fl.key==='category');
        const categoryOrder = (categoryField ? categoryField.options : []).filter(c => c !== 'ชื่นชม');

        // เลือกสัปดาห์ที่จะดูข้อมูล — default = สัปดาห์ที่ผ่านมา (สัปดาห์ล่าสุดที่จบรอบแล้ว)
        // ทุก Card ในหน้านี้ (Findings ในสัปดาห์ / ที่ยังไม่ Closed / KPI OPEN-IN PROGRESS-OVERDUE-CLOSED / ชื่นชม / หมวดหมู่) ผูกกับสัปดาห์ที่เลือกทั้งหมด
        const safetyCurrentWeekEnd = mondayOfWeek(today);
        const safetyDefaultWeekEnd = addDays(safetyCurrentWeekEnd, -7);
        const safetyWeekOptionEnds = [];
        for(let i=0;i<13;i++){ safetyWeekOptionEnds.push(addDays(safetyCurrentWeekEnd, -7*i)); }
        function computeSafetyWeekScoped(weekEndIso){
          const weekStartIso = addDays(weekEndIso, -6);
          const weekData = data.filter(f => f.finding_date && f.finding_date >= weekStartIso && f.finding_date <= weekEndIso);
          const weekDataExclRecognition = weekData.filter(f => f.category !== 'ชื่นชม');

          const catMap = {};
          weekDataExclRecognition.forEach(f=>{
            const v = f.category || 'ไม่ระบุ';
            catMap[v] = (catMap[v]||0) + 1;
          });
          const knownOrdered = categoryOrder.filter(c => catMap[c] != null);
          const extra = Object.keys(catMap).filter(c => !categoryOrder.includes(c));
          const catOrdered = knownOrdered.concat(extra).map(c => [c, catMap[c]]);

          const recognitionList = weekData
            .filter(f => f.category === 'ชื่นชม')
            .sort((a,b)=> (b.finding_date||'').localeCompare(a.finding_date||''));
          const recognitionTotalWeek = recognitionList.length;

          const totalW = weekDataExclRecognition.length;
          const openW = weekDataExclRecognition.filter(f=>f.status==='Open').length;
          const inProgressW = weekDataExclRecognition.filter(f=>f.status==='In Progress').length;
          const closedW = weekDataExclRecognition.filter(f=>f.status==='Closed').length;
          const overdueW = weekDataExclRecognition.filter(f=>f.due_date && f.due_date < today && f.status !== 'Closed').length;
          const closureRateW = totalW ? Math.round(closedW/totalW*100) : 0;
          const closedWithDatesW = weekDataExclRecognition.filter(f=>f.status==='Closed' && f.finding_date && f.date_closed);
          let avgDaysToCloseW = 'insufficient data';
          if(closedWithDatesW.length){
            const totalDaysW = closedWithDatesW.reduce((s,f)=>{
              const d1 = new Date(f.finding_date), d2 = new Date(f.date_closed);
              return s + Math.max(0, Math.round((d2-d1)/86400000));
            }, 0);
            avgDaysToCloseW = (totalDaysW/closedWithDatesW.length).toFixed(1) + ' วัน';
          }

          const notClosedListW = weekData
            .filter(f => f.status !== 'Closed')
            .sort((a,b)=>{
              const aOverdue = a.due_date && a.due_date < today;
              const bOverdue = b.due_date && b.due_date < today;
              if(aOverdue !== bOverdue) return aOverdue ? -1 : 1;
              if(a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
              if(a.due_date && !b.due_date) return -1;
              if(!a.due_date && b.due_date) return 1;
              return (b.finding_date||'').localeCompare(a.finding_date||'');
            });
          const recentListW = weekData.slice().sort((a,b)=> (b.finding_date||'').localeCompare(a.finding_date||''));

          return {
            weekStartIso, weekEndIso, catOrdered, recognitionList, recognitionTotalWeek,
            totalW, openW, inProgressW, closedW, overdueW, closureRateW, avgDaysToCloseW,
            notClosedListW, recentListW,
          };
        }

        container.innerHTML = `
          <div class="dash-section">
            <div class="dash-weekpicker-row">
              <label for="safetyWeekPicker">เลือกสัปดาห์ที่จะดูข้อมูล (ทุก Card ในหน้านี้ผูกกับสัปดาห์นี้ทั้งหมด)</label>
              <select id="safetyWeekPicker" class="kpi-input">
                ${safetyWeekOptionEnds.map((w,i)=>`<option value="${w}" ${w===safetyDefaultWeekEnd?'selected':''}>${weekLabel(w)}${i===0?' (สัปดาห์นี้ ยังไม่จบรอบ)':''}${w===safetyDefaultWeekEnd?' (สัปดาห์ที่ผ่านมา)':''}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="dash-section">
            <h3 id="safetyRecentWeekTitle">Findings ในสัปดาห์ที่เลือก</h3>
            <div id="recentFindingsListWeekly"></div>
          </div>
          <div class="dash-section">
            <h3 id="safetyNotClosedWeekTitle">Findings ที่ยังไม่ Closed ในสัปดาห์ที่เลือก</h3>
            <div id="notClosedListWeekly"></div>
          </div>
          <div class="dash-kpi-row">
            <div class="dash-kpi"><div class="v" id="safetyOpenW" style="color:#B45309;">0</div><div class="l">OPEN</div></div>
            <div class="dash-kpi"><div class="v" id="safetyInProgressW" style="color:var(--progress);">0</div><div class="l">IN PROGRESS</div></div>
            <div class="dash-kpi"><div class="v" id="safetyOverdueW" style="color:var(--danger);">0</div><div class="l">OVERDUE</div><div class="f">due_date &lt; today, not closed</div></div>
            <div class="dash-kpi"><div class="v" id="safetyClosedW" style="color:var(--closed);">0</div><div class="l">CLOSED</div></div>
          </div>
          <div class="dash-kpi-row">
            <div class="dash-kpi"><div class="v" id="safetyTotalW">0</div><div class="l">Total Findings</div><div class="f">ไม่รวมหมวด "ชื่นชม"</div></div>
            <div class="dash-kpi"><div class="v" id="safetyClosureRateW">0%</div><div class="l">Closure Rate</div><div class="f">closed ÷ total</div></div>
            <div class="dash-kpi"><div class="v" id="safetyAvgDaysW">-</div><div class="l">Avg. Days to Close</div><div class="f">avg(date_closed − finding_date)</div></div>
            <div class="dash-kpi"><div class="v" id="safetyRecognitionCountW" style="color:#DB2777;">0</div><div class="l">🎉 ชื่นชม (สัปดาห์ที่เลือก)</div></div>
          </div>
          <div class="dash-section">
            <h3 id="safetyRecognitionWeekTitle">🎉 ชื่นชม (ตัดรอบทุกวันจันทร์)</h3>
            <div id="recognitionList"></div>
          </div>
          <div class="dash-section">
            <h3 id="safetyCategoryWeekTitle">หมวดหมู่ (Category) ประจำสัปดาห์ (ตัดรอบทุกวันจันทร์)</h3>
            <div id="categoryWeekBody"></div>
          </div>
        `;

        function renderSafetyWeeklySections(weekEndIso){
          const {
            weekStartIso, catOrdered: catOrderedW, recognitionList, recognitionTotalWeek,
            totalW, openW, inProgressW, closedW, overdueW, closureRateW, avgDaysToCloseW,
            notClosedListW, recentListW,
          } = computeSafetyWeekScoped(weekEndIso);
          const weekRangeText = weekStartIso + ' – ' + weekEndIso;

          $('#safetyRecentWeekTitle').textContent = 'Findings ในสัปดาห์ที่เลือก (' + weekRangeText + ')';
          const recentContainer = $('#recentFindingsListWeekly');
          if(!recentListW.length){
            recentContainer.innerHTML = '<div class="dash-empty" style="padding:20px;">ไม่มี Findings ในสัปดาห์นี้</div>';
          }else{
            renderRecentFindingsSafety(recentListW, 'recentFindingsListWeekly');
          }

          $('#safetyNotClosedWeekTitle').textContent = 'Findings ที่ยังไม่ Closed ในสัปดาห์ที่เลือก (' + notClosedListW.length + ' รายการ)';
          const notClosedContainer = $('#notClosedListWeekly');
          if(!notClosedListW.length){
            notClosedContainer.innerHTML = '<div class="dash-empty" style="padding:20px;">ไม่มี Findings ที่ยังไม่ Closed ในสัปดาห์นี้</div>';
          }else{
            renderNotClosedFindings(notClosedListW, 'notClosedListWeekly');
          }

          $('#safetyOpenW').textContent = openW;
          $('#safetyInProgressW').textContent = inProgressW;
          $('#safetyOverdueW').textContent = overdueW;
          $('#safetyClosedW').textContent = closedW;
          $('#safetyTotalW').textContent = totalW;
          $('#safetyClosureRateW').textContent = closureRateW + '%';
          $('#safetyAvgDaysW').textContent = avgDaysToCloseW;
          $('#safetyRecognitionCountW').textContent = recognitionTotalWeek;

          $('#safetyRecognitionWeekTitle').textContent = '🎉 ชื่นชม (' + weekStartIso + ' – ' + weekEndIso + ', ตัดรอบทุกวันจันทร์)';
          const recContainer = $('#recognitionList');
          if(!recognitionList.length){
            recContainer.innerHTML = '<div class="dash-empty" style="padding:20px;">ยังไม่มีรายการชื่นชมในสัปดาห์นี้</div>';
          }else{
            recContainer.innerHTML = recognitionList.map(f=>{
              const urls = Array.isArray(f.photo_urls) ? f.photo_urls : [];
              const coverHtml = urls.length ? `<img src="${urls[0]}" loading="lazy">` : `<div class="ph-empty">🎉</div>`;
              return `
              <div class="finding sev-none" data-recognition-id="${f.id}">
                <div class="stripe" style="background:#F0A93B;"></div>
                <div class="cover">${coverHtml}</div>
                <div class="body2">
                  <div class="f-top"><span class="f-num">${escapeHtml(f.finding_number||'')}</span><span class="f-date">${escapeHtml(f.finding_date||'')}</span></div>
                  <div class="f-desc">${escapeHtml(f.description||'(ไม่มีรายละเอียด)')}</div>
                  <div class="f-meta">
                    <span class="pill loc">${escapeHtml(f.location||'-')}</span>
                    ${urls.length ? `<span class="pill photos">📷 ${urls.length}</span>` : ''}
                  </div>
                </div>
              </div>`;
            }).join('');
            recContainer.querySelectorAll('.finding').forEach(el => {
              el.addEventListener('click', ()=>{
                const f = recognitionList.find(x => String(x.id) === el.dataset.recognitionId);
                if(f) openFindingDetailStatic(f);
              });
            });
          }

          $('#safetyCategoryWeekTitle').textContent = 'หมวดหมู่ (Category) (' + weekStartIso + ' – ' + weekEndIso + ', ตัดรอบทุกวันจันทร์)';
          const catBody = $('#categoryWeekBody');
          destroyChart('scw');
          if(catOrderedW.length){
            catBody.innerHTML = '<div class="chart-wrap" id="categoryWeekChartWrap"><canvas id="chartSafetyCategoryWeek"></canvas></div>';
            $('#categoryWeekChartWrap').style.height = Math.max(220, catOrderedW.length * 32 + 40) + 'px';
            chartInstances.scw = new Chart($('#chartSafetyCategoryWeek'), { type:'bar', data:{ labels:catOrderedW.map(x=>x[0]), datasets:[{ data:catOrderedW.map(x=>x[1]), backgroundColor:'#0891B2' }] }, options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ autoSkip:false } } } } });
          }else{
            catBody.innerHTML = '<div class="dash-empty" style="padding:20px;">ไม่มี Findings ในสัปดาห์นี้</div>';
          }
        }
        renderSafetyWeeklySections(safetyDefaultWeekEnd);
        $('#safetyWeekPicker').addEventListener('change', (e)=> renderSafetyWeeklySections(e.target.value));
      }
    },
    {
      id:'dash_environment', label:'Dashboard Environment', icon:'📊', table:'environment_reports',
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        let data;
        try{
          const res = await fetch(SUPABASE_URL + '/rest/v1/environment_reports?select=*&order=report_date.asc', { headers: HEADERS });
          if(!res.ok) throw new Error('fetch failed: ' + res.status);
          data = await res.json();
        }catch(e){ container.innerHTML = '<div class="dash-empty">โหลดข้อมูลไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; return; }

        if(!data.length){ container.innerHTML = '<div class="dash-empty">ยังไม่มีข้อมูล Environment Record</div>'; return; }

        const today = todayISO();
        const total = data.length;
        const eDates = data.map(r=>r.report_date).filter(Boolean).sort();
        const eDateRangeText = eDates.length ? (eDates[0] + ' → ' + eDates[eDates.length-1]) : 'insufficient data';

        // accumulate (all-time) total per category, and grand total
        const totalsByCat = {};
        ENV_CATEGORIES.forEach(c => { totalsByCat[c.key] = data.reduce((s,r)=> s + (Number(r[c.key])||0), 0); });
        const grandTotal = ENV_CATEGORIES.reduce((s,c)=> s + totalsByCat[c.key], 0);

        // เลือกสัปดาห์ที่จะดูข้อมูล (ตัดรอบทุกวันจันทร์) — default = สัปดาห์ที่ผ่านมา (สัปดาห์ล่าสุดที่จบรอบแล้ว)
        const envCurrentWeekEnd = mondayOfWeek(today);
        const envDefaultWeekEnd = addDays(envCurrentWeekEnd, -7);
        const envWeekOptionEnds = [];
        for(let i=0;i<13;i++){ envWeekOptionEnds.push(addDays(envCurrentWeekEnd, -7*i)); }
        function computeEnvWeekScoped(weekEndIso){
          const weekStartIso = addDays(weekEndIso, -6);
          const weekRows = data.filter(r => r.report_date >= weekStartIso && r.report_date <= weekEndIso);
          const weekTotalsByCat = {};
          ENV_CATEGORIES.forEach(c => { weekTotalsByCat[c.key] = weekRows.reduce((s,r)=> s + (Number(r[c.key])||0), 0); });
          const weekGrandTotal = ENV_CATEGORIES.reduce((s,c)=> s + weekTotalsByCat[c.key], 0);
          return { weekStartIso, weekEndIso, weekTotalsByCat, weekGrandTotal };
        }
        const { weekStartIso: weekStart, weekEndIso: weekEnd, weekTotalsByCat, weekGrandTotal } = computeEnvWeekScoped(envDefaultWeekEnd);

        // daily stacked chart — every recorded day
        const dayLabels = data.map(r=>r.report_date || '-');

        // weekly stacked chart — grouped by the Monday-cutoff week, summed per category
        const byWeekCat = {};
        data.forEach(r=>{
          if(!r.report_date) return;
          const w = mondayOfWeek(r.report_date);
          byWeekCat[w] = byWeekCat[w] || {};
          ENV_CATEGORIES.forEach(c => { byWeekCat[w][c.key] = (byWeekCat[w][c.key]||0) + (Number(r[c.key])||0); });
        });
        const weekKeys = Object.keys(byWeekCat).sort();

        function envRowsHtml(weekTotalsByCatArg){
          return ENV_CATEGORIES.map(c => `
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid var(--line);font-weight:600;color:var(--charcoal);white-space:nowrap;">${escapeHtml(c.label)}</td>
            <td style="text-align:right;padding:8px 10px;border-bottom:1px solid var(--line);">${Math.round(weekTotalsByCatArg[c.key]*100)/100}</td>
            <td style="text-align:right;padding:8px 10px;border-bottom:1px solid var(--line);font-weight:700;color:var(--charcoal);">${Math.round(totalsByCat[c.key]*100)/100}</td>
          </tr>`).join('');
        }
        const rowsHtml = envRowsHtml(weekTotalsByCat);

        container.innerHTML = `
          <div class="dash-note">คำนวณจากรายงานทั้งหมด ${total} รายการ ช่วง ${escapeHtml(eDateRangeText)}</div>
          <div class="dash-kpi-row">
            <div class="dash-kpi"><div class="v">${total}</div><div class="l">Total Reports</div></div>
            <div class="dash-kpi"><div class="v">${Math.round(grandTotal*100)/100}</div><div class="l">ขยะรวมทั้งหมด (Kg)</div></div>
            <div class="dash-kpi"><div class="v" id="envWeekGrandTotal">${Math.round(weekGrandTotal*100)/100}</div><div class="l">ขยะรวมสัปดาห์ที่เลือก (Kg)</div><div class="f" id="envWeekRangeLabel">${escapeHtml(weekStart)} – ${escapeHtml(weekEnd)}</div></div>
            <div class="dash-kpi"><div class="v" style="font-size:14px;">${escapeHtml(eDateRangeText)}</div><div class="l">Date Range</div></div>
          </div>
          <div class="dash-section">
            <div class="dash-weekpicker-row" style="margin-bottom:12px;">
              <label for="envWeekPicker">เลือกสัปดาห์ที่จะดูข้อมูล</label>
              <select id="envWeekPicker" class="kpi-input">
                ${envWeekOptionEnds.map((w,i)=>`<option value="${w}" ${w===envDefaultWeekEnd?'selected':''}>${weekLabel(w)}${i===0?' (สัปดาห์นี้ ยังไม่จบรอบ)':''}${w===envDefaultWeekEnd?' (สัปดาห์ที่ผ่านมา)':''}</option>`).join('')}
              </select>
            </div>
            <h3>สรุปตามประเภทขยะ — สัปดาห์ที่เลือก &amp; สะสมทั้งหมด</h3>
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:460px;">
                <thead>
                  <tr style="background:#F7F9FB;">
                    <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">ประเภทขยะ</th>
                    <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">สัปดาห์ที่เลือก (Kg)</th>
                    <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;color:var(--charcoal);">สะสมทั้งหมด (Kg)</th>
                  </tr>
                </thead>
                <tbody id="envWeekTableBody">${rowsHtml}</tbody>
              </table>
            </div>
          </div>
          <div class="dash-section">
            <div class="dash-weekpicker-row" style="margin-bottom:12px;">
              <label>ช่วงเวลาที่ต้องการดูกราฟ</label>
              <input type="date" id="envChartRangeStart" class="kpi-input" style="max-width:150px;" min="${escapeHtml(eDates[0]||'')}" max="${escapeHtml(eDates[eDates.length-1]||'')}" value="${escapeHtml(eDates[0]||'')}">
              <span style="color:var(--muted);">ถึง</span>
              <input type="date" id="envChartRangeEnd" class="kpi-input" style="max-width:150px;" min="${escapeHtml(eDates[0]||'')}" max="${escapeHtml(eDates[eDates.length-1]||'')}" value="${escapeHtml(eDates[eDates.length-1]||'')}">
              <button type="button" class="chip" id="envChartRangeReset">ทั้งหมด</button>
            </div>
          </div>
          <div class="dash-section"><h3>ปริมาณขยะต่อวัน แยกตามประเภท (Kg)</h3><div class="chart-wrap"><canvas id="chartEnvDaily"></canvas></div></div>
          <div class="dash-section"><h3>ปริมาณขยะต่อสัปดาห์ แยกตามประเภท (Kg, ตัดรอบทุกวันจันทร์)</h3><div class="chart-wrap"><canvas id="chartEnvWeek"></canvas></div></div>
        `;

        function renderEnvCharts(startIso, endIso){
          const scopedData = data.filter(r => r.report_date && r.report_date >= startIso && r.report_date <= endIso);
          const scopedDayLabels = scopedData.map(r=>r.report_date || '-');
          const scopedByWeekCat = {};
          scopedData.forEach(r=>{
            if(!r.report_date) return;
            const w = mondayOfWeek(r.report_date);
            scopedByWeekCat[w] = scopedByWeekCat[w] || {};
            ENV_CATEGORIES.forEach(c => { scopedByWeekCat[w][c.key] = (scopedByWeekCat[w][c.key]||0) + (Number(r[c.key])||0); });
          });
          const scopedWeekKeys = Object.keys(scopedByWeekCat).sort();
          destroyChart('ed'); destroyChart('ew');
          chartInstances.ed = new Chart($('#chartEnvDaily'), {
            type:'bar',
            data:{ labels: scopedDayLabels, datasets: ENV_CATEGORIES.map(c => ({ label:c.label, data: scopedData.map(r=>Number(r[c.key])||0), backgroundColor:c.color })) },
            options:{ responsive:true, maintainAspectRatio:false, scales:{ x:{ stacked:true }, y:{ stacked:true } } }
          });
          chartInstances.ew = new Chart($('#chartEnvWeek'), {
            type:'bar',
            data:{ labels: scopedWeekKeys.map(weekLabel), datasets: ENV_CATEGORIES.map(c => ({ label:c.label, data: scopedWeekKeys.map(w=>Math.round((scopedByWeekCat[w][c.key]||0)*100)/100), backgroundColor:c.color })) },
            options:{ responsive:true, maintainAspectRatio:false, scales:{ x:{ stacked:true }, y:{ stacked:true } } }
          });
        }
        renderEnvCharts(eDates[0]||'', eDates[eDates.length-1]||'');

        function applyEnvRangePicker(){
          const s = $('#envChartRangeStart').value, e = $('#envChartRangeEnd').value;
          if(!s || !e || s > e){ showToast('ช่วงวันที่ไม่ถูกต้อง', true); return; }
          renderEnvCharts(s, e);
        }
        $('#envChartRangeStart').addEventListener('change', applyEnvRangePicker);
        $('#envChartRangeEnd').addEventListener('change', applyEnvRangePicker);
        $('#envChartRangeReset').addEventListener('click', ()=>{
          $('#envChartRangeStart').value = eDates[0]||'';
          $('#envChartRangeEnd').value = eDates[eDates.length-1]||'';
          renderEnvCharts(eDates[0]||'', eDates[eDates.length-1]||'');
        });

        $('#envWeekPicker').addEventListener('change', (e)=>{
          const scoped = computeEnvWeekScoped(e.target.value);
          $('#envWeekGrandTotal').textContent = Math.round(scoped.weekGrandTotal*100)/100;
          $('#envWeekRangeLabel').textContent = scoped.weekStartIso + ' – ' + scoped.weekEndIso;
          $('#envWeekTableBody').innerHTML = envRowsHtml(scoped.weekTotalsByCat);
        });
      }
    },
    {
      id:'dash_daily', label:'Dashboard Daily', icon:'📊', table:'daily_reports',
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        let data;
        try{
          const res = await fetch(SUPABASE_URL + '/rest/v1/daily_reports?select=*&order=report_date.asc', { headers: HEADERS });
          if(!res.ok) throw new Error('fetch failed: ' + res.status);
          data = await res.json();
        }catch(e){ container.innerHTML = '<div class="dash-empty">โหลดข้อมูลไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; return; }

        if(!data.length){ container.innerHTML = '<div class="dash-empty">ยังไม่มีข้อมูล Daily Report</div>'; return; }

        const total = data.length;
        const manpowerPerRow = data.map(r => sumPersonnel(r.repco_personnel) + sumPersonnel(r.state_personnel_site) + sumPersonnel(r.state_personnel_workshop));
        const equipmentPerRow = data.map(r => sumPersonnel(r.equipment));

        // เครื่องจักรแยกตามประเภทรถ (ตาม position ที่กรอกในแต่ละวัน) — สีไม่ซ้ำแม้มีหลายประเภท
        function colorForIndex(i){
          if(i < CHART_COLORS.length) return CHART_COLORS[i];
          const hue = (i * 47) % 360;
          return `hsl(${hue}, 65%, 55%)`;
        }
        const equipTypeSet = new Set();
        data.forEach(r=>{
          (Array.isArray(r.equipment) ? r.equipment : []).forEach(it=>{
            const name = (it.position || '').trim() || 'ไม่ระบุ';
            equipTypeSet.add(name);
          });
        });
        const equipTypes = Array.from(equipTypeSet);
        const equipByTypePerDay = data.map(r=>{
          const m = {};
          (Array.isArray(r.equipment) ? r.equipment : []).forEach(it=>{
            const name = (it.position || '').trim() || 'ไม่ระบุ';
            m[name] = (m[name]||0) + (parseInt(it.count,10)||0);
          });
          return m;
        });
        const avgManpower = (manpowerPerRow.reduce((a,b)=>a+b,0) / total).toFixed(1);
        const avgEquipment = (equipmentPerRow.reduce((a,b)=>a+b,0) / total).toFixed(1);
        const dates = data.map(r=>r.report_date).filter(Boolean).sort();
        const dateRangeText = dates.length ? (dates[0] + ' → ' + dates[dates.length-1]) : 'insufficient data';

        // สภาพอากาศ — นับรวมทั้ง 4 ช่วงเวลาของทุกวัน (ก่อนนี้นับแค่ 1 ค่าต่อวัน)
        const weatherCount = {};
        data.forEach(r=>{
          WEATHER_PERIODS.forEach(p=>{
            const w = r[p.key] || 'ไม่ระบุ';
            weatherCount[w] = (weatherCount[w]||0)+1;
          });
        });

        // นาฬิกาอากาศ — เลือกดูวันไหนก็ได้ default = รายงานล่าสุดที่มีข้อมูล
        const weatherDates = data.map(r=>r.report_date).filter(Boolean).sort();
        const weatherDefaultDate = weatherDates.length ? weatherDates[weatherDates.length-1] : null;
        function weatherClockData(reportDate){
          const row = data.find(r => r.report_date === reportDate) || {};
          return WEATHER_CLOCK_ORDER.map(p => ({ period: p.label, weather: row[p.key] || 'ไม่ระบุ' }));
        }

        const labels = data.map(r=>r.report_date || '-');
        const repcoSeries = data.map(r=>sumPersonnel(r.repco_personnel));
        const siteSeries = data.map(r=>sumPersonnel(r.state_personnel_site));
        const workshopSeries = data.map(r=>sumPersonnel(r.state_personnel_workshop));

        container.innerHTML = `
          <div class="dash-note">คำนวณจากรายงานประจำวันทั้งหมด ${total} รายการ ช่วง ${escapeHtml(dateRangeText)}</div>
          <div class="dash-kpi-row">
            <div class="dash-kpi"><div class="v">${total}</div><div class="l">Total Reports</div></div>
            <div class="dash-kpi"><div class="v">${avgManpower}</div><div class="l">Avg. Manpower / Day</div><div class="f">avg(REPCO+Site+Workshop)</div></div>
            <div class="dash-kpi"><div class="v">${avgEquipment}</div><div class="l">Avg. Equipment / Day</div><div class="f">avg(sum of equipment qty)</div></div>
            <div class="dash-kpi"><div class="v" style="font-size:14px;">${escapeHtml(dateRangeText)}</div><div class="l">Date Range</div></div>
          </div>
          <div class="dash-section"><h3>แนวโน้มกำลังคน (Manpower Trend) — แยกประเภท และคนทำงานรวมทั้งหมดต่อวัน</h3><div class="chart-wrap"><canvas id="chartDailyManpower"></canvas></div></div>
          <div class="dash-section"><h3>จำนวนเครื่องจักรต่อวัน</h3><div class="chart-wrap"><canvas id="chartDailyEquip"></canvas></div></div>
          <div class="dash-section"><h3>เครื่องจักรแยกตามประเภทรถ</h3><div class="chart-wrap" id="equipTypesChartWrap"><canvas id="chartDailyEquipTypes"></canvas></div></div>
          <div class="dash-section"><h3>สภาพอากาศ (สรุปทั้งหมด — นับรวม 4 ช่วงเวลา/วัน)</h3><div class="chart-wrap"><canvas id="chartDailyWeather"></canvas></div></div>
          <div class="dash-section">
            <div class="dash-weekpicker-row" style="margin-bottom:12px;">
              <label for="weatherClockDatePicker">🕐 นาฬิกาอากาศ — เลือกวันที่ต้องการดู</label>
              <select id="weatherClockDatePicker" class="kpi-input">
                ${weatherDates.slice().reverse().map(d=>`<option value="${d}" ${d===weatherDefaultDate?'selected':''}>${d}</option>`).join('')}
              </select>
            </div>
            <h3 style="margin-bottom:6px;">สภาพอากาศรายวัน แบ่งตามช่วงเวลา (คล้ายนาฬิกา)</h3>
            <div class="chart-wrap" style="max-width:340px;margin:0 auto;"><canvas id="chartWeatherClock"></canvas></div>
            <div class="dash-note" id="weatherClockLegend" style="margin-top:12px;"></div>
          </div>
        `;

        destroyChart('dm'); destroyChart('de'); destroyChart('det'); destroyChart('dw'); destroyChart('wc');
        chartInstances.dm = new Chart($('#chartDailyManpower'), {
          type:'bar',
          data:{ labels, datasets:[
            { label:'REPCO', data:repcoSeries, backgroundColor:'#0EA394', stack:'manpower' },
            { label:'State - Site', data:siteSeries, backgroundColor:'#2563EB', stack:'manpower' },
            { label:'State - Workshop', data:workshopSeries, backgroundColor:'#F0A93B', stack:'manpower' },
            { label:'รวมทั้งหมด (Total)', type:'line', data:manpowerPerRow, borderColor:'#DC2626', backgroundColor:'#DC2626', borderWidth:2.5, pointRadius:3, pointBackgroundColor:'#DC2626', tension:.25, fill:false, order:-1, stack:'total-line' },
          ]},
          options:{ responsive:true, maintainAspectRatio:false, scales:{ x:{ stacked:true }, y:{ stacked:true, ticks:{ precision:0 } } } }
        });
        chartInstances.de = new Chart($('#chartDailyEquip'), { type:'line', data:{ labels, datasets:[{ label:'Equipment qty', data:equipmentPerRow, borderColor:'#F0A93B', backgroundColor:'rgba(240,169,59,.15)', fill:true, tension:.25 }] }, options:{ responsive:true, maintainAspectRatio:false } });
        $('#equipTypesChartWrap').style.height = Math.max(240, 220 + Math.ceil(equipTypes.length/4)*22) + 'px';
        chartInstances.det = new Chart($('#chartDailyEquipTypes'), {
          type:'bar',
          data:{ labels, datasets: equipTypes.map((t,i) => ({ label:t, data: equipByTypePerDay.map(m=>m[t]||0), backgroundColor: colorForIndex(i) })) },
          options:{ responsive:true, maintainAspectRatio:false, scales:{ x:{ stacked:true }, y:{ stacked:true, ticks:{ precision:0 } } } }
        });
        const wLabels = Object.keys(weatherCount);
        chartInstances.dw = new Chart($('#chartDailyWeather'), { type:'doughnut', data:{ labels:wLabels, datasets:[{ data:wLabels.map(k=>weatherCount[k]), backgroundColor:wLabels.map(weatherColor) }] }, options:{ responsive:true, maintainAspectRatio:false } });

        function renderWeatherClock(reportDate){
          const slices = weatherClockData(reportDate);
          destroyChart('wc');
          chartInstances.wc = new Chart($('#chartWeatherClock'), {
            type:'pie',
            data:{ labels: slices.map(s=>s.period), datasets:[{ data:[1,1,1,1], backgroundColor: slices.map(s=>weatherColor(s.weather)), borderColor:'#fff', borderWidth:2 }] },
            options:{
              responsive:true, maintainAspectRatio:true,
              plugins:{
                legend:{ display:false },
                tooltip:{ callbacks:{ label:(ctx)=> slices[ctx.dataIndex].period + ': ' + slices[ctx.dataIndex].weather } },
                datalabels:{ color:'#1F2937', font:{ weight:'700', size:10 }, formatter:(v,ctx)=> slices[ctx.dataIndex].period }
              }
            },
            plugins: (typeof ChartDataLabels !== 'undefined') ? [ChartDataLabels] : []
          });
          $('#weatherClockLegend').innerHTML = slices.map(s=>`<span style="display:inline-flex;align-items:center;gap:5px;margin-right:14px;"><span style="width:10px;height:10px;border-radius:50%;background:${weatherColor(s.weather)};display:inline-block;"></span>${escapeHtml(s.period)}: ${escapeHtml(s.weather)}</span>`).join('');
        }
        if(weatherDefaultDate){
          renderWeatherClock(weatherDefaultDate);
          $('#weatherClockDatePicker').addEventListener('change', (e)=> renderWeatherClock(e.target.value));
        }
      }
    },
    {
      id:'dash_concrete', label:'Dashboard Concrete', icon:'📊', table:'concrete_reports',
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        let reportsData, summaryData, pourEntriesRaw;
        try{
          const [r1, r2, r3] = await Promise.all([
            fetch(SUPABASE_URL + '/rest/v1/concrete_reports?select=*&order=report_date.asc', { headers: HEADERS }),
            fetch(SUPABASE_URL + '/rest/v1/concrete_area_summary?select=*', { headers: HEADERS }),
            fetch(SUPABASE_URL + '/rest/v1/concrete_pour_entries?select=structure_item_id,floor,poured_today_m3', { headers: HEADERS }),
          ]);
          if(!r1.ok) throw new Error('fetch reports failed: ' + r1.status);
          if(!r2.ok) throw new Error('fetch area summary failed: ' + r2.status);
          if(!r3.ok) throw new Error('fetch pour entries failed: ' + r3.status);
          reportsData = await r1.json();
          summaryData = await r2.json();
          pourEntriesRaw = await r3.json();
        }catch(e){ container.innerHTML = '<div class="dash-empty">โหลดข้อมูลไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; return; }

        if(!reportsData.length){ container.innerHTML = '<div class="dash-empty">ยังไม่มีข้อมูล Concrete Report</div>'; return; }

        const total = reportsData.length;
        const cDates = reportsData.map(r=>r.report_date).filter(Boolean).sort();
        const cDateRangeText = cDates.length ? (cDates[0] + ' → ' + cDates[cDates.length-1]) : 'insufficient data';
        const cManpowerPerRow = reportsData.map(r => (r.foreman_count||0) + (r.safety_count||0) + (r.worker_count||0) + (r.other_count||0));
        const cAvgManpower = (cManpowerPerRow.reduce((a,b)=>a+b,0) / total).toFixed(1);

        // total m3 poured overall = sum of every "today" pour entry recorded in the summary view
        const totalPoured = summaryData.reduce((s,r)=> s + (Number(r.today_m3)||0), 0);

        // poured per day
        const byDate = {};
        summaryData.forEach(r=>{ if(r.report_date){ byDate[r.report_date] = (byDate[r.report_date]||0) + (Number(r.today_m3)||0); } });
        const sortedDates = Object.keys(byDate).sort();

        // latest snapshot per structure item -> cumulative total & plan, for "by location" + "completion" charts
        const latestByItem = {};
        summaryData.forEach(r=>{
          const cur = latestByItem[r.structure_item_id];
          if(!cur || r.report_date > cur.report_date) latestByItem[r.structure_item_id] = r;
        });
        const latestRows = Object.values(latestByItem);

        const byLocationTotal = {};
        latestRows.forEach(r=>{ byLocationTotal[r.location] = (byLocationTotal[r.location]||0) + (Number(r.total_m3)||0); });
        const locEntries = Object.entries(byLocationTotal).sort((a,b)=>b[1]-a[1]);

        const withPlan = latestRows.filter(r=> r.plan_m3 != null && r.plan_m3 > 0);
        const completionByLocation = {}, completionCountByLocation = {};
        withPlan.forEach(r=>{
          completionByLocation[r.location] = (completionByLocation[r.location]||0) + (Number(r.finished_pct)||0);
          completionCountByLocation[r.location] = (completionCountByLocation[r.location]||0) + 1;
        });
        const completionEntries = Object.keys(completionByLocation).map(loc => [loc, Math.round(completionByLocation[loc]/completionCountByLocation[loc])]);

        const planNote = withPlan.length ? '' : '<div class="dash-note">ยังไม่ได้กำหนดปริมาณตามแผน (plan_m3) ในตาราง concrete_structure_items จึงยังคำนวณ % ความสำเร็จเทียบแผนไม่ได้ — อัปเดตแผนได้ที่ Supabase</div>';

        // ---- Area × Floor breakdown: total poured (all-time, every floor) + % of that area's plan ----
        const itemMeta = {}; // structure_item_id -> {location, plan_m3}
        summaryData.forEach(r=>{ itemMeta[r.structure_item_id] = { location: r.location, plan_m3: r.plan_m3 }; });
        const byAreaFloor = {}, byAreaPoured = {}, byAreaPlan = {};
        const seenPlanItem = {};
        pourEntriesRaw.forEach(pe=>{
          const meta = itemMeta[pe.structure_item_id];
          if(!meta) return;
          const loc = meta.location, fl = pe.floor || 'ไม่ระบุชั้น', vol = Number(pe.poured_today_m3) || 0;
          byAreaFloor[loc] = byAreaFloor[loc] || {};
          byAreaFloor[loc][fl] = (byAreaFloor[loc][fl] || 0) + vol;
          byAreaPoured[loc] = (byAreaPoured[loc] || 0) + vol;
        });
        Object.keys(itemMeta).forEach(itemId=>{
          const meta = itemMeta[itemId];
          const dedupeKey = meta.location + '::' + itemId;
          if(seenPlanItem[dedupeKey]) return;
          seenPlanItem[dedupeKey] = true;
          byAreaPlan[meta.location] = (byAreaPlan[meta.location] || 0) + (Number(meta.plan_m3) || 0);
        });
        const areaFloorLocations = Object.keys(byAreaFloor).sort((a,b)=> (byAreaPoured[b]||0) - (byAreaPoured[a]||0));
        const areaFloorTableHtml = !areaFloorLocations.length ? '<div class="dash-empty">ยังไม่มีข้อมูลการเทคอนกรีต</div>' : `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:560px;">
              <thead>
                <tr style="background:#F7F9FB;">
                  <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">พื้นที่</th>
                  ${CONCRETE_FLOOR_OPTIONS.map(fl=>`<th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">${escapeHtml(fl)}</th>`).join('')}
                  <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;color:var(--charcoal);">Total (m³)</th>
                  <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">Plan (m³)</th>
                  <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">% สำเร็จ</th>
                </tr>
              </thead>
              <tbody>
                ${areaFloorLocations.map(loc=>{
                  const poured = byAreaPoured[loc] || 0;
                  const plan = byAreaPlan[loc] || 0;
                  const pct = plan > 0 ? Math.round(poured/plan*100) : null;
                  return `<tr>
                    <td style="padding:7px 10px;border-bottom:1px solid var(--line);font-weight:600;color:var(--charcoal);white-space:nowrap;">${escapeHtml(loc)}</td>
                    ${CONCRETE_FLOOR_OPTIONS.map(fl=>`<td style="text-align:right;padding:7px 10px;border-bottom:1px solid var(--line);">${(byAreaFloor[loc][fl]!=null) ? Math.round(byAreaFloor[loc][fl]*100)/100 : '-'}</td>`).join('')}
                    <td style="text-align:right;padding:7px 10px;border-bottom:1px solid var(--line);font-weight:700;color:var(--charcoal);">${Math.round(poured*100)/100}</td>
                    <td style="text-align:right;padding:7px 10px;border-bottom:1px solid var(--line);color:var(--muted);">${plan > 0 ? (Math.round(plan*100)/100) : '-'}</td>
                    <td style="text-align:right;padding:7px 10px;border-bottom:1px solid var(--line);font-weight:700;color:${pct==null?'var(--muted)':(pct>=100?'var(--closed)':'var(--progress)')};">${pct==null ? '-' : pct + '%'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`;

        container.innerHTML = `
          <div class="dash-note">คำนวณจากรายงานทั้งหมด ${total} รายการ ช่วง ${escapeHtml(cDateRangeText)}</div>
          <div class="dash-kpi-row">
            <div class="dash-kpi"><div class="v">${total}</div><div class="l">Total Reports</div></div>
            <div class="dash-kpi"><div class="v">${totalPoured.toFixed(1)}</div><div class="l">Total Poured (m³)</div></div>
            <div class="dash-kpi"><div class="v">${cAvgManpower}</div><div class="l">Avg. Manpower / Day</div></div>
            <div class="dash-kpi"><div class="v" style="font-size:14px;">${escapeHtml(cDateRangeText)}</div><div class="l">Date Range</div></div>
          </div>
          ${planNote}
          <div class="dash-section"><h3>ปริมาณคอนกรีตที่เทต่อวัน (m³)</h3><div class="chart-wrap"><canvas id="chartConcreteDaily"></canvas></div></div>
          <div class="dash-section"><h3>กำลังคน (Manpower Trend)</h3><div class="chart-wrap"><canvas id="chartConcreteManpower"></canvas></div></div>
          <div class="dash-section"><h3>ยอดสะสมแยกตามพื้นที่ (m³)</h3><div class="chart-wrap"><canvas id="chartConcreteLocation"></canvas></div></div>
          <div class="dash-section"><h3>ปริมาณคอนกรีตแยกตาม พื้นที่ × ชั้น (m³) พร้อม % ที่เทไปแล้ว</h3>${areaFloorTableHtml}</div>
          ${withPlan.length ? '<div class="dash-section"><h3>% ความสำเร็จเทียบแผน แยกตามพื้นที่</h3><div class="chart-wrap"><canvas id="chartConcreteCompletion"></canvas></div></div>' : ''}
        `;

        destroyChart('cd'); destroyChart('cm'); destroyChart('cl'); destroyChart('cc');
        chartInstances.cd = new Chart($('#chartConcreteDaily'), { type:'bar', data:{ labels: sortedDates, datasets:[{ label:'m³', data: sortedDates.map(d=>Math.round(byDate[d]*100)/100), backgroundColor:'#0EA394' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} } });

        const mLabels = reportsData.map(r=>r.report_date);
        chartInstances.cm = new Chart($('#chartConcreteManpower'), {
          type:'bar',
          data:{ labels: mLabels, datasets:[
            { label:'Foreman', data: reportsData.map(r=>r.foreman_count||0), backgroundColor:'#0EA394' },
            { label:'Safety', data: reportsData.map(r=>r.safety_count||0), backgroundColor:'#2563EB' },
            { label:'Worker', data: reportsData.map(r=>r.worker_count||0), backgroundColor:'#F0A93B' },
            { label:'Other', data: reportsData.map(r=>r.other_count||0), backgroundColor:'#8B5CF6' },
          ]},
          options:{ responsive:true, maintainAspectRatio:false, scales:{ x:{ stacked:true }, y:{ stacked:true } } }
        });

        $('#chartConcreteLocation').parentElement.style.height = Math.max(220, locEntries.length * 34 + 40) + 'px';
        chartInstances.cl = new Chart($('#chartConcreteLocation'), { type:'bar', data:{ labels: locEntries.map(x=>x[0]), datasets:[{ data: locEntries.map(x=>Math.round(x[1]*100)/100), backgroundColor:'#2563EB' }] }, options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ autoSkip:false } } } } });

        if(withPlan.length){
          chartInstances.cc = new Chart($('#chartConcreteCompletion'), { type:'bar', data:{ labels: completionEntries.map(x=>x[0]), datasets:[{ data: completionEntries.map(x=>x[1]), backgroundColor:'#16A34A' }] }, options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:(ctx)=> ctx.parsed.x + '%' } } }, scales:{ x:{ max:100 }, y:{ ticks:{ autoSkip:false } } } } });
        }
      }
    },
    {
      id:'dash_piling', label:'Dashboard Piling', icon:'📊', table:'pile_reports',
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        let data;
        try{
          data = await fetchAllRows(SUPABASE_URL + '/rest/v1/pile_reports?select=*');
        }catch(e){ container.innerHTML = '<div class="dash-empty">โหลดข้อมูลไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; return; }

        if(!data.length){ container.innerHTML = '<div class="dash-empty">ยังไม่มีข้อมูล Piling Report</div>'; return; }

        const total = data.length; // รวมเสาเข็มแซม (raw row count)
        // เสาเข็มแซม/ทดแทน (pile_number มี "/" เช่น 168/1) เป็นแถวที่เพิ่มขึ้นมาแก้ปัญหาเสาเข็มหลักที่ไม่ผ่าน
        // ไม่ใช่ตำแหน่งที่ออกแบบไว้ตั้งแต่แรก — เวลาคิด % Progress จึงไม่ควรนับซ้ำเป็นตำแหน่งใหม่
        const isReplacementPile = (r) => String(r.pile_number).includes('/');
        const totalExclReplacement = data.filter(r => !isReplacementPile(r)).length;
        const replacementCount = total - totalExclReplacement;
        const STATUS_LIST = ['Completed','Pending','Corrected','Defected'];
        const STATUS_COLORS = { Completed:'#16A34A', Pending:'#F0A93B', Corrected:'#2563EB', Defected:'#DC2626' };
        const countBy = (arr, key) => arr.reduce((m,r)=>{ const k = r[key] || '(ไม่ระบุ)'; m[k] = (m[k]||0) + 1; return m; }, {});

        const statusCounts = STATUS_LIST.map(s => data.filter(r=>r.status===s).length);
        const completed = statusCounts[0], pending = statusCounts[1], corrected = statusCounts[2], defected = statusCounts[3];
        const pctComplete = totalExclReplacement ? Math.round((completed / totalExclReplacement) * 1000) / 10 : 0;

        // ---- by area ----
        const areaKeys = Object.keys(countBy(data, 'area')).sort();
        const areaProgressHtml = areaKeys.map(a=>{
          // ไม่รวมเสาเข็มแซมในตัวหาร เพื่อไม่ให้ % Progress ของแต่ละพื้นที่ถูกนับตำแหน่งซ้ำ
          const rowsForArea = data.filter(r => (r.area||'(ไม่ระบุ)') === a && !isReplacementPile(r));
          const cnt = rowsForArea.length;
          const done = rowsForArea.filter(r=>r.status==='Completed').length;
          const pct = cnt ? Math.round((done/cnt)*1000)/10 : 0;
          return `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <div style="flex:0 0 52px;font-weight:700;color:var(--charcoal);font-size:13px;">${escapeHtml(a)}</div>
            <div style="flex:1 1 auto;height:16px;background:#EEF1F4;border-radius:8px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#2563EB,#0EA394);border-radius:8px;"></div>
            </div>
            <div style="flex:0 0 56px;text-align:right;font-weight:700;color:#2563EB;font-size:13px;">${pct}%</div>
            <div style="flex:0 0 90px;text-align:right;color:var(--muted);font-size:12px;white-space:nowrap;">${done} / ${cnt} ต้น</div>
          </div>`;
        }).join('');

        // ---- weld inspection — among driven piles only ----
        const drivenRows = data.filter(r => r.driving_time_start || r.rig || r.weld_inspection);
        const weldAccept = drivenRows.filter(r=>r.weld_inspection==='Accept').length;
        const weldPending = drivenRows.length - weldAccept;

        // ---- daily production: per-day count (bar) + cumulative (line) ----
        const byDate = {};
        data.forEach(r => { if(r.piled_date){ byDate[r.piled_date] = (byDate[r.piled_date]||0) + 1; } });
        const sortedDates = Object.keys(byDate).sort();
        const dailyCounts = sortedDates.map(d => byDate[d]);
        let running = 0;
        const cumulative = sortedDates.map(d => { running += byDate[d]; return running; });
        const pDates = sortedDates;
        const dateRangeText = pDates.length ? (pDates[0] + ' → ' + pDates[pDates.length-1]) : 'ยังไม่มีวันที่ตอก';

        // ---- rig utilization — by RIG. Code (matches the physical rig unit, not the RIG. index number) ----
        const rigCodeMap = countBy(data.filter(r=>r.rig_code), 'rig_code');
        const rigCodeKeys = Object.keys(rigCodeMap).sort();

        // ---- pile type breakdown ----
        const typeMap = countBy(data.filter(r=>r.type), 'type');
        const typeKeys = Object.keys(typeMap).sort((a,b)=> typeMap[b]-typeMap[a]);

        // ---- geographic distribution (design N/E coordinates) ----
        // ทำสีให้เรียบง่าย: จัดกลุ่มตามสถานะเท่านั้น (ไม่แยกตามพื้นที่ด้วย) legend เหลือแค่ 4 สี อ่านง่ายขึ้นมาก
        // ตำแหน่งบนกราฟเองแบ่งพื้นที่ให้เห็นอยู่แล้วโดยธรรมชาติ ไม่ต้องพึ่งสี/เส้นขอบแยกตามพื้นที่อีก
        const geoPoints = data.filter(r => r.design_n != null && r.design_e != null && !(r.design_n === 0 && r.design_e === 0));
        let geoDateStart = '', geoDateEnd = '', geoAreaFilter = '';
        function geoFilteredPoints(){
          return geoPoints.filter(r => {
            if(geoAreaFilter && (r.area || '(ไม่ระบุ)') !== geoAreaFilter) return false;
            // เสาเข็มที่ยังไม่ตอกจริง (ไม่มี piled_date) ให้แสดงเสมอเป็นค่าเริ่มต้น ไม่ถูกกรองด้วยช่วงวันที่
            if(r.piled_date){
              if(geoDateStart && r.piled_date < geoDateStart) return false;
              if(geoDateEnd && r.piled_date > geoDateEnd) return false;
            }
            return true;
          });
        }
        function buildGeoBaseDatasets(points){
          return STATUS_LIST.map(status => {
            const pts = points.filter(r => r.status === status);
            if(!pts.length) return null;
            return {
              label: status,
              data: pts.map(p => ({ x: p.design_e, y: p.design_n, pile_number: p.pile_number, area: p.area || '(ไม่ระบุ)', id: p.id, piled_date: p.piled_date || null, plan_date: p.plan_date || null })),
              backgroundColor: STATUS_COLORS[status],
              pointRadius: status === 'Defected' ? 5 : 3,
              pointHoverRadius: 7,
              pointHoverBorderColor: '#111827',
              pointHoverBorderWidth: 1.5,
            };
          }).filter(Boolean);
        }
        let geoDatasets = buildGeoBaseDatasets(geoFilteredPoints());

        // ---- QC & Non-Conformance: เสาเข็มที่ตอกแซม (Corrected) และเสาเข็มที่เสีย/ใช้งานไม่ได้ (Defected) ----
        const NONCONFORM_BADGE = { Corrected:'status-in-progress', Defected:'status-overdue' };
        const nonConformRows = data.filter(r => r.status === 'Corrected' || r.status === 'Defected')
          .sort((a,b)=> String(a.pile_number).localeCompare(String(b.pile_number), undefined, {numeric:true}));
        const qcRowsHtml = nonConformRows.map(r => {
          const pnStr = String(r.pile_number);
          const hasReplacement = pnStr.includes('/');
          const originalNo = pnStr.split('/')[0];
          return `<tr>
            <td style="padding:8px 10px;border-bottom:1px solid var(--line);font-weight:600;white-space:nowrap;">${escapeHtml(originalNo)}</td>
            <td style="padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${escapeHtml(r.area||'-')}</td>
            <td style="padding:8px 10px;border-bottom:1px solid var(--line);">${escapeHtml(r.remark||'-')}</td>
            <td style="padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${hasReplacement ? escapeHtml(pnStr) : '-'}</td>
            <td style="padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;"><span class="pill ${NONCONFORM_BADGE[r.status] || 'status-overdue'}">${escapeHtml(r.status)}</span></td>
          </tr>`;
        }).join('') || '<tr><td colspan="5" style="padding:14px;text-align:center;color:var(--muted);">ไม่มีรายการเสาเข็มตอกแซม/เสีย</td></tr>';

        // ---- pilot test piles: remark mentions "Pilot pile" ----
        const pilotRows = data.filter(r => r.remark && /pilot\s*pile/i.test(r.remark));
        const pilotHtml = pilotRows.length
          ? pilotRows.map(r => `<span class="pill loc">${escapeHtml(String(r.pile_number))} (${escapeHtml(r.remark)})</span>`).join(' ')
          : '<span style="color:var(--muted);font-size:12.5px;">ไม่มีเสาเข็มทดสอบนำร่อง</span>';

        container.innerHTML = `
          <div class="dash-note">คำนวณจากเสาเข็มทั้งหมด ${total} ต้น · ช่วงวันที่ตอก ${escapeHtml(dateRangeText)}</div>
          <div class="dash-kpi-row" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
            <div class="dash-kpi"><div class="v">${totalExclReplacement}</div><div class="l">Total Piles (ไม่รวมเสาเข็มแซม)</div><div class="f">${areaKeys.length} พื้นที่ · ใช้คิด % Progress</div></div>
            <div class="dash-kpi"><div class="v" style="color:#9AA3B0;">${total}</div><div class="l">Total Piles (รวมเสาเข็มแซม)</div><div class="f">+${replacementCount} เสาเข็มแซม</div></div>
            <div class="dash-kpi"><div class="v" style="color:#16A34A;">${completed}</div><div class="l">Completed (Driven)</div><div class="f">${pctComplete}%</div></div>
            <div class="dash-kpi"><div class="v" style="color:#F0A93B;">${pending}</div><div class="l">รอตอก (Pending)</div></div>
            <div class="dash-kpi"><div class="v" style="color:#2563EB;">${corrected}</div><div class="l">ตอกแซม (Corrected)</div></div>
          </div>

          <div id="pilingTabBar" style="display:flex;gap:4px;border-bottom:1px solid var(--line);margin:16px 0;overflow-x:auto;">
            <button type="button" class="piling-tab-btn" data-ptab="overview">ภาพรวม (Overview)</button>
            <button type="button" class="piling-tab-btn" data-ptab="location">แผนที่ตำแหน่ง (Location Plot)</button>
            <button type="button" class="piling-tab-btn" data-ptab="byarea">รายละเอียดตามพื้นที่ (By Area)</button>
            <button type="button" class="piling-tab-btn" data-ptab="qc">QC &amp; Non-Conformance</button>
          </div>

          <div id="pilingPanelOverview">
            <div class="dash-section">
              <h3>ความก้าวหน้าตามพื้นที่ (Progress by Area)</h3>
              ${areaProgressHtml}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
              <div class="dash-section"><h3>สถานะตรวจสอบรอยเชื่อม (Weld Inspection)</h3><div class="chart-wrap" style="max-width:280px;margin:0 auto;"><canvas id="chartPileWeld"></canvas></div></div>
              <div class="dash-section"><h3>สัดส่วนประเภทเสาเข็ม (Pile Type)</h3><div class="chart-wrap" style="max-width:280px;margin:0 auto;"><canvas id="chartPileType"></canvas></div></div>
            </div>
            <div class="dash-section"><h3>Daily Pile Driving Production</h3><div class="chart-wrap"><canvas id="chartPileDaily"></canvas></div></div>
            <div class="dash-section"><h3>Rig Utilization (จำนวนเสาเข็มที่ตอกต่อ Rig)</h3><div class="chart-wrap"><canvas id="chartPileRig"></canvas></div></div>
          </div>

          <div id="pilingPanelLocation" hidden>
            <div class="dash-section" id="pileGeoChartWrap">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                <h3 style="margin:0;">Geographic Distribution — ตำแหน่งเสาเข็มตามพิกัดจริง (N/E)</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button type="button" class="btn btn-ghost" id="btnGeoThisWeek">📅 This Week</button>
                  <button type="button" class="btn btn-ghost" id="btnGeoLastWeek">📅 Last Week</button>
                  <button type="button" class="btn btn-ghost" id="btnGeoSoon">🟡 Soon</button>
                  <button type="button" class="btn btn-ghost" id="btnPileGeoFullscreen">⛶ เต็มจอ</button>
                </div>
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px;">
                <label style="font-size:12.5px;color:var(--muted);">ช่วงวันที่ตอก:</label>
                <input type="date" id="geoDateStartInput" class="kpi-input" style="width:auto;">
                <span style="color:var(--muted);font-size:12.5px;">ถึง</span>
                <input type="date" id="geoDateEndInput" class="kpi-input" style="width:auto;">
                <button type="button" class="btn btn-ghost" id="btnGeoClearDate">ล้างช่วงวันที่</button>
                <label style="font-size:12.5px;color:var(--muted);margin-left:8px;">พื้นที่:</label>
                <select id="geoAreaFilterInput" class="kpi-input" style="min-width:160px;">
                  <option value="">ทุกพื้นที่ (All Areas)</option>
                  ${areaKeys.map(a=>`<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('')}
                </select>
              </div>
              <div class="dash-note" style="margin-top:10px;">คลิกที่จุดเพื่อเปิดเสาเข็มต้นนั้นมากรอกข้อมูลใน Piling Report · เสาเข็มที่ยังไม่ตอกจริง (ไม่มีวันที่ตอก) จะแสดงบนกราฟเสมอ ไม่ถูกกรองด้วยช่วงวันที่</div>
              <div class="chart-wrap" id="pileGeoCanvasWrap" style="height:460px;"><canvas id="chartPileGeo"></canvas></div>
              <div class="dash-kpi-row" style="margin-top:12px;" id="pileGeoKpiRow">
                <div class="dash-kpi"><div class="v" id="pileGeoNRange">-</div><div class="l">N Range (m)</div></div>
                <div class="dash-kpi"><div class="v" id="pileGeoERange">-</div><div class="l">E Range (m)</div></div>
                <div class="dash-kpi"><div class="v" id="pileGeoAvgCoverage">-</div><div class="l">Avg Area Coverage (m²)</div></div>
              </div>
            </div>
          </div>

          <div id="pilingPanelByArea" hidden>
            <div class="dash-section">
              <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">
                <label style="font-size:12.5px;color:var(--muted);">กรองตามพื้นที่:</label>
                <select id="baAreaFilter" class="kpi-input" style="min-width:160px;">
                  <option value="">ทุกพื้นที่ (All Areas)</option>
                  ${areaKeys.map(a=>`<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('')}
                </select>
                <input type="text" id="baSearchInput" placeholder="ค้นหาเลขเสาเข็ม..." style="flex:1 1 200px;min-width:160px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;">
                <span id="baRecordCount" class="pill loc" style="white-space:nowrap;"></span>
              </div>
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:760px;">
                  <thead>
                    <tr style="background:#F7F9FB;">
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">PILE NO.</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">AREA</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">TYPE</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">RIG</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">DRIVING DATE</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">WELD</th>
                      <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">DEV. N (m)</th>
                      <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">DEV. E (m)</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">REMARK</th>
                    </tr>
                  </thead>
                  <tbody id="baTableBody"></tbody>
                </table>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:8px;">
                <span id="baPageLabel" style="font-size:12px;color:var(--muted);"></span>
                <div style="display:flex;gap:8px;align-items:center;">
                  <select id="baPageSize" class="kpi-input" style="width:auto;">
                    <option value="20">20 แถวต่อหน้า</option>
                    <option value="50">50 แถวต่อหน้า</option>
                    <option value="100">100 แถวต่อหน้า</option>
                  </select>
                  <button type="button" class="btn btn-ghost" id="baPrevPage">‹ ก่อนหน้า</button>
                  <button type="button" class="btn btn-ghost" id="baNextPage">ถัดไป ›</button>
                </div>
              </div>
            </div>
          </div>

          <div id="pilingPanelQc" hidden>
            <div class="dash-section">
              <h3>Non-Conformance / Resupply Log</h3>
              <div class="dash-note" style="margin-bottom:10px;">เสาเข็มที่ไม่ผ่านเกณฑ์ (ไม่ได้ Blow Count) และต้องส่งข้อมูลให้ผู้ออกแบบพิจารณาแบบราคาฐาน / ตอกแซม (Corrected) รวมถึงเสาเข็มที่เสีย/ใช้งานไม่ได้ (Defected)</div>
              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:640px;">
                  <thead>
                    <tr style="background:#F7F9FB;">
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">PILE NO.</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">AREA</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">รายละเอียดปัญหา</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">เสาเข็มตอกแซม</th>
                      <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>${qcRowsHtml}</tbody>
                </table>
              </div>
            </div>
            <div class="dash-section">
              <h3>Pilot Test Piles</h3>
              <div class="dash-note" style="margin-bottom:10px;">เสาเข็มทดสอบเพื่อสอบเทียบ Blow Count ก่อนเริ่มงานจริงในแต่ละพื้นที่</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">${pilotHtml}</div>
            </div>
          </div>
        `;

        // ---- tab switching ----
        const pilingPanels = { overview:'#pilingPanelOverview', location:'#pilingPanelLocation', byarea:'#pilingPanelByArea', qc:'#pilingPanelQc' };
        const pilingTabsRendered = { overview:false, location:false, byarea:false, qc:false };
        function renderOverviewCharts(){
          destroyChart('pw'); destroyChart('pt'); destroyChart('pd'); destroyChart('pr');
          chartInstances.pw = new Chart($('#chartPileWeld'), {
            type:'doughnut',
            data:{ labels:['Accept','Pending Inspection'], datasets:[{ data:[weldAccept, weldPending], backgroundColor:['#16A34A','#EEF1F4'] }] },
            options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
          });
          chartInstances.pt = new Chart($('#chartPileType'), {
            type:'doughnut',
            data:{ labels: typeKeys, datasets:[{ data: typeKeys.map(k=>typeMap[k]), backgroundColor: typeKeys.map((k,i)=>CHART_COLORS[i % CHART_COLORS.length]) }] },
            options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{ size:10 } } } } }
          });
          chartInstances.pd = new Chart($('#chartPileDaily'), {
            data:{
              labels: sortedDates,
              datasets:[
                { type:'bar', label:'จำนวนต่อวัน (Daily)', data: dailyCounts, backgroundColor:'#2563EB', yAxisID:'y' },
                { type:'line', label:'สะสม (Cumulative)', data: cumulative, borderColor:'#0EA394', backgroundColor:'rgba(14,163,148,0.15)', fill:false, tension:0.25, yAxisID:'y1' },
              ]
            },
            options:{
              responsive:true, maintainAspectRatio:false,
              scales:{
                y:{ beginAtZero:true, position:'left', title:{ display:true, text:'จำนวนต่อวัน' } },
                y1:{ beginAtZero:true, position:'right', title:{ display:true, text:'สะสม' }, grid:{ drawOnChartArea:false } },
              }
            }
          });
          chartInstances.pr = new Chart($('#chartPileRig'), {
            type:'bar',
            data:{ labels: rigCodeKeys, datasets:[{ label:'จำนวนเสาเข็ม', data: rigCodeKeys.map(k=>rigCodeMap[k]), backgroundColor: CHART_COLORS[0] }] },
            options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', scales:{ x:{ beginAtZero:true } } }
          });
        }
        async function openPileForEdit(record){
          // ถ้ากำลังอยู่โหมดเต็มจอ ต้องออกจากเต็มจอก่อน ไม่งั้นฟอร์มที่สลับไปจะอยู่นอก element ที่เต็มจออยู่
          // (มองไม่เห็น/กรอกไม่ได้) จนกว่าจะออกจากเต็มจอเองก่อน
          const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
          if(document.fullscreenElement && exitFs){
            await exitFs.call(document);
          }
          await switchModule('piling');
          loadIntoForm(record);
        }
        // ---- This Week / Last Week highlight (Magenta) ----
        function isoDate(d){
          // ใช้ค่า local date components ตรงๆ ห้ามผ่าน toISOString() เพราะจะแปลงเป็น UTC ก่อน
          // ทำให้วันที่เพี้ยนไป 1 วันสำหรับโซนเวลาที่เร็วกว่า UTC เช่น ไทย (UTC+7)
          const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
          return y + '-' + m + '-' + dd;
        }
        function weekRangeStr(offsetWeeks){
          const now = new Date();
          const day = now.getDay(); // 0=Sun..6=Sat
          const diffToMonday = (day === 0 ? -6 : 1 - day);
          const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + offsetWeeks*7);
          const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
          return { start: isoDate(monday), end: isoDate(sunday) };
        }
        let geoHighlightThisWeek = false, geoHighlightLastWeek = false, geoHighlightSoon = false;
        function geoPointToChartPoint(p){
          return { x: p.design_e, y: p.design_n, pile_number: p.pile_number, area: p.area || '(ไม่ระบุ)', id: p.id, piled_date: p.piled_date || null, plan_date: p.plan_date || null };
        }
        function buildGeoHighlightDatasets(){
          const out = [];
          const geoPointsF = geoFilteredPoints();
          if(geoHighlightThisWeek || geoHighlightLastWeek){
            // วันนี้/เมื่อวาน (เฉพาะตอนติ๊ก This Week) ให้ไฮไลท์สีน้ำเงินแยกจากสัปดาห์ที่เหลือ (สี Magenta)
            const now = new Date();
            const todayStr = isoDate(now);
            const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const yesterdayStr = isoDate(yesterday);
            const blueIds = new Set();
            if(geoHighlightThisWeek){
              geoPointsF.forEach(r => { if(r.piled_date === todayStr || r.piled_date === yesterdayStr) blueIds.add(r.id); });
            }
            const ranges = [];
            if(geoHighlightThisWeek) ranges.push(weekRangeStr(0));
            if(geoHighlightLastWeek) ranges.push(weekRangeStr(-1));
            const magentaPts = geoPointsF.filter(r => r.piled_date && !blueIds.has(r.id) && ranges.some(rg => r.piled_date >= rg.start && r.piled_date <= rg.end));
            const bluePts = geoPointsF.filter(r => blueIds.has(r.id));
            if(magentaPts.length){
              out.push({
                label: 'ตอกในสัปดาห์ที่เลือก',
                data: magentaPts.map(geoPointToChartPoint),
                backgroundColor: '#D946EF', borderColor: '#9D174D', borderWidth: 1.5,
                pointRadius: 7, pointHoverRadius: 9,
              });
            }
            if(bluePts.length){
              out.push({
                label: 'ตอกวันนี้ / เมื่อวาน',
                data: bluePts.map(geoPointToChartPoint),
                backgroundColor: '#2563EB', borderColor: '#1E3A8A', borderWidth: 1.5,
                pointRadius: 7, pointHoverRadius: 9,
              });
            }
          }
          if(geoHighlightSoon){
            // เสาเข็มที่ยังไม่ได้ตอกจริง (ไม่มี piled_date) แต่มีแผนวันที่ตอก (plan_date) อยู่ในสัปดาห์นี้หรือสัปดาห์หน้า
            const thisWeek = weekRangeStr(0), nextWeek = weekRangeStr(1);
            const soonPts = geoPointsF.filter(r => !r.piled_date && r.plan_date && r.plan_date >= thisWeek.start && r.plan_date <= nextWeek.end);
            if(soonPts.length){
              out.push({
                label: 'แผนตอกเร็วๆ นี้ (สัปดาห์นี้-หน้า)',
                data: soonPts.map(geoPointToChartPoint),
                backgroundColor: '#F0A93B', borderColor: '#B7791F', borderWidth: 1.5,
                pointRadius: 7, pointHoverRadius: 9,
              });
            }
          }
          return out;
        }
        function refreshGeoDatasets(){
          if(!chartInstances.pg) return;
          chartInstances.pg.data.datasets = geoDatasets.concat(buildGeoHighlightDatasets());
          chartInstances.pg.update();
        }
        function renderLocationChart(){
          destroyChart('pg');
          chartInstances.pg = new Chart($('#chartPileGeo'), {
            type:'scatter',
            data:{ datasets: geoDatasets },
            options:{
              responsive:true, maintainAspectRatio:false,
              plugins:{
                legend:{
                  position:'top',
                  labels:{
                    generateLabels: (chart) => {
                      const items = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                      items.forEach(item => {
                        const ds = chart.data.datasets[item.datasetIndex];
                        item.text = (ds.label || '') + ' (' + (ds.data ? ds.data.length : 0) + ')';
                      });
                      return items;
                    }
                  }
                },
                tooltip:{
                  callbacks:{
                    label: (ctx) => {
                      const p = ctx.raw;
                      let line = 'เสาเข็ม ' + p.pile_number + (p.area ? ' · ' + p.area : '') + ' · ' + ctx.dataset.label;
                      if(p.piled_date) line += ' · ตอกวันที่ ' + p.piled_date;
                      else if(p.plan_date) line += ' · แผนวันที่ตอก ' + p.plan_date;
                      return line;
                    }
                  }
                }
              },
              scales:{
                x:{ title:{ display:true, text:'East (E) Coordinate' } },
                y:{ title:{ display:true, text:'North (N) Coordinate' } },
              },
              onHover: (evt, elements) => {
                if(evt.native && evt.native.target) evt.native.target.style.cursor = elements.length ? 'pointer' : 'default';
              },
              onClick: (evt, elements) => {
                if(!elements.length) return;
                const el = elements[0];
                const point = chartInstances.pg.data.datasets[el.datasetIndex].data[el.index];
                const record = data.find(r => r.id === point.id);
                if(record) openPileForEdit(record);
                else showToast('ไม่พบข้อมูลเสาเข็มนี้แล้ว (อาจถูกลบไปก่อนหน้านี้)', true);
              }
            }
          });
          const btnThisWeek = document.getElementById('btnGeoThisWeek');
          const btnLastWeek = document.getElementById('btnGeoLastWeek');
          const btnSoon = document.getElementById('btnGeoSoon');
          if(btnThisWeek && !btnThisWeek.dataset.wired){
            btnThisWeek.dataset.wired = '1';
            btnThisWeek.addEventListener('click', ()=>{
              geoHighlightThisWeek = !geoHighlightThisWeek;
              btnThisWeek.classList.toggle('active', geoHighlightThisWeek);
              refreshGeoDatasets();
            });
          }
          if(btnLastWeek && !btnLastWeek.dataset.wired){
            btnLastWeek.dataset.wired = '1';
            btnLastWeek.addEventListener('click', ()=>{
              geoHighlightLastWeek = !geoHighlightLastWeek;
              btnLastWeek.classList.toggle('active', geoHighlightLastWeek);
              refreshGeoDatasets();
            });
          }
          if(btnSoon && !btnSoon.dataset.wired){
            btnSoon.dataset.wired = '1';
            btnSoon.addEventListener('click', ()=>{
              geoHighlightSoon = !geoHighlightSoon;
              btnSoon.classList.toggle('active-soon', geoHighlightSoon);
              refreshGeoDatasets();
            });
          }
          const fsBtn = document.getElementById('btnPileGeoFullscreen');
          if(fsBtn && !fsBtn.dataset.wired){
            fsBtn.dataset.wired = '1';
            fsBtn.addEventListener('click', ()=>{
              const wrap = document.getElementById('pileGeoChartWrap');
              const reqFs = wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.msRequestFullscreen;
              const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
              if(!document.fullscreenElement){ reqFs.call(wrap); } else { exitFs.call(document); }
            });
            document.addEventListener('fullscreenchange', ()=>{
              fsBtn.textContent = document.fullscreenElement ? '⤡ ออกจากเต็มจอ' : '⛶ เต็มจอ';
              if(chartInstances.pg) setTimeout(()=> chartInstances.pg.resize(), 50);
            });
          }
          function applyGeoFilters(){
            geoDatasets = buildGeoBaseDatasets(geoFilteredPoints());
            refreshGeoDatasets();
            updateGeoKpiRow(geoFilteredPoints());
          }
          const dateStartInput = document.getElementById('geoDateStartInput');
          const dateEndInput = document.getElementById('geoDateEndInput');
          const clearDateBtn = document.getElementById('btnGeoClearDate');
          const areaFilterInput = document.getElementById('geoAreaFilterInput');
          if(dateStartInput && !dateStartInput.dataset.wired){
            dateStartInput.dataset.wired = '1';
            dateStartInput.addEventListener('change', e=>{ geoDateStart = e.target.value; applyGeoFilters(); });
          }
          if(dateEndInput && !dateEndInput.dataset.wired){
            dateEndInput.dataset.wired = '1';
            dateEndInput.addEventListener('change', e=>{ geoDateEnd = e.target.value; applyGeoFilters(); });
          }
          if(clearDateBtn && !clearDateBtn.dataset.wired){
            clearDateBtn.dataset.wired = '1';
            clearDateBtn.addEventListener('click', ()=>{
              geoDateStart = ''; geoDateEnd = '';
              if(dateStartInput) dateStartInput.value = '';
              if(dateEndInput) dateEndInput.value = '';
              applyGeoFilters();
            });
          }
          if(areaFilterInput && !areaFilterInput.dataset.wired){
            areaFilterInput.dataset.wired = '1';
            areaFilterInput.addEventListener('change', e=>{ geoAreaFilter = e.target.value; applyGeoFilters(); });
          }
          updateGeoKpiRow(geoFilteredPoints());
        }
        function updateGeoKpiRow(points){
          if(points.length){
            const nVals = points.map(p=>p.design_n), eVals = points.map(p=>p.design_e);
            const nRangeVal = Math.max(...nVals) - Math.min(...nVals);
            const eRangeVal = Math.max(...eVals) - Math.min(...eVals);
            const areaCoverages = areaKeys.map(area => {
              const pts = points.filter(r => (r.area||'(ไม่ระบุ)') === area);
              if(pts.length < 2) return null;
              const ns = pts.map(p=>p.design_n), es = pts.map(p=>p.design_e);
              return (Math.max(...ns)-Math.min(...ns)) * (Math.max(...es)-Math.min(...es));
            }).filter(v => v != null);
            const avgCoverage = areaCoverages.length ? areaCoverages.reduce((a,b)=>a+b,0)/areaCoverages.length : 0;
            $('#pileGeoNRange').textContent = nRangeVal.toFixed(2);
            $('#pileGeoERange').textContent = eRangeVal.toFixed(2);
            $('#pileGeoAvgCoverage').textContent = avgCoverage.toFixed(0);
          } else {
            $('#pileGeoNRange').textContent = '-';
            $('#pileGeoERange').textContent = '-';
            $('#pileGeoAvgCoverage').textContent = '-';
          }
        }

        // ---- By Area tab: filter + search + client-side pagination ----
        let baFilterArea = '', baSearch = '', baPage = 1, baPageSize = 20;
        function baFilteredRows(){
          return data.filter(r =>
            (!baFilterArea || r.area === baFilterArea) &&
            (!baSearch || String(r.pile_number||'').toLowerCase().includes(baSearch.toLowerCase()))
          );
        }
        function renderByAreaTable(){
          const filtered = baFilteredRows();
          const totalPages = Math.max(1, Math.ceil(filtered.length / baPageSize));
          if(baPage > totalPages) baPage = totalPages;
          if(baPage < 1) baPage = 1;
          const startIdx = (baPage - 1) * baPageSize;
          const pageRows = filtered.slice(startIdx, startIdx + baPageSize);
          $('#baTableBody').innerHTML = pageRows.length ? pageRows.map(r => `
            <tr>
              <td style="padding:8px 10px;border-bottom:1px solid var(--line);font-weight:600;white-space:nowrap;">${escapeHtml(String(r.pile_number))}</td>
              <td style="padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${escapeHtml(r.area||'-')}</td>
              <td style="padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${escapeHtml(r.type||'-')}</td>
              <td style="padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${escapeHtml(r.rig_code||'-')}</td>
              <td style="padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${escapeHtml(r.piled_date||'-')}</td>
              <td style="padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${r.weld_inspection ? `<span class="pill ${r.weld_inspection==='Accept'?'status-closed':'status-overdue'}">${escapeHtml(r.weld_inspection)}</span>` : '-'}</td>
              <td style="padding:8px 10px;border-bottom:1px solid var(--line);text-align:right;">${r.deviation_n != null ? r.deviation_n : '-'}</td>
              <td style="padding:8px 10px;border-bottom:1px solid var(--line);text-align:right;">${r.deviation_e != null ? r.deviation_e : '-'}</td>
              <td style="padding:8px 10px;border-bottom:1px solid var(--line);">${escapeHtml(r.remark||'-')}</td>
            </tr>`).join('') : '<tr><td colspan="9" style="padding:14px;text-align:center;color:var(--muted);">ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>';
          $('#baRecordCount').textContent = filtered.length.toLocaleString() + ' records';
          const showFrom = filtered.length ? startIdx + 1 : 0;
          const showTo = Math.min(startIdx + baPageSize, filtered.length);
          $('#baPageLabel').textContent = `แสดง ${showFrom}-${showTo} จาก ${filtered.length.toLocaleString()} รายการ · หน้า ${baPage} / ${totalPages}`;
          $('#baPrevPage').disabled = baPage <= 1;
          $('#baNextPage').disabled = baPage >= totalPages;
        }
        function wireByAreaControls(){
          $('#baAreaFilter').addEventListener('change', e=>{ baFilterArea = e.target.value; baPage = 1; renderByAreaTable(); });
          $('#baSearchInput').addEventListener('input', e=>{ baSearch = e.target.value; baPage = 1; renderByAreaTable(); });
          $('#baPageSize').addEventListener('change', e=>{ baPageSize = Number(e.target.value); baPage = 1; renderByAreaTable(); });
          $('#baPrevPage').addEventListener('click', ()=>{ baPage -= 1; renderByAreaTable(); });
          $('#baNextPage').addEventListener('click', ()=>{ baPage += 1; renderByAreaTable(); });
        }

        function switchPilingTab(name){
          Object.keys(pilingPanels).forEach(k => { $(pilingPanels[k]).hidden = (k !== name); });
          $$('#pilingTabBar .piling-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.ptab === name));
          if(!pilingTabsRendered[name]){
            if(name === 'overview') renderOverviewCharts();
            else if(name === 'location') renderLocationChart();
            else if(name === 'byarea'){ wireByAreaControls(); renderByAreaTable(); }
            pilingTabsRendered[name] = true;
          }
        }
        $$('#pilingTabBar .piling-tab-btn').forEach(b => b.addEventListener('click', ()=> switchPilingTab(b.dataset.ptab)));
        switchPilingTab('overview');
      }
    },
    {
      id:'dash_brief', label:'Daily Meeting', icon:'🖥️', table:null,
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        const today = todayISO();
        const yesterday = addDays(today, -1);
        const dayBeforeYesterday = addDays(today, -2);
        let findingsData=[], envData=[], dailyData=[], pileData=[], concreteReportsData=[], concreteSummaryData=[], concretePourEntriesData=[], kpiCategories=[], hseSettings=null;
        try{
          const [r1,r2,r3,r4,r5,r6,r7] = await Promise.all([
            fetch(SUPABASE_URL + '/rest/v1/findings?select=*', { headers: HEADERS }),
            fetch(SUPABASE_URL + '/rest/v1/environment_reports?select=*&order=report_date.asc', { headers: HEADERS }),
            fetch(SUPABASE_URL + '/rest/v1/daily_reports?select=*', { headers: HEADERS }),
            fetch(SUPABASE_URL + '/rest/v1/concrete_reports?select=id,report_date,foreman_count,safety_count,worker_count,other_count', { headers: HEADERS }),
            fetch(SUPABASE_URL + '/rest/v1/concrete_area_summary?select=*', { headers: HEADERS }),
            fetchAllRows(SUPABASE_URL + '/rest/v1/pile_reports?select=id,pile_number,status,piled_date,plan_date,design_n,design_e,area,rig_code'),
            fetch(SUPABASE_URL + '/rest/v1/concrete_pour_entries?select=report_id,structure_item_id,floor,poured_today_m3', { headers: HEADERS }),
          ]);
          if(r1.ok) findingsData = await r1.json();
          if(r2.ok) envData = await r2.json();
          if(r3.ok) dailyData = await r3.json();
          if(r4.ok) concreteReportsData = await r4.json();
          if(r5.ok) concreteSummaryData = await r5.json();
          pileData = r6 || [];
          if(r7.ok) concretePourEntriesData = await r7.json();
          try{ kpiCategories = await fetchSafetyKpiCategories(); }catch(e){ kpiCategories = []; }
          try{ hseSettings = await fetchSafetyHseSettings(); }catch(e){ hseSettings = null; }
        }catch(e){ container.innerHTML = '<div class="dash-empty">โหลดข้อมูลไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; return; }

        function briefKpiCard(label, todayVal, yestVal, unit){
          return `<div class="brief-kpi">
            <div class="lbl">${escapeHtml(label)}</div>
            <div class="cmp">
              <div><span class="v">${todayVal}</span><span class="t">วันนี้ (${escapeHtml(today)})</span></div>
              <div><span class="v" style="color:var(--muted);font-size:22px;">${yestVal}</span><span class="t">เมื่อวาน (${escapeHtml(yesterday)})</span></div>
            </div>
            ${unit ? `<div class="t" style="margin-top:8px;">${escapeHtml(unit)}</div>` : ''}
          </div>`;
        }
        function briefKpiCard3(label, todayVal, yestVal, beforeYestVal, unit){
          return `<div class="brief-kpi">
            <div class="lbl">${escapeHtml(label)}</div>
            <div class="cmp">
              <div><span class="v">${todayVal}</span><span class="t">วันนี้ (${escapeHtml(today)})</span></div>
              <div><span class="v" style="color:var(--muted);font-size:22px;">${yestVal}</span><span class="t">เมื่อวาน (${escapeHtml(yesterday)})</span></div>
              <div><span class="v" style="color:var(--muted);font-size:22px;">${beforeYestVal}</span><span class="t">เมื่อวานซืน (${escapeHtml(dayBeforeYesterday)})</span></div>
            </div>
            ${unit ? `<div class="t" style="margin-top:8px;">${escapeHtml(unit)}</div>` : ''}
          </div>`;
        }
        function briefFindingCardHtml(f){
          const urls = Array.isArray(f.photo_urls) ? f.photo_urls : [];
          const coverHtml = urls.length ? `<img src="${urls[0]}" loading="lazy">` : `<div class="ph-empty">⚠️<span>ไม่มีรูป</span></div>`;
          return `
          <div class="finding-card ${findingSevClassStatic(f)}" data-brief-finding-id="${f.id}">
            <div class="fc-cover">${coverHtml}</div>
            <div class="fc-body">
              <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
                <span style="font-family:var(--mono);font-size:11.5px;color:var(--muted);font-weight:700;">${escapeHtml(f.finding_number||'')}</span>
                <span style="font-size:11px;color:var(--muted);white-space:nowrap;">${escapeHtml(f.finding_date||'')}</span>
              </div>
              <div style="font-size:13.5px;line-height:1.4;color:var(--ink);">${escapeHtml(f.description||'(ไม่มีรายละเอียด)')}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:auto;">
                <span class="pill loc">${escapeHtml(f.location||'-')}</span>
                <span class="pill ${findingBadgeClassStatic(f.status)}">${escapeHtml(f.status||'-')}</span>
                <span class="pill loc">${escapeHtml(f.severity||'-')}</span>
                ${urls.length ? `<span class="pill photos">📷 ${urls.length}</span>` : ''}
              </div>
            </div>
          </div>`;
        }
        function briefFindingCardGridHtml(list, emptyText){
          if(!list.length) return `<div class="dash-note" style="margin-top:10px;">${escapeHtml(emptyText)}</div>`;
          return `<div class="finding-card-grid">${list.map(briefFindingCardHtml).join('')}</div>`;
        }
        function wireBriefFindingClicks(containerId, list){
          const el = document.getElementById(containerId);
          if(!el) return;
          el.querySelectorAll('.finding-card').forEach(node => {
            node.addEventListener('click', ()=>{
              const f = list.find(x => String(x.id) === node.dataset.briefFindingId);
              if(f) openFindingDetailStatic(f);
            });
          });
        }

        // ---- Slide 1: Cover ----
        const isReplacementPile = (r) => String(r.pile_number).includes('/');
        const pileTotalExclRepl = pileData.filter(r=>!isReplacementPile(r)).length;
        const pileCompleted = pileData.filter(r=>r.status==='Completed').length;
        const pilePct = pileTotalExclRepl ? Math.round((pileCompleted/pileTotalExclRepl)*1000)/10 : 0;
        const ltiWeekCount = Number(findKpiByName(kpiCategories, 'Loss Time Injury (LTI)').week_actual) || 0;
        const safeDays = hseSettings && hseSettings.start_date ? daysBetweenInclusive(hseSettings.start_date, today) : 0;

        // ชั่วโมงทำงานสะสม (Safe Man-Hours) = กำลังคนรวมต่อวันจาก Daily Report เท่านั้น × 10 ชม.
        // สะสมตั้งแต่ "วันเริ่มนับ" (hse_safe_days_counter.start_date) ถึงวันนี้ — สูตรเดียวกับหน้า Safety KPI & Safe Days
        // (ปรับ 2026-09-08 ตามที่ผู้ใช้ระบุ "ให้รวม Man hour เฉพาะที่อยู่ใน Daily Report" — ตัด concrete_reports ออก)
        // แยกยอด Man-Day สะสมของ REPCO / STATE (Site+Workshop รวมกัน) ต่างหาก เพื่อโชว์ breakdown
        // ในการ์ด "ชั่วโมงทำงานสะสม" ด้วย (ผู้ใช้ขอเพิ่ม 2026-09-08)
        let cumulativeManHours = 0, cumulativeManpowerDays = 0, repcoManDays = 0, stateManDays = 0;
        if(hseSettings && hseSettings.start_date){
          const mhStart = hseSettings.start_date;
          dailyData.forEach(r=>{
            if(!r.report_date || r.report_date < mhStart) return;
            repcoManDays += sumPersonnel(r.repco_personnel);
            stateManDays += sumPersonnel(r.state_personnel_site) + sumPersonnel(r.state_personnel_workshop);
          });
          cumulativeManpowerDays = repcoManDays + stateManDays;
          cumulativeManHours = cumulativeManpowerDays * 10;
        }

        const slideCover = {
          title:'Cover',
          html:`
          <div class="brief-slide-head" style="margin-bottom:30px;">
            <div class="ic">🏗️</div>
            <div><h1>RISE Project — สรุปประจำวัน</h1><div class="sub">ประชุมก่อนเริ่มงาน · ${escapeHtml(today)}</div></div>
          </div>
          <div class="brief-grid">
            <div class="brief-kpi"><div class="lbl">Safe Working Day</div><div class="cmp"><div><span class="v">${safeDays}</span><span class="t">วัน ไม่เกิด LTI</span></div></div></div>
            <div class="brief-kpi"><div class="lbl">ชั่วโมงทำงานสะสม</div><div class="cmp"><div><span class="v">${cumulativeManHours.toLocaleString()}</span><span class="t">ชม. (Man-Hours)</span></div></div><div class="t" style="margin-top:10px;display:flex;gap:16px;flex-wrap:wrap;">
              <span>REPCO <b style="color:var(--charcoal);font-weight:700;">${repcoManDays.toLocaleString()}</b> คน-วัน</span>
              <span>STATE <b style="color:var(--charcoal);font-weight:700;">${stateManDays.toLocaleString()}</b> คน-วัน</span>
              <span>รวมทั้งโครงการ <b style="color:var(--charcoal);font-weight:700;">${cumulativeManpowerDays.toLocaleString()}</b> คน-วัน</span>
            </div></div>
            <div class="brief-kpi"><div class="lbl">ความคืบหน้างานเสาเข็ม</div><div class="cmp"><div><span class="v">${pilePct}%</span><span class="t">${pileCompleted}/${pileTotalExclRepl} ต้น</span></div></div></div>
          </div>
          <div class="dash-note" style="margin-top:20px;">สไลด์ถัดไป: Safety · Environment · Daily Report · งานเสาเข็ม · งานคอนกรีต — ใช้ปุ่ม ‹ › หรือลูกศรซ้าย/ขวาเลื่อนสไลด์</div>`
        };

        // ---- Slide 2: Safety (with full finding details + photos) ----
        const findByDate = (d) => findingsData.filter(f => f.finding_date === d);
        const closedByDate = (d) => findingsData.filter(f => f.date_closed === d);
        const foundToday = findByDate(today), foundYest = findByDate(yesterday), foundBeforeYest = findByDate(dayBeforeYesterday);
        const closedToday = closedByDate(today), closedYest = closedByDate(yesterday), closedBeforeYest = closedByDate(dayBeforeYesterday);
        const highCritToday = foundToday.filter(f => f.severity === 'High' || f.severity === 'Critical');

        // หมวดหมู่ (Category) รวม / ประจำวัน — ไม่รวมหมวด "ชื่นชม"
        const findingsCategoryField = MODULES.find(m=>m.id==='findings').fields.find(fl=>fl.key==='category');
        const findingsCategoryOrder = (findingsCategoryField ? findingsCategoryField.options : []).filter(c => c !== 'ชื่นชม');
        const findingsDataExclRecognition = findingsData.filter(f => f.category !== 'ชื่นชม');
        function groupFindingsByCategory(list){
          const g = {};
          list.forEach(f=>{ const v = f.category || 'ไม่ระบุ'; g[v] = (g[v]||0)+1; });
          const known = findingsCategoryOrder.filter(c => g[c] != null);
          const extra = Object.keys(g).filter(c => !findingsCategoryOrder.includes(c));
          return known.concat(extra).map(c => [c, g[c]]);
        }
        const catOrderedAll = groupFindingsByCategory(findingsDataExclRecognition);
        function categoryCountMap(list){
          const g = {};
          list.forEach(f=>{ const v = f.category || 'ไม่ระบุ'; g[v] = (g[v]||0)+1; });
          return g;
        }
        const catMapToday = categoryCountMap(findingsDataExclRecognition.filter(f => f.finding_date === today));
        const catMapYest = categoryCountMap(findingsDataExclRecognition.filter(f => f.finding_date === yesterday));
        const catMapBeforeYest = categoryCountMap(findingsDataExclRecognition.filter(f => f.finding_date === dayBeforeYesterday));
        const catUnionKeysDaily = new Set([...Object.keys(catMapToday), ...Object.keys(catMapYest), ...Object.keys(catMapBeforeYest)]);
        const catKnownOrderedDaily = findingsCategoryOrder.filter(c => catUnionKeysDaily.has(c));
        const catExtraDaily = Array.from(catUnionKeysDaily).filter(c => !findingsCategoryOrder.includes(c));
        const catLabelsDaily = catKnownOrderedDaily.concat(catExtraDaily);
        const slideSafety = {
          title:'Safety',
          html:`
          <div class="brief-slide-head"><div class="ic">🦺</div><div><h1>Safety</h1><div class="sub">Findings &amp; Safe Days</div></div></div>
          <div class="brief-grid" style="margin-bottom:16px;">
            ${briefKpiCard3('พบ Finding ใหม่', foundToday.length, foundYest.length, foundBeforeYest.length, 'รายการ')}
            ${briefKpiCard3('ปิด Finding ได้', closedToday.length, closedYest.length, closedBeforeYest.length, 'รายการ')}
            ${briefKpiCard('Finding ระดับ High/Critical (วันนี้)', highCritToday.length, '-', 'รายการ')}
          </div>
          <div style="margin-bottom:16px;">${renderSafeDayCardHtml(hseSettings, ltiWeekCount)}</div>
          <div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
              <div class="dash-section" style="margin:0;">
                <h3 style="margin:0 0 8px;">หมวดหมู่ (Category) รวม</h3>
                <div class="chart-wrap" id="briefCatAllWrap" style="height:${Math.max(180, catOrderedAll.length * 28 + 30)}px;"><canvas id="briefChartCategoryAll"></canvas></div>
              </div>
              <div class="dash-section" style="margin:0;">
                <h3 style="margin:0 0 8px;">หมวดหมู่ (Category) ประจำวัน (3 วันล่าสุด)</h3>
                <div class="chart-wrap" id="briefCatTodayWrap" style="height:${Math.max(220, catLabelsDaily.length * 56 + 40)}px;">${catLabelsDaily.length ? '<canvas id="briefChartCategoryToday"></canvas>' : '<div class="dash-empty" style="padding:14px;">ยังไม่มี Findings ใน 3 วันนี้</div>'}</div>
              </div>
            </div>
            <h3 style="margin:14px 0 8px;">🆕 พบ Finding ใหม่ วันนี้ (${escapeHtml(today)})</h3>
            <div id="briefFindNewList">${briefFindingCardGridHtml(foundToday, 'ไม่มี Finding ใหม่วันนี้')}</div>
            <h3 style="margin:16px 0 8px;">✅ ปิด Finding ได้ วันนี้ (${escapeHtml(today)})</h3>
            <div id="briefFindClosedList">${briefFindingCardGridHtml(closedToday, 'ยังไม่มี Finding ที่ปิดวันนี้')}</div>
            <h3 style="margin:16px 0 8px;">🆕 พบ Finding ใหม่ เมื่อวาน (${escapeHtml(yesterday)})</h3>
            <div id="briefFindNewYestList">${briefFindingCardGridHtml(foundYest, 'ไม่มี Finding ใหม่เมื่อวาน')}</div>
            <h3 style="margin:16px 0 8px;">✅ ปิด Finding ได้ เมื่อวาน (${escapeHtml(yesterday)})</h3>
            <div id="briefFindClosedYestList">${briefFindingCardGridHtml(closedYest, 'ไม่มี Finding ที่ปิดเมื่อวาน')}</div>
            <h3 style="margin:16px 0 8px;">🆕 พบ Finding ใหม่ เมื่อวานซืน (${escapeHtml(dayBeforeYesterday)})</h3>
            <div id="briefFindNewBeforeYestList">${briefFindingCardGridHtml(foundBeforeYest, 'ไม่มี Finding ใหม่เมื่อวานซืน')}</div>
            <h3 style="margin:16px 0 8px;">✅ ปิด Finding ได้ เมื่อวานซืน (${escapeHtml(dayBeforeYesterday)})</h3>
            <div id="briefFindClosedBeforeYestList">${briefFindingCardGridHtml(closedBeforeYest, 'ไม่มี Finding ที่ปิดเมื่อวานซืน')}</div>
            <h3 style="margin:16px 0 8px;">🔴 Finding ระดับ High/Critical วันนี้</h3>
            <div id="briefFindHighList">${briefFindingCardGridHtml(highCritToday, 'ไม่มี Finding ระดับ High/Critical วันนี้')}</div>
          </div>`,
          afterRender(){
            wireBriefFindingClicks('briefFindNewList', foundToday);
            wireBriefFindingClicks('briefFindClosedList', closedToday);
            wireBriefFindingClicks('briefFindNewYestList', foundYest);
            wireBriefFindingClicks('briefFindClosedYestList', closedYest);
            wireBriefFindingClicks('briefFindNewBeforeYestList', foundBeforeYest);
            wireBriefFindingClicks('briefFindClosedBeforeYestList', closedBeforeYest);
            wireBriefFindingClicks('briefFindHighList', highCritToday);
            destroyChart('bsca'); destroyChart('bsct');
            const catAllEl = document.getElementById('briefChartCategoryAll');
            if(catAllEl) chartInstances.bsca = new Chart(catAllEl, { type:'bar', data:{ labels:catOrderedAll.map(x=>x[0]), datasets:[{ data:catOrderedAll.map(x=>x[1]), backgroundColor:'#2563EB' }] }, options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ autoSkip:false } } } } });
            const catTodayEl = document.getElementById('briefChartCategoryToday');
            if(catTodayEl) chartInstances.bsct = new Chart(catTodayEl, {
              type:'bar',
              data:{
                labels: catLabelsDaily,
                datasets:[
                  { label:'วันนี้ (' + today + ')', data: catLabelsDaily.map(c=>catMapToday[c]||0), backgroundColor:'#F97316' },
                  { label:'เมื่อวาน (' + yesterday + ')', data: catLabelsDaily.map(c=>catMapYest[c]||0), backgroundColor:'#FBBF24' },
                  { label:'เมื่อวานซืน (' + dayBeforeYesterday + ')', data: catLabelsDaily.map(c=>catMapBeforeYest[c]||0), backgroundColor:'#FDE68A' },
                ]
              },
              options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{boxWidth:10, font:{size:10}}}}, scales:{ y:{ ticks:{ autoSkip:false } } } }
            });
          }
        };

        // ---- Slide 3: Environment (weekly, Monday-cutoff, full data + photos, เลือกสัปดาห์ที่ผ่านมาได้) ----
        const envSum = (r) => ENV_CATEGORIES.reduce((s,c)=> s + (Number(r[c.key])||0), 0);
        const envByDate = (d) => envData.find(r => r.report_date === d) || {};
        const envToday = envByDate(today), envYest = envByDate(yesterday);
        const envCurrentWeekEnd = mondayOfWeek(today);
        const envWeekOptionEnds = [];
        for(let i=0;i<13;i++){ envWeekOptionEnds.push(addDays(envCurrentWeekEnd, -7*i)); }
        let briefEnvSelectedWeekEnd = envCurrentWeekEnd;
        function envWeekRowsFor(weekEndIso){
          const weekStartIso = addDays(weekEndIso, -6);
          return envData.filter(r => r.report_date && r.report_date >= weekStartIso && r.report_date <= weekEndIso).sort((a,b)=> a.report_date < b.report_date ? -1 : 1);
        }
        function renderEnvWeekBlockHtml(weekEndIso){
          const weekStartIso = addDays(weekEndIso, -6);
          const weekRows = envWeekRowsFor(weekEndIso);
          const weekRowsDesc = weekRows.slice().reverse();
          const cardHtml = !weekRowsDesc.length ? '<div class="dash-note" style="margin-top:10px;">ยังไม่มีการกรอก Environment Record ในสัปดาห์ที่เลือก</div>' : weekRowsDesc.map(r=>{
            const urls = Array.isArray(r.photo_urls) ? r.photo_urls : [];
            return `
            <div class="dash-section" style="margin-bottom:10px;padding:12px 14px;">
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
                <span style="font-weight:700;color:var(--charcoal);font-family:var(--mono);">${escapeHtml(r.report_date)}</span>
                <span style="font-family:var(--mono);font-weight:700;color:var(--charcoal);">${Math.round(envSum(r)*100)/100} Kg รวม</span>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                ${ENV_CATEGORIES.map(c=>`<span class="pill loc">${escapeHtml(c.label)}: ${Math.round((Number(r[c.key])||0)*100)/100}</span>`).join('')}
              </div>
              ${r.remarks ? `<div class="dash-note" style="margin-bottom:8px;">📝 ${escapeHtml(r.remarks)}</div>` : ''}
              ${urls.length ? `<div class="photo-grid">${urls.map(u=>`<div class="photo-thumb"><img src="${u}" data-full="${u}"></div>`).join('')}</div>` : ''}
            </div>`;
          }).join('');
          return `
          <h3 style="margin:0 0 8px;">📊 ปริมาณขยะแยกตามประเภทรายวัน (${escapeHtml(weekStartIso)} – ${escapeHtml(weekEndIso)})</h3>
          <div class="chart-wrap" id="briefEnvWeekChartWrap" style="height:260px;margin-bottom:18px;">${weekRows.length ? '<canvas id="briefEnvWeekChart"></canvas>' : '<div class="dash-empty" style="padding:14px;">ยังไม่มีการกรอก Environment Record ในสัปดาห์ที่เลือก</div>'}</div>
          <h3 style="margin:14px 0 8px;">📅 รายละเอียดประจำสัปดาห์ที่เลือก (ตัดรอบวันจันทร์)</h3>
          <div id="briefEnvWeekCards">${cardHtml}</div>`;
        }
        function renderEnvWeekChart(weekEndIso){
          destroyChart('briefEnvWeek');
          const weekRows = envWeekRowsFor(weekEndIso);
          const envChartEl = document.getElementById('briefEnvWeekChart');
          if(!envChartEl) return;
          chartInstances.briefEnvWeek = new Chart(envChartEl, {
            type:'bar',
            data:{
              labels: weekRows.map(r=>r.report_date),
              datasets: ENV_CATEGORIES.map(c => ({ label:c.label, data: weekRows.map(r=>Number(r[c.key])||0), backgroundColor:c.color }))
            },
            options:{
              responsive:true, maintainAspectRatio:false,
              scales:{ x:{ stacked:true }, y:{ stacked:true, beginAtZero:true, title:{ display:true, text:'Kg' } } },
              plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{ size:10 } } } }
            }
          });
        }
        function renderEnvWeekView(weekEndIso){
          briefEnvSelectedWeekEnd = weekEndIso;
          const block = document.getElementById('briefEnvWeekBlock');
          if(block) block.innerHTML = renderEnvWeekBlockHtml(weekEndIso);
          renderEnvWeekChart(weekEndIso);
          document.querySelectorAll('#briefEnvWeekBlock .photo-thumb img').forEach(img => img.addEventListener('click', ()=> openLightbox(img.dataset.full, img)));
        }
        const slideEnv = {
          title:'Environment',
          html:`
          <div class="brief-slide-head"><div class="ic">♻️</div><div><h1>Environment</h1><div class="sub">ปริมาณขยะแยกตามประเภท (Kg)</div></div></div>
          <div class="brief-grid" style="margin-bottom:16px;">
            ${briefKpiCard('ขยะรวมทั้งหมด', Math.round(envSum(envToday)*100)/100, Math.round(envSum(envYest)*100)/100, 'Kg')}
            ${ENV_CATEGORIES.map(c => briefKpiCard(c.label, Math.round((Number(envToday[c.key])||0)*100)/100, Math.round((Number(envYest[c.key])||0)*100)/100, 'Kg')).join('')}
          </div>
          <div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
            <label style="font-size:12.5px;color:var(--muted);">เลือกสัปดาห์ที่จะดูข้อมูล:</label>
            <select id="briefEnvWeekPicker" class="kpi-input" style="width:auto;">
              ${envWeekOptionEnds.map((w,i)=>`<option value="${w}" ${w===briefEnvSelectedWeekEnd?'selected':''}>${weekLabel(w)}${i===0?' (สัปดาห์นี้ ยังไม่จบรอบ)':''}</option>`).join('')}
            </select>
          </div>
          <div id="briefEnvWeekBlock">${renderEnvWeekBlockHtml(briefEnvSelectedWeekEnd)}</div>`,
          afterRender(){
            document.querySelectorAll('#briefEnvWeekBlock .photo-thumb img').forEach(img => img.addEventListener('click', ()=> openLightbox(img.dataset.full, img)));
            renderEnvWeekChart(briefEnvSelectedWeekEnd);
            const picker = document.getElementById('briefEnvWeekPicker');
            if(picker) picker.addEventListener('change', e=>{ renderEnvWeekView(e.target.value); });
          }
        };

        // ---- Slide 4: Daily Report (manpower / equipment / weather / activities / progress / photos) ----
        const dailyByDate = (d) => dailyData.find(r => r.report_date === d) || null;
        const dToday = dailyByDate(today), dYest = dailyByDate(yesterday), dBeforeYest = dailyByDate(dayBeforeYesterday);
        const briefDailyRecordsByDate = {};
        [dToday, dYest, dBeforeYest].forEach(r=>{ if(r && r.report_date) briefDailyRecordsByDate[r.report_date] = r; });
        function openDailyReportPresentationModal(r){
          const dailyModule = MODULES.find(m => m.id === 'daily');
          if(!dailyModule) return;
          const urls = Array.isArray(r.photo_urls) ? r.photo_urls : [];
          const fieldsHtml = renderDetailFieldsHtml(dailyModule.fields, r, dailyModule);
          const extraHtml = dailyModule.detailExtra ? dailyModule.detailExtra(r) : '';
          const modal = document.getElementById('modalContent');
          modal.innerHTML = `
            <div class="modal-head"><h2>📋 Daily Report — ${escapeHtml(r.report_date || '')}</h2><button class="modal-close" id="modalCloseBtn">&times;</button></div>
            <div class="detail-grid">
              ${fieldsHtml}
              ${extraHtml}
              <div class="detail-field full detail-photos"><label>Photos</label>
                <div class="photo-grid">${urls.length ? urls.map(u=>`<div class="photo-thumb"><img src="${u}" data-full="${u}"></div>`).join('') : '<span class="photo-status">ยังไม่มีรูปภาพในรายการนี้</span>'}</div>
              </div>
            </div>`;
          const closeBtn = document.getElementById('modalCloseBtn');
          if(closeBtn) closeBtn.addEventListener('click', closeModal);
          modal.querySelectorAll('.photo-thumb img').forEach(img => img.addEventListener('click', ()=> openLightbox(img.dataset.full, img)));
          document.getElementById('modalBg').classList.add('show');
        }
        const manpowerOf = (r) => r ? (sumPersonnel(r.repco_personnel) + sumPersonnel(r.state_personnel_site) + sumPersonnel(r.state_personnel_workshop)) : 0;
        const equipOf = (r) => r ? sumPersonnel(r.equipment) : 0;
        const weatherLine = (r) => r ? [r.weather_0609,r.weather_0912,r.weather_1215,r.weather_1518].filter(Boolean).join(' / ') : '-';
        // ตัดขึ้นบรรทัดใหม่ทุกครั้งที่เจอ "-" ที่ใช้เป็นตัวคั่นรายการย่อย (มีช่องว่าง/ต้นบรรทัดนำหน้า) เพื่อให้อ่านเป็นรายการง่ายขึ้น
        function formatDashList(text){
          const raw = (text || '').toString();
          if(!raw.trim()) return '-';
          const normalized = raw.replace(/\r\n/g, '\n');
          const withBreaks = normalized.replace(/(^|\n|\s)-\s+/g, '$1\n- ');
          const lines = withBreaks.split('\n').map(l => l.trim()).filter(Boolean);
          return lines.map(l => escapeHtml(l)).join('<br>');
        }
        function dailyDetailBlockHtml(label, dateIso, r){
          if(!r) return `<div class="dash-section" style="margin-bottom:10px;"><div style="font-weight:700;color:var(--charcoal);margin-bottom:6px;">${escapeHtml(label)} (${escapeHtml(dateIso)})</div><div class="dash-note">⚠️ ยังไม่มีการกรอก Daily Report</div></div>`;
          const urls = Array.isArray(r.photo_urls) ? r.photo_urls : [];
          return `
          <div class="dash-section brief-daily-card" data-daily-date="${escapeHtml(r.report_date||dateIso)}" style="margin-bottom:10px;cursor:pointer;" title="คลิกเพื่อดูรายละเอียดทั้งหมดแบบเต็มหน้า">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
              <div style="font-weight:700;color:var(--charcoal);margin-bottom:8px;">${escapeHtml(label)} (${escapeHtml(r.report_date||dateIso)})</div>
              <div style="font-size:11.5px;color:var(--progress);white-space:nowrap;">ดูทั้งหมด ↗</div>
            </div>
            <div style="margin-bottom:6px;"><span class="pill loc">👨‍💼 กำลังคนรวม ${manpowerOf(r)}</span> <span class="pill loc">🚜 เครื่องจักร ${equipOf(r)}</span></div>
            <div style="font-size:12.5px;color:var(--muted);margin-bottom:6px;">🌤️ ${escapeHtml(weatherLine(r))}</div>
            <div style="margin-bottom:6px;line-height:1.6;"><b>🎯 กิจกรรม:</b><br>${formatDashList(r.activities)}</div>
            <div style="margin-bottom:8px;line-height:1.6;"><b>📊 Progress:</b><br>${formatDashList(r.progress_summary)}</div>
            ${urls.length ? `<div class="photo-grid">${urls.map(u=>`<div class="photo-thumb"><img src="${u}" data-full="${u}"></div>`).join('')}</div>` : '<div class="dash-note">ไม่มีรูปภาพ</div>'}
          </div>`;
        }
        const slideDaily = {
          title:'Daily Report',
          html:`
          <div class="brief-slide-head"><div class="ic">📋</div><div><h1>Daily Report</h1><div class="sub">กำลังคน · เครื่องจักร · กิจกรรม · Progress · รูปภาพ</div></div></div>
          <div class="brief-grid" style="margin-bottom:16px;">
            ${briefKpiCard('กำลังคนรวม', manpowerOf(dToday), manpowerOf(dYest), 'คน')}
            ${briefKpiCard('เครื่องจักร/อุปกรณ์', equipOf(dToday), equipOf(dYest), 'รายการ (รวมจำนวน)')}
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;">
            ${dailyDetailBlockHtml('วันนี้', today, dToday)}
            ${dailyDetailBlockHtml('เมื่อวาน', yesterday, dYest)}
            ${dailyDetailBlockHtml('เมื่อวานซืน', dayBeforeYesterday, dBeforeYest)}
          </div>`,
          afterRender(){
            document.querySelectorAll('#briefSlideBody [data-daily-date]').forEach(card => {
              card.addEventListener('click', (e)=>{
                if(e.target.closest('.photo-thumb')) return;
                const rec = briefDailyRecordsByDate[card.dataset.dailyDate];
                if(rec) openDailyReportPresentationModal(rec);
              });
            });
            document.querySelectorAll('#briefSlideBody .photo-thumb img').forEach(img => img.addEventListener('click', (e)=>{ e.stopPropagation(); openLightbox(img.dataset.full, img); }));
          }
        };

        // ---- Slide 5: Piling progress (+ Rig / Progress by Area / Geographic Distribution scatter) ----
        const pileByDate = (d) => pileData.filter(r => r.piled_date === d).length;
        const pilePending = pileData.filter(r=>r.status==='Pending').length;
        const pileCorrected = pileData.filter(r=>r.status==='Corrected').length;
        const BRIEF_STATUS_LIST = ['Completed','Pending','Corrected','Defected'];
        const BRIEF_STATUS_COLORS = { Completed:'#16A34A', Pending:'#F0A93B', Corrected:'#2563EB', Defected:'#DC2626' };
        const briefGeoPoints = pileData.filter(r => r.design_n != null && r.design_e != null);

        // Rig ที่ตอก & จำนวนต้นที่ตอกได้ (วันนี้ / เมื่อวาน)
        const briefRigCounts = (d) => { const m = {}; pileData.forEach(r=>{ if(r.piled_date === d && r.rig_code){ m[r.rig_code] = (m[r.rig_code]||0) + 1; } }); return m; };
        const briefRigToday = briefRigCounts(today), briefRigYest = briefRigCounts(yesterday);
        const briefRigKeys = Array.from(new Set([...Object.keys(briefRigToday), ...Object.keys(briefRigYest)])).sort();
        const briefRigRowsHtml = briefRigKeys.length ? briefRigKeys.map(rc => {
          const rigNoPair = RIG_RIG_CODE_MAP.find(p => p[1] === rc);
          const rigLabel = rigNoPair ? ('RIG.' + rigNoPair[0] + ' (' + rc + ')') : rc;
          return `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
            <div style="flex:0 0 140px;font-weight:700;color:var(--charcoal);font-family:var(--mono);">${escapeHtml(rigLabel)}</div>
            <div style="flex:1 1 auto;color:var(--muted);font-size:13px;">วันนี้: <span style="font-weight:700;color:#2563EB;">${briefRigToday[rc]||0}</span> ต้น &nbsp;·&nbsp; เมื่อวาน: <span style="font-weight:700;color:var(--muted);">${briefRigYest[rc]||0}</span> ต้น</div>
          </div>`;
        }).join('') : '<div class="dash-note">ยังไม่มีการตอกเสาเข็มวันนี้/เมื่อวาน</div>';

        // ความก้าวหน้าตามพื้นที่ (Progress by Area) — ไม่รวมเสาเข็มแซมในตัวหาร เหมือน Dashboard Piling
        const briefAreaKeys = Array.from(new Set(pileData.map(r=>r.area||'(ไม่ระบุ)'))).sort();
        const briefAreaProgressHtml = briefAreaKeys.map(a=>{
          const rowsForArea = pileData.filter(r => (r.area||'(ไม่ระบุ)') === a && !isReplacementPile(r));
          const cnt = rowsForArea.length;
          const done = rowsForArea.filter(r=>r.status==='Completed').length;
          const pct = cnt ? Math.round((done/cnt)*1000)/10 : 0;
          return `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
            <div style="flex:0 0 52px;font-weight:700;color:var(--charcoal);font-size:13px;">${escapeHtml(a)}</div>
            <div style="flex:1 1 auto;height:14px;background:#EEF1F4;border-radius:7px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#2563EB,#0EA394);border-radius:7px;"></div>
            </div>
            <div style="flex:0 0 50px;text-align:right;font-weight:700;color:#2563EB;font-size:13px;">${pct}%</div>
            <div style="flex:0 0 80px;text-align:right;color:var(--muted);font-size:12px;white-space:nowrap;">${done} / ${cnt}</div>
          </div>`;
        }).join('');

        // Geographic Distribution — Highlight (This Week / Last Week) &amp; Soon, ported from Dashboard Piling
        let briefGeoHiThisWeek = false, briefGeoHiLastWeek = false, briefGeoHiSoon = false;
        function briefIsoDate(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return y+'-'+m+'-'+dd; }
        function briefWeekRangeStr(offsetWeeks){
          const now = new Date();
          const day = now.getDay();
          const diffToMonday = (day === 0 ? -6 : 1 - day);
          const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + offsetWeeks*7);
          const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
          return { start: briefIsoDate(monday), end: briefIsoDate(sunday) };
        }
        function briefGeoPointToChartPoint(p){ return { x: p.design_e, y: p.design_n, pile_number: p.pile_number, area: p.area||'(ไม่ระบุ)', id: p.id, piled_date: p.piled_date||null, plan_date: p.plan_date||null }; }
        let briefGeoDateStart = '', briefGeoDateEnd = '', briefGeoAreaFilter = '';
        function briefGeoFilteredPoints(){
          return briefGeoPoints.filter(r => {
            if(briefGeoAreaFilter && (r.area || '(ไม่ระบุ)') !== briefGeoAreaFilter) return false;
            // เสาเข็มที่ยังไม่ตอกจริง (ไม่มี piled_date) ให้แสดงเสมอ ไม่ถูกกรองด้วยช่วงวันที่
            if(r.piled_date){
              if(briefGeoDateStart && r.piled_date < briefGeoDateStart) return false;
              if(briefGeoDateEnd && r.piled_date > briefGeoDateEnd) return false;
            }
            return true;
          });
        }
        function buildBriefGeoDatasets(points){
          return BRIEF_STATUS_LIST.map(status => {
            const pts = points.filter(r => r.status === status);
            if(!pts.length) return null;
            return {
              label: status,
              data: pts.map(briefGeoPointToChartPoint),
              backgroundColor: BRIEF_STATUS_COLORS[status],
              pointRadius: status === 'Defected' ? 5 : 3,
              pointHoverRadius: 7,
            };
          }).filter(Boolean);
        }
        function buildBriefGeoHighlightDatasets(){
          const out = [];
          const briefGeoPointsF = briefGeoFilteredPoints();
          if(briefGeoHiThisWeek || briefGeoHiLastWeek){
            const now = new Date();
            const todayStr = briefIsoDate(now);
            const yestDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()-1);
            const yesterdayStr = briefIsoDate(yestDate);
            const blueIds = new Set();
            if(briefGeoHiThisWeek){ briefGeoPointsF.forEach(r=>{ if(r.piled_date === todayStr || r.piled_date === yesterdayStr) blueIds.add(r.id); }); }
            const ranges = [];
            if(briefGeoHiThisWeek) ranges.push(briefWeekRangeStr(0));
            if(briefGeoHiLastWeek) ranges.push(briefWeekRangeStr(-1));
            const magentaPts = briefGeoPointsF.filter(r => r.piled_date && !blueIds.has(r.id) && ranges.some(rg => r.piled_date >= rg.start && r.piled_date <= rg.end));
            const bluePts = briefGeoPointsF.filter(r => blueIds.has(r.id));
            if(magentaPts.length) out.push({ label:'ตอกในสัปดาห์ที่เลือก', data: magentaPts.map(briefGeoPointToChartPoint), backgroundColor:'#D946EF', borderColor:'#9D174D', borderWidth:1.5, pointRadius:7, pointHoverRadius:9 });
            if(bluePts.length) out.push({ label:'ตอกวันนี้ / เมื่อวาน', data: bluePts.map(briefGeoPointToChartPoint), backgroundColor:'#2563EB', borderColor:'#1E3A8A', borderWidth:1.5, pointRadius:7, pointHoverRadius:9 });
          }
          if(briefGeoHiSoon){
            const thisWeek = briefWeekRangeStr(0), nextWeek = briefWeekRangeStr(1);
            const soonPts = briefGeoPointsF.filter(r => !r.piled_date && r.plan_date && r.plan_date >= thisWeek.start && r.plan_date <= nextWeek.end);
            if(soonPts.length) out.push({ label:'แผนตอกเร็วๆ นี้ (สัปดาห์นี้-หน้า)', data: soonPts.map(briefGeoPointToChartPoint), backgroundColor:'#F0A93B', borderColor:'#B7791F', borderWidth:1.5, pointRadius:7, pointHoverRadius:9 });
          }
          return out;
        }
        function briefRefreshGeoDatasets(baseDatasets){
          if(!chartInstances.briefPg) return;
          chartInstances.briefPg.data.datasets = baseDatasets.concat(buildBriefGeoHighlightDatasets());
          chartInstances.briefPg.update();
        }

        const slidePiling = {
          title:'งานเสาเข็ม',
          html:`
          <div class="brief-slide-head"><div class="ic">🔨</div><div><h1>ความคืบหน้างานเสาเข็ม</h1><div class="sub">Piling Progress &amp; Geographic Distribution</div></div></div>
          <div class="brief-grid" style="margin-bottom:14px;">
            ${briefKpiCard('ตอกเสาเข็มได้', pileByDate(today), pileByDate(yesterday), 'ต้น')}
            <div class="brief-kpi"><div class="lbl">สะสมทั้งหมด (ไม่รวมเสาเข็มแซม)</div><div class="cmp"><div><span class="v">${pilePct}%</span><span class="t">${pileCompleted} / ${pileTotalExclRepl} ต้น</span></div></div></div>
            <div class="brief-kpi"><div class="lbl">รอตอก / ตอกแซม</div><div class="cmp"><div><span class="v">${pilePending}</span><span class="t">รอตอก</span></div><div><span class="v" style="color:var(--muted);font-size:22px;">${pileCorrected}</span><span class="t">ตอกแซม</span></div></div></div>
          </div>
          <div>
            <div class="dash-section" style="margin-bottom:14px;">
              <h3 style="margin:0 0 8px;">🚜 Rig ที่ตอก &amp; จำนวนต้นที่ตอกได้</h3>
              ${briefRigRowsHtml}
            </div>
            <div class="dash-section" style="margin-bottom:14px;">
              <h3 style="margin:0 0 8px;">ความก้าวหน้าตามพื้นที่ (Progress by Area)</h3>
              ${briefAreaProgressHtml}
            </div>
            <div class="dash-section" id="briefPileGeoWrap" style="margin:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
                <h3 style="margin:0;">🗺️ Geographic Distribution — ตำแหน่งเสาเข็มตามพิกัดจริง (N/E)</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button type="button" class="btn btn-ghost" id="briefBtnGeoThisWeek">📅 This Week</button>
                  <button type="button" class="btn btn-ghost" id="briefBtnGeoLastWeek">📅 Last Week</button>
                  <button type="button" class="btn btn-ghost" id="briefBtnGeoSoon">🟡 Soon</button>
                  <button type="button" class="btn btn-ghost" id="briefBtnGeoFullscreen">⛶ เต็มจอ</button>
                </div>
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
                <label style="font-size:12.5px;color:var(--muted);">ช่วงวันที่ตอก:</label>
                <input type="date" id="briefGeoDateStartInput" class="kpi-input" style="width:auto;" value="${escapeHtml(briefGeoDateStart)}">
                <span style="color:var(--muted);font-size:12.5px;">ถึง</span>
                <input type="date" id="briefGeoDateEndInput" class="kpi-input" style="width:auto;" value="${escapeHtml(briefGeoDateEnd)}">
                <button type="button" class="btn btn-ghost" id="briefBtnGeoClearDate">ล้างช่วงวันที่</button>
                <label style="font-size:12.5px;color:var(--muted);margin-left:8px;">พื้นที่:</label>
                <select id="briefGeoAreaFilterInput" class="kpi-input" style="min-width:160px;">
                  <option value="">ทุกพื้นที่ (All Areas)</option>
                  ${briefAreaKeys.map(a=>`<option value="${escapeHtml(a)}" ${a===briefGeoAreaFilter?'selected':''}>${escapeHtml(a)}</option>`).join('')}
                </select>
              </div>
              <div class="chart-wrap" id="briefPileGeoCanvasWrap" style="height:320px;"><canvas id="briefPileGeoChart"></canvas></div>
            </div>
          </div>`,
          afterRender(){
            destroyChart('briefPg');
            let geoDatasets = buildBriefGeoDatasets(briefGeoFilteredPoints());
            const canvas = document.getElementById('briefPileGeoChart');
            if(!canvas) return;
            chartInstances.briefPg = new Chart(canvas, {
              type:'scatter',
              data:{ datasets: geoDatasets.concat(buildBriefGeoHighlightDatasets()) },
              options:{
                responsive:true, maintainAspectRatio:false,
                scales:{ x:{ title:{ display:true, text:'E' } }, y:{ title:{ display:true, text:'N' } } },
                plugins:{
                  legend:{
                    labels:{
                      generateLabels: (chart) => {
                        const items = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                        items.forEach(item => {
                          const ds = chart.data.datasets[item.datasetIndex];
                          item.text = (ds.label || '') + ' (' + (ds.data ? ds.data.length : 0) + ')';
                        });
                        return items;
                      }
                    }
                  },
                  tooltip:{ callbacks:{ label:(ctx)=> 'เสาเข็ม ' + ctx.raw.pile_number + (ctx.raw.area ? ' · ' + ctx.raw.area : '') + ' · ' + ctx.dataset.label } }
                }
              }
            });
            function applyBriefGeoFilters(){
              geoDatasets = buildBriefGeoDatasets(briefGeoFilteredPoints());
              briefRefreshGeoDatasets(geoDatasets);
            }
            const dateStartInput = document.getElementById('briefGeoDateStartInput');
            const dateEndInput = document.getElementById('briefGeoDateEndInput');
            const clearDateBtn = document.getElementById('briefBtnGeoClearDate');
            const areaFilterInput = document.getElementById('briefGeoAreaFilterInput');
            if(dateStartInput) dateStartInput.addEventListener('change', e=>{ briefGeoDateStart = e.target.value; applyBriefGeoFilters(); });
            if(dateEndInput) dateEndInput.addEventListener('change', e=>{ briefGeoDateEnd = e.target.value; applyBriefGeoFilters(); });
            if(clearDateBtn) clearDateBtn.addEventListener('click', ()=>{
              briefGeoDateStart = ''; briefGeoDateEnd = '';
              if(dateStartInput) dateStartInput.value = '';
              if(dateEndInput) dateEndInput.value = '';
              applyBriefGeoFilters();
            });
            if(areaFilterInput) areaFilterInput.addEventListener('change', e=>{ briefGeoAreaFilter = e.target.value; applyBriefGeoFilters(); });
            const btnThisWeek = document.getElementById('briefBtnGeoThisWeek');
            const btnLastWeek = document.getElementById('briefBtnGeoLastWeek');
            const btnSoon = document.getElementById('briefBtnGeoSoon');
            if(btnThisWeek){
              btnThisWeek.classList.toggle('active', briefGeoHiThisWeek);
              btnThisWeek.addEventListener('click', ()=>{ briefGeoHiThisWeek = !briefGeoHiThisWeek; btnThisWeek.classList.toggle('active', briefGeoHiThisWeek); briefRefreshGeoDatasets(geoDatasets); });
            }
            if(btnLastWeek){
              btnLastWeek.classList.toggle('active', briefGeoHiLastWeek);
              btnLastWeek.addEventListener('click', ()=>{ briefGeoHiLastWeek = !briefGeoHiLastWeek; btnLastWeek.classList.toggle('active', briefGeoHiLastWeek); briefRefreshGeoDatasets(geoDatasets); });
            }
            if(btnSoon){
              btnSoon.classList.toggle('active-soon', briefGeoHiSoon);
              btnSoon.addEventListener('click', ()=>{ briefGeoHiSoon = !briefGeoHiSoon; btnSoon.classList.toggle('active-soon', briefGeoHiSoon); briefRefreshGeoDatasets(geoDatasets); });
            }
            const briefGeoFsBtn = document.getElementById('briefBtnGeoFullscreen');
            if(briefGeoFsBtn){
              briefGeoFsBtn.addEventListener('click', ()=>{
                const wrap = document.getElementById('briefPileGeoWrap');
                const reqFs = wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.msRequestFullscreen;
                const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
                if(!document.fullscreenElement){ reqFs.call(wrap); } else { exitFs.call(document); }
              });
              document.addEventListener('fullscreenchange', ()=>{
                const wrap = document.getElementById('briefPileGeoWrap');
                if(!wrap) return;
                briefGeoFsBtn.textContent = document.fullscreenElement === wrap ? '⤡ ออกจากเต็มจอ' : '⛶ เต็มจอ';
                if(chartInstances.briefPg) setTimeout(()=> chartInstances.briefPg.resize(), 50);
              });
            }
          }
        };

        // ---- Slide 6: Concrete — เต็มรูปแบบ พอร์ตข้อมูลทั้งหมดมาจาก Dashboard Concrete + เพิ่มยอดรายวันแยกพื้นที่ พร้อมเลือกช่วงวันที่ ----
        const concByDate = (d) => concreteSummaryData.filter(r=>r.report_date===d).reduce((s,r)=> s + (Number(r.today_m3)||0), 0);
        const concReportByDate = (d) => concreteReportsData.find(r=>r.report_date===d) || null;
        const concManpowerOf = (r) => r ? ((r.foreman_count||0)+(r.safety_count||0)+(r.worker_count||0)+(r.other_count||0)) : 0;
        const concTotalPoured = concreteSummaryData.reduce((s,r)=> s + (Number(r.today_m3)||0), 0);
        const concAvgManpower = concreteReportsData.length ? (concreteReportsData.reduce((s,r)=> s + concManpowerOf(r), 0) / concreteReportsData.length).toFixed(1) : '0.0';
        // แถวล่าสุดต่อ structure_item_id (ใช้หา total_m3/plan_m3 สะสมล่าสุดของแต่ละรายการ เหมือน Dashboard Concrete)
        const concLatestByItem = {};
        concreteSummaryData.forEach(r=>{
          const cur = concLatestByItem[r.structure_item_id];
          if(!cur || r.report_date > cur.report_date) concLatestByItem[r.structure_item_id] = r;
        });
        const concLatestRows = Object.values(concLatestByItem);
        const concByLocationTotal = {};
        concLatestRows.forEach(r=>{ concByLocationTotal[r.location] = (concByLocationTotal[r.location]||0) + (Number(r.total_m3)||0); });
        const concLocEntries = Object.entries(concByLocationTotal).sort((a,b)=>b[1]-a[1]);
        const concMaxLoc = concLocEntries.length ? concLocEntries[0][1] : 0;
        const concByLocationHtml = concLocEntries.length ? concLocEntries.map(([loc, val])=>{
          const pct = concMaxLoc ? Math.round((val/concMaxLoc)*1000)/10 : 0;
          return `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
            <div style="flex:0 0 90px;font-weight:700;color:var(--charcoal);font-size:13px;">${escapeHtml(loc)}</div>
            <div style="flex:1 1 auto;height:14px;background:#EEF1F4;border-radius:7px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#0EA394,#2563EB);border-radius:7px;"></div>
            </div>
            <div style="flex:0 0 90px;text-align:right;font-weight:700;color:#0EA394;font-size:13px;">${Math.round(val*100)/100} m³</div>
          </div>`;
        }).join('') : '<div class="dash-note">ยังไม่มีข้อมูลปริมาณคอนกรีต</div>';
        const concWithPlan = concLatestRows.filter(r=> r.plan_m3 != null && r.plan_m3 > 0);
        const concCompletionSum = {}, concCompletionCnt = {};
        concWithPlan.forEach(r=>{
          concCompletionSum[r.location] = (concCompletionSum[r.location]||0) + (Number(r.finished_pct)||0);
          concCompletionCnt[r.location] = (concCompletionCnt[r.location]||0) + 1;
        });
        const concCompletionEntries = Object.keys(concCompletionSum).map(loc => [loc, Math.round(concCompletionSum[loc]/concCompletionCnt[loc])]);
        const concCompletionHtml = concCompletionEntries.length ? concCompletionEntries.map(([loc, pct])=>`
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
            <div style="flex:0 0 90px;font-weight:700;color:var(--charcoal);font-size:13px;">${escapeHtml(loc)}</div>
            <div style="flex:1 1 auto;height:14px;background:#EEF1F4;border-radius:7px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#2563EB,#16A34A);border-radius:7px;"></div>
            </div>
            <div style="flex:0 0 56px;text-align:right;font-weight:700;color:${pct>=100?'#16A34A':'#2563EB'};font-size:13px;">${pct}%</div>
          </div>`).join('') : '<div class="dash-note">ยังไม่ได้กำหนดปริมาณตามแผน (plan_m3) — อัปเดตแผนได้ที่ Supabase</div>';

        // ---- ปริมาณคอนกรีตรายวัน แยกตามพื้นที่/ชั้น พร้อมเลือกช่วงวันที่ ----
        const concItemMeta = {};
        concreteSummaryData.forEach(r=>{ concItemMeta[r.structure_item_id] = { location: r.location, plan_m3: r.plan_m3 }; });
        const concByAreaPlan = {};
        const concSeenPlanItem = {};
        Object.keys(concItemMeta).forEach(itemId=>{
          const meta = concItemMeta[itemId];
          const dedupeKey = meta.location + '::' + itemId;
          if(concSeenPlanItem[dedupeKey]) return;
          concSeenPlanItem[dedupeKey] = true;
          concByAreaPlan[meta.location] = (concByAreaPlan[meta.location] || 0) + (Number(meta.plan_m3) || 0);
        });
        const concReportDateById = {};
        concreteReportsData.forEach(r=>{ concReportDateById[r.id] = r.report_date; });
        const concAreaKeysAll = Array.from(new Set(Object.values(concItemMeta).map(m=>m.location))).sort();
        let concDateStart = '', concDateEnd = '';
        function concPourEntriesInRange(){
          return concretePourEntriesData.filter(pe=>{
            const d = concReportDateById[pe.report_id];
            if(!d) return false;
            if(concDateStart && d < concDateStart) return false;
            if(concDateEnd && d > concDateEnd) return false;
            return true;
          });
        }
        function renderConcAreaFloorTableHtml(entries){
          const byAreaFloor = {}, byAreaPoured = {};
          entries.forEach(pe=>{
            const meta = concItemMeta[pe.structure_item_id];
            if(!meta) return;
            const loc = meta.location, fl = pe.floor || 'ไม่ระบุชั้น', vol = Number(pe.poured_today_m3) || 0;
            byAreaFloor[loc] = byAreaFloor[loc] || {};
            byAreaFloor[loc][fl] = (byAreaFloor[loc][fl] || 0) + vol;
            byAreaPoured[loc] = (byAreaPoured[loc] || 0) + vol;
          });
          const locations = Object.keys(byAreaFloor).sort((a,b)=> (byAreaPoured[b]||0) - (byAreaPoured[a]||0));
          if(!locations.length) return '<div class="dash-note">ไม่มีข้อมูลการเทคอนกรีตในช่วงที่เลือก</div>';
          return `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:560px;">
              <thead>
                <tr style="background:#F7F9FB;">
                  <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">พื้นที่</th>
                  ${CONCRETE_FLOOR_OPTIONS.map(fl=>`<th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">${escapeHtml(fl)}</th>`).join('')}
                  <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;color:var(--charcoal);">Total (m³)</th>
                  <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">Plan (m³)</th>
                  <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">% สำเร็จ</th>
                </tr>
              </thead>
              <tbody>
                ${locations.map(loc=>{
                  const poured = byAreaPoured[loc] || 0;
                  const plan = concByAreaPlan[loc] || 0;
                  const pct = plan > 0 ? Math.round(poured/plan*100) : null;
                  return `<tr>
                    <td style="padding:7px 10px;border-bottom:1px solid var(--line);font-weight:600;color:var(--charcoal);white-space:nowrap;">${escapeHtml(loc)}</td>
                    ${CONCRETE_FLOOR_OPTIONS.map(fl=>`<td style="text-align:right;padding:7px 10px;border-bottom:1px solid var(--line);">${(byAreaFloor[loc][fl]!=null) ? Math.round(byAreaFloor[loc][fl]*100)/100 : '-'}</td>`).join('')}
                    <td style="text-align:right;padding:7px 10px;border-bottom:1px solid var(--line);font-weight:700;color:var(--charcoal);">${Math.round(poured*100)/100}</td>
                    <td style="text-align:right;padding:7px 10px;border-bottom:1px solid var(--line);color:var(--muted);">${plan > 0 ? (Math.round(plan*100)/100) : '-'}</td>
                    <td style="text-align:right;padding:7px 10px;border-bottom:1px solid var(--line);font-weight:700;color:${pct==null?'var(--muted)':(pct>=100?'var(--closed)':'var(--progress)')};">${pct==null ? '-' : pct + '%'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`;
        }
        function renderConcDailyByAreaTableHtml(entries){
          const dailyAreaMap = {};
          entries.forEach(pe=>{
            const meta = concItemMeta[pe.structure_item_id];
            if(!meta) return;
            const d = concReportDateById[pe.report_id];
            if(!d) return;
            const loc = meta.location, vol = Number(pe.poured_today_m3) || 0;
            dailyAreaMap[d] = dailyAreaMap[d] || {};
            dailyAreaMap[d][loc] = (dailyAreaMap[d][loc] || 0) + vol;
          });
          const dates = Object.keys(dailyAreaMap).sort();
          if(!dates.length) return '<div class="dash-note">ไม่มีข้อมูลการเทคอนกรีตในช่วงที่เลือก</div>';
          const datesDesc = dates.slice().reverse();
          const areasUsed = concAreaKeysAll.filter(a => dates.some(d => dailyAreaMap[d][a] != null));
          return `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:560px;">
              <thead>
                <tr style="background:#F7F9FB;">
                  <th style="text-align:left;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">วันที่</th>
                  ${areasUsed.map(a=>`<th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;">${escapeHtml(a)}</th>`).join('')}
                  <th style="text-align:right;padding:8px 10px;border-bottom:1.3px solid var(--line);white-space:nowrap;color:var(--charcoal);">Total (m³)</th>
                </tr>
              </thead>
              <tbody>
                ${datesDesc.map(d=>{
                  const row = dailyAreaMap[d];
                  const total = areasUsed.reduce((s,a)=> s + (row[a]||0), 0);
                  return `<tr>
                    <td style="padding:7px 10px;border-bottom:1px solid var(--line);font-weight:600;color:var(--charcoal);white-space:nowrap;">${escapeHtml(d)}</td>
                    ${areasUsed.map(a=>`<td style="text-align:right;padding:7px 10px;border-bottom:1px solid var(--line);">${row[a]!=null ? Math.round(row[a]*100)/100 : '-'}</td>`).join('')}
                    <td style="text-align:right;padding:7px 10px;border-bottom:1px solid var(--line);font-weight:700;color:var(--charcoal);">${Math.round(total*100)/100}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`;
        }
        const slideConcrete = {
          title:'งานคอนกรีต',
          html:`
          <div class="brief-slide-head"><div class="ic">🧱</div><div><h1>งานคอนกรีต</h1><div class="sub">ปริมาณเทคอนกรีต · กำลังคน · ยอดสะสมแยกตามพื้นที่</div></div></div>
          <div class="brief-grid" style="margin-bottom:14px;">
            ${briefKpiCard('ปริมาณเทคอนกรีต', Math.round(concByDate(today)*100)/100, Math.round(concByDate(yesterday)*100)/100, 'm³')}
            ${briefKpiCard('กำลังคนงานคอนกรีต', concManpowerOf(concReportByDate(today)), concManpowerOf(concReportByDate(yesterday)), 'คน')}
            <div class="brief-kpi"><div class="lbl">ปริมาณเทคอนกรีตสะสมทั้งหมด</div><div class="cmp"><div><span class="v">${Math.round(concTotalPoured*100)/100}</span><span class="t">m³</span></div></div><div class="t" style="margin-top:10px;">เฉลี่ยกำลังคน ${concAvgManpower} คน/วัน</div></div>
          </div>
          ${(!concReportByDate(today)) ? '<div class="dash-note" style="margin-bottom:14px;">⚠️ ยังไม่มีการกรอก Concrete Report ของวันนี้</div>' : ''}
          <div>
            <div class="dash-section" style="margin-bottom:14px;">
              <h3 style="margin:0 0 8px;">ยอดสะสมแยกตามพื้นที่ (m³)</h3>
              ${concByLocationHtml}
            </div>
            <div class="dash-section" style="margin-bottom:14px;">
              <h3 style="margin:0 0 8px;">% ความสำเร็จเทียบแผน แยกตามพื้นที่</h3>
              ${concCompletionHtml}
            </div>
            <div class="dash-section" style="margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
                <h3 style="margin:0;">ปริมาณคอนกรีตที่เทแต่ละวัน แยกตามพื้นที่ (m³)</h3>
                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                  <label style="font-size:12.5px;color:var(--muted);">ช่วงวันที่:</label>
                  <input type="date" id="briefConcDateStartInput" class="kpi-input" style="width:auto;">
                  <span style="color:var(--muted);font-size:12.5px;">ถึง</span>
                  <input type="date" id="briefConcDateEndInput" class="kpi-input" style="width:auto;">
                  <button type="button" class="btn btn-ghost" id="briefBtnConcClearDate">ล้างช่วงวันที่</button>
                </div>
              </div>
              <div class="dash-note" style="margin-bottom:8px;">ไม่เลือกช่วงวันที่ = แสดงทุกวันที่มีการเทคอนกรีต</div>
              <div id="briefConcDailyAreaWrap">${renderConcDailyByAreaTableHtml(concPourEntriesInRange())}</div>
            </div>
            <div class="dash-section" style="margin:0;">
              <h3 style="margin:0 0 8px;">ปริมาณคอนกรีตแยกตาม พื้นที่ × ชั้น (m³) — ตามช่วงวันที่ด้านบน</h3>
              <div id="briefConcAreaFloorWrap">${renderConcAreaFloorTableHtml(concPourEntriesInRange())}</div>
            </div>
          </div>`,
          afterRender(){
            const dateStartInput = document.getElementById('briefConcDateStartInput');
            const dateEndInput = document.getElementById('briefConcDateEndInput');
            const clearBtn = document.getElementById('briefBtnConcClearDate');
            function applyConcFilters(){
              const entries = concPourEntriesInRange();
              const dailyWrap = document.getElementById('briefConcDailyAreaWrap');
              const areaFloorWrap = document.getElementById('briefConcAreaFloorWrap');
              if(dailyWrap) dailyWrap.innerHTML = renderConcDailyByAreaTableHtml(entries);
              if(areaFloorWrap) areaFloorWrap.innerHTML = renderConcAreaFloorTableHtml(entries);
            }
            if(dateStartInput) dateStartInput.addEventListener('change', e=>{ concDateStart = e.target.value; applyConcFilters(); });
            if(dateEndInput) dateEndInput.addEventListener('change', e=>{ concDateEnd = e.target.value; applyConcFilters(); });
            if(clearBtn) clearBtn.addEventListener('click', ()=>{
              concDateStart = ''; concDateEnd = '';
              if(dateStartInput) dateStartInput.value = '';
              if(dateEndInput) dateEndInput.value = '';
              applyConcFilters();
            });
          }
        };

        const slides = [slideCover, slideSafety, slideEnv, slideDaily, slidePiling, slideConcrete];

        container.innerHTML = `
          <div id="briefStage" class="brief-stage">
            <div id="briefSlideBody" style="flex:1;"></div>
            <div class="brief-nav">
              <button type="button" class="btn btn-ghost" id="briefPrev">‹ ก่อนหน้า</button>
              <div class="brief-dots" id="briefDots"></div>
              <span style="display:flex;gap:8px;">
                <button type="button" class="btn btn-ghost" id="briefFullscreen">⛶ เต็มจอ</button>
                <button type="button" class="btn btn-ghost" id="briefNext">ถัดไป ›</button>
              </span>
            </div>
          </div>`;

        let briefIdx = 0;
        function renderBriefSlide(){
          document.getElementById('briefSlideBody').innerHTML = slides[briefIdx].html;
          document.getElementById('briefDots').innerHTML = slides.map((s,i)=>`<span class="brief-dot ${i===briefIdx?'active':''}" data-i="${i}" title="${escapeHtml(s.title)}"></span>`).join('');
          document.querySelectorAll('.brief-dot').forEach(d => d.addEventListener('click', ()=>{ briefIdx = Number(d.dataset.i); renderBriefSlide(); }));
          if(slides[briefIdx].afterRender) slides[briefIdx].afterRender();
        }
        renderBriefSlide();
        document.getElementById('briefPrev').addEventListener('click', ()=>{ briefIdx = (briefIdx - 1 + slides.length) % slides.length; renderBriefSlide(); });
        document.getElementById('briefNext').addEventListener('click', ()=>{ briefIdx = (briefIdx + 1) % slides.length; renderBriefSlide(); });
        document.addEventListener('keydown', function briefKeyNav(e){
          if(!document.getElementById('briefStage')){ document.removeEventListener('keydown', briefKeyNav); return; }
          if(e.key === 'ArrowRight') document.getElementById('briefNext').click();
          if(e.key === 'ArrowLeft') document.getElementById('briefPrev').click();
        });
        document.getElementById('briefFullscreen').addEventListener('click', ()=>{
          const el = document.getElementById('briefStage');
          const reqFs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
          if(reqFs) reqFs.call(el);
        });
      }
    },
    {
      id:'dash_schedule', label:'Project Schedule (Gantt)', icon:'📅', table:'project_schedule_activities',
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        let data;
        try{
          data = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_activities?select=*&order=sort_order.asc');
        }catch(e){ container.innerHTML = '<div class="dash-empty">โหลดข้อมูลไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; return; }
        if(!data.length){ container.innerHTML = '<div class="dash-empty">ยังไม่มีข้อมูล Project Schedule — กรุณารันไฟล์ SQL นำเข้าข้อมูลก่อน (project_schedule_schema_and_data.sql)</div>'; return; }
        let subActs = [];
        try{
          subActs = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_sub_activities?select=*&order=sort_order.asc');
        }catch(e){ subActs = []; } // ตารางนี้เพิ่มเข้ามาทีหลัง — ถ้ายังไม่รัน SQL ก็ไม่ต้องพัง แค่ไม่มี sub activities

        // ประวัติ %Progress ต่อวัน (สำหรับกราฟ S-Curve) — ตารางนี้เพิ่มทีหลัง ถ้ายังไม่รัน SQL ก็ข้ามไปเงียบๆ ไม่กระทบ dashboard อื่น
        let progressHistory = [];
        try{
          progressHistory = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_progress_history?select=*&order=snapshot_date.asc');
          // บันทึกภาพรวม %Progress ของวันนี้ทับเข้าไปอัตโนมัติทุกครั้งที่เปิดหน้านี้ (upsert ตาม task_code+snapshot_date)
          // ทำให้กราฟ Actual ค่อยๆสร้างประวัติจริงขึ้นเองไปเรื่อยๆ โดยไม่ต้องกดปุ่มบันทึกเอง
          const todaySnap = todayISO();
          const snapPayload = data.map(r=>({ task_code:r.task_code, snapshot_date:todaySnap, progress_pct:r.progress_pct, weight_factor:r.weight_factor, package:r.package, discipline:r.discipline, area:r.area }));
          fetch(SUPABASE_URL + '/rest/v1/project_schedule_progress_history?on_conflict=task_code,snapshot_date', {
            method:'POST', headers: { ...HEADERS, 'Prefer':'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify(snapPayload)
          }).catch(()=>{});
          progressHistory = progressHistory.filter(h=>h.snapshot_date !== todaySnap).concat(snapPayload);
        }catch(e){ progressHistory = []; }
        const progressHistoryByDate = new Map();
        progressHistory.forEach(h=>{
          if(!progressHistoryByDate.has(h.snapshot_date)) progressHistoryByDate.set(h.snapshot_date, []);
          progressHistoryByDate.get(h.snapshot_date).push(h);
        });

        // จุดข้อมูล Actual ย้อนหลังที่กรอกด้วยมือ (เผื่อกรณีไม่มี snapshot อัตโนมัติของวันนั้นๆ เพราะเพิ่งเริ่มเก็บ history)
        // เก็บเป็นค่า %รวมต่อ Package (ไม่แยกราย Activity) — key package='' หมายถึงค่าสำหรับตัวกรอง Package = "ทั้งหมด"
        let scurveManualPoints = [];
        try{
          scurveManualPoints = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_scurve_manual_points?select=*&order=snapshot_date.asc');
        }catch(e){ scurveManualPoints = []; } // ตารางนี้เพิ่มเข้ามาทีหลัง — ถ้ายังไม่รัน SQL ก็ไม่ต้องพัง แค่ยังแก้ย้อนหลังไม่ได้
        function currentScurvePkgKey(){ return (schFilters.pkg && schFilters.pkg!=='all') ? schFilters.pkg : ''; }
        function currentScurvePhaseKey(){ return (schFilters.disc && schFilters.disc!=='all') ? schFilters.disc : ''; }
        function manualPointsFor(pkgKey, phaseKey){ return scurveManualPoints.filter(p=> (p.package||'')===pkgKey && (p.phase||'')===phaseKey); }
        function isScurveAggregateFilter(){
          // Package + Phase (ทั้งคู่เลือกได้ทั้ง "ทั้งหมด" หรือเจาะจงอย่างใดอย่างหนึ่ง) ยังนับเป็นระดับที่กรอกข้อมูลย้อนหลังได้
          // แต่ต้องไม่กรองแคบกว่านั้น (Discipline ย่อย/Area/สถานะ/ค้นหา ต้องเป็น "ทั้งหมด")
          return schFilters.wbsDisc==='all' && schFilters.area==='all' && !schFilters.q && schFilters.statusSet.size===ALL_STATUS_OPTS.length;
        }
        // ใช้สูตรถ่วงน้ำหนักแบบเดียวกับ "Overall Progress (Weighted)" ใน S-Curve ได้ ต่อเมื่อ (1) กรองแคบสุดแค่ระดับ
        // Package/Phase เหมือนฟีเจอร์กรอกย้อนหลังด้วยมือ และ (2) เลือก Package เจาะจงแล้ว (สูตรนี้คำนวณทีละ Package)
        function scurveWeightedModeAvailable(){
          return isScurveAggregateFilter() && !!(schFilters.pkg && schFilters.pkg!=='all');
        }
        function scurvePhaseKeyForCalc(){ return (schFilters.disc && schFilters.disc!=='all') ? schFilters.disc : 'all'; }

        const STATUS_COLORS = { 'Not Started':'#94A3B8', 'In Progress':'#2563EB', 'Completed':'#16A34A' };
        const ZOOM_LEVELS = { day:22, week:8, month:2.6, quarter:1 };
        let schLabelColW = 300;
        const HEADER_H = 36;
        const GROUP_ROW_H = 30;
        const TASK_ROW_H = 40;
        const AREA_LABEL = {
          COM:'Common / Overall', WSB:'Workshop Building', WHA:'Warehouse A', WHB:'Warehouse B',
          MPB:'Multi-Purpose Building', TLB:'Toilet Building', GHB:'Guard House Building',
          ROD:'Road, Paving & Car Parking', EXT:'Existing Area (Demolition)', FEN:'Fence & Retaining Wall',
          DRA:'Drainage System', SPL:'Sampling Unit'
        };
        let schZoom = 'month';
        let schViewMode = 'gantt'; // 'gantt' | 'table' | 'scurve'
        let lastFiltered = [];
        const schCollapsed = new Set();
        const schExpandedSub = new Set(); // task_code ที่กำลังเปิดดู Sub Activities
        const schFilters = { pkg:'PKG1', disc:'CON', wbsDisc:'all', area:'all', statusSet: new Set(['Not Started','In Progress','Completed','Delay']), q:'', groupBy1:'area', groupBy2:'wbs_discipline', sortBy:'task_code' };
        const ALL_STATUS_OPTS = ['Not Started','In Progress','Completed','Delay'];
        function isRowDelayed(r){
          if(r.status_code === 'Completed') return false;
          if(!r.end_date) return false;
          return todayISO() > r.end_date;
        }
        function updateStatusBtnLabel(){
          const btn = document.getElementById('schStatusBtn');
          if(!btn) return;
          const n = schFilters.statusSet.size;
          if(n === ALL_STATUS_OPTS.length) btn.textContent = 'ทั้งหมด ▾';
          else if(n === 0) btn.textContent = 'ไม่มี ▾';
          else btn.textContent = Array.from(schFilters.statusSet).join(', ') + ' ▾';
        }
        const SUB_HEADER_H = 28, SUB_ROW_H = 30, SUB_FOOTER_H = 48;

        const subActByTask = new Map();
        subActs.forEach(s=>{
          if(!subActByTask.has(s.task_code)) subActByTask.set(s.task_code, []);
          subActByTask.get(s.task_code).push(s);
        });
        subActByTask.forEach(arr=> arr.sort((a,b)=> (Number(a.sort_order)||0) - (Number(b.sort_order)||0)));

        function effectivePoc(s){
          if(s.poc_manual !== null && s.poc_manual !== undefined && s.poc_manual !== ''){
            return Math.max(0, Math.min(100, Number(s.poc_manual)));
          }
          const est = Number(s.estimate_boq) || 0;
          const act = Number(s.actual_boq) || 0;
          return est > 0 ? Math.max(0, Math.min(100, (act/est)*100)) : 0;
        }
        function rollupPoc(subRows){
          const totalW = subRows.reduce((acc,r)=> acc + (Number(r.weight_factor)||0), 0);
          if(totalW <= 0) return null;
          const sum = subRows.reduce((acc,r)=> acc + (Number(r.weight_factor)||0) * effectivePoc(r), 0);
          return sum / totalW;
        }
        function subPanelHeight(n){ return SUB_HEADER_H + n*SUB_ROW_H + SUB_FOOTER_H; }
        function addSubActivityLocal(s){
          subActs.push(s);
          if(!subActByTask.has(s.task_code)) subActByTask.set(s.task_code, []);
          subActByTask.get(s.task_code).push(s);
        }
        function removeSubActivityLocal(id){
          const idx = subActs.findIndex(x=> String(x.id)===String(id));
          if(idx>=0) subActs.splice(idx,1);
          subActByTask.forEach(arr=>{
            const i2 = arr.findIndex(x=> String(x.id)===String(id));
            if(i2>=0) arr.splice(i2,1);
          });
        }
        function updateToggleAllSubBtn(){
          const btn = document.getElementById('schToggleAllSub');
          if(!btn) return;
          const codes = Array.from(subActByTask.keys());
          const allExpanded = codes.length>0 && codes.every(c=>schExpandedSub.has(c));
          btn.textContent = allExpanded ? '🔽 ซ่อน Sub Activities ทั้งหมด' : '▶️ แสดง Sub Activities ทั้งหมด';
          btn.classList.toggle('active', allExpanded);
          btn.disabled = codes.length===0;
          btn.title = codes.length===0 ? 'ยังไม่มี Sub Activity ในตารางนี้' : (allExpanded ? 'ซ่อน panel Sub Activities ของทุกงาน' : 'เปิด panel Sub Activities ของทุกงานที่มีข้อมูล');
        }

        const packages = Array.from(new Set(data.map(r=>r.package).filter(Boolean))).sort();
        const disciplines = Array.from(new Set(data.map(r=>r.discipline).filter(Boolean))).sort();
        const areas = Array.from(new Set(data.map(r=>r.area).filter(Boolean))).sort();
        const discLabelMap = {}; data.forEach(r=>{ if(r.discipline) discLabelMap[r.discipline] = r.discipline_label || r.discipline; });
        const areaLabel = (a) => AREA_LABEL[a] || a;
        // งานหลัก (Discipline) ตาม Summary Construction Report — ค่าเริ่มต้น (fallback ถ้ายังไม่รัน SQL หรือ Package นั้นยังไม่มีแถวของตัวเอง)
        // ค่าจริงต่อ "Package" โหลดจากตาราง project_schedule_wbs_weights ด้านล่าง — แต่ละ Package (PKG1/PKG2/PKG3...) ตั้งค่า Discipline/Weight เป็นอิสระจากกัน
        // แก้ % และเพิ่ม/ลบ Discipline ของแต่ละ Package ได้จากปุ่ม "⚙️ Discipline / Weight" ในทูลบาร์
        const WBS_WEIGHTS_DEFAULT = {
          'Site Preparation Work': 1,
          'Piling Work': 15,
          'Concrete Structure Work': 67,
          'Steel Structure Work': 12,
          'Sanitary Work': 1,
          'Electrical Structure': 4
        };
        const WBS_ORDER_DEFAULT = Object.keys(WBS_WEIGHTS_DEFAULT);
        let wbsWeightRows = [];
        try{
          wbsWeightRows = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_wbs_weights?select=*&order=sort_order.asc.nullslast,id.asc');
        }catch(e){ wbsWeightRows = []; } // ตารางนี้เพิ่มเข้ามาทีหลัง — ถ้ายังไม่รัน SQL ก็ใช้ค่าเริ่มต้นข้างบนไปก่อนทุก Package
        let WBS_WEIGHTS_BY_PKG = {};
        let WBS_ORDER_BY_PKG = {};
        wbsWeightRows.forEach(r=>{
          const pkgKey = r.package || '';
          if(!WBS_WEIGHTS_BY_PKG[pkgKey]){ WBS_WEIGHTS_BY_PKG[pkgKey] = {}; WBS_ORDER_BY_PKG[pkgKey] = []; }
          WBS_WEIGHTS_BY_PKG[pkgKey][r.discipline] = Number(r.weight)||0;
          WBS_ORDER_BY_PKG[pkgKey].push(r.discipline);
        });
        function wbsWeightsFor(pkg){ return WBS_WEIGHTS_BY_PKG[pkg] || WBS_WEIGHTS_DEFAULT; }
        function wbsOrderFor(pkg){ return WBS_ORDER_BY_PKG[pkg] || WBS_ORDER_DEFAULT; }
        function wbsAllDisciplineNames(){
          return Array.from(new Set(WBS_ORDER_DEFAULT.concat(packages.flatMap(p=>wbsOrderFor(p)))));
        }
        function wbsRowId(pkg, disc){
          const r = wbsWeightRows.find(x=> x.package===pkg && x.discipline===disc);
          return r ? r.id : null;
        }
        let wbsDisciplinesPresent = Array.from(new Set(packages.flatMap(p=>wbsOrderFor(p)))).filter(k=> data.some(r=>r.wbs_discipline===k));
        function wbsLabel(val){
          if(!val) return '(ไม่ระบุ)';
          if(schFilters.pkg && schFilters.pkg!=='all'){
            const w = wbsWeightsFor(schFilters.pkg);
            if(w[val]!==undefined) return `${val} (${w[val]}%)`;
          }
          return val;
        }
        // เวอร์ชัน "generic" ของสูตรถ่วงน้ำหนักตาม Discipline/Phase — รับ getPct(row) แทนการอ่าน r.progress_pct ตรงๆ
        // ใช้ทั้งกับข้อมูลปัจจุบัน (การ์ด KPI) และกับ S-Curve (แผน/จริงย้อนหลัง) เพื่อให้สูตรตรงกันเป๊ะทุกที่ที่แสดงผล
        function weightedAvgWithAccessor(rows, getPct){
          let totalW = 0, totalWP = 0;
          rows.forEach(r=>{
            const w = Number(r.weight_factor)||0;
            if(w<=0) return;
            const p = getPct(r);
            if(p===null || p===undefined) return;
            totalW += w; totalWP += w*p;
          });
          return totalW>0 ? totalWP/totalW : null;
        }
        function computeWeightedWbsProgressGeneric(pkg, rows, getPct){
          const conRows = rows.filter(r=> String(r.task_code).split('.')[0]==='CON' && r.wbs_discipline && (!pkg || r.package===pkg));
          if(!conRows.length) return null;
          const order = wbsOrderFor(pkg);
          const weights = wbsWeightsFor(pkg);
          let total = 0, weightUsed = 0;
          order.forEach(disc=>{
            const rowsInDisc = conRows.filter(r=>r.wbs_discipline===disc);
            if(!rowsInDisc.length) return;
            const avgPct = weightedAvgWithAccessor(rowsInDisc, getPct);
            if(avgPct===null) return;
            total += avgPct * (weights[disc]/100);
            weightUsed += weights[disc];
          });
          if(weightUsed<=0) return null;
          return { pct: total, weightUsed };
        }
        function computeWeightedWbsProgress(pkg){
          return computeWeightedWbsProgressGeneric(pkg, data, r=> Number(r.progress_pct)||0);
        }

        // Phase (CON/PRO/ENG/ASB/MIL/PAC — เรียกว่า "Phase" ในแอป คือฟิลด์ discipline เดิม) + Weight % ต่อ Package
        // แยกอีกชั้นจาก Discipline (ซึ่งเป็น Weight *ภายใน* Phase "CON" เท่านั้น) — ใช้รวมทุก Phase เข้า Overall Progress สุดท้าย
        const PHASE_WEIGHTS_DEFAULT = { 'CON': 100 };
        const PHASE_ORDER_DEFAULT = Object.keys(PHASE_WEIGHTS_DEFAULT);
        let phaseWeightRows = [];
        try{
          phaseWeightRows = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_phase_weights?select=*&order=sort_order.asc.nullslast,id.asc');
        }catch(e){ phaseWeightRows = []; } // ตารางนี้เพิ่มเข้ามาทีหลัง — ถ้ายังไม่รัน SQL ก็ถือว่า CON = 100% ของทุก Package (เหมือนพฤติกรรมเดิมก่อนมี Phase Weight)
        let PHASE_WEIGHTS_BY_PKG = {};
        let PHASE_ORDER_BY_PKG = {};
        phaseWeightRows.forEach(r=>{
          const pkgKey = r.package || '';
          if(!PHASE_WEIGHTS_BY_PKG[pkgKey]){ PHASE_WEIGHTS_BY_PKG[pkgKey] = {}; PHASE_ORDER_BY_PKG[pkgKey] = []; }
          PHASE_WEIGHTS_BY_PKG[pkgKey][r.phase] = Number(r.weight)||0;
          PHASE_ORDER_BY_PKG[pkgKey].push(r.phase);
        });
        function phaseWeightsFor(pkg){ return PHASE_WEIGHTS_BY_PKG[pkg] || PHASE_WEIGHTS_DEFAULT; }
        function phaseOrderFor(pkg){ return PHASE_ORDER_BY_PKG[pkg] || PHASE_ORDER_DEFAULT; }
        function phaseRowId(pkg, phase){
          const r = phaseWeightRows.find(x=> x.package===pkg && x.phase===phase);
          return r ? r.id : null;
        }
        // % ความคืบหน้าของ Phase หนึ่งใน Package หนึ่ง — CON ใช้สูตรถ่วงน้ำหนักตาม Discipline (เหมือนเดิม), Phase อื่นถ่วงน้ำหนักด้วย Weight Factor ของ Activity ตรงๆ ไม่มีชั้น Discipline ย่อย
        function computePhaseProgressGeneric(pkg, phase, rows, getPct){
          if(phase === 'CON') return computeWeightedWbsProgressGeneric(pkg, rows, getPct);
          const phaseRows2 = rows.filter(r=> r.package===pkg && r.discipline===phase);
          if(!phaseRows2.length) return null;
          const avg = weightedAvgWithAccessor(phaseRows2, getPct);
          if(avg===null) return null;
          return { pct: avg, weightUsed: 100 };
        }
        function computePhaseProgress(pkg, phase){
          return computePhaseProgressGeneric(pkg, phase, data, r=> Number(r.progress_pct)||0);
        }
        // Overall Progress ของ Package หนึ่ง = รวมทุก Phase ถ่วงน้ำหนักด้วย % Phase Weight ของ Package นั้น
        function computeOverallProgressGeneric(pkg, rows, getPct){
          const order = phaseOrderFor(pkg);
          const weights = phaseWeightsFor(pkg);
          let total = 0, weightUsed = 0;
          const parts = [];
          order.forEach(phase=>{
            const res = computePhaseProgressGeneric(pkg, phase, rows, getPct);
            const w = Number(weights[phase])||0;
            if(!res) return;
            total += res.pct * (w/100);
            weightUsed += w;
            parts.push({ phase, pct: res.pct, weight: w });
          });
          if(weightUsed<=0) return null;
          return { pct: total, weightUsed, parts };
        }
        function computeOverallProgress(pkg){
          return computeOverallProgressGeneric(pkg, data, r=> Number(r.progress_pct)||0);
        }
        function labelFor(key, val){
          if(key==='discipline') return discLabelMap[val] || val;
          if(key==='area') return areaLabel(val) + (val!=='(ไม่ระบุ)' ? ` (${val})` : '');
          if(key==='wbs_discipline') return wbsLabel(val);
          return val;
        }

        // full project date range (fixed regardless of filter, ทำให้แกนเวลาไม่ขยับเวลากรอง)
        const allDates = [];
        data.forEach(r=>{ if(r.start_date) allDates.push(r.start_date); if(r.end_date) allDates.push(r.end_date); });
        allDates.sort();
        const minDateStr = allDates[0], maxDateStr = allDates[allDates.length-1];
        const minDate = new Date(minDateStr + 'T00:00:00');
        const maxDate = new Date(maxDateStr + 'T00:00:00');
        const totalDays = Math.max(1, Math.round((maxDate - minDate) / 86400000) + 1);
        const dayOffset = (dstr) => Math.round((new Date(dstr+'T00:00:00') - minDate) / 86400000);

        // % ความคืบหน้าถ่วงน้ำหนักด้วย Weight Factor ของแต่ละ Activity ID — ใช้แทนการนับสัดส่วนงานที่เสร็จแบบเท่าๆกัน
        function weightedAvgProgress(rows){
          const totalW = rows.reduce((s,r)=> s + (Number(r.weight_factor)||0), 0);
          if(totalW <= 0) return 0;
          const sum = rows.reduce((s,r)=> s + (Number(r.weight_factor)||0) * (Number(r.progress_pct)||0), 0);
          return sum / totalW;
        }
        function computeKpi(rows){
          const total = rows.length;
          const msCount = rows.filter(r=>r.is_milestone).length;
          const completedCount = rows.filter(r=>r.status_code==='Completed').length;
          const inProgCount = rows.filter(r=>r.status_code==='In Progress').length;
          const notStartedCount = rows.filter(r=>r.status_code==='Not Started').length;
          const pctComplete = Math.round(weightedAvgProgress(rows)*10)/10;
          const ds = []; rows.forEach(r=>{ if(r.start_date) ds.push(r.start_date); if(r.end_date) ds.push(r.end_date); });
          ds.sort();
          const rangeStr = ds.length ? (ds[0] + ' → ' + ds[ds.length-1]) : '-';
          return { total, msCount, completedCount, inProgCount, notStartedCount, pctComplete, rangeStr };
        }
        function kpiHtml(rows){
          const k = computeKpi(rows);
          const wbsCards = packages.map(pkg=>{
            const w = computeOverallProgress(pkg);
            if(!w || !w.parts.length) return '';
            const breakdown = w.parts.map(p=> `${escapeHtml(discLabelMap[p.phase]||p.phase)} ${p.pct.toFixed(1)}%(น้ำหนัก${p.weight}%)`).join(' · ');
            return `<div class="dash-kpi"><div class="v" style="color:#7C3AED;">${w.pct.toFixed(2)}%</div><div class="l">Overall Progress (Weighted) — ${escapeHtml(pkg)}</div><div class="f">น้ำหนัก Phase ครบ ${w.weightUsed}%${w.weightUsed<100?' (ยังไม่ครบ 100%)':''}<br>${breakdown}</div></div>`;
          }).join('');
          return `
            <div class="dash-kpi"><div class="v">${k.total}</div><div class="l">Total Activities</div></div>
            <div class="dash-kpi"><div class="v" style="color:var(--closed);">${k.pctComplete}%</div><div class="l">% Complete (Weighted)</div><div class="f">${k.completedCount} / ${k.total} เสร็จแล้ว — ถ่วงน้ำหนักตาม Weight Factor</div></div>
            ${wbsCards}
            <div class="dash-kpi"><div class="v" style="color:#2563EB;">${k.inProgCount}</div><div class="l">In Progress</div></div>
            <div class="dash-kpi"><div class="v" style="color:#94A3B8;">${k.notStartedCount}</div><div class="l">Not Started</div></div>
            <div class="dash-kpi"><div class="v">${k.msCount}</div><div class="l">Milestones</div></div>
            <div class="dash-kpi"><div class="v" style="font-size:15px;">${escapeHtml(k.rangeStr)}</div><div class="l">Date Range (ตามตัวกรอง)</div></div>
          `;
        }

        container.innerHTML = `
          <div class="dash-kpi-row" id="schKpiRow">${kpiHtml(data)}</div>

          <div class="dash-section">
            <div class="gantt-toolbar">
              <div class="fld"><label>Package</label><select id="schPkg"><option value="all"${schFilters.pkg==='all'?' selected':''}>ทั้งหมด</option>${packages.map(p=>`<option value="${escapeHtml(p)}"${schFilters.pkg===p?' selected':''}>${escapeHtml(p)}</option>`).join('')}</select></div>
              <div class="fld"><label>Phase</label><select id="schDisc"><option value="all"${schFilters.disc==='all'?' selected':''}>ทั้งหมด</option>${disciplines.map(d=>`<option value="${escapeHtml(d)}"${schFilters.disc===d?' selected':''}>${escapeHtml(discLabelMap[d]||d)}</option>`).join('')}</select></div>
              <div class="fld"><label>Discipline (หมวดงานหลัก)</label><select id="schWbsDisc"><option value="all"${schFilters.wbsDisc==='all'?' selected':''}>ทั้งหมด</option>${wbsDisciplinesPresent.map(d=>`<option value="${escapeHtml(d)}"${schFilters.wbsDisc===d?' selected':''}>${escapeHtml(wbsLabel(d))}</option>`).join('')}</select></div>
              <div class="fld"><label>Area (Activity Group)</label><select id="schArea"><option value="all"${schFilters.area==='all'?' selected':''}>ทั้งหมด</option>${areas.map(a=>`<option value="${escapeHtml(a)}"${schFilters.area===a?' selected':''}>${escapeHtml(areaLabel(a))}</option>`).join('')}</select></div>
              <div class="fld sch-ms-fld">
                <label>Status</label>
                <button type="button" class="sch-ms-btn" id="schStatusBtn">ทั้งหมด ▾</button>
                <div class="sch-ms-panel" id="schStatusPanel" hidden>
                  <label><input type="checkbox" class="sch-status-cb" value="Not Started" checked> <i class="sch-ms-dot" style="background:#94A3B8;"></i> Not Started</label>
                  <label><input type="checkbox" class="sch-status-cb" value="In Progress" checked> <i class="sch-ms-dot" style="background:#2563EB;"></i> In Progress</label>
                  <label><input type="checkbox" class="sch-status-cb" value="Completed" checked> <i class="sch-ms-dot" style="background:#16A34A;"></i> Completed</label>
                  <label><input type="checkbox" class="sch-status-cb" value="Delay" checked> <i class="sch-ms-dot" style="background:#DC2626;"></i> Delay (เลยกำหนดยังไม่เสร็จ)</label>
                </div>
              </div>
              <div class="fld"><label>ค้นหา</label><input type="text" id="schSearch" placeholder="Task code / ชื่องาน / Sub Activity..." style="width:190px;"></div>
              <div class="fld"><label>จัดกลุ่มหลัก</label><select id="schGroupBy1"><option value="package">Package</option><option value="discipline">Phase</option><option value="wbs_discipline">Discipline (หมวดงานหลัก)</option><option value="area" selected>Area (Activity Group)</option><option value="none">ไม่จัดกลุ่ม</option></select></div>
              <div class="fld"><label>จัดกลุ่มย่อย</label><select id="schGroupBy2"><option value="none">ไม่มี</option><option value="package">Package</option><option value="discipline">Phase</option><option value="wbs_discipline" selected>Discipline (หมวดงานหลัก)</option><option value="area">Area (Activity Group)</option></select></div>
              <div class="fld"><label>เรียงลำดับ</label><select id="schSortBy"><option value="sort_order">ค่าเริ่มต้น (นำเข้า)</option><option value="task_code" selected>Activity ID</option><option value="start_date">Start Date</option><option value="end_date">Finish Date</option></select></div>
              <button class="gantt-sub-toggle-all" id="schToggleAllSub" type="button">แสดง Sub Activities ทั้งหมด</button>
              <div class="gantt-zoom-row">
                <button class="gantt-zoom-btn" data-zoom="day">วัน</button>
                <button class="gantt-zoom-btn" data-zoom="week">สัปดาห์</button>
                <button class="gantt-zoom-btn active" data-zoom="month">เดือน</button>
                <button class="gantt-zoom-btn" data-zoom="quarter">ไตรมาส</button>
              </div>
            </div>
            <div class="gantt-legend">
              <span><i style="background:#94A3B8;"></i> Not Started</span>
              <span><i style="background:#2563EB;"></i> In Progress</span>
              <span><i style="background:#16A34A;"></i> Completed</span>
              <span><i style="background:#F59E0B;border-radius:50%;"></i> Milestone</span>
              <span><i style="background:#DC2626;width:2px;"></i> วันนี้ / เส้น Progress</span>
              <span style="margin-left:auto;color:var(--muted);">กรอก <b style="color:#5B21B6;">Weight Factor</b> (สีม่วง) + % ความคืบหน้า แล้วกด 💾 เพื่อบันทึก — ระบบจะอัปเดตสถานะให้อัตโนมัติ (0% = Not Started, 1-99% = In Progress, 100% = Completed) และใช้ Weight Factor ถ่วงน้ำหนัก %Progress ของกลุ่ม/โปรเจกต์</span>
            </div>
            <div class="gantt-io-row">
              <button class="gantt-io-btn" id="schViewToggleBtn" type="button" title="สลับมุมมองระหว่าง Gantt Chart กับตารางข้อมูล">🗂 มุมมองตาราง</button>
              <button class="gantt-io-btn" id="schScurveToggleBtn" type="button" title="แสดงกราฟ S-Curve เทียบแผน (Planned) กับความคืบหน้าจริง (Actual) ตามตัวกรองปัจจุบัน">📈 S-Curve</button>
              <button class="gantt-io-btn gantt-io-btn-add" id="schAddTaskBtn" type="button" title="เพิ่ม Activity (Task) ใหม่เข้าตารางงาน">➕ เพิ่ม Activity ใหม่</button>
              <button class="gantt-io-btn" id="schWbsWeightBtn" type="button" title="แก้ % Weight ของแต่ละ Discipline หรือเพิ่ม/ลบ Discipline ที่ใช้คำนวณ Overall Progress (Weighted WBS)">⚙️ Discipline / Weight</button>
              <button class="gantt-io-btn" id="schPhaseWeightBtn" type="button" title="แก้ % Weight ของแต่ละ Phase (CON/PRO/ENG/ASB/...) หรือเพิ่ม/ลบ Phase ที่ใช้รวมเข้า Overall Progress">⚙️ Phase / Weight</button>
              <span class="gantt-io-sep"></span>
              <button class="gantt-io-btn" id="schExportCsvBtn" type="button" title="ส่งออก Activity หลัก ตามตัวกรองปัจจุบันเป็น CSV">⬇️ Export CSV</button>
              <button class="gantt-io-btn" id="schExportSubCsvBtn" type="button" title="ส่งออก Sub Activities (BOQ) ของ Activity ที่อยู่ในตัวกรองปัจจุบัน เป็น CSV">⬇️ Export Sub Activities CSV</button>
              <button class="gantt-io-btn" id="schExportXlsxBtn" type="button" title="ส่งออกเป็น Excel ไฟล์เดียว มี 2 sheet: Schedule (Activity หลัก) + Sub Activities">⬇️ Export Excel (2 sheets)</button>
              <button class="gantt-io-btn" id="schImportBtn" type="button" title="นำเข้าไฟล์ CSV/Excel เพื่ออัปเดต Activity หลัก และ/หรือ Sub Activities">⬆️ Import ข้อมูล (CSV/Excel)</button>
              <input type="file" id="schImportFile" accept=".csv,.xlsx,.xls" hidden>
              <span style="color:var(--muted);font-size:11.5px;">Export/Import สำหรับทีม Doc Control — ไฟล์ Activity หลักต้องมีคอลัมน์ <code>task_code</code>+<code>task_name</code> แก้ได้แค่ <code>weight_factor</code>/<code>progress_pct</code>, ไฟล์ Sub Activities ต้องมีคอลัมน์ <code>task_code</code> (จับคู่ Activity ID) — มี <code>id</code> = แก้ไขรายการเดิม, ไม่มี <code>id</code> = เพิ่มรายการใหม่ (Excel ที่ export มาจะมี 2 sheet แยกกันอัตโนมัติ)</span>
            </div>
            <div id="schGanttHost"></div>
          </div>
        `;

        function buildGroups(rows){
          const k1 = schFilters.groupBy1;
          const k2 = schFilters.groupBy2;
          if(k1 === 'none') return [{ key:'__all__', label:'กิจกรรมทั้งหมด', rows: rows, children: null }];
          const m1 = new Map();
          rows.forEach(r=>{
            const k = r[k1] || '(ไม่ระบุ)';
            if(!m1.has(k)) m1.set(k, []);
            m1.get(k).push(r);
          });
          return Array.from(m1.entries()).sort((a,b)=> String(a[0]).localeCompare(String(b[0]))).map(([k, rowsArr])=>{
            let children = null;
            if(k2 !== 'none' && k2 !== k1){
              const m2 = new Map();
              rowsArr.forEach(r=>{
                const k2v = r[k2] || '(ไม่ระบุ)';
                if(!m2.has(k2v)) m2.set(k2v, []);
                m2.get(k2v).push(r);
              });
              children = Array.from(m2.entries()).sort((a,b)=> String(a[0]).localeCompare(String(b[0]))).map(([k2v, subRows])=>({
                key: k + '::' + k2v, label: labelFor(k2, k2v), rows: subRows
              }));
            }
            return { key:k, label: labelFor(k1,k), rows: rowsArr, children };
          });
        }

        function buildTicks(pxPerDay){
          const ticks = [];
          if(schZoom === 'day'){
            for(let i=0;i<=totalDays;i++){
              const d = new Date(minDate); d.setDate(d.getDate()+i);
              const isMonthStart = d.getDate()===1;
              ticks.push({
                left: i*pxPerDay,
                label: isMonthStart ? (d.getDate() + ' ' + d.toLocaleDateString('en-US',{month:'short'})) : String(d.getDate()),
                strong: isMonthStart
              });
            }
          } else if(schZoom === 'week'){
            const cur = new Date(minDate);
            const dow = (cur.getDay()+6)%7; // 0=Mon
            cur.setDate(cur.getDate()-dow);
            while(cur <= maxDate){
              const off = Math.round((cur - minDate) / 86400000);
              ticks.push({ left: Math.max(0,off)*pxPerDay, label: cur.toLocaleDateString('en-US',{day:'2-digit',month:'short'}), strong: cur.getDate()<=7 });
              cur.setDate(cur.getDate()+7);
            }
          } else {
            const step = schZoom==='quarter' ? 3 : 1;
            const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
            while(cur <= maxDate){
              const off = Math.round((cur - minDate) / 86400000);
              ticks.push({ left: Math.max(0, off) * pxPerDay, label: cur.toLocaleDateString('en-US',{month:'short',year:'2-digit'}), strong: true });
              cur.setMonth(cur.getMonth()+step);
            }
          }
          return ticks;
        }

        function sortRows(rows){
          const key = schFilters.sortBy;
          const arr = rows.slice();
          if(key === 'sort_order' || !key){
            arr.sort((a,b)=> (Number(a.sort_order)||0) - (Number(b.sort_order)||0));
          } else if(key === 'task_code'){
            arr.sort((a,b)=> String(a.task_code||'').localeCompare(String(b.task_code||'')));
          } else {
            arr.sort((a,b)=>{
              const av = a[key], bv = b[key];
              if(!av && !bv) return 0;
              if(!av) return 1;
              if(!bv) return -1;
              return av < bv ? -1 : (av > bv ? 1 : 0);
            });
          }
          return arr;
        }

        function progressX(r, pxPerDay, todayLeft){
          if(r.is_milestone){
            const d = r.end_date || r.start_date;
            if(!d) return todayLeft;
            return dayOffset(d)*pxPerDay;
          }
          if(r.start_date && r.end_date){
            const sx = dayOffset(r.start_date)*pxPerDay;
            const ex = dayOffset(r.end_date)*pxPerDay;
            const pct = Math.max(0, Math.min(100, Number(r.progress_pct)||0)) / 100;
            return sx + (ex-sx)*pct;
          }
          return todayLeft;
        }

        // ลากเส้น zigzag เฉพาะงานที่ "กำลังทำอยู่จริง" (In Progress) เท่านั้น —
        // งานที่ยังไม่เริ่ม (Not Started) หรือเสร็จแล้ว (Completed) ไม่ต้องลากเส้นไปหา
        function isEligibleForProgressLine(r){
          return r.status_code === 'In Progress';
        }

        // ===== Table View / Export / Import (สำหรับทีม Doc Control) =====
        // บันทึกทุกคอลัมน์ของแถวในมุมมองตาราง (Activity ID/ชื่องาน/Package/Phase/Discipline/Area/Status/Weight/%Progress/Start/Finish)
        async function saveActivityRowFull(oldCode, f){
          let pct = Math.round(Number(f.pct) * 100) / 100;
          if(isNaN(pct)) pct = 0;
          pct = Math.max(0, Math.min(100, pct));
          let wf = Math.round(Number(f.wf) * 100) / 100;
          if(isNaN(wf) || wf < 0) wf = 0;
          const newCode = f.newCode;
          if(!newCode) throw new Error('Activity ID ห้ามว่าง');
          if(!f.name) throw new Error('ชื่องาน ห้ามว่าง');
          if(newCode !== oldCode && data.some(x=>x.task_code===newCode)) throw new Error('Activity ID "' + newCode + '" มีอยู่แล้วในระบบ');
          const status = TV_STATUS_OPTS.includes(f.statusSel) ? f.statusSel : (pct<=0?'Not Started':(pct>=100?'Completed':'In Progress'));
          const patch = {
            task_code: newCode, task_name: f.name, package: f.pkg || null,
            discipline: f.disc || null, discipline_label: f.disc || null,
            area: f.area || null, wbs_discipline: f.wbsDisc || null,
            status_code: status, weight_factor: wf, progress_pct: pct,
            start_date: f.start, end_date: f.end,
            updated_at: new Date().toISOString()
          };
          const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_activities?task_code=eq.' + encodeURIComponent(oldCode), {
            method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
            body: JSON.stringify(patch)
          });
          if(!res.ok){
            const hint = (newCode !== oldCode) ? ' — ถ้าเปลี่ยน Activity ID ที่มี Sub Activities ผูกอยู่ ต้องรัน SQL project_schedule_sub_activities_fk_cascade_update.sql ก่อน' : '';
            throw new Error('บันทึกไม่สำเร็จ (' + res.status + ')' + hint);
          }
          const row = data.find(x=>x.task_code===oldCode);
          if(row) Object.assign(row, patch);
          if(newCode !== oldCode){
            const subs = subActByTask.get(oldCode);
            if(subs){ subActByTask.delete(oldCode); subActByTask.set(newCode, subs); subs.forEach(s=> s.task_code = newCode); }
            subActs.forEach(s=>{ if(s.task_code===oldCode) s.task_code = newCode; });
            if(schExpandedSub.has(oldCode)){ schExpandedSub.delete(oldCode); schExpandedSub.add(newCode); }
          }
          return row;
        }

        async function deleteActivity(code, name){
          if(!confirm('ลบ Activity "' + code + (name ? ' — ' + name : '') + '" ออกจากตารางงาน?\nSub Activities ของงานนี้จะถูกลบไปด้วย และไม่สามารถกู้คืนได้')) return false;
          const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_activities?task_code=eq.' + encodeURIComponent(code), {
            method:'DELETE', headers: { ...HEADERS, 'Prefer':'return=minimal' }
          });
          if(!res.ok) throw new Error('ลบไม่สำเร็จ (' + res.status + ')');
          const idx = data.findIndex(x=>x.task_code===code);
          if(idx>=0) data.splice(idx,1);
          subActByTask.delete(code);
          for(let i=subActs.length-1;i>=0;i--){ if(subActs[i].task_code===code) subActs.splice(i,1); }
          schExpandedSub.delete(code);
          schCollapsed.delete(code);
          return true;
        }

        function refreshSchWbsDiscFilterOptions(){
          const selEl = document.getElementById('schWbsDisc');
          if(!selEl) return;
          const cur = schFilters.wbsDisc;
          selEl.innerHTML = '<option value="all"' + (cur==='all'?' selected':'') + '>ทั้งหมด</option>'
            + wbsDisciplinesPresent.map(d=>`<option value="${escapeHtml(d)}"${cur===d?' selected':''}>${escapeHtml(wbsLabel(d))}</option>`).join('');
        }

        function openWbsWeightsModal(){
          let modalPkg = (schFilters.pkg && schFilters.pkg!=='all' && packages.includes(schFilters.pkg)) ? schFilters.pkg : (packages[0] || '');
          const modal = document.getElementById('modalContent');
          function rowsHtmlFor(pkg){
            const weights = wbsWeightsFor(pkg);
            return wbsOrderFor(pkg).map(disc=>{
              const id = wbsRowId(pkg, disc);
              return `<div class="list-row wbsw-row" data-id="${id||''}" data-orig="${escapeHtml(disc)}">
                <input type="text" class="wbsw-name" value="${escapeHtml(disc)}" placeholder="ชื่อ Discipline">
                <input type="number" class="wbsw-weight" step="0.01" min="0" value="${Number(weights[disc])||0}">
                <button type="button" class="rm-row wbsw-del" title="ลบหมวดนี้">🗑</button>
              </div>`;
            }).join('');
          }
          function copyOptsHtml(){
            return ['<option value="">— เลือก Package —</option>'].concat(
              packages.filter(p=>p!==modalPkg).map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`)
            ).join('');
          }
          const pkgOptsHtml = packages.map(p=>`<option value="${escapeHtml(p)}"${p===modalPkg?' selected':''}>${escapeHtml(p)}</option>`).join('');
          modal.innerHTML = `
            <div class="modal-head"><h2>⚙️ Discipline (หมวดงานหลัก) / Weight %</h2><button class="modal-close" id="modalCloseBtn">&times;</button></div>
            <div class="form-grid">
              <div style="font-size:11.5px;color:var(--muted);">กำหนด Discipline และ % น้ำหนัก ที่ใช้คำนวณ "Overall Progress (Weighted WBS)" — <b>แต่ละ Package (PKG1/PKG2/PKG3...) มีชุด Discipline/Weight เป็นอิสระของตัวเอง ไม่ต้องเท่ากัน</b> — % ของแต่ละ Discipline คำนวณแยกกันเองภายใน Package นั้น (ถ่วงน้ำหนักด้วย Weight Factor ของ Activity ในหมวด+Package นั้น) แล้วนำไปคูณ % น้ำหนักนี้ก่อนรวมกัน รวมทุกหมวดของ Package เดียวกันควรได้ 100% พอดี</div>
              <div class="list-row">
                <label style="flex:0 0 90px;font-size:12.5px;color:var(--muted);align-self:center;">Package</label>
                <select id="wbswPkgSelect" style="flex:1 1 auto;">${pkgOptsHtml}</select>
              </div>
              <div class="list-row">
                <label style="flex:0 0 90px;font-size:12.5px;color:var(--muted);align-self:center;">คัดลอกจาก</label>
                <select id="wbswCopySelect" style="flex:1 1 auto;">${copyOptsHtml()}</select>
                <button type="button" class="btn btn-ghost" id="wbswCopyBtn" style="flex:0 0 auto;">คัดลอก</button>
              </div>
              <div class="list-rows" id="wbswList">${rowsHtmlFor(modalPkg)}</div>
              <button type="button" class="list-add-btn" id="wbswAddBtn">+ เพิ่ม Discipline</button>
              <div id="wbswTotal" style="font-size:13px;font-weight:600;"></div>
            </div>
            <div class="btn-row">
              <button class="btn btn-primary" id="wbswSaveBtn">บันทึก (Package นี้)</button>
              <button class="btn btn-ghost" id="wbswCancelBtn">ยกเลิก</button>
            </div>`;
          document.getElementById('modalBg').classList.add('show');
          document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
          document.getElementById('wbswCancelBtn').addEventListener('click', closeModal);
          function updateWbswTotal(){
            const total = Array.from(document.querySelectorAll('#wbswList .wbsw-weight')).reduce((sum,el)=> sum + (Number(el.value)||0), 0);
            const el = document.getElementById('wbswTotal');
            el.textContent = 'รวมทั้งหมด (' + modalPkg + '): ' + (Math.round(total*100)/100) + '%' + (Math.abs(total-100)>0.01 ? '  ⚠️ ควรเท่ากับ 100%' : '  ✅');
            el.style.color = Math.abs(total-100)>0.01 ? '#DC2626' : '#16A34A';
          }
          function wireDelBtn(btn){
            btn.addEventListener('click', ()=>{
              const row = btn.closest('.wbsw-row');
              const disc = row.dataset.orig;
              if(disc){
                const inUseCount = data.filter(r=>r.wbs_discipline===disc && r.package===modalPkg).length;
                if(inUseCount > 0 && !confirm('มี ' + inUseCount + ' Activity ใน Package ' + modalPkg + ' ที่ผูกกับหมวด "' + disc + '" อยู่ — ลบหมวดนี้แล้วงานเหล่านั้นจะไม่ถูกนับใน Overall Progress (Weighted WBS) ของ Package นี้ จนกว่าจะย้ายไปหมวดอื่น ยืนยันลบหรือไม่?')) return;
              }
              row.remove();
              updateWbswTotal();
            });
          }
          function wireAllDelBtns(){ document.querySelectorAll('#wbswList .wbsw-del').forEach(wireDelBtn); }
          wireAllDelBtns();
          document.getElementById('wbswList').addEventListener('input', (e)=>{ if(e.target.classList.contains('wbsw-weight')) updateWbswTotal(); });
          document.getElementById('wbswAddBtn').addEventListener('click', ()=>{
            const div = document.createElement('div');
            div.className = 'list-row wbsw-row';
            div.dataset.id = '';
            div.dataset.orig = '';
            div.innerHTML = `<input type="text" class="wbsw-name" placeholder="ชื่อ Discipline ใหม่"><input type="number" class="wbsw-weight" step="0.01" min="0" value="0"><button type="button" class="rm-row wbsw-del" title="ลบหมวดนี้">🗑</button>`;
            document.getElementById('wbswList').appendChild(div);
            wireDelBtn(div.querySelector('.wbsw-del'));
            updateWbswTotal();
          });
          document.getElementById('wbswPkgSelect').addEventListener('change', (e)=>{
            modalPkg = e.target.value;
            document.getElementById('wbswList').innerHTML = rowsHtmlFor(modalPkg);
            wireAllDelBtns();
            document.getElementById('wbswCopySelect').innerHTML = copyOptsHtml();
            updateWbswTotal();
          });
          document.getElementById('wbswCopyBtn').addEventListener('click', ()=>{
            const fromPkg = document.getElementById('wbswCopySelect').value;
            if(!fromPkg){ alert('กรุณาเลือก Package ที่จะคัดลอกจาก'); return; }
            if(!confirm('คัดลอกชุด Discipline/Weight จาก ' + fromPkg + ' มาแทนที่รายการปัจจุบันของ ' + modalPkg + ' (ยังไม่บันทึกจนกว่าจะกดปุ่มบันทึก) ใช่หรือไม่?')) return;
            const order = wbsOrderFor(fromPkg);
            const weights = wbsWeightsFor(fromPkg);
            document.getElementById('wbswList').innerHTML = order.map(disc=>
              `<div class="list-row wbsw-row" data-id="" data-orig=""><input type="text" class="wbsw-name" value="${escapeHtml(disc)}"><input type="number" class="wbsw-weight" step="0.01" min="0" value="${Number(weights[disc])||0}"><button type="button" class="rm-row wbsw-del" title="ลบหมวดนี้">🗑</button></div>`
            ).join('');
            wireAllDelBtns();
            updateWbswTotal();
          });
          document.getElementById('wbswSaveBtn').addEventListener('click', ()=> submitWbsWeights(modalPkg));
          updateWbswTotal();
        }

        async function submitWbsWeights(pkg){
          const rowEls = Array.from(document.querySelectorAll('#wbswList .wbsw-row'));
          const seen = new Set();
          const parsed = [];
          for(const row of rowEls){
            const name = row.querySelector('.wbsw-name').value.trim();
            if(!name) continue;
            if(seen.has(name)){ alert('มีชื่อ Discipline ซ้ำกัน: ' + name); return; }
            seen.add(name);
            let weight = Number(row.querySelector('.wbsw-weight').value);
            if(isNaN(weight) || weight < 0) weight = 0;
            parsed.push({ id: row.dataset.id || null, orig: row.dataset.orig || '', name, weight });
          }
          if(!parsed.length){ alert('ต้องมีอย่างน้อย 1 Discipline'); return; }
          const btn = document.getElementById('wbswSaveBtn');
          const origText = btn.textContent;
          btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
          try{
            const pkgRows = wbsWeightRows.filter(r=>r.package===pkg);
            const keptIds = new Set(parsed.filter(p=>p.id).map(p=>String(p.id)));
            const toDelete = pkgRows.filter(r=> !keptIds.has(String(r.id)));
            for(const del of toDelete){
              const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_wbs_weights?id=eq.' + encodeURIComponent(del.id), {
                method:'DELETE', headers: { ...HEADERS, 'Prefer':'return=minimal' }
              });
              if(!res.ok) throw new Error('ลบไม่สำเร็จ (' + res.status + ')');
            }
            for(let i=0;i<parsed.length;i++){
              const p = parsed[i];
              if(p.id){
                const existing = pkgRows.find(r=> String(r.id)===String(p.id));
                const renamed = existing && existing.discipline !== p.name;
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_wbs_weights?id=eq.' + encodeURIComponent(p.id), {
                  method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                  body: JSON.stringify({ discipline: p.name, weight: p.weight, sort_order: i+1, updated_at: new Date().toISOString() })
                });
                if(!res.ok) throw new Error('บันทึกไม่สำเร็จ (' + res.status + ')');
                if(renamed){
                  const res2 = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_activities?wbs_discipline=eq.' + encodeURIComponent(existing.discipline) + '&package=eq.' + encodeURIComponent(pkg), {
                    method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                    body: JSON.stringify({ wbs_discipline: p.name })
                  });
                  if(!res2.ok) throw new Error('อัปเดตชื่อ Discipline ของ Activity เดิมไม่สำเร็จ (' + res2.status + ')');
                  data.forEach(r=>{ if(r.wbs_discipline===existing.discipline && r.package===pkg) r.wbs_discipline = p.name; });
                }
              } else {
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_wbs_weights', {
                  method:'POST', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                  body: JSON.stringify({ package: pkg, discipline: p.name, weight: p.weight, sort_order: i+1 })
                });
                if(!res.ok) throw new Error('เพิ่ม Discipline ไม่สำเร็จ (' + res.status + ')');
              }
            }
            wbsWeightRows = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_wbs_weights?select=*&order=sort_order.asc.nullslast,id.asc');
            WBS_WEIGHTS_BY_PKG = {}; WBS_ORDER_BY_PKG = {};
            wbsWeightRows.forEach(r=>{
              const pkgKey = r.package || '';
              if(!WBS_WEIGHTS_BY_PKG[pkgKey]){ WBS_WEIGHTS_BY_PKG[pkgKey] = {}; WBS_ORDER_BY_PKG[pkgKey] = []; }
              WBS_WEIGHTS_BY_PKG[pkgKey][r.discipline] = Number(r.weight)||0;
              WBS_ORDER_BY_PKG[pkgKey].push(r.discipline);
            });
            wbsDisciplinesPresent = Array.from(new Set(packages.flatMap(p=>wbsOrderFor(p)))).filter(k=> data.some(r=>r.wbs_discipline===k));
            refreshSchWbsDiscFilterOptions();
            closeModal();
            renderGantt();
          }catch(e){
            alert('บันทึกไม่สำเร็จ: ' + e.message);
            btn.disabled = false; btn.textContent = origText;
          }
        }

        function openPhaseWeightsModal(){
          let modalPkg = (schFilters.pkg && schFilters.pkg!=='all' && packages.includes(schFilters.pkg)) ? schFilters.pkg : (packages[0] || '');
          const modal = document.getElementById('modalContent');
          const phaseOptsDatalist = disciplines.map(d=>`<option value="${escapeHtml(d)}">`).join('');
          function rowsHtmlFor(pkg){
            const weights = phaseWeightsFor(pkg);
            return phaseOrderFor(pkg).map(ph=>{
              const id = phaseRowId(pkg, ph);
              return `<div class="list-row phw-row" data-id="${id||''}" data-orig="${escapeHtml(ph)}">
                <input type="text" class="phw-name" value="${escapeHtml(ph)}" list="phwPhaseList" placeholder="เช่น CON / PRO / ENG / ASB">
                <input type="number" class="phw-weight" step="0.01" min="0" value="${Number(weights[ph])||0}">
                <button type="button" class="rm-row phw-del" title="ลบ Phase นี้">🗑</button>
              </div>`;
            }).join('');
          }
          function copyOptsHtml(){
            return ['<option value="">— เลือก Package —</option>'].concat(
              packages.filter(p=>p!==modalPkg).map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`)
            ).join('');
          }
          const pkgOptsHtml = packages.map(p=>`<option value="${escapeHtml(p)}"${p===modalPkg?' selected':''}>${escapeHtml(p)}</option>`).join('');
          modal.innerHTML = `
            <div class="modal-head"><h2>⚙️ Phase / Weight %</h2><button class="modal-close" id="modalCloseBtn">&times;</button></div>
            <div class="form-grid">
              <div style="font-size:11.5px;color:var(--muted);">กำหนด Phase (CON/PRO/ENG/ASB/MIL/PAC — คือฟิลด์ Phase ของแต่ละ Activity) และ % น้ำหนักของแต่ละ Phase ที่ใช้รวมเข้า <b>Overall Progress</b> สุดท้าย — <b>แต่ละ Package มีชุด Phase/Weight เป็นอิสระของตัวเอง</b> — Phase "CON" ยังคำนวณ % ความคืบหน้าภายในด้วยสูตรถ่วงน้ำหนักตาม Discipline เดิม (ปุ่ม "⚙️ Discipline / Weight") ส่วน Phase อื่นถ่วงน้ำหนักด้วย Weight Factor ของ Activity ตรงๆ รวมทุก Phase ของ Package เดียวกันควรได้ 100% พอดี</div>
              <div class="list-row">
                <label style="flex:0 0 90px;font-size:12.5px;color:var(--muted);align-self:center;">Package</label>
                <select id="phwPkgSelect" style="flex:1 1 auto;">${pkgOptsHtml}</select>
              </div>
              <div class="list-row">
                <label style="flex:0 0 90px;font-size:12.5px;color:var(--muted);align-self:center;">คัดลอกจาก</label>
                <select id="phwCopySelect" style="flex:1 1 auto;">${copyOptsHtml()}</select>
                <button type="button" class="btn btn-ghost" id="phwCopyBtn" style="flex:0 0 auto;">คัดลอก</button>
              </div>
              <div class="list-rows" id="phwList">${rowsHtmlFor(modalPkg)}</div>
              <datalist id="phwPhaseList">${phaseOptsDatalist}</datalist>
              <button type="button" class="list-add-btn" id="phwAddBtn">+ เพิ่ม Phase</button>
              <div id="phwTotal" style="font-size:13px;font-weight:600;"></div>
            </div>
            <div class="btn-row">
              <button class="btn btn-primary" id="phwSaveBtn">บันทึก (Package นี้)</button>
              <button class="btn btn-ghost" id="phwCancelBtn">ยกเลิก</button>
            </div>`;
          document.getElementById('modalBg').classList.add('show');
          document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
          document.getElementById('phwCancelBtn').addEventListener('click', closeModal);
          function updatePhwTotal(){
            const total = Array.from(document.querySelectorAll('#phwList .phw-weight')).reduce((sum,el)=> sum + (Number(el.value)||0), 0);
            const el = document.getElementById('phwTotal');
            el.textContent = 'รวมทั้งหมด (' + modalPkg + '): ' + (Math.round(total*100)/100) + '%' + (Math.abs(total-100)>0.01 ? '  ⚠️ ควรเท่ากับ 100%' : '  ✅');
            el.style.color = Math.abs(total-100)>0.01 ? '#DC2626' : '#16A34A';
          }
          function wireDelBtn(btn){
            btn.addEventListener('click', ()=>{
              const row = btn.closest('.phw-row');
              const ph = row.dataset.orig;
              if(ph){
                const inUseCount = data.filter(r=>r.discipline===ph && r.package===modalPkg).length;
                if(inUseCount > 0 && !confirm('มี ' + inUseCount + ' Activity ใน Package ' + modalPkg + ' ที่อยู่ใน Phase "' + ph + '" อยู่ — ลบ Phase นี้แล้วงานเหล่านั้นจะไม่ถูกนับใน Overall Progress ของ Package นี้ จนกว่าจะย้ายไปหมวดอื่น ยืนยันลบหรือไม่?')) return;
              }
              row.remove();
              updatePhwTotal();
            });
          }
          function wireAllDelBtns(){ document.querySelectorAll('#phwList .phw-del').forEach(wireDelBtn); }
          wireAllDelBtns();
          document.getElementById('phwList').addEventListener('input', (e)=>{ if(e.target.classList.contains('phw-weight')) updatePhwTotal(); });
          document.getElementById('phwAddBtn').addEventListener('click', ()=>{
            const div = document.createElement('div');
            div.className = 'list-row phw-row';
            div.dataset.id = '';
            div.dataset.orig = '';
            div.innerHTML = `<input type="text" class="phw-name" list="phwPhaseList" placeholder="เช่น PRO / ENG / ASB"><input type="number" class="phw-weight" step="0.01" min="0" value="0"><button type="button" class="rm-row phw-del" title="ลบ Phase นี้">🗑</button>`;
            document.getElementById('phwList').appendChild(div);
            wireDelBtn(div.querySelector('.phw-del'));
            updatePhwTotal();
          });
          document.getElementById('phwPkgSelect').addEventListener('change', (e)=>{
            modalPkg = e.target.value;
            document.getElementById('phwList').innerHTML = rowsHtmlFor(modalPkg);
            wireAllDelBtns();
            document.getElementById('phwCopySelect').innerHTML = copyOptsHtml();
            updatePhwTotal();
          });
          document.getElementById('phwCopyBtn').addEventListener('click', ()=>{
            const fromPkg = document.getElementById('phwCopySelect').value;
            if(!fromPkg){ alert('กรุณาเลือก Package ที่จะคัดลอกจาก'); return; }
            if(!confirm('คัดลอกชุด Phase/Weight จาก ' + fromPkg + ' มาแทนที่รายการปัจจุบันของ ' + modalPkg + ' (ยังไม่บันทึกจนกว่าจะกดปุ่มบันทึก) ใช่หรือไม่?')) return;
            const order = phaseOrderFor(fromPkg);
            const weights = phaseWeightsFor(fromPkg);
            document.getElementById('phwList').innerHTML = order.map(ph=>
              `<div class="list-row phw-row" data-id="" data-orig=""><input type="text" class="phw-name" value="${escapeHtml(ph)}" list="phwPhaseList"><input type="number" class="phw-weight" step="0.01" min="0" value="${Number(weights[ph])||0}"><button type="button" class="rm-row phw-del" title="ลบ Phase นี้">🗑</button></div>`
            ).join('');
            wireAllDelBtns();
            updatePhwTotal();
          });
          document.getElementById('phwSaveBtn').addEventListener('click', ()=> submitPhaseWeights(modalPkg));
          updatePhwTotal();
        }

        async function submitPhaseWeights(pkg){
          const rowEls = Array.from(document.querySelectorAll('#phwList .phw-row'));
          const seen = new Set();
          const parsed = [];
          for(const row of rowEls){
            const name = row.querySelector('.phw-name').value.trim();
            if(!name) continue;
            if(seen.has(name)){ alert('มีชื่อ Phase ซ้ำกัน: ' + name); return; }
            seen.add(name);
            let weight = Number(row.querySelector('.phw-weight').value);
            if(isNaN(weight) || weight < 0) weight = 0;
            parsed.push({ id: row.dataset.id || null, orig: row.dataset.orig || '', name, weight });
          }
          if(!parsed.length){ alert('ต้องมีอย่างน้อย 1 Phase'); return; }
          const btn = document.getElementById('phwSaveBtn');
          const origText = btn.textContent;
          btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
          try{
            const pkgRows = phaseWeightRows.filter(r=>r.package===pkg);
            const keptIds = new Set(parsed.filter(p=>p.id).map(p=>String(p.id)));
            const toDelete = pkgRows.filter(r=> !keptIds.has(String(r.id)));
            for(const del of toDelete){
              const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_phase_weights?id=eq.' + encodeURIComponent(del.id), {
                method:'DELETE', headers: { ...HEADERS, 'Prefer':'return=minimal' }
              });
              if(!res.ok) throw new Error('ลบไม่สำเร็จ (' + res.status + ')');
            }
            for(let i=0;i<parsed.length;i++){
              const p = parsed[i];
              if(p.id){
                const existing = pkgRows.find(r=> String(r.id)===String(p.id));
                const renamed = existing && existing.phase !== p.name;
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_phase_weights?id=eq.' + encodeURIComponent(p.id), {
                  method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                  body: JSON.stringify({ phase: p.name, weight: p.weight, sort_order: i+1, updated_at: new Date().toISOString() })
                });
                if(!res.ok) throw new Error('บันทึกไม่สำเร็จ (' + res.status + ')');
                if(renamed){
                  const res2 = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_activities?discipline=eq.' + encodeURIComponent(existing.phase) + '&package=eq.' + encodeURIComponent(pkg), {
                    method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                    body: JSON.stringify({ discipline: p.name })
                  });
                  if(!res2.ok) throw new Error('อัปเดต Phase ของ Activity เดิมไม่สำเร็จ (' + res2.status + ')');
                  data.forEach(r=>{ if(r.discipline===existing.phase && r.package===pkg) r.discipline = p.name; });
                }
              } else {
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_phase_weights', {
                  method:'POST', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                  body: JSON.stringify({ package: pkg, phase: p.name, weight: p.weight, sort_order: i+1 })
                });
                if(!res.ok) throw new Error('เพิ่ม Phase ไม่สำเร็จ (' + res.status + ')');
              }
            }
            phaseWeightRows = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_phase_weights?select=*&order=sort_order.asc.nullslast,id.asc');
            PHASE_WEIGHTS_BY_PKG = {}; PHASE_ORDER_BY_PKG = {};
            phaseWeightRows.forEach(r=>{
              const pkgKey = r.package || '';
              if(!PHASE_WEIGHTS_BY_PKG[pkgKey]){ PHASE_WEIGHTS_BY_PKG[pkgKey] = {}; PHASE_ORDER_BY_PKG[pkgKey] = []; }
              PHASE_WEIGHTS_BY_PKG[pkgKey][r.phase] = Number(r.weight)||0;
              PHASE_ORDER_BY_PKG[pkgKey].push(r.phase);
            });
            closeModal();
            renderGantt();
          }catch(e){
            alert('บันทึกไม่สำเร็จ: ' + e.message);
            btn.disabled = false; btn.textContent = origText;
          }
        }

        function openScurveManualModal(){
          const pkgKey = currentScurvePkgKey();
          const phaseKey = currentScurvePhaseKey();
          const scopeLabel = (pkgKey || 'ทุก Package') + ' · ' + (phaseKey || 'ทุก Phase');
          const modal = document.getElementById('modalContent');
          function rowsHtmlFor(){
            return manualPointsFor(pkgKey, phaseKey).map(p=> `<div class="list-row scmp-row" data-id="${p.id}">
              <input type="date" class="scmp-date" value="${escapeHtml(p.snapshot_date)}">
              <input type="number" class="scmp-pct" step="0.01" min="0" max="100" value="${Number(p.pct)||0}">
              <input type="text" class="scmp-note" placeholder="หมายเหตุ (ถ้ามี)" value="${escapeHtml(p.note||'')}">
              <button type="button" class="rm-row scmp-del" title="ลบจุดนี้">🗑</button>
            </div>`).join('');
          }
          modal.innerHTML = `
            <div class="modal-head"><h2>📝 แก้ไขข้อมูลจริงย้อนหลัง (S-Curve)</h2><button class="modal-close" id="modalCloseBtn">&times;</button></div>
            <div class="form-grid">
              <div style="font-size:11.5px;color:var(--muted);">ใส่ %ความคืบหน้ารวม (Actual) ที่ทราบจริงในวันที่ผ่านมา สำหรับ <b>${escapeHtml(scopeLabel)}</b> (ตามตัวกรอง Package + Phase ที่เลือกอยู่ในหน้าหลักตอนนี้ — เปลี่ยนตัวกรองแล้วเปิดปุ่มนี้ใหม่เพื่อแก้ของ Package/Phase อื่น) — ใช้ตอนที่ไม่มี snapshot อัตโนมัติของวันนั้น (เช่นก่อนเริ่มใช้ระบบนี้) จุดที่กรอกไว้ที่นี่จะทับค่าที่ระบบคำนวณอัตโนมัติของวันเดียวกันในกราฟ S-Curve ทันที (แสดงเป็นจุดสีแดงใหญ่กว่าปกติ) — ใช้ได้เฉพาะตอนตัวกรอง Discipline/Area/สถานะ/ค้นหา เป็น "ทั้งหมด" เท่านั้น (Package และ Phase เลือกเจาะจงหรือ "ทั้งหมด" ก็ได้)</div>
              <div class="list-rows" id="scmpList">${rowsHtmlFor()}</div>
              <button type="button" class="list-add-btn" id="scmpAddBtn">+ เพิ่มจุดข้อมูล</button>
            </div>
            <div class="btn-row">
              <button class="btn btn-primary" id="scmpSaveBtn">บันทึก</button>
              <button class="btn btn-ghost" id="scmpCancelBtn">ยกเลิก</button>
            </div>`;
          document.getElementById('modalBg').classList.add('show');
          document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
          document.getElementById('scmpCancelBtn').addEventListener('click', closeModal);
          function wireDelBtn(btn){ btn.addEventListener('click', ()=>{ btn.closest('.scmp-row').remove(); }); }
          document.querySelectorAll('#scmpList .scmp-del').forEach(wireDelBtn);
          document.getElementById('scmpAddBtn').addEventListener('click', ()=>{
            const div = document.createElement('div');
            div.className = 'list-row scmp-row';
            div.dataset.id = '';
            div.innerHTML = `<input type="date" class="scmp-date" value="${todayISO()}"><input type="number" class="scmp-pct" step="0.01" min="0" max="100" value="0"><input type="text" class="scmp-note" placeholder="หมายเหตุ (ถ้ามี)"><button type="button" class="rm-row scmp-del" title="ลบจุดนี้">🗑</button>`;
            document.getElementById('scmpList').appendChild(div);
            wireDelBtn(div.querySelector('.scmp-del'));
          });
          document.getElementById('scmpSaveBtn').addEventListener('click', ()=> submitScurveManualPoints(pkgKey, phaseKey));
        }

        async function submitScurveManualPoints(pkgKey, phaseKey){
          const rowEls = Array.from(document.querySelectorAll('#scmpList .scmp-row'));
          const seen = new Set();
          const parsed = [];
          for(const row of rowEls){
            const dateVal = row.querySelector('.scmp-date').value;
            if(!dateVal) continue;
            if(seen.has(dateVal)){ alert('มีวันที่ซ้ำกัน: ' + dateVal); return; }
            seen.add(dateVal);
            let pct = Number(row.querySelector('.scmp-pct').value);
            if(isNaN(pct)) pct = 0;
            pct = Math.max(0, Math.min(100, pct));
            const note = row.querySelector('.scmp-note').value.trim();
            parsed.push({ id: row.dataset.id || null, date: dateVal, pct, note });
          }
          const btn = document.getElementById('scmpSaveBtn');
          const origText = btn.textContent;
          btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
          try{
            const existing = manualPointsFor(pkgKey, phaseKey);
            const keptIds = new Set(parsed.filter(p=>p.id).map(p=>String(p.id)));
            const toDelete = existing.filter(r=> !keptIds.has(String(r.id)));
            for(const del of toDelete){
              const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_scurve_manual_points?id=eq.' + encodeURIComponent(del.id), {
                method:'DELETE', headers: { ...HEADERS, 'Prefer':'return=minimal' }
              });
              if(!res.ok) throw new Error('ลบไม่สำเร็จ (' + res.status + ')');
            }
            for(const p of parsed){
              if(p.id){
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_scurve_manual_points?id=eq.' + encodeURIComponent(p.id), {
                  method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                  body: JSON.stringify({ snapshot_date: p.date, pct: p.pct, note: p.note || null, updated_at: new Date().toISOString() })
                });
                if(!res.ok) throw new Error('บันทึกไม่สำเร็จ (' + res.status + ')');
              } else {
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_scurve_manual_points?on_conflict=package,phase,snapshot_date', {
                  method:'POST', headers: { ...HEADERS, 'Prefer':'resolution=merge-duplicates,return=minimal' },
                  body: JSON.stringify({ package: pkgKey, phase: phaseKey, snapshot_date: p.date, pct: p.pct, note: p.note || null })
                });
                if(!res.ok) throw new Error('เพิ่มจุดไม่สำเร็จ (' + res.status + ')');
              }
            }
            scurveManualPoints = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_scurve_manual_points?select=*&order=snapshot_date.asc');
            closeModal();
            renderGantt();
          }catch(e){
            alert('บันทึกไม่สำเร็จ: ' + e.message);
            btn.disabled = false; btn.textContent = origText;
          }
        }

        function openAddTaskModal(){
          const modal = document.getElementById('modalContent');
          const packageOpts = packages.map(p=>`<option value="${escapeHtml(p)}">`).join('');
          const discOpts = disciplines.map(d=>`<option value="${escapeHtml(d)}">`).join('');
          const areaOpts = areas.map(a=>`<option value="${escapeHtml(a)}">`).join('');
          const wbsSelectOpts = ['<option value="">(ไม่ระบุ)</option>'].concat(
            wbsAllDisciplineNames().map(w=>`<option value="${escapeHtml(w)}">${escapeHtml(w)}</option>`)
          ).join('');
          modal.innerHTML = `
            <div class="modal-head"><h2>➕ เพิ่ม Activity ใหม่</h2><button class="modal-close" id="modalCloseBtn">&times;</button></div>
            <div class="form-grid">
              <div class="list-row"><label style="flex:0 0 140px;font-size:12.5px;color:var(--muted);">Activity ID *</label><input type="text" id="natCode" placeholder="เช่น CON.PKG1.SPL.C.0030" style="flex:1 1 auto;min-width:0;"></div>
              <div class="list-row"><label style="flex:0 0 140px;font-size:12.5px;color:var(--muted);">ชื่องาน *</label><input type="text" id="natName" placeholder="ชื่อกิจกรรม" style="flex:1 1 auto;min-width:0;"></div>
              <div class="list-row"><label style="flex:0 0 140px;font-size:12.5px;color:var(--muted);">Package</label><input type="text" id="natPkg" list="natPkgList" placeholder="PKG1 / PKG2 / PKG3 ..." style="flex:1 1 auto;min-width:0;"><datalist id="natPkgList">${packageOpts}</datalist></div>
              <div class="list-row"><label style="flex:0 0 140px;font-size:12.5px;color:var(--muted);">Phase</label><input type="text" id="natDisc" list="natDiscList" placeholder="เช่น CON / PRO / ASB" style="flex:1 1 auto;min-width:0;"><datalist id="natDiscList">${discOpts}</datalist></div>
              <div class="list-row"><label style="flex:0 0 140px;font-size:12.5px;color:var(--muted);">Discipline (หมวดงานหลัก)</label><select id="natWbsDisc" style="flex:1 1 auto;min-width:0;">${wbsSelectOpts}</select></div>
              <div class="list-row"><label style="flex:0 0 140px;font-size:12.5px;color:var(--muted);">Area (Activity Group)</label><input type="text" id="natArea" list="natAreaList" placeholder="เช่น SPL / WSB ..." style="flex:1 1 auto;min-width:0;"><datalist id="natAreaList">${areaOpts}</datalist></div>
              <div class="list-row"><label style="flex:0 0 140px;font-size:12.5px;color:var(--muted);">Start Date</label><input type="date" id="natStart" style="flex:1 1 auto;min-width:0;"></div>
              <div class="list-row"><label style="flex:0 0 140px;font-size:12.5px;color:var(--muted);">Finish Date</label><input type="date" id="natEnd" style="flex:1 1 auto;min-width:0;"></div>
              <div class="list-row"><label style="flex:0 0 140px;font-size:12.5px;color:var(--muted);">Weight Factor</label><input type="number" id="natWeight" step="0.01" min="0" value="1" style="flex:1 1 auto;min-width:0;"></div>
              <div class="list-row"><label style="flex:0 0 140px;font-size:12.5px;color:var(--muted);">Milestone?</label><input type="checkbox" id="natMilestone" style="flex:0 0 auto;"></div>
            </div>
            <div class="btn-row">
              <button class="btn btn-primary" id="natSaveBtn">บันทึก Activity ใหม่</button>
              <button class="btn btn-ghost" id="natCancelBtn">ยกเลิก</button>
            </div>`;
          document.getElementById('modalBg').classList.add('show');
          document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
          document.getElementById('natCancelBtn').addEventListener('click', closeModal);
          document.getElementById('natSaveBtn').addEventListener('click', submitNewTask);
        }

        async function submitNewTask(){
          const code = document.getElementById('natCode').value.trim();
          const name = document.getElementById('natName').value.trim();
          const pkg = document.getElementById('natPkg').value.trim();
          const disc = document.getElementById('natDisc').value.trim();
          const wbsDisc = document.getElementById('natWbsDisc').value;
          const area = document.getElementById('natArea').value.trim();
          const start = document.getElementById('natStart').value || null;
          const end = document.getElementById('natEnd').value || null;
          let weight = Number(document.getElementById('natWeight').value);
          if(isNaN(weight) || weight < 0) weight = 1;
          const isMs = document.getElementById('natMilestone').checked;
          if(!code || !name){ alert('กรุณากรอก Activity ID และชื่องาน ให้ครบ'); return; }
          if(data.some(x=>x.task_code===code)){ alert('Activity ID นี้มีอยู่แล้วในระบบ กรุณาใช้ Activity ID อื่น'); return; }
          const isMilestone = isMs || !start || !end;
          const nextSort = data.reduce((m,x)=> Math.max(m, Number(x.sort_order)||0), 0) + 1;
          const btn = document.getElementById('natSaveBtn');
          const origText = btn.textContent;
          btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
          try{
            const record = {
              task_code: code, status_code: 'Not Started', wbs_id: null,
              discipline: disc || null, discipline_label: disc || null,
              package: pkg || null, area: area || null, task_name: name,
              start_date: start, end_date: end, is_milestone: isMilestone,
              sort_order: nextSort, progress_pct: 0,
              wbs_discipline: wbsDisc || null, weight_factor: weight,
              updated_at: new Date().toISOString()
            };
            const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_activities', {
              method:'POST', headers: { ...HEADERS, 'Prefer':'return=representation' },
              body: JSON.stringify(record)
            });
            if(!res.ok) throw new Error('บันทึกไม่สำเร็จ (' + res.status + ')');
            const rows = await res.json();
            data.push(rows && rows[0] ? rows[0] : record);
            closeModal();
            renderGantt();
          }catch(e){
            alert('บันทึกไม่สำเร็จ: ' + e.message);
            btn.disabled = false; btn.textContent = origText;
          }
        }

        async function saveActivityFields(code, pct, wf){
          let val = Math.round(Number(pct) * 100) / 100;
          if(isNaN(val)) val = 0;
          val = Math.max(0, Math.min(100, val));
          let w = Math.round(Number(wf) * 100) / 100;
          if(isNaN(w) || w < 0) w = 0;
          const newStatus = val <= 0 ? 'Not Started' : (val >= 100 ? 'Completed' : 'In Progress');
          const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_activities?task_code=eq.' + encodeURIComponent(code), {
            method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
            body: JSON.stringify({ progress_pct: val, status_code: newStatus, weight_factor: w })
          });
          if(!res.ok) throw new Error('บันทึกไม่สำเร็จ (' + res.status + ') — ' + code);
          const row = data.find(x=>x.task_code===code);
          if(row){ row.progress_pct = val; row.status_code = newStatus; row.weight_factor = w; }
          return { code, progress_pct: val, weight_factor: w, status_code: newStatus };
        }

        const TV_STATUS_OPTS = ['Not Started','In Progress','Completed'];
        // % ความคืบหน้าตามแผน (Planned) ของ Activity หนึ่ง ณ วัน offset ที่กำหนด (0 = วันแรกของโปรเจกต์)
        function plannedFractionAt(r, bucketOffset){
          if(r.is_milestone){
            const endDateStr = r.end_date || r.start_date;
            if(!endDateStr) return 0;
            return bucketOffset >= dayOffset(endDateStr) ? 100 : 0;
          }
          if(!r.start_date || !r.end_date) return 0;
          const sOff = dayOffset(r.start_date), eOff = dayOffset(r.end_date);
          if(eOff <= sOff) return bucketOffset >= eOff ? 100 : 0;
          if(bucketOffset <= sOff) return 0;
          if(bucketOffset >= eOff) return 100;
          return (bucketOffset - sOff) / (eOff - sOff) * 100;
        }
        function buildSCurveBucketOffsets(){
          const offsets = [];
          for(let i=0;i<=totalDays;i+=7) offsets.push(i);
          if(offsets[offsets.length-1] !== totalDays) offsets.push(totalDays);
          return offsets;
        }
        // ทั้งแผน (Planned) และจริง (Actual) จะใช้สูตรถ่วงน้ำหนักตาม Discipline/Phase เดียวกับ "Overall Progress (Weighted)"
        // เมื่อตัวกรองอยู่ระดับ Package (หรือ Package+Phase) — เพื่อให้ "จริง ณ วันนี้" ตรงกับการ์ด KPI เป๊ะๆ
        // ถ้าตัวกรองแคบกว่านั้น (เลือก Discipline ย่อย/Area/สถานะ/ค้นหา) หรือเลือก Package="ทั้งหมด" จะ fallback ไปใช้
        // ค่าเฉลี่ยถ่วงน้ำหนักด้วย Weight Factor แบบตรงๆ (flat) เหมือนเดิม เพราะสูตร Discipline/Phase ต้องมีข้อมูลครบทุกกลุ่มถึงมีความหมาย
        function computePlannedSeries(rows){
          const offsets = buildSCurveBucketOffsets();
          if(scurveWeightedModeAvailable()){
            const pkg = schFilters.pkg, phase = scurvePhaseKeyForCalc();
            return offsets.map(off=>{
              const getPct = r=> plannedFractionAt(r, off);
              const res = phase==='all' ? computeOverallProgressGeneric(pkg, data, getPct) : computePhaseProgressGeneric(pkg, phase, data, getPct);
              return { x: off, y: res ? Math.round(res.pct*100)/100 : 0 };
            });
          }
          return offsets.map(off=>{
            const synthetic = rows.map(r=> ({ weight_factor: r.weight_factor, progress_pct: plannedFractionAt(r, off) }));
            return { x: off, y: Math.round(weightedAvgProgress(synthetic)*100)/100 };
          });
        }
        function computeActualSeries(rows){
          const dates = Array.from(progressHistoryByDate.keys()).sort();
          if(scurveWeightedModeAvailable()){
            const pkg = schFilters.pkg, phase = scurvePhaseKeyForCalc();
            return dates.map(d=>{
              const pctMap = new Map();
              (progressHistoryByDate.get(d)||[]).forEach(h=> pctMap.set(h.task_code, Number(h.progress_pct)));
              const getPct = r=> pctMap.has(r.task_code) ? pctMap.get(r.task_code) : null;
              const res = phase==='all' ? computeOverallProgressGeneric(pkg, data, getPct) : computePhaseProgressGeneric(pkg, phase, data, getPct);
              if(!res) return null;
              return { x: dayOffset(d), y: Math.round(res.pct*100)/100 };
            }).filter(Boolean);
          }
          const codes = new Set(rows.map(r=>r.task_code));
          return dates.map(d=>{
            const recs = (progressHistoryByDate.get(d)||[]).filter(h=>codes.has(h.task_code));
            if(!recs.length) return null;
            return { x: dayOffset(d), y: Math.round(weightedAvgProgress(recs)*100)/100 };
          }).filter(Boolean);
        }
        function renderSCurve(rows){
          const host = document.getElementById('schGanttHost');
          host.innerHTML = `
            <div style="padding:16px;">
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
                <button type="button" class="gantt-io-btn" id="scurveManualBtn">📝 แก้ไขข้อมูลจริงย้อนหลัง</button>
                <span id="scurveManualNote" style="font-size:11.5px;color:var(--muted);"></span>
              </div>
              <div id="scurveInfo" style="margin-bottom:12px;font-size:13.5px;"></div>
              <div style="position:relative;height:420px;"><canvas id="chartSCurve"></canvas></div>
              <div style="margin-top:10px;font-size:11px;color:var(--muted);">เส้นประ = แผน (Planned) คำนวณจากช่วงวันที่ Start–Finish ของแต่ละ Activity ที่อยู่ในตัวกรองปัจจุบัน ถ่วงน้ำหนักด้วย Weight Factor · เส้นทึบ = จริง (Actual) จากค่า %Progress ที่บันทึกไว้จริงในแต่ละวันที่มีคนเปิดหน้านี้ (ระบบเก็บอัตโนมัติทุกครั้งที่เปิด) รวมกับจุดที่กรอกย้อนหลังด้วยมือ (จุดวงกลมใหญ่กว่า) — วันไหนมีทั้งสองแบบ จุดที่กรอกด้วยมือจะทับค่าที่ระบบเก็บอัตโนมัติ</div>
            </div>`;
          document.getElementById('scurveManualBtn').addEventListener('click', ()=> openScurveManualModal());
          if(!rows.length){ document.getElementById('scurveInfo').textContent = 'ไม่มี Activity ในตัวกรองปัจจุบัน'; return; }
          const plannedSeries = computePlannedSeries(rows);
          const actualSeries = computeActualSeries(rows);
          const todayIso = todayISO();
          const todayOff = dayOffset(todayIso);
          const weightedModeOn = scurveWeightedModeAvailable();
          const pkgForCalc = schFilters.pkg, phaseForCalc = scurvePhaseKeyForCalc();
          function liveWeightedPct(getPct){
            if(!weightedModeOn) return null;
            const res = phaseForCalc==='all' ? computeOverallProgressGeneric(pkgForCalc, data, getPct) : computePhaseProgressGeneric(pkgForCalc, phaseForCalc, data, getPct);
            return res ? res.pct : null;
          }
          const liveActualPct0 = liveWeightedPct(r=> Number(r.progress_pct)||0);
          const liveActualToday = { x: todayOff, y: Math.round((liveActualPct0===null ? weightedAvgProgress(rows) : liveActualPct0)*100)/100 };
          if(!actualSeries.some(p=>p.x===todayOff)) actualSeries.push(liveActualToday);

          const pkgKey = currentScurvePkgKey();
          const phaseKey = currentScurvePhaseKey();
          const scopeLabel = (pkgKey||'ทุก Package') + ' · ' + (phaseKey||'ทุก Phase');
          const manualPts = manualPointsFor(pkgKey, phaseKey);
          const manualApplied = isScurveAggregateFilter() && manualPts.length > 0;
          if(manualApplied){
            manualPts.forEach(p=>{
              const off = dayOffset(p.snapshot_date);
              const idx = actualSeries.findIndex(pt=>pt.x===off);
              const pt = { x: off, y: Number(p.pct)||0, manual:true };
              if(idx>=0) actualSeries[idx] = pt; else actualSeries.push(pt);
            });
          }
          actualSeries.sort((a,b)=>a.x-b.x);
          const noteEl = document.getElementById('scurveManualNote');
          if(manualPts.length && !isScurveAggregateFilter()){
            noteEl.textContent = `มีจุดข้อมูลย้อนหลังที่กรอกด้วยมือ ${manualPts.length} จุด สำหรับ ${scopeLabel} แต่ไม่ถูกใช้ในกราฟนี้ เพราะตัวกรองตอนนี้แคบกว่าระดับ Package/Phase (เลือก Discipline/Area/สถานะ/ค้นหาอยู่)`;
          } else if(manualPts.length){
            noteEl.textContent = `ใช้จุดข้อมูลย้อนหลังที่กรอกด้วยมือ ${manualPts.length} จุด สำหรับ ${scopeLabel}`;
          } else {
            noteEl.textContent = '';
          }
          const plannedTodayPct0 = liveWeightedPct(r=> plannedFractionAt(r, todayOff));
          const plannedToday = Math.round((plannedTodayPct0===null ? weightedAvgProgress(rows.map(r=>({ weight_factor:r.weight_factor, progress_pct: plannedFractionAt(r, todayOff) }))) : plannedTodayPct0)*100)/100;
          const actualToday = liveActualToday.y;
          const diff = Math.round((actualToday - plannedToday)*100)/100;
          const diffHtml = diff >= 0
            ? `เร็วกว่าแผน <b style="color:#16A34A;">+${diff.toFixed(1)}%</b>`
            : `ล่าช้ากว่าแผน <b style="color:#DC2626;">${diff.toFixed(1)}%</b>`;
          const modeText = weightedModeOn
            ? `* คำนวณด้วยสูตรถ่วงน้ำหนักตาม Discipline/Phase เดียวกับ "Overall Progress (Weighted)" (${escapeHtml(pkgForCalc)}${phaseForCalc!=='all' ? ' · Phase ' + escapeHtml(discLabelMap[phaseForCalc]||phaseForCalc) : ''}) — ตัวเลข "จริง ณ วันนี้" ตรงกับการ์ด KPI ด้านบนเป๊ะๆ`
            : `* คำนวณด้วยค่าเฉลี่ยถ่วงน้ำหนักด้วย Weight Factor แบบตรงๆ (ไม่ผ่านชั้น Discipline/Phase Weight) เพราะยังไม่ได้เลือก Package เจาะจง หรือกรอง Discipline ย่อย/Area/สถานะ/ค้นหาแคบกว่าระดับ Package — ตัวเลขอาจไม่ตรงกับการ์ด "Overall Progress (Weighted)" เป๊ะๆ ถ้าต้องการให้ตรงกัน ให้เลือก Package ที่ต้องการ (ไม่ใช่ "ทั้งหมด") แล้วอย่ากรอง Discipline/Area/สถานะ/ค้นหา`;
          document.getElementById('scurveInfo').innerHTML = `แผน ณ วันนี้: <b>${plannedToday.toFixed(1)}%</b> &nbsp;·&nbsp; จริง ณ วันนี้: <b>${actualToday.toFixed(1)}%</b> &nbsp;·&nbsp; ${diffHtml}<div style="font-size:11px;color:var(--muted);margin-top:4px;">${modeText}</div>`;
          const dayToDate = (off)=> new Date(minDate.getTime() + off*86400000).toISOString().slice(0,10);
          destroyChart('scurve');
          chartInstances.scurve = new Chart(document.getElementById('chartSCurve'), {
            type: 'line',
            data: {
              datasets: [
                { label:'แผน (Planned)', data: plannedSeries, borderColor:'#94A3B8', borderDash:[6,4], backgroundColor:'transparent', pointRadius:0, tension:0.15, borderWidth:2 },
                { label:'จริง (Actual)', data: actualSeries, borderColor:'#7C3AED', backgroundColor:'rgba(124,58,237,.12)', fill:true, pointRadius: actualSeries.map(p=>p.manual?5:2.5), pointBackgroundColor: actualSeries.map(p=>p.manual?'#DC2626':'#7C3AED'), tension:0.15, borderWidth:2.5 }
              ]
            },
            options: {
              responsive:true, maintainAspectRatio:false,
              scales: {
                x: { type:'linear', min:0, max:totalDays, ticks:{ callback:(v)=> dayToDate(v) } },
                y: { min:0, max:100, ticks:{ callback:(v)=> v+'%' } }
              },
              plugins: {
                legend:{ position:'top' },
                tooltip:{ callbacks:{
                  title:(items)=> items.length ? dayToDate(items[0].parsed.x) : '',
                  label:(ctx)=> ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + '%'
                }},
                datalabels:{ display:false }
              }
            }
          });
        }

        function renderTableView(rows){
          const host = document.getElementById('schGanttHost');
          const pkgOpts = packages.map(p=>`<option value="${escapeHtml(p)}">`).join('');
          const discOpts = disciplines.map(d=>`<option value="${escapeHtml(d)}">`).join('');
          const areaOpts = areas.map(a=>`<option value="${escapeHtml(a)}">`).join('');
          const wbsOptsHtml = (sel, pkg) => {
            const order = Array.from(new Set(wbsOrderFor(pkg).concat(sel ? [sel] : [])));
            return ['<option value=""' + (!sel?' selected':'') + '>(ไม่ระบุ)</option>'].concat(
              order.map(w=>`<option value="${escapeHtml(w)}"${sel===w?' selected':''}>${escapeHtml(w)}</option>`)
            ).join('');
          };
          const statusOptsHtml = (sel) => TV_STATUS_OPTS.map(o=>`<option value="${o}"${sel===o?' selected':''}>${o}</option>`).join('');
          const trHtml = rows.map(r=>{
            const delayed = isRowDelayed(r);
            return `<tr data-code="${escapeHtml(r.task_code)}" data-orig-status="${escapeHtml(r.status_code||'')}">
              <td><input type="text" class="tv-input tv-code-input" value="${escapeHtml(r.task_code)}"></td>
              <td><input type="text" class="tv-input tv-name-input" value="${escapeHtml(r.task_name||'')}"></td>
              <td><input type="text" class="tv-input tv-pkg-input" list="tvPkgList" value="${escapeHtml(r.package||'')}"></td>
              <td><input type="text" class="tv-input tv-disc-input" list="tvDiscList" value="${escapeHtml(r.discipline||'')}"></td>
              <td><select class="tv-input tv-wbsdisc-input">${wbsOptsHtml(r.wbs_discipline||'', r.package||'')}</select></td>
              <td><input type="text" class="tv-input tv-area-input" list="tvAreaList" value="${escapeHtml(r.area||'')}"></td>
              <td>${delayed?'<span class="tv-status-dot" style="background:#DC2626" title="Delay — เลยกำหนดแล้วแต่ยังไม่เสร็จ"></span>':''}<select class="tv-input tv-status-input">${statusOptsHtml(r.status_code||'Not Started')}</select></td>
              <td><input type="number" class="tv-input tv-weight" step="0.01" min="0" value="${Number(r.weight_factor)||0}"></td>
              <td><input type="number" class="tv-input tv-progress" step="0.01" min="0" max="100" value="${Number(r.progress_pct)||0}"></td>
              <td><input type="date" class="tv-input tv-start-input" value="${r.start_date||''}"></td>
              <td><input type="date" class="tv-input tv-end-input" value="${r.end_date||''}"></td>
              <td><button class="tv-save-btn" type="button" data-code="${escapeHtml(r.task_code)}">💾 บันทึก</button> <button class="tv-del-btn" type="button" data-code="${escapeHtml(r.task_code)}" data-name="${escapeHtml(r.task_name||'')}">🗑</button></td>
            </tr>`;
          }).join('');
          host.innerHTML = `
            <datalist id="tvPkgList">${pkgOpts}</datalist>
            <datalist id="tvDiscList">${discOpts}</datalist>
            <datalist id="tvAreaList">${areaOpts}</datalist>
            <div class="tv-wrap">
              <table class="tv-table">
                <thead><tr>
                  <th>Activity ID</th><th>ชื่องาน</th><th>Package</th><th>Phase</th><th>Discipline</th><th>Area</th>
                  <th>Status</th><th>Weight</th><th>%Progress</th><th>Start</th><th>Finish</th><th></th>
                </tr></thead>
                <tbody>${trHtml || `<tr><td colspan="12" style="text-align:center;color:var(--muted);padding:20px;">ไม่พบข้อมูลตามตัวกรอง</td></tr>`}</tbody>
              </table>
            </div>`;
          host.querySelectorAll('.tv-save-btn').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
              const tr = btn.closest('tr');
              const oldCode = btn.dataset.code;
              const orig = btn.textContent;
              btn.disabled = true; btn.textContent = '…';
              try{
                await saveActivityRowFull(oldCode, {
                  newCode: tr.querySelector('.tv-code-input').value.trim(),
                  name: tr.querySelector('.tv-name-input').value.trim(),
                  pkg: tr.querySelector('.tv-pkg-input').value.trim(),
                  disc: tr.querySelector('.tv-disc-input').value.trim(),
                  wbsDisc: tr.querySelector('.tv-wbsdisc-input').value,
                  area: tr.querySelector('.tv-area-input').value.trim(),
                  statusSel: tr.querySelector('.tv-status-input').value,
                  start: tr.querySelector('.tv-start-input').value || null,
                  end: tr.querySelector('.tv-end-input').value || null,
                  pct: tr.querySelector('.tv-progress').value,
                  wf: tr.querySelector('.tv-weight').value
                });
                btn.textContent = '✅';
                setTimeout(()=> renderGantt(), 500);
              }catch(e){
                btn.textContent = '⚠️';
                alert('บันทึกไม่สำเร็จ: ' + e.message);
                btn.disabled = false;
                setTimeout(()=>{ btn.textContent = orig; }, 1500);
              }
            });
          });
          host.querySelectorAll('.tv-del-btn').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
              const code = btn.dataset.code;
              const name = btn.dataset.name;
              btn.disabled = true;
              try{
                const removed = await deleteActivity(code, name);
                if(removed) renderGantt(); else btn.disabled = false;
              }catch(e){
                alert('ลบไม่สำเร็จ: ' + e.message);
                btn.disabled = false;
              }
            });
          });
        }

        const EXPORT_COLUMNS = [
          { key:'task_code', label:'task_code' },
          { key:'task_name', label:'task_name' },
          { key:'package', label:'package' },
          { key:'discipline', label:'discipline' },
          { key:'wbs_discipline', label:'wbs_discipline' },
          { key:'area', label:'area' },
          { key:'status_code', label:'status_code' },
          { key:'weight_factor', label:'weight_factor' },
          { key:'progress_pct', label:'progress_pct' },
          { key:'start_date', label:'start_date' },
          { key:'end_date', label:'end_date' }
        ];
        function exportColumns(rows){
          return rows.map(r=> EXPORT_COLUMNS.reduce((o,c)=>{ o[c.label] = r[c.key] ?? ''; return o; }, {}));
        }
        function toCsv(objRows){
          if(!objRows.length) return '';
          const headers = Object.keys(objRows[0]);
          const esc = (v)=>{
            const str = String(v ?? '');
            return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
          };
          const lines = [headers.map(esc).join(',')];
          objRows.forEach(row=> lines.push(headers.map(h=> esc(row[h])).join(',')));
          return lines.join('\r\n');
        }
        function downloadBlob(content, filename, mime){
          const blob = new Blob([content], { type: mime });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = filename;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(()=> URL.revokeObjectURL(url), 1000);
        }
        const SUB_EXPORT_COLUMNS = [
          { key:'id', label:'id' },
          { key:'task_code', label:'task_code' },
          { key:'name', label:'name' },
          { key:'spec', label:'spec' },
          { key:'weight_factor', label:'weight_factor' },
          { key:'unit_boq', label:'unit_boq' },
          { key:'estimate_boq', label:'estimate_boq' },
          { key:'actual_boq', label:'actual_boq' },
          { key:'poc_manual', label:'poc_manual' }
        ];
        function exportSubColumns(subRows){
          return subRows.map(r=> SUB_EXPORT_COLUMNS.reduce((o,c)=>{ o[c.label] = r[c.key] ?? ''; return o; }, {}));
        }
        function subActivitiesForRows(rows){
          const codes = new Set(rows.map(r=>r.task_code));
          return subActs.filter(s=> codes.has(s.task_code));
        }
        function exportCsvFile(rows){
          const objRows = exportColumns(rows);
          const csv = '﻿' + toCsv(objRows);
          downloadBlob(csv, 'project_schedule_' + todayISO() + '.csv', 'text/csv;charset=utf-8;');
        }
        function exportSubCsvFile(rows){
          const subRows = subActivitiesForRows(rows);
          const objRows = exportSubColumns(subRows);
          const csv = '﻿' + toCsv(objRows);
          downloadBlob(csv, 'project_schedule_sub_activities_' + todayISO() + '.csv', 'text/csv;charset=utf-8;');
        }
        function exportXlsxFile(rows){
          if(typeof XLSX === 'undefined'){ alert('ไม่สามารถโหลดไลบรารี Excel ได้ กรุณาใช้ Export CSV แทน'); return; }
          const objRows = exportColumns(rows);
          const subRows = subActivitiesForRows(rows);
          const subObjRows = exportSubColumns(subRows);
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(objRows);
          XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
          const ws2 = subObjRows.length ? XLSX.utils.json_to_sheet(subObjRows) : XLSX.utils.aoa_to_sheet([SUB_EXPORT_COLUMNS.map(c=>c.label)]);
          XLSX.utils.book_append_sheet(wb, ws2, 'Sub Activities');
          XLSX.writeFile(wb, 'project_schedule_' + todayISO() + '.xlsx');
        }
        function parseCsvText(text){
          const rows = [];
          let row = [], field = '', inQuotes = false;
          text = text.replace(/^﻿/, '');
          for(let i=0; i<text.length; i++){
            const c = text[i];
            if(inQuotes){
              if(c === '"'){
                if(text[i+1] === '"'){ field += '"'; i++; }
                else inQuotes = false;
              } else field += c;
            } else {
              if(c === '"') inQuotes = true;
              else if(c === ','){ row.push(field); field = ''; }
              else if(c === '\n'){ row.push(field); rows.push(row); row = []; field = ''; }
              else if(c === '\r'){ /* skip */ }
              else field += c;
            }
          }
          if(field !== '' || row.length){ row.push(field); rows.push(row); }
          return rows.filter(r => r.length > 1 || (r.length===1 && r[0] !== ''));
        }
        function rowsToObjects(rows){
          if(!rows.length) return [];
          const headers = rows[0].map(h=> String(h).trim());
          return rows.slice(1).map(r=>{
            const o = {};
            headers.forEach((h,i)=> o[h] = r[i]);
            return o;
          });
        }
        // จำแนกว่า sheet/CSV นี้เป็นตาราง Activity หลัก หรือ Sub Activities จากชื่อคอลัมน์ที่มี
        function classifySheetHeaders(headers){
          const set = new Set(headers.map(h=> String(h).trim()));
          if(set.has('task_code') && set.has('task_name')) return 'main';
          if(set.has('task_code') && (set.has('name') || set.has('spec') || set.has('unit_boq') || set.has('estimate_boq') || set.has('actual_boq') || set.has('poc_manual') || set.has('id'))) return 'sub';
          return null;
        }
        async function handleImportFile(file){
          try{
            let mainObjRows = [];
            let subObjRows = [];
            const ext = file.name.split('.').pop().toLowerCase();
            if(ext === 'csv'){
              const text = await file.text();
              const objRows = rowsToObjects(parseCsvText(text));
              const headers = objRows.length ? Object.keys(objRows[0]) : [];
              const kind = classifySheetHeaders(headers);
              if(kind === 'sub') subObjRows = objRows;
              else mainObjRows = objRows;
            } else {
              if(typeof XLSX === 'undefined'){ alert('ไม่สามารถโหลดไลบรารี Excel ได้ กรุณาใช้ไฟล์ CSV แทน'); return; }
              const buf = await file.arrayBuffer();
              const wb = XLSX.read(buf, { type:'array' });
              wb.SheetNames.forEach(sheetName=>{
                const ws = wb.Sheets[sheetName];
                const objRows = XLSX.utils.sheet_to_json(ws, { defval:'' });
                if(!objRows.length) return;
                const headers = Object.keys(objRows[0]);
                const kind = classifySheetHeaders(headers);
                if(kind === 'sub') subObjRows = subObjRows.concat(objRows);
                else if(kind === 'main') mainObjRows = mainObjRows.concat(objRows);
              });
            }

            // ----- Activity หลัก: Weight Factor / %Progress -----
            const mainUpdates = [];
            const notFound = [];
            mainObjRows.forEach(o=>{
              const code = String(o.task_code ?? '').trim();
              if(!code) return;
              const row = data.find(x=>x.task_code === code);
              if(!row){ notFound.push(code); return; }
              const hasWf = o.weight_factor !== undefined && o.weight_factor !== '';
              const hasPct = o.progress_pct !== undefined && o.progress_pct !== '';
              if(!hasWf && !hasPct) return;
              const wf = hasWf ? Number(o.weight_factor) : row.weight_factor;
              const pct = hasPct ? Number(o.progress_pct) : row.progress_pct;
              if(isNaN(wf) || isNaN(pct)) return;
              if(Number(wf) === Number(row.weight_factor) && Number(pct) === Number(row.progress_pct)) return;
              mainUpdates.push({ code, wf, pct });
            });

            // ----- Sub Activities: id มี = แก้ไขรายการเดิม, id ไม่มี = เพิ่มรายการใหม่ให้ task_code นั้น -----
            const subUpdates = [];
            const subInserts = [];
            subObjRows.forEach(o=>{
              const code = String(o.task_code ?? '').trim();
              if(!code) return;
              if(!data.some(x=>x.task_code===code)){ notFound.push(code + ' (sub activity)'); return; }
              const idRaw = String(o.id ?? '').trim();
              const name = String(o.name ?? '').trim();
              const specRaw = (o.spec === undefined) ? null : String(o.spec).trim();
              const weight_factor = (o.weight_factor === '' || o.weight_factor === undefined) ? null : Number(o.weight_factor);
              const unit_boq = (o.unit_boq === undefined) ? '' : String(o.unit_boq);
              const estimate_boq = (o.estimate_boq === '' || o.estimate_boq === undefined) ? null : Number(o.estimate_boq);
              const actual_boq = (o.actual_boq === '' || o.actual_boq === undefined) ? null : Number(o.actual_boq);
              const poc_manual = (o.poc_manual === '' || o.poc_manual === undefined) ? null : Number(o.poc_manual);
              if(idRaw){
                const existing = subActs.find(s=> String(s.id) === idRaw);
                if(!existing){ notFound.push(code + ' (sub id ' + idRaw + ' ไม่พบ)'); return; }
                const changed = (name && name !== existing.name)
                  || (specRaw !== null && specRaw !== (existing.spec||''))
                  || (weight_factor!==null && Number(weight_factor)!==Number(existing.weight_factor))
                  || (unit_boq !== (existing.unit_boq||''))
                  || (estimate_boq!==null && Number(estimate_boq)!==Number(existing.estimate_boq))
                  || (String(actual_boq) !== String(existing.actual_boq===undefined||existing.actual_boq===null?'':Number(existing.actual_boq)))
                  || (String(poc_manual) !== String(existing.poc_manual===undefined||existing.poc_manual===null?'':Number(existing.poc_manual)));
                if(!changed) return;
                subUpdates.push({ id: existing.id, patch: {
                  name: name || existing.name,
                  spec: specRaw===null ? (existing.spec||'') : specRaw,
                  weight_factor: weight_factor===null ? (Number(existing.weight_factor)||0) : weight_factor,
                  unit_boq: unit_boq,
                  estimate_boq: estimate_boq===null ? (Number(existing.estimate_boq)||0) : estimate_boq,
                  actual_boq: actual_boq,
                  poc_manual: poc_manual
                }});
              } else {
                if(!name) return;
                subInserts.push({ task_code: code, name, spec: specRaw||'', weight_factor: weight_factor||0, unit_boq, estimate_boq: estimate_boq||0, actual_boq, poc_manual });
              }
            });

            const totalChanges = mainUpdates.length + subUpdates.length + subInserts.length;
            if(!totalChanges){
              alert('ไม่พบข้อมูลที่เปลี่ยนแปลง' + (notFound.length ? ' (มีรายการที่จับคู่กับระบบไม่ได้ ' + notFound.length + ' รายการ)' : ''));
              return;
            }
            const confirmMsg = 'พบการเปลี่ยนแปลง:\n'
              + '- Activity หลัก (Weight/%Progress): ' + mainUpdates.length + ' รายการ\n'
              + '- Sub Activity ที่แก้ไข: ' + subUpdates.length + ' รายการ\n'
              + '- Sub Activity ใหม่: ' + subInserts.length + ' รายการ'
              + (notFound.length ? '\n(ข้าม ' + notFound.length + ' รายการที่จับคู่กับระบบไม่ได้)' : '')
              + '\n\nยืนยันการอัปเดตหรือไม่?';
            if(!confirm(confirmMsg)) return;

            let okCount = 0, failCount = 0;
            for(const u of mainUpdates){
              try{ await saveActivityFields(u.code, u.pct, u.wf); okCount++; }
              catch(e){ failCount++; }
            }
            for(const u of subUpdates){
              try{
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_sub_activities?id=eq.' + encodeURIComponent(u.id), {
                  method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                  body: JSON.stringify({ ...u.patch, updated_at: new Date().toISOString() })
                });
                if(!res.ok) throw new Error('PATCH failed');
                const s = subActs.find(x=> String(x.id) === String(u.id));
                if(s) Object.assign(s, u.patch);
                okCount++;
              }catch(e){ failCount++; }
            }
            for(const ins of subInserts){
              try{
                const existingSubs = subActByTask.get(ins.task_code) || [];
                const nextSort = existingSubs.reduce((m,x)=> Math.max(m, Number(x.sort_order)||0), 0) + 1;
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_sub_activities', {
                  method:'POST', headers: { ...HEADERS, 'Prefer':'return=representation' },
                  body: JSON.stringify({ task_code: ins.task_code, name: ins.name, spec: ins.spec, weight_factor: ins.weight_factor, unit_boq: ins.unit_boq, estimate_boq: ins.estimate_boq, actual_boq: ins.actual_boq, poc_manual: ins.poc_manual, sort_order: nextSort, source_sheet: null, source_row: null })
                });
                if(!res.ok) throw new Error('POST failed');
                const rowsRes = await res.json();
                if(rowsRes && rowsRes[0]) addSubActivityLocal(rowsRes[0]);
                okCount++;
              }catch(e){ failCount++; }
            }
            alert('อัปเดตสำเร็จ ' + okCount + ' รายการ' + (failCount ? ', ล้มเหลว ' + failCount + ' รายการ' : ''));
            renderGantt();
          }catch(e){
            alert('นำเข้าไฟล์ไม่สำเร็จ: ' + e.message);
          }
        }

        function renderGantt(){
          const pxPerDay = ZOOM_LEVELS[schZoom];
          const timelineWidth = Math.max(600, Math.round(totalDays * pxPerDay));
          const qMatchedViaSub = new Set();
          let filtered = data.filter(r=>{
            if(schFilters.pkg!=='all' && r.package!==schFilters.pkg) return false;
            if(schFilters.disc!=='all' && r.discipline!==schFilters.disc) return false;
            if(schFilters.wbsDisc!=='all' && r.wbs_discipline!==schFilters.wbsDisc) return false;
            if(schFilters.area!=='all' && r.area!==schFilters.area) return false;
            if(schFilters.statusSet.size < ALL_STATUS_OPTS.length){
              const rowIsDelayed = isRowDelayed(r);
              const matches = schFilters.statusSet.has(r.status_code) || (schFilters.statusSet.has('Delay') && rowIsDelayed);
              if(!matches) return false;
            }
            if(schFilters.q){
              const q = schFilters.q.toLowerCase();
              const ownMatch = String(r.task_code).toLowerCase().includes(q) || String(r.task_name).toLowerCase().includes(q);
              const subMatch = (subActByTask.get(r.task_code)||[]).some(s=> String(s.name||'').toLowerCase().includes(q));
              if(!ownMatch && !subMatch) return false;
              if(subMatch) qMatchedViaSub.add(r.task_code);
            }
            return true;
          });
          // ถ้าค้นเจอจาก Sub Activity ให้เปิด panel นั้นให้ดูเลยโดยอัตโนมัติ
          qMatchedViaSub.forEach(code=> schExpandedSub.add(code));
          filtered = sortRows(filtered);
          document.getElementById('schKpiRow').innerHTML = kpiHtml(filtered);
          updateToggleAllSubBtn();
          lastFiltered = filtered;

          if(schViewMode === 'table'){ renderTableView(filtered); return; }
          if(schViewMode === 'scurve'){ renderSCurve(filtered); return; }

          const groups = buildGroups(filtered);
          const ticks = buildTicks(pxPerDay);
          const todayIso = todayISO();
          const todayOff = dayOffset(todayIso);
          const todayLeft = (todayOff>=0 && todayOff<=totalDays) ? todayOff*pxPerDay : 0;
          const todaySegHtml = `<div class="gantt-today" style="left:${todayLeft}px;"></div>`;

          let rowsHtml = '';
          let curY = 0;
          const progressPts = [];
          const progressDots = [];

          function subPanelHtml(r, subRows){
          const h = subPanelHeight(subRows.length);
          const rollup = rollupPoc(subRows);
          const bodyHtml = subRows.map(s=>{
            const eff = effectivePoc(s);
            const isManual = s.poc_manual !== null && s.poc_manual !== undefined && s.poc_manual !== '';
            const actVal = (s.actual_boq===null || s.actual_boq===undefined) ? '' : Number(s.actual_boq);
            return `<tr data-subid="${s.id}">
              <td class="sa-name"><input type="text" class="sa-input sa-name-input" value="${escapeHtml(s.name)}" title="ชื่อ Sub Activity"></td>
              <td><input type="text" class="sa-input sa-spec" value="${escapeHtml(s.spec||'')}" title="Spec / รายละเอียดงาน"></td>
              <td><input type="number" step="0.0001" class="sa-input sa-weight" value="${Number(s.weight_factor)||0}"></td>
              <td><input type="text" class="sa-input sa-unit" value="${escapeHtml(s.unit_boq||'')}"></td>
              <td><input type="number" step="0.01" class="sa-input sa-est" value="${Number(s.estimate_boq)||0}"></td>
              <td><input type="number" step="0.01" class="sa-input sa-act" value="${actVal}"></td>
              <td><input type="number" step="0.01" min="0" max="100" class="sa-input sa-pocm" placeholder="auto" value="${isManual?Number(s.poc_manual):''}" title="เว้นว่าง = คำนวณอัตโนมัติจาก Actual/Estimate BOQ"></td>
              <td class="sa-eff${isManual?' sa-manual':''}" title="${isManual?'ค่านี้ถูก override ด้วยมือ':'คำนวณอัตโนมัติจาก Actual/Estimate BOQ'}">${eff.toFixed(2)}%</td>
              <td class="sa-actions"><button class="sa-save-btn" data-id="${s.id}" title="บันทึก">💾</button><button class="sa-del-btn" data-id="${s.id}" title="ลบรายการนี้">🗑</button></td>
            </tr>`;
          }).join('');
          return `<div class="gantt-subpanel" style="height:${h}px;grid-column:1 / -1;">
            <div class="gantt-subpanel-inner">
              <table class="sa-table">
                <thead><tr><th>Sub Activity (BOQ)</th><th>Spec</th><th>Weight</th><th>Unit</th><th>Est. BOQ</th><th>Actual BOQ</th><th>%POC Manual</th><th>%POC ใช้จริง</th><th></th></tr></thead>
                <tbody>${bodyHtml}</tbody>
              </table>
              <div class="sa-footer">
                <span>Weighted Rollup %POC จาก ${subRows.length} sub activities: <b>${rollup===null?'-':rollup.toFixed(2)+'%'}</b></span>
                ${rollup!==null ? `<button class="sa-apply-btn" data-code="${escapeHtml(r.task_code)}" data-poc="${rollup}">ใช้ค่านี้เป็น % ความคืบหน้าของงานหลัก</button>` : ''}
                <button class="sa-add-btn" data-code="${escapeHtml(r.task_code)}" title="เพิ่มรายการ Sub Activity ใหม่">➕ เพิ่มรายการ</button>
              </div>
            </div>
          </div>`;
        }

        function groupHeaderRow(key, label, count, pct, collapsed, isSub){
            const cls = 'gantt-label grp' + (isSub?' sub':'') + (collapsed?' collapsed':'');
            const rowCls = 'gantt-row grp' + (isSub?' sub':'');
            rowsHtml += `<div class="${cls}" data-grpkey="${escapeHtml(key)}" style="height:${GROUP_ROW_H}px;"><span class="car">▾</span><span>${escapeHtml(label)} (${count}) — ${pct}%</span></div>`;
            rowsHtml += `<div class="${rowCls}" style="height:${GROUP_ROW_H}px;width:${timelineWidth}px;">${todaySegHtml}</div>`;
            curY += GROUP_ROW_H;
          }
          function taskRow(r){
            const titleAttr = escapeHtml(r.task_code + ' — ' + r.task_name + ' (' + areaLabel(r.area) + ')\n' + r.status_code + '\n' + (r.start_date||'?') + ' → ' + (r.end_date||'?'));
            const pct = Math.max(0, Math.min(100, Number(r.progress_pct)||0));
            const subRows = subActByTask.get(r.task_code) || [];
            const hasSub = subRows.length > 0;
            const canManageSub = !r.is_milestone;
            const subExpanded = canManageSub && schExpandedSub.has(r.task_code);
            let bar = '';
            if(r.is_milestone){
              const d = r.end_date || r.start_date;
              if(d){ const left = dayOffset(d)*pxPerDay;
                bar = `<div class="gantt-milestone" style="left:${left}px;background:#F59E0B;" title="${titleAttr}"></div>`;
              }
            } else if(r.start_date && r.end_date){
              const sx = dayOffset(r.start_date)*pxPerDay;
              const ex = sx + Math.max(4, (dayOffset(r.end_date)-dayOffset(r.start_date))*pxPerDay);
              if(pct >= 100){
                bar = `<div class="gantt-bar" style="left:${sx}px;width:${ex-sx}px;background:#16A34A;" title="${titleAttr}"></div>`;
              } else {
                // ด้านที่ทำไปแล้ว (ตาม %) = เขียว, ช่วงที่ผ่านวันนี้มาแล้วแต่ยังไม่เสร็จ (ดีเลย์ แม้ 0%) = แดงอ่อน, ช่วงในอนาคตที่ยังไม่ถึงกำหนด = สีสถานะปกติ
                const doneW = (ex - sx) * pct / 100;
                const doneEndX = sx + doneW;
                const todayXClamped = Math.max(sx, Math.min(ex, todayLeft));
                const normalColor = STATUS_COLORS[r.status_code] || '#94A3B8';
                const segs = [];
                if(doneW > 0) segs.push([sx, doneW, '#16A34A']);
                if(todayXClamped > doneEndX){
                  segs.push([doneEndX, todayXClamped - doneEndX, '#FCA5A5']);
                  if(ex > todayXClamped) segs.push([todayXClamped, ex - todayXClamped, normalColor]);
                } else if(ex > doneEndX){
                  segs.push([doneEndX, ex - doneEndX, normalColor]);
                }
                bar = segs.map(([x,w,c])=>`<div class="gantt-bar" style="left:${x}px;width:${w}px;background:${c};" title="${titleAttr}"></div>`).join('');
              }
            }
            rowsHtml += `<div class="gantt-label task" style="height:${TASK_ROW_H}px;">
              <div class="code-line" title="${titleAttr}">${canManageSub?`<button class="gantt-sub-toggle" data-code="${escapeHtml(r.task_code)}" title="ดู/แก้ไข/เพิ่ม Sub Activities${hasSub?' ('+subRows.length+')':''}">${subExpanded?'▾':'▸'}</button>`:''}${escapeHtml(r.task_code)}${hasSub?` <span class="sub-badge">(${subRows.length})</span>`:''}<button class="gantt-task-del-btn" data-code="${escapeHtml(r.task_code)}" data-name="${escapeHtml(r.task_name)}" title="ลบ Activity นี้ออกจากตารางงาน">🗑</button></div>
              <div class="name-line">
                <span class="name">${escapeHtml(r.task_name)}</span>
                <input type="number" class="gantt-weight-input" min="0" step="0.01" value="${Number(r.weight_factor)!=null ? Number(r.weight_factor) : 1}" data-code="${escapeHtml(r.task_code)}" title="Weight Factor — ใช้ถ่วงน้ำหนัก % Progress ของกลุ่ม/โปรเจกต์">
                <input type="number" class="gantt-progress-input" min="0" max="100" step="0.01" value="${pct}" data-code="${escapeHtml(r.task_code)}" title="% ความคืบหน้า (ใส่ทศนิยมได้)">
                <button class="gantt-save-btn" data-code="${escapeHtml(r.task_code)}" title="บันทึก Weight Factor และ % ความคืบหน้า">💾</button>
              </div>
            </div>`;
            rowsHtml += `<div class="gantt-row" style="height:${TASK_ROW_H}px;width:${timelineWidth}px;">${bar}${todaySegHtml}</div>`;
            if(isEligibleForProgressLine(r)){
              const rowTop = curY, rowMid = curY + TASK_ROW_H/2, rowBottom = curY + TASK_ROW_H;
              const px = progressX(r, pxPerDay, todayLeft);
              // กลับมาที่เส้น "วันนี้" ก่อน แล้วค่อยลากออกไปหาจุด progress ของงานนี้ แล้วกลับเข้าเส้นวันนี้อีกครั้ง
              progressPts.push([todayLeft, rowTop]);
              progressPts.push([px, rowMid]);
              progressPts.push([todayLeft, rowBottom]);
              progressDots.push([px, rowMid]);
            }
            curY += TASK_ROW_H;
            if(subExpanded){
              rowsHtml += subPanelHtml(r, subRows);
              curY += subPanelHeight(subRows.length);
            }
          }

          groups.forEach(g=>{
            const gPct = Math.round(weightedAvgProgress(g.rows)*10)/10;
            const collapsed = schCollapsed.has(g.key);
            if(schFilters.groupBy1 !== 'none') groupHeaderRow(g.key, g.label, g.rows.length, gPct, collapsed, false);
            if(collapsed && schFilters.groupBy1 !== 'none') return;
            if(g.children){
              g.children.forEach(child=>{
                const cPct = Math.round(weightedAvgProgress(child.rows)*10)/10;
                const cCollapsed = schCollapsed.has(child.key);
                groupHeaderRow(child.key, child.label, child.rows.length, cPct, cCollapsed, true);
                if(cCollapsed) return;
                child.rows.forEach(r=>taskRow(r));
              });
            } else {
              g.rows.forEach(r=>taskRow(r));
            }
          });

          const ticksHtml = ticks.map(m=>`<div class="gantt-month-line${m.strong?'':' minor'}" style="left:${m.left}px;"></div><div class="gantt-month-label${m.strong?'':' minor'}" style="left:${m.left}px;">${escapeHtml(m.label)}</div>`).join('');

          let progressLineSvg = '';
          if(progressPts.length){
            const pointsStr = todayLeft + ',0 ' + progressPts.map(p=>p[0]+','+p[1]).join(' ');
            const dots = progressDots.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#DC2626"/>`).join('');
            progressLineSvg = `<svg class="gantt-progress-line" style="position:absolute;top:${HEADER_H}px;left:${schLabelColW}px;width:${timelineWidth}px;height:${curY}px;pointer-events:none;overflow:visible;">
              <polyline points="${pointsStr}" fill="none" stroke="#DC2626" stroke-width="1.5" stroke-dasharray="5 3" opacity=".85"/>
              ${dots}
            </svg>`;
          }

          // จำตำแหน่ง scroll เดิมไว้ก่อน re-render (ไม่งั้นจอจะเด้งกลับบนสุดทุกครั้งที่กด Save/เปลี่ยนตัวกรอง)
          const prevScrollEl = document.querySelector('#schGanttHost .gantt-scroll');
          const prevScrollLeft = prevScrollEl ? prevScrollEl.scrollLeft : 0;
          const prevScrollTop = prevScrollEl ? prevScrollEl.scrollTop : 0;

          document.getElementById('schGanttHost').innerHTML = `
            <div class="gantt-scroll">
              <div class="gantt-grid" style="position:relative;grid-template-columns:${schLabelColW}px auto;">
                <div class="gantt-header-label" style="height:${HEADER_H}px;">Activity ID / กิจกรรม (${filtered.length})<div class="gantt-col-resizer" id="schColResizer" title="ลากเพื่อปรับความกว้างคอลัมน์"></div></div>
                <div class="gantt-header-timeline" style="height:${HEADER_H}px;width:${timelineWidth}px;">${ticksHtml}${todaySegHtml}</div>
                ${rowsHtml}
                ${progressLineSvg}
              </div>
            </div>`;

          const newScrollEl = document.querySelector('#schGanttHost .gantt-scroll');
          if(newScrollEl){ newScrollEl.scrollLeft = prevScrollLeft; newScrollEl.scrollTop = prevScrollTop; }

          const resizer = document.getElementById('schColResizer');
          if(resizer){
            resizer.addEventListener('mousedown', (e)=>{
              e.preventDefault();
              const startX = e.clientX;
              const startW = schLabelColW;
              resizer.classList.add('dragging');
              function onMove(ev){
                const newW = Math.max(160, Math.min(600, startW + (ev.clientX - startX)));
                schLabelColW = newW;
                const gridEl = document.querySelector('#schGanttHost .gantt-grid');
                if(gridEl) gridEl.style.gridTemplateColumns = newW + 'px auto';
                const svgEl = document.querySelector('#schGanttHost .gantt-progress-line');
                if(svgEl) svgEl.style.left = newW + 'px';
              }
              function onUp(){
                resizer.classList.remove('dragging');
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
              }
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            });
          }

          document.querySelectorAll('#schGanttHost .gantt-label.grp').forEach(el=>{
            el.addEventListener('click', ()=>{
              const k = el.dataset.grpkey;
              if(schCollapsed.has(k)) schCollapsed.delete(k); else schCollapsed.add(k);
              renderGantt();
            });
          });

          document.querySelectorAll('#schGanttHost .gantt-save-btn').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
              const code = btn.dataset.code;
              const input = btn.parentElement.querySelector('.gantt-progress-input');
              const weightInput = btn.parentElement.querySelector('.gantt-weight-input');
              let val = Math.round(Number(input.value) * 100) / 100;
              if(isNaN(val)) val = 0;
              val = Math.max(0, Math.min(100, val));
              input.value = val;
              let wf = Math.round(Number(weightInput.value) * 100) / 100;
              if(isNaN(wf) || wf < 0) wf = 0;
              weightInput.value = wf;
              const newStatus = val <= 0 ? 'Not Started' : (val >= 100 ? 'Completed' : 'In Progress');
              const origText = btn.textContent;
              btn.disabled = true; btn.textContent = '…';
              try{
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_activities?task_code=eq.' + encodeURIComponent(code), {
                  method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                  body: JSON.stringify({ progress_pct: val, status_code: newStatus, weight_factor: wf })
                });
                if(!res.ok) throw new Error('บันทึกไม่สำเร็จ (' + res.status + ')');
                const row = data.find(x=>x.task_code===code);
                if(row){ row.progress_pct = val; row.status_code = newStatus; row.weight_factor = wf; }
                btn.textContent = '✅';
                setTimeout(()=>renderGantt(), 500);
              }catch(e){
                btn.textContent = '⚠️';
                alert('บันทึกไม่สำเร็จ: ' + e.message);
                btn.disabled = false;
                setTimeout(()=>{ btn.textContent = origText; }, 1500);
              }
            });
          });

          document.querySelectorAll('#schGanttHost .gantt-task-del-btn').forEach(btn=>{
            btn.addEventListener('click', async (e)=>{
              e.stopPropagation();
              const code = btn.dataset.code;
              const name = btn.dataset.name;
              btn.disabled = true;
              try{
                const removed = await deleteActivity(code, name);
                if(removed) renderGantt(); else btn.disabled = false;
              }catch(err){
                alert('ลบไม่สำเร็จ: ' + err.message);
                btn.disabled = false;
              }
            });
          });

          document.querySelectorAll('#schGanttHost .gantt-sub-toggle').forEach(btn=>{
            btn.addEventListener('click', (e)=>{
              e.stopPropagation();
              const code = btn.dataset.code;
              if(schExpandedSub.has(code)) schExpandedSub.delete(code); else schExpandedSub.add(code);
              renderGantt();
            });
          });

          document.querySelectorAll('#schGanttHost .sa-save-btn').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
              const id = btn.dataset.id;
              const tr = btn.closest('tr');
              const name = tr.querySelector('.sa-name-input').value.trim();
              const spec = tr.querySelector('.sa-spec').value.trim();
              const weight = Number(tr.querySelector('.sa-weight').value) || 0;
              const unit = tr.querySelector('.sa-unit').value;
              const est = Number(tr.querySelector('.sa-est').value) || 0;
              const actRaw = tr.querySelector('.sa-act').value;
              const act = actRaw === '' ? null : Number(actRaw);
              const pocmRaw = tr.querySelector('.sa-pocm').value;
              const pocm = pocmRaw === '' ? null : Math.max(0, Math.min(100, Number(pocmRaw)));
              if(!name){ alert('กรุณากรอกชื่อ Sub Activity'); return; }
              const origText = btn.textContent;
              btn.disabled = true; btn.textContent = '…';
              try{
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_sub_activities?id=eq.' + encodeURIComponent(id), {
                  method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                  body: JSON.stringify({ name: name, spec: spec, weight_factor: weight, unit_boq: unit, estimate_boq: est, actual_boq: act, poc_manual: pocm, updated_at: new Date().toISOString() })
                });
                if(!res.ok) throw new Error('บันทึกไม่สำเร็จ (' + res.status + ')');
                const s = subActs.find(x=> String(x.id) === String(id));
                if(s){ s.name = name; s.spec = spec; s.weight_factor = weight; s.unit_boq = unit; s.estimate_boq = est; s.actual_boq = act; s.poc_manual = pocm; }
                btn.textContent = '✅';
                setTimeout(()=>renderGantt(), 500);
              }catch(e){
                btn.textContent = '⚠️';
                alert('บันทึกไม่สำเร็จ: ' + e.message);
                btn.disabled = false;
                setTimeout(()=>{ btn.textContent = origText; }, 1500);
              }
            });
          });

          document.querySelectorAll('#schGanttHost .sa-apply-btn').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
              const code = btn.dataset.code;
              const poc = Math.max(0, Math.min(100, Math.round(Number(btn.dataset.poc) * 100) / 100));
              const newStatus = poc <= 0 ? 'Not Started' : (poc >= 100 ? 'Completed' : 'In Progress');
              const origText = btn.textContent;
              btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
              try{
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_activities?task_code=eq.' + encodeURIComponent(code), {
                  method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' },
                  body: JSON.stringify({ progress_pct: poc, status_code: newStatus })
                });
                if(!res.ok) throw new Error('บันทึกไม่สำเร็จ (' + res.status + ')');
                const row = data.find(x=>x.task_code===code);
                if(row){ row.progress_pct = poc; row.status_code = newStatus; }
                btn.textContent = '✅ บันทึกแล้ว';
                setTimeout(()=>renderGantt(), 600);
              }catch(e){
                btn.textContent = '⚠️';
                alert('บันทึกไม่สำเร็จ: ' + e.message);
                btn.disabled = false;
                setTimeout(()=>{ btn.textContent = origText; }, 1500);
              }
            });
          });

          document.querySelectorAll('#schGanttHost .sa-add-btn').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
              const code = btn.dataset.code;
              const existing = subActByTask.get(code) || [];
              const nextSort = existing.reduce((m,x)=> Math.max(m, Number(x.sort_order)||0), 0) + 1;
              const origText = btn.textContent;
              btn.disabled = true; btn.textContent = 'กำลังเพิ่ม...';
              try{
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_sub_activities', {
                  method:'POST', headers: { ...HEADERS, 'Prefer':'return=representation' },
                  body: JSON.stringify({ task_code: code, name: 'รายการใหม่', spec: '', weight_factor: 0, unit_boq: '', estimate_boq: 0, actual_boq: null, poc_manual: null, sort_order: nextSort, source_sheet: null, source_row: null })
                });
                if(!res.ok) throw new Error('เพิ่มรายการไม่สำเร็จ (' + res.status + ')');
                const rows = await res.json();
                if(rows && rows[0]) addSubActivityLocal(rows[0]);
                schExpandedSub.add(code);
                renderGantt();
              }catch(e){
                alert('เพิ่มรายการไม่สำเร็จ: ' + e.message);
                btn.disabled = false;
                btn.textContent = origText;
              }
            });
          });

          document.querySelectorAll('#schGanttHost .sa-del-btn').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
              const id = btn.dataset.id;
              const tr = btn.closest('tr');
              const nameTxt = tr ? tr.querySelector('.sa-name-input').value : '';
              if(!confirm('ลบรายการ Sub Activity "' + nameTxt + '" ใช่หรือไม่?')) return;
              btn.disabled = true;
              try{
                const res = await fetch(SUPABASE_URL + '/rest/v1/project_schedule_sub_activities?id=eq.' + encodeURIComponent(id), {
                  method:'DELETE', headers: { ...HEADERS, 'Prefer':'return=minimal' }
                });
                if(!res.ok) throw new Error('ลบไม่สำเร็จ (' + res.status + ')');
                removeSubActivityLocal(id);
                renderGantt();
              }catch(e){
                alert('ลบไม่สำเร็จ: ' + e.message);
                btn.disabled = false;
              }
            });
          });
        }

        renderGantt();

        document.getElementById('schViewToggleBtn').addEventListener('click', ()=>{
          schViewMode = schViewMode === 'gantt' ? 'table' : 'gantt';
          const btn = document.getElementById('schViewToggleBtn');
          btn.textContent = schViewMode === 'table' ? '📅 มุมมอง Gantt' : '🗂 มุมมองตาราง';
          btn.classList.toggle('active', schViewMode === 'table');
          document.getElementById('schScurveToggleBtn').classList.remove('active');
          renderGantt();
        });
        document.getElementById('schScurveToggleBtn').addEventListener('click', ()=>{
          schViewMode = 'scurve';
          document.getElementById('schScurveToggleBtn').classList.add('active');
          const btn = document.getElementById('schViewToggleBtn');
          btn.textContent = '🗂 มุมมองตาราง';
          btn.classList.remove('active');
          renderGantt();
        });
        document.getElementById('schAddTaskBtn').addEventListener('click', ()=> openAddTaskModal());
        document.getElementById('schWbsWeightBtn').addEventListener('click', ()=> openWbsWeightsModal());
        document.getElementById('schPhaseWeightBtn').addEventListener('click', ()=> openPhaseWeightsModal());
        document.getElementById('schExportCsvBtn').addEventListener('click', ()=> exportCsvFile(lastFiltered));
        document.getElementById('schExportSubCsvBtn').addEventListener('click', ()=> exportSubCsvFile(lastFiltered));
        document.getElementById('schExportXlsxBtn').addEventListener('click', ()=> exportXlsxFile(lastFiltered));
        document.getElementById('schImportBtn').addEventListener('click', ()=> document.getElementById('schImportFile').click());
        document.getElementById('schImportFile').addEventListener('change', (e)=>{
          const file = e.target.files && e.target.files[0];
          e.target.value = '';
          if(file) handleImportFile(file);
        });
        document.getElementById('schPkg').addEventListener('change', (e)=>{ schFilters.pkg = e.target.value; renderGantt(); });
        document.getElementById('schDisc').addEventListener('change', (e)=>{ schFilters.disc = e.target.value; renderGantt(); });
        document.getElementById('schWbsDisc').addEventListener('change', (e)=>{ schFilters.wbsDisc = e.target.value; renderGantt(); });
        document.getElementById('schArea').addEventListener('change', (e)=>{ schFilters.area = e.target.value; renderGantt(); });
        document.getElementById('schStatusBtn').addEventListener('click', (e)=>{
          e.stopPropagation();
          document.getElementById('schStatusPanel').hidden = !document.getElementById('schStatusPanel').hidden;
        });
        document.getElementById('schStatusPanel').addEventListener('click', (e)=> e.stopPropagation());
        document.addEventListener('click', ()=>{
          const p = document.getElementById('schStatusPanel');
          if(p) p.hidden = true;
        });
        document.querySelectorAll('.sch-status-cb').forEach(cb=>{
          cb.addEventListener('change', ()=>{
            if(cb.checked) schFilters.statusSet.add(cb.value); else schFilters.statusSet.delete(cb.value);
            updateStatusBtnLabel();
            renderGantt();
          });
        });
        document.getElementById('schSearch').addEventListener('input', (e)=>{ schFilters.q = e.target.value; renderGantt(); });
        document.getElementById('schGroupBy1').addEventListener('change', (e)=>{ schFilters.groupBy1 = e.target.value; schCollapsed.clear(); renderGantt(); });
        document.getElementById('schGroupBy2').addEventListener('change', (e)=>{ schFilters.groupBy2 = e.target.value; schCollapsed.clear(); renderGantt(); });
        document.getElementById('schSortBy').addEventListener('change', (e)=>{ schFilters.sortBy = e.target.value; renderGantt(); });
        document.querySelectorAll('.gantt-zoom-btn').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            schZoom = btn.dataset.zoom;
            document.querySelectorAll('.gantt-zoom-btn').forEach(b=>b.classList.toggle('active', b===btn));
            renderGantt();
          });
        });
        document.getElementById('schToggleAllSub').addEventListener('click', ()=>{
          const codes = Array.from(subActByTask.keys());
          const allExpanded = codes.length>0 && codes.every(c=>schExpandedSub.has(c));
          if(allExpanded) codes.forEach(c=>schExpandedSub.delete(c));
          else codes.forEach(c=>schExpandedSub.add(c));
          renderGantt();
        });
      }
    },
    {
      id:'dash_visual_progress', label:'Visual Progress', icon:'🗺️', table:'visual_progress_plans',
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        let plans = [], marks = [];
        try{
          plans = await fetchAllRows(SUPABASE_URL + '/rest/v1/visual_progress_plans?select=*&order=sort_order.asc,created_at.asc');
        }catch(e){
          container.innerHTML = '<div class="dash-empty">ยังไม่พร้อมใช้งาน — กรุณารัน SQL สร้างตาราง visual_progress_plans และ visual_progress_marks ก่อน (ดูเอกสารประกอบ)</div>';
          return;
        }
        try{
          marks = await fetchAllRows(SUPABASE_URL + '/rest/v1/visual_progress_marks?select=*');
        }catch(e){ marks = []; }
        let subActsForLink = [];
        try{
          subActsForLink = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_sub_activities?select=id,task_code,name,estimate_boq&order=sort_order.asc');
        }catch(e){ subActsForLink = []; }
        let mainActsForLink = [];
        try{
          mainActsForLink = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_activities?select=task_code,task_name,progress_pct&order=sort_order.asc');
        }catch(e){ mainActsForLink = []; }
        const linkOptions = vpLinkOptionsFrom(subActsForLink, mainActsForLink);

        const marksByPlan = new Map();
        marks.forEach(m=>{
          if(!marksByPlan.has(m.plan_id)) marksByPlan.set(m.plan_id, []);
          marksByPlan.get(m.plan_id).push(m);
        });
        marksByPlan.forEach(arr => arr.sort((a,b)=> a.mark_date < b.mark_date ? 1 : -1));

        let vpActivePlanId = plans.length ? plans[0].id : null;
        let vpSelectedDate = todayISO();
        let vpShapes = [];
        let vpActiveColorIdx = -1;
        let vpEraseMode = false;
        let vpUndoStack = [];
        let vpShapeType = 'square';
        let vpSizeMult = 1;
        let vpFsListenerAttached = false;
        let vpActiveGroupId = null;
        let vpHiddenGroups = new Set();
        function vpSquareSizeFrac(){ return VP_DEFAULT_SQUARE_SIZE * vpSizeMult; }
        function vpLineSizeFrac(){ return VP_DEFAULT_LINE_WIDTH * vpSizeMult; }

        function legendOf(plan){ return Array.isArray(plan.legend) ? plan.legend : []; }
        function loadShapesFor(planId, dateIso){
          const arr = marksByPlan.get(planId) || [];
          const row = arr.find(m => m.mark_date === dateIso);
          return row ? JSON.parse(JSON.stringify(row.shapes || [])) : [];
        }
        function latestDateBefore(planId, dateIso){
          const arr = marksByPlan.get(planId) || [];
          const found = arr.find(m => m.mark_date < dateIso);
          return found ? found.mark_date : null;
        }
        if(vpActivePlanId != null) vpShapes = loadShapesFor(vpActivePlanId, vpSelectedDate);
        function shapeGroupId(s){ return s.group || '_default'; }

        function renderShell(){
          const tabsHtml = plans.map(p=>`<button type="button" class="chip vp-tab ${p.id===vpActivePlanId?'active':''}" data-plan-id="${p.id}">${escapeHtml(p.building_name)}</button>`).join('');
          container.innerHTML = `
            <div class="vp-plan-tabs">
              ${tabsHtml}
              <button type="button" class="chip" id="vpAddPlanBtn">＋ เพิ่มแปลนใหม่</button>
            </div>
            ${plans.length ? '<div id="vpPlanEditor"></div>' : '<div class="dash-empty">ยังไม่มีแปลน — กด "เพิ่มแปลนใหม่" ด้านบนเพื่อเริ่มต้น</div>'}
          `;
          container.querySelectorAll('.vp-tab').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              vpActivePlanId = Number(btn.dataset.planId);
              vpSelectedDate = todayISO();
              vpShapes = loadShapesFor(vpActivePlanId, vpSelectedDate);
              vpActiveColorIdx = -1; vpActiveGroupId = null; vpEraseMode = false; vpUndoStack = []; vpShapeType = 'square'; vpSizeMult = 1; vpHiddenGroups = new Set();
              renderShell();
            });
          });
          document.getElementById('vpAddPlanBtn').addEventListener('click', openAddPlanModal);
          if(vpActivePlanId != null) renderPlanArea();
        }

        function renderPlanArea(){
          const plan = plans.find(p=>p.id===vpActivePlanId);
          const editor = document.getElementById('vpPlanEditor');
          if(!plan || !editor) return;
          const groups = legendGroupsOf(plan);
          if(!vpHiddenGroups) vpHiddenGroups = new Set();
          const datesForPlan = (marksByPlan.get(plan.id) || []).map(m=>m.mark_date);
          function shapeGroupId(s){ return s.group || '_default'; }
          function visibleVpShapes(){ return vpShapes.filter(s=> !vpHiddenGroups.has(shapeGroupId(s))); }
          function activeLegendItem(){
            if(vpActiveGroupId == null || vpActiveColorIdx < 0) return null;
            const g = groups.find(x=>x.id === vpActiveGroupId);
            return g ? (g.items[vpActiveColorIdx] || null) : null;
          }
          let badgeHtml = '';
          groups.forEach(g=>{
            if(!g.total_units) return;
            (g.items||[]).filter(l=>l.is_completion).forEach(item=>{
              const cnt = vpShapes.filter(s=> shapeGroupId(s)===g.id && vpCumulativeColors(g,item).includes(s.color)).length;
              const pct = Math.round((cnt/g.total_units)*1000)/10;
              badgeHtml += `<div class="vp-badge" data-completion-group="${escapeHtml(g.id)}" data-completion-color="${escapeHtml(item.color)}">${escapeHtml(g.name || '')} — ${escapeHtml(item.label)}: ทั้งหมด ${g.total_units} จุด แล้วเสร็จ ${cnt} จุด คิดเป็น ${pct}%</div>`;
            });
          });
          editor.innerHTML = `
            ${badgeHtml}
            <div class="vp-date-row">
              <label>วันที่:</label>
              <input type="date" id="vpDateInput" value="${vpSelectedDate}" style="width:auto;">
              <button type="button" class="btn btn-ghost" id="vpLoadPrevBtn" style="flex:0 0 auto;">โหลดจากวันก่อนหน้า</button>
              ${datesForPlan.length ? `<select id="vpDateJump" style="max-width:220px;"><option value="">-- วันที่มีบันทึกไว้ --</option>${datesForPlan.map(d=>`<option value="${d}">${d}</option>`).join('')}</select>` : ''}
              <button type="button" class="btn btn-ghost" id="vpEditPlanBtn" style="flex:0 0 auto;margin-left:auto;">✏️ แก้ไขแปลน</button>
              <button type="button" class="btn btn-ghost" id="vpDeletePlanBtn" style="flex:0 0 auto;color:var(--danger);">🗑️ ลบแปลนนี้</button>
            </div>
            <div class="vp-fullscreen-wrap" id="vpFullscreenWrap">
              ${groups.map(g=>`
              <div class="vp-legend-group">
                <label class="vp-legend-group-head">
                  <input type="checkbox" class="vp-group-vis-toggle" data-group="${escapeHtml(g.id)}" ${vpHiddenGroups.has(g.id)?'':'checked'}>
                  ${escapeHtml(g.name || 'Group')}${g.total_units!=null && g.total_units!=='' ? ` (${g.total_units} จุด)` : ''}
                </label>
                <div class="vp-toolbar">
                  ${(g.items||[]).map((l,i)=>`<button type="button" class="vp-legend-btn ${(g.id===vpActiveGroupId && i===vpActiveColorIdx)?'active':''}" data-group="${escapeHtml(g.id)}" data-idx="${i}"><span class="vp-legend-swatch" style="background:${l.color}"></span>${escapeHtml(l.label)}${l.link_level?' 🔗':''}</button>`).join('')}
                </div>
              </div>`).join('')}
              <div class="vp-toolbar">
                <button type="button" class="btn btn-ghost" id="vpEraseBtn" style="flex:0 0 auto;${vpEraseMode?'background:var(--danger);color:#fff;':''}">🧽 โหมดลบ</button>
                <button type="button" class="btn btn-ghost" id="vpShapeSquareBtn" style="flex:0 0 auto;${vpShapeType==='square'?'background:var(--ink);color:#fff;':''}">🔲 จุด</button>
                <button type="button" class="btn btn-ghost" id="vpShapeLineBtn" style="flex:0 0 auto;${vpShapeType==='line'?'background:var(--ink);color:#fff;':''}">📏 เส้น</button>
                <button type="button" class="btn btn-ghost" id="vpShapeAreaBtn" style="flex:0 0 auto;${vpShapeType==='area'?'background:var(--ink);color:#fff;':''}">▭ พื้นที่</button>
                <div style="display:flex;align-items:center;gap:4px;flex:0 0 auto;">
                  <button type="button" class="btn btn-ghost" id="vpSizeMinusBtn" style="flex:0 0 auto;padding:6px 10px;">➖</button>
                  <span id="vpSizeLabel" style="font-size:12.5px;font-weight:700;color:var(--charcoal);min-width:44px;text-align:center;display:inline-block;">${Math.round(vpSizeMult*100)}%</span>
                  <button type="button" class="btn btn-ghost" id="vpSizePlusBtn" style="flex:0 0 auto;padding:6px 10px;">➕</button>
                </div>
                <button type="button" class="btn btn-ghost" id="vpUndoBtn" style="flex:0 0 auto;">↩️ Undo</button>
                <button type="button" class="btn btn-ghost" id="vpClearBtn" style="flex:0 0 auto;">ล้างทั้งหมด</button>
                <button type="button" class="btn btn-ghost" id="vpFullscreenBtn" style="flex:0 0 auto;margin-left:auto;">⛶ เต็มจอ</button>
              </div>
              <div class="vp-canvas-wrap" id="vpCanvasWrap"><div class="dash-note">กำลังโหลดแปลน...</div></div>
            </div>
            <div class="dash-note">เลือก Group แล้วเลือกสถานะจาก Legend ของ Group นั้น แล้วเลือกรูปแบบมาร์ค (จุด/เส้น/พื้นที่) แล้วคลิก (หรือคลิกลาก สำหรับเส้นและพื้นที่) บนแปลนเพื่อวางมาร์ค — คลิกทับมาร์คที่วางไว้แล้วโดยเลือกสถานะใหม่ไว้ก่อน จะเปลี่ยนสีมาร์คนั้นเป็นสถานะใหม่ทันที (ไม่สร้างมาร์คซ้อนเพิ่ม) — ปรับขนาดมาร์คด้วยปุ่ม ➖/➕ (ใช้ได้ทั้งจุด เส้น และความหนาเส้นขอบของพื้นที่) — เปิด "โหมดลบ" แล้วคลิกที่มาร์คเพื่อลบ — ติ๊ก/ปลดติ๊กชื่อ Group ด้านบนเพื่อซ่อน/แสดงมาร์คของ Group นั้นบนแปลน (ซ่อนได้พร้อมกันหลาย Group หรือแสดงทั้งหมดพร้อมกันก็ได้ ไม่กระทบข้อมูลที่บันทึกไว้) — อย่าลืมกด "บันทึกของวันนี้" ทุกครั้งหลังแก้ไข</div>
            <div class="btn-row">
              <button class="btn btn-primary" id="vpSaveBtn">💾 บันทึกของวันที่ ${vpSelectedDate}</button>
              <button class="btn btn-ghost" id="vpDownloadBtn">⬇️ ดาวน์โหลด (${plan.file_type === 'pdf' ? 'PDF' : 'รูปภาพ'})</button>
            </div>
          `;
          document.getElementById('vpDateInput').addEventListener('change', (e)=>{
            vpSelectedDate = e.target.value || todayISO();
            vpShapes = loadShapesFor(plan.id, vpSelectedDate);
            vpUndoStack = [];
            renderPlanArea();
          });
          document.getElementById('vpLoadPrevBtn').addEventListener('click', ()=>{
            const prevDate = latestDateBefore(plan.id, vpSelectedDate);
            if(!prevDate){ showToast('ไม่พบข้อมูลวันก่อนหน้า', true); return; }
            vpUndoStack.push(JSON.parse(JSON.stringify(vpShapes)));
            vpShapes = loadShapesFor(plan.id, prevDate);
            renderPlanArea();
            showToast('โหลดข้อมูลจากวันที่ ' + prevDate + ' มาต่อแล้ว (ยังไม่บันทึก)');
          });
          const jumpSel = document.getElementById('vpDateJump');
          if(jumpSel) jumpSel.addEventListener('change', (e)=>{
            if(!e.target.value) return;
            vpSelectedDate = e.target.value;
            vpShapes = loadShapesFor(plan.id, vpSelectedDate);
            vpUndoStack = [];
            renderPlanArea();
          });
          document.getElementById('vpEditPlanBtn').addEventListener('click', ()=> openEditPlanModal(plan));
          document.getElementById('vpDeletePlanBtn').addEventListener('click', ()=> deletePlan(plan));
          // Toggling status/erase-mode/shape-type/size only changes which
          // buttons are highlighted and how new marks will be drawn — it never
          // needs to reload the plan image or rebuild the canvas, so we just
          // patch the toolbar's own classes/labels in place instead of calling
          // the full renderPlanArea() (which used to reset #vpCanvasWrap to a
          // placeholder for a frame and made the page jump/bounce on every click).
          function syncVpToolbarUI(){
            container.querySelectorAll('.vp-legend-btn').forEach(b=>{
              b.classList.toggle('active', b.dataset.group === vpActiveGroupId && Number(b.dataset.idx) === vpActiveColorIdx);
            });
            const eraseBtn = document.getElementById('vpEraseBtn');
            if(eraseBtn){ eraseBtn.style.background = vpEraseMode ? 'var(--danger)' : ''; eraseBtn.style.color = vpEraseMode ? '#fff' : ''; }
            const sqBtn = document.getElementById('vpShapeSquareBtn');
            const lnBtn = document.getElementById('vpShapeLineBtn');
            const arBtn = document.getElementById('vpShapeAreaBtn');
            if(sqBtn){ sqBtn.style.background = vpShapeType==='square' ? 'var(--ink)' : ''; sqBtn.style.color = vpShapeType==='square' ? '#fff' : ''; }
            if(lnBtn){ lnBtn.style.background = vpShapeType==='line' ? 'var(--ink)' : ''; lnBtn.style.color = vpShapeType==='line' ? '#fff' : ''; }
            if(arBtn){ arBtn.style.background = vpShapeType==='area' ? 'var(--ink)' : ''; arBtn.style.color = vpShapeType==='area' ? '#fff' : ''; }
            const sizeLabel = document.getElementById('vpSizeLabel');
            if(sizeLabel) sizeLabel.textContent = Math.round(vpSizeMult*100) + '%';
          }
          container.querySelectorAll('.vp-legend-btn').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              const gId = btn.dataset.group;
              const idx = Number(btn.dataset.idx);
              if(vpActiveGroupId === gId && vpActiveColorIdx === idx){ vpActiveGroupId = null; vpActiveColorIdx = -1; }
              else { vpActiveGroupId = gId; vpActiveColorIdx = idx; }
              vpEraseMode = false;
              syncVpToolbarUI();
            });
          });
          container.querySelectorAll('.vp-group-vis-toggle').forEach(cb=>{
            cb.addEventListener('change', ()=>{
              const gId = cb.dataset.group;
              if(cb.checked) vpHiddenGroups.delete(gId); else vpHiddenGroups.add(gId);
              redrawCanvas();
            });
          });
          document.getElementById('vpEraseBtn').addEventListener('click', ()=>{
            vpEraseMode = !vpEraseMode;
            if(vpEraseMode) { vpActiveGroupId = null; vpActiveColorIdx = -1; }
            syncVpToolbarUI();
          });
          document.getElementById('vpShapeSquareBtn').addEventListener('click', ()=>{ vpShapeType = 'square'; syncVpToolbarUI(); });
          document.getElementById('vpShapeLineBtn').addEventListener('click', ()=>{ vpShapeType = 'line'; syncVpToolbarUI(); });
          document.getElementById('vpShapeAreaBtn').addEventListener('click', ()=>{ vpShapeType = 'area'; syncVpToolbarUI(); });
          document.getElementById('vpSizeMinusBtn').addEventListener('click', ()=>{ vpSizeMult = Math.max(0.4, Math.round((vpSizeMult - 0.2)*10)/10); syncVpToolbarUI(); });
          document.getElementById('vpSizePlusBtn').addEventListener('click', ()=>{ vpSizeMult = Math.min(3, Math.round((vpSizeMult + 0.2)*10)/10); syncVpToolbarUI(); });
          const vpFsBtn = document.getElementById('vpFullscreenBtn');
          if(vpFsBtn){
            vpFsBtn.addEventListener('click', ()=>{
              const wrap = document.getElementById('vpFullscreenWrap');
              const reqFs = wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.msRequestFullscreen;
              const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
              if(!document.fullscreenElement){ reqFs.call(wrap); } else { exitFs.call(document); }
            });
            if(!vpFsListenerAttached){
              vpFsListenerAttached = true;
              document.addEventListener('fullscreenchange', ()=>{
                const btn = document.getElementById('vpFullscreenBtn');
                if(btn) btn.textContent = document.fullscreenElement ? '⤡ ออกจากเต็มจอ' : '⛶ เต็มจอ';
              });
            }
          }
          document.getElementById('vpUndoBtn').addEventListener('click', ()=>{
            if(!vpUndoStack.length){ showToast('ไม่มีการแก้ไขให้ Undo', true); return; }
            vpShapes = vpUndoStack.pop();
            redrawCanvas();
          });
          document.getElementById('vpClearBtn').addEventListener('click', ()=>{
            if(!vpShapes.length) return;
            if(!confirm('ล้างจุดทั้งหมดของวันที่ ' + vpSelectedDate + ' ?')) return;
            vpUndoStack.push(JSON.parse(JSON.stringify(vpShapes)));
            vpShapes = [];
            redrawCanvas();
          });
          document.getElementById('vpSaveBtn').addEventListener('click', ()=> saveShapes(plan));
          document.getElementById('vpDownloadBtn').addEventListener('click', ()=> downloadCurrent(plan));

          const wrap = document.getElementById('vpCanvasWrap');
          let base = null, canvasEl = null;
          function hitTestVisible(relX, relY){
            const vis = visibleVpShapes();
            const idx = vpHitTest(vis, base, relX, relY);
            if(idx < 0) return -1;
            return vpShapes.indexOf(vis[idx]);
          }
          async function downloadCurrent(plan){
            if(!canvasEl){ showToast('กรุณารอให้แปลนโหลดเสร็จก่อน', true); return; }
            const safeName = (plan.building_name || 'plan').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
            const fname = safeName + '_' + vpSelectedDate;
            try{
              if(plan.file_type === 'pdf'){
                if(!window.jspdf){ showToast('โหลดไลบรารีสร้าง PDF ไม่สำเร็จ', true); return; }
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: canvasEl.width >= canvasEl.height ? 'l' : 'p', unit:'px', format:[canvasEl.width, canvasEl.height] });
                pdf.addImage(canvasEl.toDataURL('image/png'), 'PNG', 0, 0, canvasEl.width, canvasEl.height);
                pdf.save(fname + '.pdf');
              } else {
                const url = canvasEl.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url; a.download = fname + '.png';
                document.body.appendChild(a); a.click(); a.remove();
              }
            }catch(e){ console.error(e); showToast('ดาวน์โหลดไม่สำเร็จ: ' + e.message, true); }
          }
          function redrawCanvas(draft){
            if(!base || !canvasEl) return;
            vpDrawCanvas(canvasEl, base, visibleVpShapes(), draft);
            groups.forEach(g=>{
              if(!g.total_units) return;
              (g.items||[]).filter(l=>l.is_completion).forEach(item=>{
                const cnt = vpShapes.filter(s=> shapeGroupId(s)===g.id && vpCumulativeColors(g,item).includes(s.color)).length;
                const pct = Math.round((cnt/g.total_units)*1000)/10;
                const badgeEl = editor.querySelector('.vp-badge[data-completion-group="' + g.id + '"][data-completion-color="' + item.color + '"]');
                if(badgeEl) badgeEl.textContent = `${g.name || ''} — ${item.label}: ทั้งหมด ${g.total_units} จุด แล้วเสร็จ ${cnt} จุด คิดเป็น ${pct}%`;
              });
            });
          }
          vpLoadPlanImage(plan).then(b=>{
            base = b;
            canvasEl = document.createElement('canvas');
            wrap.innerHTML = '';
            wrap.appendChild(canvasEl);
            redrawCanvas();
            let dragging = false;
            let dragStart = null;
            canvasEl.addEventListener('pointerdown', (e)=>{
              const rect = canvasEl.getBoundingClientRect();
              const relX = (e.clientX - rect.left) / rect.width;
              const relY = (e.clientY - rect.top) / rect.height;
              if(vpEraseMode){
                const idx = hitTestVisible(relX, relY);
                if(idx >= 0){
                  vpUndoStack.push(JSON.parse(JSON.stringify(vpShapes)));
                  vpShapes.splice(idx, 1);
                  redrawCanvas();
                }
                return;
              }
              const item = activeLegendItem();
              if(!item){ showToast('เลือกสถานะจาก Legend ก่อน', true); return; }
              // Clicking directly on an existing mark updates its status/color in
              // place (e.g. moving a footing from "งานขุด" to "งานเทลีน") instead of
              // stacking a brand-new overlapping mark on top of the old one.
              const existingIdx = hitTestVisible(relX, relY);
              if(existingIdx >= 0){
                const existing = vpShapes[existingIdx];
                if(existing.color !== item.color || existing.label !== item.label || shapeGroupId(existing) !== vpActiveGroupId){
                  vpUndoStack.push(JSON.parse(JSON.stringify(vpShapes)));
                  existing.color = item.color;
                  existing.label = item.label;
                  existing.group = vpActiveGroupId;
                  redrawCanvas();
                }
                return;
              }
              dragging = true;
              if(vpShapeType === 'line' || vpShapeType === 'area'){
                dragStart = { x: relX, y: relY };
                if(vpShapeType === 'line'){
                  redrawCanvas({ type:'line', x1: relX, y1: relY, x2: relX, y2: relY, color: item.color, size: vpLineSizeFrac() });
                } else {
                  redrawCanvas({ type:'area', x: relX, y: relY, w: 0, h: 0, color: item.color, size: vpLineSizeFrac() });
                }
              } else {
                redrawCanvas({ type:'square', x: relX, y: relY, color: item.color, size: vpSquareSizeFrac() });
              }
            });
            canvasEl.addEventListener('pointermove', (e)=>{
              if(!dragging) return;
              const rect = canvasEl.getBoundingClientRect();
              const relX = (e.clientX - rect.left) / rect.width;
              const relY = (e.clientY - rect.top) / rect.height;
              const item = activeLegendItem();
              if(!item) return;
              if(vpShapeType === 'line'){
                redrawCanvas({ type:'line', x1: dragStart.x, y1: dragStart.y, x2: relX, y2: relY, color: item.color, size: vpLineSizeFrac() });
              } else if(vpShapeType === 'area'){
                const r = vpNormalizeRect(dragStart.x, dragStart.y, relX, relY);
                redrawCanvas({ type:'area', x: r.x, y: r.y, w: r.w, h: r.h, color: item.color, size: vpLineSizeFrac() });
              } else {
                redrawCanvas({ type:'square', x: relX, y: relY, color: item.color, size: vpSquareSizeFrac() });
              }
            });
            const commitPoint = (e)=>{
              if(!dragging) return;
              dragging = false;
              const rect = canvasEl.getBoundingClientRect();
              const relX = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
              const relY = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
              const item = activeLegendItem();
              if(!item){ dragStart = null; return; }
              vpUndoStack.push(JSON.parse(JSON.stringify(vpShapes)));
              if(vpShapeType === 'line'){
                let x2 = relX, y2 = relY;
                if(Math.hypot(x2-dragStart.x, y2-dragStart.y) < 0.01){ x2 = Math.min(1, dragStart.x + 0.05); y2 = dragStart.y; }
                vpShapes.push({ type:'line', x1: dragStart.x, y1: dragStart.y, x2, y2, color: item.color, label: item.label, size: vpLineSizeFrac(), group: vpActiveGroupId });
              } else if(vpShapeType === 'area'){
                let r = vpNormalizeRect(dragStart.x, dragStart.y, relX, relY);
                if(r.w < 0.01 || r.h < 0.01){ r = { x: dragStart.x, y: dragStart.y, w: Math.max(r.w, 0.05), h: Math.max(r.h, 0.05) }; }
                vpShapes.push({ type:'area', x: r.x, y: r.y, w: r.w, h: r.h, color: item.color, label: item.label, size: vpLineSizeFrac(), group: vpActiveGroupId });
              } else {
                vpShapes.push({ type:'square', x: relX, y: relY, color: item.color, label: item.label, size: vpSquareSizeFrac(), group: vpActiveGroupId });
              }
              dragStart = null;
              redrawCanvas();
            };
            canvasEl.addEventListener('pointerup', commitPoint);
            canvasEl.addEventListener('pointerleave', ()=>{ if(dragging){ dragging = false; dragStart = null; redrawCanvas(); } });
          }).catch(e=>{ wrap.innerHTML = '<div class="dash-empty">โหลดแปลนไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; });
        }
        async function saveShapes(plan){
          const btn = document.getElementById('vpSaveBtn');
          btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
          try{
            const payload = { plan_id: plan.id, mark_date: vpSelectedDate, shapes: vpShapes, updated_at: new Date().toISOString() };
            const res = await fetch(SUPABASE_URL + '/rest/v1/visual_progress_marks?on_conflict=plan_id,mark_date', {
              method:'POST', headers:{ ...HEADERS, 'Prefer':'resolution=merge-duplicates,return=minimal' },
              body: JSON.stringify(payload)
            });
            if(!res.ok) throw new Error('save failed: ' + res.status + ' ' + await res.text());
            let arr = marksByPlan.get(plan.id);
            if(!arr){ arr = []; marksByPlan.set(plan.id, arr); }
            const existingIdx = arr.findIndex(m=>m.mark_date===vpSelectedDate);
            const savedRow = { plan_id: plan.id, mark_date: vpSelectedDate, shapes: JSON.parse(JSON.stringify(vpShapes)) };
            if(existingIdx >= 0) arr[existingIdx] = savedRow; else arr.push(savedRow);
            arr.sort((a,b)=> a.mark_date < b.mark_date ? 1 : -1);
            showToast('บันทึกข้อมูลวันที่ ' + vpSelectedDate + ' สำเร็จ');
            renderPlanArea();
            const groupsForSync = legendGroupsOf(plan);
            const countFn = (gid, colors) => vpShapes.filter(s => shapeGroupId(s) === gid && colors.includes(s.color)).length;
            vpSyncGroupsToBOQ(groupsForSync, countFn, subActsForLink, mainActsForLink).then(r=>{
              if(r.synced) showToast('ซิงก์ %POC/Actual BOQ ไปยัง Sub Activity ที่ลิงก์ไว้แล้ว ' + r.synced + ' รายการ' + (r.failed ? (' (ล้มเหลว ' + r.failed + ' รายการ)') : ''));
              else if(r.failed) showToast('ซิงก์ไปยัง Sub Activity ล้มเหลว ' + r.failed + ' รายการ', true);
              if(r.unmatched && r.unmatched.length) showToast('⚠️ พบลิงก์ที่ข้อมูลอ้างอิงไม่ตรงกับปัจจุบัน (อาจถูกลบ/แก้ไข BOQ): ' + r.unmatched.join(', '), true);
              if(r.noTotal && r.noTotal.length) showToast('ℹ️ Group ที่ยังไม่ได้ตั้ง "จำนวนทั้งหมด" จึงยังไม่ซิงก์: ' + r.noTotal.join(', '), true);
            });
          }catch(e){ console.error(e); showToast('บันทึกไม่สำเร็จ: ' + e.message, true); }
          finally{ btn.disabled = false; btn.textContent = '💾 บันทึกของวันที่ ' + vpSelectedDate; }
        }

        async function deletePlan(plan){
          if(!confirm('ลบแปลน "' + plan.building_name + '" พร้อมข้อมูลที่มาร์คไว้ทั้งหมด? การลบนี้ย้อนกลับไม่ได้')) return;
          try{
            await fetch(SUPABASE_URL + '/rest/v1/visual_progress_marks?plan_id=eq.' + plan.id, { method:'DELETE', headers: HEADERS });
            await fetch(SUPABASE_URL + '/rest/v1/visual_progress_plans?id=eq.' + plan.id, { method:'DELETE', headers: HEADERS });
            await deleteStorageObjectByUrl(plan.file_url);
            showToast('ลบแปลนแล้ว');
            switchModule('dash_visual_progress');
          }catch(e){ console.error(e); showToast('ลบไม่สำเร็จ: ' + e.message, true); }
        }

        function openAddPlanModal(){
          const modal = document.getElementById('modalContent');
          const state = {
            nextGid: 1,
            linkOptions: linkOptions,
            groups: [{
              _gid: 0, id: null, name: 'ฐานราก', total_units: null,
              rows: [
                { label:'งานขุด FOOTING', color:'#F5A623', is_completion:false, link_level:null, link_ref:null, _id:0 },
                { label:'งานเทลีน FOOTING', color:'#E04B2B', is_completion:false, link_level:null, link_ref:null, _id:1 },
                { label:'งานเข้าแบบผูกเหล็ก FOOTING', color:'#6C4CE0', is_completion:false, link_level:null, link_ref:null, _id:2 },
                { label:'งานเทคอนกรีต FOOTING', color:'#3FB950', is_completion:true, link_level:null, link_ref:null, _id:3 },
              ],
              nextRowId: 4,
            }],
          };
          modal.innerHTML = `
            <div class="modal-head"><h2>เพิ่มแปลนใหม่ (Visual Progress)</h2><button class="modal-close" id="vpModalClose">&times;</button></div>
            <div class="detail-grid">
              <div class="detail-field full"><label>ชื่ออาคาร / แปลน</label><input type="text" id="vpNewBuildingName" placeholder="เช่น WHA, WHB, MPB, TLB"></div>
              <div class="detail-field full"><label>ไฟล์แปลน (PDF หรือรูปภาพ)</label><input type="file" id="vpNewFile" accept="application/pdf,image/*"></div>
              <div class="detail-field full">
                <label>Group ของสถานะงาน (แยกนับ % สำเร็จอิสระต่อกัน — เช่น ฐานราก, เสา)</label>
                <div id="vpGroupsWrap"></div>
              </div>
            </div>
            <div class="btn-row" style="margin-top:14px;">
              <button class="btn btn-primary" id="vpSavePlanBtn">บันทึกแปลนใหม่</button>
              <button class="btn btn-ghost" id="vpCancelPlanBtn">ยกเลิก</button>
            </div>
          `;
          const editorApi = wireVpGroupsEditor(modal, state);
          document.getElementById('vpModalClose').addEventListener('click', closeModal);
          document.getElementById('vpCancelPlanBtn').addEventListener('click', closeModal);
          document.getElementById('vpSavePlanBtn').addEventListener('click', async ()=>{
            editorApi.syncGroupsFromDom();
            const name = document.getElementById('vpNewBuildingName').value.trim();
            const fileInput = document.getElementById('vpNewFile');
            const file = fileInput.files && fileInput.files[0];
            const legendGroups = buildLegendGroupsPayload(editorApi.getGroups());
            if(!name){ showToast('กรุณาระบุชื่ออาคาร/แปลน', true); return; }
            if(!file){ showToast('กรุณาเลือกไฟล์แปลน', true); return; }
            if(!legendGroups.length){ showToast('กรุณาระบุ Legend อย่างน้อย 1 รายการ', true); return; }
            const saveBtn = document.getElementById('vpSavePlanBtn');
            saveBtn.disabled = true; saveBtn.textContent = 'กำลังอัปโหลด...';
            try{
              const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
              const fileUrl = await uploadVpBlob('visual-progress-plans', file, file.name, file.type);
              const totalSum = legendGroups.reduce((sum,g)=> sum + (g.total_units||0), 0);
              const payload = {
                building_name: name, file_url: fileUrl, file_type: isPdf ? 'pdf' : 'image',
                legend: { groups: legendGroups }, total_units: totalSum || null,
                sort_order: plans.length,
              };
              const res = await fetch(SUPABASE_URL + '/rest/v1/visual_progress_plans', { method:'POST', headers: { ...HEADERS, 'Prefer':'return=minimal' }, body: JSON.stringify(payload) });
              if(!res.ok) throw new Error('save failed: ' + res.status + ' ' + await res.text());
              closeModal();
              showToast('เพิ่มแปลนใหม่สำเร็จ');
              switchModule('dash_visual_progress');
            }catch(e){ console.error(e); showToast('บันทึกไม่สำเร็จ: ' + e.message, true); }
            finally{ saveBtn.disabled = false; saveBtn.textContent = 'บันทึกแปลนใหม่'; }
          });
          document.getElementById('modalBg').classList.add('show');
        }

        function openEditPlanModal(plan){
          const modal = document.getElementById('modalContent');
          const existingGroups = legendGroupsOf(plan);
          const state = {
            nextGid: existingGroups.length,
            linkOptions: linkOptions,
            groups: existingGroups.map((g,gi)=>({
              _gid: gi, id: g.id, name: g.name || '', total_units: g.total_units,
              rows: (g.items && g.items.length ? g.items : [{label:'',color:'#999999',is_completion:false,link_level:null,link_ref:null}]).map((it,i)=>({ label: it.label, color: it.color, is_completion: !!it.is_completion, link_level: it.link_level || null, link_ref: it.link_ref || null, _id: i })),
              nextRowId: (g.items ? g.items.length : 1),
            })),
          };
          modal.innerHTML = `
            <div class="modal-head"><h2>แก้ไขแปลน — ${escapeHtml(plan.building_name)}</h2><button class="modal-close" id="vpModalClose">&times;</button></div>
            <div class="detail-grid">
              <div class="detail-field full"><label>ชื่ออาคาร / แปลน</label><input type="text" id="vpNewBuildingName" value="${escapeHtml(plan.building_name)}"></div>
              <div class="detail-field full"><label>เปลี่ยนไฟล์แปลน (ไม่บังคับ — ถ้าไม่เลือกจะใช้ไฟล์เดิม)</label><input type="file" id="vpNewFile" accept="application/pdf,image/*"></div>
              <div class="detail-field full">
                <label>Group ของสถานะงาน (แยกนับ % สำเร็จอิสระต่อกัน — เช่น ฐานราก, เสา)</label>
                <div id="vpGroupsWrap"></div>
              </div>
            </div>
            <div class="btn-row" style="margin-top:14px;">
              <button class="btn btn-primary" id="vpSavePlanBtn">บันทึกการแก้ไข</button>
              <button class="btn btn-ghost" id="vpCancelPlanBtn">ยกเลิก</button>
            </div>
          `;
          const editorApi = wireVpGroupsEditor(modal, state);
          document.getElementById('vpModalClose').addEventListener('click', closeModal);
          document.getElementById('vpCancelPlanBtn').addEventListener('click', closeModal);
          document.getElementById('vpSavePlanBtn').addEventListener('click', async ()=>{
            editorApi.syncGroupsFromDom();
            const name = document.getElementById('vpNewBuildingName').value.trim();
            const fileInput = document.getElementById('vpNewFile');
            const file = fileInput.files && fileInput.files[0];
            const legendGroups = buildLegendGroupsPayload(editorApi.getGroups());
            if(!name){ showToast('กรุณาระบุชื่ออาคาร/แปลน', true); return; }
            if(!legendGroups.length){ showToast('กรุณาระบุ Legend อย่างน้อย 1 รายการ', true); return; }
            const saveBtn = document.getElementById('vpSavePlanBtn');
            saveBtn.disabled = true; saveBtn.textContent = 'กำลังบันทึก...';
            try{
              const totalSum = legendGroups.reduce((sum,g)=> sum + (g.total_units||0), 0);
              const payload = {
                building_name: name,
                legend: { groups: legendGroups }, total_units: totalSum || null,
              };
              let oldFileUrl = null;
              if(file){
                const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
                payload.file_url = await uploadVpBlob('visual-progress-plans', file, file.name, file.type);
                payload.file_type = isPdf ? 'pdf' : 'image';
                oldFileUrl = plan.file_url;
              }
              const res = await fetch(SUPABASE_URL + '/rest/v1/visual_progress_plans?id=eq.' + plan.id, { method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' }, body: JSON.stringify(payload) });
              if(!res.ok) throw new Error('save failed: ' + res.status + ' ' + await res.text());
              if(oldFileUrl) await deleteStorageObjectByUrl(oldFileUrl);
              closeModal();
              showToast('บันทึกการแก้ไขแปลนสำเร็จ');
              switchModule('dash_visual_progress');
            }catch(e){ console.error(e); showToast('บันทึกไม่สำเร็จ: ' + e.message, true); }
            finally{ saveBtn.disabled = false; saveBtn.textContent = 'บันทึกการแก้ไข'; }
          });
          document.getElementById('modalBg').classList.add('show');
        }

        renderShell();
      }
    },
    {
      id:'dash_visual_progress_3d', label:'Visual Progress 3D', icon:'🧊', table:'visual_progress_3d_plans',
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        let plans = [], marks = [];
        try{
          plans = await fetchAllRows(SUPABASE_URL + '/rest/v1/visual_progress_3d_plans?select=*&order=sort_order.asc,created_at.asc');
        }catch(e){
          container.innerHTML = '<div class="dash-empty">ยังไม่พร้อมใช้งาน — กรุณารัน SQL สร้างตาราง visual_progress_3d_plans และ visual_progress_3d_marks ก่อน (ดูเอกสารประกอบ)</div>';
          return;
        }
        try{
          marks = await fetchAllRows(SUPABASE_URL + '/rest/v1/visual_progress_3d_marks?select=*');
        }catch(e){ marks = []; }
        let subActsForLink = [];
        try{
          subActsForLink = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_sub_activities?select=id,task_code,name,estimate_boq&order=sort_order.asc');
        }catch(e){ subActsForLink = []; }
        let mainActsForLink = [];
        try{
          mainActsForLink = await fetchAllRows(SUPABASE_URL + '/rest/v1/project_schedule_activities?select=task_code,task_name,progress_pct&order=sort_order.asc');
        }catch(e){ mainActsForLink = []; }
        const linkOptions = vpLinkOptionsFrom(subActsForLink, mainActsForLink);

        const marksByPlan = new Map();
        marks.forEach(m=>{
          if(!marksByPlan.has(m.plan_id)) marksByPlan.set(m.plan_id, []);
          marksByPlan.get(m.plan_id).push(m);
        });
        marksByPlan.forEach(arr => arr.sort((a,b)=> a.mark_date < b.mark_date ? 1 : -1));

        let vpActivePlanId = plans.length ? plans[0].id : null;
        let vpSelectedDate = todayISO();
        let vpAssignments = {};
        let vpActiveColorIdx = -1;
        let vpEraseMode = false;
        let vpUndoStack = [];
        let vp3dStyleMode = 'normal';
        let vp3dCameraMode = 'perspective';
        let threeState = null;
        let vp3dFsListenerAttached = false;
        let vpActiveGroupId = null;
        let vpHiddenGroups = new Set();

        function legendOf(plan){ return Array.isArray(plan.legend) ? plan.legend : []; }
        function loadAssignmentsFor(planId, dateIso){
          const arr = marksByPlan.get(planId) || [];
          const row = arr.find(m => m.mark_date === dateIso);
          return normalizeAssignments(row ? row.assignments : {});
        }
        // Assignments used to be stored as a flat { nodeName: "#colorHex" } map.
        // To support several independent legend groups per model, each entry is
        // now { color, group }. Old saved data (plain color strings) is upgraded
        // in memory to the "_default" group on load — no migration needed.
        function normalizeAssignments(raw){
          const out = {};
          Object.entries(raw || {}).forEach(([name, val])=>{
            if(val && typeof val === 'object') out[name] = { color: val.color, group: val.group || '_default' };
            else if(val) out[name] = { color: val, group: '_default' };
          });
          return out;
        }
        function latestDateBefore(planId, dateIso){
          const arr = marksByPlan.get(planId) || [];
          const found = arr.find(m => m.mark_date < dateIso);
          return found ? found.mark_date : null;
        }
        if(vpActivePlanId != null) vpAssignments = loadAssignmentsFor(vpActivePlanId, vpSelectedDate);

        function currentPlan(){ return plans.find(p=>p.id===vpActivePlanId); }
        function refreshBadge(){
          const plan = currentPlan(); if(!plan) return;
          const groups = legendGroupsOf(plan);
          groups.forEach(g=>{
            if(!g.total_units) return;
            (g.items||[]).filter(l=>l.is_completion).forEach(item=>{
              const badgeEl = document.querySelector('.vp-badge[data-completion-group="' + g.id + '"][data-completion-color="' + item.color + '"]');
              if(!badgeEl) return;
              const cnt = Object.values(vpAssignments).filter(e=> e && (e.group||'_default')===g.id && vpCumulativeColors(g,item).includes(e.color)).length;
              const pct = Math.round((cnt/g.total_units)*1000)/10;
              badgeEl.textContent = `${g.name || ''} — ${item.label}: ทั้งหมด ${g.total_units} จุด แล้วเสร็จ ${cnt} จุด คิดเป็น ${pct}%`;
            });
          });
        }
        function applyAssignmentsToScene(){
          if(!threeState) return;
          Object.keys(threeState.coloredNodes).forEach(name=>{ const node = threeState.nodesByName.get(name); if(node) vp3dClearNode(node); });
          threeState.coloredNodes = {};
          Object.entries(vpAssignments).forEach(([name,entry])=>{
            if(!entry) return;
            const gid = entry.group || '_default';
            if(vpHiddenGroups.has(gid)) return; // group hidden -> leave the part uncolored
            const node = threeState.nodesByName.get(name);
            if(node){ vp3dColorNode(node, entry.color); threeState.coloredNodes[name] = entry.color; }
          });
        }
        function refreshListDots(){
          if(!threeState || !threeState.listBody) return;
          threeState.listBody.querySelectorAll('.vp3d-list-row').forEach(row=>{
            const entry = vpAssignments[row.dataset.name];
            const dot = row.querySelector('.vp3d-list-dot');
            if(dot) dot.style.background = (entry && entry.color) || '#ddd';
          });
        }
        function handleNodeClick(name){
          if(vpEraseMode){
            if(vpAssignments[name] != null){
              vpUndoStack.push(JSON.parse(JSON.stringify(vpAssignments)));
              delete vpAssignments[name];
              applyAssignmentsToScene(); refreshListDots(); refreshBadge();
            }
            return;
          }
          const plan = currentPlan(); if(!plan) return;
          const groups = legendGroupsOf(plan);
          if(vpActiveGroupId == null || vpActiveColorIdx < 0){ showToast('เลือกสถานะจาก Legend ก่อน', true); return; }
          const g = groups.find(x=>x.id === vpActiveGroupId);
          const item = g ? (g.items[vpActiveColorIdx] || null) : null;
          if(!item) return;
          vpUndoStack.push(JSON.parse(JSON.stringify(vpAssignments)));
          vpAssignments[name] = { color: item.color, group: vpActiveGroupId };
          applyAssignmentsToScene(); refreshListDots(); refreshBadge();
        }
        async function ensureSceneForPlan(plan, wrap){
          if(threeState && threeState.planId === plan.id){
            wrap.innerHTML = '';
            wrap.appendChild(threeState.renderer.domElement);
            threeState.onResize();
            return threeState;
          }
          if(threeState) teardownScene();
          wrap.innerHTML = '<div class="vp3d-loading">กำลังโหลดโมเดล 3D...</div>';
          const { THREE, GLTFLoader, OrbitControls } = await vpEnsureThree();
          const renderer = new THREE.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true });
          renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
          const w = wrap.clientWidth || 480, h = wrap.clientHeight || 560;
          renderer.setSize(w, h);
          wrap.innerHTML = '';
          wrap.appendChild(renderer.domElement);
          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0xEAEDF0);
          let camera = new THREE.PerspectiveCamera(50, w/h, 0.01, 5000);
          let controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          let cameraMode = 'perspective';
          scene.add(new THREE.AmbientLight(0xffffff, 0.9));
          const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
          dirLight.position.set(5,10,7);
          scene.add(dirLight);
          const loader = new GLTFLoader();
          const gltf = await loader.loadAsync(plan.model_url);
          const root = gltf.scene;
          scene.add(root);
          function currentAspect(){ return (wrap.clientWidth||w) / (wrap.clientHeight||h); }
          function fitAll(){ vp3dFrameCamera(THREE, camera, controls, root, currentAspect()); }
          fitAll();
          const nodesByName = vp3dCollectNodes(root);
          const stateObj = { THREE, renderer, scene, camera, controls, root, nodesByName, coloredNodes:{}, planId: plan.id, animId:null, listBody:null, fitAll, cameraMode };
          function onResize(){
            const nw = wrap.clientWidth || w, nh = wrap.clientHeight || h;
            renderer.setSize(nw, nh);
            const aspect = nw/nh;
            if(camera.isPerspectiveCamera){
              camera.aspect = aspect;
            } else {
              const viewHeight = camera.top - camera.bottom;
              const viewWidth = viewHeight * aspect;
              camera.left = -viewWidth/2; camera.right = viewWidth/2;
            }
            camera.updateProjectionMatrix();
          }
          stateObj.onResize = onResize;
          window.addEventListener('resize', onResize);

          // ---- standard view buttons (replaces the old view-cube gizmo) ----
          function setView(dirKey){
            const dirs = { front:[0,0,1], back:[0,0,-1], left:[-1,0,0], right:[1,0,0], top:[0,1,0], bottom:[0,-1,0] };
            const d = dirs[dirKey];
            if(!d) return;
            const dist = camera.position.distanceTo(controls.target) || 1;
            camera.position.set(controls.target.x + d[0]*dist, controls.target.y + d[1]*dist, controls.target.z + d[2]*dist);
            if(dirKey === 'top') camera.up.set(0,0,-1);
            else if(dirKey === 'bottom') camera.up.set(0,0,1);
            else camera.up.set(0,1,0);
            controls.update();
          }
          stateObj.setView = setView;

          // ---- Isometric (orthographic, no perspective distortion) vs Perspective camera mode ----
          function switchCameraMode(mode){
            if(mode === cameraMode || !threeState) return;
            const dist = camera.position.distanceTo(controls.target) || 1;
            const dir = camera.position.clone().sub(controls.target).normalize();
            const target = controls.target.clone();
            const up = camera.up.clone();
            const aspect = currentAspect();
            let newCamera;
            if(mode === 'iso'){
              const vFov = 50 * Math.PI/180;
              const viewHeight = 2 * dist * Math.tan(vFov/2);
              const viewWidth = viewHeight * aspect;
              newCamera = new THREE.OrthographicCamera(-viewWidth/2, viewWidth/2, viewHeight/2, -viewHeight/2, 0.01, 5000);
            } else {
              newCamera = new THREE.PerspectiveCamera(50, aspect, 0.01, 5000);
            }
            newCamera.position.copy(target).add(dir.multiplyScalar(dist));
            newCamera.up.copy(up);
            newCamera.lookAt(target);
            controls.dispose();
            camera = newCamera;
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.target.copy(target);
            controls.update();
            cameraMode = mode;
            stateObj.camera = camera; stateObj.controls = controls; stateObj.cameraMode = cameraMode;
          }
          stateObj.setCameraMode = switchCameraMode;

          function animate(){
            if(threeState !== stateObj) return;
            if(!document.body.contains(renderer.domElement)){
              cancelAnimationFrame(stateObj.animId);
              window.removeEventListener('resize', onResize);
              controls.dispose(); renderer.dispose();
              if(threeState === stateObj) threeState = null;
              return;
            }
            stateObj.animId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
          }
          renderer.domElement.addEventListener('click', (e)=>{
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1, -((e.clientY-rect.top)/rect.height)*2+1);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const hits = raycaster.intersectObject(root, true);
            if(!hits.length) return;
            let obj = hits[0].object;
            while(obj && !obj.userData.__vp3dKey) obj = obj.parent;
            if(obj) handleNodeClick(obj.userData.__vp3dKey);
          });
          threeState = stateObj;
          animate();
          return stateObj;
        }
        function teardownScene(){
          if(!threeState) return;
          const st = threeState;
          cancelAnimationFrame(st.animId);
          window.removeEventListener('resize', st.onResize);
          st.controls.dispose();
          st.renderer.dispose();
          threeState = null;
        }

        function renderShell(){
          const tabsHtml = plans.map(p=>`<button type="button" class="chip vp-tab ${p.id===vpActivePlanId?'active':''}" data-plan-id="${p.id}">${escapeHtml(p.building_name)}</button>`).join('');
          container.innerHTML = `
            <div class="vp-plan-tabs">
              ${tabsHtml}
              <button type="button" class="chip" id="vp3dAddPlanBtn">＋ เพิ่มโมเดลใหม่</button>
            </div>
            ${plans.length ? '<div id="vpPlanEditor"></div>' : '<div class="dash-empty">ยังไม่มีโมเดล 3D — กด "เพิ่มโมเดลใหม่" ด้านบนเพื่อเริ่มต้น (ต้อง export จาก SketchUp เป็นไฟล์ .glb ก่อน)</div>'}
          `;
          container.querySelectorAll('.vp-tab').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              vpActivePlanId = Number(btn.dataset.planId);
              vpSelectedDate = todayISO();
              vpAssignments = loadAssignmentsFor(vpActivePlanId, vpSelectedDate);
              vpActiveColorIdx = -1; vpActiveGroupId = null; vpEraseMode = false; vpUndoStack = []; vp3dStyleMode = 'normal'; vp3dCameraMode = 'perspective'; vpHiddenGroups = new Set();
              renderShell();
            });
          });
          document.getElementById('vp3dAddPlanBtn').addEventListener('click', openAdd3DPlanModal);
          if(vpActivePlanId != null) renderPlanArea();
        }

        function renderPlanArea(){
          const plan = plans.find(p=>p.id===vpActivePlanId);
          const editor = document.getElementById('vpPlanEditor');
          if(!plan || !editor) return;
          const groups = legendGroupsOf(plan);
          if(!vpHiddenGroups) vpHiddenGroups = new Set();
          const datesForPlan = (marksByPlan.get(plan.id) || []).map(m=>m.mark_date);
          let badgeHtml = '';
          groups.forEach(g=>{
            if(!g.total_units) return;
            (g.items||[]).filter(l=>l.is_completion).forEach(item=>{
              const cnt = Object.values(vpAssignments).filter(e=> e && (e.group||'_default')===g.id && vpCumulativeColors(g,item).includes(e.color)).length;
              const pct = Math.round((cnt/g.total_units)*1000)/10;
              badgeHtml += `<div class="vp-badge" data-completion-group="${escapeHtml(g.id)}" data-completion-color="${escapeHtml(item.color)}">${escapeHtml(g.name || '')} — ${escapeHtml(item.label)}: ทั้งหมด ${g.total_units} จุด แล้วเสร็จ ${cnt} จุด คิดเป็น ${pct}%</div>`;
            });
          });
          editor.innerHTML = `
            ${badgeHtml}
            <div class="vp-date-row">
              <label>วันที่:</label>
              <input type="date" id="vp3dDateInput" value="${vpSelectedDate}" style="width:auto;">
              <button type="button" class="btn btn-ghost" id="vp3dLoadPrevBtn" style="flex:0 0 auto;">โหลดจากวันก่อนหน้า</button>
              ${datesForPlan.length ? `<select id="vp3dDateJump" style="max-width:220px;"><option value="">-- วันที่มีบันทึกไว้ --</option>${datesForPlan.map(d=>`<option value="${d}">${d}</option>`).join('')}</select>` : ''}
              <button type="button" class="btn btn-ghost" id="vp3dEditPlanBtn" style="flex:0 0 auto;margin-left:auto;">✏️ แก้ไขแปลน</button>
              <button type="button" class="btn btn-ghost" id="vp3dDeletePlanBtn" style="flex:0 0 auto;color:var(--danger);">🗑️ ลบแปลนนี้</button>
            </div>
            <div class="vp3d-fullscreen-wrap" id="vp3dFullscreenWrap">
              ${groups.map(g=>`
              <div class="vp-legend-group">
                <label class="vp-legend-group-head">
                  <input type="checkbox" class="vp-group-vis-toggle" data-group="${escapeHtml(g.id)}" ${vpHiddenGroups.has(g.id)?'':'checked'}>
                  ${escapeHtml(g.name || 'Group')}${g.total_units!=null && g.total_units!=='' ? ` (${g.total_units} จุด)` : ''}
                </label>
                <div class="vp-toolbar">
                  ${(g.items||[]).map((l,i)=>`<button type="button" class="vp-legend-btn ${(g.id===vpActiveGroupId && i===vpActiveColorIdx)?'active':''}" data-group="${escapeHtml(g.id)}" data-idx="${i}"><span class="vp-legend-swatch" style="background:${l.color}"></span>${escapeHtml(l.label)}${l.link_level?' 🔗':''}</button>`).join('')}
                </div>
              </div>`).join('')}
              <div class="vp-toolbar">
                <button type="button" class="btn btn-ghost" id="vp3dEraseBtn" style="flex:0 0 auto;${vpEraseMode?'background:var(--danger);color:#fff;':''}">🧽 โหมดลบ</button>
                <button type="button" class="btn btn-ghost" id="vp3dUndoBtn" style="flex:0 0 auto;">↩️ Undo</button>
                <button type="button" class="btn btn-ghost" id="vp3dClearBtn" style="flex:0 0 auto;">ล้างทั้งหมด</button>
                <button type="button" class="btn btn-ghost" id="vp3dFullscreenBtn" style="flex:0 0 auto;margin-left:auto;">⛶ เต็มจอ</button>
              </div>
              <div class="vp-toolbar">
                <button type="button" class="btn btn-ghost" id="vp3dFitAllBtn" style="flex:0 0 auto;">🔍 มุมมองรวมทั้งหมด</button>
                <span style="flex:0 0 auto;color:var(--muted);font-size:12px;align-self:center;">มุมมองด้าน:</span>
                <button type="button" class="btn btn-ghost vp3d-view-btn" data-view="front" style="flex:0 0 auto;">หน้า</button>
                <button type="button" class="btn btn-ghost vp3d-view-btn" data-view="back" style="flex:0 0 auto;">หลัง</button>
                <button type="button" class="btn btn-ghost vp3d-view-btn" data-view="left" style="flex:0 0 auto;">ซ้าย</button>
                <button type="button" class="btn btn-ghost vp3d-view-btn" data-view="right" style="flex:0 0 auto;">ขวา</button>
                <button type="button" class="btn btn-ghost vp3d-view-btn" data-view="top" style="flex:0 0 auto;">บน</button>
                <button type="button" class="btn btn-ghost vp3d-view-btn" data-view="bottom" style="flex:0 0 auto;">ล่าง</button>
              </div>
              <div class="vp-toolbar">
                <span style="flex:0 0 auto;color:var(--muted);font-size:12px;align-self:center;">มุมมอง 3D:</span>
                <button type="button" class="btn btn-ghost vp3d-cammode-btn ${vp3dCameraMode==='perspective'?'active':''}" data-cammode="perspective" style="flex:0 0 auto;">📷 Perspective</button>
                <button type="button" class="btn btn-ghost vp3d-cammode-btn ${vp3dCameraMode==='iso'?'active':''}" data-cammode="iso" style="flex:0 0 auto;">📐 Isometric</button>
                <span style="flex:0 0 auto;color:var(--muted);font-size:12px;align-self:center;margin-left:12px;">รูปแบบโมเดล:</span>
                <button type="button" class="btn btn-ghost vp3d-style-btn ${vp3dStyleMode==='normal'?'active':''}" data-style="normal" style="flex:0 0 auto;">👁️ ปกติ</button>
                <button type="button" class="btn btn-ghost vp3d-style-btn ${vp3dStyleMode==='xray'?'active':''}" data-style="xray" style="flex:0 0 auto;">🌫️ X-ray</button>
                <button type="button" class="btn btn-ghost vp3d-style-btn ${vp3dStyleMode==='wireframe'?'active':''}" data-style="wireframe" style="flex:0 0 auto;">📐 เส้นขอบ</button>
              </div>
              <div class="vp3d-layout">
                <div class="vp3d-canvas-wrap" id="vp3dCanvasWrap"><div class="vp3d-loading">กำลังโหลดโมเดล 3D...</div></div>
                <div class="vp3d-list-wrap">
                  <input type="text" id="vp3dSearchInput" placeholder="ค้นหาชิ้นส่วน...">
                  <div id="vp3dListBody"></div>
                </div>
              </div>
            </div>
            <div class="dash-note">เลือก Group แล้วคลิกเลือกสถานะจาก Legend ของ Group นั้น แล้วคลิกชิ้นส่วนบนโมเดล 3D โดยตรง หรือคลิกเลือกจากรายการด้านขวา — หมุน/ซูมโมเดลด้วยเมาส์ (ลากซ้าย = หมุน, scroll = ซูม, ลากขวา = เลื่อน) — เปิด "โหมดลบ" แล้วคลิกชิ้นส่วนเพื่อลบสถานะ — ติ๊ก/ปลดติ๊กชื่อ Group ด้านบนเพื่อซ่อน/แสดงสีของ Group นั้นบนโมเดล (ซ่อนได้พร้อมกันหลาย Group หรือแสดงทั้งหมดพร้อมกันก็ได้ ไม่กระทบข้อมูลที่บันทึกไว้) — กดปุ่ม "มุมมองด้าน" (หน้า/หลัง/ซ้าย/ขวา/บน/ล่าง) เพื่อดูตรงมุมนั้นทันที หรือกด "มุมมองรวมทั้งหมด" เพื่อขยายให้เห็นทั้งโมเดล — เลือก "มุมมอง 3D" เป็น Perspective (มีระยะใกล้ไกล) หรือ Isometric (มุมมองขนาน ไม่มีระยะบิดเบือน) และ "รูปแบบโมเดล" เป็น X-ray/เส้นขอบ ได้ตามต้องการ (แค่ปรับมุมมอง ไม่กระทบข้อมูลที่บันทึกไว้) — อย่าลืมกด "บันทึกของวันนี้" ทุกครั้งหลังแก้ไข</div>
            <div class="btn-row">
              <button class="btn btn-primary" id="vp3dSaveBtn">💾 บันทึกของวันที่ ${vpSelectedDate}</button>
              <button class="btn btn-ghost" id="vp3dScreenshotBtn">📷 บันทึกภาพหน้าจอ</button>
            </div>
          `;
          document.getElementById('vp3dDateInput').addEventListener('change', (e)=>{
            vpSelectedDate = e.target.value || todayISO();
            vpAssignments = loadAssignmentsFor(plan.id, vpSelectedDate);
            vpUndoStack = [];
            renderPlanArea();
          });
          document.getElementById('vp3dLoadPrevBtn').addEventListener('click', ()=>{
            const prevDate = latestDateBefore(plan.id, vpSelectedDate);
            if(!prevDate){ showToast('ไม่พบข้อมูลวันก่อนหน้า', true); return; }
            vpUndoStack.push(JSON.parse(JSON.stringify(vpAssignments)));
            vpAssignments = loadAssignmentsFor(plan.id, prevDate);
            renderPlanArea();
            showToast('โหลดข้อมูลจากวันที่ ' + prevDate + ' มาต่อแล้ว (ยังไม่บันทึก)');
          });
          const jumpSel = document.getElementById('vp3dDateJump');
          if(jumpSel) jumpSel.addEventListener('change', (e)=>{
            if(!e.target.value) return;
            vpSelectedDate = e.target.value;
            vpAssignments = loadAssignmentsFor(plan.id, vpSelectedDate);
            vpUndoStack = [];
            renderPlanArea();
          });
          document.getElementById('vp3dEditPlanBtn').addEventListener('click', ()=> openEdit3DPlanModal(plan));
          document.getElementById('vp3dDeletePlanBtn').addEventListener('click', ()=> delete3DPlan(plan));
          document.getElementById('vp3dFitAllBtn').addEventListener('click', ()=>{
            if(!threeState){ showToast('กรุณารอให้โมเดลโหลดเสร็จก่อน', true); return; }
            threeState.fitAll();
          });
          container.querySelectorAll('.vp3d-view-btn').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              if(!threeState){ showToast('กรุณารอให้โมเดลโหลดเสร็จก่อน', true); return; }
              threeState.setView(btn.dataset.view);
            });
          });
          container.querySelectorAll('.vp3d-cammode-btn').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              vp3dCameraMode = btn.dataset.cammode;
              if(threeState) threeState.setCameraMode(vp3dCameraMode);
              container.querySelectorAll('.vp3d-cammode-btn').forEach(b=> b.classList.toggle('active', b.dataset.cammode === vp3dCameraMode));
            });
          });
          container.querySelectorAll('.vp3d-style-btn').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              vp3dStyleMode = btn.dataset.style;
              applyStyleModeToScene();
              container.querySelectorAll('.vp3d-style-btn').forEach(b=> b.classList.toggle('active', b.dataset.style === vp3dStyleMode));
            });
          });
          container.querySelectorAll('.vp-legend-btn').forEach(btn=>{
            btn.addEventListener('click', ()=>{
              const gId = btn.dataset.group;
              const idx = Number(btn.dataset.idx);
              if(vpActiveGroupId === gId && vpActiveColorIdx === idx){ vpActiveGroupId = null; vpActiveColorIdx = -1; }
              else { vpActiveGroupId = gId; vpActiveColorIdx = idx; }
              vpEraseMode = false;
              renderPlanArea();
            });
          });
          container.querySelectorAll('.vp-group-vis-toggle').forEach(cb=>{
            cb.addEventListener('change', ()=>{
              const gId = cb.dataset.group;
              if(cb.checked) vpHiddenGroups.delete(gId); else vpHiddenGroups.add(gId);
              applyAssignmentsToScene();
            });
          });
          document.getElementById('vp3dEraseBtn').addEventListener('click', ()=>{
            vpEraseMode = !vpEraseMode;
            if(vpEraseMode) { vpActiveGroupId = null; vpActiveColorIdx = -1; }
            renderPlanArea();
          });
          document.getElementById('vp3dUndoBtn').addEventListener('click', ()=>{
            if(!vpUndoStack.length){ showToast('ไม่มีการแก้ไขให้ Undo', true); return; }
            vpAssignments = vpUndoStack.pop();
            applyAssignmentsToScene(); refreshListDots(); refreshBadge();
          });
          document.getElementById('vp3dClearBtn').addEventListener('click', ()=>{
            if(!Object.keys(vpAssignments).length) return;
            if(!confirm('ล้างสถานะทั้งหมดของวันที่ ' + vpSelectedDate + ' ?')) return;
            vpUndoStack.push(JSON.parse(JSON.stringify(vpAssignments)));
            vpAssignments = {};
            applyAssignmentsToScene(); refreshListDots(); refreshBadge();
          });
          document.getElementById('vp3dSaveBtn').addEventListener('click', ()=> save3DAssignments(plan));
          const vp3dFsBtn = document.getElementById('vp3dFullscreenBtn');
          if(vp3dFsBtn){
            vp3dFsBtn.addEventListener('click', ()=>{
              const wrap = document.getElementById('vp3dFullscreenWrap');
              const reqFs = wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.msRequestFullscreen;
              const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
              if(!document.fullscreenElement){ reqFs.call(wrap); } else { exitFs.call(document); }
            });
            if(!vp3dFsListenerAttached){
              vp3dFsListenerAttached = true;
              document.addEventListener('fullscreenchange', ()=>{
                const btn = document.getElementById('vp3dFullscreenBtn');
                if(btn) btn.textContent = document.fullscreenElement ? '⤡ ออกจากเต็มจอ' : '⛶ เต็มจอ';
                if(threeState) setTimeout(()=>{ if(threeState && threeState.onResize) threeState.onResize(); }, 60);
              });
            }
          }
          document.getElementById('vp3dScreenshotBtn').addEventListener('click', ()=>{
            if(!threeState){ showToast('กรุณารอให้โมเดลโหลดเสร็จก่อน', true); return; }
            threeState.renderer.render(threeState.scene, threeState.camera);
            const url = threeState.renderer.domElement.toDataURL('image/png');
            const safeName = (plan.building_name || 'model').replace(/[^a-zA-Z0-9ก-๙_-]/g, '_');
            const a = document.createElement('a');
            a.href = url; a.download = safeName + '_' + vpSelectedDate + '.png';
            document.body.appendChild(a); a.click(); a.remove();
          });

          const wrap = document.getElementById('vp3dCanvasWrap');
          let nodeLabels = Object.assign({}, plan.node_labels || {});
          async function renameNode(originalName){
            const currentLabel = nodeLabels[originalName] || originalName;
            const input = prompt('ตั้งชื่อที่แสดงสำหรับชิ้นส่วนนี้ (ชื่อเดิมในไฟล์: "' + originalName + '")\nเว้นว่างเพื่อใช้ชื่อเดิม:', currentLabel === originalName ? '' : currentLabel);
            if(input === null) return;
            const trimmed = input.trim();
            if(trimmed && trimmed !== originalName) nodeLabels[originalName] = trimmed; else delete nodeLabels[originalName];
            plan.node_labels = nodeLabels;
            const search = document.getElementById('vp3dSearchInput');
            if(window.__vp3dDrawList) window.__vp3dDrawList(search ? search.value : '');
            try{
              const res = await fetch(SUPABASE_URL + '/rest/v1/visual_progress_3d_plans?id=eq.' + plan.id, { method:'PATCH', headers:{ ...HEADERS, 'Prefer':'return=minimal' }, body: JSON.stringify({ node_labels: nodeLabels }) });
              if(!res.ok) throw new Error('save failed: ' + res.status + ' ' + await res.text());
            }catch(e){ console.error(e); showToast('บันทึกชื่อไม่สำเร็จ: ' + e.message, true); }
          }
          ensureSceneForPlan(plan, wrap).then(state=>{
            const names = Array.from(state.nodesByName.keys()).sort();
            function drawList(filter){
              const f = (filter||'').toLowerCase();
              const listBody = document.getElementById('vp3dListBody');
              if(!listBody) return;
              listBody.innerHTML = names.filter(n=>{
                const label = nodeLabels[n] || n;
                return n.toLowerCase().includes(f) || label.toLowerCase().includes(f);
              }).map(n=>{
                const entry = vpAssignments[n];
                const color = entry && entry.color;
                const label = nodeLabels[n] || n;
                return `<div class="vp3d-list-row"><span class="vp3d-list-dot" data-name="${escapeHtml(n)}" style="${color?('background:'+color+';'):''}cursor:pointer;flex:0 0 auto;"></span><span class="vp3d-list-name" data-name="${escapeHtml(n)}" style="flex:1;cursor:pointer;" title="${escapeHtml(n)}">${escapeHtml(label)}</span><span class="vp3d-rename-btn" data-name="${escapeHtml(n)}" title="ตั้งชื่อที่แสดง" style="cursor:pointer;opacity:.55;flex:0 0 auto;">✏️</span></div>`;
              }).join('');
              listBody.querySelectorAll('.vp3d-list-dot,.vp3d-list-name').forEach(el=>{
                el.addEventListener('click', ()=> handleNodeClick(el.dataset.name));
              });
              listBody.querySelectorAll('.vp3d-rename-btn').forEach(el=>{
                el.addEventListener('click', (e)=>{ e.stopPropagation(); renameNode(el.dataset.name); });
              });
            }
            window.__vp3dDrawList = drawList;
            drawList('');
            state.listBody = document.getElementById('vp3dListBody');
            const search = document.getElementById('vp3dSearchInput');
            if(search) search.addEventListener('input', (e)=> drawList(e.target.value));
            applyAssignmentsToScene();
            applyStyleModeToScene();
            if(vp3dCameraMode !== state.cameraMode) state.setCameraMode(vp3dCameraMode);
          }).catch(e=>{ console.error(e); wrap.innerHTML = '<div class="dash-empty">โหลดโมเดลไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; });
        }
        function applyStyleModeToScene(){
          if(!threeState) return;
          const THREE = threeState.THREE;
          threeState.root.traverse(child=>{
            if(!child.isMesh) return;
            if(!child.userData.__vpMatClone){
              child.material = Array.isArray(child.material) ? child.material.map(m=>m.clone()) : child.material.clone();
              child.userData.__vpMatClone = true;
            }
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m=>{
              if(!m.userData.__vpOrigStyle){
                m.userData.__vpOrigStyle = { transparent: m.transparent, opacity: m.opacity, depthWrite: m.depthWrite };
              }
              const orig = m.userData.__vpOrigStyle;
              if(vp3dStyleMode === 'xray'){
                m.transparent = true; m.opacity = 0.32; m.depthWrite = false;
              } else {
                m.transparent = orig.transparent; m.opacity = orig.opacity; m.depthWrite = orig.depthWrite;
              }
              m.needsUpdate = true;
            });
            if(!child.userData.__vpEdgeLines){
              const edgeGeo = new THREE.EdgesGeometry(child.geometry, 20);
              const edgeMat = new THREE.LineBasicMaterial({ color: 0x1B2430 });
              const edges = new THREE.LineSegments(edgeGeo, edgeMat);
              edges.visible = false;
              child.add(edges);
              child.userData.__vpEdgeLines = edges;
            }
            child.userData.__vpEdgeLines.visible = (vp3dStyleMode === 'wireframe');
          });
        }

        async function save3DAssignments(plan){
          const btn = document.getElementById('vp3dSaveBtn');
          btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
          try{
            const payload = { plan_id: plan.id, mark_date: vpSelectedDate, assignments: vpAssignments, updated_at: new Date().toISOString() };
            const res = await fetch(SUPABASE_URL + '/rest/v1/visual_progress_3d_marks?on_conflict=plan_id,mark_date', {
              method:'POST', headers:{ ...HEADERS, 'Prefer':'resolution=merge-duplicates,return=minimal' },
              body: JSON.stringify(payload)
            });
            if(!res.ok) throw new Error('save failed: ' + res.status + ' ' + await res.text());
            let arr = marksByPlan.get(plan.id);
            if(!arr){ arr = []; marksByPlan.set(plan.id, arr); }
            const idx = arr.findIndex(m=>m.mark_date===vpSelectedDate);
            const savedRow = { plan_id: plan.id, mark_date: vpSelectedDate, assignments: JSON.parse(JSON.stringify(vpAssignments)) };
            if(idx>=0) arr[idx] = savedRow; else arr.push(savedRow);
            arr.sort((a,b)=> a.mark_date < b.mark_date ? 1 : -1);
            showToast('บันทึกข้อมูลวันที่ ' + vpSelectedDate + ' สำเร็จ');
            renderPlanArea();
            const groupsForSync = legendGroupsOf(plan);
            const countFn = (gid, colors) => Object.values(vpAssignments).filter(e => e && (e.group||'_default') === gid && colors.includes(e.color)).length;
            vpSyncGroupsToBOQ(groupsForSync, countFn, subActsForLink, mainActsForLink).then(r=>{
              if(r.synced) showToast('ซิงก์ %POC/Actual BOQ ไปยัง Sub Activity ที่ลิงก์ไว้แล้ว ' + r.synced + ' รายการ' + (r.failed ? (' (ล้มเหลว ' + r.failed + ' รายการ)') : ''));
              else if(r.failed) showToast('ซิงก์ไปยัง Sub Activity ล้มเหลว ' + r.failed + ' รายการ', true);
              if(r.unmatched && r.unmatched.length) showToast('⚠️ พบลิงก์ที่ข้อมูลอ้างอิงไม่ตรงกับปัจจุบัน (อาจถูกลบ/แก้ไข BOQ): ' + r.unmatched.join(', '), true);
              if(r.noTotal && r.noTotal.length) showToast('ℹ️ Group ที่ยังไม่ได้ตั้ง "จำนวนทั้งหมด" จึงยังไม่ซิงก์: ' + r.noTotal.join(', '), true);
            });
          }catch(e){ console.error(e); showToast('บันทึกไม่สำเร็จ: ' + e.message, true); }
          finally{ btn.disabled = false; btn.textContent = '💾 บันทึกของวันที่ ' + vpSelectedDate; }
        }

        async function delete3DPlan(plan){
          if(!confirm('ลบแปลน 3D "' + plan.building_name + '" พร้อมข้อมูลที่มาร์คไว้ทั้งหมด? การลบนี้ย้อนกลับไม่ได้')) return;
          try{
            await fetch(SUPABASE_URL + '/rest/v1/visual_progress_3d_marks?plan_id=eq.' + plan.id, { method:'DELETE', headers: HEADERS });
            await fetch(SUPABASE_URL + '/rest/v1/visual_progress_3d_plans?id=eq.' + plan.id, { method:'DELETE', headers: HEADERS });
            await deleteStorageObjectByUrl(plan.model_url);
            showToast('ลบแปลนแล้ว');
            switchModule('dash_visual_progress_3d');
          }catch(e){ console.error(e); showToast('ลบไม่สำเร็จ: ' + e.message, true); }
        }

        function openAdd3DPlanModal(){
          const modal = document.getElementById('modalContent');
          const state = {
            nextGid: 1,
            linkOptions: linkOptions,
            groups: [{
              _gid: 0, id: null, name: 'ฐานราก', total_units: null,
              rows: [
                { label:'งานขุด FOOTING', color:'#F5A623', is_completion:false, link_level:null, link_ref:null, _id:0 },
                { label:'งานเทลีน FOOTING', color:'#E04B2B', is_completion:false, link_level:null, link_ref:null, _id:1 },
                { label:'งานเข้าแบบผูกเหล็ก FOOTING', color:'#6C4CE0', is_completion:false, link_level:null, link_ref:null, _id:2 },
                { label:'งานเทคอนกรีต FOOTING', color:'#3FB950', is_completion:true, link_level:null, link_ref:null, _id:3 },
              ],
              nextRowId: 4,
            }],
          };
          modal.innerHTML = `
            <div class="modal-head"><h2>เพิ่มโมเดล 3D ใหม่ (Visual Progress 3D)</h2><button class="modal-close" id="vp3dModalClose">&times;</button></div>
            <div class="detail-grid">
              <div class="detail-field full"><label>ชื่ออาคาร / แปลน</label><input type="text" id="vp3dNewBuildingName" placeholder="เช่น WHA, WHB, MPB, TLB"></div>
              <div class="detail-field full"><label>ไฟล์โมเดล 3D (.glb ที่ export จาก SketchUp)</label><input type="file" id="vp3dNewFile" accept=".glb,.gltf,model/gltf-binary"></div>
              <div class="detail-field full">
                <label>Group ของสถานะงาน (แยกนับ % สำเร็จอิสระต่อกัน — เช่น ฐานราก, เสา)</label>
                <div id="vpGroupsWrap"></div>
              </div>
            </div>
            <div class="btn-row" style="margin-top:14px;">
              <button class="btn btn-primary" id="vp3dSavePlanBtn">บันทึกโมเดลใหม่</button>
              <button class="btn btn-ghost" id="vp3dCancelPlanBtn">ยกเลิก</button>
            </div>
          `;
          const editorApi = wireVpGroupsEditor(modal, state);
          document.getElementById('vp3dModalClose').addEventListener('click', closeModal);
          document.getElementById('vp3dCancelPlanBtn').addEventListener('click', closeModal);
          document.getElementById('vp3dSavePlanBtn').addEventListener('click', async ()=>{
            editorApi.syncGroupsFromDom();
            const name = document.getElementById('vp3dNewBuildingName').value.trim();
            const fileInput = document.getElementById('vp3dNewFile');
            const file = fileInput.files && fileInput.files[0];
            const legendGroups = buildLegendGroupsPayload(editorApi.getGroups());
            if(!name){ showToast('กรุณาระบุชื่ออาคาร/แปลน', true); return; }
            if(!file){ showToast('กรุณาเลือกไฟล์โมเดล .glb', true); return; }
            if(!legendGroups.length){ showToast('กรุณาระบุ Legend อย่างน้อย 1 รายการ', true); return; }
            const saveBtn = document.getElementById('vp3dSavePlanBtn');
            saveBtn.disabled = true; saveBtn.textContent = 'กำลังอัปโหลด...';
            try{
              const modelUrl = await uploadVpBlob('visual-progress-3d-plans', file, file.name, file.type || 'model/gltf-binary');
              const totalSum = legendGroups.reduce((sum,g)=> sum + (g.total_units||0), 0);
              const payload = { building_name: name, model_url: modelUrl, legend: { groups: legendGroups }, total_units: totalSum || null, sort_order: plans.length };
              const res = await fetch(SUPABASE_URL + '/rest/v1/visual_progress_3d_plans', { method:'POST', headers: { ...HEADERS, 'Prefer':'return=minimal' }, body: JSON.stringify(payload) });
              if(!res.ok) throw new Error('save failed: ' + res.status + ' ' + await res.text());
              closeModal();
              showToast('เพิ่มโมเดล 3D ใหม่สำเร็จ');
              switchModule('dash_visual_progress_3d');
            }catch(e){ console.error(e); showToast('บันทึกไม่สำเร็จ: ' + e.message, true); }
            finally{ saveBtn.disabled = false; saveBtn.textContent = 'บันทึกโมเดลใหม่'; }
          });
          document.getElementById('modalBg').classList.add('show');
        }

        function openEdit3DPlanModal(plan){
          const modal = document.getElementById('modalContent');
          const existingGroups = legendGroupsOf(plan);
          const state = {
            nextGid: existingGroups.length,
            linkOptions: linkOptions,
            groups: existingGroups.map((g,gi)=>({
              _gid: gi, id: g.id, name: g.name || '', total_units: g.total_units,
              rows: (g.items && g.items.length ? g.items : [{label:'',color:'#999999',is_completion:false,link_level:null,link_ref:null}]).map((it,i)=>({ label: it.label, color: it.color, is_completion: !!it.is_completion, link_level: it.link_level || null, link_ref: it.link_ref || null, _id: i })),
              nextRowId: (g.items ? g.items.length : 1),
            })),
          };
          modal.innerHTML = `
            <div class="modal-head"><h2>แก้ไขโมเดล 3D — ${escapeHtml(plan.building_name)}</h2><button class="modal-close" id="vp3dModalClose">&times;</button></div>
            <div class="detail-grid">
              <div class="detail-field full"><label>ชื่ออาคาร / แปลน</label><input type="text" id="vp3dNewBuildingName" value="${escapeHtml(plan.building_name)}"></div>
              <div class="detail-field full"><label>เปลี่ยนไฟล์โมเดล .glb (ไม่บังคับ — ถ้าไม่เลือกจะใช้ไฟล์เดิม)</label><input type="file" id="vp3dNewFile" accept=".glb,.gltf,model/gltf-binary"></div>
              <div class="detail-field full">
                <label>Group ของสถานะงาน (แยกนับ % สำเร็จอิสระต่อกัน — เช่น ฐานราก, เสา)</label>
                <div id="vpGroupsWrap"></div>
              </div>
            </div>
            <div class="btn-row" style="margin-top:14px;">
              <button class="btn btn-primary" id="vp3dSavePlanBtn">บันทึกการแก้ไข</button>
              <button class="btn btn-ghost" id="vp3dCancelPlanBtn">ยกเลิก</button>
            </div>
          `;
          const editorApi = wireVpGroupsEditor(modal, state);
          document.getElementById('vp3dModalClose').addEventListener('click', closeModal);
          document.getElementById('vp3dCancelPlanBtn').addEventListener('click', closeModal);
          document.getElementById('vp3dSavePlanBtn').addEventListener('click', async ()=>{
            editorApi.syncGroupsFromDom();
            const name = document.getElementById('vp3dNewBuildingName').value.trim();
            const fileInput = document.getElementById('vp3dNewFile');
            const file = fileInput.files && fileInput.files[0];
            const legendGroups = buildLegendGroupsPayload(editorApi.getGroups());
            if(!name){ showToast('กรุณาระบุชื่ออาคาร/แปลน', true); return; }
            if(!legendGroups.length){ showToast('กรุณาระบุ Legend อย่างน้อย 1 รายการ', true); return; }
            const saveBtn = document.getElementById('vp3dSavePlanBtn');
            saveBtn.disabled = true; saveBtn.textContent = 'กำลังบันทึก...';
            try{
              const totalSum = legendGroups.reduce((sum,g)=> sum + (g.total_units||0), 0);
              const payload = { building_name: name, legend: { groups: legendGroups }, total_units: totalSum || null };
              let oldModelUrl = null;
              if(file){
                payload.model_url = await uploadVpBlob('visual-progress-3d-plans', file, file.name, file.type || 'model/gltf-binary');
                oldModelUrl = plan.model_url;
              }
              const res = await fetch(SUPABASE_URL + '/rest/v1/visual_progress_3d_plans?id=eq.' + plan.id, { method:'PATCH', headers: { ...HEADERS, 'Prefer':'return=minimal' }, body: JSON.stringify(payload) });
              if(!res.ok) throw new Error('save failed: ' + res.status + ' ' + await res.text());
              if(oldModelUrl) await deleteStorageObjectByUrl(oldModelUrl);
              closeModal();
              showToast('บันทึกการแก้ไขโมเดลสำเร็จ');
              switchModule('dash_visual_progress_3d');
            }catch(e){ console.error(e); showToast('บันทึกไม่สำเร็จ: ' + e.message, true); }
            finally{ saveBtn.disabled = false; saveBtn.textContent = 'บันทึกการแก้ไข'; }
          });
          document.getElementById('modalBg').classList.add('show');
        }

        renderShell();
      }
    },
  ];
  // ================= CUSTOM REPORTS (non-generic entry pages, listed under 📝 Report) =================
  // Safety KPI & Safe Days: a live-editable summary/counter page (not a per-day journal like the
  // other MODULES), so it renders its own form + save handlers instead of using the generic
  // dynamic-field form. Also feeds Dashboard Safety's Incident Performance Pyramid / SHE KPI cards.
  const CUSTOM_REPORTS = [
    {
      id:'hse_kpi_report', label:'Safety KPI & Safe Days', icon:'🦺',
      async render(container){
        container.innerHTML = '<div class="dash-empty">กำลังโหลดข้อมูล...</div>';
        let categories, settings;
        try{
          [categories, settings] = await Promise.all([fetchSafetyKpiCategories(), fetchSafetyHseSettings()]);
        }catch(e){
          container.innerHTML = '<div class="dash-empty">โหลดข้อมูลไม่สำเร็จ: ' + escapeHtml(e.message) + '<br><br>ตรวจสอบว่าได้รันไฟล์ safety_kpi_schema.sql ใน Supabase SQL editor แล้วหรือยัง</div>';
          return;
        }

        const LEVEL_OPTIONS = ['-','L1','L2','L3'];
        function levelCellHtml(c){
          if(c.level_locked){
            return `<span class="kpi-level-badge">${escapeHtml(c.level||'-')}</span><div class="kpi-level-note">คงที่ตามนิยาม</div>`;
          }
          const opts = LEVEL_OPTIONS.map(o => `<option value="${o}" ${((c.level||'-')===o)?'selected':''}>${o}</option>`).join('');
          return `<select class="kpi-input kpi-level-select" data-id="${c.id}">${opts}</select>`;
        }
        function rowHtml(c){
          const total = kpiTotal(c);
          return `<tr data-row-id="${c.id}">
            <td class="kpi-name">${escapeHtml(c.name)}</td>
            <td>${levelCellHtml(c)}</td>
            <td><input class="kpi-input kpi-target" type="number" step="1" value="${Number(c.target)||0}"></td>
            <td><input class="kpi-input kpi-prev" type="number" step="1" value="${Number(c.prev_acc)||0}"></td>
            <td><input class="kpi-input kpi-week" type="number" step="1" value="${Number(c.week_actual)||0}"></td>
            <td><input class="kpi-input kpi-total" type="number" value="${total}" readonly></td>
            <td><button class="btn-del-kpi" type="button" data-id="${c.id}" title="ลบหมวดนี้">🗑</button></td>
          </tr>`;
        }

        function renderTable(){
          $('#hseKpiTableBody').innerHTML = categories.map(rowHtml).join('');
          // keep TOTAL live as the user edits PREV/WEEK, without needing a save round-trip
          $$('#hseKpiTableBody tr').forEach(tr=>{
            const prevInput = tr.querySelector('.kpi-prev'), weekInput = tr.querySelector('.kpi-week'), totalInput = tr.querySelector('.kpi-total');
            function recalc(){ totalInput.value = (Number(prevInput.value)||0) + (Number(weekInput.value)||0); }
            prevInput.addEventListener('input', recalc);
            weekInput.addEventListener('input', recalc);
          });
          $$('#hseKpiTableBody .btn-del-kpi').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
              const id = btn.dataset.id;
              const cat = categories.find(c => String(c.id) === String(id));
              if(!cat) return;
              if(!confirm('ลบหมวด KPI "' + cat.name + '" ใช่หรือไม่? ข้อมูลจะถูกลบทันทีและไม่สามารถกู้คืนได้')) return;
              try{
                const res = await fetch(SUPABASE_URL + '/rest/v1/safety_kpi_categories?id=eq.' + id, {
                  method:'DELETE', headers: HEADERS
                });
                if(!res.ok) throw new Error(await res.text());
                categories = categories.filter(c => String(c.id) !== String(id));
                renderTable();
                showToast('ลบหมวด KPI แล้ว');
              }catch(e){ showToast('ลบไม่สำเร็จ: ' + e.message, true); }
            });
          });
        }

        container.innerHTML = `
          <div class="tagcard" style="padding:16px;">
            <h3 style="margin:0 0 14px;">Reportable KPI (hse_kpi)</h3>
            <div style="overflow-x:auto;">
              <table class="kpi-table" style="min-width:760px;">
                <thead><tr><th>KPI</th><th>Level</th><th>Target</th><th>สะสมก่อนหน้า (PREV)</th><th>สัปดาห์นี้ (WEEK)</th><th>สะสมรวม (TOTAL)</th><th></th></tr></thead>
                <tbody id="hseKpiTableBody"></tbody>
              </table>
            </div>
            <div class="kpi-addrow">
              <div class="field">
                <label>เพิ่มหมวด KPI ใหม่</label>
                <input type="text" id="newKpiName" placeholder="เช่น Transportation Incident">
              </div>
              <button class="btn-add" id="btnAddKpiCategory" type="button">+ เพิ่มหมวด</button>
            </div>
            <div class="btn-row" style="padding:16px 0 0;">
              <button class="btn btn-primary" id="btnSaveHseKpi" type="button" style="flex:0 0 auto;">บันทึก HSE KPI</button>
            </div>
          </div>

          <div class="tagcard" style="padding:16px;margin-top:16px;">
            <h3 style="margin:0 0 6px;">Safe Man-Hours / Safe Working Days (hse_safe_days_counter)</h3>
            <div class="dash-note" style="margin-bottom:14px;">Safe Working Days และ Safe Man-Hours คำนวณอัตโนมัติถึง "วันนี้" เสมอ (กำลังคนรวมต่อวัน × 10 ชม. สะสมตั้งแต่ "วันเริ่มนับ") — ไม่ต้องกรอก/กดอัพเดทรายวัน ปรับได้แค่ "วันเริ่มนับ" (reset หลังเกิด LTI)</div>
            <div class="two-col" style="grid-template-columns:1fr 1fr 1fr;gap:12px;">
              <div class="field">
                <label>วันเริ่มนับ</label>
                <input type="date" id="hseStartDate" value="${settings ? escapeHtml(settings.start_date) : ''}">
              </div>
              <div class="field">
                <label>ข้อมูล ณ วันที่ (Auto = วันนี้)</label>
                <input class="kpi-input" type="text" id="hseAsOfDate" value="" readonly>
              </div>
              <div class="field">
                <label>Safe Man-Hours สะสม (Auto)</label>
                <input class="kpi-input" type="text" id="hseManHours" value="กำลังคำนวณ..." readonly>
              </div>
            </div>
            <div class="btn-row" style="padding:14px 0 0;">
              <button class="btn btn-primary" id="btnSaveStartDate" type="button" style="flex:0 0 auto;">บันทึกวันเริ่มนับ</button>
            </div>
          </div>
        `;

        renderTable();

        // format today's date the same way the rest of the app shows Buddhist-era dates in dashboards, but plain is fine here
        $('#hseAsOfDate').value = todayISO();

        // compute Safe Man-Hours = sum over [start_date..today] of (total manpower reported that day in
        // Daily Report เท่านั้น) × 10 hrs — days with no report count as 0 manpower for that day
        // (ปรับ 2026-09-08 ตามที่ผู้ใช้ระบุ "ให้รวม Man hour เฉพาะที่อยู่ใน Daily Report" — เดิมรวม
        // concrete_reports (foreman/safety/worker/other) เข้าไปด้วย ตัดออกแล้ว ใช้แค่ daily_reports)
        async function computeSafeManHours(){
          const startDate = $('#hseStartDate').value;
          if(!startDate){ $('#hseManHours').value = '- (ยังไม่ตั้งวันเริ่มนับ)'; return; }
          try{
            const dailyRes = await fetch(SUPABASE_URL + '/rest/v1/daily_reports?select=report_date,repco_personnel,state_personnel_site,state_personnel_workshop&report_date=gte.' + startDate, { headers: HEADERS });
            const dailyRows = dailyRes.ok ? await dailyRes.json() : [];
            const byDate = {};
            dailyRows.forEach(r=>{
              const mp = sumPersonnel(r.repco_personnel) + sumPersonnel(r.state_personnel_site) + sumPersonnel(r.state_personnel_workshop);
              byDate[r.report_date] = (byDate[r.report_date]||0) + mp;
            });
            const totalManpower = Object.values(byDate).reduce((s,v)=>s+v, 0);
            const manHours = totalManpower * 10;
            $('#hseManHours').value = manHours.toLocaleString() + ' ชม. (กำลังคนสะสม ' + totalManpower.toLocaleString() + ' คน-วัน)';
          }catch(e){ $('#hseManHours').value = 'คำนวณไม่สำเร็จ: ' + e.message; }
        }
        computeSafeManHours();

        $('#btnAddKpiCategory').addEventListener('click', async ()=>{
          const name = $('#newKpiName').value.trim();
          if(!name){ showToast('กรุณากรอกชื่อหมวด KPI', true); return; }
          try{
            const maxSort = categories.reduce((m,c)=> Math.max(m, c.sort_order||0), 0);
            const res = await fetch(SUPABASE_URL + '/rest/v1/safety_kpi_categories', {
              method:'POST', headers:{...HEADERS,'Prefer':'return=representation'},
              body: JSON.stringify({ name, unit:'Case', level:null, level_locked:false, target:0, prev_acc:0, week_actual:0, sort_order: maxSort+1 })
            });
            if(!res.ok) throw new Error(await res.text());
            const [created] = await res.json();
            categories.push(created);
            $('#newKpiName').value = '';
            renderTable();
            showToast('เพิ่มหมวด KPI แล้ว');
          }catch(e){ showToast('เพิ่มหมวดไม่สำเร็จ: ' + e.message, true); }
        });

        $('#btnSaveHseKpi').addEventListener('click', async ()=>{
          const btn = $('#btnSaveHseKpi'); btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
          try{
            const writes = $$('#hseKpiTableBody tr').map(tr=>{
              const id = tr.dataset.rowId;
              const levelSelect = tr.querySelector('.kpi-level-select');
              const patch = {
                target: Number(tr.querySelector('.kpi-target').value) || 0,
                prev_acc: Number(tr.querySelector('.kpi-prev').value) || 0,
                week_actual: Number(tr.querySelector('.kpi-week').value) || 0,
              };
              if(levelSelect) patch.level = levelSelect.value === '-' ? null : levelSelect.value;
              return fetch(SUPABASE_URL + '/rest/v1/safety_kpi_categories?id=eq.' + id, {
                method:'PATCH', headers:{...HEADERS,'Prefer':'return=minimal'}, body: JSON.stringify(patch)
              });
            });
            const results = await Promise.all(writes);
            const failed = results.find(r=>!r.ok);
            if(failed) throw new Error('save failed: ' + failed.status);
            showToast('บันทึก HSE KPI แล้ว');
          }catch(e){ showToast('บันทึกไม่สำเร็จ: ' + e.message, true); }
          finally{ btn.disabled = false; btn.textContent = 'บันทึก HSE KPI'; }
        });

        $('#btnSaveStartDate').addEventListener('click', async ()=>{
          const startDate = $('#hseStartDate').value;
          if(!startDate){ showToast('กรุณาเลือกวันเริ่มนับ', true); return; }
          const btn = $('#btnSaveStartDate'); btn.disabled = true;
          try{
            const res = await fetch(SUPABASE_URL + '/rest/v1/safety_hse_settings?id=eq.default', {
              method:'PATCH', headers:{...HEADERS,'Prefer':'return=minimal'}, body: JSON.stringify({ start_date: startDate, updated_at: new Date().toISOString() })
            });
            if(!res.ok) throw new Error(await res.text());
            showToast('บันทึกวันเริ่มนับแล้ว');
            await computeSafeManHours();
          }catch(e){ showToast('บันทึกไม่สำเร็จ: ' + e.message, true); }
          finally{ btn.disabled = false; }
        });
      }
    },
  ];

  let activeModule = MODULES[0];
  let rows = []; // current module's data
  let editingId = null;
  let pendingPhotos = [];
  let removedExistingUrls = [];
  let currentFilterStatus = 'all';
  // ---------- Piling: กรอกกลุ่ม (bulk assign RFI No. / Production Day / Delivery Day) ----------
  let bulkSelectedIds = new Set();
  let bulkSearch = '', bulkAreaFilter = '', bulkStatusFilter = '';
  let currentSearch = '';

  function setConn(ok, text){ $('#connDot').classList.toggle('off', !ok); $('#connText').textContent = text; }

  // ---------- Supabase REST ----------
  function restUrl(){ return SUPABASE_URL + '/rest/v1/' + activeModule.table; }
  // PostgREST caps a plain select at the project's "Max Rows" setting (default 1000), so page
  // through with the Range header until a page comes back short of the page size. Used by every
  // fetch that can plausibly exceed 1000 rows (module lists and dashboards alike).
  async function fetchAllRows(urlWithoutRange){
    const PAGE_SIZE = 1000;
    let all = [];
    let offset = 0;
    while(true){
      const res = await fetch(urlWithoutRange, {
        headers: { ...HEADERS, 'Range-Unit': 'items', 'Range': offset + '-' + (offset + PAGE_SIZE - 1) }
      });
      if(!res.ok) throw new Error('fetch failed: ' + res.status);
      const page = await res.json();
      all = all.concat(page);
      if(page.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    return all;
  }
  async function fetchAll(){
    rows = await fetchAllRows(restUrl() + '?select=*&order=' + activeModule.dateField + '.desc');
  }
  async function insertRecord(record){
    const res = await fetch(restUrl(), { method:'POST', headers:{...HEADERS,'Prefer':'return=representation'}, body:JSON.stringify(record) });
    if(!res.ok) throw new Error('insert failed: ' + res.status + ' ' + await res.text());
    return (await res.json())[0];
  }
  async function updateRecord(id, record){
    const res = await fetch(restUrl() + '?id=eq.' + id, { method:'PATCH', headers:{...HEADERS,'Prefer':'return=representation'}, body:JSON.stringify(record) });
    if(!res.ok) throw new Error('update failed: ' + res.status + ' ' + await res.text());
    const data = await res.json();
    if(!data.length) throw new Error('ไม่พบรายการนี้แล้ว (อาจถูกลบไปก่อนหน้านี้) กรุณากดรีเฟรชแล้วลองใหม่');
    return data[0];
  }
  async function deleteRecord(id){
    const res = await fetch(restUrl() + '?id=eq.' + id, { method:'DELETE', headers: HEADERS });
    if(!res.ok) throw new Error('delete failed: ' + res.status);
  }
  // ---------- concrete report: structure-item master list + daily pour entries ----------
  let structureItemsCache = null;
  async function loadStructureItems(){
    if(structureItemsCache) return structureItemsCache;
    const res = await fetch(SUPABASE_URL + '/rest/v1/concrete_structure_items?select=*&is_active=eq.true&order=sort_order.asc', { headers: HEADERS });
    if(!res.ok) throw new Error('load structure items failed: ' + res.status);
    structureItemsCache = await res.json();
    return structureItemsCache;
  }
  const CONCRETE_FLOOR_OPTIONS = ['Basement','1st Floor','2nd Floor','3rd Floor','Roof'];
  async function fetchPourEntriesForReport(reportId){
    try{
      const res = await fetch(SUPABASE_URL + '/rest/v1/concrete_pour_entries?select=structure_item_id,floor,poured_today_m3&report_id=eq.' + reportId, { headers: HEADERS });
      if(!res.ok) throw new Error('fetch pour entries failed: ' + res.status);
      const data = await res.json();
      const map = {};
      data.forEach(d => { map[d.structure_item_id] = { volume: d.poured_today_m3, floor: d.floor }; });
      return map;
    }catch(e){ console.error(e); return {}; }
  }
  async function replacePourEntries(reportId, entries){
    // full replace on every save: avoids leaving a stale row behind when the Floor of an
    // existing entry is changed between edits (a different floor is a different unique key)
    const delRes = await fetch(SUPABASE_URL + '/rest/v1/concrete_pour_entries?report_id=eq.' + reportId, { method:'DELETE', headers: HEADERS });
    if(!delRes.ok) throw new Error('clear pour entries failed: ' + delRes.status);
    if(!entries.length) return;
    const payload = entries.map(e => ({ report_id: reportId, structure_item_id: e.structure_item_id, floor: e.floor, poured_today_m3: e.poured_today_m3 }));
    const res = await fetch(SUPABASE_URL + '/rest/v1/concrete_pour_entries', {
      method:'POST', headers:{ ...HEADERS, 'Prefer':'return=representation' }, body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('save pour entries failed: ' + res.status + ' ' + await res.text());
  }
  async function renderConcretePourSection(existingEntriesByItemId){
    const container = document.getElementById('concretePourSection');
    if(!container) return;
    if(activeModule.id !== 'concrete'){ container.innerHTML = ''; return; }
    container.innerHTML = '<div class="dash-empty" style="padding:10px 0;">กำลังโหลดรายการงาน...</div>';
    let items;
    try{ items = await loadStructureItems(); }
    catch(e){ container.innerHTML = '<div class="dash-empty">โหลดรายการงานไม่สำเร็จ: ' + escapeHtml(e.message) + '</div>'; return; }
    if(!items.length){ container.innerHTML = '<div class="dash-empty">ยังไม่มีรายการงาน (concrete_structure_items) กรุณาเพิ่มข้อมูลใน Supabase ก่อน</div>'; return; }
    const byLoc = {};
    items.forEach(it => { (byLoc[it.location] = byLoc[it.location] || []).push(it); });
    const entries = existingEntriesByItemId || {};
    container.innerHTML = `
      <div class="field" style="padding:0 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-end;gap:10px;">
        <label style="flex:1;">🧱 ปริมาณคอนกรีตที่เทวันนี้ ต่อรายการงาน (m³) — เลือกชั้นที่เท, เว้นว่างได้หากยังไม่เท</label>
        <button type="button" id="btnEditPlan" class="copy-prev-btn" style="flex:0 0 auto;white-space:nowrap;">📐 แก้ไขแผนงาน (Plan)</button>
      </div>
      <div style="padding:0 16px;">
        ${Object.keys(byLoc).map(loc => `
          <div class="tagcard">
            <div class="tag-head"><span class="num">${escapeHtml(loc)}</span></div>
            <div class="form-grid" style="padding:10px 14px;gap:8px;">
              ${byLoc[loc].map(it => {
                const ex = entries[it.id];
                const vol = ex && ex.volume != null ? ex.volume : '';
                const fl = ex && ex.floor ? ex.floor : CONCRETE_FLOOR_OPTIONS[0];
                return `
                <div class="list-row">
                  <input type="text" value="${escapeHtml(it.structure_name)}" disabled style="flex:2 1 auto;min-width:0;background:#F7F9FB;color:var(--muted);">
                  <select class="pour-floor" data-item-id="${it.id}" style="flex:0 0 112px;">
                    ${CONCRETE_FLOOR_OPTIONS.map(o=>`<option ${o===fl?'selected':''}>${escapeHtml(o)}</option>`).join('')}
                  </select>
                  <input type="number" step="any" class="pour-input" data-item-id="${it.id}" placeholder="m³" value="${vol}" style="flex:0 0 78px;">
                </div>`;
              }).join('')}
            </div>
          </div>`).join('')}
      </div>
    `;
    const editPlanBtn = document.getElementById('btnEditPlan');
    if(editPlanBtn) editPlanBtn.addEventListener('click', openPlanEditor);
  }

  // ---------- concrete report: edit plan_m3 (project plan quantity) per structure item ----------
  async function openPlanEditor(){
    structureItemsCache = null; // always re-fetch the latest plan values before editing
    let items;
    try{ items = await loadStructureItems(); }
    catch(e){ showToast('โหลดรายการงานไม่สำเร็จ: ' + e.message, true); return; }
    const byLoc = {};
    items.forEach(it => { (byLoc[it.location] = byLoc[it.location] || []).push(it); });
    const modal = $('#modalContent');
    modal.innerHTML = `
      <div class="modal-head"><h2>📐 แก้ไขแผนงาน (Plan) — ปริมาณรวมตามแผนทั้งโครงการ (m³)</h2><button class="modal-close" id="modalCloseBtn">&times;</button></div>
      <div class="form-grid">
        ${Object.keys(byLoc).map(loc => `
          <div class="tagcard">
            <div class="tag-head"><span class="num">${escapeHtml(loc)}</span></div>
            <div class="form-grid" style="padding:10px 14px;gap:8px;">
              ${byLoc[loc].map(it => `
                <div class="list-row">
                  <input type="text" value="${escapeHtml(it.structure_name)}" disabled style="flex:2 1 auto;min-width:0;background:#F7F9FB;color:var(--muted);">
                  <input type="number" step="any" min="0" class="plan-input" data-item-id="${it.id}" placeholder="Plan m³" value="${it.plan_m3 != null ? it.plan_m3 : ''}" style="flex:0 0 100px;">
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="btnSavePlan">บันทึกแผนงาน</button>
        <button class="btn btn-ghost" id="btnCancelPlan">ยกเลิก</button>
      </div>`;
    $('#modalBg').classList.add('show');
    $('#modalCloseBtn').addEventListener('click', closeModal);
    $('#btnCancelPlan').addEventListener('click', closeModal);
    $('#btnSavePlan').addEventListener('click', savePlanEditor);
  }
  async function savePlanEditor(){
    const btn = $('#btnSavePlan'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>กำลังบันทึก...';
    try{
      const inputs = Array.from(document.querySelectorAll('.plan-input'));
      for(const inp of inputs){
        const val = inp.value === '' ? null : Number(inp.value);
        const res = await fetch(SUPABASE_URL + '/rest/v1/concrete_structure_items?id=eq.' + inp.dataset.itemId, {
          method:'PATCH', headers:{ ...HEADERS, 'Prefer':'return=minimal' }, body: JSON.stringify({ plan_m3: val })
        });
        if(!res.ok) throw new Error('update plan failed: ' + res.status + ' ' + await res.text());
      }
      structureItemsCache = null; // force re-fetch next time it's needed
      closeModal();
      showToast('บันทึกแผนงานสำเร็จ');
      // preserve whatever the user had already typed into the pour form (not saved yet)
      // instead of wiping it when the pour section re-renders with the updated plan values
      const preserved = {};
      document.querySelectorAll('.pour-input').forEach(inp => {
        if(inp.value === '') return;
        const row = inp.closest('.list-row');
        const floorSel = row ? row.querySelector('.pour-floor') : null;
        preserved[inp.dataset.itemId] = { volume: inp.value, floor: floorSel ? floorSel.value : CONCRETE_FLOOR_OPTIONS[0] };
      });
      await renderConcretePourSection(preserved);
    }catch(e){
      console.error(e); showToast('บันทึกแผนงานไม่สำเร็จ: ' + e.message, true);
    }finally{
      btn.disabled = false; btn.textContent = 'บันทึกแผนงาน';
    }
  }

  async function uploadPhotoBlob(folderPrefix, blob, filename){
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = activeModule.id + '/' + folderPrefix + '/' + Date.now() + '_' + safeName;
    const res = await fetch(STORAGE_OBJ + path, { method:'POST', headers:{ 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+SUPABASE_KEY, 'Content-Type': blob.type||'image/jpeg' }, body: blob });
    if(!res.ok) throw new Error('upload failed: ' + res.status + ' ' + await res.text());
    return STORAGE_PUBLIC + path;
  }
  async function deleteStorageObjectByUrl(url){
    // Supabase Storage's single-object route (DELETE /object/{bucket}/{path})
    // returns 400 on this project's storage-api version -- deletes have to go
    // through the bucket-level bulk-remove route instead, with the path(s)
    // to remove listed in the JSON body.
    try{
      const path = url.split(STORAGE_PUBLIC)[1]; if(!path) return;
      const res = await fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET, {
        method: 'DELETE', headers: HEADERS, body: JSON.stringify({ prefixes: [path] })
      });
      if(!res.ok) console.warn('could not delete storage object', res.status, path, await res.text());
    }
    catch(e){ console.warn('could not delete storage object', e); }
  }
  async function uploadVpBlob(folderPrefix, blob, filename, contentType){
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = folderPrefix + '/' + Date.now() + '_' + safeName;
    const res = await fetch(STORAGE_OBJ + path, { method:'POST', headers:{ 'apikey':SUPABASE_KEY, 'Authorization':'Bearer '+SUPABASE_KEY, 'Content-Type': contentType || blob.type || 'application/octet-stream' }, body: blob });
    if(!res.ok) throw new Error('upload failed: ' + res.status + ' ' + await res.text());
    return STORAGE_PUBLIC + path;
  }
  if(window.pdfjsLib){ window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'; }
  // ---------- Visual Progress: shared legend-group helpers (used by both 2D and 3D boards) ----------
  // A plan's `legend` column holds either the old flat array format
  // (single implicit group, using the plan's own total_units) or the
  // newer { groups: [...] } format that supports several independent
  // status groups per plan (e.g. "ฐานราก" and "เสา" on the same drawing/model),
  // each with its own total_units and its own % สำเร็จ calculation.
  // Cumulative completion: a mark placed at a later step in a group's
  // ordered item list counts as "done" for every earlier step too (you can't
  // pour concrete before excavating). Returns the set of colors that should
  // count toward `item`'s own completion tally: item's own color plus every
  // item that comes after it in g.items (order = the order shown/edited in
  // the group card, top-to-bottom).
  function vpCumulativeColors(g, item){
    const items = (g && g.items) || [];
    const idx = items.indexOf(item);
    const from = idx === -1 ? [item] : items.slice(idx);
    return from.map(it=> it.color);
  }
  function legendGroupsOf(plan){
    const l = plan.legend;
    if(l && !Array.isArray(l) && Array.isArray(l.groups)){
      return l.groups.map(g=>({ id: g.id, name: g.name || '', total_units: (g.total_units != null && g.total_units !== '') ? g.total_units : null, items: (Array.isArray(g.items) ? g.items : []).map(vpNormalizeLegendItem) }));
    }
    const items = Array.isArray(l) ? l : [];
    return [{ id: '_default', name: plan.building_name || 'สถานะ', total_units: plan.total_units != null ? plan.total_units : null, items: items.map(vpNormalizeLegendItem) }];
  }
  // Legend items used to link only to a Sub Activity (BOQ) via `link_sub_activity_id`.
  // Now a status can link to either a Sub Activity (BOQ, fine detail) or a main
  // Activity (task_code, e.g. the whole "Pile Driving Work") directly — stored as
  // { link_level: 'sub_activity'|'activity', link_ref: <id or task_code as string> }.
  // Old saved items (plain `link_sub_activity_id`) are upgraded in memory on load;
  // no migration needed, and re-saving writes the new fields going forward.
  function vpNormalizeLegendItem(it){
    if(!it) return it;
    if(it.link_level && it.link_ref != null && it.link_ref !== '') return it;
    if(it.link_sub_activity_id != null && it.link_sub_activity_id !== ''){
      return Object.assign({}, it, { link_level: 'sub_activity', link_ref: String(it.link_sub_activity_id) });
    }
    return it;
  }
  // Combines Sub Activities (BOQ leaf items) and main Activities (whole tasks)
  // into one searchable option list for the link combobox in the plan editor —
  // lets a status link to either level from the same search box.
  function vpLinkOptionsFrom(subActsForLink, mainActsForLink){
    const subOpts = (subActsForLink||[]).map(s=>({ level:'sub_activity', ref: String(s.id), label: '📋 ' + (s.task_code||'') + ' — ' + (s.name||''), search: ((s.task_code||'') + ' ' + (s.name||'')).toLowerCase() }));
    const actOpts = (mainActsForLink||[]).map(a=>({ level:'activity', ref: String(a.task_code), label: '🏗️ ' + a.task_code + ' — ' + (a.task_name||''), search: (a.task_code + ' ' + (a.task_name||'')).toLowerCase() }));
    return actOpts.concat(subOpts);
  }
  function vpLinkLabelFor(level, ref, linkOptions){
    if(!level || ref == null || ref === '') return '';
    const opt = (linkOptions||[]).find(o=>o.level===level && String(o.ref)===String(ref));
    return opt ? opt.label : ('(ลิงก์ไว้แล้ว แต่ไม่พบรายการ: ' + ref + ')');
  }
  function vpGroupCardHtml(g, linkOptions){
    function linkComboHtml(rowId, level, ref){
      const label = vpLinkLabelFor(level, ref, linkOptions);
      return `<div class="vp-link-combo" data-gid="${g._gid}" data-row="${rowId}" style="flex:1 1 240px;">
        <input type="text" class="vp-link-combo-input" value="${escapeHtml(label)}" placeholder="พิมพ์ค้นหา Activity หลัก หรือ Sub Activity (BOQ)..." autocomplete="off" title="ลิงก์สถานะนี้กับ Activity หลัก หรือ Sub Activity (BOQ) — เมื่อบันทึกจะอัปเดต % ให้ตรงกับ Progress อัตโนมัติ" style="width:100%;font-size:11.5px;">
        <button type="button" class="vp-link-combo-clear" title="ล้างลิงก์นี้" tabindex="-1">&times;</button>
        <input type="hidden" class="vp-link-combo-level" value="${level||''}">
        <input type="hidden" class="vp-link-combo-ref" value="${ref||''}">
        <div class="vp-link-combo-list" hidden></div>
      </div>`;
    }
    return `<div class="vp-group-card" data-gid="${g._gid}" style="border:1px solid var(--line);border-radius:8px;padding:10px;margin-bottom:10px;background:#FAFBFC;">
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <input type="text" class="vp-group-name" data-gid="${g._gid}" value="${escapeHtml(g.name||'')}" placeholder="ชื่อ Group เช่น ฐานราก, เสา" style="flex:1 1 160px;">
        <input type="number" class="vp-group-total" data-gid="${g._gid}" value="${g.total_units!=null?g.total_units:''}" placeholder="จำนวนทั้งหมดของ Group นี้" style="flex:0 0 190px;">
        ${'REMOVE_BTN_PLACEHOLDER'}
      </div>
      <div id="vpGroupRows-${g._gid}">
        ${g.rows.map(it=>`<div class="list-row" data-gid="${g._gid}" data-row="${it._id}" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap;">
          <input type="color" class="vp-legend-color" value="${it.color}" style="width:40px;height:34px;padding:2px;flex:0 0 auto;">
          <input type="text" class="vp-legend-label" value="${escapeHtml(it.label)}" placeholder="ชื่อสถานะ" style="flex:1 1 140px;">
          <label style="display:flex;align-items:center;gap:4px;font-size:11.5px;white-space:nowrap;"><input type="checkbox" class="vp-legend-completion" ${it.is_completion?'checked':''}> % สำเร็จ</label>
          ${linkComboHtml(it._id, it.link_level, it.link_ref)}
          <div style="display:flex;flex-direction:column;flex:0 0 auto;">
            <button type="button" class="vp-row-up" data-gid="${g._gid}" data-row="${it._id}" title="เลื่อนขึ้น (ลำดับสะสมก่อนหน้า)" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;line-height:1;padding:1px 4px;">▲</button>
            <button type="button" class="vp-row-down" data-gid="${g._gid}" data-row="${it._id}" title="เลื่อนลง (ลำดับสะสมถัดไป)" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;line-height:1;padding:1px 4px;">▼</button>
          </div>
          <button type="button" class="vp-rm-row" data-gid="${g._gid}" data-row="${it._id}" style="flex:0 0 auto;background:none;border:none;color:var(--danger);font-size:18px;cursor:pointer;">&times;</button>
        </div>`).join('')}
      </div>
      <button type="button" class="btn btn-ghost vp-add-row" data-gid="${g._gid}" style="margin-top:4px;">+ เพิ่มสถานะ</button>
    </div>`;
  }
  function wireVpGroupsEditor(modal, state){
    // state = { groups, nextGid, linkOptions }
    function syncGroupsFromDom(){
      state.groups.forEach(g=>{
        const nameEl = modal.querySelector('.vp-group-name[data-gid="' + g._gid + '"]');
        const totEl = modal.querySelector('.vp-group-total[data-gid="' + g._gid + '"]');
        if(nameEl) g.name = nameEl.value;
        if(totEl) g.total_units = totEl.value;
        const rowEls = modal.querySelectorAll('.list-row[data-gid="' + g._gid + '"]');
        if(rowEls.length){
          const newRows = [];
          rowEls.forEach(rowEl=>{
            const levelEl = rowEl.querySelector('.vp-link-combo-level');
            const refEl = rowEl.querySelector('.vp-link-combo-ref');
            newRows.push({
              _id: Number(rowEl.dataset.row),
              label: rowEl.querySelector('.vp-legend-label').value,
              color: rowEl.querySelector('.vp-legend-color').value,
              is_completion: rowEl.querySelector('.vp-legend-completion').checked,
              link_level: (levelEl && levelEl.value) ? levelEl.value : null,
              link_ref: (refEl && refEl.value) ? refEl.value : null,
            });
          });
          g.rows = newRows;
        }
      });
    }
    function renderGroups(){
      const html = state.groups.map(g=>{
        let card = vpGroupCardHtml(g, state.linkOptions);
        const removeBtn = state.groups.length > 1 ? `<button type="button" class="vp-rm-group" data-gid="${g._gid}" style="flex:0 0 auto;background:none;border:1px solid var(--danger);color:var(--danger);border-radius:6px;padding:4px 10px;cursor:pointer;">🗑️ ลบ Group</button>` : '';
        return card.replace('REMOVE_BTN_PLACEHOLDER', removeBtn);
      }).join('') + `<button type="button" class="btn btn-ghost" id="vpAddGroupBtn">➕ เพิ่ม Group ใหม่</button>`;
      modal.querySelector('#vpGroupsWrap').innerHTML = html;
      modal.querySelectorAll('.vp-rm-row').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          syncGroupsFromDom();
          const gid = Number(btn.dataset.gid), rid = Number(btn.dataset.row);
          const g = state.groups.find(x=>x._gid===gid);
          if(g) g.rows = g.rows.filter(r=>r._id!==rid);
          renderGroups();
        });
      });
      modal.querySelectorAll('.vp-row-up').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          syncGroupsFromDom();
          const gid = Number(btn.dataset.gid), rid = Number(btn.dataset.row);
          const g = state.groups.find(x=>x._gid===gid);
          if(g){
            const i = g.rows.findIndex(r=>r._id===rid);
            if(i > 0){ const tmp = g.rows[i-1]; g.rows[i-1] = g.rows[i]; g.rows[i] = tmp; }
          }
          renderGroups();
        });
      });
      modal.querySelectorAll('.vp-row-down').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          syncGroupsFromDom();
          const gid = Number(btn.dataset.gid), rid = Number(btn.dataset.row);
          const g = state.groups.find(x=>x._gid===gid);
          if(g){
            const i = g.rows.findIndex(r=>r._id===rid);
            if(i !== -1 && i < g.rows.length - 1){ const tmp = g.rows[i+1]; g.rows[i+1] = g.rows[i]; g.rows[i] = tmp; }
          }
          renderGroups();
        });
      });
      modal.querySelectorAll('.vp-add-row').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          syncGroupsFromDom();
          const gid = Number(btn.dataset.gid);
          const g = state.groups.find(x=>x._gid===gid);
          if(g) g.rows.push({ label:'', color:'#999999', is_completion:false, link_level:null, link_ref:null, _id: g.nextRowId++ });
          renderGroups();
        });
      });
      modal.querySelectorAll('.vp-rm-group').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          syncGroupsFromDom();
          const gid = Number(btn.dataset.gid);
          state.groups = state.groups.filter(g=>g._gid!==gid);
          renderGroups();
        });
      });
      const addGroupBtn = document.getElementById('vpAddGroupBtn');
      if(addGroupBtn) addGroupBtn.addEventListener('click', ()=>{
        syncGroupsFromDom();
        state.groups.push({ _gid: state.nextGid++, id: null, name:'', total_units:null, rows:[{label:'',color:'#999999',is_completion:false,link_level:null,link_ref:null,_id:0}], nextRowId:1 });
        renderGroups();
      });
      // Searchable combobox for linking a status to an Activity or Sub Activity
      // (BOQ) — typing filters state.linkOptions by code/name across both
      // levels at once; clicking a result fills the hidden level/ref fields
      // read back in syncGroupsFromDom(). Rebuilt fresh on every renderGroups()
      // call since the whole panel's innerHTML is replaced each time.
      function closeAllLinkLists(){
        modal.querySelectorAll('.vp-link-combo-list').forEach(el=>{ el.hidden = true; el.innerHTML = ''; });
      }
      modal.querySelectorAll('.vp-link-combo-input').forEach(input=>{
        const wrap = input.closest('.vp-link-combo');
        const listEl = wrap.querySelector('.vp-link-combo-list');
        const levelEl = wrap.querySelector('.vp-link-combo-level');
        const refEl = wrap.querySelector('.vp-link-combo-ref');
        function showResults(forceAll){
          const q = forceAll ? '' : input.value.trim().toLowerCase();
          const opts = state.linkOptions || [];
          const matches = (q ? opts.filter(o=>o.search.includes(q)) : opts).slice(0, 40);
          if(!matches.length){
            listEl.innerHTML = '<div class="vp-link-combo-empty">ไม่พบรายการที่ตรงกับ "' + escapeHtml(input.value) + '"</div>';
          } else {
            listEl.innerHTML = matches.map(o=>`<div class="vp-link-combo-item" data-level="${o.level}" data-ref="${escapeHtml(String(o.ref))}">${escapeHtml(o.label)}</div>`).join('')
              + (opts.length > matches.length ? `<div class="vp-link-combo-hint">พิมพ์เพื่อกรองผลลัพธ์ (ทั้งหมด ${opts.length} รายการ)</div>` : '');
          }
          listEl.hidden = false;
          listEl.querySelectorAll('.vp-link-combo-item').forEach(item=>{
            item.addEventListener('mousedown', (e)=>{
              e.preventDefault();
              levelEl.value = item.dataset.level;
              refEl.value = item.dataset.ref;
              input.value = item.textContent;
              listEl.hidden = true;
            });
          });
        }
        input.addEventListener('focus', ()=>{ closeAllLinkLists(); input.select(); showResults(true); });
        input.addEventListener('input', ()=> showResults(false));
        input.addEventListener('blur', ()=>{ setTimeout(()=>{ listEl.hidden = true; }, 150); });
        input.addEventListener('keydown', (e)=>{
          if(e.key === 'Escape'){ input.blur(); }
          if(e.key === 'Backspace' && !input.value){ levelEl.value = ''; refEl.value = ''; }
        });
        const clearBtn = wrap.querySelector('.vp-link-combo-clear');
        if(clearBtn){
          clearBtn.addEventListener('mousedown', (e)=>{ e.preventDefault(); });
          clearBtn.addEventListener('click', (e)=>{
            e.preventDefault();
            levelEl.value = ''; refEl.value = ''; input.value = '';
            listEl.hidden = true; listEl.innerHTML = '';
          });
        }
      });
    }
    renderGroups();
    return { syncGroupsFromDom, getGroups: ()=> state.groups };
  }
  function buildLegendGroupsPayload(groups){
    return groups.map(g=>({
      id: g.id || ('g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7)),
      name: (g.name||'').trim(),
      total_units: g.total_units ? Number(g.total_units) : null,
      items: g.rows.map(r=>({ label:(r.label||'').trim(), color:r.color, is_completion:!!r.is_completion, link_level: r.link_level || null, link_ref: r.link_ref || null })).filter(it=>it.label),
    })).filter(g=>g.items.length);
  }
  // Pushes each linked status's live progress (count of marks of that status
  // within its group, divided by the group's total_units) into whichever BOQ
  // level it's linked to:
  //  - 'sub_activity' -> project_schedule_sub_activities: %POC (poc_manual)
  //    and Actual BOQ (recalculated from that row's own Estimate BOQ) are set.
  //  - 'activity' -> project_schedule_activities: the Activity's own
  //    progress_pct (and derived status_code) are set directly — for linking
  //    straight to a whole task (e.g. "Pile Driving Work") rather than one of
  //    its BOQ line items.
  // Called once after a successful save (not on every click) to avoid
  // hammering the API while marking. countFn(groupId, color) must return the
  // number of marks of that status.
  async function vpSyncGroupsToBOQ(groups, countFn, subActsForLink, mainActsForLink){
    const subById = new Map((subActsForLink||[]).map(s=> [String(s.id), s]));
    const actByCode = new Map((mainActsForLink||[]).map(a=> [String(a.task_code), a]));
    const jobs = [];
    let synced = 0, failed = 0;
    const unmatched = [];
    const noTotal = [];
    console.log('[vpSyncGroupsToBOQ] groups:', JSON.parse(JSON.stringify(groups)));
    groups.forEach(g=>{
      const linkedItems = (g.items||[]).filter(item=> item.link_level && item.link_ref != null && item.link_ref !== '');
      if(!linkedItems.length) return;
      if(!g.total_units){ noTotal.push(g.name || g.id || '(ไม่มีชื่อ Group)'); return; }
      linkedItems.forEach(item=>{
        const cnt = countFn(g.id, vpCumulativeColors(g, item));
        const pct = Math.max(0, Math.min(100, Math.round((cnt / g.total_units) * 10000) / 100));
        console.log('[vpSyncGroupsToBOQ] item', item.label, 'level', item.link_level, 'ref', item.link_ref, 'cnt', cnt, 'pct', pct);
        if(item.link_level === 'sub_activity'){
          const sa = subById.get(String(item.link_ref));
          if(!sa){ unmatched.push((item.label||'สถานะ') + ' → Sub Activity id ' + item.link_ref); return; }
          const est = Number(sa.estimate_boq) || 0;
          const actualBoq = Math.round(est * pct) / 100;
          jobs.push(
            fetch(SUPABASE_URL + '/rest/v1/project_schedule_sub_activities?id=eq.' + encodeURIComponent(sa.id), {
              method: 'PATCH', headers: { ...HEADERS, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ poc_manual: pct, actual_boq: actualBoq, updated_at: new Date().toISOString() })
            }).then(res=>{
              if(res.ok){ synced++; sa.poc_manual = pct; sa.actual_boq = actualBoq; }
              else { failed++; console.error('vpSyncGroupsToBOQ: sub_activity PATCH failed', res.status, sa.id); }
            }).catch((e)=>{ failed++; console.error('vpSyncGroupsToBOQ: sub_activity PATCH error', e); })
          );
        } else if(item.link_level === 'activity'){
          const act = actByCode.get(String(item.link_ref));
          if(!act){ unmatched.push((item.label||'สถานะ') + ' → Activity ' + item.link_ref); return; }
          const statusCode = pct <= 0 ? 'Not Started' : (pct >= 100 ? 'Completed' : 'In Progress');
          jobs.push(
            fetch(SUPABASE_URL + '/rest/v1/project_schedule_activities?task_code=eq.' + encodeURIComponent(act.task_code), {
              method: 'PATCH', headers: { ...HEADERS, 'Prefer': 'return=minimal' },
              body: JSON.stringify({ progress_pct: pct, status_code: statusCode, updated_at: new Date().toISOString() })
            }).then(res=>{
              if(res.ok){ synced++; act.progress_pct = pct; act.status_code = statusCode; }
              else { failed++; console.error('vpSyncGroupsToBOQ: activity PATCH failed', res.status, act.task_code); }
            }).catch((e)=>{ failed++; console.error('vpSyncGroupsToBOQ: activity PATCH error', e); })
          );
        }
      });
    });
    if(!jobs.length) return { synced: 0, failed: 0, unmatched, noTotal };
    await Promise.all(jobs);
    return { synced, failed, unmatched, noTotal };
  }

  // ---------- Visual Progress board: shared canvas/pdf helpers ----------
  const VP_DEFAULT_SQUARE_SIZE = 0.026;
  const VP_DEFAULT_LINE_WIDTH = 0.006;
  function vpShapeSquareSizePx(base, shape){ return Math.max(10, base.w * ((shape && shape.size) || VP_DEFAULT_SQUARE_SIZE)); }
  function vpShapeLineWidthPx(base, shape){ return Math.max(2, base.w * ((shape && shape.size) || VP_DEFAULT_LINE_WIDTH)); }
  function vpShapeAreaBorderWidthPx(base, shape){ return Math.max(2, base.w * ((shape && shape.size) || VP_DEFAULT_LINE_WIDTH)); }
  function vpPointToSegDist(px,py,x1,y1,x2,y2){
    const dx = x2-x1, dy = y2-y1;
    const lenSq = dx*dx+dy*dy;
    let t = lenSq ? ((px-x1)*dx + (py-y1)*dy)/lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t*dx, cy = y1 + t*dy;
    return Math.hypot(px-cx, py-cy);
  }
  function vpNormalizeRect(x1,y1,x2,y2){
    const x = Math.max(0, Math.min(1, Math.min(x1,x2)));
    const y = Math.max(0, Math.min(1, Math.min(y1,y2)));
    const x2c = Math.max(0, Math.min(1, Math.max(x1,x2)));
    const y2c = Math.max(0, Math.min(1, Math.max(y1,y2)));
    return { x, y, w: x2c - x, h: y2c - y };
  }
  function vpHexToRgba(hex, alpha){
    const h = (hex || '#999999').replace('#','');
    const full = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
    const r = parseInt(full.substring(0,2),16) || 0;
    const g = parseInt(full.substring(2,4),16) || 0;
    const b = parseInt(full.substring(4,6),16) || 0;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
  // Cache the decoded plan image/PDF page per (plan id + file url) so switching
  // legend/erase/shape-type/size — every one of which used to re-render the whole
  // panel and re-decode the PDF/image from scratch on every single click — reuses
  // the already-decoded canvas instead. Keyed by file_url too so editing a plan's
  // file (new PDF/image upload) naturally busts the cache for that plan.
  const vpPlanImageCache = new Map();
  function vpLoadPlanImage(plan){
    const key = plan.id + '::' + plan.file_url;
    if(vpPlanImageCache.has(key)) return vpPlanImageCache.get(key);
    const promise = (async ()=>{
      if(plan.file_type === 'pdf'){
        if(!window.pdfjsLib) throw new Error('pdf.js โหลดไม่สำเร็จ');
        const pdf = await window.pdfjsLib.getDocument(plan.file_url).promise;
        const page = await pdf.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const targetW = 1700;
        const scale = targetW / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const off = document.createElement('canvas');
        off.width = Math.round(viewport.width); off.height = Math.round(viewport.height);
        await page.render({ canvasContext: off.getContext('2d'), viewport }).promise;
        return { canvas: off, w: off.width, h: off.height };
      }
      const img = await new Promise((resolve, reject)=>{
        const im = new Image(); im.crossOrigin = 'anonymous';
        im.onload = ()=>resolve(im); im.onerror = ()=>reject(new Error('โหลดรูปไม่สำเร็จ'));
        im.src = plan.file_url;
      });
      return { canvas: img, w: img.naturalWidth, h: img.naturalHeight };
    })();
    vpPlanImageCache.set(key, promise);
    promise.catch(()=>{ vpPlanImageCache.delete(key); });
    return promise;
  }
  function vpDrawCanvas(canvas, base, shapes, draft){
    const ctx = canvas.getContext('2d');
    canvas.width = base.w; canvas.height = base.h;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(base.canvas, 0, 0, base.w, base.h);
    function drawOne(m, dashed){
      ctx.strokeStyle = m.color;
      ctx.setLineDash(dashed ? [4,3] : []);
      if(m.type === 'line'){
        const lw = vpShapeLineWidthPx(base, m);
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(m.x1*base.w, m.y1*base.h);
        ctx.lineTo(m.x2*base.w, m.y2*base.h);
        ctx.stroke();
      } else if(m.type === 'area'){
        const aw = m.w*base.w, ah = m.h*base.h;
        const ax = m.x*base.w, ay = m.y*base.h;
        ctx.fillStyle = vpHexToRgba(m.color, 0.28);
        ctx.fillRect(ax, ay, aw, ah);
        ctx.lineWidth = vpShapeAreaBorderWidthPx(base, m);
        ctx.strokeRect(ax, ay, aw, ah);
      } else {
        const sz = vpShapeSquareSizePx(base, m);
        ctx.lineWidth = Math.max(2, sz*0.14);
        const cx = m.x*base.w, cy = m.y*base.h;
        ctx.strokeRect(cx - sz/2, cy - sz/2, sz, sz);
      }
    }
    shapes.forEach(m=>drawOne(m, false));
    if(draft) drawOne(draft, true);
    ctx.setLineDash([]);
  }
  function vpHitTest(shapes, base, relX, relY){
    const px = relX*base.w, py = relY*base.h;
    for(let i = shapes.length - 1; i >= 0; i--){
      const m = shapes[i];
      if(m.type === 'line'){
        const lw = vpShapeLineWidthPx(base, m);
        const d = vpPointToSegDist(px, py, m.x1*base.w, m.y1*base.h, m.x2*base.w, m.y2*base.h);
        if(d <= Math.max(10, lw*1.5)) return i;
      } else if(m.type === 'area'){
        const ax = m.x*base.w, ay = m.y*base.h, aw = m.w*base.w, ah = m.h*base.h;
        if(px >= ax && px <= ax+aw && py >= ay && py <= ay+ah) return i;
      } else {
        const sz = vpShapeSquareSizePx(base, m);
        const cx = m.x*base.w, cy = m.y*base.h;
        if(Math.abs(px-cx) <= sz*0.7 && Math.abs(py-cy) <= sz*0.7) return i;
      }
    }
    return -1;
  }
  // ---------- Visual Progress 3D board: Three.js helpers ----------
  let __vpThreePromise = null;
  function vpEnsureThree(){
    if(__vpThreePromise) return __vpThreePromise;
    __vpThreePromise = (async ()=>{
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
      const { GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');
      const { OrbitControls } = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js');
      return { THREE, GLTFLoader, OrbitControls };
    })();
    return __vpThreePromise;
  }
  function vp3dFrameCamera(THREE, camera, controls, root, aspect){
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    camera.up.set(0,1,0);
    camera.position.set(center.x + maxDim, center.y + maxDim*0.7, center.z + maxDim);
    camera.near = Math.max(maxDim/1000, 0.001); camera.far = maxDim*100;
    if(camera.isOrthographicCamera){
      const asp = aspect || ((camera.right - camera.left) / (camera.top - camera.bottom)) || 1;
      const viewHeight = maxDim * 1.8;
      const viewWidth = viewHeight * asp;
      camera.left = -viewWidth/2; camera.right = viewWidth/2; camera.top = viewHeight/2; camera.bottom = -viewHeight/2;
    }
    camera.updateProjectionMatrix();
    controls.target.copy(center); controls.update();
  }
  function vp3dCollectNodes(root){
    // NOTE: SketchUp glTF exporters commonly produce nested named wrappers around
    // a single part, e.g. a named Group "C1" that itself contains one child mesh
    // node also named (e.g. "Geom3D_C1" from another export pipeline). If we just
    // picked "every named node that contains a mesh", both the group AND its inner
    // mesh node would show up as two separate rows for the exact same physical
    // part (seen in real testing). We instead resolve, bottom-up, exactly one
    // representative node per distinct physical part:
    //  - a named node whose subtree contains NO other named+mesh-bearing node is a
    //    genuine leaf part -> keep it.
    //  - a named node that wraps exactly ONE such nested node is just a duplicate
    //    wrapper around the same single part -> keep the OUTER node (its name is
    //    normally the meaningful SketchUp Group/Component name) and drop the inner
    //    duplicate.
    //  - a named node that wraps MORE THAN ONE such nested node is an assembly of
    //    multiple distinct parts (e.g. a top-level "Assembly-5" container) -> drop
    //    the wrapper itself and use its nested parts individually instead.
    // Also: some exporters (e.g. SimLab) give EVERY leaf geometry node the exact
    // same generic name (seen in a real export: every part named "Geom3D_"). If we
    // keyed purely by obj.name, duplicate-named parts would collide into one entry
    // (only the first found would be trackable/paintable). So after resolving the
    // final one-node-per-part list, disambiguate repeated raw names by order and
    // stamp the resolved key directly on the object (userData.__vp3dKey) so
    // raycasting/click-picking can resolve the exact instance clicked.
    function hasMeshDescendant(obj){
      let found = false;
      obj.traverse(c=>{ if(c.isMesh) found = true; });
      return found;
    }
    function collectParts(obj){
      let childParts = [];
      obj.children.forEach(child=>{ childParts = childParts.concat(collectParts(child)); });
      if(obj.name && hasMeshDescendant(obj)){
        if(childParts.length <= 1) return [obj];
        return childParts;
      }
      return childParts;
    }
    const parts = collectParts(root);
    const map = new Map();
    const nameCounts = {};
    parts.forEach(obj=>{
      const n = (nameCounts[obj.name] = (nameCounts[obj.name] || 0) + 1);
      const key = n === 1 ? obj.name : (obj.name + ' (' + n + ')');
      obj.userData.__vp3dKey = key;
      map.set(key, obj);
    });
    return map;
  }
  function vp3dColorNode(node, colorHex){
    node.traverse(child=>{
      if(!child.isMesh) return;
      if(!child.userData.__vpMatClone){
        child.material = Array.isArray(child.material) ? child.material.map(m=>m.clone()) : child.material.clone();
        child.userData.__vpMatClone = true;
      }
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(m=>{
        if('emissive' in m){ m.emissive.setStyle(colorHex); m.emissiveIntensity = 0.75; }
        else if('color' in m){ m.color.setStyle(colorHex); }
      });
    });
  }
  function vp3dClearNode(node){
    node.traverse(child=>{
      if(!child.isMesh || !child.userData.__vpMatClone) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(m=>{ if('emissive' in m){ m.emissive.setStyle('#000000'); m.emissiveIntensity = 0; } });
    });
  }
  function nextFindingNumber(dateISO){
    const year = (dateISO || todayISO()).slice(0,4);
    const countThisYear = rows.filter(f => f.finding_number && f.finding_number.includes('-' + year + '-')).length;
    return 'F-' + year + '-' + String(countThisYear + 1).padStart(3, '0');
  }

  // ---------- image compression ----------
  function fileToCompressedBlob(file, maxDim, quality){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read failed'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('decode failed'));
        img.onload = () => {
          let { width, height } = img;
          if(width > maxDim || height > maxDim){
            if(width > height){ height = Math.round(height*maxDim/width); width = maxDim; } else { width = Math.round(width*maxDim/height); height = maxDim; }
          }
          const canvas = document.createElement('canvas'); canvas.width=width; canvas.height=height;
          canvas.getContext('2d').drawImage(img,0,0,width,height);
          canvas.toBlob((blob)=> blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  async function handleFileSelect(fileList){
    const status = $('#photoStatus'); status.textContent = 'กำลังประมวลผลรูปภาพ...';
    for(const file of Array.from(fileList)){
      try{ const blob = await fileToCompressedBlob(file, 1280, 0.72); const previewUrl = URL.createObjectURL(blob);
        pendingPhotos.push({ id: uid(), name: file.name, blob, previewUrl, isExisting:false });
      }catch(e){ console.error(e); }
    }
    status.textContent = pendingPhotos.length ? (pendingPhotos.length + ' รูป พร้อมบันทึก') : '';
    renderPhotoGrid();
  }
  function renderPhotoGrid(){
    const grid = $('#photoGrid');
    grid.innerHTML = pendingPhotos.map(p => `
      <div class="photo-thumb" data-id="${p.id}">
        <img src="${p.isExisting ? p.url : p.previewUrl}" data-full="${p.isExisting ? p.url : p.previewUrl}">
        ${!p.isExisting ? '<span class="up-badge">ใหม่</span>' : ''}
        <button class="rm" data-id="${p.id}">&times;</button>
      </div>`).join('');
    grid.querySelectorAll('img').forEach(img => img.addEventListener('click', ()=> openLightbox(img.dataset.full, img)));
    grid.querySelectorAll('.rm').forEach(btn => btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const p = pendingPhotos.find(x => x.id === btn.dataset.id);
      if(p && p.isExisting) removedExistingUrls.push(p.url);
      pendingPhotos = pendingPhotos.filter(x => x.id !== btn.dataset.id);
      renderPhotoGrid();
      $('#photoStatus').textContent = pendingPhotos.length ? (pendingPhotos.length + ' รูป พร้อมบันทึก') : '';
    }));
  }
  $('#f_photoInput').addEventListener('change', (e)=>{ if(e.target.files && e.target.files.length){ handleFileSelect(e.target.files); e.target.value=''; } });
  let lbGallery = [];
  let lbIndex = 0;
  function showLbImage(){
    $('#lbImg').src = lbGallery[lbIndex] || '';
    const nav = lbGallery.length > 1;
    $('#lbPrev').style.display = nav ? 'flex' : 'none';
    $('#lbNext').style.display = nav ? 'flex' : 'none';
    $('#lbCounter').textContent = nav ? (lbIndex+1) + ' / ' + lbGallery.length : '';
  }
  function lbNext(){ if(!lbGallery.length) return; lbIndex = (lbIndex+1) % lbGallery.length; showLbImage(); }
  function lbPrev(){ if(!lbGallery.length) return; lbIndex = (lbIndex-1+lbGallery.length) % lbGallery.length; showLbImage(); }
  function openLightbox(src, imgEl){
    if(imgEl){
      const container = imgEl.closest('.photo-grid');
      const imgs = container ? Array.from(container.querySelectorAll('img[data-full]')) : [imgEl];
      lbGallery = imgs.map(im => im.dataset.full || im.src);
      lbIndex = imgs.indexOf(imgEl);
      if(lbIndex < 0) lbIndex = 0;
    } else {
      lbGallery = [src];
      lbIndex = 0;
    }
    showLbImage();
    $('#lightbox').classList.add('show');
  }
  $('#lbClose').addEventListener('click', ()=> $('#lightbox').classList.remove('show'));
  $('#lbNext').addEventListener('click', (e)=>{ e.stopPropagation(); lbNext(); });
  $('#lbPrev').addEventListener('click', (e)=>{ e.stopPropagation(); lbPrev(); });
  $('#lightbox').addEventListener('click', (e)=>{ if(e.target.id === 'lightbox') $('#lightbox').classList.remove('show'); });
  document.addEventListener('keydown', (e)=>{
    if(!$('#lightbox').classList.contains('show')) return;
    if(e.key === 'ArrowRight') lbNext();
    else if(e.key === 'ArrowLeft') lbPrev();
    else if(e.key === 'Escape') $('#lightbox').classList.remove('show');
  });

  // ---------- sidebar navigation (Report / Dashboard, separated) ----------
  function navBtnHtml(m){
    return `<button class="nav-btn ${m.id===activeModule.id?'active':''}" data-id="${m.id}" title="${escapeHtml(m.label)}"><span class="ic">${m.icon}</span><span class="lbl">${escapeHtml(m.label)}</span></button>`;
  }
  function renderModuleRow(){
    $('#navReports').innerHTML = MODULES.map(navBtnHtml).join('') + CUSTOM_REPORTS.map(navBtnHtml).join('');
    $('#navDashboards').innerHTML = DASHBOARDS.map(navBtnHtml).join('');
    $$('.nav-btn').forEach(btn => btn.addEventListener('click', ()=>{
      switchModule(btn.dataset.id);
      if(window.innerWidth <= 760) setSidebarCollapsed(true);
    }));
  }
  async function switchModule(id){
    const isDash = id.startsWith('dash_');
    const custom = CUSTOM_REPORTS.find(c => c.id === id);
    if(isDash){
      const dash = DASHBOARDS.find(d => d.id === id);
      activeModule = dash;
      renderModuleRow();
      $('.tabs').style.display = 'none';
      $('#panel-form').hidden = true;
      $('#panel-list').hidden = true;
      $('#panel-custom').hidden = true;
      $('#panel-dashboard').hidden = false;
      $('.main').classList.add('wide');
      $('#statRow').innerHTML = '';
      await dash.render($('#dashboardContent'));
      return;
    }
    if(custom){
      activeModule = custom;
      renderModuleRow();
      $('.tabs').style.display = 'none';
      $('#panel-form').hidden = true;
      $('#panel-list').hidden = true;
      $('#panel-dashboard').hidden = true;
      $('#panel-custom').hidden = false;
      $('.main').classList.add('wide');
      $('#statRow').innerHTML = '';
      await custom.render($('#customContent'));
      return;
    }
    $('.tabs').style.display = '';
    $('#panel-dashboard').hidden = true;
    $('#panel-custom').hidden = true;
    $('.main').classList.remove('wide');
    activeModule = MODULES.find(m => m.id === id) || MODULES[0];
    currentFilterStatus = 'all'; currentSearch = ''; $('#searchBox').value = '';
    renderModuleRow();
    renderFilterRow();
    $('#tabPendingPiles').style.display = (activeModule.id === 'piling' || activeModule.id === 'piling_design') ? '' : 'none';
    $('#tabBulkAssign').style.display = (activeModule.id === 'piling' || activeModule.id === 'piling_design') ? '' : 'none';
    $('#btnPileMapJump').style.display = (activeModule.id === 'piling') ? '' : 'none';
    clearForm();
    switchTab('form');
    await refreshAndRender();
  }
  // ---------- sidebar collapse/expand toggle (persists per-browser) ----------
  function setSidebarCollapsed(collapsed){
    $('#sidebar').classList.toggle('collapsed', collapsed);
    const bd = document.getElementById('sidebarBackdrop');
    if(bd) bd.classList.toggle('show', !collapsed && window.innerWidth <= 760);
    try{ localStorage.setItem('srh_sidebar_collapsed', collapsed ? '1' : '0'); }catch(e){}
  }
  $('#btnSidebarToggle').addEventListener('click', ()=>{
    setSidebarCollapsed(!$('#sidebar').classList.contains('collapsed'));
  });
  { const bd = document.getElementById('sidebarBackdrop'); if(bd) bd.addEventListener('click', ()=> setSidebarCollapsed(true)); }
  (function initSidebar(){
    let saved = null;
    try{ saved = localStorage.getItem('srh_sidebar_collapsed'); }catch(e){}
    if(saved === null){ saved = (window.innerWidth < 760) ? '1' : '0'; }
    setSidebarCollapsed(saved === '1');
  })();
  function renderFilterRow(){
    let html = '<button class="chip active" data-status="all">ทั้งหมด</button>';
    if(activeModule.statusFilterField){
      html += activeModule.statusFilterOptions.map(o => `<button class="chip" data-status="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join('');
    }
    $('#filterRow').innerHTML = html;
    $$('.chip').forEach(c => c.addEventListener('click', (e)=>{
      $$('.chip').forEach(x=>x.classList.remove('active')); e.target.classList.add('active');
      currentFilterStatus = e.target.dataset.status; renderList();
    }));
  }

  // ---------- layout helper ----------
  function chunkFieldsForLayout(fields){
    const rowsOut = []; let i = 0; const shortTypes = ['select','date','time','text'];
    while(i < fields.length){
      const f = fields[i];
      if(shortTypes.includes(f.type) && i+1 < fields.length && shortTypes.includes(fields[i+1].type)){ rowsOut.push([f, fields[i+1]]); i += 2; }
      else { rowsOut.push([f]); i += 1; }
    }
    return rowsOut;
  }
  function renderFieldInput(f){
    const id = 'field_' + f.key;
    const roStyle = ' style="background:#F7F9FB;color:var(--muted);"';
    const ro = f.readOnly;
    if(f.type === 'select'){
      return `<select id="${id}"${ro ? (' disabled' + roStyle) : ''}><option value="">เลือก...</option>${f.options.map(o=>`<option>${escapeHtml(o)}</option>`).join('')}</select>`;
    } else if(f.type === 'textarea'){
      return `<textarea id="${id}" placeholder="${escapeHtml(f.placeholder||'')}"${ro ? (' readonly' + roStyle) : ''}></textarea>`;
    } else if(f.type === 'date'){
      return `<input type="date" id="${id}"${ro ? (' readonly' + roStyle) : ''}>`;
    } else if(f.type === 'time'){
      return `<input type="time" id="${id}">`;
    } else if(f.type === 'number'){
      return `<input type="number" step="any" id="${id}"${ro ? ' readonly style="background:#F7F9FB;color:var(--charcoal);font-weight:700;"' : ''}>`;
    } else if(f.type === 'area-manpower-list'){
      return `<div class="list-rows" id="${id}"></div><button type="button" class="list-add-btn" data-key="${f.key}" data-listtype="${f.type}">+ เพิ่มพื้นที่</button><div class="note">F = Foreman, S = Safety, W = Worker, O = Other</div>`;
    } else if(f.type === 'personnel-list' || f.type === 'text-list' || f.type === 'volume-list'){
      const ph = f.itemPlaceholder || (f.type === 'text-list' ? 'Equipment' : 'Position');
      return `<div class="list-rows" id="${id}"></div><button type="button" class="list-add-btn" data-key="${f.key}" data-listtype="${f.type}" data-placeholder="${escapeHtml(ph)}">+ เพิ่มรายการ</button>`;
    } else {
      return `<input type="text" id="${id}" placeholder="${escapeHtml(f.placeholder||'')}"${ro ? (' readonly' + roStyle) : ''}>`;
    }
  }

  function addListRow(key, listType, value, placeholder){
    const container = document.getElementById('field_' + key);
    if(!container) return;
    const rowId = uid();
    const ph = placeholder || (listType === 'text-list' ? 'Equipment' : 'Position');
    if(listType === 'personnel-list' || listType === 'volume-list'){
      const pos = (value && value.position) || '';
      const cnt = (value && value.count != null) ? value.count : (listType === 'volume-list' ? '' : 1);
      const numAttrs = listType === 'volume-list' ? 'step="any"' : 'min="0"';
      container.insertAdjacentHTML('beforeend', `
        <div class="list-row" data-row="${rowId}">
          <input type="text" class="lr-pos" value="${escapeHtml(pos)}" placeholder="${escapeHtml(ph)}">
          <input type="number" ${numAttrs} class="lr-count" value="${escapeHtml(String(cnt))}">
          <button type="button" class="rm-row" data-row="${rowId}">✕</button>
        </div>`);
    } else {
      const v = value || '';
      container.insertAdjacentHTML('beforeend', `
        <div class="list-row" data-row="${rowId}">
          <input type="text" class="lr-text" value="${escapeHtml(v)}" placeholder="${escapeHtml(ph)}">
          <button type="button" class="rm-row" data-row="${rowId}">✕</button>
        </div>`);
    }
    container.querySelector(`.rm-row[data-row="${rowId}"]`).addEventListener('click', ()=>{
      container.querySelector(`.list-row[data-row="${rowId}"]`).remove();
    });
  }
  function getListValue(key, listType){
    const container = document.getElementById('field_' + key);
    if(!container) return [];
    if(listType === 'personnel-list' || listType === 'volume-list'){
      return Array.from(container.querySelectorAll('.list-row')).map(row => ({
        position: row.querySelector('.lr-pos').value.trim(),
        count: listType === 'volume-list'
          ? (parseFloat(row.querySelector('.lr-count').value) || 0)
          : (parseInt(row.querySelector('.lr-count').value, 10) || 0)
      })).filter(r => r.position);
    } else {
      return Array.from(container.querySelectorAll('.list-row')).map(row => row.querySelector('.lr-text').value.trim()).filter(Boolean);
    }
  }
  function setListValue(key, listType, arr, placeholder){
    const container = document.getElementById('field_' + key);
    if(!container) return;
    container.innerHTML = '';
    (arr && arr.length ? arr : []).forEach(v => addListRow(key, listType, v, placeholder));
  }
  // ---------- area-manpower-list: per-area Foreman/Safety/Worker breakdown ----------
  function areaManpowerOptionsFor(key){
    const f = activeModule.fields.find(fl => fl.key === key);
    return (f && f.locationOptions) || [];
  }
  function addAreaManpowerRow(key, value){
    const container = document.getElementById('field_' + key);
    if(!container) return;
    const rowId = uid();
    const options = areaManpowerOptionsFor(key);
    const loc = (value && value.location) || '';
    const foreman = (value && value.foreman != null) ? value.foreman : '';
    const safety = (value && value.safety != null) ? value.safety : '';
    const worker = (value && value.worker != null) ? value.worker : '';
    const other = (value && value.other != null) ? value.other : '';
    container.insertAdjacentHTML('beforeend', `
      <div class="list-row" data-row="${rowId}">
        <select class="lr-loc" style="flex:1.6 1 auto;min-width:0;">
          <option value="">เลือกพื้นที่...</option>
          ${options.map(o=>`<option ${o===loc?'selected':''}>${escapeHtml(o)}</option>`).join('')}
        </select>
        <input type="number" min="0" class="lr-manpower-num lr-foreman" placeholder="F" value="${escapeHtml(String(foreman))}" style="flex:0 0 58px;">
        <input type="number" min="0" class="lr-manpower-num lr-safety" placeholder="S" value="${escapeHtml(String(safety))}" style="flex:0 0 58px;">
        <input type="number" min="0" class="lr-manpower-num lr-worker" placeholder="W" value="${escapeHtml(String(worker))}" style="flex:0 0 58px;">
        <input type="number" min="0" class="lr-manpower-num lr-other" placeholder="O" value="${escapeHtml(String(other))}" style="flex:0 0 58px;">
        <button type="button" class="rm-row" data-row="${rowId}">✕</button>
      </div>`);
    const row = container.querySelector(`.list-row[data-row="${rowId}"]`);
    row.querySelector('.rm-row').addEventListener('click', ()=>{ row.remove(); recomputeManpowerTotals(); });
    row.querySelectorAll('.lr-foreman,.lr-safety,.lr-worker,.lr-other').forEach(inp => inp.addEventListener('input', recomputeManpowerTotals));
  }
  function getAreaManpowerValue(key){
    const container = document.getElementById('field_' + key);
    if(!container) return [];
    return Array.from(container.querySelectorAll('.list-row')).map(row => ({
      location: row.querySelector('.lr-loc').value,
      foreman: parseInt(row.querySelector('.lr-foreman').value, 10) || 0,
      safety: parseInt(row.querySelector('.lr-safety').value, 10) || 0,
      worker: parseInt(row.querySelector('.lr-worker').value, 10) || 0,
      other: parseInt(row.querySelector('.lr-other').value, 10) || 0,
    })).filter(r => r.location);
  }
  function setAreaManpowerValue(key, arr){
    const container = document.getElementById('field_' + key);
    if(!container) return;
    container.innerHTML = '';
    (arr && arr.length ? arr : []).forEach(v => addAreaManpowerRow(key, v));
    // only recompute (overwrite) the F/S/W/O totals when there is an area breakdown to sum —
    // otherwise leave whatever totals were already set (e.g. legacy records saved before this
    // per-area breakdown existed) untouched instead of zeroing them out
    if(arr && arr.length) recomputeManpowerTotals();
  }
  function recomputeManpowerTotals(){
    if(activeModule.id !== 'concrete') return;
    const container = document.getElementById('field_manpower_by_location');
    if(!container) return;
    let f = 0, s = 0, w = 0, o = 0;
    container.querySelectorAll('.list-row').forEach(row=>{
      f += parseInt(row.querySelector('.lr-foreman').value, 10) || 0;
      s += parseInt(row.querySelector('.lr-safety').value, 10) || 0;
      w += parseInt(row.querySelector('.lr-worker').value, 10) || 0;
      o += parseInt(row.querySelector('.lr-other').value, 10) || 0;
    });
    const fEl = document.getElementById('field_foreman_count'); if(fEl) fEl.value = f;
    const sEl = document.getElementById('field_safety_count'); if(sEl) sEl.value = s;
    const wEl = document.getElementById('field_worker_count'); if(wEl) wEl.value = w;
    const oEl = document.getElementById('field_other_count'); if(oEl) oEl.value = o;
  }
  // Piling: ฟังก์ชันคำนวณ Elevation PILE TIP / Deviation N,E แบบ standalone (เรียกได้ทั้งตอนพิมพ์สด
  // และตอนโหลดรายการเดิมมาแก้ไข ที่ค่าถูกเซ็ตผ่าน setFieldValue โดยตรง ไม่ผ่าน event 'input')
  function recomputePileTip(){
    const topEl = document.getElementById('field_elevation_pile_top');
    const lenEl = document.getElementById('field_length_actual');
    const tipEl = document.getElementById('field_elevation_pile_tip');
    if(!topEl || !lenEl || !tipEl) return;
    const top = parseFloat(topEl.value), len = parseFloat(lenEl.value);
    tipEl.value = (isFinite(top) && isFinite(len)) ? Math.round((top - len) * 1000) / 1000 : '';
  }
  function recomputePileActualFromDeviation(devKey, designKey, actualKey){
    const devEl = document.getElementById('field_' + devKey);
    const designEl = document.getElementById('field_' + designKey);
    const actualEl = document.getElementById('field_' + actualKey);
    if(!devEl || !designEl || !actualEl) return;
    const dev = parseFloat(devEl.value), d = parseFloat(designEl.value);
    actualEl.value = (isFinite(dev) && isFinite(d)) ? Math.round((d + dev) * 1000) / 1000 : '';
  }
  function recomputeAllPilingCalcs(){
    recomputePileTip();
    recomputePileActualFromDeviation('deviation_n','design_n','n_actual');
    recomputePileActualFromDeviation('deviation_e','design_e','e_actual');
  }
  function renderFormFields(){
    const rowsHtml = chunkFieldsForLayout(activeModule.fields).map(group=>{
      const inner = group.map(f => {
        const isPileSearchField = ((activeModule.id === 'piling' || activeModule.id === 'piling_design') && f.key === 'pile_number');
        return `
        <div class="field">
          <label>${escapeHtml(f.label)}${f.required ? '<span class="req">*</span>' : ''}</label>
          ${isPileSearchField
            ? `<div style="display:flex;gap:8px;"><div style="flex:1 1 auto;">${renderFieldInput(f)}</div><button type="button" id="btnSearchPileNumber" class="btn btn-ghost" style="flex:0 0 auto;">🔍 ค้นหา</button></div>`
            : renderFieldInput(f)}
          ${f.note ? `<div class="note">${escapeHtml(f.note)}</div>` : ''}
        </div>`;
      }).join('');
      return group.length === 2 ? `<div class="two-col">${inner}</div>` : inner;
    }).join('');
    $('#dynamicFields').innerHTML = rowsHtml;
    $$('.list-add-btn').forEach(btn => btn.addEventListener('click', ()=>{
      const lt = btn.dataset.listtype;
      if(lt === 'area-manpower-list'){ addAreaManpowerRow(btn.dataset.key, {}); recomputeManpowerTotals(); return; }
      const def = lt === 'personnel-list' ? {position:'',count:1} : (lt === 'volume-list' ? {position:'',count:''} : '');
      addListRow(btn.dataset.key, lt, def, btn.dataset.placeholder);
    }));
    if(activeModule.id === 'findings'){
      $('#field_finding_date').addEventListener('change', ()=>{
        updatePreviewNumber();
        if(!editingId) $('#field_due_date').value = addDays($('#field_finding_date').value || todayISO(), 7);
      });
    }
    if(activeModule.id === 'piling' || activeModule.id === 'piling_design'){
      const topEl = document.getElementById('field_elevation_pile_top');
      const lenEl = document.getElementById('field_length_actual');
      if(topEl) topEl.addEventListener('input', recomputePileTip);
      if(lenEl) lenEl.addEventListener('input', recomputePileTip);

      const devNEl = document.getElementById('field_deviation_n');
      const devEEl = document.getElementById('field_deviation_e');
      if(devNEl) devNEl.addEventListener('input', ()=> recomputePileActualFromDeviation('deviation_n','design_n','n_actual'));
      if(devEEl) devEEl.addEventListener('input', ()=> recomputePileActualFromDeviation('deviation_e','design_e','e_actual'));

      const rigEl = document.getElementById('field_rig');
      const rigCodeEl = document.getElementById('field_rig_code');
      if(rigEl && rigCodeEl){
        rigEl.addEventListener('change', ()=>{
          const m = RIG_RIG_CODE_MAP.find(p => p[0] === rigEl.value);
          if(m) rigCodeEl.value = m[1];
        });
        rigCodeEl.addEventListener('change', ()=>{
          const m = RIG_RIG_CODE_MAP.find(p => p[1] === rigCodeEl.value);
          if(m) rigEl.value = m[0];
        });
      }

      const btnSearchPile = document.getElementById('btnSearchPileNumber');
      if(btnSearchPile){
        btnSearchPile.addEventListener('click', ()=>{
          const pnEl = document.getElementById('field_pile_number');
          const pn = pnEl ? pnEl.value.trim() : '';
          if(!pn){ showToast('กรุณาพิมพ์เลขเสาเข็มที่ต้องการค้นหาก่อน', true); return; }
          const found = rows.find(r => String(r.pile_number).trim().toLowerCase() === pn.toLowerCase());
          if(found){
            if(String(found.id) === String(editingId)) return; // already editing this one
            loadIntoForm(found);
            showToast('พบเสาเข็ม ' + pn + ' ในระบบ — เปิดมาให้แก้ไขแล้ว');
          }else{
            showToast('ไม่พบเลขเสาเข็ม ' + pn + ' ในระบบ — สามารถกรอกเป็นรายการใหม่ได้เลย', true);
          }
        });
      }
    }
  }
  function getFieldValue(f){
    if(f.type === 'area-manpower-list') return getAreaManpowerValue(f.key);
    if(f.type === 'personnel-list' || f.type === 'text-list' || f.type === 'volume-list') return getListValue(f.key, f.type);
    const el = document.getElementById('field_' + f.key);
    if(!el) return '';
    return el.value.trim ? el.value.trim() : el.value;
  }
  function setFieldValue(f, val){
    if(f.type === 'area-manpower-list'){ setAreaManpowerValue(f.key, val); return; }
    if(f.type === 'personnel-list' || f.type === 'text-list' || f.type === 'volume-list'){ setListValue(f.key, f.type, val, f.itemPlaceholder); return; }
    const el = document.getElementById('field_' + f.key); if(el) el.value = (val === undefined || val === null) ? '' : val;
  }

  function updatePreviewNumber(){
    if(activeModule.id !== 'findings') return;
    if(!editingId) $('#previewNum').textContent = nextFindingNumber($('#field_finding_date').value);
  }

  // ---------- stats & list ----------
  function renderStats(){
    const stats = activeModule.computeStats(rows);
    $('#statRow').innerHTML = stats.map(s => `<div class="stat-chip ${s.cls||''}"><div class="n">${s.value}</div><div class="l">${escapeHtml(s.label)}</div></div>`).join('');
  }
  function sevClass(f){
    if(!activeModule.accentField) return 'sev-none';
    const v = f[activeModule.accentField];
    return (activeModule.accentMap && activeModule.accentMap[v]) || 'sev-none';
  }
  function badgeClass(fieldKey, value){
    const map = activeModule.badgeColorMap || {};
    return map[value] || 'loc';
  }

  function renderList(){
    let list = rows.slice();
    list = list.filter(f=>{
      if(currentFilterStatus !== 'all'){
        const fv = activeModule.statusFilterField ? f[activeModule.statusFilterField] : null;
        if(fv !== currentFilterStatus) return false;
      }
      if(currentSearch){
        const hay = activeModule.fields.map(fl => f[fl.key]).concat([activeModule.idLabel(f)]).join(' ').toLowerCase();
        if(!hay.includes(currentSearch.toLowerCase())) return false;
      }
      return true;
    });
    $('#listCount').textContent = list.length + ' รายการ';
    const container = $('#listContainer');
    if(list.length === 0){ container.innerHTML = '<div class="empty-state"><div class="mark">🗂️</div>ไม่พบรายการที่ตรงกับเงื่อนไข</div>'; return; }
    container.innerHTML = list.map(f=>{
      const urls = Array.isArray(f.photo_urls) ? f.photo_urls : [];
      const coverHtml = urls.length ? `<img src="${urls[0]}" loading="lazy">` : `<div class="ph-empty">${activeModule.icon}</div>`;
      const badges = activeModule.badgeFields.map(bf => f[bf] ? `<span class="pill ${badgeClass(bf, f[bf])==='loc'?'loc':badgeClass(bf,f[bf])}">${escapeHtml(f[bf])}</span>` : '').join('')
        + (activeModule.renderExtraMeta ? activeModule.renderExtraMeta(f) : '');
      return `
      <div class="finding ${sevClass(f)}" data-id="${f.id}">
        <div class="stripe"></div>
        <div class="cover">${coverHtml}</div>
        <div class="body2">
          <div class="f-top"><span class="f-num">${escapeHtml(activeModule.idLabel(f))}</span><span class="f-date">${escapeHtml(f[activeModule.dateField]||'')}</span></div>
          <div class="f-desc">${escapeHtml(f[activeModule.titleField]||'(ไม่มีรายละเอียด)')}</div>
          <div class="f-meta">${badges}${urls.length ? `<span class="pill photos">📷 ${urls.length}</span>` : ''}</div>
        </div>
      </div>`;
    }).join('');
    $$('.finding').forEach(el => el.addEventListener('click', ()=> openDetail(el.dataset.id)));
  }

  async function refreshAndRender(){
    try{
      await fetchAll();
      setConn(true, 'เชื่อมต่อแล้ว · ' + rows.length + ' รายการ');
      renderStats(); renderList();
    }catch(e){
      console.error(e); setConn(false, 'เชื่อมต่อไม่ได้ ลองรีเฟรชอีกครั้ง');
      showToast('โหลดข้อมูลไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต', true);
    }
  }

  // ---------- Piling: กรอกกลุ่ม (bulk assign RFI No. / Production Day / Delivery Day) ----------
  function bulkFilteredRows(){
    if(!(activeModule.id === 'piling' || activeModule.id === 'piling_design')) return [];
    const s = bulkSearch.trim().toLowerCase();
    return rows.filter(r=>{
      if(s && !String(r.pile_number||'').toLowerCase().includes(s)) return false;
      if(bulkAreaFilter && (r.area||'') !== bulkAreaFilter) return false;
      if(bulkStatusFilter && (r.status||'') !== bulkStatusFilter) return false;
      return true;
    }).sort((a,b)=> String(a.pile_number).localeCompare(String(b.pile_number), undefined, {numeric:true}));
  }
  function renderBulkAreaFilterOptions(){
    const sel = document.getElementById('bulkAreaFilter');
    if(!sel) return;
    const areas = Array.from(new Set(rows.map(r=>r.area).filter(Boolean))).sort();
    const cur = sel.value;
    sel.innerHTML = '<option value="">ทุกพื้นที่</option>' + areas.map(a=>`<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('');
    sel.value = areas.includes(cur) ? cur : '';
  }
  function renderBulkAssignTable(){
    if(!document.getElementById('panel-bulk') || document.getElementById('panel-bulk').hidden) return;
    renderBulkAreaFilterOptions();
    const filtered = bulkFilteredRows();
    const tbody = document.getElementById('bulkTableBody');
    tbody.innerHTML = filtered.map(r => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid var(--line);"><input type="checkbox" class="bulk-row-check" data-id="${r.id}" ${bulkSelectedIds.has(String(r.id)) ? 'checked' : ''}></td>
        <td style="padding:6px 10px;border-bottom:1px solid var(--line);font-family:var(--mono);white-space:nowrap;">${escapeHtml(String(r.pile_number||''))}</td>
        <td style="padding:6px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${escapeHtml(r.area||'-')}</td>
        <td style="padding:6px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${escapeHtml(r.status||'-')}</td>
        <td style="padding:6px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${escapeHtml(r.rfi_no||'-')}</td>
        <td style="padding:6px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${escapeHtml(r.pile_production_day||'-')}</td>
        <td style="padding:6px 10px;border-bottom:1px solid var(--line);white-space:nowrap;">${escapeHtml(r.pile_delivery_day||'-')}</td>
      </tr>`).join('') || '<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--muted);">ไม่พบเสาเข็มตามตัวกรอง</td></tr>';
    $$('.bulk-row-check').forEach(cb => cb.addEventListener('change', ()=>{
      if(cb.checked) bulkSelectedIds.add(cb.dataset.id); else bulkSelectedIds.delete(cb.dataset.id);
      updateBulkSelCount();
    }));
    const allChecked = filtered.length > 0 && filtered.every(r => bulkSelectedIds.has(String(r.id)));
    const selectAllCb = document.getElementById('bulkSelectAll');
    if(selectAllCb) selectAllCb.checked = allChecked;
    document.getElementById('bulkListCount').textContent = filtered.length + ' รายการ (จากทั้งหมด ' + rows.length + ')';
    updateBulkSelCount();
  }
  function updateBulkSelCount(){
    const el = document.getElementById('bulkSelCount');
    if(el) el.textContent = bulkSelectedIds.size;
  }
  async function bulkApplyField(fieldKey, value, label){
    if(bulkSelectedIds.size === 0){ showToast('กรุณาเลือกเสาเข็มก่อน', true); return; }
    const isClear = (value === '' || value === null || value === undefined);
    const valueToSave = isClear ? null : value;
    const ids = Array.from(bulkSelectedIds);
    try{
      const res = await fetch(restUrl() + '?id=in.(' + ids.join(',') + ')', {
        method:'PATCH', headers:{...HEADERS,'Prefer':'return=minimal'}, body: JSON.stringify({ [fieldKey]: valueToSave })
      });
      if(!res.ok) throw new Error('PATCH failed: ' + res.status);
      rows.forEach(r => { if(bulkSelectedIds.has(String(r.id))) r[fieldKey] = valueToSave; });
      renderBulkAssignTable();
      showToast((isClear ? 'ล้างค่า ' : 'กำหนด ') + label + (isClear ? ' ของ ' : ' ให้ ') + ids.length + ' ต้นแล้ว');
    }catch(e){
      console.error(e);
      showToast('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง', true);
    }
  }
  (function wireBulkAssignUI(){
    const search = document.getElementById('bulkSearchBox');
    const areaSel = document.getElementById('bulkAreaFilter');
    const statusSel = document.getElementById('bulkStatusFilter');
    const selectAllCb = document.getElementById('bulkSelectAll');
    if(search) search.addEventListener('input', ()=>{ bulkSearch = search.value; renderBulkAssignTable(); });
    if(areaSel) areaSel.addEventListener('change', ()=>{ bulkAreaFilter = areaSel.value; renderBulkAssignTable(); });
    if(statusSel) statusSel.addEventListener('change', ()=>{ bulkStatusFilter = statusSel.value; renderBulkAssignTable(); });
    if(selectAllCb) selectAllCb.addEventListener('change', ()=>{
      const filtered = bulkFilteredRows();
      if(selectAllCb.checked) filtered.forEach(r => bulkSelectedIds.add(String(r.id)));
      else filtered.forEach(r => bulkSelectedIds.delete(String(r.id)));
      renderBulkAssignTable();
    });
    const btnRfi = document.getElementById('btnBulkApplyRfi');
    const btnProd = document.getElementById('btnBulkApplyProd');
    const btnDelivery = document.getElementById('btnBulkApplyDelivery');
    if(btnRfi) btnRfi.addEventListener('click', ()=> bulkApplyField('rfi_no', document.getElementById('bulkRfiInput').value.trim(), 'RFI No.'));
    if(btnProd) btnProd.addEventListener('click', ()=> bulkApplyField('pile_production_day', document.getElementById('bulkProdInput').value, 'Pile Production Day'));
    if(btnDelivery) btnDelivery.addEventListener('click', ()=> bulkApplyField('pile_delivery_day', document.getElementById('bulkDeliveryInput').value, 'Pile Delivery Day'));
  })();

  function formatFieldDisplay(f, val){
    if(f.type === 'personnel-list'){
      const arr = Array.isArray(val) ? val : [];
      if(!arr.length) return '-';
      const listHtml = arr.map(p => `${escapeHtml(p.position)}: ${escapeHtml(String(p.count))}`).join('<br>');
      const sumTotal = sumPersonnel(arr);
      return listHtml + '<br><span style="color:#DC2626;font-weight:700;">Sum total: ' + sumTotal + '</span>';
    }
    if(f.type === 'volume-list'){
      const arr = Array.isArray(val) ? val : [];
      if(!arr.length) return '-';
      return arr.map(p => `${escapeHtml(p.position)}: ${escapeHtml(String(p.count))} m³`).join('<br>');
    }
    if(f.type === 'area-manpower-list'){
      const arr = Array.isArray(val) ? val : [];
      if(!arr.length) return '-';
      return arr.map(p => `${escapeHtml(p.location)} (F:${p.foreman||0} S:${p.safety||0} W:${p.worker||0} O:${p.other||0})`).join('<br>');
    }
    if(f.type === 'text-list'){
      const arr = Array.isArray(val) ? val : [];
      return arr.length ? arr.map(escapeHtml).join('<br>') : '-';
    }
    return escapeHtml(val || '-');
  }

  function formatPersonnelListPlain(val){
    const arr = Array.isArray(val) ? val : [];
    if(!arr.length) return '-';
    return arr.map(p => `${p.position}: ${p.count}`).join(', ');
  }
  function buildDailyReportCopyText(f){
    const dur = calcDuration(f.time_start, f.time_end);
    const lines = [
      '📋 Daily Report' + (f.id ? ' — DR-' + f.id.slice(0,6) : ''),
      '📅 วันที่: ' + (f.report_date || '-'),
      '📍 พื้นที่: ' + (f.location || '-'),
      '🕖 เวลาทำงาน: ' + (f.time_start || '--') + ' – ' + (f.time_end || '--') + ' (' + dur + ')',
      '🏢 โครงการ: ' + (f.project_name || '-'),
      '',
      '🌤️ สภาพอากาศ',
      '  06:00–09:00: ' + (f.weather_0609 || 'ไม่ระบุ'),
      '  09:00–12:00: ' + (f.weather_0912 || 'ไม่ระบุ'),
      '  12:00–15:00: ' + (f.weather_1215 || 'ไม่ระบุ'),
      '  15:00–18:00: ' + (f.weather_1518 || 'ไม่ระบุ'),
      '',
      '👨‍💼 REPCO Personnel: ' + formatPersonnelListPlain(f.repco_personnel),
      '👥 State Personnel (พื้นที่ก่อสร้าง): ' + formatPersonnelListPlain(f.state_personnel_site),
      '👥 State Personnel (Workshop): ' + formatPersonnelListPlain(f.state_personnel_workshop),
      '🚜 เครื่องจักร/อุปกรณ์: ' + formatPersonnelListPlain(f.equipment),
      '',
      '🎯 กิจกรรม/เป้าหมายวันนี้:',
      (f.activities || '-'),
      '',
      '📊 สรุปความก้าวหน้า:',
      (f.progress_summary || '-'),
    ];
    return lines.join('\n');
  }
  async function copyTextToClipboard(text){
    try{
      await navigator.clipboard.writeText(text);
      return true;
    }catch(e){
      try{
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      }catch(e2){ return false; }
    }
  }
  function openDetail(id){
    const f = rows.find(x => String(x.id) === String(id));
    if(!f) return;
    const urls = Array.isArray(f.photo_urls) ? f.photo_urls : [];
    const fieldsHtml = renderDetailFieldsHtml(activeModule.fields, f);
    const extraHtml = activeModule.detailExtra ? activeModule.detailExtra(f) : '';
    const modal = $('#modalContent');
    const copyBtnHtml = (activeModule.id === 'daily')
      ? `<button class="modal-close" id="btnCopyDailyReport" title="คัดลอกข้อมูลสำหรับส่งไลน์" style="font-size:16px;">📋</button>`
      : '';
    modal.innerHTML = `
      <div class="modal-head"><h2>${escapeHtml(activeModule.idLabel(f))}</h2><div style="display:flex;gap:2px;align-items:center;">${copyBtnHtml}<button class="modal-close" id="modalCloseBtn">&times;</button></div></div>
      <div class="detail-grid">
        ${fieldsHtml}
        ${extraHtml}
        <div class="detail-field full detail-photos"><label>Photos</label>
          <div class="photo-grid">${urls.length ? urls.map(u=>`<div class="photo-thumb"><img src="${u}" data-full="${u}"></div>`).join('') : '<span class="photo-status">ยังไม่มีรูปภาพในรายการนี้</span>'}</div>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="btnEditThis">แก้ไขรายการนี้</button>
        <button class="btn btn-danger" id="btnDeleteThis">ลบ</button>
      </div>`;
    $('#modalBg').classList.add('show');
    $('#modalCloseBtn').addEventListener('click', closeModal);
    const btnCopyDaily = document.getElementById('btnCopyDailyReport');
    if(btnCopyDaily) btnCopyDaily.addEventListener('click', async ()=>{
      const ok = await copyTextToClipboard(buildDailyReportCopyText(f));
      showToast(ok ? 'คัดลอกข้อมูลแล้ว — ไปวางส่งใน LINE ได้เลย' : 'คัดลอกไม่สำเร็จ ลองใหม่อีกครั้ง', !ok);
    });
    $('#btnEditThis').addEventListener('click', ()=>{ closeModal(); loadIntoForm(f); });
    $('#btnDeleteThis').addEventListener('click', ()=> deleteFinding(f.id));
    modal.querySelectorAll('.photo-thumb img').forEach(img => img.addEventListener('click', ()=> openLightbox(img.dataset.full, img)));
  }
  function closeModal(){ $('#modalBg').classList.remove('show'); }
  $('#modalBg').addEventListener('click', (e)=>{ if(e.target.id === 'modalBg') closeModal(); });

  async function deleteFinding(id){
    if(!confirm('ยืนยันการลบรายการนี้? (รูปภาพที่แนบจะถูกลบด้วย)')) return;
    const f = rows.find(x => String(x.id) === String(id));
    try{
      await deleteRecord(id);
      if(f && Array.isArray(f.photo_urls)){ for(const u of f.photo_urls) await deleteStorageObjectByUrl(u); }
      closeModal(); showToast('ลบรายการแล้ว'); await refreshAndRender();
    }catch(e){ console.error(e); showToast('ลบไม่สำเร็จ: ' + e.message, true); }
  }

  // ---------- form ----------
  function clearForm(){
    editingId = null; pendingPhotos = []; removedExistingUrls = [];
    renderFormFields();
    activeModule.fields.forEach(f=>{
      if(f.type === 'date' && f.key === activeModule.dateField) setFieldValue(f, todayISO());
      else if(f.default !== undefined) setFieldValue(f, f.default);
    });
    if(activeModule.id === 'findings'){
      setFieldValue({key:'due_date'}, addDays(todayISO(), 7));
    }
    $('#previewNum').textContent = activeModule.hasAutoNumber ? nextFindingNumber(todayISO()) : 'รายการใหม่';
    $('#formModeHint').textContent = 'รายการใหม่';
    $('#btnCopyPrev').style.display = '';
    $('#validationMsg').classList.remove('show');
    $('#photoStatus').textContent = '';
    renderPhotoGrid();
    if(activeModule.id === 'concrete'){ renderConcretePourSection({}); }
    else{ const sec = document.getElementById('concretePourSection'); if(sec) sec.innerHTML = ''; }
  }

  function loadIntoForm(f){
    editingId = f.id; removedExistingUrls = [];
    renderFormFields();
    activeModule.fields.forEach(fl => setFieldValue(fl, f[fl.key]));
    if(activeModule.id === 'piling' || activeModule.id === 'piling_design'){ recomputeAllPilingCalcs(); }
    $('#previewNum').textContent = activeModule.hasAutoNumber ? f[activeModule.numberField] : activeModule.idLabel(f);
    $('#formModeHint').textContent = 'แก้ไข: ' + activeModule.idLabel(f);
    $('#btnCopyPrev').style.display = 'none';
    const urls = Array.isArray(f.photo_urls) ? f.photo_urls : [];
    pendingPhotos = urls.map(u => ({ id: uid(), name: u.split('/').pop(), url: u, isExisting: true }));
    $('#photoStatus').textContent = pendingPhotos.length ? (pendingPhotos.length + ' รูป (เดิม)') : '';
    renderPhotoGrid();
    if(activeModule.id === 'concrete'){
      fetchPourEntriesForReport(f.id).then(map => renderConcretePourSection(map));
    }else{
      const sec = document.getElementById('concretePourSection'); if(sec) sec.innerHTML = '';
    }
    switchTab('form');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  async function handleSave(){
    const missing = activeModule.fields.filter(f => f.required && !getFieldValue(f)).map(f => f.label);
    if(missing.length){
      $('#validationMsg').textContent = 'กรุณากรอกช่องที่มีเครื่องหมาย * ให้ครบ: ' + missing.join(', ');
      $('#validationMsg').classList.add('show');
      return;
    }
    $('#validationMsg').classList.remove('show');
    const btn = $('#btnSave'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>กำลังบันทึก...';

    try{
      const folderPrefix = editingId ? editingId : (getFieldValue({key:activeModule.dateField}) + '_' + uid().slice(0,6));

      const finalUrls = [];
      for(const p of pendingPhotos){
        if(p.isExisting){ finalUrls.push(p.url); }
        else{ const url = await uploadPhotoBlob(folderPrefix, p.blob, p.name); finalUrls.push(url); }
      }
      for(const u of removedExistingUrls) await deleteStorageObjectByUrl(u);

      const record = {};
      activeModule.fields.forEach(f=>{
        let v = getFieldValue(f);
        if((f.type === 'date' || f.type === 'time') && !v) v = null;
        if(f.type === 'number'){
          // ปกติช่องตัวเลขที่เว้นว่างจะถูกบันทึกเป็น 0 — แต่สำหรับ Piling (ทั้งสอง module) ฟิลด์ตัวเลข
          // อย่าง design_n/design_e/deviation ฯลฯ ไม่ควรกลายเป็น 0 เพราะจะกลายเป็นพิกัดปลอมที่ (0,0)
          // ในกราฟ Geographic Distribution ให้เก็บเป็น NULL แทนถ้าเว้นว่างไว้
          const isPilingModule = (activeModule.id === 'piling' || activeModule.id === 'piling_design');
          v = (v === '' || v == null) ? (isPilingModule ? null : 0) : Number(v);
        }
        record[f.key] = v;
      });
      record.photo_urls = finalUrls;
      if(activeModule.id === 'findings' && !editingId){
        record.finding_number = nextFindingNumber(record.finding_date);
      } else if(activeModule.id === 'findings' && editingId){
        record.finding_number = rows.find(f=>f.id===editingId).finding_number;
      }

      let label, savedId = editingId;
      if(editingId){ await updateRecord(editingId, record); label = activeModule.hasAutoNumber ? record.finding_number : activeModule.idLabel({...record, id:editingId}); }
      else{ const created = await insertRecord(record); label = activeModule.hasAutoNumber ? record.finding_number : activeModule.idLabel(created); savedId = created.id; }

      if(activeModule.id === 'concrete'){
        const pourEntries = Array.from(document.querySelectorAll('.pour-input'))
          .filter(inp => inp.value !== '')
          .map(inp => {
            const row = inp.closest('.list-row');
            const floorSel = row ? row.querySelector('.pour-floor') : null;
            return { structure_item_id: inp.dataset.itemId, floor: floorSel ? floorSel.value : CONCRETE_FLOOR_OPTIONS[0], poured_today_m3: Number(inp.value) || 0 };
          });
        await replacePourEntries(savedId, pourEntries);
      }

      showToast((editingId ? 'บันทึกการแก้ไขแล้ว: ' : 'บันทึกสำเร็จ: ') + label);
      clearForm();
      await refreshAndRender();
      switchTab('list');
    }catch(e){
      console.error(e); showToast('บันทึกไม่สำเร็จ: ' + e.message, true);
    }finally{
      btn.disabled = false; btn.textContent = 'บันทึกข้อมูล';
    }
  }
  $('#btnSave').addEventListener('click', handleSave);
  $('#btnClear').addEventListener('click', ()=>{ if(confirm('ล้างฟอร์มเพื่อกรอกรายการถัดไปหรือไม่?')) clearForm(); });

  async function copyPreviousEntry(){
    const btn = $('#btnCopyPrev');
    btn.disabled = true; btn.textContent = '⏳ กำลังโหลด...';
    try{
      const res = await fetch(restUrl() + '?select=*&order=' + activeModule.dateField + '.desc&limit=1', { headers: HEADERS });
      if(!res.ok) throw new Error('fetch failed: ' + res.status);
      const data = await res.json();
      if(!data.length){ showToast('ยังไม่มีข้อมูลก่อนหน้าให้คัดลอก', true); return; }
      const prev = data[0];
      activeModule.fields.forEach(f=>{
        if(f.key === activeModule.dateField) return; // keep today's date as-is
        setFieldValue(f, prev[f.key]);
      });
      showToast('คัดลอกข้อมูลจากรายการวันที่ ' + (prev[activeModule.dateField] || '-') + ' แล้ว (ไม่รวมรูปภาพ)');
    }catch(e){
      console.error(e); showToast('คัดลอกไม่สำเร็จ: ' + e.message, true);
    }finally{
      btn.disabled = false; btn.textContent = '📋 คัดลอกล่าสุด';
    }
  }
  $('#btnCopyPrev').addEventListener('click', copyPreviousEntry);

  function switchTab(name){
    const panelName = (name === 'list-pending') ? 'list' : name; // ปุ่ม "รอกรอกข้อมูลจริง" ใช้ panel รายการเดียวกับ list ทั่วไป
    $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    $('#panel-form').hidden = panelName !== 'form';
    $('#panel-list').hidden = panelName !== 'list';
    $('#panel-bulk').hidden = panelName !== 'bulk';
    if(panelName === 'list') refreshAndRender();
    if(panelName === 'bulk') refreshAndRender().then(renderBulkAssignTable);
  }
  $$('.tab-btn').forEach(b => b.addEventListener('click', ()=> switchTab(b.dataset.tab)));
  $('#tabPendingPiles').addEventListener('click', ()=>{
    // ตั้งตัวกรองสถานะเป็น Pending (เสาเข็มที่มี design/plan แล้วแต่ยังไม่มีผลตอกจริง) แล้วเรนเดอร์ซ้ำให้ชัวร์
    currentFilterStatus = 'Pending';
    $$('.chip').forEach(c => c.classList.toggle('active', c.dataset.status === 'Pending'));
    renderList();
  });
  $('#btnPileMapJump').addEventListener('click', async ()=>{
    // ไปที่ Dashboard Piling -> แท็บ Location Plot -> เปิดเต็มจอให้อัตโนมัติ (จำลองคลิกปุ่มที่มีอยู่แล้วในแดชบอร์ด)
    await switchModule('dash_piling');
    const locBtn = document.querySelector('#pilingTabBar .piling-tab-btn[data-ptab="location"]');
    if(locBtn) locBtn.click();
    const fsBtn = document.getElementById('btnPileGeoFullscreen');
    if(fsBtn) fsBtn.click();
  });
  $('#searchBox').addEventListener('input', (e)=>{ currentSearch = e.target.value; renderList(); });
  $('#btnRefresh').addEventListener('click', refreshAndRender);

  $('#btnExport').addEventListener('click', ()=>{
    const headers = activeModule.fields.map(f=>f.key).concat(['photo_urls']);
    const fieldByKey = {}; activeModule.fields.forEach(f => fieldByKey[f.key] = f);
    const csvRows = [headers.join(',')];
    rows.forEach(f=>{
      const row = headers.map(h=>{
        let v;
        if(h === 'photo_urls'){ v = Array.isArray(f[h]) ? f[h].join(';') : ''; }
        else{
          const fdef = fieldByKey[h];
          if(fdef && fdef.type === 'area-manpower-list'){ v = (Array.isArray(f[h])?f[h]:[]).map(p=>`${p.location}:F${p.foreman},S${p.safety},W${p.worker},O${p.other}`).join(' | '); }
          else if(fdef && (fdef.type === 'personnel-list' || fdef.type === 'volume-list')){ v = (Array.isArray(f[h])?f[h]:[]).map(p=>`${p.position}:${p.count}`).join(' | '); }
          else if(fdef && fdef.type === 'text-list'){ v = (Array.isArray(f[h])?f[h]:[]).join(' | '); }
          else{ v = f[h] ?? ''; }
        }
        v = v.toString().replace(/"/g,'""');
        if(v.includes(',') || v.includes('\n')) v = '"' + v + '"';
        return v;
      });
      csvRows.push(row.join(','));
    });
    const blob = new Blob(['\ufeff' + csvRows.join('\n')], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = activeModule.table + '_export.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  });

  let toastTimer;
  function showToast(msg, isErr){
    $('#toastMsg').textContent = msg; $('#toast').classList.toggle('err', !!isErr); $('#toast').classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(()=> $('#toast').classList.remove('show'), 3200);
  }

  async function init(){
    renderModuleRow();
    renderFilterRow();
    clearForm();
    setConn(false, 'กำลังเชื่อมต่อ...');
    await refreshAndRender();
  }
  init();
})();

;
