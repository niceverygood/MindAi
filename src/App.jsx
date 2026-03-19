import { useState } from 'react';
import { Badge } from './components/UI';
import { C, tabs } from './constants';
import { useMobile } from './hooks';
import Dashboard from './components/Dashboard';
import ChildAssess from './components/ChildAssess';
import DrawingTest from './components/DrawingTest';
import FullBattery from './components/FullBattery';
import RiskMonitor from './components/RiskMonitor';
import DataAnalysis from './components/DataAnalysis';
import SOAPNote from './components/SOAPNote';
import PatientReport from './components/PatientReport';

const pages = {
    dashboard: Dashboard,
    child: ChildAssess,
    drawing: DrawingTest,
    report: FullBattery,
    risk: RiskMonitor,
    data: DataAnalysis,
    soap: SOAPNote,
    patreport: PatientReport,
};

export default function App() {
    const m = useMobile();
    const [tab, setTab] = useState('dashboard');

    const Page = pages[tab] || Dashboard;

    return (
        <div style={{
            background: '#F9FAFB', minHeight: '100vh',
            fontFamily: "'Pretendard Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            paddingBottom: m ? 64 : 0,
        }}>
            {/* Desktop header */}
            {!m && (
                <div className="glass" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 28px',
                    borderBottom: `1px solid ${C.border}`,
                    position: 'sticky', top: 0, zIndex: 100,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700, color: '#fff',
                            boxShadow: '0 2px 8px rgba(37,99,235,.3)',
                        }}>M</div>
                        <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>MindAI</span>
                        <Badge text="BETA" variant="blue" />
                    </div>

                    <div style={{ display: 'flex', gap: 2 }}>
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} style={{
                                background: tab === t.id ? C.blueLight : 'transparent',
                                border: 'none', color: tab === t.id ? C.blue : C.textSec,
                                padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                                transition: 'all .15s ease',
                            }}>
                                <span>{t.i}</span>{t.l}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.successText, boxShadow: `0 0 6px ${C.successText}` }} />
                        <span style={{ color: C.textSec, fontSize: 12 }}>서울마음정신건강의학과</span>
                    </div>
                </div>
            )}

            {/* Mobile header */}
            {m && (
                <div className="glass" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: `1px solid ${C.border}`,
                    position: 'sticky', top: 0, zIndex: 100,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 7,
                            background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: '#fff',
                        }}>M</div>
                        <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>MindAI</span>
                    </div>
                    <span style={{ color: C.textSec, fontSize: 11 }}>서울마음</span>
                </div>
            )}

            {/* Content */}
            <div style={{ padding: m ? '16px 14px' : '24px 28px', maxWidth: 1160, margin: '0 auto' }}>
                <Page />
            </div>

            {/* Mobile bottom nav */}
            {m && (
                <div className="glass" style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    borderTop: `1px solid ${C.border}`,
                    display: 'flex', justifyContent: 'space-around',
                    padding: '4px 0 env(safe-area-inset-bottom, 4px)',
                    zIndex: 100,
                }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            background: 'none', border: 'none',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                            padding: '4px 4px', cursor: 'pointer',
                            color: tab === t.id ? C.blue : C.textMut,
                            WebkitTapHighlightColor: 'transparent',
                            transition: 'color .15s',
                        }}>
                            <span style={{ fontSize: 16 }}>{t.i}</span>
                            <span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 500 }}>{t.l}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
