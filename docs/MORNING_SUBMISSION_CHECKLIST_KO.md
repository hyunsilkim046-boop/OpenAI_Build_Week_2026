# WhyRight — 7월 22일 아침 제출 체크리스트

> **완료 기록 (2026-07-22):** WhyRight는 Devpost에 최종 제출되었고 공개
> 프로젝트는 <https://devpost.com/software/whyright>에서 확인할 수 있다.
> 아래 내용은 제출 당시 사용한 보관용 실행 체크리스트다.

## 절대 기준

- 공식 마감: **2026-07-22 09:00 KST**
  (공식 표기: 2026-07-21 17:00 PDT)
- 내부 제출 마감: **08:30 KST**. 마지막 30분은 제출 완료 확인과 장애
  대응용으로 비운다.
- 공식 규정: <https://openai.devpost.com/rules>
- 영상은 **3분 미만**, 명확한 데모와 오디오 포함, YouTube에
  **Public(공개)** 상태로 올려야 한다. 공식 규정의 표현은 “made publicly
  visible on YouTube”이므로 **Unlisted(일부 공개)나 Private는 사용하지
  않는다**.
- 비밀번호, API 키, 토큰, 주소, 전화번호, 주민번호 등 개인정보를 문서,
  화면 녹화, 터미널, 저장소에 남기지 않는다.

## 오늘 밤 완료된 사전 작업

- GitHub 저장소는 Public이며 `yonghwan1106` 협업 초대를 수락해 쓰기
  권한을 확인했다.
- Vercel 프로젝트 `whyright-build-week-2026`를 연결하고 Production,
  Preview, Development 환경변수를 준비했다.
- 실제 GPT-5.6 응답과 실제 100/100 흐름을 담은 최종 영상
  `submission/video/WhyRight_Build_Week_2026_Demo.mp4`를 완성했다.
  길이 2:53.648, 1080p H.264/AAC이며 전체 디코드와 음량을 검증했다.
- 아침에는 새 기능 개발이나 영상 재제작을 하지 않는다. 공개 배포,
  배포 확인, YouTube Public 업로드, Devpost 최종 제출만 한다.

## 지금 15분 동안 사람이 미리 할 일

- [x] GitHub 저장소 소유 계정에서 대상 저장소
      `https://github.com/hyunsilkim046-boop/OpenAI_Build_Week_2026`의 협업자로 `yonghwan1106`을 추가하고,
      해당 계정에서 초대를 수락한다. 또는 저장소 소유 계정으로 직접
      푸시할 준비를 한다.
- [x] 저장소 공개 범위를 **Public**으로 할지 확인한다. Private라면 공식
      규정에 따라 `testing@devpost.com`과 `build-week-event@openai.com`에
      접근을 공유해야 하므로, 시간이 촉박한 MVP는 Public이 단순하다.
- [x] Vercel에 로그인된 계정과 새 프로젝트 생성 권한을 확인한다. 값은
      채팅이나 문서에 붙이지 말고 대시보드 환경변수 입력 화면에서만
      다룬다.
- [ ] YouTube 업로드 권한과 전화 인증/일일 업로드 제한 여부를 확인한다.
- [ ] Devpost 참가 등록과 제출 초안을 열 수 있는지 확인한다.
- [ ] Codex 핵심 작업에서 `/feedback`을 실행해 나온 Session ID를 안전한
      개인 메모에 보관한다. ID를 코드나 환경변수 파일에 넣지 않는다.

## 역산 일정: 06:30–08:30 KST

### 06:30–06:40 — 권한과 원본 동결

- [ ] `main` 브랜치의 최종 커밋, 변경 파일, 비밀정보 미추적 상태를
      확인한다.
- [ ] `.env.local`이 Git 추적 대상이 아닌지 확인한다.
- [ ] `yonghwan1106`의 대상 저장소 Write 권한 또는 소유 계정 인증을
      확인한다.
- [ ] 새 기능 추가를 중단한다. 이후에는 제출 차단 버그만 수정한다.

### 06:40–06:50 — GitHub 공개 상태 재검증

- [ ] 밤에 푸시한 최종 `main` 커밋이 그대로 있는지 확인한다.
- [ ] GitHub 웹에서 최신 커밋 해시와 시간이 로컬 최종 커밋과 같은지
      확인한다.
- [ ] 로그아웃/시크릿 창에서 `https://github.com/hyunsilkim046-boop/OpenAI_Build_Week_2026`가 열리고 README,
      LICENSE, 실행 방법, Codex 협업 내용이 보이는지 확인한다.
- [ ] 저장소 전체 검색으로 API 키, `.env.local`, 세션 토큰, 개인정보가
      없는지 마지막 확인한다.

### 06:50–07:05 — Vercel 공개 배포

- [x] Vercel 프로젝트 연결과 Production/Preview/Development 환경변수
      준비를 완료했다.
- [x] 이 PC의 구형 전역 CLI는 쓰지 말고, 프로젝트 폴더에서
      `npx --yes vercel@56.4.1 env ls`로 연결과 환경변수 이름을 먼저
      확인한다. 값은 출력하거나 복사하지 않는다.
- [x] `main`의 최신 커밋에서 `npx --yes vercel@56.4.1 --prod`를 실행해
      Production으로 배포한다.
- [x] 이 PC에서 `vercel build --prod`의 함수 폴더 symlink 단계가 Windows
      `EPERM`으로 끝나더라도 앱 컴파일 실패로 오해하지 않는다. 원격
      Production 배포 로그를 기준으로 판정한다.
- [x] Production 환경변수 이름이 `OPENAI_API_KEY`, `SESSION_SECRET`인지
      값 노출 없이 다시 확인한다.
- [x] 기본 모델이 `gpt-5.6`인지 확인한다. 필요한 경우에만
      `OPENAI_MODEL=gpt-5.6`을 명시한다.
- [x] 배포를 시작하고 Build 로그에 오류가 없는지 확인한다.
- [x] Live URL을 기록했다:
      `https://whyright-build-week-2026.vercel.app/`

### 07:05–07:25 — 실제 공개 흐름 검증

- [x] 로그인 없는 새 브라우저 세션에서 Live URL을 열어 두 시나리오가 보이는지
      확인한다.
- [x] **The Shrinking Product**를 선택하고 실제 GPT-5.6 질문 1회, 후보
      제거, 진단, 70/10/20 결과까지 완주한다.
- [x] **Two Julys, Two Seasons**에서도 실제 GPT-5.6 질문 1회, 후보 제거,
      진단, 70/10/20 결과까지 완주한다.
- [x] 세 API route의 잘못된 입력이 400 JSON으로 처리되고 키·스택·로컬
      경로를 노출하지 않는지 Production에서 확인한다.
- [x] 390×844 모바일 뷰에서 콘텐츠, 52px 시작 버튼, 가로 overflow 없음과
      반응형 시작 화면을 확인한다. 질문·후보·진단·결과 모바일 흐름은
      최종 브라우저 QA에서도 통과했다.
- [x] Production의 90초 타이머와 probe 카운터가 작동하며, 최대 3개 제한은
      자동 테스트로 재검증했다.

### 07:25–07:40 — 완성 영상 최종 검토

- [x] 완성된 `submission/video/WhyRight_Build_Week_2026_Demo.mp4`를 처음부터
      끝까지 한 번 재생한다. 원본은 다시 편집하지 않는다.
- [x] 실제 GPT-5.6 응답, 100/100, 21 tests, 8/8 fixed probes 문구가 보이며
      자동 신호 점검과 별도로 수동 검토가 필요하다는 문구가 유지되는지
      확인한다.
- [x] 오디오가 명확하고 무단 음악·타사 저작물이 없는지 확인한다.
- [x] 영상 길이가 **2:59 이하**인지 플레이어에서 다시 확인한다.
- [x] 화면에 브라우저 계정, 이메일, 알림, 로컬 경로의 개인정보,
      `.env.local`, 키, 토큰이 없는지 프레임 단위로 확인한다.

### 07:40–08:00 — YouTube 공개

- [x] `submission/video/YOUTUBE_UPLOAD_COPY.md`의 제목·설명을 사용해
      영상을 업로드한다.
- [ ] 가능하면 `submission/video/WhyRight_Thumbnail.png`를 썸네일로 쓴다.
- [ ] `submission/video/WhyRight_Build_Week_2026_Demo.en.srt`를 영문 자막으로
      업로드한다.
- [ ] 아동용 콘텐츠 여부 등 YouTube 필수 설정을 실제 콘텐츠에 맞게
      선택한다.
- [x] 공개 범위를 **Public**으로 설정한다. Unlisted/Private 금지.
- [x] 공개 URL `https://youtu.be/9Qos6J0MOuI`에서 1080p 영상과 오디오
      스트림의 실제 8초 구간을 내려받아 전체 디코드한다.

### 08:05–08:20 — Devpost 입력

- [ ] Category를 **Education**으로 선택한다.
- [ ] `docs/DEVPOST_SUBMISSION_COPY.md`의 영어 문구를 복사하고 줄바꿈이
      깨지지 않았는지 확인한다.
- [ ] Live·GitHub·YouTube URL은 실제 값으로 교체됐다.
      `[CODEX_FEEDBACK_SESSION_ID]`를 실제 값으로 교체하고, 대괄호
      placeholder가 하나라도 남으면 제출하지 않는다.
- [ ] 공개 YouTube 링크, 코드 저장소 URL, 작동하는 Live URL을 각각 올바른
      필드에 넣는다.
- [ ] 이미지 갤러리 필드가 있으면 `submission/screenshots/`의 3장을 순서대로
      올리고 `README.md`의 캡션을 사용한다.
- [ ] README에 Codex가 가속한 작업, 사람이 내린 제품·설계 결정,
      GPT-5.6 역할이 명확한지 확인한다.
- [ ] `/feedback` Codex Session ID는 핵심 기능 대부분을 만든 프로젝트
      작업의 ID인지 확인한다.
- [ ] 합성 시나리오만 사용했고 실제 파일럿·학습효과 측정이 없다는 정직한
      한계 문구를 유지한다.

### 08:20–08:30 — 최종 제출과 증거 보관

- [ ] Devpost 미리보기에서 제목, 설명, 카테고리, 세 링크, Session ID,
      영상 썸네일을 한 번 더 읽는다.
- [ ] 필수 동의/자격 항목을 본인이 확인한다.
- [ ] **08:30 이전에 Final Submit**을 누른다. Draft 저장만으로 끝내지
      않는다.
- [ ] 제출 완료 화면, 프로젝트 URL, 제출 시각이 함께 보이도록
      스크린샷을 남긴다.
- [ ] 아래 증거를 개인 보관 위치에 저장한다.
  - 제출 완료 화면
  - Devpost 공개/제출 프로젝트 URL
  - GitHub 최신 `main` 커밋 화면
  - Vercel Production 성공 화면과 Live URL
  - YouTube Public 상태와 영상 길이
  - `/feedback` Session ID를 확인할 수 있는 화면
- [ ] 08:30–09:00에는 링크 장애가 있을 때만 수정하고, 제출 내용의 대규모
      재작성은 하지 않는다.

## Hard stop 및 롤백 기준

1. **07:05까지 Vercel 배포 실패**
   - 새 기능과 스타일 수정 즉시 중단.
   - 마지막 로컬 검증 통과 커밋으로 배포를 재시도한다.
   - 원인이 환경변수라면 값 노출 없이 이름·적용 환경·재배포 여부만
     확인한다.

2. **07:25까지 Live GPT 흐름 불안정**
   - 모델 응답을 가짜로 대체하지 않는다.
   - 완성 영상은 이미 검증된 실제 성공 흐름이므로 수정하지 않는다.
     배포 환경변수, 런타임 로그, 모델 접근 권한을 우선 확인한다.
   - Devpost에는 작동 한계가 있으면 정직하게 적는다.

3. **완성 영상에 재생 불가 결함 발견**
   - `submission/video/VERIFY.md`의 SHA-256과 코덱 정보를 먼저 대조한다.
   - 원본이 정상이라면 검증된 원본을 업로드하고, 복사본만 손상됐는지
     확인한다. 아침에 기능 화면을 새로 녹화하지 않는다.

4. **08:05까지 YouTube 처리 지연**
   - 저해상도라도 재생 가능한 Public 상태가 먼저다.
   - Public URL이 시크릿 창에서 재생되지 않으면 제출 링크로 사용하지
     않는다.

5. **08:20까지 부가 산출물 미완성**
   - 추가 이미지, 긴 기술 설명, 선택 필드를 포기한다.
   - 필수 텍스트, Public 영상, 저장소, 작동 프로젝트, `/feedback` Session
     ID를 우선한다.

6. **08:30 도달**
   - 기능·문구 개선을 멈추고 현재 검증된 자료로 제출한다.
   - 09:00을 목표 시각으로 사용하지 않는다. 네트워크와 폼 오류를 위한
     30분 버퍼를 보존한다.

## 최종 placeholder 검색

제출 전 아래 세 문자열이 Devpost 입력란에 남아 있지 않은지
검색한다.

- `[CODEX_FEEDBACK_SESSION_ID]`
