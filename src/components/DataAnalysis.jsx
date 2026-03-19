import { useState, useEffect, useRef } from 'react';
import { Badge, Btn, Card, Spark } from './UI';
import { C, loadPatients, savePatients, clearPatients, predict } from '../constants';
import { analyzeDocument } from '../api';
import { useMobile } from '../hooks';

export default function DataAnalysis() {
    const m = useMobile();
    const [pts, setPts] = useState([]);
    const [selP, setSelP] = useState(null);
    const [selR, setSelR] = useState(null);
    const [azing, setAzing] = useState(false);
    const [err, setErr] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [subTab, setSubTab] = useState('upload');
    const inputRef = useRef(null);
    const [dragOver, setDO] = useState(false);

    useEffect(() => {
        const p = loadPatients();
        setPts(p);
        if (p.length > 0) setSelP(p[0].id);
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (loaded && pts.length > 0) savePatients(pts);
    }, [pts, loaded]);

    const sp = pts.find(p => p.id === selP);
    const pred = sp?.records ? predict(sp.records) : null;

    const addP = () => {
        const id = Date.now().toString();
        setPts(p => [...p, { id, name: '새 환자', records: [] }]);
        setSelP(id);
        setSubTab('upload');
    };

    const delP = (id) => {
        setPts(p => p.filter(x => x.id !== id));
        if (selP === id) {
            const rem = pts.filter(x => x.id !== id);
            setSelP(rem.length ? rem[0].id : null);
        }
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const b64 = reader.result.split(',')[1];
            const mt = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png');
            setAzing(true);
            setErr(null);
            try {
                const res = await analyzeDocument(b64, mt);
                if (!res) throw new Error('파싱 실패');
                res._uploadedAt = new Date().toISOString();
                res._fileName = file.name;

                if (!selP) {
                    const id = Date.now().toString();
                    const nm = res.patient_info?.name || '환자';
                    setPts(p => [...p, { id, name: nm, records: [res] }]);
                    setSelP(id);
                } else {
                    setPts(p => p.map(x => {
                        if (x.id !== selP) return x;
                        const nm = res.patient_info?.name && res.patient_info.name !== '미확인' ? res.patient_info.name : x.name;
                        return { ...x, name: nm, records: [...x.records, res] };
                    }));
                }
                setSelR(null);
                setSubTab('records');
            } catch (e) {
                setErr(e.message || '오류 발생');
            }
            setAzing(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="slide-up">
            <div style={{ marginBottom: 14 }}>
                <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>진료 데이터 AI 분석</h2>
                <p style={{ color: C.textSec, fontSize: 12, margin: '4px 0 0' }}>파일 업로드 → AI 추출 → 누적 분석 → 예측</p>
            </div>

            {/* Patient selector */}
            {pts.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {pts.map(p => (
                        <button key={p.id} onClick={() => setSelP(p.id)} style={{
                            background: selP === p.id ? C.blueLight : C.surface,
                            border: `1px solid ${selP === p.id ? C.blue : C.border}`,
                            borderRadius: 10, padding: '6px 12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 12, fontWeight: 600, color: selP === p.id ? C.blue : C.textSec,
                            transition: 'all .15s',
                        }}>
                            {p.name}
                            {p.records?.length > 0 && (
                                <span style={{
                                    background: selP === p.id ? C.blue : C.textMut,
                                    color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 8,
                                }}>{p.records.length}</span>
                            )}
                        </button>
                    ))}
                    <button onClick={addP} style={{
                        background: 'transparent', border: `1px dashed ${C.border}`,
                        borderRadius: 10, padding: '6px 12px', cursor: 'pointer',
                        fontSize: 12, color: C.textMut,
                    }}>+ 새 환자</button>
                </div>
            )}

            {/* Sub-tabs */}
            {sp && (
                <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                    {[
                        { id: 'upload', l: '📤 업로드' },
                        { id: 'records', l: '📋 기록' },
                        { id: 'predict', l: '🤖 예측' },
                    ].map(t => (
                        <Btn key={t.id} variant={subTab === t.id ? 'secondary' : 'ghost'} onClick={() => setSubTab(t.id)} style={{ fontSize: 12 }}>{t.l}</Btn>
                    ))}
                    <Btn variant="ghost" onClick={async () => {
                        if (confirm('전체 초기화?')) {
                            setPts([]);
                            setSelP(null);
                            clearPatients();
                        }
                    }} style={{ marginLeft: 'auto', fontSize: 10, color: C.textMut }}>초기화</Btn>
                </div>
            )}

            {/* Upload */}
            {(subTab === 'upload' || !sp) && (
                <div>
                    <div
                        onDragOver={e => { e.preventDefault(); setDO(true); }}
                        onDragLeave={() => setDO(false)}
                        onDrop={e => { e.preventDefault(); setDO(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                        onClick={() => !azing && inputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragOver ? C.blue : C.border}`,
                            borderRadius: 14, padding: '28px 20px', textAlign: 'center',
                            background: dragOver ? C.blueLight : C.surface,
                            cursor: azing ? 'wait' : 'pointer',
                            transition: 'all .2s',
                        }}
                    >
                        <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp"
                            onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); }}
                            style={{ display: 'none' }}
                        />
                        {azing ? (
                            <div>
                                <div style={{ fontSize: 28, marginBottom: 6 }}>
                                    <span className="spinner" style={{ width: 28, height: 28 }} />
                                </div>
                                <div style={{ color: C.blue, fontWeight: 600, fontSize: 14 }}>AI 분석 중...</div>
                                <div style={{ color: C.textSec, fontSize: 12, marginTop: 4 }}>OpenRouter (Claude) 데이터 추출 중</div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                                <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>진료 기록 업로드</div>
                                <div style={{ color: C.textSec, fontSize: 12, marginTop: 4 }}>PDF, 스크린샷 드래그 또는 클릭</div>
                                <div style={{ color: C.textMut, fontSize: 11, marginTop: 6 }}>EMR 캡처, 척도검사 결과지, 처방전 등</div>
                            </div>
                        )}
                    </div>
                    {err && <div style={{ marginTop: 10, background: C.dangerBg, borderRadius: 10, padding: 10, color: C.dangerText, fontSize: 12 }}>⚠ {err}</div>}
                    {!sp && <div style={{ textAlign: 'center', marginTop: 16 }}><Btn onClick={addP}>새 환자 등록</Btn></div>}
                </div>
            )}

            {/* Records */}
            {subTab === 'records' && sp && (
                <div>
                    {sp.records.length === 0 ? (
                        <Card style={{ padding: 30, textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                            <div style={{ color: C.text, fontWeight: 600 }}>기록 없음</div>
                            <Btn onClick={() => setSubTab('upload')} style={{ marginTop: 12 }}>업로드</Btn>
                        </Card>
                    ) : (
                        <div>
                            <Card style={{ marginBottom: 12 }}>
                                <div style={{ padding: m ? '10px 14px' : '12px 20px', borderBottom: `1px solid ${C.border}` }}>
                                    <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>📅 내원 기록 ({sp.records.length}회)</span>
                                </div>
                                {sp.records.map((r, i) => (
                                    <div key={i} onClick={() => setSelR(i)} style={{
                                        padding: m ? '10px 14px' : '10px 20px',
                                        borderBottom: i < sp.records.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                                        background: selR === i ? C.blueLight : 'transparent',
                                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', flexWrap: 'wrap', gap: 6,
                                        transition: 'background .15s',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ color: C.text, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{r.visit_date || `기록 ${i + 1}`}</span>
                                            {r.patient_info?.diagnosis?.map((d, j) => <Badge key={j} text={d} variant="blue" />)}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {r.treatment_response && <Badge text={r.treatment_response} variant={r.treatment_response === '호전' ? 'success' : r.treatment_response === '악화' ? 'danger' : 'default'} />}
                                            {r.scales?.length > 0 && <span style={{ color: C.textMut, fontSize: 11 }}>척도 {r.scales.length}종</span>}
                                        </div>
                                    </div>
                                ))}
                            </Card>

                            {/* Detail view */}
                            {(() => {
                                const rec = selR !== null ? sp.records[selR] : sp.records[sp.records.length - 1];
                                if (!rec) return null;
                                return (
                                    <Card style={{ padding: m ? 14 : 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                                            <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>📋 AI 추출 데이터</div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {rec.visit_date && <Badge text={rec.visit_date} variant="blue" />}
                                                {rec.treatment_response && <Badge text={rec.treatment_response} variant={rec.treatment_response === '호전' ? 'success' : rec.treatment_response === '악화' ? 'danger' : 'default'} />}
                                            </div>
                                        </div>

                                        {rec.patient_info?.diagnosis?.length > 0 && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>진단</div>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {rec.patient_info.diagnosis.map((d, i) => <Badge key={i} text={d} variant="blue" />)}
                                                </div>
                                            </div>
                                        )}

                                        {rec.scales?.length > 0 && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ color: C.textSec, fontSize: 11, marginBottom: 6 }}>척도검사</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 6 }}>
                                                    {rec.scales.map((sc, i) => (
                                                        <div key={i} style={{ background: C.surface, borderRadius: 10, padding: 12 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                                <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{sc.name}</span>
                                                                <Badge text={sc.severity} variant={sc.severity === '중증' ? 'danger' : sc.severity === '중등도' ? 'warn' : 'blue'} />
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ color: sc.severity === '중증' ? C.dangerText : C.text, fontSize: 20, fontWeight: 700 }}>{sc.score}</span>
                                                                {sc.max_score && <span style={{ color: C.textMut, fontSize: 12 }}>/{sc.max_score}</span>}
                                                            </div>
                                                            {sc.max_score && (
                                                                <div style={{ height: 4, background: C.borderLight, borderRadius: 2, marginTop: 4 }}>
                                                                    <div style={{ width: `${(sc.score / sc.max_score) * 100}%`, height: '100%', borderRadius: 2, background: sc.severity === '중증' ? C.dangerText : C.blue, transition: 'width .4s' }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {rec.medications?.length > 0 && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>처방</div>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {rec.medications.map((med, i) => (
                                                        <span key={i} style={{ background: C.surface, borderRadius: 8, padding: '4px 10px', fontSize: 12, color: C.text }}>{med.name} {med.dose}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {rec.clinical_notes && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>소견</div>
                                                <div style={{ background: C.surface, borderRadius: 8, padding: 10, color: C.text, fontSize: 12, lineHeight: 1.6 }}>{rec.clinical_notes}</div>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* Predictions */}
            {subTab === 'predict' && sp && (
                <div>
                    {sp.records.length === 0 ? (
                        <Card style={{ padding: 30, textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>
                            <div style={{ color: C.text, fontWeight: 600 }}>데이터 필요</div>
                            <Btn onClick={() => setSubTab('upload')} style={{ marginTop: 12 }}>업로드</Btn>
                        </Card>
                    ) : (
                        <div>
                            {/* Key metrics */}
                            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : 'repeat(4,1fr)', gap: m ? 8 : 12, marginBottom: 14 }}>
                                {[
                                    { l: '노쇼 확률', v: `${pred.noshowProb}%`, i: '🚫', hi: pred.noshowProb > 25, s: pred.noshowProb > 25 ? '주의' : '정상' },
                                    { l: '예상 상담', v: `${pred.consultMin}분`, i: '⏱', s: pred.consultMin > 30 ? '장시간' : '표준' },
                                    { l: '치료 예측', v: pred.responsePredict, i: '📈', hi: pred.responsePredict === '악화 우려', s: `${pred.totalVisits}회 기반` },
                                    { l: '위험 수준', v: pred.riskLevel === 'high' ? '고위험' : pred.riskLevel === 'medium' ? '주의' : '안정', i: pred.riskLevel === 'high' ? '🚨' : '✅', hi: pred.riskLevel === 'high' },
                                ].map((x, i) => (
                                    <Card key={i} style={{ padding: m ? 12 : 16 }} borderColor={x.hi ? C.dangerText + '40' : C.border}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>{x.l}</div>
                                                <div style={{ color: x.hi ? C.dangerText : C.text, fontSize: m ? 18 : 22, fontWeight: 700 }}>{x.v}</div>
                                                <div style={{ color: C.textMut, fontSize: 10, marginTop: 2 }}>{x.s}</div>
                                            </div>
                                            <span style={{ fontSize: 16 }}>{x.i}</span>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Sparklines */}
                            {Object.keys(pred.scaleHistory).length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📊 척도 추이</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 12 }}>
                                        {Object.entries(pred.scaleHistory).map(([name, scores]) => {
                                            const d = scores.length >= 2 ? scores[scores.length - 1] - scores[scores.length - 2] : 0;
                                            return (
                                                <div key={name} style={{ background: C.surface, borderRadius: 10, padding: 14 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                        <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{name}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ color: C.text, fontSize: 18, fontWeight: 700 }}>{scores[scores.length - 1]}</span>
                                                            {d !== 0 && <span style={{ color: d > 0 ? C.dangerText : C.successText, fontSize: 12, fontWeight: 600 }}>{d > 0 ? `▲${d}` : `▼${Math.abs(d)}`}</span>}
                                                        </div>
                                                    </div>
                                                    <Spark data={scores} w={m ? 180 : 220} h={30} color={d > 0 ? C.dangerText : C.blue} />
                                                    <div style={{ color: C.textMut, fontSize: 10, marginTop: 4 }}>{scores.length}회</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}

                            {/* Noshow factors */}
                            {pred.noshowFactors?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🚫 노쇼 위험요인</div>
                                    {pred.noshowFactors.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: C.warnBg, borderRadius: 8, marginBottom: 4 }}>
                                            <span style={{ color: C.warnText, fontSize: 12 }}>⚠</span>
                                            <span style={{ color: C.text, fontSize: 12 }}>{f}</span>
                                        </div>
                                    ))}
                                </Card>
                            )}

                            {/* Recommendations */}
                            {pred.recs?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.blue}>
                                    <div style={{ color: C.blue, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>💡 AI 권고</div>
                                    {pred.recs.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 6, padding: '6px 0', borderBottom: i < pred.recs.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                                            <span style={{ color: C.blue }}>•</span>
                                            <span style={{ color: C.text, fontSize: 13 }}>{r}</span>
                                        </div>
                                    ))}
                                </Card>
                            )}

                            {/* Medications */}
                            {pred.meds?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20 }}>
                                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>💊 현재 처방</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 6 }}>
                                        {pred.meds.map((med, i) => (
                                            <div key={i} style={{ background: C.surface, borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{med.name}</span>
                                                <span style={{ color: C.textSec, fontSize: 12 }}>{med.dose} · {med.frequency}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
