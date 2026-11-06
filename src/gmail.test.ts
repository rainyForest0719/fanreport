import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {send,DeliveryError,SEND_TIMEOUT_MS,connect,GOOGLE_CONNECT_TIMEOUT_MS} from './gmail';
const mail={to:'tester@example.org',cc:[],bcc:[],subject:'신고',body:'모의 시험',files:[]};
beforeEach(()=>{vi.stubGlobal('fetch',vi.fn());});
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
describe('Gmail transport without external network',()=>{
 it('requires a genuine-shaped message ID from a successful response',async()=>{vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({id:'message-test-id'}),{status:200}));await expect(send('mock-token',mail)).resolves.toBe('message-test-id');expect(fetch).toHaveBeenCalledTimes(1);const request=vi.mocked(fetch).mock.calls[0][1]!;expect(request.credentials).toBe('omit');expect(request.cache).toBe('no-store');});
 it.each([{}, {id:123}, {id:''}])('does not report success for invalid confirmation %j',async(result)=>{vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(result),{status:200}));await expect(send('mock-token',mail)).rejects.toMatchObject({kind:'unknown'});expect(fetch).toHaveBeenCalledTimes(1);});
 it('clearly identifies expired authorization',async()=>{vi.mocked(fetch).mockResolvedValue(new Response('{}',{status:401}));await expect(send('mock-token',mail)).rejects.toMatchObject({kind:'unauthorized'});});
 it.each([403,429])('does not automatically retry rejection %s',async(status)=>{vi.mocked(fetch).mockResolvedValue(new Response('{}',{status}));await expect(send('mock-token',mail)).rejects.toMatchObject({kind:'rejected'});expect(fetch).toHaveBeenCalledTimes(1);});
 it('treats server errors as uncertain instead of claiming no delivery',async()=>{vi.mocked(fetch).mockResolvedValue(new Response('{}',{status:503}));await expect(send('mock-token',mail)).rejects.toMatchObject({kind:'unknown'});expect(fetch).toHaveBeenCalledTimes(1);});
 it('does not retry a broken connection',async()=>{vi.mocked(fetch).mockRejectedValue(new TypeError('offline'));await expect(send('mock-token',mail)).rejects.toBeInstanceOf(DeliveryError);expect(fetch).toHaveBeenCalledTimes(1);});
 it('times out and releases the request without a second send',async()=>{
  vi.useFakeTimers();vi.mocked(fetch).mockImplementation(async(_url,options)=>new Promise((_resolve,reject)=>{options?.signal?.addEventListener('abort',()=>reject(new DOMException('timeout','AbortError')));}));
  const result=send('mock-token',mail);const assertion=expect(result).rejects.toMatchObject({kind:'unknown',message:expect.stringContaining('시간')});
  await vi.advanceTimersByTimeAsync(SEND_TIMEOUT_MS+1);await assertion;expect(fetch).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
 });
 it('does not call fetch for an invalid outgoing mail',async()=>{await expect(send('mock-token',{...mail,to:'invalid'})).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();});
});
describe('OAuth callback safety with a mocked Google object',()=>{
 it('rejects a missing send scope',async()=>{vi.stubGlobal('window',{google:{accounts:{oauth2:{initTokenClient:(config:any)=>({requestAccessToken:()=>config.callback({access_token:'mock',scope:'other'})})}}}});await expect(connect('mock-client')).rejects.toThrow('권한');});
 it('times out and ignores a late callback',async()=>{vi.useFakeTimers();let callback:(value:unknown)=>void=()=>{};vi.stubGlobal('window',{google:{accounts:{oauth2:{initTokenClient:(config:any)=>{callback=config.callback;return {requestAccessToken:()=>{}};}}}}});const promise=connect('mock-client');const assertion=expect(promise).rejects.toThrow('시간');await vi.advanceTimersByTimeAsync(GOOGLE_CONNECT_TIMEOUT_MS+1);await assertion;callback({access_token:'late',scope:'https://www.googleapis.com/auth/gmail.send'});expect(vi.getTimerCount()).toBe(0);});
});
