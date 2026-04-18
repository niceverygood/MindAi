// Validated clinical scales (Korean translations)

const FREQ_OPTIONS = [
    { label: '전혀 아님', value: 0 },
    { label: '며칠', value: 1 },
    { label: '1주 이상', value: 2 },
    { label: '거의 매일', value: 3 },
];

export const SCALES = {
    phq9: {
        id: 'phq9',
        name: 'PHQ-9',
        fullName: '환자 건강 설문지-9',
        domain: '우울',
        mode: 'items',
        instruction: '지난 2주 동안, 다음 문제들로 얼마나 자주 방해를 받으셨습니까?',
        options: FREQ_OPTIONS,
        items: [
            '일을 하는 것에 대한 흥미나 즐거움이 거의 없음',
            '기분이 가라앉거나, 우울하거나, 희망이 없다고 느낌',
            '잠들기 어렵거나, 자꾸 깨거나, 혹은 너무 많이 잠',
            '피곤함 또는 기운이 없음',
            '식욕이 없거나 또는 너무 많이 먹음',
            '내가 실패자라고 느끼거나, 자신 혹은 가족을 실망시켰다고 느낌',
            '신문을 읽거나 TV를 볼 때 집중하기 어려움',
            '다른 사람들이 눈치 챌 정도로 말이나 행동이 느려지거나, 반대로 너무 안절부절못하여 가만히 있을 수 없음',
            '차라리 죽는 것이 낫겠다 혹은 자해 생각',
        ],
        criticalItems: [8],
        ranges: [
            { max: 4, severity: '최소', variant: 'success' },
            { max: 9, severity: '경도', variant: 'blue' },
            { max: 14, severity: '중등도', variant: 'warn' },
            { max: 19, severity: '중등도-중증', variant: 'warn' },
            { max: 27, severity: '중증', variant: 'danger' },
        ],
    },
    gad7: {
        id: 'gad7',
        name: 'GAD-7',
        fullName: '일반화된 불안장애 척도-7',
        domain: '불안',
        mode: 'items',
        instruction: '지난 2주 동안, 다음 문제들로 얼마나 자주 방해를 받으셨습니까?',
        options: FREQ_OPTIONS,
        items: [
            '초조하고 불안하거나 조급해짐',
            '걱정을 멈추거나 조절할 수 없음',
            '여러 가지 것들에 대해 지나치게 걱정함',
            '편하게 있기 어려움',
            '쉽게 짜증나거나 화가 남',
            '너무 안절부절못해서 가만히 있기 어려움',
            '무서운 일이 일어날 것 같은 두려움',
        ],
        ranges: [
            { max: 4, severity: '최소', variant: 'success' },
            { max: 9, severity: '경도', variant: 'blue' },
            { max: 14, severity: '중등도', variant: 'warn' },
            { max: 21, severity: '중증', variant: 'danger' },
        ],
    },
    cssrs: {
        id: 'cssrs',
        name: 'C-SSRS',
        fullName: '콜럼비아 자살심각도 평가 척도 (선별형)',
        domain: '자살위험',
        mode: 'yesno',
        instruction: '아래 질문에 "예/아니오"로 답해주세요. 처음 5문항은 지난 한 달, 마지막은 평생 기준입니다.',
        items: [
            { text: '죽고 싶다는 생각을 한 적이 있습니까?', weight: 1 },
            { text: '스스로 목숨을 끊고 싶다는 적극적 생각을 한 적이 있습니까?', weight: 2 },
            { text: '어떻게 자살할지 방법을 생각해본 적이 있습니까?', weight: 3 },
            { text: '자살 생각과 함께 실행할 의도가 있었습니까?', weight: 4 },
            { text: '자살 계획을 구체적으로 세워본 적이 있습니까?', weight: 5 },
            { text: '평생 동안, 자살을 시도하거나 준비 행동을 한 적이 있습니까?', weight: 6, lifetime: true },
        ],
    },
    bdi2: {
        id: 'bdi2', name: 'BDI-II',
        fullName: 'Beck 우울 척도 II (21문항 점수 입력)',
        domain: '우울 (임상적)',
        mode: 'score_only',
        maxScore: 63,
        ranges: [
            { max: 13, severity: '최소', variant: 'success' },
            { max: 19, severity: '경도', variant: 'blue' },
            { max: 28, severity: '중등도', variant: 'warn' },
            { max: 63, severity: '중증', variant: 'danger' },
        ],
    },
    bai: {
        id: 'bai', name: 'BAI',
        fullName: 'Beck 불안 척도 (21문항 점수 입력)',
        domain: '불안 (임상적)',
        mode: 'score_only',
        maxScore: 63,
        ranges: [
            { max: 7, severity: '최소', variant: 'success' },
            { max: 15, severity: '경도', variant: 'blue' },
            { max: 25, severity: '중등도', variant: 'warn' },
            { max: 63, severity: '중증', variant: 'danger' },
        ],
    },
    auditk: {
        id: 'auditk', name: 'AUDIT-K',
        fullName: '알코올 사용장애 선별검사 (한국판)',
        domain: '알코올',
        mode: 'score_only',
        maxScore: 40,
        ranges: [
            { max: 7, severity: '정상', variant: 'success' },
            { max: 14, severity: '위험 음주', variant: 'warn' },
            { max: 19, severity: '유해 음주', variant: 'warn' },
            { max: 40, severity: '알코올 의존 의심', variant: 'danger' },
        ],
    },
    moca: {
        id: 'moca', name: 'K-MoCA',
        fullName: '몬트리올 인지 평가 (한국판)',
        domain: '인지',
        mode: 'score_only',
        maxScore: 30,
        higherIsBetter: true,
        ranges: [
            { min: 26, severity: '정상', variant: 'success' },
            { min: 18, severity: '경도 인지장애 의심', variant: 'warn' },
            { min: 0, severity: '중등도-중증 인지장애', variant: 'danger' },
        ],
    },
};

export const SCALE_ORDER = ['cssrs', 'phq9', 'gad7', 'bdi2', 'bai', 'auditk', 'moca'];

export function computeCSSRSRisk(answers) {
    const yesIdx = answers.map((a, i) => a === 'yes' ? i : -1).filter(i => i >= 0);
    if (yesIdx.includes(5)) {
        return { severity: '높음', variant: 'danger', message: '평생 자살 시도/준비 이력 + 현재 사고 → 즉시 안전계획·보호자 통보·입원 고려' };
    }
    if (yesIdx.includes(4) || yesIdx.includes(3)) {
        return { severity: '높음', variant: 'danger', message: '구체적 계획/의도 → 즉시 안전계획, 수단 제한, 24시간 내 재평가' };
    }
    if (yesIdx.includes(2)) {
        return { severity: '중등도', variant: 'warn', message: '자살 방법 생각 → 전문가 심층 면담, 안전계획 수립' };
    }
    if (yesIdx.includes(0) || yesIdx.includes(1)) {
        return { severity: '낮음', variant: 'blue', message: '자살사고 존재 → 지속 모니터링, 심층 면담 권고' };
    }
    return { severity: '없음', variant: 'success', message: '현재 자살위험 징후 없음. 정기 재평가 권고' };
}

export function computeScore(scale, answers) {
    if (scale.mode === 'yesno') {
        return computeCSSRSRisk(answers);
    }
    if (scale.mode === 'score_only') {
        const score = Number(answers) || 0;
        const range = scale.higherIsBetter
            ? [...scale.ranges].reverse().find(r => score >= r.min)
            : scale.ranges.find(r => score <= r.max);
        return {
            score,
            severity: range?.severity || '-',
            variant: range?.variant || 'default',
            max: scale.maxScore,
        };
    }
    // items
    const score = (answers || []).reduce((a, v) => a + (Number(v) || 0), 0);
    const range = scale.ranges.find(r => score <= r.max);
    const criticalFlag = scale.criticalItems?.some(i => (Number((answers || [])[i]) || 0) > 0);
    return {
        score,
        severity: range?.severity || '-',
        variant: range?.variant || 'default',
        max: scale.items.length * 3,
        criticalFlag,
    };
}

// Build summary line for AI prompt
export function scalesSummary(testScales) {
    if (!testScales || !Object.keys(testScales).length) return null;
    return Object.entries(testScales).map(([id, data]) => {
        const scale = SCALES[id];
        if (!scale) return null;
        if (scale.mode === 'yesno') {
            return `${scale.name} (${scale.domain}): ${data.severity} — ${data.message || ''}`;
        }
        return `${scale.name} (${scale.domain}): ${data.score}/${data.max || '-'}점 → ${data.severity}${data.criticalFlag ? ' [⚠️ 자살문항 양성]' : ''}`;
    }).filter(Boolean).join('\n');
}
