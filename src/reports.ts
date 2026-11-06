export type Report={id:string;platform:string;url:string;author:string;date:string;time:string;content:string};
export function newReport():Report{return {id:crypto.randomUUID(),platform:'',url:'',author:'',date:'',time:'',content:''};}
export function reportBody(reports:Report[],files:File[]):string {
 const attachments=files.length?files.map(f=>f.name).join(', '):'없음';
 return ['안녕하세요. 담당자님.','아래 게시물 '+reports.length+'건에 대한 확인과 검토를 요청드립니다.','',
 ...reports.flatMap((item,index)=>['[신고 '+(index+1)+']',
 '게시 일시: '+(item.date ? item.date+(item.time?' '+item.time:' (시간 확인 불가)') : item.time?'날짜 확인 불가 / '+item.time:'확인 불가'),
 '게시 플랫폼 및 URL: '+(item.platform||'미입력')+' / '+(item.url||'미입력'),
 '게시물 작성자(닉네임, ID 등): '+(item.author||'확인 불가'),
 '게시물 내용:',item.content||'게시물의 내용과 확인한 사실을 작성해 주세요.',
 '첨부 자료: '+attachments+(reports.length>1&&files.length?' (전체 신고 공통 첨부)':''),'']),
 '감사합니다.'].join('\n');
}
