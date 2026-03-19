import { useState, useEffect, useRef } from 'react';
import { Badge, Btn, Card } from './UI';
import { C } from '../constants';
import { callAIJSON } from '../api';
import { useMobile } from '../hooks';

export default function DrawingTest() {
    const m = useMobile();
    const cr = useRef(null);
    const [dr, setDr] = useState(false);
    const [tl, setTl] = useState('pen');
    const [lw, setLw] = useState(3);
    const [pr, setPr] = useState('house');
    const [st, setSt] = useState([]);
    const [cs, setCs] = useState([]);
    const [ar, setAr] = useState(null);
    const [az, setAz] = useState(false);
    const sr = useRef(null);
    const [elapsed, setElapsed] = useState(0);

    const pm = {
        house: { l: '집', e: '🏠', t: '집을 그려주세요', desc: '안정감, 가정환경 인식' },
        tree: { l: '나무', e: '🌳', t: '나무를 그려주세요', desc: '자아상, 성장 욕구' },
        person: { l: '사람', e: '🧑', t: '사람을 그려주세요', desc: '자기상, 신체 이미지' },
        family: { l: '가족', e: '👨‍👩‍👧‍👦', t: '가족을 그려주세요', desc: '가족 관계, 역동' },
    };

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            if (sr.current) setElapsed(Math.round((Date.now() - sr.current) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Canvas init
    useEffect(() => {
        const cv = cr.current;
        if (!cv) return;
        const ctx = cv.getContext('2d');
        cv.width = cv.offsetWidth * 2;
        cv.height = cv.offsetHeight * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = '#FAFBFC';
        ctx.fillRect(0, 0, cv.offsetWidth, cv.offsetHeight);
        sr.current = Date.now();
        setSt([]);
        setAr(null);
        setElapsed(0);
    }, [pr]);

    const gp = (e) => {
        const r = cr.current.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - r.left, y: cy - r.top };
    };

    const sd = (e) => {
        e.preventDefault();
        setDr(true);
        const p = gp(e);
        setCs([{ ...p, time: Date.now() }]);
        cr.current.getContext('2d').beginPath();
        cr.current.getContext('2d').moveTo(p.x, p.y);
    };

    const dd = (e) => {
        e.preventDefault();
        if (!dr) return;
        const p = gp(e);
        setCs(prev => [...prev, { ...p, time: Date.now() }]);
        const ctx = cr.current.getContext('2d');
        ctx.strokeStyle = tl === 'eraser' ? '#FAFBFC' : '#111827';
        ctx.lineWidth = tl === 'eraser' ? 20 : lw;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    };

    const ed = (e) => {
        e.preventDefault();
        if (!dr) return;
        setDr(false);
        if (cs.length > 1) setSt(prev => [...prev, { points: cs, duration: cs[cs.length - 1].time - cs[0].time }]);
        setCs([]);
    };

    const cl = () => {
        const ctx = cr.current.getContext('2d');
        ctx.fillStyle = '#FAFBFC';
        ctx.fillRect(0, 0, cr.current.offsetWidth, cr.current.offsetHeight);
        setSt([]);
        setAr(null);
        sr.current = Date.now();
        setElapsed(0);
    };

    // Real AI analysis - send canvas image to Claude
    const analyze = async () => {
        if (st.length === 0) return;
        setAz(true);
        setAr(null);

        try {
            // Get canvas as base64 image
            const canvas = cr.current;
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];

            // Compute process data
            const totalTime = sr.current ? Math.round((Date.now() - sr.current) / 1000) : 0;
            const pauses = [];
            for (let i = 1; i < st.length; i++) {
                pauses.push(st[i].points[0].time - st[i - 1].points[st[i - 1].points.length - 1].time);
            }
            const longPauses = pauses.filter(p => p > 3000).length;
            const avgStrokeDuration = st.length > 0
                ? Math.round(st.reduce((a, s) => a + s.duration, 0) / st.length)
                : 0;
            const startArea = st.length > 0 ? (st[0].points[0].y < 200 ? '상단' : '하단') : '-';
            const startSide = st.length > 0 ? (st[0].points[0].x < 200 ? '좌측' : '우측') : '-';

            const processData = {
                prompt: pm[pr].l,
                totalStrokes: st.length,
                totalTime: `${totalTime}초`,
                longPauses,
                startPosition: `${startArea} ${startSide}`,
                avgStrokeDuration: `${avgStrokeDuration}ms`,
            };

            const messages = [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/png;base64,${base64}` },
                        },
                        {
                            type: 'text',
                            text: `정신건강의학과 HTP(House-Tree-Person) 그림검사 분석을 수행하세요.

과제: "${pm[pr].t}" (${pm[pr].l} 그림)
과정 데이터: ${JSON.stringify(processData)}

이 그림을 임상 심리학적 관점에서 분석하여 순수 JSON만 출력하세요. 백틱 없이.

{
  "drawing_description": "그림에 무엇이 그려져 있는지 객관적 묘사 (2-3줄)",
  "size_analysis": {
    "size": "작음/보통/큼",
    "meaning": "크기가 시사하는 심리적 의미 1줄"
  },
  "position_analysis": {
    "position": "상단/중앙/하단/좌측/우측 등",
    "meaning": "위치가 시사하는 의미 1줄"
  },
  "detail_level": {
    "level": "낮음/보통/높음",
    "meaning": "세밀도가 시사하는 인지 및 정서적 의미 1줄"
  },
  "pressure_analysis": {
    "level": "약함/보통/강함",
    "meaning": "필압이 시사하는 에너지 수준 및 정서 1줄"
  },
  "notable_features": ["그림에서 임상적으로 주목할 만한 특징 2-3개"],
  "omissions": ["생략된 중요 요소들 (문, 창문, 뿌리, 얼굴 등)"],
  "process_interpretation": "그리기 과정(시작위치, 멈춤, 속도)에서 읽을 수 있는 심리적 의미 (2줄)",
  "emotional_indicators": ["정서적 지표 2-3개 (예: 불안, 위축, 공격성 등)"],
  "clinical_impression": "종합적 임상 인상 및 소견 (3-4줄). 주의: 이 그림만으로 진단을 내릴 수 없으며, 종합적 평가의 일부로 해석해야 함을 포함",
  "recommendations": ["추가 평가 또는 치료적 권고 2-3개"],
  "confidence": "높음/보통/낮음 — 그림의 명확성에 따른 분석 신뢰도"
}

실제 그림을 꼼꼼히 관찰하고, 임상적으로 의미 있는 해석을 제공하세요. 과대 해석을 피하고, 그림검사의 한계를 인식하는 균형 잡힌 분석을 하세요.`,
                        },
                    ],
                },
            ];

            const result = await callAIJSON(messages, 3000);
            setAr({ ...result, processData });
        } catch (e) {
            console.error('AI Analysis Error:', e);
            setAr({
                error: true,
                clinical_impression: '분석 오류: ' + (e.message || '알 수 없는 오류'),
                processData: { totalStrokes: st.length },
            });
        }
        setAz(false);
    };

    return (
        <div className="slide-up">
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>디지털 그림검사 (HTP 2.0)</h2>
                <p style={{ color: C.textSec, fontSize: 12, margin: '4px 0 0' }}>과정 데이터 자동 기록 · AI 기반 심리 분석</p>
            </div>

            {/* Prompt selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {Object.entries(pm).map(([k, v]) => (
                    <Btn key={k} variant={pr === k ? 'secondary' : 'ghost'} onClick={() => setPr(k)} style={{ fontSize: 12 }}>
                        {v.e} {v.l}
                    </Btn>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 280px', gap: 14 }}>
                {/* Canvas */}
                <Card style={{ padding: m ? 10 : 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                        <div>
                            <span style={{ color: C.blue, fontSize: 13, fontWeight: 600 }}>✏️ {pm[pr].t}</span>
                            <div style={{ color: C.textMut, fontSize: 10 }}>{pm[pr].desc}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <Btn variant={tl === 'pen' ? 'secondary' : 'ghost'} onClick={() => setTl('pen')} style={{ padding: '4px 10px', fontSize: 11 }}>✏ 펜</Btn>
                            <Btn variant={tl === 'eraser' ? 'danger' : 'ghost'} onClick={() => setTl('eraser')} style={{ padding: '4px 10px', fontSize: 11 }}>◻ 지우개</Btn>
                        </div>
                    </div>
                    <canvas ref={cr}
                        onMouseDown={sd} onMouseMove={dd} onMouseUp={ed} onMouseLeave={ed}
                        onTouchStart={sd} onTouchMove={dd} onTouchEnd={ed}
                        style={{
                            width: '100%', height: m ? 280 : 380,
                            borderRadius: 10, cursor: tl === 'eraser' ? 'cell' : 'crosshair',
                            touchAction: 'none', border: `1px solid ${C.border}`,
                            display: 'block', background: '#FAFBFC',
                        }}
                    />

                    {/* Toolbar */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Btn variant="danger" onClick={cl} style={{ fontSize: 11, padding: '6px 12px' }}>🗑 초기화</Btn>

                        {/* Pen thickness with label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 120 }}>
                            <span style={{ color: C.textMut, fontSize: 10, whiteSpace: 'nowrap' }}>펜 굵기</span>
                            <input type="range" min="1" max="8" value={lw} onChange={e => setLw(Number(e.target.value))}
                                style={{ flex: 1, minWidth: 60 }} />
                            <div style={{
                                width: Math.max(lw * 2, 6), height: Math.max(lw * 2, 6),
                                borderRadius: '50%', background: C.text, flexShrink: 0,
                            }} />
                        </div>

                        <Btn onClick={analyze} disabled={st.length === 0 || az} style={{ fontSize: 12 }}>
                            {az ? (
                                <><span className="spinner" style={{ width: 14, height: 14 }} /> AI 분석 중...</>
                            ) : '🧠 AI 분석'}
                        </Btn>
                    </div>
                </Card>

                {/* Side panel */}
                <div style={{ display: 'flex', flexDirection: m ? 'row' : 'column', gap: 10, flexWrap: 'wrap' }}>
                    {/* Process data */}
                    <Card style={{ padding: 16, flex: 1, minWidth: m ? 'calc(50% - 5px)' : 'auto' }}>
                        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 10 }}>📊 과정 데이터</div>
                        {[
                            { l: '획 수', v: `${st.length}`, icon: '✏️' },
                            { l: '경과', v: `${elapsed}초`, icon: '⏱️' },
                            { l: '도구', v: tl === 'pen' ? `펜 (${lw}px)` : '지우개', icon: '🖊️' },
                            { l: '과제', v: pm[pr].l, icon: pm[pr].e },
                        ].map((x, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '6px 0', borderBottom: i < 3 ? `1px solid ${C.borderLight}` : 'none',
                            }}>
                                <span style={{ color: C.textSec, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 12 }}>{x.icon}</span> {x.l}
                                </span>
                                <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{x.v}</span>
                            </div>
                        ))}
                    </Card>

                    {/* AI Result - compact summary */}
                    {ar && !ar.error && (
                        <Card style={{ padding: 16, flex: 1, minWidth: m ? 'calc(50% - 5px)' : 'auto' }} borderColor={C.blue}>
                            <div style={{ color: C.blue, fontWeight: 600, fontSize: 13, marginBottom: 10 }}>🧠 AI 분석 요약</div>
                            {[
                                { l: '크기', v: ar.size_analysis?.size || '-' },
                                { l: '세밀도', v: ar.detail_level?.level || '-' },
                                { l: '필압', v: ar.pressure_analysis?.level || '-' },
                                { l: '신뢰도', v: ar.confidence || '-' },
                            ].map((x, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '4px 0', borderBottom: `1px solid ${C.borderLight}`,
                                }}>
                                    <span style={{ color: C.textSec, fontSize: 10 }}>{x.l}</span>
                                    <span style={{ color: C.text, fontSize: 10, fontWeight: 600 }}>{x.v}</span>
                                </div>
                            ))}
                            {ar.emotional_indicators?.length > 0 && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {ar.emotional_indicators.map((ind, i) => (
                                        <Badge key={i} text={ind} variant={ind.includes('불안') || ind.includes('위축') || ind.includes('공격') ? 'warn' : 'blue'} />
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {ar && ar.error && (
                        <Card style={{ padding: 16, flex: 1 }} borderColor={C.dangerText}>
                            <div style={{ color: C.dangerText, fontSize: 12 }}>⚠ {ar.clinical_impression}</div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Full AI Analysis Result */}
            {ar && !ar.error && (
                <div style={{ marginTop: 14 }}>
                    {/* Drawing description */}
                    <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                        <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📝 그림 묘사</div>
                        <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7, background: C.surface, borderRadius: 8, padding: 12 }}>
                            {ar.drawing_description}
                        </div>
                    </Card>

                    {/* Analysis grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        {/* Size */}
                        <Card style={{ padding: m ? 12 : 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <span style={{ fontSize: 16 }}>📐</span>
                                <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>크기 분석</span>
                                <Badge text={ar.size_analysis?.size || '-'} variant="blue" />
                            </div>
                            <div style={{ color: C.textSec, fontSize: 12, lineHeight: 1.5 }}>{ar.size_analysis?.meaning}</div>
                        </Card>

                        {/* Position */}
                        <Card style={{ padding: m ? 12 : 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <span style={{ fontSize: 16 }}>📍</span>
                                <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>위치 분석</span>
                                <Badge text={ar.position_analysis?.position || '-'} variant="blue" />
                            </div>
                            <div style={{ color: C.textSec, fontSize: 12, lineHeight: 1.5 }}>{ar.position_analysis?.meaning}</div>
                        </Card>

                        {/* Detail */}
                        <Card style={{ padding: m ? 12 : 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <span style={{ fontSize: 16 }}>🔍</span>
                                <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>세밀도</span>
                                <Badge text={ar.detail_level?.level || '-'} variant={ar.detail_level?.level === '높음' ? 'success' : ar.detail_level?.level === '낮음' ? 'warn' : 'blue'} />
                            </div>
                            <div style={{ color: C.textSec, fontSize: 12, lineHeight: 1.5 }}>{ar.detail_level?.meaning}</div>
                        </Card>

                        {/* Pressure */}
                        <Card style={{ padding: m ? 12 : 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <span style={{ fontSize: 16 }}>✍️</span>
                                <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>필압</span>
                                <Badge text={ar.pressure_analysis?.level || '-'} variant="blue" />
                            </div>
                            <div style={{ color: C.textSec, fontSize: 12, lineHeight: 1.5 }}>{ar.pressure_analysis?.meaning}</div>
                        </Card>
                    </div>

                    {/* Notable features & Omissions */}
                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        {ar.notable_features?.length > 0 && (
                            <Card style={{ padding: m ? 14 : 16 }}>
                                <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>🔎 주목할 특징</div>
                                {ar.notable_features.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 6, padding: '4px 0', borderBottom: i < ar.notable_features.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                                        <span style={{ color: C.blue }}>•</span>
                                        <span style={{ color: C.text, fontSize: 12, lineHeight: 1.5 }}>{f}</span>
                                    </div>
                                ))}
                            </Card>
                        )}

                        {ar.omissions?.length > 0 && (
                            <Card style={{ padding: m ? 14 : 16 }}>
                                <div style={{ color: C.warnText, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>⚠️ 생략된 요소</div>
                                {ar.omissions.map((o, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 6, background: C.warnBg, borderRadius: 6, padding: '4px 8px', marginBottom: 3 }}>
                                        <span style={{ color: C.warnText, fontSize: 12 }}>△</span>
                                        <span style={{ color: C.text, fontSize: 12 }}>{o}</span>
                                    </div>
                                ))}
                            </Card>
                        )}
                    </div>

                    {/* Process interpretation */}
                    {ar.process_interpretation && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                            <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>⏱️ 그리기 과정 해석</div>
                            <div style={{ color: C.text, fontSize: 12, lineHeight: 1.7, background: C.surface, borderRadius: 8, padding: 10 }}>
                                {ar.process_interpretation}
                            </div>
                        </Card>
                    )}

                    {/* Clinical impression */}
                    <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.blue}>
                        <div style={{ color: C.blue, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📋 종합 임상 소견</div>
                        <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>{ar.clinical_impression}</div>
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: C.textMut, fontSize: 10 }}>분석 신뢰도:</span>
                            <Badge text={ar.confidence || '보통'} variant={ar.confidence === '높음' ? 'success' : ar.confidence === '낮음' ? 'warn' : 'blue'} />
                        </div>
                    </Card>

                    {/* Recommendations */}
                    {ar.recommendations?.length > 0 && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                            <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>💡 권고사항</div>
                            {ar.recommendations.map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 6, padding: '5px 0', borderBottom: i < ar.recommendations.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                                    <span style={{ color: C.blue }}>•</span>
                                    <span style={{ color: C.text, fontSize: 12, lineHeight: 1.5 }}>{r}</span>
                                </div>
                            ))}
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
