import { catalogSchema, manifestSchema, type ArtworkManifest } from '../artwork-contracts';
export interface ArtworkRepository { list(signal?:AbortSignal):Promise<ArtworkManifest[]>; get(id:string,signal?:AbortSignal):Promise<ArtworkManifest>; }
export interface FutureApiRepository extends ArtworkRepository { saveDraft(id:string,source:string):Promise<void>; }
export class StaticCloudflareRepository implements ArtworkRepository {
 constructor(public baseUrl='/',private storage:Storage|undefined=typeof localStorage==='undefined'?undefined:localStorage){}
 async json(path:string,signal?:AbortSignal):Promise<unknown>{
  const url=new URL(path,new URL(this.baseUrl,location.href)).href; const key=`motiongarden:${url}`;
  let cached:{etag?:string;data:unknown}|undefined;try{cached=JSON.parse(this.storage?.getItem(key)||'null')||undefined}catch{}
  let last:unknown;
  for(let n=0;n<2;n++){try{const response=await fetch(url,{signal,headers:cached?.etag?{'If-None-Match':cached.etag}:{}});if(response.status===304&&cached)return cached.data;if(!response.ok)throw Error(`Content request failed (${response.status})`);const data=await response.json();try{this.storage?.setItem(key,JSON.stringify({etag:response.headers.get('etag'),data}))}catch{}return data;}catch(error){if(signal?.aborted)throw error;last=error;}}
  if(cached)return cached.data;throw last;
 }
 async list(signal?:AbortSignal){const catalog=catalogSchema.parse(await this.json('catalog/v1/index.json',signal));return Promise.all(catalog.items.map(async item=>manifestSchema.parse(await this.json(item.manifest,signal))));}
 async get(id:string,signal?:AbortSignal){const list=await this.list(signal);const found=list.find(item=>item.id===id);if(!found)throw Error('Artwork not found');return found;}
}
