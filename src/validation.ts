import {addresses,validEmail,MAX_BODY_BYTES,MAX_RECIPIENTS} from './mail';
import type {Report} from './reports';
export function validateDraft(draft:{to:string;cc:string;bcc:string;reports:Report[];subject:string;body:string}):Record<string,string>{
 const errors:Record<string,string>={};
 if(!validEmail(draft.to))errors['recipient-custom']='받는 메일 주소를 name@example.com 형식으로 입력하십시오.';
 for(const key of ['cc','bcc'] as const){if(addresses(draft[key]).some(value=>!validEmail(value)))errors['recipient-'+key]=key.toUpperCase()+' 주소를 확인하십시오. 여러 주소는 쉼표 또는 세미콜론으로 구분하십시오.';}
 if(1+addresses(draft.cc).length+addresses(draft.bcc).length>MAX_RECIPIENTS)errors['recipient-cc']='수신자·CC·BCC는 합계 '+MAX_RECIPIENTS+'명까지 입력할 수 있습니다.';
 for(const [index,item] of draft.reports.entries()){
  const prefix='신고 '+(index+1)+': ';
  if(!item.platform.trim())errors[item.id+'-platform']=prefix+'게시 플랫폼을 입력하십시오.';
  if(!item.url.trim())errors[item.id+'-url']=prefix+'게시물 URL을 입력하십시오.';
  else try{const parsed=new URL(item.url);if(!['https:','http:'].includes(parsed.protocol))throw Error();}catch{errors[item.id+'-url']=prefix+'http 또는 https로 시작하는 URL을 입력하십시오.';}
  if(!item.content.trim())errors[item.id+'-content']=prefix+'게시물 내용을 입력하십시오.';
 }
 if(!draft.subject.trim()||draft.subject.length>120||/[\x00-\x1f\x7f]/.test(draft.subject))errors['mail-subject']='메일 제목은 줄바꿈 없이 1~120자로 입력하십시오.';
 if(new TextEncoder().encode(draft.body).length>MAX_BODY_BYTES)errors['mail-body']='메일 본문이 너무 큽니다. 512 KB 이내로 줄이거나 신고를 나누어 작성하십시오.';
 if(!draft.body.trim())errors['mail-body']='메일 본문을 입력하십시오.';
 return errors;
}
