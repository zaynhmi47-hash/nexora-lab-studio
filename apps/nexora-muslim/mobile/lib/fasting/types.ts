export type FastingStatus='fasted'|'broken'|'excused';
export type FastingRecord={id:string;date:string;status:FastingStatus;note:string};
export type FastingSnapshot={summary:{fastedDays:number;brokenDays:number;excusedDays:number};records:FastingRecord[]};
export interface FastingPort{getSnapshot():Promise<FastingSnapshot>;toggleToday():Promise<FastingRecord>;}
