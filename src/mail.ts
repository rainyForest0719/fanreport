export const SCOPE = 'https://www.googleapis.com/auth/gmail.send';
export const MAX_BYTES = 18 * 1024 * 1024;
export const MAX_FILES=30, MAX_RECIPIENTS=50, MAX_BODY_BYTES=512*1024;
export type Envelope = {to: string; cc: string[]; bcc: string[]; subject: string; body: string; files: File[]};
export function addresses(value: string): string[] {
  return value.trim() ? value.split(/[,;]+/).map(x=>x.trim()) : [];
}
export function validEmail(value: string): boolean {
  if(value.length>254||/[\x00-\x20\x7f]/.test(value))return false;
  const parts=value.split('@');if(parts.length!==2)return false;
  const [local,domain]=parts;
  return local.length<=64 && !!local && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..')
    && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)
    && domain.length<=253 && domain.includes('.') && domain.split('.').every(label=>label.length>0&&label.length<=63&&/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label));

}
export function recipients(to: string, cc: string, bcc: string) {
  return {to: to.trim(), cc: addresses(cc), bcc: addresses(bcc)};
}
export function base64(bytes: Uint8Array): string {
  let binary = ''; for(let i=0;i<bytes.length;i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
}
const utf8 = (s: string) => base64(new TextEncoder().encode(s));
const wrapped = (s:string) => s.match(/.{1,76}/g)?.join('\r\n') || '';
export function attachmentError(files:File[]):string|undefined {
 if(files.length>MAX_FILES)return '첨부 자료는 최대 '+MAX_FILES+'개까지 선택할 수 있습니다.';
 if(files.some(f=>!Number.isSafeInteger(f.size)||f.size<=0))return '비어 있거나 읽을 수 없는 파일이 있습니다. 파일을 확인한 후 다시 선택하십시오.';
 if(files.reduce((n,f)=>n+f.size,0)>MAX_BYTES)return '첨부 자료의 합계는 18 MB 이하여야 합니다.';
}
export function assertEnvelope(mail:Envelope){
 if(!validEmail(mail.to)||[...mail.cc,...mail.bcc].some(x=>!validEmail(x)))throw new Error('메일 주소를 확인하십시오.');
 if(1+mail.cc.length+mail.bcc.length>MAX_RECIPIENTS)throw new Error('수신자·CC·BCC는 합계 '+MAX_RECIPIENTS+'명까지 입력할 수 있습니다.');
 if(!mail.subject.trim()||mail.subject.length>120||/[\x00-\x1f\x7f]/.test(mail.subject))throw new Error('메일 제목을 확인하십시오.');
 if(!mail.body.trim()||new TextEncoder().encode(mail.body).length>MAX_BODY_BYTES)throw new Error('본문은 비어 있지 않아야 하며 512 KB 이하여야 합니다.');
 const problem=attachmentError(mail.files);if(problem)throw new Error(problem);
}
function filenameParameters(name:string):string[] {
 const encoded=encodeURIComponent(name).replace(/'/g,'%27'),tokens=encoded.match(/%[0-9A-F]{2}|./g)||[];
 const pieces:string[]=[];let part='';
 for(const token of tokens){if(part.length+token.length>54){pieces.push(part);part='';}part+=token;}
 pieces.push(part);
 return pieces.map((piece,index)=>' filename*'+index+"*="+(index===0?"UTF-8''":'')+piece);
}
export async function mime(mail: Envelope): Promise<string> {
 assertEnvelope(mail);
 const boundary = 'fanreport_' + crypto.randomUUID();
 const folded=(name:string,values:string[])=>name+': '+values.join(',\r\n ');
 const lines = [folded('To',[mail.to]), ...(mail.cc.length ? [folded('Cc',mail.cc)] : []), ...(mail.bcc.length ? [folded('Bcc',mail.bcc)] : []), 'Subject: '+Array.from(mail.subject).reduce<string[]>((parts,char,i)=>{if(i%10===0)parts.push('');parts[parts.length-1]+=char;return parts;},[]).map(part=>'=?UTF-8?B?'+utf8(part)+'?=').join('\r\n '), 'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="'+boundary+'"', '', '--'+boundary, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrapped(utf8(mail.body))];
 for(const file of mail.files){
  const type=/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(file.type)?file.type:'application/octet-stream';
  const params=filenameParameters(file.name);
  lines.push('--'+boundary,'Content-Type: '+type,'Content-Disposition: attachment;\r\n'+params.join(';\r\n'),'Content-Transfer-Encoding: base64','',wrapped(base64(new Uint8Array(await file.arrayBuffer()))));
 }
 lines.push('--'+boundary+'--','');
 return utf8(lines.join('\r\n')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
