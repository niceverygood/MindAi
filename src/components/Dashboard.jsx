import { useState, useEffect } from 'react';
import { Badge, Card, PBar } from './UI';
import { C, patients, weeklyStats } from '../constants';
import { useMobile } from '../hooks';

export default function Dashboard() {
    const m = useMobile();
    const [ct, setCt] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setCt(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const tp = patients.reduce((a, p) => a + p.predictedMin, 0);
    const hr = patients.filter(p => p.risk === 'high').length;

    const statCards = [
        { l: '오늘 예약', v: `${patients.length}명`, s: '초진 3·재진 5', i: '👥', b: true },
        { l: '예상 진료', v: `${Math.floor(tp / 60)}h ${tp % 60}m`, s: 'AI 예측', i: '⏱' },
        { l: '평균 대기', v: '8분', s: '목표 10분', i: '⏳' },
        { l: '위험 알림', v: `${hr}건`, s: '척도 악화', i: '🚨' },
    ];

    return (
        <div className="slide-up">
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: m ? 16 : 24, gap: 8 }}>
                <div>
                    <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>오늘의 진료실</h2>
                    <p style={{ color: C.textSec, fontSize: 12, margin: '4px 0 0' }}>
                        {ct.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                    </p>
                </div>
                <Badge text="정상 운영 중" variant="success" />
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : 'repeat(4,1fr)', gap: m ? 10 : 14, marginBottom: m ? 16 : 24 }}>
                {statCards.map((s, i) => (
                    <div key={i} className="fade-in" style={{
                        background: s.b ? `linear-gradient(135deg, ${C.blueLight}, #EBF5FF)` : C.bg,
                        borderRadius: 14, padding: m ? '14px 16px' : '18px 22px',
                        border: `1px solid ${s.b ? C.blueMid : C.border}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                        animationDelay: `${i * 0.08}s`, animationFillMode: 'backwards',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>{s.l}</div>
                                <div style={{ color: s.b ? C.blueDark : C.text, fontSize: m ? 20 : 26, fontWeight: 700 }}>{s.v}</div>
                                <div style={{ color: C.textMut, fontSize: 10, marginTop: 2 }}>{s.s}</div>
                            </div>
                            <span style={{ fontSize: 18, opacity: .6 }}>{s.i}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Patient Timeline */}
            <Card style={{ overflow: 'hidden', marginBottom: m ? 16 : 20 }}>
                <div style={{
                    padding: m ? '12px 16px' : '14px 22px',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>진료 타임라인</span>
                    <span style={{ color: C.textMut, fontSize: 11 }}>AI 정확도 91.3%</span>
                </div>

                {m ? (
                    /* Mobile List */
                    patients.map((p, i) => (
                        <div key={p.id} style={{
                            padding: '12px 16px',
                            borderBottom: i < patients.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                            background: p.status === '진료중' ? C.blueLight : 'transparent',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ color: C.text, fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{p.time}</span>
                                    <span style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{p.name}{p.isChild ? ' 👶' : ''}</span>
                                </div>
                                <Badge text={p.status} variant={p.status === '진료중' ? 'blue' : 'default'} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ color: C.textSec, fontSize: 12 }}>{p.diagnosis}</span>
                                    <span style={{ color: C.textMut, fontSize: 11, marginLeft: 6 }}>{p.type}·{p.age}세</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Badge text={p.risk === 'high' ? '고위험' : p.risk === 'medium' ? '주의' : '안정'} variant={p.risk === 'high' ? 'danger' : p.risk === 'medium' ? 'warn' : 'success'} />
                                    <span style={{ color: C.textSec, fontSize: 11 }}>{p.predictedMin}분</span>
                                    {p.scaleChange != null
                                        ? <span style={{ color: p.scaleChange > 0 ? C.dangerText : C.successText, fontSize: 11, fontWeight: 600 }}>
                                            {p.scaleChange > 0 ? `▲${p.scaleChange}` : `▼${Math.abs(p.scaleChange)}`}
                                        </span>
                                        : <span style={{ color: C.textMut, fontSize: 10 }}>신규</span>
                                    }
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    /* Desktop Table */
                    patients.map((p, i) => (
                        <div key={p.id} style={{
                            display: 'grid', gridTemplateColumns: '64px 90px 1fr 100px 70px 70px 60px',
                            alignItems: 'center', padding: '12px 22px', gap: 10,
                            borderBottom: i < patients.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                            background: p.status === '진료중' ? C.blueLight : 'transparent',
                            transition: 'background .15s',
                        }}>
                            <span style={{ color: C.text, fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{p.time}</span>
                            <span style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{p.name}{p.isChild ? ' 👶' : ''}</span>
                            <div>
                                <span style={{ color: C.textSec, fontSize: 12 }}>{p.diagnosis}</span>
                                <span style={{ color: C.textMut, fontSize: 11, marginLeft: 8 }}>{p.type}·{p.age}세</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <PBar value={p.predictedMin} max={50} />
                                <span style={{ color: C.textSec, fontSize: 11 }}>{p.predictedMin}분</span>
                            </div>
                            <Badge text={p.risk === 'high' ? '고위험' : p.risk === 'medium' ? '주의' : '안정'} variant={p.risk === 'high' ? 'danger' : p.risk === 'medium' ? 'warn' : 'success'} />
                            <Badge text={p.status} variant={p.status === '진료중' ? 'blue' : 'default'} />
                            {p.scaleChange != null
                                ? <span style={{ color: p.scaleChange > 0 ? C.dangerText : C.successText, fontSize: 12, fontWeight: 600 }}>
                                    {p.scaleChange > 0 ? `▲${p.scaleChange}` : `▼${Math.abs(p.scaleChange)}`}
                                </span>
                                : <span style={{ color: C.textMut, fontSize: 11 }}>신규</span>
                            }
                        </div>
                    ))
                )}
            </Card>

            {/* Bottom row */}
            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 14 }}>
                <Card style={{ padding: m ? 16 : 22 }}>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 18 }}>주간 대기시간</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: m ? 10 : 14, height: 100 }}>
                        {weeklyStats.map((d, i) => (
                            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{
                                    height: d.w * 4, borderRadius: '5px 5px 0 0',
                                    background: d.w > 15 ? C.dangerBg : `linear-gradient(180deg, ${C.blue}, ${C.blueDark})`,
                                    position: 'relative',
                                    transition: 'height .4s ease',
                                }}>
                                    <span style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', color: C.textSec, fontSize: 10, fontWeight: 600 }}>{d.w}</span>
                                </div>
                                <div style={{ color: C.textSec, fontSize: 11, marginTop: 6 }}>{d.day}</div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card style={{ padding: m ? 16 : 22 }}>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 18 }}>AI 스케줄링 효과</div>
                    {[
                        { l: '대기 단축', v: '-42%', p: 42 },
                        { l: '노쇼 감소', v: '-67%', p: 67 },
                        { l: '진료 효율', v: '+31%', p: 31 },
                        { l: '만족도', v: '4.6/5', p: 92 },
                    ].map((it, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: C.textSec, fontSize: 12 }}>{it.l}</span>
                                <span style={{ color: C.blue, fontWeight: 700, fontSize: 13 }}>{it.v}</span>
                            </div>
                            <div style={{ height: 5, background: C.surface, borderRadius: 3 }}>
                                <div style={{
                                    width: `${it.p}%`, height: '100%',
                                    background: `linear-gradient(90deg, ${C.blue}, ${C.blueDark})`,
                                    borderRadius: 3, transition: 'width .6s ease',
                                }} />
                            </div>
                        </div>
                    ))}
                </Card>
            </div>
        </div>
    );
}
