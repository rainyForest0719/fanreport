import {describe,it,expect} from 'vitest';
import {recipients,validEmail,mime} from './mail';
describe('recipient safety',()=>{
 it('rejects injected headers and malformed mailboxes',()=>{expect(validEmail('x@example.org\r\nBcc: victim@example.org')).toBe(false);expect(validEmail('a@example.org')).toBe(true);expect(validEmail('a@example.org,')).toBe(false);});
 it('retains all normal CC recipients',()=>{expect(recipients('a@example.org',' b@example.org; c@example.org ','hidden@example.org')).toEqual({to:'a@example.org',cc:['b@example.org','c@example.org'],bcc:['hidden@example.org']});});
});
describe('MIME',()=>{
 it('encodes UTF-8 body and attachments with no Bcc',async()=>{
 const file={name:'증거.png',size:3,type:'image/png',arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer} as File;
 const raw=await mime({to:'test@example.org',cc:[],bcc:[],subject:'신고',body:'증거 내용',files:[file]});
 const decoded=new TextDecoder().decode(Uint8Array.from(atob(raw.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0)));
 expect(decoded).toContain('To: test@example.org');expect(decoded).not.toContain('Cc:');expect(decoded).toContain("filename*0*=UTF-8''");expect(decoded).toContain('AQID');expect(decoded).toContain('7Kad6rGwIOuCtOyaqQ==');
 });
 it('blocks subject header injection',async()=>{await expect(mime({to:'test@example.org',cc:[],bcc:[],subject:'hello\r\nBcc: x@example.org',body:'x',files:[]})).rejects.toThrow();});
});


it('encodes BCC for Gmail routing and rejects injected BCC',async()=>{const mail={to:'a@example.org',cc:[],bcc:['hidden@example.org'],subject:'신고',body:'내용',files:[]};const raw=await mime(mail);expect(atob(raw.replace(/-/g,'+').replace(/_/g,'/'))).toContain('Bcc: hidden@example.org');await expect(mime({...mail,bcc:['hidden@example.org\r\nCc: x@example.org']})).rejects.toThrow();});
