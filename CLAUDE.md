# NZ Bird Finder - AI 도감 프로젝트 가이드

이 파일은 AI 개발 에이전트(Antigravity 등)가 이 프로젝트를 이해하고 관리할 수 있도록 안내하는 가이드 문서입니다.

## 🛠️ 기술 스택 & 구조
- **HTML**: 표준 시맨틱 HTML5 (`index.html`)
- **CSS**: 반응형 모바일 우선 디자인, 딥 에메랄드 포레스트 테마 (`styles.css`)
- **JavaScript**: 바닐라 JS, 로컬 스토리지 CRUD, 멀티모달 Gemini API (`app.js`)
- **Database**: 로컬 JSON 기초 데이터 (`database.json`)
- **외부 연동**: iNaturalist API (실시간 관측 사진), eBird API (뉴질랜드 최근 목격지)

## 🚀 주요 명령어
- **로컬 서버 기동**: `python3 -m http.server 8000` (브라우저 주소: `http://localhost:8000`)
- **버전 관리 및 배포**: GitHub Desktop을 통해 `main` 브랜치로 커밋 및 푸시하면 GitHub Pages로 자동 배포됨.

## 📌 개발 및 수정 규칙
1. **한국어 번역 가드레일**: 새의 한국어 이름 검색 시 단순 단어 번역(예: Morepork -> '더 많은 돼지고기')을 금지하며, 공식 학명/조류명이 존재하는 경우에만 한국어 이름을 표출하고 없는 경우 '공식 한국어 이름 없음'으로 명시해야 함.
2. **서버리스 아키텍처 유지**: 모든 백엔드 연동은 브라우저 클라이언트 사이드에서 처리하며, API Key는 로컬 스토리지(`localStorage`)에 저장하고 외부 유출이 없도록 유지해야 함.
3. **외부 API 사용 준수**:
   - 사진 연동: iNaturalist `/v1/observations` 엔드포인트를 사용해 실제 사진을 가져옴.
   - 목격지 연동: eBird `/v2/data/obs/NZ/recent` 엔드포인트를 이용하며 반드시 `X-eBirdApiToken` 인증 헤더가 요구됨.
