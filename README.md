# 마음캔버스 (mind-canvas)

감정을 입력하면 Gemini가 그 감정을 분석해 위로의 말과 이미지 프롬프트를 만들고,
Pollinations가 그 프롬프트로 그림을 그려주는 웹앱입니다.

## 동작 흐름 (I‑P‑O)

1. **Input** — 사용자가 감정을 텍스트로 입력
2. **Process** — 브라우저가 `/api/generate-prompt`(Vercel 서버리스 함수)를 호출
   → 함수가 서버에 숨겨둔 `GEMINI_API_KEY`로 Gemini API를 호출
   → Gemini가 `emotion`(감정 요약) / `comfort_message`(위로 문장) / `image_prompt`(영어 이미지 프롬프트)를 JSON으로 반환
3. **Output** — 브라우저가 `image_prompt`를 그대로 Pollinations 이미지 URL에 넣어 `<img>`로 표시
   (Pollinations는 API 키가 필요 없어서 프런트엔드에서 바로 호출 가능)

```
사용자 입력(감정)
      │
      ▼
/api/generate-prompt (Vercel 서버리스 함수, GEMINI_API_KEY는 여기에만 존재)
      │  Gemini API 호출
      ▼
{ emotion, comfort_message, image_prompt }
      │
      ▼
https://image.pollinations.ai/prompt/{image_prompt}  → 이미지 표시
```

## 로컬 개발

```bash
npm install
```

`/api` 폴더의 서버리스 함수는 일반 `vite` dev 서버에서는 동작하지 않습니다.
Vercel CLI로 실행해야 프런트엔드 + API를 함께 테스트할 수 있습니다.

```bash
npm install -g vercel   # 최초 1회
cp .env.example .env    # .env 파일 만들고 GEMINI_API_KEY 값 채우기
vercel dev
```

## Gemini API 키 발급

1. https://aistudio.google.com/apikey 에서 API 키 발급
2. 무료 티어 사용 가능 모델인지 확인 (모델 가용성은 자주 바뀌므로 발급 시점에 재확인 권장)
3. `api/generate-prompt.js` 상단의 `MODEL` 값이 실제 사용 가능한 모델명과 일치하는지 확인
   (이 프로젝트는 기본값으로 `gemini-2.5-flash`를 사용합니다)

## GitHub → Vercel 배포

1. 이 프로젝트를 GitHub 저장소에 push
2. [vercel.com](https://vercel.com) → New Project → 방금 만든 저장소 Import
3. **Settings → Environment Variables**에서 아래 값 추가
   - Key: `GEMINI_API_KEY`
   - Value: 발급받은 Gemini API 키
   - Environment: Production / Preview / Development 모두 체크
4. Deploy

> ⚠️ `GEMINI_API_KEY`는 `VITE_` 접두사를 붙이지 않습니다.
> `VITE_`가 붙으면 클라이언트(브라우저) 번들에 그대로 노출되어 키가 유출됩니다.
> 이 프로젝트에서는 `api/generate-prompt.js`(서버 쪽 코드)에서만 `process.env.GEMINI_API_KEY`로 읽으므로 안전합니다.

## 학생용으로 커스터마이징할 때

- `api/generate-prompt.js`의 프롬프트 지시문을 바꾸면 위로 문구의 톤이나 이미지 스타일을 다르게 만들 수 있습니다.
- Pollinations URL의 `width`, `height` 쿼리 파라미터로 이미지 크기를 조절할 수 있습니다.
- `image_prompt`에 특정 화풍(예: "Studio Ghibli style", "pixel art")을 강제로 덧붙이게 하면 결과물의 스타일을 통일할 수 있습니다.
