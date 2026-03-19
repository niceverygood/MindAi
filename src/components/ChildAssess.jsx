import { useState, useEffect, useRef } from 'react';
import { Badge, Btn, Card } from './UI';
import { C, childGames } from '../constants';
import { useMobile } from '../hooks';

export default function ChildAssess() {
    const m = useMobile();
    const [ag, setAg] = useState(null);

    // Memory game state
    const [mc, setMc] = useState([]);
    const [fl, setFl] = useState([]);
    const [mt, setMt] = useState([]);
    const [mv, setMv] = useState(0);
    const [gst, setGst] = useState(null);
    const [rt, setRt] = useState([]);
    const [gc, setGc] = useState(false);
    const lft = useRef(null);
    const ej = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐸'];

    const startMem = () => {
        const c = [...ej, ...ej].sort(() => Math.random() - .5).map((e, i) => ({ id: i, emoji: e }));
        setMc(c); setFl([]); setMt([]); setMv(0); setRt([]); setGc(false);
        setGst(Date.now()); lft.current = Date.now(); setAg('memory');
    };

    const flip = (id) => {
        if (fl.length === 2 || fl.includes(id) || mt.includes(id)) return;
        const n = Date.now();
        if (lft.current) setRt(p => [...p, n - lft.current]);
        lft.current = n;
        const nf = [...fl, id];
        setFl(nf);
        if (nf.length === 2) {
            setMv(x => x + 1);
            if (mc[nf[0]].emoji === mc[nf[1]].emoji) {
                const nm = [...mt, nf[0], nf[1]];
                setMt(nm); setFl([]);
                if (nm.length === mc.length) setGc(true);
            } else {
                setTimeout(() => setFl([]), 800);
            }
        }
    };

    // Mole game state
    const [moles, setMoles] = useState(Array(9).fill(false));
    const [ms, setMs] = useState(0);
    const [mti, setMti] = useState(15);
    const [ma, setMa] = useState(false);
    const [mr, setMr] = useState([]);
    const mat = useRef(null);
    const mir = useRef(null);
    const tr = useRef(null);

    const startMole = () => {
        setMs(0); setMti(15); setMa(true); setMr([]); setAg('speed');
        tr.current = setInterval(() => {
            setMti(p => {
                if (p <= 1) {
                    clearInterval(tr.current); clearInterval(mir.current);
                    setMa(false); setMoles(Array(9).fill(false));
                    return 0;
                }
                return p - 1;
            });
        }, 1000);
        mir.current = setInterval(() => {
            const idx = Math.floor(Math.random() * 9);
            setMoles(() => { const n = Array(9).fill(false); n[idx] = true; return n; });
            mat.current = Date.now();
            setTimeout(() => setMoles(p => { const n = [...p]; n[idx] = false; return n; }), 1200);
        }, 1500);
    };

    const hitM = (i) => {
        if (!moles[i]) return;
        setMr(p => [...p, Date.now() - mat.current]);
        setMs(s => s + 1);
        setMoles(p => { const n = [...p]; n[i] = false; return n; });
    };

    useEffect(() => () => { clearInterval(mir.current); clearInterval(tr.current); }, []);
    const amr = mr.length > 0 ? Math.round(mr.reduce((a, b) => a + b, 0) / mr.length) : 0;

    // AI Result component
    const Res = ({ metrics, note }) => (
        <Card style={{ marginTop: 20, padding: m ? 16 : 24 }} borderColor={C.blue}>
            <div style={{ color: C.blue, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>AI 분석 결과</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: m ? 10 : 16 }}>
                {metrics.map((d, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ color: C.textMut, fontSize: 11 }}>{d.l}</div>
                        <div style={{ color: C.text, fontSize: m ? 18 : 22, fontWeight: 700, margin: '4px 0' }}>{d.v}</div>
                        {d.n && <div style={{ color: C.blue, fontSize: 10 }}>{d.n}</div>}
                    </div>
                ))}
            </div>
            <div style={{ marginTop: 14, padding: 12, background: C.surface, borderRadius: 10 }}>
                <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>📋 임상 소견</div>
                <div style={{ color: C.text, fontSize: 12, lineHeight: 1.7 }}>{note}</div>
            </div>
        </Card>
    );

    // Memory game view
    if (ag === 'memory') {
        const tt = gc ? Math.round((Date.now() - gst) / 1000) : null;
        const ar = rt.length > 0 ? Math.round(rt.reduce((a, b) => a + b, 0) / rt.length) : 0;
        return (
            <div className="slide-up">
                <Btn variant="ghost" onClick={() => setAg(null)}>← 목록</Btn>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 20px', gap: 8 }}>
                    <h2 style={{ color: C.text, fontSize: m ? 18 : 20, fontWeight: 700, margin: 0 }}>🧩 기억력 게임</h2>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: C.textMut, fontSize: 10 }}>시도</div>
                            <div style={{ color: C.blue, fontSize: 20, fontWeight: 700 }}>{mv}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: C.textMut, fontSize: 10 }}>매칭</div>
                            <div style={{ color: C.successText, fontSize: 20, fontWeight: 700 }}>{mt.length / 2}/{ej.length}</div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: m ? 8 : 12, maxWidth: 380, margin: '0 auto' }}>
                    {mc.map(c => {
                        const sh = fl.includes(c.id) || mt.includes(c.id);
                        const dn = mt.includes(c.id);
                        return (
                            <div key={c.id} onClick={() => flip(c.id)} style={{
                                aspectRatio: '1', borderRadius: 12,
                                background: dn ? C.blueLight : sh ? C.surface : C.bg,
                                border: `2px solid ${dn ? C.blue : sh ? C.blueMid : C.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: m ? 28 : 34, cursor: 'pointer', userSelect: 'none',
                                transition: 'all .2s ease', transform: sh ? 'rotateY(0)' : 'rotateY(0)',
                            }}>
                                {sh ? c.emoji : <span style={{ color: C.textMut }}>?</span>}
                            </div>
                        );
                    })}
                </div>
                {gc && <>
                    <Res
                        metrics={[
                            { l: '소요시간', v: `${tt}초`, n: '상위 35%' },
                            { l: '시도', v: `${mv}회`, n: mv <= 10 ? '효율적' : '탐색적' },
                            { l: '반응', v: `${ar}ms`, n: '정상' },
                        ]}
                        note={`작업기억 ${mv}회 시도, ${ar}ms. ${mv <= 10 ? '체계적 전략.' : '시행착오, 계획능력 지원 권장.'}`}
                    />
                    <Btn onClick={startMem} style={{ marginTop: 12 }}>다시하기</Btn>
                </>}
            </div>
        );
    }

    // Mole game view
    if (ag === 'speed') {
        return (
            <div className="slide-up">
                <Btn variant="ghost" onClick={() => { setAg(null); setMa(false); clearInterval(mir.current); clearInterval(tr.current); }}>← 목록</Btn>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 20px', gap: 8 }}>
                    <h2 style={{ color: C.text, fontSize: m ? 18 : 20, fontWeight: 700, margin: 0 }}>⚡ 두더지 잡기</h2>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: C.textMut, fontSize: 10 }}>점수</div>
                            <div style={{ color: C.blue, fontSize: 20, fontWeight: 700 }}>{ms}</div>
                        </div>
                        <div style={{
                            background: mti <= 5 ? C.dangerBg : C.blueLight,
                            color: mti <= 5 ? C.dangerText : C.blue,
                            padding: '5px 12px', borderRadius: 8,
                            fontWeight: 700, fontSize: 17, fontFamily: 'monospace',
                        }}>{mti}초</div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: m ? 8 : 12, maxWidth: 320, margin: '0 auto' }}>
                    {moles.map((a, i) => (
                        <div key={i} onClick={() => hitM(i)} style={{
                            aspectRatio: '1', borderRadius: 16,
                            background: a ? C.blueLight : C.surface,
                            border: `2px solid ${a ? C.blue : C.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: m ? 32 : 38, cursor: ma ? 'pointer' : 'default',
                            transform: a ? 'scale(1.05)' : 'scale(1)',
                            transition: 'all .15s ease', userSelect: 'none',
                        }}>{a ? '🐹' : '🕳️'}</div>
                    ))}
                </div>
                {!ma && mti === 0 && <>
                    <Res
                        metrics={[
                            { l: '적중률', v: `${ms}/10` },
                            { l: '반응속도', v: `${amr}ms` },
                            { l: '주의', v: ms >= 7 ? '양호' : ms >= 4 ? '보통' : '저하' },
                        ]}
                        note={`적중 ${ms}/10, ${amr}ms. ${amr < 500 ? '높은 각성.' : amr < 800 ? '또래 평균.' : '정밀 평가 권장.'}`}
                    />
                    <Btn onClick={startMole} style={{ marginTop: 12 }}>다시하기</Btn>
                </>}
                {!ma && mti > 0 && (
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Btn onClick={startMole}>게임 시작!</Btn>
                    </div>
                )}
            </div>
        );
    }

    // Game selection view
    return (
        <div className="slide-up">
            <div style={{ marginBottom: m ? 16 : 24 }}>
                <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>아동 인지·정서 평가</h2>
                <p style={{ color: C.textSec, fontSize: 12, margin: '4px 0 0' }}>게임형 평가 — AI가 데이터 수집</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : 'repeat(3,1fr)', gap: m ? 10 : 14 }}>
                {childGames.map(g => (
                    <Card key={g.id} style={{
                        padding: m ? 16 : 22,
                        cursor: (g.id === 'memory' || g.id === 'speed') ? 'pointer' : 'default',
                        transition: 'all .2s ease',
                    }} onClick={() => {
                        if (g.id === 'memory') startMem();
                        else if (g.id === 'speed') setAg('speed');
                    }}>
                        <div style={{ fontSize: m ? 28 : 34, marginBottom: 8 }}>{g.icon}</div>
                        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{g.name}</div>
                        <div style={{ color: C.textSec, fontSize: 11, marginBottom: 10, lineHeight: 1.4 }}>{g.desc}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <Badge text={g.domain} variant="blue" />
                            <span style={{ color: C.textMut, fontSize: 10 }}>{g.age}</span>
                        </div>
                        {(g.id === 'memory' || g.id === 'speed') && (
                            <div style={{ marginTop: 8, textAlign: 'center', color: C.blue, fontSize: 11, fontWeight: 600 }}>▶ 플레이</div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
