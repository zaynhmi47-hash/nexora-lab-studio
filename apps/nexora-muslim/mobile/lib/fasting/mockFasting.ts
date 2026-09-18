import type {FastingPort} from './types';
export const mockFasting:FastingPort={async getSnapshot(){return{summary:{fastedDays:8,brokenDays:1,excusedDays:0},records:[]};},async toggleToday(){return{id:'demo-today',date:new Date().toISOString().slice(0,10),status:'fasted',note:''};}};
