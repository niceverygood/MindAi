import { C } from '../constants';

/* ── Badge ── */
export function Badge({ text, variant = 'default' }) {
    const variants = {
        danger: { bg: C.dangerBg, color: C.dangerText },
        warn: { bg: C.warnBg, color: C.warnText },
        success: { bg: C.successBg, color: C.successText },
        blue: { bg: C.blueLight, color: C.blue },
        default: { bg: C.surface, color: C.textSec },
    };
    const s = variants[variant] || variants.default;
    return (
        <span style={{
            background: s.bg, color: s.color,
            fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
            whiteSpace: 'nowrap', display: 'inline-block',
        }}>{text}</span>
    );
}

/* ── Button ── */
export function Btn({ children, variant = 'primary', onClick, disabled, style: sx }) {
    const base = {
        border: 'none', borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 600, fontSize: 13,
        transition: 'all .15s ease',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        WebkitTapHighlightColor: 'transparent',
        ...sx,
    };

    const variants = {
        primary: { background: C.blue, color: '#fff', padding: '10px 20px', opacity: disabled ? .5 : 1 },
        secondary: { background: C.blueLight, color: C.blue, padding: '8px 14px' },
        ghost: { background: 'transparent', color: C.textSec, padding: '8px 10px' },
        danger: { background: C.dangerBg, color: C.dangerText, padding: '8px 14px' },
    };

    Object.assign(base, variants[variant] || variants.primary);

    return <button onClick={onClick} disabled={disabled} style={base}>{children}</button>;
}

/* ── Card ── */
export function Card({ children, style: sx, borderColor, className = '' }) {
    return (
        <div className={`fade-in ${className}`} style={{
            background: C.bg, borderRadius: 14,
            border: `1px solid ${borderColor || C.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            ...sx,
        }}>{children}</div>
    );
}

/* ── Progress Bar ── */
export function PBar({ value, max, color }) {
    return (
        <div style={{ width: 48, height: 5, background: C.borderLight, borderRadius: 3, flexShrink: 0 }}>
            <div style={{
                width: `${Math.min((value / max) * 100, 100)}%`,
                height: '100%', background: color || C.blue, borderRadius: 3,
                transition: 'width .4s ease',
            }} />
        </div>
    );
}

/* ── Sparkline Chart ── */
export function Spark({ data, w: W = 120, h: H = 32, color = C.blue }) {
    if (!data || data.length < 2) return null;
    const mn = Math.min(...data) - 1, mx = Math.max(...data) + 1, rng = mx - mn || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - mn) / rng) * H}`).join(' ');
    return (
        <svg width={W} height={H} style={{ display: 'block' }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
            {data.map((v, i) => (
                <circle key={i} cx={(i / (data.length - 1)) * W} cy={H - ((v - mn) / rng) * H}
                    r="3" fill={i === data.length - 1 ? color : 'white'} stroke={color} strokeWidth="1.5" />
            ))}
        </svg>
    );
}

/* ── Gauge (circular progress) ── */
export function Gauge({ score, max, color, label }) {
    const pct = max ? (score / max) * 100 : 0;
    const clr = color === 'green' ? C.successText : color === 'yellow' ? C.warnText
        : color === 'orange' ? '#EA580C' : color === 'red' ? C.dangerText : C.blue;
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto' }}>
                <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke={C.borderLight} strokeWidth="6" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke={clr} strokeWidth="6"
                        strokeDasharray={`${pct * 1.76} 176`} strokeLinecap="round" transform="rotate(-90 32 32)"
                        style={{ transition: 'stroke-dasharray .6s ease' }} />
                </svg>
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    fontSize: 14, fontWeight: 700, color: clr,
                }}>{score}</div>
            </div>
            <div style={{ color: C.textSec, fontSize: 10, marginTop: 4 }}>{label}</div>
        </div>
    );
}

/* ── Loading Spinner ── */
export function Spinner({ size = 24, text }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="spinner" style={{ width: size, height: size }} />
            {text && <span style={{ color: C.textSec, fontSize: 12 }}>{text}</span>}
        </div>
    );
}
