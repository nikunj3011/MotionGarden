import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validate} from './validate.mjs';
test('published catalog and artwork checksums are consistent',async()=>assert.equal((await validate()).artworks,2));
test('validator rejects modified artwork bytes',async()=>{const temp=await mkdtemp(join(tmpdir(),'mg-test-'));try{await cp('content',temp,{recursive:true});await writeFile(join(temp,'artworks/flow-field/v1/sketch.js'),'tampered');await assert.rejects(validate(temp),/Checksum mismatch/)}finally{await rm(temp,{recursive:true,force:true})}});
test('validator rejects catalog path traversal',async()=>{const temp=await mkdtemp(join(tmpdir(),'mg-test-'));try{await cp('content',temp,{recursive:true});const path=join(temp,'catalog/v1/index.json');const index=JSON.parse(await readFile(path));index.items[0].manifest='../private.json';await writeFile(path,JSON.stringify(index));await assert.rejects(validate(temp),/Unsafe content path/)}finally{await rm(temp,{recursive:true,force:true})}});
