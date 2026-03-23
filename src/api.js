// OpenRouter API configuration
const STORAGE_KEY = 'mindai-api-key';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';
const DEFAULT_API_KEY = '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';

export function getApiKey() {
    try {
        return localStorage.getItem(STORAGE_KEY) || DEFAULT_API_KEY;
    } catch {
        return DEFAULT_API_KEY;
    }
}

export function setApiKey(key) {
    try {
        localStorage.setItem(STORAGE_KEY, key.trim());
    } catch { }
}

export function hasApiKey() {
    return !!getApiKey();
}

export async function callAI(messages, maxTokens = 4000) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. 설정에서 OpenRouter API 키를 입력해주세요.');
    }

    try {
        const res = await fetch(OPENROUTER_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'MindAI Platform',
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                max_tokens: maxTokens,
                messages,
            }),
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            if (res.status === 401) {
                throw new Error('API 키가 유효하지 않습니다. 설정에서 올바른 키를 입력하세요.');
            }
            throw new Error(errData.error?.message || `API Error: ${res.status}`);
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        return text;
    } catch (e) {
        console.error('OpenRouter API Error:', e);
        throw e;
    }
}

export async function callAIJSON(messages, maxTokens = 4000) {
    const text = await callAI(messages, maxTokens);
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
}

// For image/document analysis via OpenRouter vision
export async function analyzeDocument(base64, mediaType) {
    const content = [];

    if (mediaType.startsWith('image/')) {
        content.push({
            type: 'image_url',
            image_url: {
                url: `data:${mediaType};base64,${base64}`,
            },
        });
    } else {
        // For PDFs, we'll send as text instruction
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

    const messages = [{ role: 'user', content }];
    return callAIJSON(messages, 4000);
}
