import { useState } from 'react';
import { Badge, Btn, Card } from './UI';
import { C } from '../constants';
import { callAIJSON } from '../api';
import { useMobile } from '../hooks';

export default function SOAPNote() {
    const m = useMobile();
    const [patientName, setPN] = useState('');
    const [age, setAge] = useState('');
    const [diagnosis, setDiag] = useState('');
    const [keywords, setKW] = useState('');
    const [generating, setGen] = useState(false);
    const [soap, setSoap] = useState(null);
    const [history, setHistory] = useState([]);

    const generate = async () => {
        if (!keywords.trim()) return;
        setGen(true);
        setSoap(null);
        try {
            const messages = [{
                role: 'user',
                content: `정신건강의학과 진료 SOAP 노트를 작성해주세요. 순수 JSON만 출력. 백틱 없이.

환자정보: ${patientName || '미기재'}, ${age || '미기재'}세, 진단: ${diagnosis || '미기재'}
의사 키워드/메모: ${keywords}

JSON 형식:
{
  "subjective": "환자의 주관적 호소, 주요 증상, 기간, 변화 등을 자연스러운 서술체로 작성",
  "objective": "관찰된 객관적 소견 - 외양, 행동, 정신상태검사(MSE) 소견, 검사 결과 등",
  "assessment": "임상적 평가 - 진단 인상, 감별진단, 증상 변화 평가, 위험도 평가",
  "plan": "치료 계획 - 약물 조정, 심리치료, 다음 방문 일정, 검사 계획 등",
  "icd_codes": ["관련 ICD-10 코드"],
  "risk_flags": ["위험 플래그 - 자살사고, 자해 등 감지된 경우"],
  "next_visit": "권장 다음 방문 시기",
  "consultation_summary": "2줄 이내 핵심 요약"
}

키워드에서 임상적으로 의미 있는 내용을 최대한 확장하여 전문적인 SOAP 노트를 작성해주세요. 의사 키워드가 간략하더라도 진단명과 맥락을 고려하여 풍부하게 작성하세요.`,
            }];

            const parsed = await callAIJSON(messages, 3000);
            setSoap(parsed);
            setHistory(prev => [{
                ...parsed, _patient: patientName,
                _date: new Date().toLocaleDateString('ko-KR'),
                _keywords: keywords,
            }, ...prev].slice(0, 20));
        } catch (e) {
            console.error(e);
            setSoap({ subjective: '생성 오류: ' + (e.message || '알 수 없는 오류'), objective: '', assessment: '', plan: '', error: true });
        }
        setGen(false);
    };

    const copyAll = () => {
        if (!soap) return;
        const txt = `[SOAP Note] ${patientName} ${new Date().toLocaleDateString('ko-KR')}\n\n【S】${soap.subjective}\n\n【O】${soap.objective}\n\n【A】${soap.assessment}\n\n【P】${soap.plan}${soap.next_visit ? `\n\n다음방문: ${soap.next_visit}` : ''}`;
        navigator.clipboard?.writeText(txt);
    };

    const Section = ({ label, color, content }) => {
        if (!content) return null;
        return (
            <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8, background: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12, fontWeight: 700,
                    }}>{label[0]}</div>
                    <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{label}</span>
                </div>
                <div style={{ background: C.surface, borderRadius: 10, padding: 14, color: C.text, fontSize: 13, lineHeight: 1.8, marginLeft: 36 }}>{content}</div>
            </div>
        );
    };

    return (
        <div className="slide-up">
            <div style={{ marginBottom: m ? 16 : 24 }}>
                <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>SOAP 진료메모 자동생성</h2>
                <p style={{ color: C.textSec, fontSize: 12, margin: '4px 0 0' }}>키워드만 입력하면 AI가 전문적인 SOAP 노트를 작성합니다</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {/* Input */}
                <Card style={{ padding: m ? 14 : 20 }}>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 14 }}>📝 진료 정보 입력</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div>
                            <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>환자명</div>
                            <input value={patientName} onChange={e => setPN(e.target.value)} placeholder="김○○" />
                        </div>
                        <div>
                            <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>나이</div>
                            <input value={age} onChange={e => setAge(e.target.value)} placeholder="34" />
                        </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>진단명</div>
                        <input value={diagnosis} onChange={e => setDiag(e.target.value)} placeholder="주요우울장애, 공황장애 등" />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>진료 키워드 / 메모 ✱</div>
                        <textarea value={keywords} onChange={e => setKW(e.target.value)}
                            placeholder={`예시:\n수면 여전히 불량, 입면 1시간\n식욕 약간 회복\n우울감 지속 but 자살사고 없음\n에스시탈로프람 10→15 증량 고려\n다음주 PHQ-9 재검`}
                            rows={6}
                        />
                    </div>
                    <Btn onClick={generate} disabled={!keywords.trim() || generating} style={{ width: '100%', justifyContent: 'center' }}>
                        {generating ? '🔄 AI 작성 중...' : '✨ SOAP 노트 생성'}
                    </Btn>

                    {/* Quick templates */}
                    <div style={{ marginTop: 14 }}>
                        <div style={{ color: C.textMut, fontSize: 11, marginBottom: 6 }}>빠른 템플릿</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {['수면불량 우울지속 약물유지', '호전 약물감량 검토', '불안악화 벤조 추가 고려', '초진 병력청취 검사의뢰', '자살사고 호소 위기개입'].map((t, i) => (
                                <button key={i} onClick={() => setKW(t)} style={{
                                    background: C.surface, border: `1px solid ${C.borderLight}`,
                                    borderRadius: 8, padding: '4px 10px', fontSize: 11, color: C.textSec, cursor: 'pointer',
                                    transition: 'all .15s',
                                }}>{t}</button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Result */}
                <div>
                    {soap ? (
                        <Card style={{ padding: m ? 14 : 20 }} borderColor={soap.error ? C.dangerText : C.blue}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div style={{ color: C.blue, fontWeight: 700, fontSize: 14 }}>📋 SOAP Note</div>
                                <Btn variant="secondary" onClick={copyAll} style={{ fontSize: 11 }}>📋 복사</Btn>
                            </div>
                            {soap.consultation_summary && (
                                <div style={{ background: C.blueLight, borderRadius: 8, padding: '8px 12px', color: C.blueDark, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{soap.consultation_summary}</div>
                            )}
                            <Section label="Subjective" color={C.blue} content={soap.subjective} />
                            <Section label="Objective" color="#059669" content={soap.objective} />
                            <Section label="Assessment" color="#D97706" content={soap.assessment} />
                            <Section label="Plan" color="#7C3AED" content={soap.plan} />
                            {soap.risk_flags?.length > 0 && (
                                <div style={{ marginTop: 10, marginLeft: 36 }}>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {soap.risk_flags.map((f, i) => <Badge key={i} text={`⚠ ${f}`} variant="danger" />)}
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, marginLeft: 36 }}>
                                {soap.icd_codes?.map((c, i) => <Badge key={i} text={c} variant="blue" />)}
                                {soap.next_visit && <Badge text={`다음: ${soap.next_visit}`} variant="success" />}
                            </div>
                        </Card>
                    ) : (
                        <Card style={{ padding: m ? 24 : 40, textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 8, opacity: .5 }}>📝</div>
                            <div style={{ color: C.textMut, fontSize: 13 }}>키워드를 입력하고 생성 버튼을 누르면</div>
                            <div style={{ color: C.textMut, fontSize: 13 }}>AI가 전문적인 SOAP 노트를 작성합니다</div>
                        </Card>
                    )}
                </div>
            </div>

            {/* History */}
            {history.length > 0 && (
                <Card style={{ padding: m ? 14 : 20 }}>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 10 }}>📚 최근 생성 기록</div>
                    {history.slice(0, 5).map((h, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 0', borderBottom: i < Math.min(history.length, 5) - 1 ? `1px solid ${C.borderLight}` : 'none',
                            cursor: 'pointer',
                        }} onClick={() => { setSoap(h); setPN(h._patient || ''); setKW(h._keywords || ''); }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: C.textSec, fontSize: 12 }}>{h._date}</span>
                                <span style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{h._patient || '환자'}</span>
                            </div>
                            <span style={{ color: C.textMut, fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {h.consultation_summary || h._keywords}
                            </span>
                        </div>
                    ))}
                </Card>
            )}
        </div>
    );
}
