const {spawnSync}=require('node:child_process');
const path=require('node:path');
for(const file of ['check-site.cjs','check-growth.cjs','check-flappy.cjs','check-wordstreak.cjs','check-quality.cjs']){
  const result=spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit',windowsHide:true});
  if(result.status!==0)process.exit(result.status??1);
}
