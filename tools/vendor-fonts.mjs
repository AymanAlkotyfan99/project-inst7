// One-time download of SIL Open Font License fonts for fully local delivery.
import { mkdir, writeFile, access } from 'node:fs/promises';
const query='https://fonts.googleapis.com/css2?family=Amiri:wght@400&family=IBM+Plex+Sans+Arabic:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap';
const response=await fetch(query,{headers:{'User-Agent':'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}});
if(!response.ok) throw new Error('Font stylesheet unavailable');
let css=await response.text();
await mkdir('assets/fonts',{recursive:true});
const urls=[...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]))];
for (const [i,url] of urls.entries()) {
  const file=`font-${i+1}.woff2`;
  let exists = false;
  try { await access(`assets/fonts/${file}`); exists=true; } catch {}
  if (!exists) {
    let downloaded = false;
    for (let attempt=0;attempt<3&&!downloaded;attempt++) {
      try {
        const res=await fetch(url);
        if(!res.ok)throw new Error(`Font download ${res.status}`);
        await writeFile(`assets/fonts/${file}`,Buffer.from(await res.arrayBuffer()));
        downloaded=true;
      } catch(error) { if(attempt===2) throw error; }
    }
  }
  css=css.split(url).join(file);
}
await writeFile('assets/fonts/fonts.css',css);
for(const family of ['amiri','ibmplexsansarabic','cormorantgaramond']){
  const res=await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`);
  if(res.ok)await writeFile(`assets/fonts/LICENSE-${family}.txt`,await res.text());
}
console.log(`Downloaded ${urls.length} font subsets with licenses.`);
