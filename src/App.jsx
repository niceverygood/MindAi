import { useState, useEffect } from 'react';
import { Badge } from './components/UI';
import { C, tabs } from './constants';
import { useMobile } from './hooks';
import { getApiKey, setApiKey, hasApiKey } from './api';
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

// Settings Modal Component
function SettingsModal({ onClose }) {
    const [key, setKey] = useState(getApiKey());
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const save = () => {
        setApiKey(key);
        setSaved(true);
        setTestResult(null);
        setTimeout(() => setSaved(false), 2000);
    };

    const testKey = async () => {
        if (!key.trim()) return;
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key.trim()}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'MindAI Platform',
                },
                body: JSON.stringify({
                    model: 'anthropic/claude-sonnet-4',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: '테스트' }],
                }),
            });
            if (res.ok) {
                setTestResult({ ok: true, msg: '✅ API 키가 유효합니다!' });
            } else {
                const data = await res.json().catch(() => ({}));
                setTestResult({ ok: false, msg: `❌ ${data.error?.message || '키가 유효하지 않습니다 (HTTP ' + res.status + ')'}` });
            }
        } catch (e) {
            setTestResult({ ok: false, msg: `❌ 연결 오류: ${e.message}` });
        }
        setTesting(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,.45)',
            backdropFilter: 'blur(6px)',
            animation: 'fadeIn .2s ease',
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#fff', borderRadius: 18, padding: 28,
                width: '90%', maxWidth: 480,
                boxShadow: '0 20px 60px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.05)',
                animation: 'scaleIn .25s ease',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>⚙️ 설정</div>
                        <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>AI 기능 사용을 위한 API 설정</div>
                    </div>
                    <button onClick={onClose} style={{
                        background: C.surface, border: 'none', width: 32, height: 32, borderRadius: 8,
                        fontSize: 16, cursor: 'pointer', color: C.textSec,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .15s',
                    }}>✕</button>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>OpenRouter API Key</label>
                        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
                            style={{ fontSize: 11, color: C.blue, textDecoration: 'none' }}>
                            키 발급받기 →
                        </a>
                    </div>
                    <input
                        type="password"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        style={{
                            width: '100%', padding: '10px 14px', borderRadius: 10,
                            border: `1.5px solid ${C.border}`, fontSize: 13,
                            fontFamily: 'monospace',
                            transition: 'all .2s',
                        }}
                        onFocus={e => e.target.style.borderColor = C.blue}
                        onBlur={e => e.target.style.borderColor = C.border}
                    />
                    <div style={{ fontSize: 11, color: C.textMut, marginTop: 6, lineHeight: 1.5 }}>
                        API 키는 브라우저 로컬 스토리지에만 저장되며 외부로 전송되지 않습니다.
                    </div>
                </div>

                {testResult && (
                    <div style={{
                        padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                        background: testResult.ok ? C.successBg : C.dangerBg,
                        color: testResult.ok ? C.successText : C.dangerText,
                        fontSize: 12, fontWeight: 600,
                    }}>
                        {testResult.msg}
                    </div>
                )}

                {saved && (
                    <div style={{
                        padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                        background: C.successBg, color: C.successText,
                        fontSize: 12, fontWeight: 600,
                    }}>
                        ✅ API 키가 저장되었습니다!
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={testKey} disabled={!key.trim() || testing} style={{
                        flex: 1, padding: '10px 16px', borderRadius: 10,
                        background: C.surface, border: `1px solid ${C.border}`,
                        color: C.text, fontSize: 13, fontWeight: 600,
                        cursor: key.trim() && !testing ? 'pointer' : 'not-allowed',
                        opacity: key.trim() && !testing ? 1 : 0.5,
                        transition: 'all .15s',
                    }}>
                        {testing ? '🔄 테스트 중...' : '🧪 연결 테스트'}
                    </button>
                    <button onClick={save} disabled={!key.trim()} style={{
                        flex: 1, padding: '10px 16px', borderRadius: 10,
                        background: key.trim() ? `linear-gradient(135deg, ${C.blue}, ${C.blueDark})` : C.surface,
                        border: 'none',
                        color: key.trim() ? '#fff' : C.textMut, fontSize: 13, fontWeight: 600,
                        cursor: key.trim() ? 'pointer' : 'not-allowed',
                        boxShadow: key.trim() ? '0 2px 12px rgba(37,99,235,.3)' : 'none',
                        transition: 'all .15s',
                    }}>
                        💾 저장
                    </button>
                </div>

                <div style={{
                    marginTop: 20, padding: '12px 14px', borderRadius: 10,
                    background: C.blueLight, fontSize: 11, lineHeight: 1.6, color: C.text,
                }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: C.blueDark }}>💡 사용 방법</div>
                    1. <a href="https://openrouter.ai" target="_blank" rel="noreferrer" style={{ color: C.blue }}>openrouter.ai</a>에서 계정 생성<br />
                    2. 크레딧 충전 후 API 키 발급<br />
                    3. 위 입력란에 키 붙여넣기 → 저장<br />
                    4. SOAP, 풀배터리, 진료분석 등 AI 기능 사용 가능
                </div>
            </div>
        </div>
    );
}

export default function App() {
    const m = useMobile();
    const [tab, setTab] = useState('dashboard');
    const [collapsed, setCollapsed] = useState(false);
    const [hoveredTab, setHoveredTab] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [apiReady, setApiReady] = useState(hasApiKey());

    useEffect(() => {
        const checkKey = () => setApiReady(hasApiKey());
        window.addEventListener('storage', checkKey);
        return () => window.removeEventListener('storage', checkKey);
    }, []);

    // Re-check API key when settings modal closes
    const handleSettingsClose = () => {
        setShowSettings(false);
        setApiReady(hasApiKey());
    };

    const Page = pages[tab] || Dashboard;
    const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;

    return (
        <div style={{
            background: '#F9FAFB', minHeight: '100vh',
            fontFamily: "'Pretendard Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            display: 'flex',
            paddingBottom: m ? 64 : 0,
        }}>
            {/* Settings Modal */}
            {showSettings && <SettingsModal onClose={handleSettingsClose} />}

            {/* API Key Warning Banner */}
            {!apiReady && !m && (
                <div style={{
                    position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 200,
                    background: C.warnBg, border: `1px solid ${C.warnText}30`,
                    borderRadius: 12, padding: '8px 18px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 4px 20px rgba(217,119,6,.15)',
                    animation: 'fadeIn .4s ease',
                }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <span style={{ fontSize: 12, color: C.warnText, fontWeight: 600 }}>
                        AI 기능을 사용하려면 API 키를 설정하세요
                    </span>
                    <button onClick={() => setShowSettings(true)} style={{
                        background: C.warnText, color: '#fff', border: 'none',
                        borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 600,
                        cursor: 'pointer',
                    }}>설정 →</button>
                </div>
            )}

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

                    {/* Bottom: Settings + Clinic info */}
                    <div style={{ borderTop: `1px solid ${C.border}` }}>
                        {/* Settings button */}
                        <button
                            onClick={() => setShowSettings(true)}
                            style={{
                                width: '100%',
                                background: 'none', border: 'none',
                                padding: collapsed ? '12px 0' : '10px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                gap: 10,
                                cursor: 'pointer',
                                color: C.textSec,
                                fontSize: 13,
                                fontWeight: 500,
                                transition: 'all .15s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = C.surface;
                                e.currentTarget.style.color = C.text;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = C.textSec;
                            }}
                            title={collapsed ? '설정' : undefined}
                        >
                            <span style={{ fontSize: 17 }}>⚙️</span>
                            {!collapsed && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    설정
                                    {!apiReady && (
                                        <span style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: C.dangerText,
                                            boxShadow: `0 0 6px ${C.dangerText}`,
                                            display: 'inline-block',
                                        }} />
                                    )}
                                </span>
                            )}
                            {collapsed && !apiReady && (
                                <span style={{
                                    position: 'absolute',
                                    top: 8, right: 12,
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: C.dangerText,
                                    boxShadow: `0 0 6px ${C.dangerText}`,
                                }} />
                            )}
                        </button>

                        {/* Clinic info */}
                        <div style={{
                            padding: collapsed ? '12px 0' : '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: 8,
                        }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: apiReady ? C.successText : C.textMut,
                                boxShadow: apiReady ? `0 0 8px ${C.successText}` : 'none',
                                flexShrink: 0,
                            }} />
                            {!collapsed && (
                                <span style={{
                                    color: C.textSec, fontSize: 11.5,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {apiReady ? '서울마음정신건강의학과' : 'API 키 미설정'}
                                </span>
                            )}
                        </div>
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
                    <button onClick={() => setShowSettings(true)} style={{
                        background: 'none', border: 'none', fontSize: 18, cursor: 'pointer',
                        color: C.textSec, position: 'relative',
                    }}>
                        ⚙️
                        {!apiReady && (
                            <span style={{
                                position: 'absolute', top: -2, right: -2,
                                width: 7, height: 7, borderRadius: '50%',
                                background: C.dangerText,
                            }} />
                        )}
                    </button>
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
                <Page />
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
