import { useState } from 'react';

// Pollinations는 API 키 없이 GET 요청만으로 이미지를 생성합니다.
// prompt를 URL에 담아 요청하면 해당 프롬프트로 그려진 이미지가 바로 반환됩니다.
function buildPollinationsUrl(prompt) {
  const seed = Math.floor(Math.random() * 1_000_000);
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}`;
}

export default function App() {
  const [emotionInput, setEmotionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { emotion, comfort_message, image_prompt }
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emotionInput.trim() || loading) return;

    setLoading(true);
    setError('');
    setResult(null);
    setImageUrl('');

    try {
      // 1) Gemini에게 감정 분석 + 위로 문구 + 이미지 프롬프트 생성을 맡긴다.
      //    (Gemini API 키는 서버(api/generate-prompt.js)에만 있고 브라우저에는 노출되지 않는다)
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emotion: emotionInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '요청 처리 중 문제가 발생했어요.');
      }

      setResult(data);

      // 2) Gemini가 만들어준 image_prompt를 그대로 Pollinations에 전달한다.
      setImageLoading(true);
      setImageUrl(buildPollinationsUrl(data.image_prompt));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>마음캔버스</h1>
      <p className="subtitle">
        지금 느끼는 감정을 편하게 적어보세요.
        <br />그 마음을 가만히 안아줄 그림을 그려드릴게요.
      </p>

      <form onSubmit={handleSubmit} className="emotion-form">
        <textarea
          value={emotionInput}
          onChange={(e) => setEmotionInput(e.target.value)}
          placeholder="예: 오늘 발표를 망쳐서 너무 속상해"
          rows={3}
        />
        <button type="submit" disabled={loading}>
          {loading ? '마음을 읽는 중...' : '그림 그리기'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <span className="emotion-tag">오늘의 감정 · {result.emotion}</span>
          <p className="comfort-message">{result.comfort_message}</p>

          <div className="image-wrap">
            {imageLoading && <p className="loading-text">그림을 그리는 중이에요...</p>}
            <img
              src={imageUrl}
              alt={result.image_prompt}
              style={{ display: imageLoading ? 'none' : 'block' }}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setError('이미지를 불러오지 못했어요. 다시 시도해주세요.');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
