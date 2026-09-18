import type {AuthSession} from '@/lib/auth/types';
import type {FastingPort,FastingRecord,FastingSnapshot} from './types';
const baseUrl=process.env.EXPO_PUBLIC_NEXORA_CORE_URL??'http://localhost:8000';
async function request<T>(s:AuthSession,path:string,init?:RequestInit):Promise<T>{const r=await fetch(baseUrl+'/api/v1/fasting/'+path,{...init,headers:{Accept:'application/json',Authorization:'Bearer '+s.accessToken,...(init?.headers??{})}});if(!r.ok)throw new Error('Fasting request failed ('+r.status+').');return await r.json() as T;}
export function nexoraCoreFastingRepository(s:AuthSession):FastingPort{return{getSnapshot:()=>request<FastingSnapshot>(s,''),toggleToday:()=>request<FastingRecord>(s,'today/toggle/',{method:'POST'})};}
