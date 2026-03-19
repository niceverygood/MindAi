import { useState, useEffect } from 'react';
import { Badge, Btn, Card, Gauge } from './UI';
import { C, loadPatients } from '../constants';
import { callAIJSON } from '../api';
import { useMobile } from '../hooks';

export default function PatientReport() {
    const m = useMobile();
    const [pts, setPts] = useState([]);
    const [selP, setSelP] = useState(null);
    const [generating, setGen] = useState(false);
    const [report, setReport] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const p = loadPatients();
        setPts(p);
        if (p.length > 0) setSelP(p[0].id);
        setLoaded(true);
    }, []);

    const sp = pts.find(p => p.id === selP);

    const generateReport = async () => {
        if (!sp?.records?.length) return;
        setGen(true);
        setReport(null);
        const latestRec = sp.records[sp.records.length - 1];
        try {
            const messages = [{
                role: 'user',
                content: `정신건강의학과 환자/보호자용 검사 결과 설명 보고서를 작성해주세요. 의학 전문용어를 쓰지 말고, 중학생도 이해할 수 있는 쉬운 한국어로 작성하세요. 순수 JSON만 출력, 백틱 없이.

환자 데이터:
${JSON.stringify({
                    patient: sp.name,
                    info: latestRec.patient_info,
                    scales: latestRec.scales,
                    medications: latestRec.medications,
                    diagnosis: latestRec.patient_info?.diagnosis,
                    risk: latestRec.risk_assessment,
                    clinical_notes: latestRec.clinical_notes,
                    treatment_response: latestRec.treatment_response,
                    total_visits: sp.records.length,
                })}

JSON 형식:
{
  "title": "검사 결과 안내문",
  "greeting": "환자/보호자에게 하는 따뜻한 인사말 (2줄)",
  "overall_summary": "전체 상태를 비유나 일상 언어로 쉽게 설명 (3-4줄)",
  "condition_explanation": "현재 진단에 대한 쉬운 설명 - 이 상태가 무엇인지, 왜 생기는지, 얼마나 흔한지 (4-5줄)",
  "scale_explanations": [
    {
      "name": "검사 이름",
      "score": 숫자,
      "max_score": 최대점수,
      "level": "좋음/보통/주의/걱정",
      "simple_meaning": "이 점수가 무엇을 의미하는지 1줄로 쉽게",
      "analogy": "일상적 비유로 설명",
      "color": "green/yellow/orange/red"
    }
  ],
  "medication_explanations": [
    {
      "name": "약 이름",
      "simple_name": "쉬운 별명",
      "purpose": "왜 이 약을 먹는지 쉽게 설명",
      "tips": "복용 시 주의사항이나 팁"
    }
  ],
  "what_you_can_do": ["환자가 일상에서 할 수 있는 도움이 되는 행동 3-5개"],
  "what_family_can_do": ["보호자가 도울 수 있는 방법 3개"],
  "next_steps": "앞으로의 치료 계획을 쉽게 설명 (2-3줄)",
  "encouraging_message": "힘이 되는 마무리 메시지 (2줄)"
}`,
            }];

            const parsed = await callAIJSON(messages, 3000);
            setReport(parsed);
        } catch (e) {
            console.error(e);
            setReport(null);
        }
        setGen(false);
    };

    if (!sp || !sp.records?.length) {
        return (
            <div className="slide-up">
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>환자용 쉬운 보고서</h2>
                    <p style={{ color: C.textSec, fontSize: 12, margin: '4px 0 0' }}>검사 결과를 환자/보호자가 이해하기 쉽게 변환</p>
                </div>
                <Card style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
                    <div style={{ color: C.text, fontWeight: 600, marginBottom: 4 }}>진료분석 탭에서 먼저 데이터를 업로드해주세요</div>
                    <div style={{ color: C.textSec, fontSize: 13 }}>환자 기록이 있어야 보고서를 생성할 수 있습니다</div>
                </Card>
            </div>
        );
    }

    return (
        <div className="slide-up">
            <div style={{ marginBottom: m ? 16 : 24 }}>
                <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>환자용 쉬운 보고서</h2>
                <p style={{ color: C.textSec, fontSize: 12, margin: '4px 0 0' }}>전문 용어 → 쉬운 한국어, 시각화와 함께 제공</p>
            </div>

            {/* Patient selector */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {pts.filter(p => p.records?.length > 0).map(p => (
                    <button key={p.id} onClick={() => { setSelP(p.id); setReport(null); }} style={{
                        background: selP === p.id ? C.blueLight : C.surface,
                        border: `1px solid ${selP === p.id ? C.blue : C.border}`,
                        borderRadius: 10, padding: '6px 12px', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, color: selP === p.id ? C.blue : C.textSec,
                        transition: 'all .15s',
                    }}>{p.name} ({p.records.length}회)</button>
                ))}
            </div>

            {!report && (
                <Card style={{ padding: m ? 24 : 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🩺</div>
                    <div style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{sp.name}님의 검사 결과를 쉽게 설명해드릴게요</div>
                    <div style={{ color: C.textSec, fontSize: 12, marginBottom: 20 }}>AI가 전문 용어를 쉬운 말로 바꾸고, 그래프와 함께 정리합니다</div>
                    <Btn onClick={generateReport} disabled={generating}>{generating ? '🔄 보고서 작성 중...' : '📄 쉬운 보고서 생성'}</Btn>
                </Card>
            )}

            {report && (
                <div>
                    {/* Header card */}
                    <Card style={{ padding: m ? 16 : 24, marginBottom: 14, background: 'linear-gradient(135deg, #EFF6FF, #F0FDF4)', borderColor: C.blueMid }}>
                        <div style={{ color: C.blueDark, fontSize: m ? 16 : 18, fontWeight: 700, marginBottom: 8 }}>{report.title || '검사 결과 안내'}</div>
                        <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{report.greeting}</div>
                    </Card>

                    {/* Overall */}
                    <Card style={{ padding: m ? 14 : 20, marginBottom: 14 }}>
                        <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🌤️ 전체 상태 요약</div>
                        <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8, background: C.surface, borderRadius: 10, padding: 14 }}>{report.overall_summary}</div>
                    </Card>

                    {/* Condition */}
                    {report.condition_explanation && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 14 }}>
                            <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>💡 내 상태 이해하기</div>
                            <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>{report.condition_explanation}</div>
                        </Card>
                    )}

                    {/* Scale gauges */}
                    {report.scale_explanations?.length > 0 && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 14 }}>
                            <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📊 검사 결과</div>
                            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(2,1fr)', gap: 12 }}>
                                {report.scale_explanations.map((sc, i) => (
                                    <div key={i} style={{ background: C.surface, borderRadius: 12, padding: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <Gauge score={sc.score} max={sc.max_score} color={sc.color} label={sc.name} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{sc.name}</span>
                                                    <Badge text={sc.level} variant={sc.level === '좋음' ? 'success' : sc.level === '보통' ? 'blue' : sc.level === '주의' ? 'warn' : 'danger'} />
                                                </div>
                                                <div style={{ color: C.text, fontSize: 12, lineHeight: 1.5 }}>{sc.simple_meaning}</div>
                                                {sc.analogy && <div style={{ color: C.textSec, fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>💬 {sc.analogy}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Medication */}
                    {report.medication_explanations?.length > 0 && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 14 }}>
                            <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>💊 복용 약물 안내</div>
                            {report.medication_explanations.map((med, i) => (
                                <div key={i} style={{ background: C.surface, borderRadius: 10, padding: 12, marginBottom: i < report.medication_explanations.length - 1 ? 8 : 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{med.name}</span>
                                        {med.simple_name && <Badge text={med.simple_name} variant="blue" />}
                                    </div>
                                    <div style={{ color: C.text, fontSize: 12, lineHeight: 1.6 }}>{med.purpose}</div>
                                    {med.tips && <div style={{ color: C.warnText, fontSize: 11, marginTop: 4 }}>💡 {med.tips}</div>}
                                </div>
                            ))}
                        </Card>
                    )}

                    {/* What you/family can do */}
                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        {report.what_you_can_do?.length > 0 && (
                            <Card style={{ padding: m ? 14 : 20 }}>
                                <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🌱 내가 할 수 있는 것</div>
                                {report.what_you_can_do.map((t, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < report.what_you_can_do.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                                        <span style={{ color: C.successText }}>✓</span>
                                        <span style={{ color: C.text, fontSize: 12, lineHeight: 1.5 }}>{t}</span>
                                    </div>
                                ))}
                            </Card>
                        )}
                        {report.what_family_can_do?.length > 0 && (
                            <Card style={{ padding: m ? 14 : 20 }}>
                                <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>👨‍👩‍👧 가족이 도울 수 있는 것</div>
                                {report.what_family_can_do.map((t, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < report.what_family_can_do.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                                        <span style={{ color: C.blue }}>♡</span>
                                        <span style={{ color: C.text, fontSize: 12, lineHeight: 1.5 }}>{t}</span>
                                    </div>
                                ))}
                            </Card>
                        )}
                    </div>

                    {/* Next steps */}
                    {report.next_steps && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 14 }}>
                            <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📅 앞으로의 계획</div>
                            <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{report.next_steps}</div>
                        </Card>
                    )}

                    {/* Encouraging */}
                    {report.encouraging_message && (
                        <Card style={{ padding: m ? 16 : 24, marginBottom: 14, background: 'linear-gradient(135deg, #FFF7ED, #FDF2F8)', borderColor: '#FBCFE8' }}>
                            <div style={{ color: '#BE185D', fontSize: 14, fontWeight: 600, lineHeight: 1.7, textAlign: 'center' }}>{report.encouraging_message}</div>
                        </Card>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Btn variant="secondary" onClick={() => {
                            const w = window.open('', '', 'width=800,height=900');
                            if (!w) return;
                            w.document.write(`<html><head><meta charset="utf-8"><title>검사 결과 안내</title><style>body{font-family:-apple-system,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#111;line-height:1.8}h1{color:#2563EB;font-size:20px}h2{font-size:15px;margin-top:24px;border-bottom:1px solid #e5e7eb;padding-bottom:6px}.card{background:#f7f8fa;border-radius:10px;padding:14px;margin:8px 0}</style></head><body><h1>${report.title || '검사 결과 안내'}</h1><p>${report.greeting || ''}</p><h2>🌤️ 전체 요약</h2><div class="card">${report.overall_summary || ''}</div>${report.condition_explanation ? `<h2>💡 내 상태</h2><p>${report.condition_explanation}</p>` : ''}<h2>📊 검사 결과</h2>${(report.scale_explanations || []).map(s => `<div class="card"><b>${s.name}</b>: ${s.score}점 — ${s.simple_meaning}${s.analogy ? ` (${s.analogy})` : ''}</div>`).join('')}${(report.medication_explanations || []).length ? `<h2>💊 약물 안내</h2>${report.medication_explanations.map(m => `<div class="card"><b>${m.name}</b>${m.simple_name ? ` (${m.simple_name})` : ''}<br>${m.purpose}${m.tips ? `<br><small>💡 ${m.tips}</small>` : ''}</div>`).join('')}` : ''}<h2>🌱 도움되는 행동</h2>${(report.what_you_can_do || []).map(t => `<div>✓ ${t}</div>`).join('')}${report.next_steps ? `<h2>📅 앞으로</h2><p>${report.next_steps}</p>` : ''}<br><p style="text-align:center;color:#BE185D;font-weight:600">${report.encouraging_message || ''}</p></body></html>`);
                            w.document.close();
                            w.print();
                        }}>🖨️ 인쇄</Btn>
                        <Btn variant="ghost" onClick={() => setReport(null)}>다시 생성</Btn>
                    </div>
                </div>
            )}
        </div>
    );
}
