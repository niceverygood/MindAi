// Color palette
export const C = {
    bg: '#FFFFFF',
    surface: '#F7F8FA',
    blue: '#2563EB',
    blueLight: '#DBEAFE',
    blueMid: '#93C5FD',
    blueDark: '#1D4ED8',
    text: '#111827',
    textSec: '#6B7280',
    textMut: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    dangerText: '#DC2626',
    dangerBg: '#FEF2F2',
    warnText: '#D97706',
    warnBg: '#FFFBEB',
    successText: '#059669',
    successBg: '#ECFDF5',
};

// Static data
export const patients = [
    { id: 1, name: '김○○', age: 34, type: '재진', diagnosis: '우울장애', predictedMin: 12, status: '진료중', risk: 'low', scaleChange: -3, time: '09:00' },
    { id: 2, name: '이○○', age: 7, type: '초진', diagnosis: 'ADHD 의심', predictedMin: 45, status: '대기', risk: 'medium', scaleChange: null, time: '09:40', isChild: true },
    { id: 3, name: '박○○', age: 28, type: '재진', diagnosis: '공황장애', predictedMin: 15, status: '대기', risk: 'high', scaleChange: 5, time: '09:55' },
    { id: 4, name: '최○○', age: 5, type: '재진', diagnosis: '분리불안', predictedMin: 25, status: '대기', risk: 'medium', scaleChange: -1, time: '10:20', isChild: true },
    { id: 5, name: '정○○', age: 42, type: '재진', diagnosis: '조현병', predictedMin: 20, status: '대기', risk: 'low', scaleChange: -2, time: '10:45' },
    { id: 6, name: '강○○', age: 19, type: '초진', diagnosis: '사회불안장애', predictedMin: 35, status: '대기', risk: 'medium', scaleChange: null, time: '11:05' },
    { id: 7, name: '윤○○', age: 4, type: '초진', diagnosis: '발달지연 의심', predictedMin: 50, status: '대기', risk: 'medium', scaleChange: null, time: '11:40', isChild: true },
    { id: 8, name: '한○○', age: 55, type: '재진', diagnosis: '양극성장애', predictedMin: 18, status: '대기', risk: 'low', scaleChange: -4, time: '12:30' },
];

export const weeklyStats = [
    { day: '월', w: 12 }, { day: '화', w: 18 }, { day: '수', w: 8 }, { day: '목', w: 15 }, { day: '금', w: 22 },
];

export const childGames = [
    { id: 'memory', name: '기억력 게임', icon: '🧩', desc: '카드 뒤집기로 작업기억 측정', domain: '작업기억', age: '3-7세' },
    { id: 'pattern', name: '패턴 찾기', icon: '🔷', desc: '규칙 발견으로 유동추론 측정', domain: '유동추론', age: '4-7세' },
    { id: 'story', name: '이야기 만들기', icon: '📖', desc: '그림보고 이야기 구성', domain: '언어·정서', age: '3-7세' },
    { id: 'maze', name: '미로 탈출', icon: '🏰', desc: '길찾기로 시공간 처리 측정', domain: '시공간', age: '4-7세' },
    { id: 'emotion', name: '감정 알아맞히기', icon: '😊', desc: '표정 인식으로 사회인지 측정', domain: '사회인지', age: '3-7세' },
    { id: 'speed', name: '두더지 잡기', icon: '⚡', desc: '반응속도 및 주의력 측정', domain: '처리속도', age: '3-7세' },
];

export const tabs = [
    { id: 'dashboard', l: '대시보드', i: '📊' },
    { id: 'child', l: '아동평가', i: '🎮' },
    { id: 'drawing', l: '그림검사', i: '🎨' },
    { id: 'report', l: '풀배터리', i: '📋' },
    { id: 'risk', l: '위험감지', i: '🛡' },
    { id: 'data', l: '진료분석', i: '🔬' },
    { id: 'soap', l: 'SOAP', i: '📝' },
    { id: 'patreport', l: '환자보고', i: '📄' },
];

// Storage helpers
const SKEY = 'mindai-patients';

export function loadPatients() {
    try {
        const raw = localStorage.getItem(SKEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function savePatients(p) {
    try {
        localStorage.setItem(SKEY, JSON.stringify(p));
    } catch { }
}

export function clearPatients() {
    try {
        localStorage.removeItem(SKEY);
    } catch { }
}

// Prediction engine
export function predict(records) {
    if (!records?.length) return null;
    const L = records[records.length - 1];
    const P = records.length > 1 ? records[records.length - 2] : null;

    let ns = 0.08, nf = [];
    if (L.noshow_risk_factors?.length) {
        ns += L.noshow_risk_factors.length * 0.05;
        nf.push(...L.noshow_risk_factors);
    }
    if (L.treatment_response === '악화') { ns += 0.08; nf.push('치료반응 악화'); }
    ns = Math.min(ns, 0.95);

    let cm = records.length <= 1 ? 40 : 15;
    if (L.risk_assessment?.suicide_risk === '높음') cm += 15;
    if (L.medications?.length > 3) cm += 5;
    if (L.scales?.some(s => s.severity === '중증')) cm += 10;

    const trends = [];
    if (P && L.scales) {
        for (const sc of L.scales) {
            const ps = P.scales?.find(p => p.name === sc.name);
            if (ps) trends.push({ name: sc.name, cur: sc.score, prev: ps.score, d: sc.score - ps.score });
        }
    }

    let rk = 'low';
    if (L.risk_assessment?.suicide_risk === '높음') rk = 'high';
    else if (L.risk_assessment?.suicide_risk === '중등' || L.treatment_response === '악화') rk = 'medium';

    let rp = '유지';
    if (trends.length) {
        const imp = trends.filter(t => t.d < 0).length;
        const wor = trends.filter(t => t.d > 0).length;
        if (imp > wor) rp = '호전 예상';
        else if (wor > imp) rp = '악화 우려';
    }

    const sh = {};
    for (const r of records) {
        if (r.scales) {
            for (const s of r.scales) {
                if (!sh[s.name]) sh[s.name] = [];
                sh[s.name].push(s.score);
            }
        }
    }

    return {
        noshowProb: Math.round(ns * 100),
        noshowFactors: nf,
        consultMin: Math.round(cm),
        trends,
        riskLevel: rk,
        responsePredict: rp,
        totalVisits: records.length,
        scaleHistory: sh,
        meds: L.medications || [],
        recs: L.recommendations || [],
        risk: L.risk_assessment,
    };
}
