import { nexverseApiRequest } from './moderation';
export type CreatorChapter={id:string;number:number;title:string;summary:string;content:string;freePreview:boolean;status:'draft'|'published'};
export type CreatorWork={id:string;title:string;synopsis:string;genre:string;language:string;reviewStatus:'draft'|'submitted'|'approved'|'rejected';publicationStatus:string;reviewNote:string;chapters?:CreatorChapter[]};
export type CreatorProfile={isCreator:boolean;penName?:string;bio?:string};
export const getCreatorProfile=()=>nexverseApiRequest<CreatorProfile>('/nexverse/creator/profile/');
export const createCreatorProfile=(penName:string,bio:string)=>nexverseApiRequest<CreatorProfile>('/nexverse/creator/profile/',{method:'POST',body:JSON.stringify({penName,bio})});
export const getCreatorWorks=()=>nexverseApiRequest<{items:CreatorWork[]}>('/nexverse/creator/works/');
export const createCreatorWork=(input:{title:string;synopsis:string;genre:string;language:string})=>nexverseApiRequest<CreatorWork>('/nexverse/creator/works/',{method:'POST',body:JSON.stringify(input)});
export const getCreatorWork=(id:string)=>nexverseApiRequest<CreatorWork>('/nexverse/creator/works/'+encodeURIComponent(id)+'/');
export const addCreatorChapter=(id:string,input:{number:number;title:string;content:string;summary:string;freePreview:boolean})=>nexverseApiRequest<CreatorChapter>('/nexverse/creator/works/'+encodeURIComponent(id)+'/chapters/',{method:'POST',body:JSON.stringify(input)});
export const submitCreatorWork=(id:string)=>nexverseApiRequest<CreatorWork>('/nexverse/creator/works/'+encodeURIComponent(id)+'/submit/',{method:'POST',body:'{}'});

export type CreatorChapterPrice = {
  isPriced: boolean;
  price: { currency: string; amountMinor: number; isActive: boolean } | null;
};
export const getCreatorChapterPrice = (workId: string, chapterId: string) =>
  nexverseApiRequest<CreatorChapterPrice>(
    '/nexverse/creator/works/' + encodeURIComponent(workId) + '/chapters/' +
    encodeURIComponent(chapterId) + '/price/',
  );
export const setCreatorChapterPrice = (
  workId: string,
  chapterId: string,
  input: { amountMinor: number; currency: string },
) =>
  nexverseApiRequest<CreatorChapterPrice>(
    '/nexverse/creator/works/' + encodeURIComponent(workId) + '/chapters/' +
    encodeURIComponent(chapterId) + '/price/',
    { method: 'PUT', body: JSON.stringify(input) },
  );
export const deactivateCreatorChapterPrice = (workId: string, chapterId: string) =>
  nexverseApiRequest<{ isPriced: boolean; deactivated: boolean }>(
    '/nexverse/creator/works/' + encodeURIComponent(workId) + '/chapters/' +
    encodeURIComponent(chapterId) + '/price/',
    { method: 'DELETE' },
  );
