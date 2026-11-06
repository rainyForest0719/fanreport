# FAN REPORT

팬이 만든 비공식 신고 메일 작성 도우미입니다. 소속사와 관계가 없으며, 신고 접수기관이 아닙니다.

공식 신고 양식에 따라 여러 게시물을 한 통의 메일로 정리하고, 사용자가 연결한 본인 Gmail로 증거 자료와 함께 직접 발송합니다.

> 공개 사이트: https://rainyforest0719.github.io/fanreport/
> Google OAuth 검증은 사이트 배포와 별도입니다. 검증 완료 전에는 Google 경고 및 사용자 제한이 적용될 수 있습니다.

## 주요 기능

- 기본 수신 주소 선택 또는 직접 입력, CC·BCC와 설명
- 신고 여러 건 추가·삭제
- 게시 일시, 플랫폼·URL, 작성자, 게시물 내용 입력
- 다중 첨부, 이미지 미리보기, 개별 삭제
- 제목·본문 자동 작성 및 독립적인 직접 편집
- 수신자·본문·첨부 최종 확인과 실제 발송 동의
- 동일 구성의 최근 메일 재발송 및 변경된 수동 본문 추가 확인
- 모바일·키보드 사용 및 항목별 오류 안내

기본 수신 주소는 운영자가 제공한 `jaurim_protect@nol.com`이며, `src/App.tsx`의 `AGENCY`에서 관리합니다. 발송 전 소속사 공지에서 최신 수신 주소와 양식을 확인하십시오.

## 기술

Vite / React / TypeScript / SCSS. 별도 백엔드·DB 없이 동작하는 정적 사이트입니다. Node.js 24 환경에서 빌드와 테스트를 확인했습니다.

## 로컬 실행

```powershell
git clone https://github.com/rainyForest0719/fanreport.git
cd fanreport
npm ci
Copy-Item .env.example .env.local
npm run dev
```

[http://127.0.0.1:5178/](http://127.0.0.1:5178/)에서 확인합니다. Google Client ID가 비어 있어도 작성·첨부·최종 확인은 가능하며 실제 발송은 비활성화됩니다.

```powershell
npm test
npm run build
npm run preview
```

정적 빌드 결과는 `dist/`입니다. 개발 서버와 미리보기는 같은 5178 포트를 사용하므로 동시에 실행하지 마십시오.

## Gmail 연결

1. 자신의 Google Cloud 프로젝트에서 Gmail API를 활성화합니다.
2. Google Auth Platform에 앱 정보와 연락처를 설정합니다.
3. 개발 중에는 External / Testing 상태로 두고 시험 계정을 테스트 사용자로 등록합니다.
4. 데이터 액세스에는 다음 범위 하나만 등록합니다.
   `https://www.googleapis.com/auth/gmail.send`
5. Web application 유형의 OAuth Client ID를 생성합니다.
6. 승인된 JavaScript 원본에 아래 주소를 등록합니다.
   - `http://127.0.0.1:5178`
   - `http://localhost:5178`
7. 로컬 `.env.local`에 입력하고 개발 서버를 재시작합니다.

```dotenv
VITE_GOOGLE_CLIENT_ID=발급받은_웹_클라이언트_ID
```

GIS 팝업 토큰 방식을 사용하므로 별도 리디렉션 URI, API key, Client Secret, 갱신 토큰을 사용하지 않습니다. 사용자는 Gmail 연결 준비 → Google 계정 선택 및 연결 순서로 직접 승인합니다. 계정 연결만으로 메일이 발송되지는 않습니다.

Client ID는 공개 식별자이며 `VITE_` 값은 프런트엔드 빌드에 포함됩니다. **Client Secret·접근 토큰·실제 신고 자료를 코드, 환경변수 예시, 이슈, 커밋에 넣지 마십시오.** `.env.local`은 Git에서 제외됩니다. 이 저장소를 복제한 사람은 자신의 Google 프로젝트와 Client ID를 사용하십시오.

## 개인정보 처리

- 신고 내용·이메일·파일·Google 토큰은 현재 페이지에서 임시 처리합니다.
- 신고 자료를 사이트 운영자 서버로 제출하거나 localStorage, sessionStorage, IndexedDB, 쿠키에 저장하지 않습니다.
- 입력 수집, 세션 녹화, 분석·광고 추적 SDK를 포함하지 않습니다.
- Google 연결을 선택하면 Google 서비스와 통신하고, 발송 확정 후 브라우저가 Gmail API에 직접 요청합니다.
- 발송한 메일은 본인의 보낸메일함 및 수신자의 메일함에 남습니다.
- 최근 발송 비교용 해시는 현재 페이지에서만 임시 보관합니다.
- 새로고침 시 작성 상태가 초기화됩니다. 페이지 이탈 시 앱의 토큰을 제거합니다. 브라우저의 복원 기능과 원본 파일, 이미 발송한 메일까지 삭제하는 것은 아닙니다.
- 호스팅·CDN 접속 기록은 실제 배포 업체의 설정에 따라 별도 검토가 필요합니다.

운영자와 문의 창구는 GitHub 계정 및 Issues, 호스팅은 GitHub Pages입니다. 공개 문의에 신고 자료·주소·토큰을 올리지 마십시오. GitHub는 Pages 방문자의 IP를 보안 목적으로 기록합니다. 세부 사항은 공개 개인정보 안내를 확인하십시오.

## 제한과 안전장치

- 첨부 합계 18 MiB, 최대 30개. 빈 파일은 거절합니다.
- 본문 UTF-8 기준 512 KiB, 수신자·CC·BCC 합계 50명.
- 발송 요청 응답 대기 60초, 자동 재발송 없음.
- 성공 HTTP 응답과 유효한 메시지 ID를 함께 받은 경우에만 발송 확인 표시.
- 네트워크 단절·서버 오류·시간 초과는 이미 발송됐을 수 있으므로 보낸메일함 확인 안내.
- 메일 헤더 주입 차단, 긴 한글 파일명 및 주소 헤더 접기.
- 동일 메일 재발송 확인은 현재 페이지에서의 최근 비교에 한정됩니다.

**이러한 브라우저 측 장치는 실수 방지용이며 고의적인 대량 발송을 강제 차단하는 서버 보안 경계가 아닙니다.** 앱을 공개하면 악용 대응과 Google 정책 준수에 대한 운영 검토가 필요합니다.

## GitHub Pages 배포

main 푸시 시 `.github/workflows/pages.yml`이 테스트·빌드 후 GitHub Pages로 배포합니다. 저장소 Settings → Pages의 Source는 GitHub Actions로 설정합니다. Actions 변수 `VITE_GOOGLE_CLIENT_ID`에는 공개 Web Client ID만 입력합니다. 빌드 경로는 `/fanreport/`입니다. Google JavaScript 원본은 경로 없는 `https://rainyforest0719.github.io`를 등록합니다.

Google Auth Platform의 Production 전환과 gmail.send 민감 권한 검증은 별도입니다. Testing 상태에서는 등록된 테스트 사용자만 연결할 수 있습니다. Production이어도 검증 전에는 경고와 사용자 한도가 남을 수 있으며, 승인 완료를 보장하지 않습니다. 공개 문의 이메일과 도메인 소유 확인, 홈페이지·개인정보 안내·약관 URL 및 시연 영상 등 Google이 요구하는 심사 자료를 준비해야 합니다.

GitHub Pages는 `public/_headers` 사용자 정의 헤더를 적용하지 않습니다. 앱 HTML에는 CSP meta를 적용하지만 frame-ancestors, X-Frame-Options, COOP, Permissions-Policy 등 응답 헤더와 동등하지 않습니다. 이 헤더를 강제하려면 지원 호스팅 또는 프록시를 사용해야 합니다. Vite preview의 헤더 검사는 Pages 응답 헤더 검사를 대신하지 않습니다.

## 검증 및 기록

테스트는 실제 Google 서비스 대신 모의 응답을 사용합니다. 사용자로부터 실제 테스트 메일 수신 성공을 확인했지만, 이것이 Google 공개 운영 승인이나 법률·접근성 인증을 뜻하지는 않습니다.

- [초기 점검](docs/AUDIT-2026-11-06.md)
- [접근성·개인정보 보완](docs/REMEDIATION-2026-11-06.md)
- [추가 발송 안전성 보완](docs/HARDENING-2026-11-06.md)
- [개발용 Google 설정 기록](docs/GOOGLE-SETUP-2026-11-06.md)

점검 기록은 당시 상태와 검사 범위를 담은 문서입니다. 실제 기기, 운영 환경, Google 정책과 법률상 적합성에 대한 최종 검토를 대신하지 않습니다.

## 공식 자료

- [Google GIS 토큰 방식](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Gmail API 발송](https://developers.google.com/workspace/gmail/api/guides/sending)
- [Google 공개 앱 검증](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)
