const ENDPOINT = '/api/chat';
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';

export async function callAI(messages, maxTokens = 4000) {
    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                max_tokens: maxTokens,
                messages,
            }),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || `API Error: ${res.status}`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    } catch (e) {
        console.error('AI API Error:', e);
        throw e;
    }
}

export async function callAIJSON(messages, maxTokens = 4000) {
    const text = await callAI(messages, maxTokens);
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
}

export async function analyzeDocument(base64, mediaType) {
    const content = [];

    if (mediaType.startsWith('image/')) {
        content.push({
            type: 'image_url',
            image_url: { url: `data:${mediaType};base64,${base64}` },
        });
    } else {
        content.push({
            type: 'text',
            text: `[업로드된 문서: ${mediaType} 파일, base64 데이터 포함]`,
        });
    }

    content.push({
        type: 'text',
        text: `정신건강의학과 AI 어시스턴트입니다. 진료 기록을 분석하여 순수 JSON만 출력해주세요. Markdown 백틱 없이.
{
  "patient_info": {"name": "환자명", "age": 숫자, "gender": "M/F", "diagnosis": ["진단"], "diagnosis_codes": ["F코드"]},
  "visit_date": "YYYY-MM-DD",
  "scales": [{"name": "척도명", "score": 숫자, "max_score": 최대, "severity": "정상/경도/중등도/중증", "subscales": [{"name": "하위", "score": 숫자}]}],
  "medications": [{"name": "약물", "dose": "용량", "frequency": "횟수"}],
  "clinical_notes": "소견 요약",
  "risk_assessment": {"suicide_risk": "없음/낮음/중등/높음", "self_harm_risk": "", "violence_risk": "", "flags": []},
  "predicted_consultation_minutes": 숫자,
  "noshow_risk_factors": ["요인"],
  "treatment_response": "호전/유지/악화/판단불가",
  "recommendations": ["권고"]
}`,
    });

    return callAIJSON([{ role: 'user', content }], 4000);
}
