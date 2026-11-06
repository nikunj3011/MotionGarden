import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {StaticCloudflareRepository} from '../../../packages/artwork-sdk';
export const repository=new StaticCloudflareRepository(import.meta.env.VITE_CONTENT_BASE_URL||'/');
export function useCatalog(){return useQuery({queryKey:['catalog'],queryFn:({signal})=>repository.list(signal),staleTime:60000})}
export function useFavorites(){
 const [favorites,setFavorites]=useState<string[]>(()=>{try{const saved=JSON.parse(localStorage.getItem('mg:favorites')||'[]');return Array.isArray(saved)?saved.filter(x=>typeof x==='string'):[]}catch{return []}});
 const [storageError,setStorageError]=useState('');
 const toggle=(id:string)=>{const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];setFavorites(next);try{localStorage.setItem('mg:favorites',JSON.stringify(next));setStorageError('')}catch{setStorageError('Saved for this visit. Device storage is unavailable.')}};
 return {favorites,toggle,storageError};
}
