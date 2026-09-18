export type HijriEvent={id:string;date:string;hijriMonth:number;hijriDay:number;title:string;description:string}; export interface CalendarPort{events():Promise<HijriEvent[]>;}
