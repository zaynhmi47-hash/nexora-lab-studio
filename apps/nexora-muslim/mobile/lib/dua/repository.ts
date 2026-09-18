import type {DuaEntry,DuaPort} from './types';
const baseUrl=process.env.EXPO_PUBLIC_NEXORA_CORE_URL??'http://localhost:8000';
export const nexoraCoreDuaRepository=(category?:string):DuaPort=>({list:async()=>{const q=category?'?category='+encodeURIComponent(category):'';const r=await fetch(baseUrl+'/api/v1/dua/'+q,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error('Dua request failed ('+r.status+').');return await r.json() as DuaEntry[];}});
