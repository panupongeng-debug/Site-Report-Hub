import os

path = os.path.join(os.environ["HOME"], "mnt/Site-Report-Hub/index.html")
with open(path, "r", encoding="utf-8") as f:
    s = f.read()

old = """  async function deleteStorageObjectByUrl(url){
    try{ const path = url.split(STORAGE_PUBLIC)[1]; if(!path) return; await fetch(STORAGE_OBJ + path, { method:'DELETE', headers: HEADERS }); }
    catch(e){ console.warn('could not delete storage object', e); }
  }"""
new = """  async function deleteStorageObjectByUrl(url){
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
  }"""
assert s.count(old) == 1, s.count(old)
s = s.replace(old, new)

with open(path, "w", encoding="utf-8") as f:
    f.write(s)

print("OK")
