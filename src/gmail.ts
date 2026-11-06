import {SCOPE, mime, type Envelope} from './mail';
type TokenResponse = {access_token?:string; expires_in?:number; scope?:string; error?:string};
type Client = {requestAccessToken: (options:{prompt:string})=>void};
declare global { interface Window { google?: {accounts:{oauth2:{initTokenClient:(config:{client_id:string;scope:string;include_granted_scopes:boolean;callback:(r:TokenResponse)=>void;error_callback:()=>void})=>Client;revoke:(token:string,done:()=>void)=>void}}} } }
let pending: Promise<void> | undefined;
export const GOOGLE_LOAD_TIMEOUT_MS=15_000, GOOGLE_CONNECT_TIMEOUT_MS=120_000;
export function loadGoogle() {
  if(window.google) return Promise.resolve();
  if(pending) return pending;
  pending = new Promise<void>((resolve,reject)=>{
    const script=document.createElement('script'); script.src='https://accounts.google.com/gsi/client'; script.async=true; script.referrerPolicy=['localhost','127.0.0.1','[::1]'].includes(location.hostname)?'no-referrer-when-downgrade':'strict-origin-when-cross-origin';
    const fail=()=>{clearTimeout(timer);script.onload=null;script.onerror=null;script.remove();pending=undefined;reject(new Error('Google 연결을 준비하지 못했습니다. 네트워크 상태를 확인한 후 다시 시도하십시오.'));};
    const timer=setTimeout(fail,GOOGLE_LOAD_TIMEOUT_MS);
    script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=fail;
    document.head.append(script);
  }); return pending;
}
export function connect(clientId:string):Promise<{value:string;expires:number}> {
  return new Promise((resolve,reject)=>{
    if(!window.google) return reject(new Error('Google 연결 준비가 필요합니다.'));
    let settled=false;
    const finish=(error?:Error,result?:{value:string;expires:number})=>{if(settled)return;settled=true;clearTimeout(timer);if(error)reject(error);else resolve(result!);};
    const timer=setTimeout(()=>finish(new Error('Google 연결 대기 시간이 초과되었습니다. 다시 연결하십시오.')),GOOGLE_CONNECT_TIMEOUT_MS);
    let client:Client;
    try{client=window.google.accounts.oauth2.initTokenClient({client_id:clientId,scope:SCOPE,include_granted_scopes:false,
      callback:r=>{
        if(r.error || !r.access_token || !r.scope?.split(' ').includes(SCOPE)) return finish(new Error('Gmail 발송 권한이 승인되지 않았습니다.'));
        finish(undefined,{value:r.access_token,expires:Date.now()+(r.expires_in || 3600)*1000-30000});
      },error_callback:()=>finish(new Error('Google 연결 창이 닫혔거나 열리지 않았습니다.'))});
    client.requestAccessToken({prompt:'consent'});
    }catch{finish(new Error('Google 연결 창을 열지 못했습니다. 팝업 설정을 확인하십시오.'));}
  });
}
export class DeliveryError extends Error {
 constructor(message:string,public kind:'unauthorized'|'rejected'|'unknown'){super(message);this.name='DeliveryError';}
}
export const SEND_TIMEOUT_MS=60_000;
export async function send(token:string,mail:Envelope){
 const raw=await mime(mail);
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),SEND_TIMEOUT_MS);
 try{
  const response=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',credentials:'omit',cache:'no-store',signal:controller.signal,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({raw})});
  if(!response.ok){
   if(response.status===401)throw new DeliveryError('Gmail 연결이 만료되었거나 취소되었습니다. 다시 연결하십시오.','unauthorized');
   if(response.status>=500)throw new DeliveryError('Google 서버 오류로 발송 결과를 확인하지 못했습니다. 재발송 전 보낸메일함을 확인하십시오.','unknown');
   throw new DeliveryError('Google이 요청을 거부했습니다 ('+response.status+'). 주소·권한·발송 한도를 확인하십시오. 자동 재시도하지 않습니다.','rejected');
  }
  const result:unknown=await response.json();
  if(!result||typeof result!=='object'||!('id' in result)||typeof result.id!=='string'||!result.id.trim())throw new DeliveryError('발송 확인 정보를 받지 못했습니다. 재발송 전 보낸메일함을 확인하십시오.','unknown');
  return result.id;
 }catch(error){
  if(error instanceof DeliveryError)throw error;
  throw new DeliveryError(controller.signal.aborted?'응답 대기 시간이 초과되었습니다. 이미 발송되었을 수 있으므로 Gmail 보낸메일함을 확인하십시오.':'연결 문제로 발송 결과를 확인하지 못했습니다. 이미 발송되었을 수 있으므로 Gmail 보낸메일함을 확인하십시오.','unknown');
 }finally{clearTimeout(timer);}
}
