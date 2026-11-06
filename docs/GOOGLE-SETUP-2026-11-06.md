# Google 연결 등록 완료 — 2026-11-06

- Google Cloud 프로젝트: fan-report-dev
- OAuth 앱: FAN REPORT (개발용)
- 웹 클라이언트: FAN REPORT localhost
- 승인된 JavaScript 원본: http://127.0.0.1:5178, http://localhost:5178
- 리디렉션 URI: 없음 (GIS popup token model)
- 게시 상태: 테스트 중
- 테스트 사용자: 사용자 본인 계정 1개
- 요청 범위: https://www.googleapis.com/auth/gmail.send 하나
- 로컬 .env.local에 VITE_GOOGLE_CLIENT_ID 적용. 공개 식별자만 사용하며 Client Secret은 저장하지 않음.
- 사이트에서 Gmail 연결 준비 버튼 표시 확인. 실제 OAuth 승인·메일 발송·앱 공개·결제 등록은 수행하지 않음.

## 사용 방법
npm run dev 실행 후 http://127.0.0.1:5178/ 접속.
Gmail 연결 준비 → Google 계정 선택 및 연결 → 등록한 테스트 계정으로 직접 승인.
연결만으로는 메일이 발송되지 않음. 실제 발송은 별도로 수신자·본문·첨부 확인과 명시적인 최종 발송 필요.

## 주의
기본 실행 포트는 OAuth 등록과 맞도록 5178로 고정했다. 다른 포트를 사용하려면 승인된 JavaScript 원본도 일치시켜야 한다.
Google Console 안내에 따르면 변경 적용에 시간이 걸릴 수 있다. 연결 오류가 나면 실제 메시지를 확인하고 대응한다.
공개용 도메인 등록·OAuth 검증은 하지 않았다. 공개 전 운영 정보와 정책, 도메인 및 실제 Google 연결 검증이 필요하다.
