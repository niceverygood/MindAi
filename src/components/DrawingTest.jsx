import { useState, useEffect, useRef, useMemo } from 'react';
import { Badge, Btn, Card } from './UI';
import { C } from '../constants';
import { callAIJSON } from '../api';
import { useMobile } from '../hooks';
import ScalesPanel from './drawing/ScalesPanel';
import StrokeReplay from './drawing/StrokeReplay';
import VoiceRecorder from './drawing/VoiceRecorder';
import { scalesSummary } from './drawing/scales';

const PATIENTS_KEY = 'mindai-htp-patients';
const CURRENT_KEY = 'mindai-htp-current';

// --- Helpers ---
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
const todayISO = () => new Date().toISOString();
const fmtDate = (iso) => iso ? iso.slice(0, 16).replace('T', ' ') : '-';

const loadJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
};

// --- Small building blocks ---
function SectionTitle({ icon, text, color = C.text, right }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ color, fontWeight: 700, fontSize: 14 }}>{text}</span>
            {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
        </div>
    );
}

function KV({ k, v }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '6px 0',
            borderBottom: `1px solid ${C.borderLight}`, gap: 10,
        }}>
            <span style={{ color: C.textSec, fontSize: 11.5, flexShrink: 0 }}>{k}</span>
            <span style={{ color: C.text, fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{v}</span>
        </div>
    );
}

function Block({ text, bg = C.surface, color = C.text }) {
    if (!text) return null;
    return (
        <div style={{
            background: bg, color, borderRadius: 8, padding: 12,
            fontSize: 12.5, lineHeight: 1.75, whiteSpace: 'pre-wrap',
        }}>{text}</div>
    );
}

function RiskDot({ level }) {
    const clr = level === '높음' ? C.dangerText
        : level === '중간' ? C.warnText
            : level === '낮음' ? C.successText
                : C.textMut;
    return (
        <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: clr, boxShadow: `0 0 6px ${clr}80`,
            display: 'inline-block', flexShrink: 0,
        }} />
    );
}

function severityVariant(s) {
    if (!s) return 'default';
    if (s.includes('높음') || s.includes('강') || s.includes('심') || s.includes('악화')) return 'danger';
    if (s.includes('중간') || s.includes('보통') || s.includes('유지')) return 'warn';
    if (s.includes('낮음') || s.includes('약') || s.includes('호전') || s.includes('하락')) return 'success';
    return 'blue';
}

function trajectoryIcon(text) {
    if (!text) return '→';
    if (/상승|증가|악화|출현/.test(text)) return '↗';
    if (/하락|감소|호전|소실/.test(text)) return '↘';
    return '→';
}

// --- Recommendation → actionable intents ---
function parseActions(text, sessionsMap) {
    if (!text) return [];
    const t = text.toLowerCase();
    const actions = [];
    const seen = new Set();
    const addDraw = (target, label) => {
        const k = `d:${target}`;
        if (seen.has(k)) return;
        seen.add(k);
        actions.push({ type: 'draw', target, label, done: !!sessionsMap?.[target] });
    };
    if (/\btree\b|나무/.test(t)) addDraw('tree', '나무 그리기');
    if (/\bperson\b|사람|인물/.test(t)) addDraw('person', '사람 그리기');
    if (/\bhouse\b|^집|\s집/.test(t)) addDraw('house', '집 그리기');
    if (/family|가족|kfd/.test(t)) addDraw('family', '가족 그리기');
    if (/면담|인터뷰|pdi|interview|문진|심층/.test(t)) actions.push({ type: 'interview', label: '면담 기록 열기' });
    if (/mmpi|rorschach|로샤|wais|k-wais|sct|풀배터리|성격검사|지능검사|종합심리/.test(t)) actions.push({ type: 'nav', target: 'report', label: '풀배터리로' });
    if (/soap|차트|진료기록/.test(t)) actions.push({ type: 'nav', target: 'soap', label: 'SOAP로' });
    if (/과거.*기록|이전.*자료|문서.*분석|진료.*분석/.test(t)) actions.push({ type: 'nav', target: 'data', label: '진료분석으로' });
    if (/위험|자살|자해/.test(t)) actions.push({ type: 'nav', target: 'risk', label: '위험감지로' });
    return actions;
}

const systemPersona = `당신은 35년 경력의 세계 최고 수준 정신건강의학과 전문의이자 투사적 심리검사 슈퍼바이저입니다.
미국정신의학회(APA) Fellow, 한국임상심리학회 이사를 역임했으며, Buck(1948) HTP, Hammer(1958), Koppitz(1968) 30 Emotional Indicators,
Machover(1949) DAP, Koch Baumtest, Burns & Kaufman(1972) KFD, Jolles scoring system을 통합적으로 적용합니다.
증거 기반으로 추론하며, 모든 해석에 관찰 근거를 명시하고, 과대 해석을 경계하며, 투사적 검사의 한계를 항상 명시합니다.
DSM-5-TR 및 ICD-11 기준을 참고하되, 그림 한 장으로는 진단을 내릴 수 없음을 분명히 합니다.`;

const promptMeta = {
    house: {
        l: '집', e: '🏠', t: '집을 그려주세요',
        desc: '안정감, 가정환경 인식, 대인관계 개방성',
        components: ['지붕', '벽', '문', '창문', '굴뚝', '진입로', '지면선'],
        framework: 'Buck HTP (1948) — 집은 가정 환경과 가족 관계, 내면의 안정감을 상징',
    },
    tree: {
        l: '나무', e: '🌳', t: '나무를 그려주세요',
        desc: '자아상, 성격의 기본 구조, 무의식적 자기',
        components: ['줄기', '가지', '뿌리', '수관', '잎', '옹이·상처', '열매'],
        framework: 'Koch Baumtest (1952) / Buck HTP — 나무는 생명사와 기본 자아 구조',
    },
    person: {
        l: '사람', e: '🧑', t: '사람을 그려주세요',
        desc: '자기상, 신체 이미지, 사회적 자기',
        components: ['머리', '얼굴', '목', '몸통', '팔', '손', '다리', '발'],
        framework: 'Machover DAP (1949) / Goodenough-Harris — 사람은 의식적 자기상과 신체상',
    },
    family: {
        l: '가족', e: '👨‍👩‍👧‍👦', t: '가족을 그려주세요',
        desc: '가족 역동, 애착 관계, 가족 내 자기 위치',
        components: ['인물 간 거리', '크기 비교', '순서', '활동', '생략된 구성원'],
        framework: 'Burns & Kaufman KFD (1972) — 가족의 상호작용과 역동',
    },
};
const promptOrder = ['house', 'tree', 'person', 'family'];

// --- Patient registration modal ---
function NewPatientModal({ onClose, onCreate }) {
    const [form, setForm] = useState({ name: '', age: '', gender: '', chief: '', history: '' });
    const canSubmit = form.name.trim().length > 0;
    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: '#fff', borderRadius: 16, padding: 24,
                width: '90%', maxWidth: 520,
                boxShadow: '0 20px 60px rgba(0,0,0,.15)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>🆕 새 환자 등록</div>
                        <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>검사 시작 전에 환자 정보를 입력하세요</div>
                    </div>
                    <button onClick={onClose} style={{
                        background: C.surface, border: 'none', width: 30, height: 30, borderRadius: 8,
                        fontSize: 15, cursor: 'pointer',
                    }}>✕</button>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                    <div>
                        <label style={{ fontSize: 11, color: C.textMut, fontWeight: 600 }}>환자 이름 *</label>
                        <input
                            type="text" placeholder="홍길동 (또는 익명 ID)"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            style={{
                                width: '100%', marginTop: 4, padding: '10px 12px',
                                border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13,
                            }}
                            autoFocus
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <label style={{ fontSize: 11, color: C.textMut, fontWeight: 600 }}>연령</label>
                            <input
                                type="number" placeholder="예: 34"
                                value={form.age}
                                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                                style={{
                                    width: '100%', marginTop: 4, padding: '10px 12px',
                                    border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13,
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.textMut, fontWeight: 600 }}>성별</label>
                            <select
                                value={form.gender}
                                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                                style={{
                                    width: '100%', marginTop: 4, padding: '10px 12px',
                                    border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13,
                                    background: '#fff',
                                }}
                            >
                                <option value="">선택</option>
                                <option value="남">남</option>
                                <option value="여">여</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, color: C.textMut, fontWeight: 600 }}>주호소</label>
                        <input
                            type="text" placeholder="예: 우울감, 불안, 수면장애"
                            value={form.chief}
                            onChange={e => setForm(f => ({ ...f, chief: e.target.value }))}
                            style={{
                                width: '100%', marginTop: 4, padding: '10px 12px',
                                border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13,
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, color: C.textMut, fontWeight: 600 }}>초기 병력·배경 (선택)</label>
                        <textarea
                            placeholder="발병 시기, 가족력, 과거 치료 이력 등"
                            value={form.history}
                            onChange={e => setForm(f => ({ ...f, history: e.target.value }))}
                            style={{
                                width: '100%', marginTop: 4, padding: '10px 12px',
                                border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 12,
                                minHeight: 70, resize: 'vertical', fontFamily: 'inherit',
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
                    <Btn variant="ghost" onClick={onClose} style={{ fontSize: 12 }}>취소</Btn>
                    <Btn onClick={() => canSubmit && onCreate(form)} disabled={!canSubmit} style={{ fontSize: 12 }}>
                        ✓ 등록 후 검사 시작
                    </Btn>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Main component
// ============================================================
export default function DrawingTest({ onNavigate }) {
    const m = useMobile();
    const cr = useRef(null);
    const sr = useRef(null);

    // --- Drawing UI state ---
    const [dr, setDr] = useState(false);
    const [tl, setTl] = useState('pen');
    const [lw, setLw] = useState(3);
    const [pr, setPr] = useState('house');
    const [st, setSt] = useState([]);
    const [cs, setCs] = useState([]);
    const [elapsed, setElapsed] = useState(0);

    // --- Analysis state ---
    const [ar, setAr] = useState(null);
    const [az, setAz] = useState(false);
    const [synthesizing, setSynthesizing] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [pdiDraft, setPdiDraft] = useState({});
    const [currentVerb, setCurrentVerb] = useState({ transcript: '', segments: [], recordedAt: null });

    // --- Patient store ---
    const [patients, setPatients] = useState(() => loadJSON(PATIENTS_KEY, {}));
    const [currentIds, setCurrentIds] = useState(() => loadJSON(CURRENT_KEY, { patientId: null, testId: null }));
    const [showNewPatient, setShowNewPatient] = useState(false);
    const [showInterview, setShowInterview] = useState(false);

    // Persist
    useEffect(() => {
        try { localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients)); } catch { }
    }, [patients]);
    useEffect(() => {
        try { localStorage.setItem(CURRENT_KEY, JSON.stringify(currentIds)); } catch { }
    }, [currentIds]);

    // Timer
    useEffect(() => {
        const t = setInterval(() => {
            if (sr.current) setElapsed(Math.round((Date.now() - sr.current) / 1000));
        }, 1000);
        return () => clearInterval(t);
    }, []);

    // --- Derived state ---
    const patient = currentIds.patientId ? patients[currentIds.patientId] : null;
    const test = patient?.tests?.[currentIds.testId] || null;
    const sessions = test?.sessions || {};
    const interview = test?.interview || { notes: '', pdiByType: {} };
    const integrated = test?.integrated || null;
    const longitudinal = patient?.longitudinal || null;

    const patientList = useMemo(
        () => Object.values(patients).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
        [patients]
    );
    const testList = useMemo(
        () => patient ? Object.values(patient.tests || {}).sort((a, b) => (a.date || '').localeCompare(b.date || '')) : [],
        [patient]
    );
    const completedCount = promptOrder.filter(k => sessions[k]).length;
    const canSynthesize = completedCount >= 2;
    const testsWithData = testList.filter(t => Object.keys(t.sessions || {}).length > 0);
    const canReviewLongitudinal = testsWithData.length >= 2;

    // Canvas reset/restore on (pr, test) change
    useEffect(() => {
        const cv = cr.current;
        if (!cv) return;
        const ctx = cv.getContext('2d');
        cv.width = cv.offsetWidth * 2;
        cv.height = cv.offsetHeight * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = '#FAFBFC';
        ctx.fillRect(0, 0, cv.offsetWidth, cv.offsetHeight);
        sr.current = Date.now();
        setSt([]);
        setElapsed(0);

        const prior = sessions[pr];
        if (prior?.analysis) {
            setAr(prior.analysis);
            setPdiDraft(interview.pdiByType?.[pr] || {});
            setCurrentVerb(prior.verbalization || { transcript: '', segments: [], recordedAt: null });
            if (prior.image) {
                const img = new Image();
                img.onload = () => ctx.drawImage(img, 0, 0, cv.offsetWidth, cv.offsetHeight);
                img.src = `data:image/jpeg;base64,${prior.image}`;
            }
        } else {
            setAr(null);
            setPdiDraft({});
            setCurrentVerb({ transcript: '', segments: [], recordedAt: null });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pr, currentIds.patientId, currentIds.testId]);

    // --- Patient/test mutations ---
    const createPatient = (form) => {
        const patientId = uid('p');
        const testId = uid('t');
        const newPatient = {
            id: patientId,
            name: form.name.trim(),
            age: form.age,
            gender: form.gender,
            chief: form.chief,
            history: form.history,
            createdAt: todayISO(),
            tests: {
                [testId]: {
                    id: testId,
                    date: todayISO(),
                    label: '1차 검사',
                    sessions: {},
                    interview: { notes: '', pdiByType: {} },
                    integrated: null,
                },
            },
            longitudinal: null,
        };
        setPatients(p => ({ ...p, [patientId]: newPatient }));
        setCurrentIds({ patientId, testId });
        setShowNewPatient(false);
        setPr('house');
    };

    const selectPatient = (patientId) => {
        const p = patients[patientId];
        if (!p) return;
        const tests = Object.values(p.tests || {});
        const latest = tests.sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(-1)[0];
        setCurrentIds({ patientId, testId: latest?.id || null });
        setPr('house');
    };

    const selectTest = (testId) => {
        setCurrentIds(ids => ({ ...ids, testId }));
        setPr('house');
    };

    const startNewTest = () => {
        if (!patient) return;
        const testId = uid('t');
        const existingCount = Object.keys(patient.tests || {}).length;
        const newTest = {
            id: testId,
            date: todayISO(),
            label: `${existingCount + 1}차 검사`,
            sessions: {},
            interview: { notes: '', pdiByType: {} },
            integrated: null,
        };
        setPatients(p => ({
            ...p,
            [patient.id]: {
                ...patient,
                tests: { ...patient.tests, [testId]: newTest },
                longitudinal: null, // invalidate
            },
        }));
        setCurrentIds({ patientId: patient.id, testId });
        setPr('house');
    };

    const deletePatient = (patientId) => {
        if (!window.confirm(`${patients[patientId]?.name} 환자와 모든 검사 기록을 삭제하시겠습니까?`)) return;
        setPatients(p => {
            const n = { ...p };
            delete n[patientId];
            return n;
        });
        if (currentIds.patientId === patientId) {
            setCurrentIds({ patientId: null, testId: null });
        }
    };

    const deleteTest = (testId) => {
        if (!patient) return;
        if (!window.confirm('이 검사 세션을 삭제하시겠습니까?')) return;
        setPatients(p => {
            const newTests = { ...p[patient.id].tests };
            delete newTests[testId];
            return {
                ...p,
                [patient.id]: { ...p[patient.id], tests: newTests, longitudinal: null },
            };
        });
        if (currentIds.testId === testId) {
            const remaining = Object.keys(patient.tests).filter(k => k !== testId);
            setCurrentIds(ids => ({ ...ids, testId: remaining[0] || null }));
        }
    };

    // Update the current test
    const updateTest = (updater) => {
        if (!patient || !currentIds.testId) return;
        setPatients(p => ({
            ...p,
            [patient.id]: {
                ...p[patient.id],
                tests: {
                    ...p[patient.id].tests,
                    [currentIds.testId]: updater(p[patient.id].tests[currentIds.testId]),
                },
                longitudinal: null, // invalidate on any test change
            },
        }));
    };

    // --- Drawing handlers ---
    const gp = (e) => {
        const r = cr.current.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - r.left, y: cy - r.top };
    };
    const sd = (e) => {
        e.preventDefault();
        setDr(true);
        const p = gp(e);
        setCs([{ ...p, time: Date.now() }]);
        cr.current.getContext('2d').beginPath();
        cr.current.getContext('2d').moveTo(p.x, p.y);
    };
    const dd = (e) => {
        e.preventDefault();
        if (!dr) return;
        const p = gp(e);
        setCs(prev => [...prev, { ...p, time: Date.now() }]);
        const ctx = cr.current.getContext('2d');
        ctx.strokeStyle = tl === 'eraser' ? '#FAFBFC' : '#111827';
        ctx.lineWidth = tl === 'eraser' ? 20 : lw;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    };
    const ed = (e) => {
        e.preventDefault();
        if (!dr) return;
        setDr(false);
        if (cs.length > 1) setSt(prev => [...prev, { points: cs, duration: cs[cs.length - 1].time - cs[0].time, tool: tl, width: lw }]);
        setCs([]);
    };
    const cl = () => {
        const ctx = cr.current.getContext('2d');
        ctx.fillStyle = '#FAFBFC';
        ctx.fillRect(0, 0, cr.current.offsetWidth, cr.current.offsetHeight);
        setSt([]);
        setAr(null);
        sr.current = Date.now();
        setElapsed(0);
    };

    const switchTo = (target) => {
        setPr(target);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    };
    const navTo = (target) => { if (typeof onNavigate === 'function') onNavigate(target); };
    const handleAction = (a) => {
        if (a.type === 'draw') switchTo(a.target);
        else if (a.type === 'interview') setShowInterview(true);
        else if (a.type === 'nav') navTo(a.target);
    };

    // --- Process metrics ---
    const computeProcessMetrics = () => {
        if (st.length === 0) return null;
        const cv = cr.current;
        const W = cv.offsetWidth, H = cv.offsetHeight;
        const all = st.flatMap(s => s.points);
        const xs = all.map(p => p.x), ys = all.map(p => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const drawW = maxX - minX, drawH = maxY - minY;
        const areaRatio = (drawW * drawH) / (W * H);
        const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
        const pauses = [];
        const erasures = st.filter(s => s.tool === 'eraser').length;
        for (let i = 1; i < st.length; i++) {
            pauses.push(st[i].points[0].time - st[i - 1].points[st[i - 1].points.length - 1].time);
        }
        const longPauses = pauses.filter(p => p > 3000).length;
        const totalTime = sr.current ? Math.round((Date.now() - sr.current) / 1000) : 0;
        const avgStrokeDuration = Math.round(st.reduce((a, s) => a + s.duration, 0) / st.length);
        const posH = centerX < W / 3 ? '좌측' : centerX > (2 * W / 3) ? '우측' : '중앙';
        const posV = centerY < H / 3 ? '상단' : centerY > (2 * H / 3) ? '하단' : '중간';
        const sizeLabel = areaRatio < 0.15 ? '매우작음' : areaRatio < 0.3 ? '작음' : areaRatio < 0.55 ? '보통' : areaRatio < 0.8 ? '큼' : '매우큼';
        return {
            totalStrokes: st.length, totalTimeSec: totalTime,
            avgStrokeDurationMs: avgStrokeDuration,
            longPauses, pausesCount: pauses.length,
            maxPauseSec: pauses.length ? Math.round(Math.max(...pauses) / 1000) : 0,
            erasures, areaCoverage: `${Math.round(areaRatio * 100)}%`,
            sizeLabel, centerPosition: `${posV} ${posH}`,
        };
    };

    // --- Analyze (single drawing) ---
    const analyze = async () => {
        if (st.length === 0 || !patient || !currentIds.testId) return;
        setAz(true);
        setAr(null);
        try {
            const canvas = cr.current;
            const base64 = canvas.toDataURL('image/png').split(',')[1];
            const thumb = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
            const metrics = computeProcessMetrics();
            const prompt = promptMeta[pr];

            const ctxLine = [
                patient.age ? `연령 ${patient.age}세` : null,
                patient.gender ? `성별 ${patient.gender}` : null,
                patient.chief ? `주호소 ${patient.chief}` : null,
            ].filter(Boolean).join(', ') || '정보 없음';

            // Prior within current test
            const priorSummary = Object.entries(sessions)
                .filter(([k, v]) => k !== pr && v?.analysis)
                .map(([k, v]) => `[${promptMeta[k].l} 기존 분석] ${v.analysis?.headline || ''} — 위험: ${JSON.stringify(v.analysis?.risk_assessment || {})}`)
                .join('\n');

            // Prior across previous tests
            const priorTestSummary = testList
                .filter(t => t.id !== currentIds.testId && Object.keys(t.sessions || {}).length)
                .map(t => `[과거 검사 ${fmtDate(t.date)}] 그림 ${Object.keys(t.sessions).length}개, 종합위험: ${t.integrated?.refined_risk?.overall_level || '미산출'}, 인상: ${t.integrated?.executive_summary?.slice(0, 80) || '-'}`)
                .join('\n');

            const priorInterview = interview.notes ? `\n[이번 검사 임상 면담]\n${interview.notes}` : '';
            const priorPdi = Object.entries(interview.pdiByType || {})
                .filter(([, a]) => Object.keys(a).length)
                .map(([k, a]) => `[${promptMeta[k].l} PDI]\n${Object.entries(a).map(([q, v]) => `Q: ${q}\nA: ${v}`).join('\n')}`)
                .join('\n\n');

            const scalesLine = scalesSummary(test.scales);
            const verbText = currentVerb?.segments?.length
                ? currentVerb.segments.map(s => `[${s.atSec != null ? Math.floor(s.atSec / 60) + ':' + String(s.atSec % 60).padStart(2, '0') : '-'}] ${s.text}`).join('\n')
                : null;

            const taskText = `[환자] ${patient.name} (${ctxLine})
[검사 회차] ${test.label} — ${fmtDate(test.date)}
[과제] ${prompt.t} — ${prompt.l} 그림
[이론] ${prompt.framework}
[구성요소] ${prompt.components.join(', ')}
${patient.history ? `\n[병력·배경]\n${patient.history}` : ''}
${scalesLine ? `\n[자가보고 척도 결과 — 그림 소견과 반드시 교차 검증할 것]\n${scalesLine}` : ''}
${verbText ? `\n[환자가 그리는 동안/후 자발 발화 (타임스탬프)]\n${verbText}\n위 발화는 Buck이 "투사 검사의 핵심 자료"로 지목한 내용입니다. 발화 내용과 그림 소견의 일치·불일치를 반드시 분석하세요.` : ''}
${priorTestSummary ? `\n[과거 검사 요약]\n${priorTestSummary}` : ''}
${priorSummary ? `\n[이번 회차 이전 그림]\n${priorSummary}` : ''}
${priorInterview}
${priorPdi ? `\n[이전 PDI]\n${priorPdi}` : ''}

[과정 메트릭]
${JSON.stringify(metrics, null, 2)}

[지시]
첨부된 이미지를 면밀히 관찰하고, 다음 JSON 스키마에 따라 세계 최고 수준의 임상 소견서를 작성하세요.
- 관찰과 해석을 분리하여 근거 명시
- 각 구성요소를 개별 분석
- 이전 검사·면담·PDI가 있으면 반드시 참조하고 일관성/변화 분석
- 권고사항은 실행 가능한 구체 문장으로

JSON (백틱 없이):
{
  "headline": "한 줄 핵심 임상 인상 (20자 이내)",
  "drawing_description": "객관적 묘사 4-6줄",
  "formal_analysis": {
    "size": {"observation": "", "label": "매우작음/작음/보통/큼/매우큼", "interpretation": "", "references": ""},
    "placement": {"observation": "", "label": "", "interpretation": "", "references": ""},
    "line_quality": {"observation": "", "pressure": "약함/보통/강함/매우강함", "stroke_characteristics": "", "interpretation": "", "references": ""},
    "proportion_symmetry": {"observation": "", "interpretation": "", "references": ""},
    "detail_elaboration": {"observation": "", "level": "결여/낮음/보통/높음/과잉", "interpretation": "", "references": ""},
    "organization_integration": {"observation": "", "interpretation": "", "references": ""}
  },
  "content_analysis": {
    "components": [{"part": "", "observed": "", "symbolic_meaning": "", "clinical_significance": "", "flag": "normal/notable/concerning"}],
    "unusual_features": [{"feature": "", "possible_meaning": ""}],
    "omissions": [{"element": "", "significance": "", "severity": "낮음/중간/높음"}],
    "reinforcements_distortions": [""]
  },
  "process_analysis": {"approach": "", "sequence": "", "pauses_erasures": "", "speed": "", "interpretation": ""},
  "koppitz_emotional_indicators": [{"indicator": "", "present": true, "evidence": ""}],
  "cross_session_consistency": "이번 검사 내 이전 그림 및 과거 검사와의 일관성 2-3줄",
  "psychodynamic_formulation": {
    "ego_strength": "", "reality_testing": "",
    "defense_mechanisms": [{"mechanism": "", "evidence": ""}],
    "self_concept": "", "object_relations": "", "affect_regulation": "", "identity_integration": ""
  },
  "emotional_indicators": [{"name": "", "evidence": "", "severity": ""}],
  "risk_assessment": {
    "self_harm": {"level": "없음/낮음/중간/높음", "evidence": []},
    "suicidality": {"level": "", "evidence": []},
    "violence_aggression": {"level": "", "evidence": []},
    "psychosis_indicators": {"level": "", "evidence": []},
    "trauma_indicators": {"level": "", "evidence": []}
  },
  "differential_considerations": [
    {"consideration": "", "supporting_evidence": [], "against_evidence": [], "likelihood": "낮음/중간/높음", "dsm5_reference": ""}
  ],
  "strengths_resilience": [{"strength": "", "evidence": ""}],
  "post_drawing_inquiry": [{"question": "", "rationale": ""}],
  "clinical_impression": "",
  "integrated_formulation": "",
  "scale_cross_validation": "자가보고 척도 결과가 있다면, 척도와 그림 소견의 일치/불일치를 분석 (예: PHQ-9 중증인데 그림은 방어적 → 알렉시티미아 시사). 척도 없으면 '척도 미시행'",
  "verbalization_analysis": "자발 발화가 있다면 발화와 그림의 관계를 분석. 없으면 '발화 기록 없음'",
  "recommendations": {
    "immediate": [""], "additional_assessment": [""], "therapeutic": [""], "follow_up": [""],
    "next_drawing_suggestion": "house/tree/person/family 중 다음 권장 (이미 그린 것 제외)"
  },
  "limitations_disclaimer": "",
  "confidence": {"level": "높음/보통/낮음", "reason": ""}
}`;

            const messages = [{
                role: 'user',
                content: [
                    { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
                    { type: 'text', text: systemPersona + '\n\n' + taskText },
                ],
            }];

            const result = await callAIJSON(messages, 8000);
            const resultWithMeta = { ...result, processMetrics: metrics };
            setAr(resultWithMeta);
            updateTest(t => ({
                ...t,
                sessions: {
                    ...t.sessions,
                    [pr]: {
                        type: pr,
                        image: thumb,
                        analysis: resultWithMeta,
                        strokes: st,
                        verbalization: currentVerb,
                        timestamp: todayISO(),
                    },
                },
                integrated: null, // invalidate
            }));
        } catch (e) {
            console.error('AI Analysis Error:', e);
            setAr({ error: true, clinical_impression: '분석 오류: ' + (e.message || '알 수 없는 오류') });
        }
        setAz(false);
    };

    // --- Synthesize across current test's drawings ---
    const synthesize = async () => {
        const done = promptOrder.map(k => sessions[k]).filter(Boolean);
        if (done.length < 2) return;
        setSynthesizing(true);
        try {
            const content = [];
            done.forEach(s => {
                if (s.image) content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${s.image}` } });
                content.push({
                    type: 'text', text: `[${promptMeta[s.type].l} 개별 분석]
헤드라인: ${s.analysis?.headline || '-'}
형식: ${JSON.stringify(s.analysis?.formal_analysis || {})}
구성요소: ${(s.analysis?.content_analysis?.components || []).map(c => `${c.part}:${c.flag}`).join(', ')}
정신역동: ${JSON.stringify(s.analysis?.psychodynamic_formulation || {})}
위험: ${JSON.stringify(s.analysis?.risk_assessment || {})}
감별: ${(s.analysis?.differential_considerations || []).map(d => `${d.consideration}(${d.likelihood})`).join(', ')}
PDI: ${JSON.stringify((interview.pdiByType || {})[s.type] || {})}`,
                });
            });
            const scalesLine2 = scalesSummary(test.scales);
            const allVerbs = done.filter(s => s.verbalization?.transcript).map(s => `[${promptMeta[s.type].l} 발화]\n${s.verbalization.transcript}`).join('\n\n');
            content.push({
                type: 'text', text: `${systemPersona}

[환자] ${patient.name} (${patient.age || '-'}세 ${patient.gender || '-'}, 주호소: ${patient.chief || '-'})
[검사 회차] ${test.label} — ${fmtDate(test.date)}
[면담 기록] ${interview.notes || '-'}
${scalesLine2 ? `\n[자가보고 척도]\n${scalesLine2}\n` : ''}
${allVerbs ? `\n[환자 자발 발화 모음]\n${allVerbs}\n` : ''}
위 ${done.length}개 그림 + 척도 + 발화를 통합 해석하세요. 공통 주제·일관성·모순·각 그림 기여·통합 정신역동·재조정된 감별과 위험·치료 계획을 포함. 척도와 그림의 일치/불일치, 발화와 그림의 관계도 분석하세요.

JSON(백틱 없이):
{
  "executive_summary": "5-6줄",
  "cross_drawing_themes": [{"theme": "", "evidence_across": ""}],
  "consistency_analysis": "",
  "per_drawing_contribution": {"house": "", "tree": "", "person": "", "family": ""},
  "scale_integration": "자가보고 척도와 HTP 결과의 일치/불일치 4-5줄 (척도 없으면 '척도 미시행')",
  "verbalization_synthesis": "자발 발화 종합 분석 3-4줄 (발화 없으면 '발화 기록 없음')",
  "integrated_psychodynamics": "",
  "refined_differential": [{"consideration": "", "evidence": "", "likelihood": "", "rationale": ""}],
  "refined_risk": {"self_harm": "", "suicidality": "", "violence": "", "psychosis": "", "trauma": "", "overall_level": "낮음/중간/높음", "notes": ""},
  "strengths_summary": [""],
  "treatment_plan": {"immediate_actions": [""], "short_term_goals": [""], "long_term_goals": [""], "recommended_modalities": [""], "additional_assessments": [""]},
  "prognosis": "",
  "next_steps": [""],
  "limitations": "",
  "confidence": {"level": "", "reason": ""}
}`,
            });
            const result = await callAIJSON([{ role: 'user', content }], 8000);
            updateTest(t => ({ ...t, integrated: result }));
        } catch (e) {
            updateTest(t => ({ ...t, integrated: { error: e.message } }));
        }
        setSynthesizing(false);
    };

    // --- Longitudinal review across all tests of current patient ---
    const reviewLongitudinal = async () => {
        if (!patient || testsWithData.length < 2) return;
        setReviewing(true);
        try {
            const orderedTests = [...testsWithData].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
            const payload = orderedTests.map((t, i) => ({
                testNumber: i + 1,
                label: t.label,
                date: t.date?.slice(0, 10),
                drawingsCount: Object.keys(t.sessions || {}).length,
                headlines: Object.fromEntries(Object.entries(t.sessions).map(([k, v]) => [k, v.analysis?.headline])),
                risks: Object.fromEntries(Object.entries(t.sessions).map(([k, v]) => [k, v.analysis?.risk_assessment])),
                differentials: Object.fromEntries(Object.entries(t.sessions).map(([k, v]) => [k, (v.analysis?.differential_considerations || []).map(d => ({ c: d.consideration, l: d.likelihood }))])),
                emotionalIndicators: Object.fromEntries(Object.entries(t.sessions).map(([k, v]) => [k, (v.analysis?.emotional_indicators || []).map(e => ({ name: e.name, sev: e.severity }))])),
                scales: t.scales ? Object.fromEntries(Object.entries(t.scales).map(([k, v]) => [k, { score: v.score, severity: v.severity, criticalFlag: v.criticalFlag }])) : null,
                verbalizations: Object.fromEntries(Object.entries(t.sessions).map(([k, v]) => [k, v.verbalization?.transcript?.slice(0, 300) || null])),
                integrated: t.integrated && !t.integrated.error ? {
                    summary: t.integrated.executive_summary,
                    refinedRisk: t.integrated.refined_risk,
                    refinedDifferential: t.integrated.refined_differential,
                    prognosis: t.integrated.prognosis,
                } : null,
                interviewNotes: t.interview?.notes || '',
            }));

            const content = [{
                type: 'text', text: `${systemPersona}

[환자] ${patient.name} (${patient.age || '-'}세 ${patient.gender || '-'})
[주호소] ${patient.chief || '-'}
[병력] ${patient.history || '-'}
[총 검사] ${orderedTests.length}회

[검사별 요약 (시간 순)]
${JSON.stringify(payload, null, 2)}

위 환자의 시간 경과에 따른 HTP 검사 기록을 종합 검토하여 **종단(longitudinal) 임상 검토서**를 작성하세요.

[작성 원칙]
- 시간 흐름에 따른 변화를 명시적으로 추적
- 위험 수준의 변화 궤적(상승/유지/하락)
- 치료 반응 양상(호전/정체/악화)
- 새로 출현 또는 소실된 증상/징후
- 감별 진단의 안정화 또는 변동
- 강점·자원의 변화
- 치료 계획 조정 권고

JSON(백틱 없이):
{
  "patient_summary": "환자 요약 3-4줄",
  "total_tests": ${orderedTests.length},
  "time_span": "첫 검사~마지막 검사 간격",
  "trajectory": "전반적 경과 (호전/유지/변동/악화)",
  "timeline": [{"date": "YYYY-MM-DD", "label": "검사 회차", "summary": "한 줄 요약", "key_change": "이전 대비 핵심 변화"}],
  "risk_trajectory": {
    "self_harm": "상승/유지/하락 + 설명",
    "suicidality": "",
    "violence": "",
    "psychosis": "",
    "trauma": ""
  },
  "stable_themes": [""],
  "emerging_themes": [""],
  "resolved_themes": [""],
  "differential_evolution": [{"consideration": "", "initial": "낮음/중간/높음", "current": "", "interpretation": ""}],
  "symptom_evolution": [{"domain": "예: 우울, 불안, 위축", "initial_severity": "", "current_severity": "", "change": ""}],
  "scale_trajectory": [{"scale": "PHQ-9/GAD-7/C-SSRS 등", "initial": "초기 점수/심각도", "current": "현재 점수/심각도", "trend": "호전/유지/악화", "interpretation": ""}],
  "strengths_evolution": "강점·자원의 변화 양상",
  "treatment_response": "치료 반응 평가 4-5줄",
  "clinical_concerns": [""],
  "progress_markers": [""],
  "recommended_adjustments": {"therapeutic": [""], "assessment": [""], "monitoring": [""]},
  "overall_prognosis_update": "갱신된 예후 4-5줄",
  "next_review_timing": "다음 평가 권장 시점",
  "limitations": "",
  "confidence": {"level": "", "reason": ""}
}`,
            }];

            const result = await callAIJSON([{ role: 'user', content }], 8000);
            setPatients(p => ({
                ...p,
                [patient.id]: { ...p[patient.id], longitudinal: result },
            }));
        } catch (e) {
            setPatients(p => ({
                ...p,
                [patient.id]: { ...p[patient.id], longitudinal: { error: e.message } },
            }));
        }
        setReviewing(false);
    };

    const savePdi = () => {
        updateTest(t => ({
            ...t,
            interview: {
                ...t.interview,
                pdiByType: { ...t.interview.pdiByType, [pr]: pdiDraft },
            },
        }));
    };
    const saveInterview = (notes) => {
        updateTest(t => ({ ...t, interview: { ...t.interview, notes } }));
    };

    const riskItems = ar?.risk_assessment ? [
        ['자해', ar.risk_assessment.self_harm],
        ['자살', ar.risk_assessment.suicidality],
        ['공격성', ar.risk_assessment.violence_aggression],
        ['정신병적', ar.risk_assessment.psychosis_indicators],
        ['외상', ar.risk_assessment.trauma_indicators],
    ] : [];

    const rec = ar?.recommendations || {};
    const nextSuggestion = rec.next_drawing_suggestion;

    // ============================================================
    // --- Render ---
    // ============================================================
    return (
        <div className="slide-up">
            {/* Header */}
            <div style={{ marginBottom: 14 }}>
                <h2 style={{ color: C.text, fontSize: m ? 18 : 21, fontWeight: 700, margin: 0 }}>
                    전문가급 그림검사 — 환자 차트
                </h2>
                <p style={{ color: C.textSec, fontSize: 12, margin: '4px 0 0' }}>
                    환자별 다회차 누적 · 크로스-드로잉 통합 · 종단 추이 검토
                </p>
            </div>

            {/* Patient Bar */}
            <Card style={{ padding: m ? 12 : 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
                        <span style={{ fontSize: 20 }}>👤</span>
                        {patientList.length > 0 ? (
                            <select
                                value={currentIds.patientId || ''}
                                onChange={e => e.target.value ? selectPatient(e.target.value) : setCurrentIds({ patientId: null, testId: null })}
                                style={{
                                    flex: 1, minWidth: 0,
                                    padding: '8px 12px', borderRadius: 10,
                                    border: `1.5px solid ${C.border}`, fontSize: 13, fontWeight: 600,
                                    background: '#fff', color: C.text,
                                }}
                            >
                                <option value="">— 환자 선택 —</option>
                                {patientList.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.age || '-'}세 {p.gender || '-'}) · {Object.keys(p.tests || {}).length}회 검사
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span style={{ color: C.textMut, fontSize: 12, flex: 1 }}>등록된 환자가 없습니다</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <Btn onClick={() => setShowNewPatient(true)} style={{ fontSize: 12 }}>
                            ➕ 새 환자
                        </Btn>
                        {patient && (
                            <Btn variant="ghost" onClick={() => deletePatient(patient.id)} style={{ fontSize: 11, color: C.dangerText }}>
                                🗑
                            </Btn>
                        )}
                    </div>
                </div>

                {patient && (
                    <>
                        <div style={{
                            marginTop: 12, padding: '10px 12px',
                            background: C.blueLight, borderRadius: 10,
                            fontSize: 12, color: C.blueDark, lineHeight: 1.6,
                        }}>
                            <b>{patient.name}</b>
                            {(patient.age || patient.gender) && ` · ${patient.age || '-'}세 ${patient.gender || '-'}`}
                            {patient.chief && <span> · 주호소: {patient.chief}</span>}
                            {patient.history && (
                                <div style={{ fontSize: 11, color: C.textSec, marginTop: 4, paddingTop: 6, borderTop: `1px solid ${C.blueMid}` }}>
                                    {patient.history}
                                </div>
                            )}
                        </div>

                        {/* Test selector */}
                        <div style={{
                            marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                        }}>
                            <span style={{ fontSize: 11, color: C.textMut, fontWeight: 600 }}>📋 검사 회차:</span>
                            <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap', minWidth: 0 }}>
                                {testList.map(t => {
                                    const active = t.id === currentIds.testId;
                                    const count = Object.keys(t.sessions || {}).length;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => selectTest(t.id)}
                                            style={{
                                                background: active ? C.blue : '#fff',
                                                color: active ? '#fff' : C.text,
                                                border: `1px solid ${active ? C.blue : C.border}`,
                                                padding: '6px 12px', borderRadius: 20,
                                                fontSize: 11, fontWeight: 600,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                                transition: 'all .15s',
                                            }}
                                        >
                                            <span>{t.label}</span>
                                            <span style={{
                                                fontSize: 10, opacity: .75,
                                            }}>{t.date?.slice(5, 10)}</span>
                                            <span style={{
                                                background: active ? 'rgba(255,255,255,.25)' : C.surface,
                                                color: active ? '#fff' : C.textSec,
                                                padding: '1px 6px', borderRadius: 10, fontSize: 9,
                                            }}>{count}/4</span>
                                            {testList.length > 1 && (
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); deleteTest(t.id); }}
                                                    style={{ opacity: .6, marginLeft: 2 }}
                                                >✕</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <Btn variant="secondary" onClick={startNewTest} style={{ fontSize: 11, padding: '6px 12px' }}>
                                ➕ 새 검사
                            </Btn>
                            <Btn
                                variant={canReviewLongitudinal ? 'primary' : 'ghost'}
                                disabled={!canReviewLongitudinal || reviewing}
                                onClick={reviewLongitudinal}
                                style={{ fontSize: 11, padding: '6px 12px' }}
                            >
                                {reviewing ? (<><span className="spinner" style={{ width: 12, height: 12 }} /> 추이 분석 중</>)
                                    : canReviewLongitudinal ? `📈 추이 검토 (${testsWithData.length}회)`
                                        : '📈 추이 검토 (2회 이상 필요)'}
                            </Btn>
                        </div>
                    </>
                )}
            </Card>

            {/* No patient gate */}
            {!patient && (
                <Card style={{ padding: m ? 30 : 50, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 10 }}>👤</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                        검사를 시작하려면 환자를 등록하세요
                    </div>
                    <div style={{ fontSize: 12, color: C.textSec, marginBottom: 16 }}>
                        환자별로 여러 차례 검사가 누적되며, 시간에 따른 변화를 종합적으로 검토할 수 있습니다.
                    </div>
                    <Btn onClick={() => setShowNewPatient(true)} style={{ fontSize: 13 }}>
                        ➕ 새 환자 등록
                    </Btn>
                </Card>
            )}

            {/* Drawing UI — only when patient selected */}
            {patient && test && (
                <>
                    {/* Current test progress */}
                    <Card style={{ padding: m ? 12 : 14, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>🖼️ {test.label} HTP 진행</span>
                                <Badge text={`${completedCount}/4 완료`} variant={completedCount === 4 ? 'success' : completedCount >= 2 ? 'blue' : 'default'} />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <Btn variant="ghost" onClick={() => setShowInterview(true)} style={{ fontSize: 11 }}>
                                    📝 면담 {interview.notes ? '✓' : ''}
                                </Btn>
                                <Btn onClick={synthesize} disabled={!canSynthesize || synthesizing}
                                    variant={canSynthesize ? 'primary' : 'ghost'} style={{ fontSize: 11 }}>
                                    {synthesizing ? (<><span className="spinner" style={{ width: 12, height: 12 }} /> 종합 해석 중</>)
                                        : canSynthesize ? `🧬 종합 해석 (${completedCount}개)`
                                            : '🔒 종합 (2개↑)'}
                                </Btn>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: m ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 8 }}>
                            {promptOrder.map(k => {
                                const s = sessions[k];
                                const active = k === pr;
                                return (
                                    <button key={k} onClick={() => switchTo(k)}
                                        style={{
                                            background: active ? C.blueLight : s ? C.successBg : C.surface,
                                            border: `1.5px solid ${active ? C.blue : s ? C.successText : C.border}`,
                                            borderRadius: 10, padding: '8px 10px',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            cursor: 'pointer', textAlign: 'left',
                                        }}
                                    >
                                        <span style={{ fontSize: 18 }}>{promptMeta[k].e}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{promptMeta[k].l}</div>
                                            <div style={{ fontSize: 10, color: s ? C.successText : C.textMut }}>
                                                {s ? '✓ 분석 완료' : active ? '진행 중' : '미작성'}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Scales Panel */}
                    <Card style={{ padding: m ? 12 : 14, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 16 }}>📊</span>
                            <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>표준화 척도 (HTP와 자동 교차 검증)</span>
                            <span style={{ color: C.textMut, fontSize: 11 }}>
                                {Object.keys(test.scales || {}).length > 0
                                    ? `· ${Object.keys(test.scales).length}개 시행됨`
                                    : '· 미시행'}
                            </span>
                        </div>
                        <ScalesPanel
                            scales={test.scales || {}}
                            onUpdate={(updater) => updateTest(t => ({
                                ...t,
                                scales: typeof updater === 'function' ? updater(t.scales || {}) : updater,
                            }))}
                            m={m}
                        />
                    </Card>

                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 280px', gap: 14 }}>
                        {/* Canvas */}
                        <Card style={{ padding: m ? 10 : 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                                <div>
                                    <span style={{ color: C.blue, fontSize: 13, fontWeight: 600 }}>✏️ {promptMeta[pr].t}</span>
                                    <div style={{ color: C.textMut, fontSize: 10 }}>{promptMeta[pr].desc}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <Btn variant={tl === 'pen' ? 'secondary' : 'ghost'} onClick={() => setTl('pen')} style={{ padding: '4px 10px', fontSize: 11 }}>✏ 펜</Btn>
                                    <Btn variant={tl === 'eraser' ? 'danger' : 'ghost'} onClick={() => setTl('eraser')} style={{ padding: '4px 10px', fontSize: 11 }}>◻ 지우개</Btn>
                                </div>
                            </div>
                            <canvas ref={cr}
                                onMouseDown={sd} onMouseMove={dd} onMouseUp={ed} onMouseLeave={ed}
                                onTouchStart={sd} onTouchMove={dd} onTouchEnd={ed}
                                style={{
                                    width: '100%', height: m ? 280 : 420,
                                    borderRadius: 10, cursor: tl === 'eraser' ? 'cell' : 'crosshair',
                                    touchAction: 'none', border: `1px solid ${C.border}`,
                                    display: 'block', background: '#FAFBFC',
                                }}
                            />
                            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Btn variant="danger" onClick={cl} style={{ fontSize: 11, padding: '6px 12px' }}>🗑 초기화</Btn>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 120 }}>
                                    <span style={{ color: C.textMut, fontSize: 10, whiteSpace: 'nowrap' }}>펜 굵기</span>
                                    <input type="range" min="1" max="8" value={lw} onChange={e => setLw(Number(e.target.value))} style={{ flex: 1, minWidth: 60 }} />
                                    <div style={{
                                        width: Math.max(lw * 2, 6), height: Math.max(lw * 2, 6),
                                        borderRadius: '50%', background: C.text, flexShrink: 0,
                                    }} />
                                </div>
                                <Btn onClick={analyze} disabled={st.length === 0 || az} style={{ fontSize: 12 }}>
                                    {az ? (<><span className="spinner" style={{ width: 14, height: 14 }} /> 전문가 분석 중...</>)
                                        : '🧠 전문가 심층 분석'}
                                </Btn>
                            </div>
                        </Card>

                        <div style={{ display: 'flex', flexDirection: m ? 'row' : 'column', gap: 10, flexWrap: 'wrap' }}>
                            <Card style={{ padding: 16, flex: 1, minWidth: m ? 'calc(50% - 5px)' : 'auto' }}>
                                <SectionTitle icon="📊" text="과정 메트릭" />
                                <KV k="획 수" v={`${st.length}`} />
                                <KV k="경과" v={`${elapsed}초`} />
                                <KV k="지우기" v={`${st.filter(s => s.tool === 'eraser').length}`} />
                                <KV k="과제" v={promptMeta[pr].l} />
                            </Card>
                            {ar && !ar.error && ar.headline && (
                                <Card style={{ padding: 16, flex: 1, minWidth: m ? 'calc(50% - 5px)' : 'auto' }} borderColor={C.blue}>
                                    <SectionTitle icon="🎯" text="핵심 인상" color={C.blue} />
                                    <div style={{ color: C.text, fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>
                                        {ar.headline}
                                    </div>
                                    <Badge text={`신뢰도: ${ar.confidence?.level || '-'}`} variant={ar.confidence?.level === '높음' ? 'success' : ar.confidence?.level === '낮음' ? 'warn' : 'blue'} />
                                </Card>
                            )}
                            {ar?.error && (
                                <Card style={{ padding: 16, flex: 1 }} borderColor={C.dangerText}>
                                    <div style={{ color: C.dangerText, fontSize: 12 }}>⚠ {ar.clinical_impression}</div>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Voice Recorder — available during drawing */}
                    <div style={{ marginTop: 14 }}>
                        <VoiceRecorder
                            verbalization={currentVerb}
                            onUpdate={setCurrentVerb}
                            drawingStartRef={sr}
                            label={`${promptMeta[pr].l} 그림`}
                        />
                    </div>

                    {/* Stroke replay — visible when session has stroke data saved */}
                    {sessions[pr]?.strokes?.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                            <StrokeReplay
                                strokes={sessions[pr].strokes}
                                width={m ? 320 : 560}
                                height={m ? 240 : 420}
                                label={`${patient.name} · ${test.label} · ${promptMeta[pr].l}`}
                            />
                        </div>
                    )}

                    {/* Analysis Result Sections */}
                    {ar && !ar.error && (
                        <div style={{ marginTop: 16 }}>
                            <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                <SectionTitle icon="📝" text="그림 객관적 묘사" />
                                <Block text={ar.drawing_description} />
                            </Card>

                            {ar.cross_session_consistency && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.blueMid}>
                                    <SectionTitle icon="🔗" text="이전 세션 및 과거 검사와의 일관성" color={C.blueDark} />
                                    <Block text={ar.cross_session_consistency} bg={C.blueLight} />
                                </Card>
                            )}

                            {ar.scale_cross_validation && ar.scale_cross_validation !== '척도 미시행' && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.successText}>
                                    <SectionTitle icon="📊" text="자가보고 척도 × HTP 교차 검증" color={C.successText} />
                                    <Block text={ar.scale_cross_validation} bg={C.successBg} />
                                </Card>
                            )}

                            {ar.verbalization_analysis && ar.verbalization_analysis !== '발화 기록 없음' && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor="#7C3AED">
                                    <SectionTitle icon="🎙️" text="자발 발화 × 그림 분석" color="#6D28D9" />
                                    <Block text={ar.verbalization_analysis} bg="#F3E8FF" />
                                </Card>
                            )}

                            {ar.formal_analysis && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="📐" text="형식적 분석 (Formal Analysis)" />
                                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 10 }}>
                                        {[
                                            ['크기', '📏', ar.formal_analysis.size],
                                            ['배치', '📍', ar.formal_analysis.placement],
                                            ['선의 질', '✍️', ar.formal_analysis.line_quality],
                                            ['비율·대칭', '⚖️', ar.formal_analysis.proportion_symmetry],
                                            ['세부 정교화', '🔍', ar.formal_analysis.detail_elaboration],
                                            ['조직화·통합', '🧩', ar.formal_analysis.organization_integration],
                                        ].map(([label, icon, d]) => d && (
                                            <div key={label} style={{ background: C.surface, borderRadius: 10, padding: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                                    <span>{icon}</span>
                                                    <span style={{ color: C.text, fontWeight: 700, fontSize: 12.5 }}>{label}</span>
                                                    {d.label && <Badge text={d.label} variant="blue" />}
                                                    {d.pressure && <Badge text={d.pressure} variant={severityVariant(d.pressure)} />}
                                                    {d.level && <Badge text={d.level} variant={severityVariant(d.level)} />}
                                                </div>
                                                {d.observation && <div style={{ color: C.textSec, fontSize: 11.5, lineHeight: 1.6, marginBottom: 4 }}><b style={{ color: C.textMut }}>관찰:</b> {d.observation}</div>}
                                                {d.stroke_characteristics && <div style={{ color: C.textSec, fontSize: 11, marginBottom: 4 }}><b style={{ color: C.textMut }}>획 특성:</b> {d.stroke_characteristics}</div>}
                                                {d.interpretation && <div style={{ color: C.text, fontSize: 12, lineHeight: 1.6 }}><b style={{ color: C.blue }}>해석:</b> {d.interpretation}</div>}
                                                {d.references && <div style={{ color: C.textMut, fontSize: 10, marginTop: 4, fontStyle: 'italic' }}>📚 {d.references}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {ar.content_analysis?.components?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="🏗️" text="구성요소별 상징 분석" />
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        {ar.content_analysis.components.map((c, i) => {
                                            const flagColor = c.flag === 'concerning' ? C.dangerText : c.flag === 'notable' ? C.warnText : C.successText;
                                            return (
                                                <div key={i} style={{
                                                    borderLeft: `3px solid ${flagColor}`,
                                                    background: C.surface, borderRadius: 8, padding: '10px 12px',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                        <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{c.part}</span>
                                                        <Badge text={c.flag === 'concerning' ? '주의' : c.flag === 'notable' ? '특이' : '정상'} variant={c.flag === 'concerning' ? 'danger' : c.flag === 'notable' ? 'warn' : 'success'} />
                                                    </div>
                                                    {c.observed && <div style={{ color: C.textSec, fontSize: 11.5, marginBottom: 3 }}><b style={{ color: C.textMut }}>관찰:</b> {c.observed}</div>}
                                                    {c.symbolic_meaning && <div style={{ color: C.textSec, fontSize: 11.5, marginBottom: 3 }}><b style={{ color: C.textMut }}>상징:</b> {c.symbolic_meaning}</div>}
                                                    {c.clinical_significance && <div style={{ color: C.text, fontSize: 12, lineHeight: 1.55 }}><b style={{ color: C.blue }}>임상 의미:</b> {c.clinical_significance}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                {ar.content_analysis?.unusual_features?.length > 0 && (
                                    <Card style={{ padding: m ? 14 : 16 }}>
                                        <SectionTitle icon="🔎" text="특이 요소" />
                                        {ar.content_analysis.unusual_features.map((f, i) => (
                                            <div key={i} style={{ padding: '6px 0', borderBottom: i < ar.content_analysis.unusual_features.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                                                <div style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>• {f.feature}</div>
                                                <div style={{ color: C.textSec, fontSize: 11, marginLeft: 10, marginTop: 2 }}>{f.possible_meaning}</div>
                                            </div>
                                        ))}
                                    </Card>
                                )}
                                {ar.content_analysis?.omissions?.length > 0 && (
                                    <Card style={{ padding: m ? 14 : 16 }}>
                                        <SectionTitle icon="⚠️" text="생략된 요소" color={C.warnText} />
                                        {ar.content_analysis.omissions.map((o, i) => (
                                            <div key={i} style={{
                                                display: 'flex', gap: 8, background: C.warnBg, borderRadius: 6,
                                                padding: 8, marginBottom: 4, alignItems: 'flex-start',
                                            }}>
                                                <Badge text={o.severity || '-'} variant={severityVariant(o.severity)} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{o.element}</div>
                                                    <div style={{ color: C.textSec, fontSize: 11, marginTop: 2 }}>{o.significance}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </Card>
                                )}
                            </div>

                            {ar.process_analysis && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="⏱️" text="그리기 과정 해석" />
                                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                        {[
                                            ['접근 방식', ar.process_analysis.approach],
                                            ['순서', ar.process_analysis.sequence],
                                            ['멈춤·지우기', ar.process_analysis.pauses_erasures],
                                            ['속도', ar.process_analysis.speed],
                                        ].map(([k, v]) => v && (
                                            <div key={k} style={{ background: C.surface, borderRadius: 8, padding: 10 }}>
                                                <div style={{ color: C.textMut, fontSize: 10.5, fontWeight: 600, marginBottom: 3 }}>{k}</div>
                                                <div style={{ color: C.text, fontSize: 12, lineHeight: 1.5 }}>{v}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <Block text={ar.process_analysis.interpretation} />
                                </Card>
                            )}

                            {ar.koppitz_emotional_indicators?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="🧪" text="Koppitz 정서지표 (KEI)" />
                                    {ar.koppitz_emotional_indicators.map((k, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: 8, padding: '7px 0',
                                            borderBottom: i < ar.koppitz_emotional_indicators.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                                        }}>
                                            <Badge text={k.present ? '양성' : '음성'} variant={k.present ? 'warn' : 'success'} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: C.text, fontSize: 12.5, fontWeight: 600 }}>{k.indicator}</div>
                                                {k.evidence && <div style={{ color: C.textSec, fontSize: 11, marginTop: 2 }}>{k.evidence}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </Card>
                            )}

                            {ar.psychodynamic_formulation && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.blue}>
                                    <SectionTitle icon="🧠" text="정신역동적 공식화" color={C.blue} />
                                    <KV k="자아 강도" v={ar.psychodynamic_formulation.ego_strength} />
                                    <KV k="현실 검증력" v={ar.psychodynamic_formulation.reality_testing} />
                                    <KV k="자기상" v={ar.psychodynamic_formulation.self_concept} />
                                    <KV k="대상관계" v={ar.psychodynamic_formulation.object_relations} />
                                    <KV k="정서 조절" v={ar.psychodynamic_formulation.affect_regulation} />
                                    <KV k="정체성 통합" v={ar.psychodynamic_formulation.identity_integration} />
                                    {ar.psychodynamic_formulation.defense_mechanisms?.length > 0 && (
                                        <div style={{ marginTop: 12 }}>
                                            <div style={{ color: C.textMut, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>관찰된 방어기제</div>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {ar.psychodynamic_formulation.defense_mechanisms.map((d, i) => (
                                                    <div key={i} style={{ background: C.blueLight, borderRadius: 8, padding: '6px 10px', fontSize: 11.5 }}>
                                                        <b style={{ color: C.blueDark }}>{d.mechanism}</b>
                                                        {d.evidence && <span style={{ color: C.textSec, marginLeft: 6 }}>— {d.evidence}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            )}

                            {ar.emotional_indicators?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="💭" text="정서 지표" />
                                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 8 }}>
                                        {ar.emotional_indicators.map((ind, i) => (
                                            <div key={i} style={{
                                                borderLeft: `3px solid ${ind.severity === '높음' ? C.dangerText : ind.severity === '중간' ? C.warnText : C.successText}`,
                                                background: C.surface, borderRadius: 8, padding: 10,
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                                    <span style={{ color: C.text, fontSize: 12.5, fontWeight: 700 }}>{ind.name}</span>
                                                    <Badge text={ind.severity || '-'} variant={severityVariant(ind.severity)} />
                                                </div>
                                                <div style={{ color: C.textSec, fontSize: 11, lineHeight: 1.5 }}>{ind.evidence}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {ar.risk_assessment && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={riskItems.some(([, r]) => r?.level === '높음') ? C.dangerText : riskItems.some(([, r]) => r?.level === '중간') ? C.warnText : C.border}>
                                    <SectionTitle
                                        icon="🛡️" text="위험 평가" color={C.dangerText}
                                        right={riskItems.some(([, r]) => r?.level === '높음' || r?.level === '중간') && (
                                            <Btn variant="danger" onClick={() => navTo('risk')} style={{ fontSize: 11, padding: '4px 10px' }}>→ 위험감지</Btn>
                                        )}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
                                        {riskItems.map(([label, r]) => (
                                            <div key={label} style={{ background: C.surface, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                                                <div style={{ color: C.textMut, fontSize: 10.5, marginBottom: 4 }}>{label}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                                    <RiskDot level={r?.level} />
                                                    <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{r?.level || '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {riskItems.filter(([, r]) => r?.evidence?.length).map(([label, r]) => (
                                        <div key={label} style={{ marginBottom: 6 }}>
                                            <div style={{ color: C.textMut, fontSize: 10.5, fontWeight: 600 }}>{label} 근거:</div>
                                            {r.evidence.map((e, i) => (<div key={i} style={{ color: C.text, fontSize: 11.5, paddingLeft: 10 }}>• {e}</div>))}
                                        </div>
                                    ))}
                                </Card>
                            )}

                            {ar.differential_considerations?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="🔬" text="감별 임상 고려사항 (진단 아님)" />
                                    <div style={{ display: 'grid', gap: 10 }}>
                                        {ar.differential_considerations.map((d, i) => (
                                            <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                                    <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{d.consideration}</span>
                                                    <Badge text={`가능성 ${d.likelihood}`} variant={severityVariant(d.likelihood)} />
                                                    {d.dsm5_reference && <Badge text={d.dsm5_reference} variant="default" />}
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 8 }}>
                                                    <div style={{ background: C.successBg, borderRadius: 8, padding: 10 }}>
                                                        <div style={{ color: C.successText, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✓ 지지 증거</div>
                                                        {d.supporting_evidence?.map((e, j) => (<div key={j} style={{ color: C.text, fontSize: 11.5, paddingLeft: 6 }}>• {e}</div>))}
                                                    </div>
                                                    <div style={{ background: C.dangerBg, borderRadius: 8, padding: 10 }}>
                                                        <div style={{ color: C.dangerText, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✗ 반대 증거</div>
                                                        {d.against_evidence?.map((e, j) => (<div key={j} style={{ color: C.text, fontSize: 11.5, paddingLeft: 6 }}>• {e}</div>))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {ar.strengths_resilience?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.successText}>
                                    <SectionTitle icon="💚" text="강점·회복탄력성" color={C.successText} />
                                    {ar.strengths_resilience.map((s, i) => (
                                        <div key={i} style={{ padding: '6px 0', borderBottom: i < ar.strengths_resilience.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                                            <div style={{ color: C.text, fontSize: 12.5, fontWeight: 600 }}>✓ {s.strength}</div>
                                            {s.evidence && <div style={{ color: C.textSec, fontSize: 11, marginLeft: 14, marginTop: 2 }}>{s.evidence}</div>}
                                        </div>
                                    ))}
                                </Card>
                            )}

                            {ar.post_drawing_inquiry?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle
                                        icon="❓" text="사후 질문 (PDI) — 답변 기록"
                                        right={<Btn variant="secondary" onClick={savePdi} style={{ fontSize: 11, padding: '4px 12px' }}>💾 답변 저장</Btn>}
                                    />
                                    <div style={{ fontSize: 11, color: C.textMut, marginBottom: 8 }}>
                                        저장된 답변은 다음 그림 분석·종합 해석·종단 검토에 자동 반영됩니다.
                                    </div>
                                    {ar.post_drawing_inquiry.map((q, i) => (
                                        <div key={i} style={{
                                            background: C.blueLight, borderRadius: 10, padding: 12, marginBottom: 8,
                                        }}>
                                            <div style={{ color: C.blueDark, fontSize: 13, fontWeight: 700, lineHeight: 1.5, marginBottom: 4 }}>
                                                Q{i + 1}. "{q.question}"
                                            </div>
                                            <div style={{ color: C.textSec, fontSize: 11, fontStyle: 'italic', marginBottom: 8 }}>
                                                ↳ 확인 가설: {q.rationale}
                                            </div>
                                            <textarea
                                                placeholder="환자 답변을 기록하세요..."
                                                value={pdiDraft[q.question] || ''}
                                                onChange={e => setPdiDraft(p => ({ ...p, [q.question]: e.target.value }))}
                                                style={{
                                                    width: '100%', minHeight: 50, padding: 10,
                                                    borderRadius: 8, border: `1px solid ${C.border}`,
                                                    fontSize: 12, fontFamily: 'inherit', resize: 'vertical',
                                                    background: '#fff',
                                                }}
                                            />
                                        </div>
                                    ))}
                                </Card>
                            )}

                            <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.blue}>
                                <SectionTitle icon="📋" text="종합 임상 소견" color={C.blue} />
                                <Block text={ar.clinical_impression} bg={C.blueLight} />
                            </Card>

                            {ar.integrated_formulation && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.blueDark}>
                                    <SectionTitle icon="🧬" text="통합 사례공식화 (Bio-Psycho-Social)" color={C.blueDark} />
                                    <Block text={ar.integrated_formulation} />
                                </Card>
                            )}

                            {ar.recommendations && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle
                                        icon="💡" text="권고사항 (클릭하여 실행)"
                                        right={nextSuggestion && promptMeta[nextSuggestion] && !sessions[nextSuggestion] && (
                                            <Btn variant="primary" onClick={() => switchTo(nextSuggestion)} style={{ fontSize: 11, padding: '6px 12px' }}>
                                                → 다음 추천: {promptMeta[nextSuggestion].l}
                                            </Btn>
                                        )}
                                    />
                                    {[
                                        ['🚨 즉시 조치', rec.immediate, C.dangerBg, C.dangerText],
                                        ['🔬 추가 평가', rec.additional_assessment, C.blueLight, C.blue],
                                        ['💊 치료적 권고', rec.therapeutic, C.successBg, C.successText],
                                        ['📅 경과 모니터링', rec.follow_up, C.surface, C.text],
                                    ].map(([title, items, bg, clr]) => items?.length > 0 && (
                                        <div key={title} style={{ marginBottom: 14 }}>
                                            <div style={{ color: clr, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{title}</div>
                                            {items.map((it, i) => {
                                                const actions = parseActions(it, sessions);
                                                return (
                                                    <div key={i} style={{ background: bg, borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
                                                        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.55, marginBottom: actions.length ? 6 : 0 }}>
                                                            • {it}
                                                        </div>
                                                        {actions.length > 0 && (
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                                                {actions.map((a, j) => (
                                                                    <button key={j} onClick={() => handleAction(a)}
                                                                        style={{
                                                                            background: a.type === 'draw' && a.done ? C.successBg : '#fff',
                                                                            border: `1px solid ${a.type === 'draw' && a.done ? C.successText : C.blue}`,
                                                                            color: a.type === 'draw' && a.done ? C.successText : C.blue,
                                                                            fontSize: 11, fontWeight: 600,
                                                                            padding: '5px 10px', borderRadius: 16,
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        {a.type === 'draw' && a.done ? '✓ ' : '→ '}{a.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </Card>
                            )}

                            {ar.limitations_disclaimer && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.warnText}>
                                    <SectionTitle icon="⚠️" text="한계 및 면책 조항" color={C.warnText} />
                                    <div style={{
                                        background: C.warnBg, borderRadius: 8, padding: 12,
                                        color: C.text, fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                                    }}>
                                        {ar.limitations_disclaimer}
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Integrated HTP report */}
                    {integrated && !integrated.error && (
                        <div style={{ marginTop: 16 }}>
                            <Card style={{
                                padding: m ? 16 : 24, marginBottom: 12,
                                background: `linear-gradient(135deg, ${C.blueLight}, #EBF5FF)`,
                            }} borderColor={C.blueDark}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 22 }}>🧬</span>
                                    <div>
                                        <div style={{ color: C.blueDark, fontSize: 16, fontWeight: 800 }}>
                                            종합 HTP 해석 — {test.label}
                                        </div>
                                        <div style={{ color: C.textSec, fontSize: 11 }}>
                                            {patient.name} · {completedCount}개 그림 크로스-드로잉 통합
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <Badge text={`신뢰도: ${integrated.confidence?.level || '-'}`} variant={integrated.confidence?.level === '높음' ? 'success' : 'blue'} />
                                    </div>
                                </div>
                                <Block text={integrated.executive_summary} bg="#fff" />
                            </Card>

                            {integrated.cross_drawing_themes?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="🎭" text="공통 주제 (Cross-Drawing Themes)" />
                                    {integrated.cross_drawing_themes.map((t, i) => (
                                        <div key={i} style={{ background: C.surface, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                                            <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>◆ {t.theme}</div>
                                            <div style={{ color: C.textSec, fontSize: 11.5, lineHeight: 1.6 }}>{t.evidence_across}</div>
                                        </div>
                                    ))}
                                </Card>
                            )}

                            {integrated.consistency_analysis && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="⚖️" text="일관성·모순 분석" />
                                    <Block text={integrated.consistency_analysis} />
                                </Card>
                            )}

                            {integrated.per_drawing_contribution && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="🔀" text="그림별 고유 기여" />
                                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 10 }}>
                                        {promptOrder.map(k => integrated.per_drawing_contribution[k] && sessions[k] && (
                                            <div key={k} style={{ background: C.surface, borderRadius: 8, padding: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                    <span style={{ fontSize: 16 }}>{promptMeta[k].e}</span>
                                                    <span style={{ color: C.text, fontWeight: 700, fontSize: 12.5 }}>{promptMeta[k].l}</span>
                                                </div>
                                                <div style={{ color: C.textSec, fontSize: 11.5, lineHeight: 1.6 }}>{integrated.per_drawing_contribution[k]}</div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {integrated.scale_integration && integrated.scale_integration !== '척도 미시행' && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.successText}>
                                    <SectionTitle icon="📊" text="척도-그림 통합 검증" color={C.successText} />
                                    <Block text={integrated.scale_integration} bg={C.successBg} />
                                </Card>
                            )}

                            {integrated.verbalization_synthesis && integrated.verbalization_synthesis !== '발화 기록 없음' && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor="#7C3AED">
                                    <SectionTitle icon="🎙️" text="발화 종합 분석" color="#6D28D9" />
                                    <Block text={integrated.verbalization_synthesis} bg="#F3E8FF" />
                                </Card>
                            )}

                            {integrated.integrated_psychodynamics && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.blue}>
                                    <SectionTitle icon="🧠" text="통합 정신역동" color={C.blue} />
                                    <Block text={integrated.integrated_psychodynamics} bg={C.blueLight} />
                                </Card>
                            )}

                            {integrated.refined_differential?.length > 0 && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="🎯" text="재조정된 감별 진단" />
                                    {integrated.refined_differential.map((d, i) => (
                                        <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{d.consideration}</span>
                                                <Badge text={`가능성 ${d.likelihood}`} variant={severityVariant(d.likelihood)} />
                                            </div>
                                            {d.evidence && <div style={{ color: C.textSec, fontSize: 11.5, marginBottom: 4 }}><b style={{ color: C.textMut }}>증거:</b> {d.evidence}</div>}
                                            {d.rationale && <div style={{ color: C.text, fontSize: 12, lineHeight: 1.55 }}><b style={{ color: C.blue }}>판단:</b> {d.rationale}</div>}
                                        </div>
                                    ))}
                                </Card>
                            )}

                            {integrated.refined_risk && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={integrated.refined_risk.overall_level === '높음' ? C.dangerText : integrated.refined_risk.overall_level === '중간' ? C.warnText : C.successText}>
                                    <SectionTitle
                                        icon="🛡️" text="재평가된 위험 프로파일" color={C.dangerText}
                                        right={<Badge text={`전체 ${integrated.refined_risk.overall_level || '-'}`} variant={severityVariant(integrated.refined_risk.overall_level)} />}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : 'repeat(5,1fr)', gap: 8, marginBottom: 10 }}>
                                        {[
                                            ['자해', integrated.refined_risk.self_harm],
                                            ['자살', integrated.refined_risk.suicidality],
                                            ['공격성', integrated.refined_risk.violence],
                                            ['정신병적', integrated.refined_risk.psychosis],
                                            ['외상', integrated.refined_risk.trauma],
                                        ].map(([l, v]) => (
                                            <div key={l} style={{ background: C.surface, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                                                <div style={{ color: C.textMut, fontSize: 10.5 }}>{l}</div>
                                                <div style={{ color: C.text, fontSize: 12, fontWeight: 700, marginTop: 2 }}>{v || '-'}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {integrated.refined_risk.notes && <Block text={integrated.refined_risk.notes} />}
                                </Card>
                            )}

                            {integrated.treatment_plan && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.successText}>
                                    <SectionTitle icon="📋" text="통합 치료 계획" color={C.successText} />
                                    {[
                                        ['🚨 즉시 조치', integrated.treatment_plan.immediate_actions, C.dangerBg],
                                        ['🎯 단기 목표', integrated.treatment_plan.short_term_goals, C.warnBg],
                                        ['🏁 장기 목표', integrated.treatment_plan.long_term_goals, C.blueLight],
                                        ['💊 권고 치료 양식', integrated.treatment_plan.recommended_modalities, C.successBg],
                                        ['🔬 추가 평가', integrated.treatment_plan.additional_assessments, C.surface],
                                    ].map(([title, items, bg]) => items?.length > 0 && (
                                        <div key={title} style={{ marginBottom: 10 }}>
                                            <div style={{ color: C.text, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{title}</div>
                                            {items.map((it, i) => {
                                                const actions = parseActions(it, sessions);
                                                return (
                                                    <div key={i} style={{ background: bg, borderRadius: 6, padding: '8px 12px', marginBottom: 4 }}>
                                                        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>• {it}</div>
                                                        {actions.length > 0 && (
                                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                                                                {actions.map((a, j) => (
                                                                    <button key={j} onClick={() => handleAction(a)}
                                                                        style={{
                                                                            background: '#fff', border: `1px solid ${C.blue}`,
                                                                            color: C.blue, fontSize: 10.5, fontWeight: 600,
                                                                            padding: '3px 8px', borderRadius: 12, cursor: 'pointer',
                                                                        }}
                                                                    >→ {a.label}</button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </Card>
                            )}

                            {integrated.prognosis && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                                    <SectionTitle icon="🔮" text="예후" />
                                    <Block text={integrated.prognosis} />
                                </Card>
                            )}

                            {integrated.limitations && (
                                <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.warnText}>
                                    <SectionTitle icon="⚠️" text="통합 해석의 한계" color={C.warnText} />
                                    <Block text={integrated.limitations} bg={C.warnBg} />
                                </Card>
                            )}
                        </div>
                    )}

                    {integrated?.error && (
                        <Card style={{ padding: 16, marginTop: 16 }} borderColor={C.dangerText}>
                            <div style={{ color: C.dangerText, fontSize: 12 }}>⚠ 종합 해석 오류: {integrated.error}</div>
                        </Card>
                    )}
                </>
            )}

            {/* --- Longitudinal Report (patient-wide) --- */}
            {patient && longitudinal && !longitudinal.error && (
                <div style={{ marginTop: 20 }}>
                    <Card style={{
                        padding: m ? 16 : 24, marginBottom: 12,
                        background: `linear-gradient(135deg, #F3E8FF, #FAF5FF)`,
                    }} borderColor="#7C3AED">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 22 }}>📈</span>
                            <div>
                                <div style={{ color: '#6D28D9', fontSize: 16, fontWeight: 800 }}>
                                    종단 임상 검토 — {patient.name}
                                </div>
                                <div style={{ color: C.textSec, fontSize: 11 }}>
                                    {longitudinal.total_tests}회 검사 · 기간: {longitudinal.time_span} · 경과: <b>{longitudinal.trajectory}</b>
                                </div>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <Badge text={`신뢰도: ${longitudinal.confidence?.level || '-'}`} variant={longitudinal.confidence?.level === '높음' ? 'success' : 'blue'} />
                            </div>
                        </div>
                        <Block text={longitudinal.patient_summary} bg="#fff" />
                    </Card>

                    {/* Timeline */}
                    {longitudinal.timeline?.length > 0 && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                            <SectionTitle icon="🕐" text="검사별 타임라인" />
                            <div style={{ position: 'relative', paddingLeft: 24 }}>
                                <div style={{
                                    position: 'absolute', left: 8, top: 8, bottom: 8,
                                    width: 2, background: C.border,
                                }} />
                                {longitudinal.timeline.map((t, i) => (
                                    <div key={i} style={{ position: 'relative', marginBottom: 14 }}>
                                        <div style={{
                                            position: 'absolute', left: -20, top: 4,
                                            width: 12, height: 12, borderRadius: '50%',
                                            background: C.blue, border: `3px solid #fff`,
                                            boxShadow: `0 0 0 2px ${C.blue}`,
                                        }} />
                                        <div style={{ background: C.surface, borderRadius: 8, padding: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                                <Badge text={t.label || `#${i + 1}`} variant="blue" />
                                                <span style={{ color: C.textMut, fontSize: 11 }}>{t.date}</span>
                                            </div>
                                            <div style={{ color: C.text, fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{t.summary}</div>
                                            {t.key_change && (
                                                <div style={{ color: C.textSec, fontSize: 11, fontStyle: 'italic' }}>
                                                    ⟶ {t.key_change}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Risk trajectory */}
                    {longitudinal.risk_trajectory && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.dangerText}>
                            <SectionTitle icon="📉" text="위험 수준 변화 궤적" color={C.dangerText} />
                            <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 8 }}>
                                {[
                                    ['자해', longitudinal.risk_trajectory.self_harm],
                                    ['자살', longitudinal.risk_trajectory.suicidality],
                                    ['공격성', longitudinal.risk_trajectory.violence],
                                    ['정신병적', longitudinal.risk_trajectory.psychosis],
                                    ['외상', longitudinal.risk_trajectory.trauma],
                                ].map(([label, v]) => v && (
                                    <div key={label} style={{ background: C.surface, borderRadius: 8, padding: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                            <span style={{ fontSize: 14 }}>{trajectoryIcon(v)}</span>
                                            <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{label}</span>
                                            <Badge text={v.split(' ')[0] || ''} variant={severityVariant(v)} />
                                        </div>
                                        <div style={{ color: C.textSec, fontSize: 11, lineHeight: 1.5 }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Themes evolution */}
                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
                        {longitudinal.stable_themes?.length > 0 && (
                            <Card style={{ padding: m ? 12 : 14 }}>
                                <SectionTitle icon="⚪" text="지속 주제" />
                                {longitudinal.stable_themes.map((t, i) => (
                                    <div key={i} style={{ fontSize: 12, color: C.text, padding: '4px 0' }}>• {t}</div>
                                ))}
                            </Card>
                        )}
                        {longitudinal.emerging_themes?.length > 0 && (
                            <Card style={{ padding: m ? 12 : 14 }} borderColor={C.warnText}>
                                <SectionTitle icon="🆕" text="새로 출현한 주제" color={C.warnText} />
                                {longitudinal.emerging_themes.map((t, i) => (
                                    <div key={i} style={{ fontSize: 12, color: C.text, padding: '4px 0' }}>• {t}</div>
                                ))}
                            </Card>
                        )}
                        {longitudinal.resolved_themes?.length > 0 && (
                            <Card style={{ padding: m ? 12 : 14 }} borderColor={C.successText}>
                                <SectionTitle icon="✅" text="해결·약화된 주제" color={C.successText} />
                                {longitudinal.resolved_themes.map((t, i) => (
                                    <div key={i} style={{ fontSize: 12, color: C.text, padding: '4px 0' }}>• {t}</div>
                                ))}
                            </Card>
                        )}
                    </div>

                    {/* Differential evolution */}
                    {longitudinal.differential_evolution?.length > 0 && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                            <SectionTitle icon="🔄" text="감별 진단의 변화" />
                            {longitudinal.differential_evolution.map((d, i) => (
                                <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                                    <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{d.consideration}</div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                                        <Badge text={`초기: ${d.initial}`} variant={severityVariant(d.initial)} />
                                        <span style={{ color: C.textMut }}>→</span>
                                        <Badge text={`현재: ${d.current}`} variant={severityVariant(d.current)} />
                                    </div>
                                    {d.interpretation && <div style={{ color: C.textSec, fontSize: 12, lineHeight: 1.55 }}>{d.interpretation}</div>}
                                </div>
                            ))}
                        </Card>
                    )}

                    {/* Symptom evolution */}
                    {longitudinal.symptom_evolution?.length > 0 && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                            <SectionTitle icon="📊" text="증상·영역별 변화" />
                            <div style={{ display: 'grid', gap: 6 }}>
                                {longitudinal.symptom_evolution.map((s, i) => (
                                    <div key={i} style={{
                                        display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 80px 20px 80px 2fr',
                                        gap: 8, alignItems: 'center',
                                        background: C.surface, borderRadius: 8, padding: 10,
                                    }}>
                                        <div style={{ color: C.text, fontSize: 12.5, fontWeight: 700 }}>{s.domain}</div>
                                        <Badge text={s.initial_severity} variant={severityVariant(s.initial_severity)} />
                                        <span style={{ color: C.textMut, fontSize: 13, textAlign: 'center' }}>→</span>
                                        <Badge text={s.current_severity} variant={severityVariant(s.current_severity)} />
                                        <div style={{ color: C.textSec, fontSize: 11.5 }}>{s.change}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {longitudinal.scale_trajectory?.length > 0 && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.successText}>
                            <SectionTitle icon="📊" text="척도 점수 추이" color={C.successText} />
                            <div style={{ display: 'grid', gap: 6 }}>
                                {longitudinal.scale_trajectory.map((s, i) => (
                                    <div key={i} style={{
                                        display: 'grid',
                                        gridTemplateColumns: m ? '1fr' : '100px 1fr 20px 1fr 80px 2fr',
                                        gap: 8, alignItems: 'center',
                                        background: C.surface, borderRadius: 8, padding: 10,
                                    }}>
                                        <div style={{ color: C.text, fontSize: 12.5, fontWeight: 700 }}>{s.scale}</div>
                                        <div style={{ color: C.text, fontSize: 11.5 }}>{s.initial}</div>
                                        <span style={{ color: C.textMut, fontSize: 13, textAlign: 'center' }}>→</span>
                                        <div style={{ color: C.text, fontSize: 11.5 }}>{s.current}</div>
                                        <Badge text={s.trend} variant={severityVariant(s.trend)} />
                                        <div style={{ color: C.textSec, fontSize: 11 }}>{s.interpretation}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {longitudinal.treatment_response && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.blue}>
                            <SectionTitle icon="💊" text="치료 반응 평가" color={C.blue} />
                            <Block text={longitudinal.treatment_response} bg={C.blueLight} />
                        </Card>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        {longitudinal.clinical_concerns?.length > 0 && (
                            <Card style={{ padding: m ? 12 : 14 }} borderColor={C.dangerText}>
                                <SectionTitle icon="⚠️" text="우려 지점" color={C.dangerText} />
                                {longitudinal.clinical_concerns.map((c, i) => (
                                    <div key={i} style={{ fontSize: 12, color: C.text, padding: '4px 0' }}>• {c}</div>
                                ))}
                            </Card>
                        )}
                        {longitudinal.progress_markers?.length > 0 && (
                            <Card style={{ padding: m ? 12 : 14 }} borderColor={C.successText}>
                                <SectionTitle icon="✨" text="긍정적 변화 지표" color={C.successText} />
                                {longitudinal.progress_markers.map((p, i) => (
                                    <div key={i} style={{ fontSize: 12, color: C.text, padding: '4px 0' }}>• {p}</div>
                                ))}
                            </Card>
                        )}
                    </div>

                    {longitudinal.strengths_evolution && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                            <SectionTitle icon="💚" text="강점·자원의 변화" color={C.successText} />
                            <Block text={longitudinal.strengths_evolution} bg={C.successBg} />
                        </Card>
                    )}

                    {longitudinal.recommended_adjustments && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }}>
                            <SectionTitle icon="🔧" text="치료 계획 조정 권고" />
                            {[
                                ['💊 치료적 조정', longitudinal.recommended_adjustments.therapeutic, C.successBg, C.successText],
                                ['🔬 추가 평가', longitudinal.recommended_adjustments.assessment, C.blueLight, C.blue],
                                ['📅 모니터링', longitudinal.recommended_adjustments.monitoring, C.surface, C.text],
                            ].map(([title, items, bg, clr]) => items?.length > 0 && (
                                <div key={title} style={{ marginBottom: 10 }}>
                                    <div style={{ color: clr, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{title}</div>
                                    {items.map((it, i) => {
                                        const actions = parseActions(it, sessions);
                                        return (
                                            <div key={i} style={{ background: bg, borderRadius: 6, padding: '8px 12px', marginBottom: 4 }}>
                                                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>• {it}</div>
                                                {actions.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                                                        {actions.map((a, j) => (
                                                            <button key={j} onClick={() => handleAction(a)}
                                                                style={{
                                                                    background: '#fff', border: `1px solid ${C.blue}`,
                                                                    color: C.blue, fontSize: 10.5, fontWeight: 600,
                                                                    padding: '3px 8px', borderRadius: 12, cursor: 'pointer',
                                                                }}
                                                            >→ {a.label}</button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </Card>
                    )}

                    {longitudinal.overall_prognosis_update && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.blueDark}>
                            <SectionTitle icon="🔮" text="갱신된 예후" color={C.blueDark} />
                            <Block text={longitudinal.overall_prognosis_update} />
                            {longitudinal.next_review_timing && (
                                <div style={{
                                    marginTop: 10, padding: '8px 12px',
                                    background: C.blueLight, borderRadius: 8,
                                    fontSize: 12, color: C.blueDark,
                                }}>
                                    📅 <b>다음 평가 권장:</b> {longitudinal.next_review_timing}
                                </div>
                            )}
                        </Card>
                    )}

                    {longitudinal.limitations && (
                        <Card style={{ padding: m ? 14 : 20, marginBottom: 12 }} borderColor={C.warnText}>
                            <SectionTitle icon="⚠️" text="종단 검토의 한계" color={C.warnText} />
                            <Block text={longitudinal.limitations} bg={C.warnBg} />
                        </Card>
                    )}
                </div>
            )}

            {longitudinal?.error && (
                <Card style={{ padding: 16, marginTop: 16 }} borderColor={C.dangerText}>
                    <div style={{ color: C.dangerText, fontSize: 12 }}>⚠ 종단 검토 오류: {longitudinal.error}</div>
                </Card>
            )}

            {/* Modals */}
            {showNewPatient && (
                <NewPatientModal
                    onClose={() => setShowNewPatient(false)}
                    onCreate={createPatient}
                />
            )}

            {showInterview && patient && test && (
                <div onClick={() => setShowInterview(false)} style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)',
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: '#fff', borderRadius: 16, padding: 24,
                        width: '90%', maxWidth: 640, maxHeight: '85vh',
                        overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>📝 {test.label} 임상 면담</div>
                                <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>
                                    {patient.name} · 이번 검사에만 적용되며, 모든 그림 분석·종합·종단에 반영됩니다.
                                </div>
                            </div>
                            <button onClick={() => setShowInterview(false)} style={{
                                background: C.surface, border: 'none', width: 30, height: 30, borderRadius: 8,
                                fontSize: 15, cursor: 'pointer',
                            }}>✕</button>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.textMut, marginBottom: 6 }}>
                            현재 주호소 경과, 최근 생활 사건, 치료 반응, 자해·자살사고, 지지체계 변화 등
                        </div>
                        <textarea
                            placeholder="• 이번 기간 동안의 증상 경과&#10;• 생활 사건, 스트레스 요인&#10;• 약물/치료 변경 사항 및 반응&#10;• 자해·자살사고·위험 행동&#10;• 수면·식욕·사회적 기능&#10;• 가족·대인관계 변화"
                            value={interview.notes || ''}
                            onChange={e => saveInterview(e.target.value)}
                            style={{
                                width: '100%', minHeight: 260, padding: 12,
                                border: `1.5px solid ${C.border}`, borderRadius: 10,
                                fontSize: 13, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6,
                            }}
                        />
                        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <Btn variant="ghost" onClick={() => setShowInterview(false)} style={{ fontSize: 12 }}>닫기 (자동 저장)</Btn>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
