import { useRef, useState, useEffect } from 'react';
import { C } from '../../constants';
import { Btn, Card } from '../UI';

// Compute total duration of a stroke sequence
function computeTimeline(strokes) {
    if (!strokes?.length) return { total: 0, events: [] };
    const t0 = strokes[0]?.points?.[0]?.time || 0;
    const events = [];
    strokes.forEach((s, si) => {
        s.points.forEach((p, pi) => {
            events.push({
                strokeIndex: si,
                pointIndex: pi,
                relTime: p.time - t0,
                x: p.x, y: p.y,
                tool: s.tool,
                width: s.width,
                isStrokeStart: pi === 0,
            });
        });
    });
    return {
        total: events[events.length - 1]?.relTime || 0,
        events,
        strokes,
    };
}

export default function StrokeReplay({ strokes, width = 560, height = 420, label }) {
    const cvRef = useRef(null);
    const rafRef = useRef(null);
    const startWallRef = useRef(null);
    const resumeOffsetRef = useRef(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [cursorTime, setCursorTime] = useState(0);
    const [timeline] = useState(() => computeTimeline(strokes));

    const totalMs = timeline.total || 0;

    const redraw = (timeMs) => {
        const cv = cvRef.current;
        if (!cv) return;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#FAFBFC';
        ctx.fillRect(0, 0, width, height);

        let lastStroke = -1;
        for (const e of timeline.events) {
            if (e.relTime > timeMs) break;
            ctx.strokeStyle = e.tool === 'eraser' ? '#FAFBFC' : '#111827';
            ctx.lineWidth = e.tool === 'eraser' ? 20 : (e.width || 3);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (e.strokeIndex !== lastStroke || e.isStrokeStart) {
                ctx.beginPath();
                ctx.moveTo(e.x, e.y);
                lastStroke = e.strokeIndex;
            } else {
                ctx.lineTo(e.x, e.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(e.x, e.y);
            }
        }
    };

    // Setup canvas + initial full draw
    useEffect(() => {
        const cv = cvRef.current;
        if (!cv) return;
        cv.width = width * 2;
        cv.height = height * 2;
        cv.getContext('2d').scale(2, 2);
        redraw(totalMs);
        setCursorTime(totalMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [strokes]);

    const tick = () => {
        const elapsed = (Date.now() - startWallRef.current) * speed + resumeOffsetRef.current;
        if (elapsed >= totalMs) {
            redraw(totalMs);
            setCursorTime(totalMs);
            setPlaying(false);
            rafRef.current = null;
            return;
        }
        redraw(elapsed);
        setCursorTime(elapsed);
        rafRef.current = requestAnimationFrame(tick);
    };

    const play = () => {
        if (playing) return;
        if (cursorTime >= totalMs) {
            resumeOffsetRef.current = 0;
        } else {
            resumeOffsetRef.current = cursorTime;
        }
        startWallRef.current = Date.now();
        setPlaying(true);
        rafRef.current = requestAnimationFrame(tick);
    };

    const pause = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setPlaying(false);
    };

    const reset = () => {
        pause();
        resumeOffsetRef.current = 0;
        setCursorTime(0);
        redraw(0);
    };

    const scrub = (ms) => {
        pause();
        resumeOffsetRef.current = ms;
        setCursorTime(ms);
        redraw(ms);
    };

    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

    // Find current stroke idx + pause before this point
    const currentStrokeIdx = (() => {
        let idx = -1;
        for (const e of timeline.events) {
            if (e.relTime > cursorTime) break;
            idx = e.strokeIndex;
        }
        return idx;
    })();

    // Total strokes, pauses detected
    const pauseCount = (() => {
        let c = 0;
        for (let i = 1; i < (timeline.strokes || []).length; i++) {
            const prev = timeline.strokes[i - 1];
            const curr = timeline.strokes[i];
            const gap = curr.points[0].time - prev.points[prev.points.length - 1].time;
            if (gap > 3000) c++;
        }
        return c;
    })();

    if (!strokes?.length) {
        return (
            <Card style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ color: C.textMut, fontSize: 12 }}>
                    리플레이 데이터 없음 — 이 버전 이전에 분석된 그림은 stroke 데이터가 저장되지 않았습니다.
                </div>
            </Card>
        );
    }

    return (
        <Card style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16 }}>🎬</span>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>
                    그리기 과정 리플레이 {label && <span style={{ color: C.textMut, fontWeight: 500 }}>· {label}</span>}
                </span>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: C.textSec }}>
                    획 {timeline.strokes?.length || 0} · 긴멈춤 {pauseCount} · 총 {Math.round(totalMs / 1000)}초
                </div>
            </div>

            <canvas ref={cvRef}
                style={{
                    width: '100%', maxWidth: width, aspectRatio: `${width} / ${height}`,
                    border: `1px solid ${C.border}`, borderRadius: 10,
                    display: 'block', background: '#FAFBFC',
                }}
            />

            <div style={{ marginTop: 10 }}>
                <input
                    type="range"
                    min="0" max={totalMs} step="20"
                    value={cursorTime}
                    onChange={e => scrub(Number(e.target.value))}
                    style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textMut, marginTop: 2 }}>
                    <span>{(cursorTime / 1000).toFixed(1)}s</span>
                    <span style={{ color: C.blue, fontWeight: 700 }}>획 #{currentStrokeIdx + 1} / {timeline.strokes?.length}</span>
                    <span>{(totalMs / 1000).toFixed(1)}s</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {!playing ? (
                    <Btn onClick={play} style={{ fontSize: 12, padding: '6px 14px' }}>▶ 재생</Btn>
                ) : (
                    <Btn variant="danger" onClick={pause} style={{ fontSize: 12, padding: '6px 14px' }}>⏸ 일시정지</Btn>
                )}
                <Btn variant="ghost" onClick={reset} style={{ fontSize: 11, padding: '5px 10px' }}>↺ 처음으로</Btn>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {[0.5, 1, 2, 4, 8].map(s => (
                        <button key={s}
                            onClick={() => setSpeed(s)}
                            style={{
                                background: speed === s ? C.blue : '#fff',
                                color: speed === s ? '#fff' : C.text,
                                border: `1px solid ${speed === s ? C.blue : C.border}`,
                                padding: '4px 10px', borderRadius: 14,
                                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            }}
                        >{s}×</button>
                    ))}
                </div>
            </div>
        </Card>
    );
}
