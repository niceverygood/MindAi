import { Badge, Card } from './UI';
import { C } from '../constants';
import { useMobile } from '../hooks';

const alerts = [
    { id: 1, patient: '박○○', age: 28, sev: 'high', time: '09:42', title: '자살 위험도 상승', detail: 'PHQ-9 24→27, MMPI DEP 82T', action: 'C-SSRS 즉시 시행' },
    { id: 2, patient: '최○○', age: 5, sev: 'medium', time: '10:15', title: '분리불안 악화', detail: 'CBCL 68→74T', action: '보호자 면담', child: true },
    { id: 3, patient: '정○○', age: 42, sev: 'medium', time: '10:30', title: '순응도 저하', detail: '3회 지각, PANSS +2', action: 'LAI 검토' },
    { id: 4, patient: '강○○', age: 19, sev: 'low', time: '11:00', title: '스크리닝 완료', detail: 'GAD-7:14, PHQ-9:11', action: 'Full Battery 권장' },
];

export default function RiskMonitor() {
    const m = useMobile();

    return (
        <div className="slide-up">
            <div style={{ marginBottom: m ? 14 : 24 }}>
                <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>AI 위험도 모니터링</h2>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : 'repeat(4,1fr)', gap: m ? 8 : 14, marginBottom: m ? 14 : 24 }}>
                {[
                    { l: '고위험', v: '1건', i: '🚨' },
                    { l: '주의', v: '2건', i: '⚠️' },
                    { l: '정보', v: '1건', i: 'ℹ️', b: true },
                    { l: '이번 주', v: '12건', i: '🛡' },
                ].map((s, i) => (
                    <div key={i} style={{
                        background: s.b ? C.blueLight : C.bg,
                        borderRadius: 12, padding: m ? '12px 14px' : '16px 20px',
                        border: `1px solid ${s.b ? C.blueMid : C.border}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                    }}>
                        <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}>{s.l}</div>
                        <div style={{ color: s.b ? C.blueDark : C.text, fontSize: m ? 20 : 24, fontWeight: 700 }}>{s.v}</div>
                    </div>
                ))}
            </div>

            {/* Alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {alerts.map(a => (
                    <Card key={a.id} style={{
                        padding: m ? 14 : 18,
                        borderLeft: `4px solid ${a.sev === 'high' ? C.dangerText : a.sev === 'medium' ? C.warnText : C.blue}`,
                    }} borderColor={a.sev === 'high' ? C.dangerText + '30' : a.sev === 'medium' ? C.warnText + '30' : C.border}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 16 }}>{a.sev === 'high' ? '🚨' : a.sev === 'medium' ? '⚠️' : 'ℹ️'}</span>
                                <div>
                                    <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{a.title}</div>
                                    <div style={{ color: C.textSec, fontSize: 11 }}>{a.patient} ({a.age}세){a.child ? ' 👶' : ''}·{a.time}</div>
                                </div>
                            </div>
                            <Badge text={a.sev === 'high' ? '고위험' : a.sev === 'medium' ? '주의' : '정보'} variant={a.sev === 'high' ? 'danger' : a.sev === 'medium' ? 'warn' : 'blue'} />
                        </div>
                        <div style={{ background: C.surface, borderRadius: 8, padding: 10, marginBottom: 8, color: C.text, fontSize: 12, lineHeight: 1.5 }}>{a.detail}</div>
                        <div style={{
                            background: a.sev === 'high' ? C.dangerBg : a.sev === 'medium' ? C.warnBg : C.blueLight,
                            borderRadius: 6, padding: '6px 10px',
                            color: a.sev === 'high' ? C.dangerText : a.sev === 'medium' ? C.warnText : C.blue,
                            fontSize: 11, fontWeight: 600,
                        }}>💡 {a.action}</div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
