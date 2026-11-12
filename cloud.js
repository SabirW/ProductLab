(() => {
 const keys=['products','custom-sections','campaigns','followup','winners','prompts'].map(name=>`productlab-${name}-v1`);
 const shared=new Set(keys.slice(4));
 let records=new Map(), userId=null, ready=false, busy=false;
 const status=text=>{document.querySelector('#app-header .local').textContent=text;};
 const scope=key=>shared.has(key)?window.productLabWorkspaceId:userId;
 window.productLabData={
  get:key=>structuredClone(records.get(key)?.data||[]),
  async load(){
   ready=false;document.getElementById('app-main').inert=true;status('Cloud: loading…');
   const client=window.productLabSupabase;
   const {data:auth,error:authError}=await client.auth.getUser();if(authError||!auth.user)throw Error(authError?.message||'Sign in required');userId=auth.user.id;
   const {data,error}=await client.from('app_collections').select('*').in('scope_id',[userId,window.productLabWorkspaceId]);
   if(error){status('Cloud: load failed');throw error;}
   records=new Map((data||[]).map(row=>[row.collection,row]));ready=true;document.getElementById('app-main').inert=false;status('Cloud: up to date');
  },
  async save(key,value){
   if(!ready||busy)throw Error('Cloud is not ready or another save is running.');
   if(!keys.includes(key)||!Array.isArray(value))throw Error('Invalid collection');
   busy=true;status('Cloud: saving…');
   try{
    const old=records.get(key);const row={scope_id:scope(key),collection:key,data:structuredClone(value),revision:(old?.revision||0)+1};
    let query=window.productLabSupabase.from('app_collections');
    query=old?query.update({data:row.data,revision:row.revision}).eq('scope_id',row.scope_id).eq('collection',key).eq('revision',old.revision):query.insert(row);
    const {data,error}=await query.select().maybeSingle();if(error)throw error;if(!data)throw Error('Another tab changed this data. Reload before saving again.');
    records.set(key,data);status('Cloud: up to date');
   }catch(error){status('Cloud save failed: '+error.message);throw error;}finally{busy=false;}
  }
 };
 const box=document.createElement('div');box.className='invite-box';
 const title=document.createElement('strong');title.textContent='Transfer your old browser data';
 const help=document.createElement('p');help.textContent='Open your updated local copy in the original browser and export. Then import the file here. Prompts and winner concepts will be shared with your workspace.';
 const exportButton=document.createElement('button');exportButton.type='button';exportButton.className='store-edit';exportButton.textContent='Export old browser data';
 const label=document.createElement('label');label.textContent='Import backup';const input=document.createElement('input');input.type='file';input.accept='.json,application/json';label.append(input);
 const result=document.createElement('p');result.setAttribute('role','status');
 exportButton.onclick=()=>{try{const collections={};for(const key of keys){const value=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(value))throw Error('Invalid old data');collections[key]=value;}const blob=new Blob([JSON.stringify({format:'productlab-backup-v1',collections},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='productlab-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);result.textContent='Backup exported. Keep it until the import is complete.';}catch(error){result.textContent=error.message;}};
 input.onchange=async()=>{const file=input.files[0];if(!file)return;try{const backup=JSON.parse(await file.text());if(backup.format!=='productlab-backup-v1'||!backup.collections)throw Error('Not a ProductLab backup');for(const key of keys){if(!Array.isArray(backup.collections[key])||backup.collections[key].some(item=>!item||typeof item.id!=='string'))throw Error('Invalid backup collection: '+key);}if(!confirm('Import this backup into your signed-in account? Prompts and winner concepts will be visible to your workspace. Existing entries with the same ID will be kept.'))return;await window.productLabData.load();for(const key of keys){const existing=window.productLabData.get(key);const ids=new Set(existing.map(item=>item.id));const additions=backup.collections[key].filter(item=>!ids.has(item.id));if(additions.length)await window.productLabData.save(key,[...existing,...additions]);}result.textContent='Import complete. Reloading…';location.reload();}catch(error){result.textContent='Import stopped: '+error.message+'. Your backup is unchanged. You can safely retry.';}finally{input.value='';}};
 box.append(title,help,exportButton,label,result);document.getElementById('workspace-settings-view').append(box);
})();
