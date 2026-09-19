import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useGoalApi } from './goalApi';
import type { CreateGoalInput, FinanceGoal, UpdateGoalInput } from './types';

export function useGoals(){
 const {status}=useAuth(); const api=useGoalApi(); const [goals,setGoals]=useState<FinanceGoal[]>([]); const [loading,setLoading]=useState(false); const [error,setError]=useState<Error|null>(null);
 const refresh=useCallback(async()=>{if(status!=='authenticated'||!api.ready){setGoals([]);return;}setLoading(true);setError(null);try{setGoals(await api.listGoals('active'));}catch(cause){setError(cause instanceof Error?cause:new Error('Failed to load goals.'));}finally{setLoading(false);}},[api,status]);
 const create=useCallback(async(i:CreateGoalInput)=>{const v=await api.createGoal(i);await refresh();return v;},[api,refresh]);
 const update=useCallback(async(id:string,i:UpdateGoalInput)=>{const v=await api.updateGoal(id,i);await refresh();return v;},[api,refresh]);
 const archive=useCallback(async(id:string)=>{const v=await api.archiveGoal(id);await refresh();return v;},[api,refresh]);
 useEffect(()=>{void refresh();},[refresh]);
 return {goals,loading,error,refresh,create,update,archive,ready:api.ready};
}
