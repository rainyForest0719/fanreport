# 외부 체험 배포 기록 (2026-11-06)

- URL: https://rainyforest0719.github.io/fanreport/
- GitHub Pages / Actions 배포. 공개 Client ID는 저장소 Actions 변수로 설정.
- 프로젝트 base `/fanreport/`, 정책 문서 상대 링크, 앱 정책 링크 BASE_URL 적용.
- 앱 HTML의 CSP meta는 GitHub Pages에서 적용 가능한 지시문만 포함. `_headers` 응답 헤더는 Pages에서 적용되지 않음.
- GitHub 운영 계정·Issues 문의 및 Pages IP 보안 기록 안내 반영.
- Google 브랜딩: FAN REPORT, 홈페이지·개인정보·약관 URL 등록.
- OAuth 원본에 https://rainyforest0719.github.io 추가 (로컬 2개 유지).
- 사용자 확인 후 현재 지원 이메일 유지 및 Production 전환.
- gmail.send만 유지. Google 브랜딩 및 민감 권한 검증은 아직 완료되지 않음. 화면에 평생 100명 한도(당시 1명 사용) 표시.
- 등록된 테스트 사용자만 허용하던 제한은 Production으로 해제되지만, 미검증 경고·한도·계정 정책에 따른 차단 가능. 모든 계정의 연결 성공을 검증한 것은 아님.
- 테스트 32개 및 프로젝트 경로 빌드 통과. 공개 홈·개인정보·약관 HTTP 200, 공개 페이지 GIS 스크립트 로드 확인. 추가 메일은 발송하지 않음.

브랜딩 및 gmail.send 검증을 완료한 이후에만 경고와 미검증 사용자 한도 해제를 완료했다고 안내할 수 있음.

## 소유권 확인 후 남은 절차

- Google 브랜딩 자동 검사에서 홈페이지 소유권 미확인 문제를 확인함.
- 홈페이지에 Google 소유 확인 메타태그 배포 완료.
- 사용자 승인 후 현재 Google 계정으로 URL 접두어 속성 소유 확인 성공 (HTML 태그 방식). 태그를 삭제하면 소유 확인이 해제될 수 있음.
- Google 안내는 소유 확인 후 시스템 반영을 위해 24시간 기다린 뒤 브랜딩 검사를 다시 시도하도록 요구함.
- 이후 브랜딩 인증·게시를 완료하고 인증 센터의 gmail.send 검증 준비 절차를 진행해야 함. Google에 심사가 접수되었거나 승인되었다고 표시하지 않음.
- 공개 Gmail 스크립트 준비 단계 성공, 브라우저 경고/오류 로그 없음. 다른 외부 계정의 실제 동의·발송은 이번 작업에서 수행하지 않음.
