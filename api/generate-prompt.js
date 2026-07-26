// Vercel 서버리스 함수 (api/generate-prompt.js)
// - 브라우저는 이 엔드포인트만 호출하고, Gemini API 키는 여기(서버)에만 존재한다.
// - Vercel 프로젝트 설정 > Environment Variables 에 GEMINI_API_KEY를 등록해두면
//   process.env.GEMINI_API_KEY로 안전하게 읽을 수 있다.

const MODEL = 'gemini-2.5-flash'; // 필요하면 최신 모델명으로 교체 가능 (예: gemini-3.5-flash-lite)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 지원합니다.' });
    return;
  }

  const { emotion } = req.body || {};

  if (!emotion || typeof emotion !== 'string' || !emotion.trim()) {
    res.status(400).json({ error: '감정을 입력해주세요.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: '서버에 GEMINI_API_KEY가 설정되지 않았습니다.' });
    return;
  }

  const promptForGemini = `너는 사용자의 감정을 읽고, 그 감정을 위로할 그림을 기획하는 아트 디렉터야.
사용자가 입력한 감정 표현을 분석해서 아래 세 가지를 만들어줘.

1. emotion: 사용자의 감정을 한두 단어로 요약 (한국어)
2. comfort_message: 그 감정을 다정하게 위로하는 한국어 문장 (2문장 이내, 존댓말)
3. image_prompt: 그 감정을 위로할 수 있는 따뜻하고 치유적인 이미지를 그리기 위한 "영어" 이미지 생성 프롬프트.
   - 구체적인 스타일(예: soft watercolor, warm lighting, gentle pastel colors), 소재, 분위기를 포함할 것
   - 사람의 얼굴이나 글자(텍스트)는 넣지 말 것
   - 자연물, 풍경, 사물 등 은유적인 이미지를 활용할 것

사용자의 감정 입력: "${emotion.trim()}"

반드시 JSON 형식으로만 응답해.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: promptForGemini }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                emotion: { type: 'STRING' },
                comfort_message: { type: 'STRING' },
                image_prompt: { type: 'STRING' },
              },
              required: ['emotion', 'comfort_message', 'image_prompt'],
            },
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      res.status(502).json({ error: 'Gemini API 호출에 실패했습니다.' });
      return;
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Unexpected Gemini response shape:', JSON.stringify(data));
      res.status(502).json({ error: 'Gemini 응답을 해석할 수 없습니다.' });
      return;
    }

    const parsed = JSON.parse(text);
    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버에서 오류가 발생했습니다.' });
  }
}
