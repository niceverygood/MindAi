import { useState, useEffect, useRef } from 'react';
import { Badge, Btn, Card } from './UI';
import { C, childGames } from '../constants';
import { useMobile } from '../hooks';

export default function ChildAssess() {
    const m = useMobile();
    const [ag, setAg] = useState(null);

    /* ═══════ Shared Result Component ═══════ */
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

    const Header = ({ icon, title, children }) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 20px', gap: 8 }}>
            <h2 style={{ color: C.text, fontSize: m ? 18 : 20, fontWeight: 700, margin: 0 }}>{icon} {title}</h2>
            {children}
        </div>
    );

    /* ═══════ 1. Memory Game (기억력 게임) ═══════ */
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

    /* ═══════ 2. Mole Game (두더지 잡기) ═══════ */
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

    /* ═══════ 3. Pattern Finding (패턴 찾기) ═══════ */
    const [patRound, setPatRound] = useState(0);
    const [patScore, setPatScore] = useState(0);
    const [patTotal, setPatTotal] = useState(5);
    const [patDone, setPatDone] = useState(false);
    const [patQ, setPatQ] = useState(null);
    const [patFeedback, setPatFeedback] = useState(null);
    const [patTimes, setPatTimes] = useState([]);
    const patStart = useRef(null);

    const patternSets = [
        { seq: ['🔴', '🔵', '🔴', '🔵', '🔴'], ans: '🔵', opts: ['🔴', '🔵', '🟢', '🟡'] },
        { seq: ['⭐', '⭐', '🌙', '⭐', '⭐'], ans: '🌙', opts: ['⭐', '🌙', '☀️', '🌈'] },
        { seq: ['1', '2', '3', '4'], ans: '5', opts: ['5', '6', '3', '8'] },
        { seq: ['🐶', '🐱', '🐶', '🐱', '🐶'], ans: '🐱', opts: ['🐶', '🐱', '🐸', '🐰'] },
        { seq: ['▲', '■', '●', '▲', '■'], ans: '●', opts: ['▲', '■', '●', '★'] },
        { seq: ['2', '4', '6', '8'], ans: '10', opts: ['9', '10', '11', '12'] },
        { seq: ['🍎', '🍊', '🍎', '🍊'], ans: '🍎', opts: ['🍎', '🍊', '🍋', '🍇'] },
        { seq: ['A', 'B', 'C', 'D'], ans: 'E', opts: ['E', 'F', 'B', 'Z'] },
    ];

    const startPattern = () => {
        setPatRound(0); setPatScore(0); setPatDone(false); setPatFeedback(null); setPatTimes([]);
        nextPattern(0); setAg('pattern');
    };

    const nextPattern = (round) => {
        const available = [...patternSets].sort(() => Math.random() - .5);
        setPatQ(available[round % available.length]);
        patStart.current = Date.now();
        setPatFeedback(null);
    };

    const answerPattern = (chosen) => {
        const time = Date.now() - patStart.current;
        setPatTimes(p => [...p, time]);
        const correct = chosen === patQ.ans;
        if (correct) setPatScore(s => s + 1);
        setPatFeedback(correct ? '✅ 정답!' : `❌ 오답 (정답: ${patQ.ans})`);
        setTimeout(() => {
            const next = patRound + 1;
            if (next >= patTotal) {
                setPatDone(true); setPatRound(next);
            } else {
                setPatRound(next); nextPattern(next);
            }
        }, 1200);
    };

    /* ═══════ 4. Story Making (이야기 만들기) ═══════ */
    const [storyCards, setStoryCards] = useState([]);
    const [storyOrder, setStoryOrder] = useState([]);
    const [storyDone, setStoryDone] = useState(false);
    const [storyStart, setStoryStart] = useState(null);

    const stories = [
        { cards: ['🌅 아침에 일어남', '🪥 양치질을 함', '🥣 아침을 먹음', '🎒 가방을 멤'], correct: [0, 1, 2, 3] },
        { cards: ['🌧️ 비가 옴', '☂️ 우산을 가져감', '🚶 밖으로 나감', '🏫 학교에 도착'], correct: [0, 1, 2, 3] },
        { cards: ['🥚 달걀을 꺼냄', '🍳 프라이팬을 올림', '🔥 불을 켬', '🍽️ 접시에 담음'], correct: [2, 1, 0, 3] },
        { cards: ['🌱 씨앗을 심음', '💧 물을 줌', '🌿 싹이 남', '🌻 꽃이 핌'], correct: [0, 1, 2, 3] },
    ];

    const startStory = () => {
        const st = stories[Math.floor(Math.random() * stories.length)];
        const shuffled = st.cards.map((c, i) => ({ text: c, origIdx: i })).sort(() => Math.random() - .5);
        setStoryCards(shuffled);
        setStoryOrder([]);
        setStoryDone(false);
        setStoryStart(Date.now());
        setAg('story');
    };

    const pickStoryCard = (idx) => {
        if (storyOrder.includes(idx) || storyDone) return;
        const next = [...storyOrder, idx];
        setStoryOrder(next);
        if (next.length === storyCards.length) {
            setStoryDone(true);
        }
    };

    const getStoryScore = () => {
        if (!storyDone) return 0;
        let score = 0;
        for (let i = 0; i < storyOrder.length; i++) {
            if (storyCards[storyOrder[i]].origIdx === i) score++;
        }
        return score;
    };

    /* ═══════ 5. Maze (미로 탈출) ═══════ */
    const [mazeGrid, setMazeGrid] = useState([]);
    const [mazePos, setMazePos] = useState({ r: 0, c: 0 });
    const [mazeDone, setMazeDone] = useState(false);
    const [mazeMoves, setMazeMoves] = useState(0);
    const [mazeStart, setMazeStart] = useState(null);
    const mazeSize = 7;
    const mazeGoal = { r: 6, c: 6 };

    const generateMaze = () => {
        // Simple maze: 0=path, 1=wall
        const g = Array(mazeSize).fill(null).map(() => Array(mazeSize).fill(1));
        // Guaranteed path via DFS-like approach
        const stack = [{ r: 0, c: 0 }];
        g[0][0] = 0;
        while (stack.length > 0) {
            const cur = stack[stack.length - 1];
            const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]].filter(([dr, dc]) => {
                const nr = cur.r + dr, nc = cur.c + dc;
                return nr >= 0 && nr < mazeSize && nc >= 0 && nc < mazeSize && g[nr][nc] === 1;
            });
            if (dirs.length === 0) { stack.pop(); continue; }
            const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
            g[cur.r + dr / 2][cur.c + dc / 2] = 0;
            g[cur.r + dr][cur.c + dc] = 0;
            stack.push({ r: cur.r + dr, c: cur.c + dc });
        }
        g[mazeGoal.r][mazeGoal.c] = 0;
        // Ensure goal is reachable: open a path if needed
        g[mazeGoal.r - 1][mazeGoal.c] = 0;
        g[mazeGoal.r][mazeGoal.c - 1] = 0;
        return g;
    };

    const startMaze = () => {
        setMazeGrid(generateMaze());
        setMazePos({ r: 0, c: 0 });
        setMazeDone(false);
        setMazeMoves(0);
        setMazeStart(Date.now());
        setAg('maze');
    };

    const moveMaze = (dr, dc) => {
        if (mazeDone) return;
        const nr = mazePos.r + dr, nc = mazePos.c + dc;
        if (nr < 0 || nr >= mazeSize || nc < 0 || nc >= mazeSize) return;
        if (mazeGrid[nr][nc] === 1) return;
        setMazePos({ r: nr, c: nc });
        setMazeMoves(m => m + 1);
        if (nr === mazeGoal.r && nc === mazeGoal.c) setMazeDone(true);
    };

    // Keyboard maze control
    useEffect(() => {
        if (ag !== 'maze' || mazeDone) return;
        const handler = (e) => {
            if (e.key === 'ArrowUp') moveMaze(-1, 0);
            else if (e.key === 'ArrowDown') moveMaze(1, 0);
            else if (e.key === 'ArrowLeft') moveMaze(0, -1);
            else if (e.key === 'ArrowRight') moveMaze(0, 1);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [ag, mazePos, mazeDone, mazeGrid]);

    /* ═══════ 6. Emotion Recognition (감정 알아맞히기) ═══════ */
    const [emoRound, setEmoRound] = useState(0);
    const [emoScore, setEmoScore] = useState(0);
    const [emoTotal] = useState(6);
    const [emoDone, setEmoDone] = useState(false);
    const [emoFeedback, setEmoFeedback] = useState(null);
    const [emoTimes, setEmoTimes] = useState([]);
    const emoStart = useRef(null);

    const emotions = [
        { face: '😊', answer: '기쁨', options: ['기쁨', '슬픔', '분노', '놀람'] },
        { face: '😢', answer: '슬픔', options: ['기쁨', '슬픔', '무서움', '지루함'] },
        { face: '😠', answer: '분노', options: ['놀람', '기쁨', '분노', '슬픔'] },
        { face: '😨', answer: '무서움', options: ['분노', '무서움', '기쁨', '놀람'] },
        { face: '😲', answer: '놀람', options: ['슬픔', '분노', '놀람', '기쁨'] },
        { face: '😐', answer: '무표정', options: ['무표정', '슬픔', '지루함', '기쁨'] },
        { face: '🥰', answer: '사랑', options: ['기쁨', '사랑', '놀람', '부끄러움'] },
        { face: '😤', answer: '짜증', options: ['분노', '짜증', '슬픔', '놀람'] },
    ];

    const startEmo = () => {
        setEmoRound(0); setEmoScore(0); setEmoDone(false); setEmoFeedback(null); setEmoTimes([]);
        emoStart.current = Date.now(); setAg('emotion');
    };

    const answerEmo = (chosen) => {
        const time = Date.now() - emoStart.current;
        setEmoTimes(p => [...p, time]);
        const currentEmo = emotions[emoRound % emotions.length];
        const correct = chosen === currentEmo.answer;
        if (correct) setEmoScore(s => s + 1);
        setEmoFeedback(correct ? '✅ 정답!' : `❌ 정답은 "${currentEmo.answer}"`);
        emoStart.current = Date.now();
        setTimeout(() => {
            const next = emoRound + 1;
            if (next >= emoTotal) {
                setEmoDone(true); setEmoRound(next);
            } else {
                setEmoRound(next); setEmoFeedback(null);
            }
        }, 1000);
    };

    /* ═══════ Cleanup ═══════ */
    useEffect(() => () => { clearInterval(mir.current); clearInterval(tr.current); }, []);
    const amr = mr.length > 0 ? Math.round(mr.reduce((a, b) => a + b, 0) / mr.length) : 0;

    /* ═══════ RENDERS ═══════ */

    // 1. Memory Game
    if (ag === 'memory') {
        const tt = gc ? Math.round((Date.now() - gst) / 1000) : null;
        const ar = rt.length > 0 ? Math.round(rt.reduce((a, b) => a + b, 0) / rt.length) : 0;
        return (
            <div className="slide-up">
                <Btn variant="ghost" onClick={() => setAg(null)}>← 목록</Btn>
                <Header icon="🧩" title="기억력 게임">
                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ textAlign: 'center' }}><div style={{ color: C.textMut, fontSize: 10 }}>시도</div><div style={{ color: C.blue, fontSize: 20, fontWeight: 700 }}>{mv}</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ color: C.textMut, fontSize: 10 }}>매칭</div><div style={{ color: C.successText, fontSize: 20, fontWeight: 700 }}>{mt.length / 2}/{ej.length}</div></div>
                    </div>
                </Header>
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
                                fontSize: m ? 28 : 34, cursor: 'pointer', userSelect: 'none', transition: 'all .2s ease',
                            }}>{sh ? c.emoji : <span style={{ color: C.textMut }}>?</span>}</div>
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
                        note={`작업기억 ${mv}회 시도, 평균 반응시간 ${ar}ms. ${mv <= 10 ? '체계적 탐색 전략 사용, 작업기억 양호.' : '시행착오적 접근, 계획능력 지원 권장.'}`}
                    />
                    <Btn onClick={startMem} style={{ marginTop: 12 }}>다시하기</Btn>
                </>}
            </div>
        );
    }

    // 2. Mole Game
    if (ag === 'speed') {
        return (
            <div className="slide-up">
                <Btn variant="ghost" onClick={() => { setAg(null); setMa(false); clearInterval(mir.current); clearInterval(tr.current); }}>← 목록</Btn>
                <Header icon="⚡" title="두더지 잡기">
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ color: C.textMut, fontSize: 10 }}>점수</div><div style={{ color: C.blue, fontSize: 20, fontWeight: 700 }}>{ms}</div></div>
                        <div style={{ background: mti <= 5 ? C.dangerBg : C.blueLight, color: mti <= 5 ? C.dangerText : C.blue, padding: '5px 12px', borderRadius: 8, fontWeight: 700, fontSize: 17, fontFamily: 'monospace' }}>{mti}초</div>
                    </div>
                </Header>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: m ? 8 : 12, maxWidth: 320, margin: '0 auto' }}>
                    {moles.map((a, i) => (
                        <div key={i} onClick={() => hitM(i)} style={{
                            aspectRatio: '1', borderRadius: 16,
                            background: a ? C.blueLight : C.surface, border: `2px solid ${a ? C.blue : C.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: m ? 32 : 38, cursor: ma ? 'pointer' : 'default',
                            transform: a ? 'scale(1.05)' : 'scale(1)', transition: 'all .15s ease', userSelect: 'none',
                        }}>{a ? '🐹' : '🕳️'}</div>
                    ))}
                </div>
                {!ma && mti === 0 && <>
                    <Res metrics={[{ l: '적중률', v: `${ms}/10` }, { l: '반응속도', v: `${amr}ms` }, { l: '주의', v: ms >= 7 ? '양호' : ms >= 4 ? '보통' : '저하' }]}
                        note={`적중 ${ms}/10, 평균 반응속도 ${amr}ms. ${amr < 500 ? '높은 각성 수준과 빠른 운동 반응.' : amr < 800 ? '또래 평균 수준의 반응속도.' : '선택적 주의력 정밀 평가 권장.'}`}
                    />
                    <Btn onClick={startMole} style={{ marginTop: 12 }}>다시하기</Btn>
                </>}
                {!ma && mti > 0 && <div style={{ textAlign: 'center', marginTop: 24 }}><Btn onClick={startMole}>게임 시작!</Btn></div>}
            </div>
        );
    }

    // 3. Pattern Finding
    if (ag === 'pattern') {
        const avgPT = patTimes.length > 0 ? Math.round(patTimes.reduce((a, b) => a + b, 0) / patTimes.length) : 0;
        const currentQ = patQ || patternSets[0];
        return (
            <div className="slide-up">
                <Btn variant="ghost" onClick={() => setAg(null)}>← 목록</Btn>
                <Header icon="💎" title="패턴 찾기">
                    <div style={{ display: 'flex', gap: 14 }}>
                        <div style={{ textAlign: 'center' }}><div style={{ color: C.textMut, fontSize: 10 }}>문제</div><div style={{ color: C.blue, fontSize: 20, fontWeight: 700 }}>{Math.min(patRound + 1, patTotal)}/{patTotal}</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ color: C.textMut, fontSize: 10 }}>정답</div><div style={{ color: C.successText, fontSize: 20, fontWeight: 700 }}>{patScore}</div></div>
                    </div>
                </Header>
                {!patDone ? (
                    <div>
                        <Card style={{ padding: m ? 20 : 30, textAlign: 'center', marginBottom: 16 }}>
                            <div style={{ color: C.textSec, fontSize: 12, marginBottom: 12 }}>다음에 올 것은?</div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: m ? 10 : 16, flexWrap: 'wrap', marginBottom: 16 }}>
                                {currentQ.seq.map((s, i) => (
                                    <div key={i} style={{
                                        width: m ? 44 : 56, height: m ? 44 : 56, borderRadius: 12,
                                        background: C.blueLight, border: `2px solid ${C.blueMid}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: m ? 20 : 26, fontWeight: 700,
                                    }}>{s}</div>
                                ))}
                                <div style={{
                                    width: m ? 44 : 56, height: m ? 44 : 56, borderRadius: 12,
                                    background: C.warnBg, border: `2px dashed ${C.warnText}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: m ? 20 : 26, color: C.warnText, fontWeight: 700,
                                }}>?</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                                {currentQ.opts.map((o, i) => (
                                    <button key={i} onClick={() => answerPattern(o)} disabled={!!patFeedback} style={{
                                        width: m ? 56 : 68, height: m ? 56 : 68, borderRadius: 14,
                                        background: C.bg, border: `2px solid ${C.border}`,
                                        fontSize: m ? 22 : 28, cursor: patFeedback ? 'default' : 'pointer',
                                        fontWeight: 700, transition: 'all .15s',
                                    }}>{o}</button>
                                ))}
                            </div>
                            {patFeedback && (
                                <div style={{ marginTop: 12, color: patFeedback.startsWith('✅') ? C.successText : C.dangerText, fontWeight: 600, fontSize: 14 }}>{patFeedback}</div>
                            )}
                        </Card>
                    </div>
                ) : (
                    <>
                        <Res
                            metrics={[
                                { l: '정답률', v: `${patScore}/${patTotal}`, n: patScore >= 4 ? '우수' : patScore >= 3 ? '양호' : '평가필요' },
                                { l: '반응시간', v: `${(avgPT / 1000).toFixed(1)}초`, n: avgPT < 5000 ? '빠름' : '느림' },
                                { l: '유동추론', v: patScore >= 4 ? '상위' : patScore >= 3 ? '보통' : '하위' },
                            ]}
                            note={`규칙 인식 ${patScore}/${patTotal}문제 정답, 평균 반응시간 ${(avgPT / 1000).toFixed(1)}초. ${patScore >= 4 ? '패턴 인식과 귀납추론 능력 양호. 규칙성을 빠르게 파악하며 유동추론 수준 정상.' : patScore >= 3 ? '기본적 패턴 인식 가능하나 복잡한 규칙에서 어려움. 추가 유동추론 평가 권장.' : '규칙 발견에 어려움을 보임. 유동추론 및 인지적 유연성에 대한 정밀 평가 필요.'}`}
                        />
                        <Btn onClick={startPattern} style={{ marginTop: 12 }}>다시하기</Btn>
                    </>
                )}
            </div>
        );
    }

    // 4. Story Making
    if (ag === 'story') {
        const score = getStoryScore();
        const elapsed = storyDone && storyStart ? Math.round((Date.now() - storyStart) / 1000) : 0;
        return (
            <div className="slide-up">
                <Btn variant="ghost" onClick={() => setAg(null)}>← 목록</Btn>
                <Header icon="📖" title="이야기 만들기">
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: C.textMut, fontSize: 10 }}>선택</div>
                        <div style={{ color: C.blue, fontSize: 20, fontWeight: 700 }}>{storyOrder.length}/{storyCards.length}</div>
                    </div>
                </Header>
                <Card style={{ padding: m ? 16 : 24, textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ color: C.textSec, fontSize: 12, marginBottom: 14 }}>그림 카드를 올바른 순서대로 클릭하세요</div>

                    {/* Selected order */}
                    {storyOrder.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                            {storyOrder.map((idx, pos) => (
                                <div key={pos} style={{
                                    padding: '8px 14px', borderRadius: 10,
                                    background: C.blueLight, border: `2px solid ${C.blue}`,
                                    fontSize: 13, fontWeight: 600, color: C.blue,
                                }}>
                                    {pos + 1}. {storyCards[idx].text}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Available cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 10 }}>
                        {storyCards.map((card, idx) => {
                            const picked = storyOrder.includes(idx);
                            return (
                                <button key={idx} onClick={() => pickStoryCard(idx)} disabled={picked || storyDone} style={{
                                    padding: '14px 18px', borderRadius: 12,
                                    background: picked ? C.surface : C.bg,
                                    border: `2px solid ${picked ? C.borderLight : C.border}`,
                                    fontSize: m ? 16 : 18, cursor: picked ? 'default' : 'pointer',
                                    opacity: picked ? 0.4 : 1, transition: 'all .15s',
                                    textAlign: 'left', color: C.text, fontWeight: 500,
                                }}>{card.text}</button>
                            );
                        })}
                    </div>

                    {!storyDone && storyOrder.length > 0 && (
                        <Btn variant="ghost" onClick={() => setStoryOrder([])} style={{ marginTop: 12, fontSize: 11 }}>🔄 다시 선택</Btn>
                    )}
                </Card>
                {storyDone && (
                    <>
                        <Res
                            metrics={[
                                { l: '순서정확', v: `${score}/${storyCards.length}`, n: score === storyCards.length ? '완벽' : '부분' },
                                { l: '소요시간', v: `${elapsed}초` },
                                { l: '언어/정서', v: score >= 3 ? '양호' : '평가필요' },
                            ]}
                            note={`이야기 순서 구성 ${score}/${storyCards.length} 정확. ${score === storyCards.length ? '시간적 순서 개념과 인과관계 이해 양호. 서사 구성 능력이 또래 수준.' : score >= 2 ? '기본적 시간순서 이해 가능하나 세부 인과관계에서 혼동. 언어 표현 및 이해도 추가 평가 권장.' : '시간적 순서화에 어려움을 보임. 실행기능 및 작업기억에 대한 정밀 평가 필요.'}`}
                        />
                        <Btn onClick={startStory} style={{ marginTop: 12 }}>다시하기</Btn>
                    </>
                )}
            </div>
        );
    }

    // 5. Maze
    if (ag === 'maze') {
        const elapsed = mazeDone && mazeStart ? Math.round((Date.now() - mazeStart) / 1000) : 0;
        return (
            <div className="slide-up">
                <Btn variant="ghost" onClick={() => setAg(null)}>← 목록</Btn>
                <Header icon="🏰" title="미로 탈출">
                    <div style={{ display: 'flex', gap: 14 }}>
                        <div style={{ textAlign: 'center' }}><div style={{ color: C.textMut, fontSize: 10 }}>이동</div><div style={{ color: C.blue, fontSize: 20, fontWeight: 700 }}>{mazeMoves}</div></div>
                    </div>
                </Header>

                {/* Maze grid */}
                <div style={{ maxWidth: m ? 280 : 350, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mazeSize},1fr)`, gap: 2, marginBottom: 16 }}>
                        {mazeGrid.map((row, r) => row.map((cell, c) => {
                            const isPlayer = mazePos.r === r && mazePos.c === c;
                            const isGoal = r === mazeGoal.r && c === mazeGoal.c;
                            return (
                                <div key={`${r}-${c}`} onClick={() => {
                                    // Allow tap-to-move: move towards clicked cell
                                    if (cell === 1 || mazeDone) return;
                                    const dr = r - mazePos.r, dc = c - mazePos.c;
                                    if (Math.abs(dr) + Math.abs(dc) === 1) moveMaze(dr, dc);
                                }} style={{
                                    aspectRatio: '1', borderRadius: 4,
                                    background: cell === 1 ? '#1E293B' : isPlayer ? C.blue : isGoal ? C.successText : '#F1F5F9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: m ? 14 : 18, cursor: cell === 0 ? 'pointer' : 'default',
                                    border: isGoal && !isPlayer ? `2px solid ${C.successText}` : 'none',
                                    transition: 'background .15s',
                                }}>
                                    {isPlayer ? '😊' : isGoal ? '🏁' : ''}
                                </div>
                            );
                        }))}
                    </div>

                    {/* Direction buttons for mobile */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                        <Btn variant="secondary" onClick={() => moveMaze(-1, 0)} style={{ padding: '10px 20px' }}>↑</Btn>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Btn variant="secondary" onClick={() => moveMaze(0, -1)} style={{ padding: '10px 20px' }}>←</Btn>
                            <Btn variant="secondary" onClick={() => moveMaze(1, 0)} style={{ padding: '10px 20px' }}>↓</Btn>
                            <Btn variant="secondary" onClick={() => moveMaze(0, 1)} style={{ padding: '10px 20px' }}>→</Btn>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', color: C.textMut, fontSize: 10 }}>방향키 또는 버튼으로 이동 · 인접 칸 클릭</div>
                </div>

                {mazeDone && (
                    <>
                        <Res
                            metrics={[
                                { l: '이동 횟수', v: `${mazeMoves}`, n: mazeMoves <= 20 ? '효율적' : mazeMoves <= 35 ? '보통' : '탐색적' },
                                { l: '소요시간', v: `${elapsed}초` },
                                { l: '시공간', v: mazeMoves <= 25 ? '양호' : '평가필요' },
                            ]}
                            note={`미로 탈출 ${mazeMoves}회 이동, ${elapsed}초 소요. ${mazeMoves <= 20 ? '효율적인 경로 탐색, 시공간 처리와 계획능력 정상.' : mazeMoves <= 35 ? '시행착오를 통한 탐색. 계획능력은 있으나 충동적 반응 경향.' : '많은 이동 횟수는 시공간 처리 또는 실행기능 저하를 시사할 수 있음. 추가 평가 권장.'}`}
                        />
                        <Btn onClick={startMaze} style={{ marginTop: 12 }}>다시하기</Btn>
                    </>
                )}
            </div>
        );
    }

    // 6. Emotion Recognition
    if (ag === 'emotion') {
        const avgET = emoTimes.length > 0 ? Math.round(emoTimes.reduce((a, b) => a + b, 0) / emoTimes.length) : 0;
        const currentEmo = emotions[emoRound % emotions.length];
        return (
            <div className="slide-up">
                <Btn variant="ghost" onClick={() => setAg(null)}>← 목록</Btn>
                <Header icon="😊" title="감정 알아맞히기">
                    <div style={{ display: 'flex', gap: 14 }}>
                        <div style={{ textAlign: 'center' }}><div style={{ color: C.textMut, fontSize: 10 }}>문제</div><div style={{ color: C.blue, fontSize: 20, fontWeight: 700 }}>{Math.min(emoRound + 1, emoTotal)}/{emoTotal}</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ color: C.textMut, fontSize: 10 }}>정답</div><div style={{ color: C.successText, fontSize: 20, fontWeight: 700 }}>{emoScore}</div></div>
                    </div>
                </Header>
                {!emoDone ? (
                    <Card style={{ padding: m ? 24 : 40, textAlign: 'center' }}>
                        <div style={{ color: C.textSec, fontSize: 12, marginBottom: 16 }}>이 표정은 어떤 감정일까요?</div>
                        <div style={{
                            fontSize: m ? 72 : 100, lineHeight: 1, marginBottom: 20,
                            animation: 'fadeIn .3s ease',
                        }}>{currentEmo.face}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 300, margin: '0 auto' }}>
                            {currentEmo.options.map((opt, i) => (
                                <button key={i} onClick={() => answerEmo(opt)} disabled={!!emoFeedback} style={{
                                    padding: '14px 10px', borderRadius: 12,
                                    background: C.bg, border: `2px solid ${C.border}`,
                                    fontSize: m ? 15 : 17, fontWeight: 600, cursor: emoFeedback ? 'default' : 'pointer',
                                    color: C.text, transition: 'all .15s',
                                }}>{opt}</button>
                            ))}
                        </div>
                        {emoFeedback && (
                            <div style={{ marginTop: 14, color: emoFeedback.startsWith('✅') ? C.successText : C.dangerText, fontWeight: 600, fontSize: 15 }}>{emoFeedback}</div>
                        )}
                    </Card>
                ) : (
                    <>
                        <Res
                            metrics={[
                                { l: '정답률', v: `${emoScore}/${emoTotal}`, n: emoScore >= 5 ? '우수' : emoScore >= 3 ? '양호' : '평가필요' },
                                { l: '반응시간', v: `${(avgET / 1000).toFixed(1)}초` },
                                { l: '사회인지', v: emoScore >= 5 ? '상위' : emoScore >= 3 ? '보통' : '하위' },
                            ]}
                            note={`표정 인식 ${emoScore}/${emoTotal} 정답, 평균 ${(avgET / 1000).toFixed(1)}초. ${emoScore >= 5 ? '타인의 정서 인식 능력이 우수. 사회적 단서 해석 양호.' : emoScore >= 3 ? '기본적 정서 인식 가능하나 미묘한 표정 구분에 어려움. 사회인지 훈련 고려.' : '정서 인식에 어려움. 자폐 스펙트럼 또는 사회인지 발달에 대한 정밀 평가 권장.'}`}
                        />
                        <Btn onClick={startEmo} style={{ marginTop: 12 }}>다시하기</Btn>
                    </>
                )}
            </div>
        );
    }

    /* ═══════ Game Selection Grid ═══════ */
    const gameStarters = {
        memory: startMem,
        pattern: startPattern,
        story: startStory,
        maze: startMaze,
        emotion: startEmo,
        speed: () => setAg('speed'),
    };

    return (
        <div className="slide-up">
            <div style={{ marginBottom: m ? 16 : 24 }}>
                <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>아동 인지·정서 평가</h2>
                <p style={{ color: C.textSec, fontSize: 12, margin: '4px 0 0' }}>게임형 평가 — AI가 데이터 수집</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : 'repeat(3,1fr)', gap: m ? 10 : 14 }}>
                {childGames.map(g => (
                    <Card key={g.id} style={{
                        padding: m ? 16 : 22, cursor: 'pointer', transition: 'all .2s ease',
                    }} onClick={() => gameStarters[g.id]?.()}>
                        <div style={{ fontSize: m ? 28 : 34, marginBottom: 8 }}>{g.icon}</div>
                        <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{g.name}</div>
                        <div style={{ color: C.textSec, fontSize: 11, marginBottom: 10, lineHeight: 1.4 }}>{g.desc}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <Badge text={g.domain} variant="blue" />
                            <span style={{ color: C.textMut, fontSize: 10 }}>{g.age}</span>
                        </div>
                        <div style={{ marginTop: 8, textAlign: 'center', color: C.blue, fontSize: 11, fontWeight: 600 }}>▶ 플레이</div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
