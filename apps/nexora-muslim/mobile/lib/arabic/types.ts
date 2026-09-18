export type ArabicLessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type ArabicLessonKind = 'vocabulary' | 'phrase' | 'practice';
export type ArabicLesson = { id:string; pathId:string; title:string; description:string; kind:ArabicLessonKind; order:number; xpReward:number; status:ArabicLessonStatus };
export type ArabicPath = { id:string; title:string; description:string; lessons:ArabicLesson[] };
export type ArabicProgress = { userId:string; xpEarned:number; currentStreak:number; completedLessonIds:string[]; lastCompletedAt:string|null };
export type ArabicPracticeItem = { id:string; lessonId:string; prompt:string; options:string[]; correctOptionIndex:number; explanation:string };
export interface ArabicPort { getPaths():Promise<ArabicPath[]>; getProgress():Promise<ArabicProgress>; getPractice(lessonId:string):Promise<ArabicPracticeItem[]>; completeLesson(lessonId:string):Promise<ArabicProgress>; }
