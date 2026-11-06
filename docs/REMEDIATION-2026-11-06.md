# 점검 사항 보완 결과

2026-11-06 / FAN REPORT

이 문서는 AUDIT-2026-11-06.md의 수정 전 발견 사항에 대한 후속 기록입니다. 공개·메일 발송·실제 Google 로그인을 수행하지 않았습니다.

## 반영한 변경

| 원래 발견 사항 | 조치 |
| --- | --- |
| 입력 테두리 대비 2.14:1 | #7a8490으로 변경. 흰 배경 대비 약 3.80:1 |
| 확인창 이름 없음 | aria-labelledby와 제목 id 연결, 제목에 초기 포커스 |
| 키보드 흐름 | 확인창 내 Tab/Shift+Tab 순환, Escape 종료 및 호출 버튼 복귀 확인 |
| 필수 상태·오류 연결 | required, aria-invalid, aria-describedby 적용, 항목별 오류 및 오류 요약, 첫 오류로 포커스 이동 |
| CC/BCC 오류 모호함 | 각 입력별 오류 구분, 도움말을 aria-describedby로 연결 |
| 모바일 글씨 | 주요 입력·메일 본문 16px, 보조 안내 12px로 조정 |
| 날짜/시간 확대 넘침 | 모바일 1열 배치와 minmax(0,1fr) 적용 |
| 작은 조작 영역 | 모바일 버튼 최소 높이 44px, 첨부 삭제 후 파일 선택으로 포커스 이동 |
| 상태 알림 | 항상 존재하는 스크린리더용 live region 사용 |
| 저장/삭제 안내의 과도한 단정 | 자동 저장 없음·원본 파일 유지·브라우저 복원 가능성 구분 |
| 토큰 수명 | pagehide 시 임시 토큰 제거, 복귀 시 재연결 필요 |
| 신고와 무관한 제3자 개인정보 | 첨부 전 제외·가림 안내 추가 |
| 정식 안내 링크 없음 | privacy.html 및 terms.html 검토본 추가, 작성 내용을 잃지 않도록 새 창으로 연결 |
| 배포 보안 | public/_headers 추가, Vite preview에도 같은 헤더 적용 |

## 정책 문서

- public/privacy.html: 실제 처리 항목, 임시 처리, Google 통신, 발송 후 메일 보관, 연결 해제, 정보 최소화, 변경 고지.
- public/terms.html: 비공식 도구 범위, 사용자 최종 확인, 자료의 적법성, 자동 저장 및 서비스 조건.
- 이 두 문서는 공개 준비용 검토본이다. 운영자·문의 창구·호스팅 정보를 임의로 만들지 않았고, 아직 정해지지 않은 부분을 명시했다.
- 법률상 책임 면제나 개인정보보호법 준수 인증을 의미하지 않는다.

## 배포용 헤더

public/_headers는 Netlify/Cloudflare Pages 등 해당 형식을 지원하는 정적 호스팅용이다. 다른 호스팅에서는 동일한 값을 플랫폼 설정으로 적용해야 한다. 파일을 배포했다고 모든 호스트가 자동 적용하는 것은 아니다.

- Content-Security-Policy: 자체 자원과 필요한 Google 서비스만 허용, object/base/form/frame-ancestors 제한.
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Cross-Origin-Opener-Policy: same-origin-allow-popups
- Permissions-Policy: camera/microphone/geolocation 차단
- Referrer-Policy: strict-origin-when-cross-origin
- HTTPS 업그레이드는 CSP에 포함. HSTS는 실제 HTTPS와 도메인 확인 후 호스팅에서 별도 설정할 것.

Google 공식 가이드의 GIS 출처 정책을 참고하여 Google 스크립트는 로컬에서 no-referrer-when-downgrade, 운영에서 strict-origin-when-cross-origin을 사용한다. 작성 내용을 URL에 넣지 않으며 Google 통신에 일반 출처/접속 정보가 포함될 수 있음을 안내했다.
연결은 아직 설정되지 않아 실제 OAuth 팝업·권한 승인과 CSP의 전체 조합은 공개 전 검증이 필요하다.

## 재검증 결과

- TypeScript + Vite 정적 빌드 성공.
- 테스트 11개 통과: 기존 메일/공식 양식 7개, 항목별 검증 4개.
- 초기 화면·오류 상태·최종 확인창·개인정보 안내·이용약관의 선택한 axe-core WCAG A/AA·best-practice 자동 위반 0.
- 수동 확인 항목은 남았음: 장식 화살표의 글자 대비 자동 계산 불가, 좁은 화면 확인창의 BCC 항목 배경 자동 판정 불가. 흰색/남색 대비와 실제 셀 위치·스크린샷을 확인했다. 수동 검토와 전체 인증은 다르다.
- HTML standard preset 검사: 신고 화면, 최종 확인 상태, 개인정보 안내, 약관 모두 오류 0.
- 320/390/768/1440 기본 너비 가로 넘침 없음.
- 이전에 실패했던 320px 글자 200% CSS 모의검사: 문서 너비 305px, 가로 넘침 없음.
- 390px 글자 간격·단어 간격·줄간격 재정의 시 가로 넘침 없음.
- 잘못된 BCC → BCC 전용 오류 + 해당 입력으로 포커스 이동 확인.
- 필수 항목 누락 → 해당 신고의 필드 오류 + aria-describedby 연결 확인.
- 이름 있는 최종 확인창, 제목 초기 포커스, Tab 순환, Escape 종료, 호출 버튼 복귀 확인.
- 정적 미리보기에서 CSP 등 보안 헤더가 반환되고 앱·정책 페이지가 정상 표시됨을 확인.
- 신고 예시 입력·첨부·검토 중 지속 저장소는 비어 있었음.
- 공개 및 실제 메일 발송 없음.

## 아직 실제 운영 정보가 필요한 부분

1. 운영 주체의 실제 명칭과 개인정보 문의 연락처.
2. 호스팅/CDN 업체, 접속 로그 항목·목적·보관기간·보관 장소·권한·위탁/국외 처리 관계.
3. Google Cloud 설정, 최종 도메인과 운영 OAuth 프로젝트, 민감 권한 검증.
4. 실제 Google 통신 및 메일 송수신·권한 취소 확인. 별도 승인된 더미 자료로 수행할 것.
5. 실제 iPhone/Android, Safari/Firefox와 VoiceOver/TalkBack/NVDA의 수동 검사.
6. 위 사실관계에 맞는 최종 법률 검토 및 정책 시행일 확정.

개발 도구만으로 대신할 수 없는 이 항목들은 완료로 표시하지 않았다. 개인정보보호법 또는 KWCAG/WCAG의 완전 준수를 확정하는 보고서가 아니다.
