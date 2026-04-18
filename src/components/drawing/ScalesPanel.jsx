import { useState } from 'react';
import { C } from '../../constants';
import { Badge, Btn, Card } from '../UI';
import { SCALES, SCALE_ORDER, computeScore } from './scales';

function ScaleForm({ scale, initial, onSave, onClose }) {
    const [answers, setAnswers] = useState(() => {
        if (initial?.answers) return initial.answers;
        if (scale.mode === 'items') return new Array(scale.items.length).fill(null);
        if (scale.mode === 'yesno') return new Array(scale.items.length).fill(null);
        return initial?.score ?? '';
    });

    const completed = scale.mode === 'score_only'
        ? answers !== '' && answers !== null
        : answers.every(a => a !== null);
    const computed = completed ? computeScore(scale, answers) : null;

    const setIdx = (i, v) => {
        const a = [...answers];
        a[i] = v;
        setAnswers(a);
    };

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#fff', borderRadius: 16, padding: 24,
                width: '95%', maxWidth: 720, maxHeight: '90vh',
                overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                            {scale.name} <span style={{ color: C.textMut, fontSize: 12, fontWeight: 500 }}>· {scale.domain}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: C.textSec, marginTop: 2 }}>{scale.fullName}</div>
                    </div>
                    <button onClick={onClose} style={{
                        background: C.surface, border: 'none', width: 30, height: 30, borderRadius: 8,
                        fontSize: 15, cursor: 'pointer',
                    }}>✕</button>
                </div>

                {scale.instruction && (
                    <div style={{
                        background: C.blueLight, borderRadius: 10, padding: 12,
                        fontSize: 12.5, color: C.blueDark, lineHeight: 1.6, marginBottom: 16,
                    }}>
                        📋 {scale.instruction}
                    </div>
                )}

                {scale.mode === 'items' && (
                    <div style={{ display: 'grid', gap: 10 }}>
                        {scale.items.map((item, i) => {
                            const isCritical = scale.criticalItems?.includes(i);
                            return (
                                <div key={i} style={{
                                    background: isCritical ? C.dangerBg : C.surface,
                                    border: isCritical ? `1px solid ${C.dangerText}40` : 'none',
                                    borderRadius: 10, padding: 12,
                                }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        <span style={{
                                            background: isCritical ? C.dangerText : C.blue, color: '#fff',
                                            width: 22, height: 22, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                                        }}>{i + 1}</span>
                                        <span style={{ color: C.text, fontSize: 13, lineHeight: 1.55, fontWeight: 500 }}>
                                            {item}
                                            {isCritical && <span style={{ color: C.dangerText, fontSize: 10, marginLeft: 4, fontWeight: 700 }}>⚠️ 위험 문항</span>}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 30 }}>
                                        {scale.options.map(opt => (
                                            <button key={opt.value}
                                                onClick={() => setIdx(i, opt.value)}
                                                style={{
                                                    background: answers[i] === opt.value ? C.blue : '#fff',
                                                    color: answers[i] === opt.value ? '#fff' : C.text,
                                                    border: `1.5px solid ${answers[i] === opt.value ? C.blue : C.border}`,
                                                    padding: '6px 12px', borderRadius: 16,
                                                    fontSize: 11.5, fontWeight: 600,
                                                    cursor: 'pointer', transition: 'all .15s',
                                                }}
                                            >
                                                {opt.label} <span style={{ opacity: .7, marginLeft: 2 }}>({opt.value})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {scale.mode === 'yesno' && (
                    <div style={{ display: 'grid', gap: 8 }}>
                        {scale.items.map((item, i) => (
                            <div key={i} style={{
                                background: answers[i] === 'yes' ? C.dangerBg : C.surface,
                                borderLeft: `3px solid ${answers[i] === 'yes' ? C.dangerText : C.border}`,
                                borderRadius: 8, padding: 12,
                            }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <span style={{
                                        background: answers[i] === 'yes' ? C.dangerText : C.blue, color: '#fff',
                                        width: 22, height: 22, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                                    }}>{i + 1}</span>
                                    <span style={{ flex: 1, color: C.text, fontSize: 12.5, lineHeight: 1.5 }}>
                                        {item.text}
                                        {item.lifetime && <span style={{ color: C.warnText, fontSize: 10, marginLeft: 4, fontWeight: 700 }}>[평생]</span>}
                                    </span>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {['yes', 'no'].map(val => (
                                            <button key={val}
                                                onClick={() => setIdx(i, val)}
                                                style={{
                                                    background: answers[i] === val
                                                        ? (val === 'yes' ? C.dangerText : C.successText)
                                                        : '#fff',
                                                    color: answers[i] === val ? '#fff' : C.text,
                                                    border: `1.5px solid ${answers[i] === val
                                                        ? (val === 'yes' ? C.dangerText : C.successText)
                                                        : C.border}`,
                                                    padding: '5px 14px', borderRadius: 16,
                                                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                    minWidth: 48,
                                                }}
                                            >{val === 'yes' ? '예' : '아니오'}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {scale.mode === 'score_only' && (
                    <div style={{ background: C.surface, borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 8 }}>
                            외부에서 시행한 {scale.name} 총점을 입력하세요. (범위: 0 - {scale.maxScore})
                        </div>
                        <input
                            type="number"
                            min="0" max={scale.maxScore}
                            placeholder={`총점 입력 (0-${scale.maxScore})`}
                            value={answers}
                            onChange={e => setAnswers(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px',
                                fontSize: 16, fontWeight: 700,
                                border: `2px solid ${C.border}`, borderRadius: 10,
                                textAlign: 'center', fontFamily: 'monospace',
                            }}
                        />
                    </div>
                )}

                {/* Live result */}
                {computed && (
                    <div style={{
                        marginTop: 16, padding: 14,
                        background: computed.variant === 'danger' ? C.dangerBg
                            : computed.variant === 'warn' ? C.warnBg
                                : computed.variant === 'success' ? C.successBg : C.blueLight,
                        borderRadius: 12,
                        border: `1.5px solid ${computed.variant === 'danger' ? C.dangerText
                            : computed.variant === 'warn' ? C.warnText
                                : computed.variant === 'success' ? C.successText : C.blue}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 20 }}>
                                {computed.variant === 'danger' ? '🚨' : computed.variant === 'warn' ? '⚠️' : computed.variant === 'success' ? '✅' : 'ℹ️'}
                            </span>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                                    {scale.mode === 'yesno' ? `자살위험 ${computed.severity}` : `${computed.score}점 / ${computed.max}점 · ${computed.severity}`}
                                </div>
                                {computed.criticalFlag && (
                                    <div style={{ fontSize: 11, color: C.dangerText, fontWeight: 700, marginTop: 2 }}>
                                        ⚠️ 자살 문항(9번)에서 양성 응답 — 즉시 C-SSRS 재평가 권고
                                    </div>
                                )}
                            </div>
                        </div>
                        {computed.message && (
                            <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5, marginLeft: 30 }}>
                                {computed.message}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
                    <Btn variant="ghost" onClick={onClose} style={{ fontSize: 12 }}>취소</Btn>
                    <Btn
                        onClick={() => {
                            if (!completed || !computed) return;
                            onSave({
                                answers,
                                score: computed.score,
                                severity: computed.severity,
                                variant: computed.variant,
                                max: computed.max,
                                criticalFlag: computed.criticalFlag,
                                message: computed.message,
                                date: new Date().toISOString(),
                            });
                        }}
                        disabled={!completed}
                        style={{ fontSize: 12 }}
                    >💾 저장</Btn>
                </div>
            </div>
        </div>
    );
}

export default function ScalesPanel({ scales = {}, onUpdate, m }) {
    const [openId, setOpenId] = useState(null);
    const open = openId ? SCALES[openId] : null;

    const saveScale = (id, data) => {
        onUpdate(prev => ({ ...prev, [id]: data }));
        setOpenId(null);
    };

    const deleteScale = (id) => {
        if (!window.confirm(`${SCALES[id]?.name} 결과를 삭제하시겠습니까?`)) return;
        onUpdate(prev => {
            const n = { ...prev };
            delete n[id];
            return n;
        });
    };

    const criticalFindings = [];
    for (const id of Object.keys(scales)) {
        const s = scales[id];
        const meta = SCALES[id];
        if (!s || !meta) continue;
        if (s.criticalFlag) criticalFindings.push(`${meta.name} 9번(자살문항) 양성`);
        if (id === 'cssrs' && (s.severity === '높음' || s.severity === '중등도')) {
            criticalFindings.push(`C-SSRS ${s.severity} 위험`);
        }
    }

    return (
        <div>
            {criticalFindings.length > 0 && (
                <div style={{
                    background: C.dangerBg, border: `1.5px solid ${C.dangerText}`,
                    borderRadius: 10, padding: 12, marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <span style={{ fontSize: 18 }}>🚨</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: C.dangerText, fontSize: 12, fontWeight: 800 }}>척도 경고 신호 감지</div>
                        <div style={{ color: C.text, fontSize: 11.5, marginTop: 2 }}>
                            {criticalFindings.join(' · ')} — HTP 위험평가와 교차 검증 필요
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 8 }}>
                {SCALE_ORDER.map(id => {
                    const scale = SCALES[id];
                    const result = scales[id];
                    const filled = !!result;
                    return (
                        <div key={id} style={{
                            background: filled ? C.blueLight : C.surface,
                            border: `1.5px solid ${filled ? C.blue : C.border}`,
                            borderRadius: 10, padding: 12,
                            display: 'flex', alignItems: 'center', gap: 10,
                            cursor: 'pointer', transition: 'all .15s',
                        }}
                            onClick={() => setOpenId(id)}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <span style={{ color: C.text, fontWeight: 800, fontSize: 13 }}>{scale.name}</span>
                                    <span style={{ color: C.textMut, fontSize: 10 }}>· {scale.domain}</span>
                                </div>
                                {filled ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                        <Badge
                                            text={scale.mode === 'yesno' ? result.severity : `${result.score}점 · ${result.severity}`}
                                            variant={result.variant}
                                        />
                                        {result.criticalFlag && <Badge text="⚠️ 자살문항" variant="danger" />}
                                    </div>
                                ) : (
                                    <div style={{ color: C.textMut, fontSize: 11 }}>{scale.fullName.replace(scale.name, '').replace(/^[\s(]+|[)\s]+$/g, '')} · 미시행</div>
                                )}
                            </div>
                            {filled ? (
                                <button
                                    onClick={e => { e.stopPropagation(); deleteScale(id); }}
                                    style={{ background: 'none', border: 'none', fontSize: 14, color: C.textMut, cursor: 'pointer' }}
                                    title="삭제"
                                >✕</button>
                            ) : (
                                <span style={{ color: C.blue, fontSize: 11, fontWeight: 700 }}>시행 →</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {open && (
                <ScaleForm
                    scale={open}
                    initial={scales[openId]}
                    onClose={() => setOpenId(null)}
                    onSave={(data) => saveScale(openId, data)}
                />
            )}
        </div>
    );
}
