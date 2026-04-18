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

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 68;

export default function App() {
    const m = useMobile();
    const [tab, setTab] = useState('dashboard');
    const [collapsed, setCollapsed] = useState(false);
    const [hoveredTab, setHoveredTab] = useState(null);

    const Page = pages[tab] || Dashboard;
    const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;

    return (
        <div style={{
            background: '#F9FAFB', minHeight: '100vh',
            fontFamily: "'Pretendard Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            display: 'flex',
            paddingBottom: m ? 64 : 0,
        }}>
            {/* Desktop Sidebar */}
            {!m && (
                <aside style={{
                    width: sidebarW,
                    minWidth: sidebarW,
                    height: '100vh',
                    position: 'sticky',
                    top: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255,255,255,.96)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRight: `1px solid ${C.border}`,
                    transition: 'width .25s cubic-bezier(.4,0,.2,1), min-width .25s cubic-bezier(.4,0,.2,1)',
                    zIndex: 100,
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    boxShadow: '2px 0 20px rgba(0,0,0,.03)',
                }}>
                    {/* Logo area */}
                    <div style={{
                        padding: collapsed ? '20px 0' : '20px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between',
                        borderBottom: `1px solid ${C.border}`,
                        minHeight: 68,
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            overflow: 'hidden', whiteSpace: 'nowrap',
                        }}>
                            <div style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 15, fontWeight: 700, color: '#fff',
                                boxShadow: '0 2px 10px rgba(37,99,235,.35)',
                                flexShrink: 0,
                            }}>M</div>
                            {!collapsed && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: C.text, fontWeight: 700, fontSize: 17 }}>MindAI</span>
                                    <Badge text="BETA" variant="blue" />
                                </div>
                            )}
                        </div>
                        {!collapsed && (
                            <button
                                onClick={() => setCollapsed(true)}
                                style={{
                                    background: 'none', border: 'none',
                                    color: C.textMut, fontSize: 16,
                                    padding: 4, borderRadius: 6,
                                    cursor: 'pointer',
                                    transition: 'all .15s',
                                    display: 'flex', alignItems: 'center',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = C.text}
                                onMouseLeave={e => e.currentTarget.style.color = C.textMut}
                                title="사이드바 접기"
                            >
                                ◀
                            </button>
                        )}
                    </div>

                    {/* Expand button when collapsed */}
                    {collapsed && (
                        <button
                            onClick={() => setCollapsed(false)}
                            style={{
                                background: 'none', border: 'none',
                                color: C.textMut, fontSize: 14,
                                padding: '12px 0',
                                cursor: 'pointer',
                                transition: 'all .15s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = C.blue}
                            onMouseLeave={e => e.currentTarget.style.color = C.textMut}
                            title="사이드바 펼치기"
                        >
                            ▶
                        </button>
                    )}

                    {/* Navigation section label */}
                    {!collapsed && (
                        <div style={{
                            padding: '16px 20px 6px',
                            fontSize: 10, fontWeight: 600,
                            color: C.textMut,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>
                            메뉴
                        </div>
                    )}

                    {/* Navigation items */}
                    <nav style={{
                        flex: 1,
                        padding: collapsed ? '8px 8px' : '4px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}>
                        {tabs.map(t => {
                            const isActive = tab === t.id;
                            const isHovered = hoveredTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    onMouseEnter={() => setHoveredTab(t.id)}
                                    onMouseLeave={() => setHoveredTab(null)}
                                    title={collapsed ? t.l : undefined}
                                    style={{
                                        position: 'relative',
                                        background: isActive
                                            ? `linear-gradient(135deg, ${C.blueLight}, rgba(219,234,254,.6))`
                                            : isHovered ? 'rgba(243,244,246,.8)' : 'transparent',
                                        border: 'none',
                                        color: isActive ? C.blue : isHovered ? C.text : C.textSec,
                                        padding: collapsed ? '12px 0' : '10px 14px',
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                        fontSize: 13.5,
                                        fontWeight: isActive ? 650 : 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        gap: 10,
                                        transition: 'all .18s ease',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {/* Active indicator bar */}
                                    {isActive && (
                                        <div style={{
                                            position: 'absolute',
                                            left: collapsed ? '50%' : 0,
                                            top: collapsed ? 'auto' : '50%',
                                            bottom: collapsed ? 0 : 'auto',
                                            transform: collapsed ? 'translateX(-50%)' : 'translateY(-50%)',
                                            width: collapsed ? 20 : 3,
                                            height: collapsed ? 3 : 20,
                                            borderRadius: 3,
                                            background: C.blue,
                                            boxShadow: `0 0 8px ${C.blue}40`,
                                        }} />
                                    )}
                                    <span style={{ fontSize: 17, flexShrink: 0 }}>{t.i}</span>
                                    {!collapsed && <span>{t.l}</span>}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Clinic info */}
                    <div style={{
                        borderTop: `1px solid ${C.border}`,
                        padding: collapsed ? '14px 0' : '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: 8,
                    }}>
                        <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: C.successText,
                            boxShadow: `0 0 8px ${C.successText}`,
                            flexShrink: 0,
                        }} />
                        {!collapsed && (
                            <span style={{
                                color: C.textSec, fontSize: 11.5,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                서울마음정신건강의학과
                            </span>
                        )}
                    </div>
                </aside>
            )}

            {/* Mobile header */}
            {m && (
                <div className="glass" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: `1px solid ${C.border}`,
                    position: 'fixed', top: 0, left: 0, right: 0,
                    zIndex: 100,
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
                </div>
            )}

            {/* Main Content */}
            <main style={{
                flex: 1,
                minWidth: 0,
                padding: m ? '60px 14px 16px' : '24px 32px',
                maxWidth: m ? '100%' : 1160,
                margin: m ? 0 : undefined,
                transition: 'padding .25s ease',
            }}>
                <Page onNavigate={setTab} />
            </main>

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
