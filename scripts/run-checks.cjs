const {spawnSync}=require('node:child_process');
const path=require('node:path');
const prerender=spawnSync(process.execPath,[path.join(__dirname,'prerender-home.cjs'),'--check'],{stdio:'inherit',windowsHide:true});
if(prerender.status!==0)process.exit(prerender.status??1);
const guides=spawnSync(process.execPath,[path.join(__dirname,'build-guides.cjs'),'--check'],{stdio:'inherit',windowsHide:true});
if(guides.status!==0)process.exit(guides.status??1);
for(const file of ['check-site.cjs','check-growth.cjs','check-flappy.cjs','check-wordstreak.cjs','check-quality.cjs','check-retention.cjs']){
  const result=spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit',windowsHide:true});
  if(result.status!==0)process.exit(result.status??1);
}
