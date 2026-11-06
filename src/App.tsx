import {useEffect,useRef,useState} from 'react';
import {MAX_FILES,attachmentError,recipients,type Envelope} from './mail';
import {connect,loadGoogle,send,DeliveryError} from './gmail';
import {newReport,reportBody,type Report} from './reports';
import {validateDraft} from './validation';
function FieldError({id,message}:{id:string;message?:string}){return message?<p id={id+'-error'} className="field-error">{message}</p>:null;}
type Review=Envelope & {key:string;repeat?:'sent'|'unknown';manualChanged?:boolean};
const CLIENT=import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';
const AGENCY='jaurim_protect@nol.com';
const size=(n:number)=> n<1024?n+' B':n<1024*1024 ? (n/1024).toFixed(0)+' KB' : (n/1024/1024).toFixed(1)+' MB';
function ImagePreview({file}:{file:File}) {
 const [url,setUrl]=useState(''),[failed,setFailed]=useState(false);
 useEffect(()=>{const next=URL.createObjectURL(file);setFailed(false);setUrl(next);return()=>URL.revokeObjectURL(next);},[file]);
 return failed?<span className="file-symbol" role="img" aria-label="이미지 미리보기 불가">IMAGE</span>:url?<img loading="lazy" decoding="async" src={url} alt={file.name+' 미리보기'} onError={()=>setFailed(true)}/>:null;
}
export default function App(){
 const [recipientMode,setRecipientMode]=useState('preset'),[customTo,setCustomTo]=useState('');
 const to=recipientMode==='preset'?AGENCY:customTo;
 const [cc,setCc]=useState(''),[bcc,setBcc]=useState('');
 const [reports,setReports]=useState<Report[]>(()=>[newReport()]);
 function updateReport(id:string,field:keyof Omit<Report,'id'>,value:string){setReports(items=>items.map(item=>item.id===id?{...item,[field]:value}:item));}
 function addReport(){const item=newReport();setReports(items=>[...items,item]);setNotice('신고 내용을 추가했습니다.');requestAnimationFrame(()=>document.getElementById('report-'+item.id)?.focus());}
 function removeReport(id:string){const item=reports.find(r=>r.id===id);if(item && (item.platform||item.url||item.author||item.date||item.time||item.content) && !window.confirm('이 신고 내용을 삭제할까요?'))return;setReports(items=>items.filter(item=>item.id!==id));setErrors({});requestAnimationFrame(()=>document.getElementById('add-report')?.focus());}
 const [files,setFiles]=useState<File[]>([]),[custom,setCustom]=useState<{subject?:string;body?:string;source?:string}|null>(null);
 const [errors,setErrors]=useState<Record<string,string>>({});
 function clearError(id:string){setErrors(old=>{if(!old[id])return old;const next={...old};delete next[id];return next;});}
 function inputProps(id:string,required=false,hint?:string){return {id,required:required||undefined,'aria-invalid':errors[id]?true:undefined,'aria-describedby':[hint,errors[id]?id+'-error':null].filter(Boolean).join(' ')||undefined,onInput:()=>clearError(id)};}
 const reviewTitle=useRef<HTMLHeadingElement>(null);
 const [notice,setNotice]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[connected,setConnected]=useState(false);
 const [review,setReview]=useState<Review|null>(null),[consent,setConsent]=useState(false),[retryConsent,setRetryConsent]=useState(false),[manualConsent,setManualConsent]=useState(false);
 const attempts=useRef(new Map<string,'sent'|'unknown'>()),fileIds=useRef(new WeakMap<File,string>()),connectionEpoch=useRef(0);
 async function reviewKey(mail:Envelope){const value=JSON.stringify([mail.to,mail.cc,mail.bcc,mail.subject,mail.body,mail.files.map(file=>{let id=fileIds.current.get(file);if(!id){id=crypto.randomUUID();fileIds.current.set(file,id);}return id;})]);const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(hash),value=>value.toString(16).padStart(2,'0')).join('');}
 function remember(key:string,status:'sent'|'unknown'){attempts.current.delete(key);attempts.current.set(key,status);if(attempts.current.size>20)attempts.current.delete(attempts.current.keys().next().value!);}
 const token=useRef<{value:string;expires:number}|null>(null),lock=useRef(false),dialog=useRef<HTMLDialogElement>(null);
 const subject=custom?.subject ?? (reports.length>1 ? '[신고] 게시물 '+reports.length+'건 검토 요청' : '[신고] 게시물 검토 요청');
 const generatedBody=reportBody(reports,files);
 const body=custom?.body ?? generatedBody;
 const bodyStale=custom?.body!==undefined&&custom.source!==generatedBody;
 const total=files.reduce((n,f)=>n+f.size,0);
 useEffect(()=>{const timer=setInterval(()=>{if(token.current && Date.now()>=token.current.expires){token.current=null;setConnected(false);setNotice('Gmail 연결 시간이 만료되었습니다. 발송하려면 다시 연결하십시오.');}},1000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  const clearToken=()=>{connectionEpoch.current++;token.current=null;setConnected(false);};
  window.addEventListener('pagehide',clearToken);
  return()=>{window.removeEventListener('pagehide',clearToken);token.current=null;connectionEpoch.current++;};
 },[]);
 useEffect(()=>{if(review){setConsent(false);setRetryConsent(false);setManualConsent(false);dialog.current?.showModal();reviewTitle.current?.focus();}},[review]);
 async function prepare(){setBusy(true);setNotice('Google 연결 준비 중입니다.');try{await loadGoogle();setReady(true);setNotice('Gmail 연결 준비가 완료되었습니다. Google 계정을 선택하십시오.');}catch(e){setNotice((e as Error).message);}finally{setBusy(false);}}
 async function login(){const epoch=++connectionEpoch.current;setBusy(true);setNotice('Google 계정 선택과 발송 권한 승인을 기다리고 있습니다.');try{const result=await connect(CLIENT);if(epoch!==connectionEpoch.current)return;token.current=result;setConnected(true);setNotice('Gmail 발송 권한이 연결되었습니다. Google에서 선택한 계정으로 발송됩니다.');}catch(e){setNotice((e as Error).message);}finally{setBusy(false);}}
 function disconnect(){connectionEpoch.current++;const old=token.current;token.current=null;setConnected(false);if(old)window.google?.accounts.oauth2.revoke(old.value,()=>{});}
 function addFiles(list:FileList|null){if(!list)return;const next=[...files,...Array.from(list)];const problem=attachmentError(next);if(problem){setNotice(problem+' 이번 선택은 추가되지 않았습니다.');return;}setFiles(next);setNotice('첨부 자료 '+next.length+'개를 선택했습니다.');}
 async function openReview(){
  const dest=recipients(to,cc,bcc);
  const next=validateDraft({to:dest.to,cc,bcc,reports,subject,body});
  setErrors(next);
  if(Object.keys(next).length){setNotice('');requestAnimationFrame(()=>document.getElementById(Object.keys(next)[0])?.focus());return;}
  const problem=attachmentError(files);if(problem){setNotice(problem);document.getElementById('evidence-files')?.focus();return;}
  const mail={...dest,subject,body,files:[...files]};let key:string;try{key=await reviewKey(mail);}catch{setNotice('이 브라우저에서는 발송 확인을 준비할 수 없습니다. 최신 브라우저의 HTTPS 또는 로컬 주소를 이용하십시오.');return;}
  setNotice('');setReview({...mail,key,repeat:attempts.current.get(key),manualChanged:bodyStale});
 }
 async function deliver(){
  if(lock.current||!review||!consent||!CLIENT||(review.repeat&&!retryConsent)||(review.manualChanged&&!manualConsent))return;
  if(!token.current||Date.now()>=token.current.expires){token.current=null;setConnected(false);setNotice('Gmail을 다시 연결한 후 최종 확인해 주세요.');dialog.current?.close();setReview(null);return;}
  lock.current=true;setBusy(true);setNotice('메일 발송 요청을 처리하고 있습니다. 응답을 기다려 주십시오.');
  try{await send(token.current.value,review);remember(review.key,'sent');setNotice('Gmail API가 발송을 확인했습니다. 본인 Gmail 보낸메일함에서 확인해 주세요.');}
  catch(e){if(e instanceof DeliveryError){if(e.kind==='unknown')remember(review.key,'unknown');if(e.kind==='unauthorized'){token.current=null;setConnected(false);}}setNotice((e as Error).message);}
  finally{lock.current=false;setBusy(false);dialog.current?.close();setReview(null);}
 }
 return <>
 <main id="main-content"><section className="intro"><p className="eyebrow">REPORT DOCUMENT / 신고서 작성</p><h1>게시물 신고서</h1><p className="lead">소속사 신고 양식에 따라 게시물 정보와 증거 자료를 작성하십시오.<br/>수신 정보와 작성 내용을 확인한 후 본인 Gmail 계정으로 발송합니다.</p><div className="privacy"><strong>자료 처리 안내</strong>작성 내용과 첨부파일은 사용 중인 기기에서만 임시로 보관됩니다.</div></section>
 {Object.keys(errors).length>0&&<section className="error-summary" role="alert" aria-labelledby="error-title"><h2 id="error-title">입력 내용을 확인하십시오.</h2><ul>{Object.entries(errors).map(([id,message])=><li key={id}><a href={'#'+id} onClick={e=>{e.preventDefault();document.getElementById(id)?.focus();}}>{message}</a></li>)}</ul></section>}
 <section id="gmail-connection" className="section connection-start" aria-labelledby="connection-title"><div className="section-heading"><span>01</span><h2 id="connection-title">Gmail 연결</h2><span className="count">{connected?'연결 완료':'작성 전 확인'}</span></div><div className="connection-content"><p>먼저 메일을 보낼 본인 Gmail을 연결하십시오. 연결 가능 여부를 확인한 뒤 신고서를 작성하면 편리합니다.</p><p className="annotation">발송 권한만 요청하며 메일함을 읽지 않습니다. 연결만으로 메일이 발송되지는 않습니다. Google 검증 상태나 계정 정책에 따라 경고 또는 이용 제한이 표시될 수 있습니다.</p>{!CLIENT?<p className="field-error">Google 연결 설정이 없어 현재 실제 발송은 비활성화되어 있습니다.</p>:<div className="connection-actions"><button className={connected?'':'primary'} disabled={busy} onClick={connected?disconnect:ready?login:prepare}>{connected?'Gmail 연결 해제':ready?'Google 계정 선택 및 연결':'Gmail 연결 준비'}</button>{connected&&<button onClick={()=>document.getElementById('recipient-mode')?.focus()}>신고서 작성 시작 ↓</button>}</div>}<p className="connection-status" role="status">{connected?'Gmail 발송 권한이 연결되었습니다. Google에서 선택한 계정으로 발송됩니다.':busy?'Google 연결을 진행하고 있습니다.':ready?'연결 준비가 되었습니다. 위 버튼으로 Google 계정을 선택하십시오.':'Gmail을 연결한 뒤 아래 신고서를 작성하십시오.'}</p><p className="annotation">연결에 문제가 있으면 아래 양식부터 작성할 수도 있습니다. 작성 중 연결이 만료되어도 입력 내용은 유지되며, 발송 전에 다시 연결하면 됩니다.</p></div></section>
 <div className="workspace"><div className="editor"><section className="section"><div className="section-heading"><span>02</span><h2>수신 정보</h2></div><p className="hint">수신 주소를 선택하거나 직접 입력하십시오. CC와 BCC는 선택 사항입니다.</p>
 <label>받는 메일 주소<select id="recipient-mode" value={recipientMode} onChange={e=>{setRecipientMode(e.target.value);clearError("recipient-custom");}}><option value="preset">{AGENCY}</option><option value="custom">직접 입력</option></select></label>
 {recipientMode==='custom'&&<label>받는 주소 직접 입력<input {...inputProps("recipient-custom",true)} type="email" value={customTo} onChange={e=>setCustomTo(e.target.value)} placeholder="받을 사람의 메일 주소" autoComplete="off"/></label>}
 <FieldError id="recipient-custom" message={errors['recipient-custom']}/>
 <label>CC (참조) <small className="field-badge field-badge--optional">선택</small><input {...inputProps('recipient-cc',false,'cc-help')} value={cc} onChange={e=>setCc(e.target.value)} placeholder="여러 주소는 쉼표(,)로 구분" autoComplete="off"/></label>
 <FieldError id="recipient-cc" message={errors['recipient-cc']}/><p id="cc-help" className="annotation">같은 메일을 함께 받을 사람입니다. 입력한 주소는 다른 수신자에게도 보입니다.</p>
 <label>BCC (숨은 참조) <small className="field-badge field-badge--optional">선택</small><input {...inputProps('recipient-bcc',false,'bcc-help')} value={bcc} onChange={e=>setBcc(e.target.value)} placeholder="여러 주소는 쉼표(,)로 구분" autoComplete="off"/></label>
 <FieldError id="recipient-bcc" message={errors['recipient-bcc']}/><p id="bcc-help" className="annotation">같은 메일을 함께 받지만, 입력한 주소는 다른 수신자에게 보이지 않습니다.</p>
 </section>
 <section className="section"><div className="section-heading"><span>03</span><h2>신고 내용</h2></div><p className="hint">소속사에서 안내한 공식 신고 양식에 맞춰 작성합니다. 확인한 사실을 기준으로 작성하십시오.</p>
 <p className="annotation">총 {reports.length}건을 한 통의 메일로 보냅니다. 증거 자료는 하단 첨부 항목에 등록하십시오.</p>
 {reports.map((item,index)=><fieldset id={"report-"+item.id} tabIndex={-1} className="report-item" key={item.id}><legend>신고 {index+1}</legend>
 {reports.length>1&&<button className="remove-report" aria-label={'신고 '+(index+1)+' 삭제'} onClick={()=>removeReport(item.id)}>이 신고 삭제</button>}
 <div className="two"><label>게시 일시 · 날짜 <small className="field-badge field-badge--optional">선택</small><input type="date" value={item.date} onChange={e=>updateReport(item.id,'date',e.target.value)}/></label><label>게시 일시 · 시간 <small className="field-badge field-badge--optional">선택</small><input type="time" value={item.time} onChange={e=>updateReport(item.id,'time',e.target.value)}/></label></div>
 <p className="annotation">게시물에 표시된 일시를 입력하십시오. 확인할 수 없는 항목은 공란으로 두십시오.</p>
 <label>게시 플랫폼 <small className="field-badge field-badge--required">필수</small><input {...inputProps(item.id+'-platform',true)} value={item.platform} onChange={e=>updateReport(item.id,'platform',e.target.value)} placeholder="예: X, 인스타그램, 유튜브, 커뮤니티 이름" autoComplete="off"/></label>
 <FieldError id={item.id+'-platform'} message={errors[item.id+'-platform']}/>
 <label>게시물 URL <small className="field-badge field-badge--required">필수</small><input {...inputProps(item.id+'-url',true)} type="url" inputMode="url" value={item.url} onChange={e=>updateReport(item.id,'url',e.target.value)} placeholder="https://" autoComplete="off"/></label>
 <FieldError id={item.id+'-url'} message={errors[item.id+'-url']}/>
 <label>게시물 작성자(닉네임, ID 등) <small className="field-badge field-badge--optional">선택</small><input value={item.author} onChange={e=>updateReport(item.id,'author',e.target.value)} placeholder="게시물에 표시된 닉네임 또는 ID" autoComplete="off"/></label>
 <label>게시물 내용 <small className="field-badge field-badge--required">필수</small><textarea {...inputProps(item.id+'-content',true)} rows={6} value={item.content} onChange={e=>updateReport(item.id,'content',e.target.value)} placeholder="게시물 내용 및 확인한 사실을 구체적으로 기재하십시오."/></label>
 <FieldError id={item.id+'-content'} message={errors[item.id+'-content']}/>
 </fieldset>)}
 <button id="add-report" className="add-report" onClick={addReport}>+ 신고 내용 추가</button>
 {custom?.body!==undefined&&<p className="annotation">직접 수정 중인 메일에는 추가·삭제가 자동 반영되지 않습니다. 미리보기에서 ‘양식으로 다시 생성’을 눌러 주세요.</p>}
 </section>
 <section className="section"><div className="section-heading"><span>04</span><h2>첨부 자료</h2><span className="count">{files.length}개</span></div><p className="hint">게시물 캡처 이미지, 영상 등을 첨부하십시오. 여러 건의 신고는 공통 첨부로 발송됩니다. 파일명에 신고 번호를 기재하면 자료를 구분할 수 있습니다.</p>
 <p className="annotation">신고와 무관한 전화번호·주소·주민등록번호, 제3자의 얼굴이나 대화는 제외하거나 가린 후 첨부하십시오.</p>
 <label className="upload">+ 첨부 자료 선택<input id="evidence-files" aria-describedby="evidence-help" type="file" multiple onChange={e=>{addFiles(e.target.files);e.target.value='';}}/><span id="evidence-help">최대 {MAX_FILES}개 · 합계 18 MB 이하 · 선택한 파일만 메일에 첨부</span></label>
 <ul className="files">{files.map((f,i)=><li key={i}>{/^image\/(png|jpeg|gif|webp|avif)$/.test(f.type)?<ImagePreview file={f}/>:<span className="file-symbol">FILE</span>}<div><strong>{f.name}</strong><small>{size(f.size)}</small></div><button aria-label={f.name+' 삭제'} onClick={()=>{setFiles(files.filter((_,j)=>j!==i));setNotice('첨부 자료를 삭제했습니다.');requestAnimationFrame(()=>document.getElementById('evidence-files')?.focus());}}>삭제</button></li>)}</ul><p className="annotation">{size(total)} / 18 MB · 발송 전에는 파일이 업로드되지 않습니다.</p></section></div>
 <aside><div className="preview"><div className="preview-top"><span className="eyebrow">DOCUMENT PREVIEW / 발송 문서</span></div><h2>작성 문서 검토</h2><p className="hint">입력 항목을 기준으로 생성된 메일입니다.<br/>필요한 경우 제목과 본문을 직접 수정하십시오.</p>
 <label>메일 제목<input {...inputProps("mail-subject",true)} maxLength={120} value={subject} onChange={e=>setCustom(previous=>({...previous,subject:e.target.value}))}/></label><FieldError id="mail-subject" message={errors['mail-subject']}/><label>메일 본문<textarea {...inputProps("mail-body",true)} className="mail-body" rows={19} value={body} onChange={e=>setCustom(previous=>({...previous,body:e.target.value,source:generatedBody}))}/></label><FieldError id="mail-body" message={errors['mail-body']}/>
 {custom&&<div className="manual"><p>{custom.body===undefined?'제목만 직접 수정 중입니다. 본문은 신고 내용에 따라 자동 갱신됩니다.':bodyStale?'신고 내용 또는 첨부가 변경되었습니다. 직접 수정한 본문에도 반영했는지 확인하십시오.':'본문을 직접 수정 중입니다. 이후 신고 내용·첨부 변경은 본문에 자동 반영되지 않습니다.'}</p><button onClick={()=>{if(window.confirm('직접 수정한 제목·본문을 입력 양식으로 다시 생성할까요?')){setCustom(null);clearError('mail-subject');clearError('mail-body');}}}>양식으로 다시 생성</button></div>}
 <div className="connection"><strong>{connected?'Gmail 연결됨':'Gmail 연결 필요'}</strong><p>{connected?'최종 확인 후 실제 발송 버튼을 눌러야 전송됩니다.':'작성 내용은 유지됩니다. 화면 첫 단계에서 Gmail을 연결한 뒤 발송하십시오.'}</p>{!connected&&<a href="#gmail-connection" onClick={e=>{e.preventDefault();document.querySelector<HTMLElement>('#gmail-connection button')?.focus();document.getElementById('gmail-connection')?.scrollIntoView({block:'start'});}}>Gmail 연결 단계로 이동 ↑</a>}</div>
 <button className="primary" onClick={openReview} disabled={busy}>수신자·첨부 최종 확인 <span aria-hidden="true">→</span></button><p className="under-button">최종 확인 전에는 메일을 발송하지 않습니다.</p></div>
 <p className="side-note">작성 내용은 자동 저장되지 않습니다. 새로고침하면 작성 내용과 첨부 목록이 초기화됩니다. 페이지를 벗어나면 Gmail 연결을 다시 해야 합니다. 원본 파일은 기기에 그대로 남으며, 브라우저의 뒤로가기·세션 복원 기능에 따라 이전 화면이 복원될 수 있습니다.</p></aside></div>
 <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{notice}</div>
 {notice&&<div className="notice">{notice}<button onClick={()=>setNotice('')} aria-label="알림 닫기">×</button></div>}
 <section className="policy"><h2>개인정보 및 자료 처리 원칙</h2><p>이 사이트에는 신고 자료를 보관하는 저장소가 없습니다. 작성 내용, 이메일 주소, 첨부파일은 사용 중인 기기에서만 임시로 다루며, 사이트 운영자에게 전송하거나 저장하지 않습니다. Gmail 연결 정보도 기기에서 임시로 사용합니다. Google 연결을 선택하면 Google 서비스와 통신합니다.</p><p>메일을 발송하면 내용과 첨부파일이 Google을 통해 수신자에게 전달됩니다. 발송한 메일은 본인의 Gmail 보낸메일함과 수신자의 메일함에 남습니다.</p><p>이 사이트를 제공하는 GitHub Pages는 보안 목적으로 접속 IP를 기록합니다. 자세한 내용은 개인정보 처리 안내에서 확인하십시오.</p><p>팬이 만든 비공식 도우미로, 소속사와 관계가 없습니다. 공식 신고 주소와 양식은 소속사 공지를 먼저 확인해 주세요.</p></section></main>
 <footer><span>FAN REPORT</span><nav aria-label="이용 안내"><a href={`${import.meta.env.BASE_URL}privacy.html`} target="_blank" rel="noopener noreferrer">개인정보 처리 안내<span className="sr-only"> (새 창)</span></a><a href={`${import.meta.env.BASE_URL}terms.html`} target="_blank" rel="noopener noreferrer">이용약관<span className="sr-only"> (새 창)</span></a></nav><p>비공식 팬 제작 도구 · 소속사와 무관합니다.</p></footer>
 <dialog ref={dialog} aria-labelledby="review-title" onKeyDown={e=>{if(e.key!=='Tab')return;const items=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),summary,a[href],[tabindex="0"]')).filter(el=>el.getClientRects().length>0);const first=items[0],last=items[items.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===reviewTitle.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}} onCancel={e=>{if(busy)e.preventDefault();else setReview(null);}} onClose={()=>{if(!busy)setReview(null);}}>{review&&<><p className="eyebrow">발송 전 확인</p><h2 id="review-title" ref={reviewTitle} tabIndex={-1}>메일 발송 최종 확인</h2><p>Google에서 선택한 Gmail 계정으로 발송됩니다.</p><dl><dt>받는 사람</dt><dd>{review.to}</dd><dt>CC (참조)</dt><dd>{review.cc.join(', ')||'없음'}</dd><dt>BCC (숨은 참조)</dt><dd>{review.bcc.join(', ')||'없음'}</dd><dt>제목</dt><dd>{review.subject}</dd><dt>첨부</dt><dd>{review.files.length?review.files.map((f,i)=><div key={i}>{f.name} ({size(f.size)})</div>):'없음'}</dd></dl>{review.repeat&&<div className="repeat-warning"><p>{review.repeat==='sent'?'이 페이지에서 같은 내용의 메일을 이미 발송했습니다.':'이 페이지에서 같은 내용의 발송 결과를 확인하지 못했습니다.'} 중복 발송을 피하려면 Gmail 보낸메일함을 확인하십시오.</p><label className="check"><input type="checkbox" checked={retryConsent} onChange={e=>setRetryConsent(e.target.checked)} disabled={busy}/>보낸메일함을 확인했으며 같은 메일을 다시 보내겠습니다.</label></div>}<p className="sr-only" role="status" aria-live="polite">{busy?"발송 요청을 처리하고 있습니다. 응답을 기다려 주십시오.":""}</p>{review.manualChanged&&<div className="repeat-warning"><p>신고 내용 또는 첨부를 변경한 뒤, 직접 수정한 메일 본문은 자동 갱신되지 않았습니다.</p><label className="check"><input type="checkbox" checked={manualConsent} onChange={e=>setManualConsent(e.target.checked)} disabled={busy}/>변경한 신고 내용과 첨부 정보가 본문에도 반영되어 있는지 확인했습니다.</label></div>}<details><summary>발송할 본문 확인</summary><pre>{review.body}</pre></details><label className="check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} disabled={busy}/>수신자, CC, BCC, 본문과 첨부를 확인했으며 실제 발송에 동의합니다.</label>
 {!CLIENT&&<p className="annotation">Google 설정이 없어 발송할 수 없습니다.</p>}{CLIENT&&!connected&&<p>먼저 Gmail을 연결해 주세요.</p>}
 <div className="dialog-actions"><button disabled={busy} onClick={()=>{dialog.current?.close();setReview(null);}}>돌아가서 수정</button><button className="primary" disabled={!CLIENT||!connected||!consent||busy||!!(review.repeat&&!retryConsent)||!!(review.manualChanged&&!manualConsent)} onClick={deliver}>{busy?'발송 결과 확인 중…':'확인한 메일 실제 발송'}</button></div></>}</dialog></>;
}
