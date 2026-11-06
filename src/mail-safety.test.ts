import {expect,it} from 'vitest';
import {attachmentError,assertEnvelope,MAX_BODY_BYTES,MAX_FILES,MAX_RECIPIENTS,mime,validEmail} from './mail';
const mail={to:'me@example.org',cc:[],bcc:[],subject:'신고',body:'본문',files:[]};
it.each(['.a@example.org','a.@example.org','a..b@example.org','a'.repeat(65)+'@example.org','a@'+ 'x'.repeat(64)+'.org'])('rejects malformed mailbox %s',value=>{expect(validEmail(value)).toBe(false);});
it('rejects an empty attachment and excessive attachment count before reading',()=>{expect(attachmentError([{name:'empty',size:0} as File])).toBeTruthy();expect(attachmentError(Array.from({length:MAX_FILES+1},()=>({size:1} as File)))).toBeTruthy();});
it('caps UTF-8 body bytes and total recipient count',()=>{expect(()=>assertEnvelope({...mail,body:'a'.repeat(MAX_BODY_BYTES+1)})).toThrow('512');expect(()=>assertEnvelope({...mail,cc:Array.from({length:MAX_RECIPIENTS},()=> 'cc@example.org')})).toThrow('50');});
it('folds long UTF-8 filenames losslessly and keeps every MIME line below 998 bytes',async()=>{
 const name='신고증거📎'.repeat(50)+'.png';const file={name,size:3,type:'image/png',arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer} as File;
 const raw=await mime({...mail,cc:['a@example.org','b@example.org'],files:[file]});
 const decoded=atob(raw.replace(/-/g,'+').replace(/_/g,'/'));const parameters=[...decoded.matchAll(/filename\*\d+\*=(?:UTF-8'')?([^;\r\n]+)/g)].map(match=>match[1]);
 expect(decodeURIComponent(parameters.join(''))).toBe(name);expect(decoded.split('\r\n').every(line=>line.length<998)).toBe(true);expect(decoded).toContain('Cc: a@example.org,\r\n b@example.org');
});
