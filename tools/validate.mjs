import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
export async function validate(root='content') {
 const read=async path=>{if(!/^[a-zA-Z0-9/_.-]+$/.test(path)||path.includes('..'))throw Error('Unsafe content path');const full=resolve(root,path);if(!full.startsWith(resolve(root)+sep))throw Error('Path escapes content');return readFile(full)};
 const index=JSON.parse(await read('catalog/v1/index.json'));if(index.schemaVersion!==1||!Array.isArray(index.items))throw Error('Invalid catalog');const ids=new Set();
 for(const entry of index.items){const art=JSON.parse(await read(entry.manifest));if(ids.has(art.id)||entry.id!==art.id)throw Error('Duplicate or mismatched ID');ids.add(art.id);if(art.schemaVersion!==1||!['p5','three'].includes(art.engine)||art.minimumRendererVersion!==1)throw Error('Unsupported manifest');if(!art.title||!art.description||!art.creator?.name||art.license!=='MIT')throw Error('Missing metadata');const source=await read(art.entry);if(source.length>1024*1024)throw Error('Package too large');if(createHash('sha256').update(source).digest('hex')!==art.checksum)throw Error('Checksum mismatch');await read(art.thumbnail);for(const p of art.parameters){if(!(Number.isFinite(p.min)&&p.min<p.max&&p.default>=p.min&&p.default<=p.max&&p.step>0))throw Error('Invalid parameter')};await stat(resolve(root,entry.manifest));}
 return {artworks:ids.size,revision:index.revision};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(await validate(process.argv[2]));
