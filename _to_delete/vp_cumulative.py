import os

path = os.path.join(os.environ["HOME"], "mnt/Site-Report-Hub/index.html")
with open(path, "r", encoding="utf-8") as f:
    s = f.read()

old_anchor = """  function legendGroupsOf(plan){"""
new_anchor = """  // Cumulative completion: a mark placed at a later step in a group's
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
  function legendGroupsOf(plan){"""
assert s.count(old_anchor) == 1, s.count(old_anchor)
s = s.replace(old_anchor, new_anchor)

old_2d_badge = """              const cnt = vpShapes.filter(s=> shapeGroupId(s)===g.id && s.color===item.color).length;"""
new_2d_badge = """              const cnt = vpShapes.filter(s=> shapeGroupId(s)===g.id && vpCumulativeColors(g,item).includes(s.color)).length;"""
assert s.count(old_2d_badge) == 2, s.count(old_2d_badge)
s = s.replace(old_2d_badge, new_2d_badge)

old_3d_badge = """              const cnt = Object.values(vpAssignments).filter(e=> e && (e.group||'_default')===g.id && e.color===item.color).length;"""
new_3d_badge = """              const cnt = Object.values(vpAssignments).filter(e=> e && (e.group||'_default')===g.id && vpCumulativeColors(g,item).includes(e.color)).length;"""
assert s.count(old_3d_badge) == 2, s.count(old_3d_badge)
s = s.replace(old_3d_badge, new_3d_badge)

old_sync_call = """        const cnt = countFn(g.id, item.color);"""
new_sync_call = """        const cnt = countFn(g.id, vpCumulativeColors(g, item));"""
assert s.count(old_sync_call) == 1, s.count(old_sync_call)
s = s.replace(old_sync_call, new_sync_call)

old_countfn_2d = """            const countFn = (gid, color) => vpShapes.filter(s => shapeGroupId(s) === gid && s.color === color).length;"""
new_countfn_2d = """            const countFn = (gid, colors) => vpShapes.filter(s => shapeGroupId(s) === gid && colors.includes(s.color)).length;"""
assert s.count(old_countfn_2d) == 1, s.count(old_countfn_2d)
s = s.replace(old_countfn_2d, new_countfn_2d)

old_countfn_3d = """            const countFn = (gid, color) => Object.values(vpAssignments).filter(e => e && (e.group||'_default') === gid && e.color === color).length;"""
new_countfn_3d = """            const countFn = (gid, colors) => Object.values(vpAssignments).filter(e => e && (e.group||'_default') === gid && colors.includes(e.color)).length;"""
assert s.count(old_countfn_3d) == 1, s.count(old_countfn_3d)
s = s.replace(old_countfn_3d, new_countfn_3d)

old_row_html = """          ${linkComboHtml(it._id, it.link_level, it.link_ref)}
          <button type="button" class="vp-rm-row" data-gid="${g._gid}" data-row="${it._id}" style="flex:0 0 auto;background:none;border:none;color:var(--danger);font-size:18px;cursor:pointer;">&times;</button>
        </div>`).join('')}"""
new_row_html = """          ${linkComboHtml(it._id, it.link_level, it.link_ref)}
          <div style="display:flex;flex-direction:column;flex:0 0 auto;">
            <button type="button" class="vp-row-up" data-gid="${g._gid}" data-row="${it._id}" title="เลื่อนขึ้น (ลำดับสะสมก่อนหน้า)" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;line-height:1;padding:1px 4px;">▲</button>
            <button type="button" class="vp-row-down" data-gid="${g._gid}" data-row="${it._id}" title="เลื่อนลง (ลำดับสะสมถัดไป)" style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;line-height:1;padding:1px 4px;">▼</button>
          </div>
          <button type="button" class="vp-rm-row" data-gid="${g._gid}" data-row="${it._id}" style="flex:0 0 auto;background:none;border:none;color:var(--danger);font-size:18px;cursor:pointer;">&times;</button>
        </div>`).join('')}"""
assert s.count(old_row_html) == 1, s.count(old_row_html)
s = s.replace(old_row_html, new_row_html)

old_wire_rm_row = """      modal.querySelectorAll('.vp-rm-row').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          syncGroupsFromDom();
          const gid = Number(btn.dataset.gid), rid = Number(btn.dataset.row);
          const g = state.groups.find(x=>x._gid===gid);
          if(g) g.rows = g.rows.filter(r=>r._id!==rid);
          renderGroups();
        });
      });"""
new_wire_rm_row = """      modal.querySelectorAll('.vp-rm-row').forEach(btn=>{
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
      });"""
assert s.count(old_wire_rm_row) == 1, s.count(old_wire_rm_row)
s = s.replace(old_wire_rm_row, new_wire_rm_row)

with open(path, "w", encoding="utf-8") as f:
    f.write(s)

print("OK")
