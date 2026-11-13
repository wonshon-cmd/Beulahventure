# 가입(Sign-up) 연결하기 — Firebase

사이트의 "신청하기"는 Firebase Authentication(로그인)과 Firestore(신청서 저장)를 씁니다.
아래를 한 번만 해 두면 Google · Apple · Microsoft · 이메일+비밀번호 가입과 이메일 인증이 실제로 작동합니다.

## 1. 프로젝트 만들기 (5분)
1. https://console.firebase.google.com 에서 **Add project** → 이름 예: `beulah-venture` → 만들기 (Google Analytics는 꺼도 됨)
2. 프로젝트 홈에서 **웹 앱 추가(</>)** → 이름 `beulahventure.com` → 등록
3. 화면에 나오는 `firebaseConfig`에서 **apiKey, authDomain, projectId, appId** 네 값을 복사해 Claude에게 보내기
   (이 값들은 공개되어도 되는 값입니다. 보안은 아래 Firestore 규칙이 지킵니다.)

## 2. 로그인 방법 켜기 — Authentication → Sign-in method
- **Email/Password**: 사용 설정 (이메일 인증 메일은 자동 발송)
- **Google**: 사용 설정, 지원 이메일 선택 — 바로 됨
- **Microsoft**: Azure Portal(portal.azure.com) → App registrations → New registration
  → Redirect URI에 Firebase가 보여주는 `https://<프로젝트>.firebaseapp.com/__/auth/handler` 입력
  → Application (client) ID와 Client secret을 Firebase에 붙여넣기
- **Apple**: Apple Developer Program(연 $99) 필요. Services ID, Key 만들고 Firebase에 입력.
  준비가 안 됐으면 Claude에게 "Apple 버튼 숨겨줘"라고 하면 됩니다.

## 3. 도메인 허용 — Authentication → Settings → Authorized domains
- `beulahventure.com`, `www.beulahventure.com`, `wonshon-cmd.github.io` 추가

## 4. 신청서 저장소 — Firestore Database
1. **Create database** → Production mode → 지역 `us-east1` 등
2. **Rules** 탭에 이 저장소의 `docs/firestore.rules` 내용을 붙여넣고 Publish
3. 신청서는 Firestore의 `applications` 컬렉션에 사람별(로그인 계정별) 한 건씩 저장됩니다.

## 5. 인증 메일 보내는 주소 (선택)
Authentication → Templates에서 보내는 사람 이름을 "Beulah Venture Capital"로 바꾸고,
원하면 Customize domain으로 `noreply@beulahventure.com`처럼 바꿀 수 있습니다(도메인 DNS에 기록 추가 필요).
