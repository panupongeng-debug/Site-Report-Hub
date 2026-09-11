import os

path = os.path.join(os.environ["HOME"], "mnt/Site-Report-Hub/index.html")
with open(path, "r", encoding="utf-8") as f:
    s = f.read()

old_css = """  .vp-link-combo{position:relative;}
  .vp-link-combo-list{position:absolute;top:100%;left:0;right:0;z-index:60;background:#fff;border:1px solid var(--line);border-radius:6px;max-height:220px;overflow-y:auto;box-shadow:0 4px 14px rgba(0,0,0,.14);margin-top:2px;}
  .vp-link-combo-item{padding:6px 10px;font-size:11.5px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .vp-link-combo-item:hover{background:#EEF3F8;}
  .vp-link-combo-empty,.vp-link-combo-hint{padding:6px 10px;font-size:11px;color:var(--muted);}"""
new_css = """  .vp-link-combo{position:relative;}
  .vp-link-combo-input{padding-right:22px;box-sizing:border-box;}
  .vp-link-combo-clear{position:absolute;right:3px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);font-size:13px;line-height:1;cursor:pointer;padding:3px 4px;}
  .vp-link-combo-clear:hover{color:var(--danger);}
  .vp-link-combo-list{position:absolute;top:100%;left:0;right:0;z-index:60;background:#fff;border:1px solid var(--line);border-radius:6px;max-height:220px;overflow-y:auto;box-shadow:0 4px 14px rgba(0,0,0,.14);margin-top:2px;}
  .vp-link-combo-item{padding:6px 10px;font-size:11.5px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .vp-link-combo-item:hover{background:#EEF3F8;}
  .vp-link-combo-empty,.vp-link-combo-hint{padding:6px 10px;font-size:11px;color:var(--muted);}"""
assert s.count(old_css) == 1, s.count(old_css)
s = s.replace(old_css, new_css)

old_html = """        <input type="text" class="vp-link-combo-input" value="${escapeHtml(label)}" placeholder="พิมพ์ค้นหา Activity หลัก หรือ Sub Activity (BOQ)..." autocomplete="off" title="ลิงก์สถานะนี้กับ Activity หลัก หรือ Sub Activity (BOQ) — เมื่อบันทึกจะอัปเดต % ให้ตรงกับ Progress อัตโนมัติ" style="width:100%;font-size:11.5px;">
        <input type="hidden" class="vp-link-combo-level" value="${level||''}">"""
new_html = """        <input type="text" class="vp-link-combo-input" value="${escapeHtml(label)}" placeholder="พิมพ์ค้นหา Activity หลัก หรือ Sub Activity (BOQ)..." autocomplete="off" title="ลิงก์สถานะนี้กับ Activity หลัก หรือ Sub Activity (BOQ) — เมื่อบันทึกจะอัปเดต % ให้ตรงกับ Progress อัตโนมัติ" style="width:100%;font-size:11.5px;">
        <button type="button" class="vp-link-combo-clear" title="ล้างลิงก์นี้" tabindex="-1">&times;</button>
        <input type="hidden" class="vp-link-combo-level" value="${level||''}">"""
assert s.count(old_html) == 1, s.count(old_html)
s = s.replace(old_html, new_html)

old_js = """        input.addEventListener('focus', ()=>{ closeAllLinkLists(); input.select(); showResults(true); });
        input.addEventListener('input', ()=> showResults(false));
        input.addEventListener('blur', ()=>{ setTimeout(()=>{ listEl.hidden = true; }, 150); });
        input.addEventListener('keydown', (e)=>{
          if(e.key === 'Escape'){ input.blur(); }
          if(e.key === 'Backspace' && !input.value){ levelEl.value = ''; refEl.value = ''; }
        });
      });"""
new_js = """        input.addEventListener('focus', ()=>{ closeAllLinkLists(); input.select(); showResults(true); });
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
      });"""
assert s.count(old_js) == 1, s.count(old_js)
s = s.replace(old_js, new_js)

with open(path, "w", encoding="utf-8") as f:
    f.write(s)

print("OK")
