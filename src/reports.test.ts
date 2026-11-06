import {expect,it} from 'vitest';import {newReport,reportBody} from './reports';
it('uses all official fields in order for each report',()=>{
 const one={...newReport(),platform:'X',url:'https://example.org/1',author:'계정1',content:'첫 게시물',date:'2026-11-01',time:'14:30'};
 const two={...newReport(),platform:'유튜브',url:'https://example.org/2',content:'두 번째 게시물',date:'2026-10-30'};
 const body=reportBody([one,two],[{name:'신고1_캡처.png'} as File]);
 expect(body).toContain('게시물 2건');expect(body).toContain('[신고 1]');expect(body).toContain('[신고 2]');
 expect(body).toContain('게시 일시: 2026-11-01 14:30');
 expect(body).toContain('게시 일시: 2026-10-30 (시간 확인 불가)');
 expect(body).toContain('게시 플랫폼 및 URL: X / https://example.org/1');expect(body).toContain('게시 플랫폼 및 URL: 유튜브 / https://example.org/2');
 const section=body.split('[신고 1]')[1].split('[신고 2]')[0];
 const labels=['게시 일시:','게시 플랫폼 및 URL:','게시물 작성자(닉네임, ID 등):','게시물 내용:','첨부 자료:'];
 const positions=labels.map(label=>section.indexOf(label));expect(positions.every((value,index)=>value>=0&&(index===0||value>positions[index-1]))).toBe(true);
 expect(body).toContain('첨부 자료: 신고1_캡처.png');expect(one.id).not.toBe(two.id);
});
it('does not invent unknown publication date or author',()=>{
 const body=reportBody([newReport()],[]);expect(body).toContain('게시 일시: 확인 불가');expect(body).toContain('게시물 작성자(닉네임, ID 등): 확인 불가');expect(body).toContain('첨부 자료: 없음');
});
