import os

path = os.path.join(os.environ["HOME"], "mnt/Site-Report-Hub/index.html")
with open(path, "r", encoding="utf-8") as f:
    s = f.read()

old_sync = """  async function vpSyncGroupsToBOQ(groups, countFn, subActsForLink, mainActsForLink){
    const subById = new Map((subActsForLink||[]).map(s=> [String(s.id), s]));
    const actByCode = new Map((mainActsForLink||[]).map(a=> [String(a.task_code), a]));
    const jobs = [];
    let synced = 0, failed = 0;
    const unmatched = [];
    groups.forEach(g=>{
      if(!g.total_units) return;
      (g.items||[]).forEach(item=>{
        if(!item.link_level || item.link_ref == null || item.link_ref === '') return;
        const cnt = countFn(g.id, item.color);
        const pct = Math.max(0, Math.min(100, Math.round((cnt / g.total_units) * 10000) / 100));
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
    if(!jobs.length) return { synced: 0, failed: 0, unmatched };
    await Promise.all(jobs);
    return { synced, failed, unmatched };
  }"""

new_sync = """  async function vpSyncGroupsToBOQ(groups, countFn, subActsForLink, mainActsForLink){
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
        const cnt = countFn(g.id, item.color);
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
  }"""

assert s.count(old_sync) == 1, s.count(old_sync)
s = s.replace(old_sync, new_sync)

old_then = """            vpSyncGroupsToBOQ(groupsForSync, countFn, subActsForLink, mainActsForLink).then(r=>{
              if(r.synced) showToast('ซิงก์ %POC/Actual BOQ ไปยัง Sub Activity ที่ลิงก์ไว้แล้ว ' + r.synced + ' รายการ' + (r.failed ? (' (ล้มเหลว ' + r.failed + ' รายการ)') : ''));
              else if(r.failed) showToast('ซิงก์ไปยัง Sub Activity ล้มเหลว ' + r.failed + ' รายการ', true);
              if(r.unmatched && r.unmatched.length) showToast('⚠️ พบลิงก์ที่ข้อมูลอ้างอิงไม่ตรงกับปัจจุบัน (อาจถูกลบ/แก้ไข BOQ): ' + r.unmatched.join(', '), true);
            });"""
new_then = """            vpSyncGroupsToBOQ(groupsForSync, countFn, subActsForLink, mainActsForLink).then(r=>{
              if(r.synced) showToast('ซิงก์ %POC/Actual BOQ ไปยัง Sub Activity ที่ลิงก์ไว้แล้ว ' + r.synced + ' รายการ' + (r.failed ? (' (ล้มเหลว ' + r.failed + ' รายการ)') : ''));
              else if(r.failed) showToast('ซิงก์ไปยัง Sub Activity ล้มเหลว ' + r.failed + ' รายการ', true);
              if(r.unmatched && r.unmatched.length) showToast('⚠️ พบลิงก์ที่ข้อมูลอ้างอิงไม่ตรงกับปัจจุบัน (อาจถูกลบ/แก้ไข BOQ): ' + r.unmatched.join(', '), true);
              if(r.noTotal && r.noTotal.length) showToast('ℹ️ Group ที่ยังไม่ได้ตั้ง "จำนวนทั้งหมด" จึงยังไม่ซิงก์: ' + r.noTotal.join(', '), true);
            });"""
assert s.count(old_then) == 2, s.count(old_then)
s = s.replace(old_then, new_then)

with open(path, "w", encoding="utf-8") as f:
    f.write(s)

print("OK")
