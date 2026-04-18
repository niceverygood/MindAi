import { useRef, useState, useEffect } from 'react';
import { C } from '../../constants';
import { Btn, Card } from '../UI';

// Web Speech API availability check
function getSpeechRecognition() {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function VoiceRecorder({ verbalization, onUpdate, drawingStartRef, label }) {
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef(verbalization?.transcript || '');
    const segmentsRef = useRef(verbalization?.segments || []);

    // Sync state when verbalization changes externally (e.g., session switch)
    useEffect(() => {
        transcriptRef.current = verbalization?.transcript || '';
        segmentsRef.current = verbalization?.segments || [];
    }, [verbalization]);

    const SR = getSpeechRecognition();

    const start = () => {
        if (!SR) {
            setError('이 브라우저는 음성인식을 지원하지 않습니다. Chrome 또는 Edge를 사용하세요.');
            return;
        }
        setError(null);
        const rec = new SR();
        rec.lang = 'ko-KR';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (e) => {
            let newInterim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const res = e.results[i];
                if (res.isFinal) {
                    const text = res[0].transcript.trim();
                    if (text) {
                        const ts = drawingStartRef?.current
                            ? Math.round((Date.now() - drawingStartRef.current) / 1000)
                            : null;
                        const segment = { text, atSec: ts, time: Date.now() };
                        segmentsRef.current = [...segmentsRef.current, segment];
                        transcriptRef.current = (transcriptRef.current + ' ' + text).trim();
                        onUpdate({
                            transcript: transcriptRef.current,
                            segments: segmentsRef.current,
                            recordedAt: new Date().toISOString(),
                        });
                    }
                } else {
                    newInterim += res[0].transcript;
                }
            }
            setInterim(newInterim);
        };

        rec.onerror = (e) => {
            if (e.error === 'no-speech') return;
            setError(`음성인식 오류: ${e.error}`);
            setListening(false);
        };

        rec.onend = () => {
            setInterim('');
            if (recognitionRef.current === rec && listening) {
                // Auto-restart (Chrome stops after ~60s idle)
                try { rec.start(); } catch { setListening(false); }
            }
        };

        try {
            rec.start();
            recognitionRef.current = rec;
            setListening(true);
        } catch (err) {
            setError(`녹음 시작 실패: ${err.message}`);
        }
    };

    const stop = () => {
        const rec = recognitionRef.current;
        setListening(false);
        if (rec) {
            try { rec.stop(); } catch { }
            recognitionRef.current = null;
        }
        setInterim('');
    };

    useEffect(() => () => stop(), []);

    const clearTranscript = () => {
        if (!window.confirm('기록된 환자 발화를 모두 삭제하시겠습니까?')) return;
        transcriptRef.current = '';
        segmentsRef.current = [];
        onUpdate({ transcript: '', segments: [], recordedAt: null });
    };

    const supported = !!SR;
    const segments = verbalization?.segments || [];

    return (
        <Card style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16 }}>🎙️</span>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>
                    환자 자발 발화 녹음 {label && <span style={{ color: C.textMut, fontWeight: 500 }}>· {label}</span>}
                </span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                    {listening && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            color: C.dangerText, fontSize: 11, fontWeight: 700,
                        }}>
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: C.dangerText,
                                animation: 'pulse 1.2s infinite',
                            }} />
                            녹음 중
                        </span>
                    )}
                    {!listening ? (
                        <Btn onClick={start} disabled={!supported} style={{ fontSize: 11, padding: '5px 12px' }}>
                            🎤 녹음 시작
                        </Btn>
                    ) : (
                        <Btn variant="danger" onClick={stop} style={{ fontSize: 11, padding: '5px 12px' }}>
                            ⏹ 정지
                        </Btn>
                    )}
                    {segments.length > 0 && (
                        <Btn variant="ghost" onClick={clearTranscript} style={{ fontSize: 10, padding: '4px 8px', color: C.dangerText }}>
                            🗑
                        </Btn>
                    )}
                </div>
            </div>

            {!supported && (
                <div style={{ background: C.warnBg, borderRadius: 8, padding: 10, fontSize: 11.5, color: C.warnText }}>
                    ⚠️ 이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome/Edge 또는 Safari 최신 버전에서 사용하세요.
                </div>
            )}

            {error && (
                <div style={{ background: C.dangerBg, borderRadius: 8, padding: 10, fontSize: 11.5, color: C.dangerText, marginBottom: 8 }}>
                    {error}
                </div>
            )}

            {supported && (
                <div style={{ fontSize: 11, color: C.textMut, lineHeight: 1.5, marginBottom: 8 }}>
                    환자가 그리면서 말하는 내용을 실시간 전사합니다. Buck은 자발 발화가 PDI보다 임상적 가치가 높다고 보고했습니다. 타임스탬프와 함께 저장되어 AI 분석·종합·종단 검토에 반영됩니다.
                </div>
            )}

            {/* Live interim transcript */}
            {listening && interim && (
                <div style={{
                    background: C.blueLight, borderRadius: 8, padding: 10,
                    fontSize: 13, color: C.blueDark, lineHeight: 1.6, marginBottom: 8,
                    fontStyle: 'italic',
                }}>
                    ... {interim}
                </div>
            )}

            {/* Final transcript with timestamps */}
            {segments.length > 0 ? (
                <div style={{
                    background: C.surface, borderRadius: 10, padding: 12,
                    maxHeight: 240, overflow: 'auto',
                }}>
                    {segments.map((s, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: 8, padding: '4px 0',
                            borderBottom: i < segments.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                        }}>
                            {s.atSec != null && (
                                <span style={{
                                    color: C.blue, fontSize: 10, fontFamily: 'monospace',
                                    fontWeight: 700, minWidth: 42, flexShrink: 0,
                                }}>
                                    {Math.floor(s.atSec / 60)}:{String(s.atSec % 60).padStart(2, '0')}
                                </span>
                            )}
                            <span style={{ color: C.text, fontSize: 12.5, lineHeight: 1.55 }}>{s.text}</span>
                        </div>
                    ))}
                </div>
            ) : (
                supported && !listening && (
                    <div style={{
                        background: C.surface, borderRadius: 8, padding: 16,
                        textAlign: 'center', color: C.textMut, fontSize: 11.5,
                    }}>
                        녹음 시작 버튼을 눌러 환자의 발화 기록을 시작하세요.
                    </div>
                )
            )}
        </Card>
    );
}
