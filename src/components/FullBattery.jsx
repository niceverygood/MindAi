import { useState } from 'react';
import { Badge, Btn, Card } from './UI';
import { C } from '../constants';
import { callAIJSON } from '../api';
import { useMobile } from '../hooks';

// 검사 종류별 하위 척도
const TESTS = {
    'WAIS-IV': {
        label: '웩슬러 성인 지능검사',
        icon: '🧠',
        subscales: [
            { key: 'verbal', label: '언어이해', max: 150 },
            { key: 'perceptual', label: '지각추론', max: 150 },
            { key: 'workingMemory', label: '작업기억', max: 150 },
            { key: 'processingSpeed', label: '처리속도', max: 150 },
        ],
    },
    'MMPI-2': {
        label: '다면적 인성검사',
        icon: '📊',
        subscales: [
            { key: 'Hs', label: 'Hs (건강염려)', max: 100 },
            { key: 'D', label: 'D (우울)', max: 100 },
            { key: 'Hy', label: 'Hy (히스테리)', max: 100 },
            { key: 'Pd', label: 'Pd (반사회성)', max: 100 },
            { key: 'Pa', label: 'Pa (편집증)', max: 100 },
            { key: 'Pt', label: 'Pt (강박)', max: 100 },
            { key: 'Sc', label: 'Sc (조현)', max: 100 },
            { key: 'Ma', label: 'Ma (경조)', max: 100 },
        ],
    },
    'Rorschach': {
        label: '로르샤흐 검사',
        icon: '🦋',
        subscales: [],
        freeText: true,
    },
    'HTP': {
        label: 'HTP 그림검사',
        icon: '🏠',
        subscales: [],
        freeText: true,
    },
    'SCT': {
        label: '문장완성검사',
        icon: '📝',
        subscales: [],
        freeText: true,
    },
};

export default function FullBattery() {
    const m = useMobile();
    const [step, setStep] = useState('input'); // input, generating, result
    const [pg, setPg] = useState(0);
    const [rp, setRp] = useState(null);

    // Patient info
    const [patientName, setPN] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('여');
    const [referral, setReferral] = useState('');

    // Test scores
    const [selectedTests, setSelectedTests] = useState(['WAIS-IV', 'MMPI-2']);
    const [scores, setScores] = useState({});
    const [freeTexts, setFreeTexts] = useState({});

    // Quick fill demo data
    const fillDemo = () => {
        setPN('김○○');
        setAge('34');
        setGender('여');
        setReferral('우울 및 불안, 집중력 저하 호소');
        setScores({
            'WAIS-IV_verbal': '118',
            'WAIS-IV_perceptual': '109',
            'WAIS-IV_workingMemory': '105',
            'WAIS-IV_processingSpeed': '96',
            'MMPI-2_Hs': '55',
            'MMPI-2_D': '78',
            'MMPI-2_Hy': '58',
            'MMPI-2_Pd': '52',
            'MMPI-2_Pa': '48',
            'MMPI-2_Pt': '72',
            'MMPI-2_Sc': '56',
            'MMPI-2_Ma': '42',
        });
        setFreeTexts({
            Rorschach: '반응 수 18, 내향형(M>C), 형태질 양호, 인간운동 반응 우세, 색채반응 제한적',
            HTP: '집: 소형, 문 없음, 창 작게. 나무: 가지 꺾임. 사람: 자화상 작고 위축됨',
            SCT: '"나의 미래는...모르겠다", "가장 두려운 것은...혼자 남는 것", "행복은...잘 모르겠다"',
        });
        setSelectedTests(['WAIS-IV', 'MMPI-2', 'Rorschach', 'HTP', 'SCT']);
    };

    const toggleTest = (testId) => {
        setSelectedTests(prev =>
            prev.includes(testId) ? prev.filter(t => t !== testId) : [...prev, testId]
        );
    };

    const updateScore = (key, value) => {
        setScores(prev => ({ ...prev, [key]: value }));
    };

    const updateFreeText = (testId, value) => {
        setFreeTexts(prev => ({ ...prev, [testId]: value }));
    };

    // Build data summary for AI
    const buildDataSummary = () => {
        const testData = {};
        for (const testId of selectedTests) {
            const test = TESTS[testId];
            if (test.freeText) {
                testData[testId] = { type: test.label, notes: freeTexts[testId] || '미기재' };
            } else {
                const scaleScores = {};
                for (const sub of test.subscales) {
                    const val = scores[`${testId}_${sub.key}`];
                    if (val) scaleScores[sub.label] = Number(val);
                }
                testData[testId] = { type: test.label, scores: scaleScores };
            }
        }
        return testData;
    };

    const hasEnoughData = () => {
        if (!referral.trim() && selectedTests.length === 0) return false;
        // At least some scores or free text should be filled
        const hasScores = Object.values(scores).some(v => v && v.trim());
        const hasTexts = Object.values(freeTexts).some(v => v && v.trim());
        return hasScores || hasTexts || referral.trim();
    };

    const generate = async () => {
        setStep('generating');
        setPg(0);

        // Progress animation
        const progressSteps = [10, 25, 40, 55, 70, 80, 90];
        progressSteps.forEach((p, i) => {
            setTimeout(() => setPg(p), (i + 1) * 800);
        });

        try {
            const testData = buildDataSummary();
            const messages = [{
                role: 'user',
                content: `정신건강의학과 종합심리검사(풀배터리) 보고서를 작성해주세요. 순수 JSON만 출력. 백틱 없이.

환자정보:
- 이름: ${patientName || '미기재'}
- 나이: ${age || '미기재'}세
- 성별: ${gender}
- 의뢰사유: ${referral || '미기재'}

검사 데이터:
${JSON.stringify(testData, null, 2)}

JSON 형식:
{
  "patient": "${patientName || '환자'}",
  "age": ${age || 0},
  "gender": "${gender}",
  "referral": "${referral || '미기재'}",
  "date": "${new Date().toISOString().split('T')[0]}",
  "sections": [
    {
      "title": "검사 영역명 (예: 인지기능 WAIS-IV)",
      "summary": "핵심 결과 1줄 요약",
      "detail": "상세 해석 2-3줄",
      "scores": [{"n": "하위척도명", "v": 점수, "x": 최대점수}],
      "flag": "임상적으로 유의한 점 (없으면 null)"
    }
  ],
  "integration": "검사 결과 간 통합적 해석 (3-4줄). 각 검사가 어떻게 서로를 뒷받침하는지 설명",
  "diagnosis": {
    "primary": "주요 진단 인상 (ICD-10 코드 포함)",
    "diff": ["감별진단 1", "감별진단 2"],
    "risk": "위험도 평가 (예: 중등도 — C-SSRS 권장)"
  },
  "recs": ["치료 권고 1", "치료 권고 2", "치료 권고 3", "치료 권고 4"],
  "strengths": ["환자의 강점 1", "강점 2"],
  "prognosis": "예후 및 향후 계획 1-2줄"
}

실제 임상에서 받은 검사 점수를 기반으로 전문적이고 통합적인 보고서를 작성하세요. 각 검사 결과를 연결하여 해석하고, 구체적인 진단 인상과 치료 권고를 제시하세요. scores 배열의 x 값은 MMPI는 100(T점수), WAIS는 150으로 설정하세요.`,
            }];

            const result = await callAIJSON(messages, 4000);
            setPg(100);
            setTimeout(() => {
                setRp(result);
                setStep('result');
            }, 500);
        } catch (e) {
            console.error(e);
            setPg(0);
            setStep('input');
            alert('보고서 생성 오류: ' + (e.message || '알 수 없는 오류'));
        }
    };

    // ────── INPUT STEP ──────
    if (step === 'input') {
        return (
            <div className="slide-up">
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>AI 종합심리검사 보고서</h2>
                    <p style={{ color: C.textSec, fontSize: 12, margin: '4px 0 0' }}>검사 결과를 입력하면 AI가 통합 보고서를 생성합니다</p>
                </div>

                {/* Patient Info */}
                <Card style={{ padding: m ? 14 : 20, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>👤 환자 정보</div>
                        <Btn variant="ghost" onClick={fillDemo} style={{ fontSize: 11, color: C.blue }}>
                            📋 데모 데이터 채우기
                        </Btn>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : '1fr 80px 80px 1fr', gap: 10 }}>
                        <div>
                            <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>환자명</div>
                            <input value={patientName} onChange={e => setPN(e.target.value)} placeholder="김○○" />
                        </div>
                        <div>
                            <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>나이</div>
                            <input value={age} onChange={e => setAge(e.target.value)} placeholder="34" type="number" />
                        </div>
                        <div>
                            <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>성별</div>
                            <select value={gender} onChange={e => setGender(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, width: '100%' }}>
                                <option value="여">여</option>
                                <option value="남">남</option>
                            </select>
                        </div>
                        <div>
                            <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>의뢰사유</div>
                            <input value={referral} onChange={e => setReferral(e.target.value)} placeholder="우울, 불안, 집중력 저하 등" />
                        </div>
                    </div>
                </Card>

                {/* Test Selection */}
                <Card style={{ padding: m ? 14 : 20, marginBottom: 14 }}>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🧪 검사 선택</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {Object.entries(TESTS).map(([id, test]) => (
                            <button key={id} onClick={() => toggleTest(id)} style={{
                                background: selectedTests.includes(id) ? C.blueLight : C.surface,
                                border: `1px solid ${selectedTests.includes(id) ? C.blue : C.border}`,
                                borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                                fontSize: 12, fontWeight: 600,
                                color: selectedTests.includes(id) ? C.blue : C.textSec,
                                display: 'flex', alignItems: 'center', gap: 6,
                                transition: 'all .15s',
                            }}>
                                <span>{test.icon}</span> {test.label}
                                {selectedTests.includes(id) && <span style={{ color: C.blue }}>✓</span>}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Test Score Inputs */}
                {selectedTests.map(testId => {
                    const test = TESTS[testId];
                    return (
                        <Card key={testId} style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <span style={{ fontSize: 20 }}>{test.icon}</span>
                                <div>
                                    <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{test.label}</div>
                                    <div style={{ color: C.textMut, fontSize: 11 }}>{testId}</div>
                                </div>
                            </div>

                            {test.freeText ? (
                                <div>
                                    <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>검사 소견 / 주요 반응</div>
                                    <textarea
                                        value={freeTexts[testId] || ''}
                                        onChange={e => updateFreeText(testId, e.target.value)}
                                        placeholder={testId === 'Rorschach' ? '반응 수, 경험유형, 형태질, 특이반응 등' :
                                            testId === 'HTP' ? '집/나무/사람 그림의 특이사항, 크기, 위치, 생략된 부분 등' :
                                                '주요 문장완성 반응, 특이 반응 패턴 등'}
                                        rows={3}
                                    />
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : `repeat(${Math.min(test.subscales.length, 4)}, 1fr)`, gap: 8 }}>
                                    {test.subscales.map(sub => (
                                        <div key={sub.key}>
                                            <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>{sub.label}</div>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    value={scores[`${testId}_${sub.key}`] || ''}
                                                    onChange={e => updateScore(`${testId}_${sub.key}`, e.target.value)}
                                                    placeholder={testId === 'MMPI-2' ? 'T점수' : '점수'}
                                                    type="number"
                                                    style={{ paddingRight: 36 }}
                                                />
                                                <span style={{
                                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                                                    color: C.textMut, fontSize: 10,
                                                }}>/{sub.max}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    );
                })}

                {/* Generate button */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Btn onClick={generate} disabled={!hasEnoughData()} style={{ flex: 1, justifyContent: 'center', padding: '14px 20px', fontSize: 15 }}>
                        📋 AI 종합 보고서 생성
                    </Btn>
                </div>
                {!hasEnoughData() && (
                    <div style={{ color: C.textMut, fontSize: 11, textAlign: 'center', marginTop: 8 }}>
                        의뢰사유 또는 1개 이상의 검사 결과를 입력해주세요
                    </div>
                )}
            </div>
        );
    }

    // ────── GENERATING STEP ──────
    if (step === 'generating') {
        return (
            <div className="slide-up">
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>AI 종합심리검사 보고서</h2>
                </div>
                <Card style={{ padding: m ? 30 : 50, textAlign: 'center' }}>
                    <div style={{ fontSize: 44, marginBottom: 16 }}>🧠</div>
                    <div style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 8 }}>AI가 검사 결과를 통합 분석 중입니다</div>
                    <div style={{ color: C.textSec, fontSize: 12, marginBottom: 24 }}>
                        {pg < 30 ? '검사 데이터 수집 중...' :
                            pg < 60 ? '척도 간 교차 분석 중...' :
                                pg < 85 ? '진단 인상 도출 중...' :
                                    pg < 100 ? '치료 권고 작성 중...' : '완료!'}
                    </div>
                    <div style={{ height: 6, background: C.surface, borderRadius: 3, maxWidth: 360, margin: '0 auto', overflow: 'hidden' }}>
                        <div style={{
                            width: `${pg}%`, height: '100%',
                            background: `linear-gradient(90deg, ${C.blue}, ${C.blueDark})`,
                            borderRadius: 3, transition: 'width .5s ease',
                        }} />
                    </div>
                    <div style={{ color: C.textMut, fontSize: 11, marginTop: 8 }}>{pg}%</div>
                </Card>
            </div>
        );
    }

    // ────── RESULT STEP ──────
    if (!rp) return null;

    return (
        <div className="slide-up">
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>AI 종합심리검사 보고서</h2>
            </div>

            {/* Patient header */}
            <Card style={{ padding: m ? 14 : 22, marginBottom: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                        <Badge text="종합보고서" variant="blue" />
                        <div style={{ color: C.text, fontSize: m ? 15 : 17, fontWeight: 700, marginTop: 6 }}>
                            {rp.patient} ({rp.age}세, {rp.gender})
                        </div>
                        <div style={{ color: C.textSec, fontSize: 11, marginTop: 2 }}>{rp.referral} | {rp.date}</div>
                    </div>
                    <Btn variant="secondary" style={{ fontSize: 11 }} onClick={() => {
                        const w = window.open('', '', 'width=800,height=1000');
                        if (!w) return;
                        w.document.write(`<html><head><meta charset="utf-8"><title>종합심리검사 보고서</title><style>body{font-family:-apple-system,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#111;line-height:1.8}h1{color:#2563EB;font-size:20px}h2{font-size:15px;margin-top:24px;border-bottom:1px solid #e5e7eb;padding-bottom:6px}.card{background:#f7f8fa;border-radius:10px;padding:14px;margin:8px 0}.danger{color:#DC2626;font-weight:700}.warn{color:#D97706}</style></head><body>`
                            + `<h1>종합심리검사 보고서</h1><p><b>${rp.patient}</b> (${rp.age}세, ${rp.gender}) | ${rp.referral} | ${rp.date}</p>`
                            + (rp.sections || []).map(s => `<h2>${s.title}</h2><div class="card"><b>${s.summary}</b></div><p>${s.detail}</p>${s.flag ? `<p class="danger">⚠ ${s.flag}</p>` : ''}`).join('')
                            + (rp.integration ? `<h2>통합 해석</h2><p>${rp.integration}</p>` : '')
                            + `<h2>진단 인상</h2><p class="danger">${rp.diagnosis?.primary}</p>`
                            + (rp.diagnosis?.diff || []).map(d => `<p class="warn">• ${d}</p>`).join('')
                            + `<p>🚨 ${rp.diagnosis?.risk}</p>`
                            + `<h2>치료 권고</h2>${(rp.recs || []).map(r => `<p>• ${r}</p>`).join('')}`
                            + (rp.strengths?.length ? `<h2>환자 강점</h2>${rp.strengths.map(s => `<p>✓ ${s}</p>`).join('')}` : '')
                            + (rp.prognosis ? `<h2>예후</h2><p>${rp.prognosis}</p>` : '')
                            + `</body></html>`);
                        w.document.close();
                        w.print();
                    }}>📄 인쇄/PDF</Btn>
                </div>
            </Card>

            {/* Sections */}
            {(rp.sections || []).map((s, i) => (
                <Card key={i} style={{ padding: m ? 14 : 22, marginBottom: 12 }} borderColor={s.flag ? C.warnText + '40' : C.border}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                        <div style={{ color: C.text, fontSize: m ? 14 : 15, fontWeight: 700 }}>{s.title}</div>
                        {s.flag && <Badge text={s.flag} variant="danger" />}
                    </div>
                    <div style={{ background: C.blueLight, padding: '8px 12px', borderRadius: 8, color: C.blueDark, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{s.summary}</div>
                    <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{s.detail}</div>
                    {s.scores?.length > 0 && (
                        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: m ? 'repeat(2,1fr)' : `repeat(${Math.min(s.scores.length, 4)},1fr)`, gap: 6 }}>
                            {s.scores.map((sc, j) => {
                                const hi = sc.x === 100 && sc.v >= 70;
                                return (
                                    <div key={j} style={{ background: C.surface, borderRadius: 8, padding: m ? 8 : 10 }}>
                                        <div style={{ color: C.textSec, fontSize: 10 }}>{sc.n}</div>
                                        <div style={{ color: hi ? C.dangerText : C.text, fontSize: 16, fontWeight: 700 }}>{sc.v}{sc.x === 100 ? 'T' : ''}</div>
                                        <div style={{ height: 3, background: C.borderLight, borderRadius: 2, marginTop: 3 }}>
                                            <div style={{ width: `${(sc.v / sc.x) * 100}%`, height: '100%', borderRadius: 2, background: hi ? C.dangerText : C.blue, transition: 'width .4s' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            ))}

            {/* Integration */}
            {rp.integration && (
                <Card style={{ padding: m ? 14 : 22, marginBottom: 12 }} borderColor={C.blue}>
                    <div style={{ color: C.blue, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🔗 통합 해석</div>
                    <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>{rp.integration}</div>
                </Card>
            )}

            {/* Strengths */}
            {rp.strengths?.length > 0 && (
                <Card style={{ padding: m ? 14 : 22, marginBottom: 12 }}>
                    <div style={{ color: C.successText, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>💪 환자 강점</div>
                    {rp.strengths.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, padding: '5px 0', borderBottom: i < rp.strengths.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                            <span style={{ color: C.successText }}>✓</span>
                            <span style={{ color: C.text, fontSize: 13 }}>{s}</span>
                        </div>
                    ))}
                </Card>
            )}

            {/* Diagnosis */}
            <Card style={{ padding: m ? 14 : 22, marginBottom: 12 }} borderColor={C.dangerText + '30'}>
                <div style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>진단 및 권고</div>
                <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 14 }}>
                    <div>
                        <div style={{ background: C.dangerBg, padding: 10, borderRadius: 8, color: C.dangerText, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                            {rp.diagnosis?.primary}
                        </div>
                        {(rp.diagnosis?.diff || []).map((d, i) => (
                            <div key={i} style={{ background: C.warnBg, padding: '6px 10px', borderRadius: 6, color: C.warnText, fontSize: 11, marginBottom: 3 }}>{d}</div>
                        ))}
                        <div style={{ marginTop: 6, background: C.dangerBg, padding: '6px 10px', borderRadius: 6, color: C.dangerText, fontSize: 11, fontWeight: 600 }}>
                            🚨 {rp.diagnosis?.risk}
                        </div>
                    </div>
                    <div>
                        {(rp.recs || []).map((r, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, padding: '6px 0', borderBottom: i < rp.recs.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                                <span style={{ color: C.blue }}>•</span>
                                <span style={{ color: C.text, fontSize: 12 }}>{r}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Prognosis */}
            {rp.prognosis && (
                <Card style={{ padding: m ? 14 : 22, marginBottom: 14, background: 'linear-gradient(135deg, #EFF6FF, #F0FDF4)', borderColor: C.blueMid }}>
                    <div style={{ color: C.blueDark, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>📌 예후 및 향후 계획</div>
                    <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{rp.prognosis}</div>
                </Card>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" onClick={() => { setStep('input'); setRp(null); }}>← 다시 입력</Btn>
                <Btn variant="ghost" onClick={() => { setStep('input'); setRp(null); setPN(''); setAge(''); setReferral(''); setScores({}); setFreeTexts({}); setSelectedTests(['WAIS-IV', 'MMPI-2']); }}>🔄 새 환자</Btn>
            </div>
        </div>
    );
}
