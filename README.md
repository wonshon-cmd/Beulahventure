# Beulah Ventures

초기 단계 벤처캐피털 **Beulah Ventures**의 웹사이트입니다. (한국어 / English)

An early-stage venture capital firm website, bilingual in Korean and English.

## 구성 / Structure

| 파일 | 설명 |
| --- | --- |
| `index.html` | 페이지 구조 (소개, 투자 분야, 투자 방식, 포트폴리오, 팀, 피치 제출) |
| `styles.css` | 스타일 (라이트/다크 모드, 모바일 대응) |
| `data.js` | **콘텐츠 편집용** — 포트폴리오, 팀, 한/영 번역 문구 |
| `script.js` | 언어 전환, 포트폴리오·팀 렌더링, 피치 폼 처리 |

빌드 과정이 없는 정적 사이트입니다. No build step — plain HTML/CSS/JS.

## 로컬 실행 / Run locally

```bash
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 을 엽니다.

## 콘텐츠 수정 / Editing content

- **포트폴리오 추가**: `data.js`의 `portfolio` 배열에 항목 추가
- **팀원 수정**: `data.js`의 `team` 배열 (현재 예시 프로필 — 실제 정보로 교체 필요)
- **문구 수정**: `data.js`의 `i18n.ko` / `i18n.en`
- **연락처 이메일**: `script.js`의 `PITCH_EMAIL`, `index.html` 푸터

## 피치 제출 폼 / Pitch form

현재는 정적 사이트이므로 제출 시 사용자의 메일 앱이 열립니다(`mailto:`).
서버에 제출 내용을 저장하려면 Formspree, Netlify Forms, Google Forms 등으로 교체하세요.

## 배포 / Deploy

GitHub Pages: 저장소 Settings → Pages → Branch 선택 후 루트(`/`) 지정.
