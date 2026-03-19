import { useState, useEffect, useRef } from "react";

const C = {
  bg:"#FFFFFF",surface:"#F7F8FA",blue:"#2563EB",blueLight:"#DBEAFE",
  blueMid:"#93C5FD",blueDark:"#1D4ED8",text:"#111827",textSec:"#6B7280",
  textMut:"#9CA3AF",border:"#E5E7EB",borderLight:"#F3F4F6",
  dangerText:"#DC2626",dangerBg:"#FEF2F2",warnText:"#D97706",
  warnBg:"#FFFBEB",successText:"#059669",successBg:"#ECFDF5",
};
function useW(){const[w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w;}

/* ── Primitives ── */
function Badge({text,variant="default"}){const s={danger:{bg:C.dangerBg,color:C.dangerText},warn:{bg:C.warnBg,color:C.warnText},success:{bg:C.successBg,color:C.successText},blue:{bg:C.blueLight,color:C.blue},default:{bg:C.surface,color:C.textSec}}[variant];return<span style={{background:s.bg,color:s.color,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap"}}>{text}</span>;}
function Btn({children,variant="primary",onClick,disabled,style:sx}){const b={border:"none",borderRadius:10,cursor:disabled?"not-allowed":"pointer",fontWeight:600,fontSize:13,transition:"all .15s",display:"inline-flex",alignItems:"center",gap:6,WebkitTapHighlightColor:"transparent",...sx};if(variant==="primary")Object.assign(b,{background:C.blue,color:"#fff",padding:"10px 20px",opacity:disabled?.5:1});if(variant==="secondary")Object.assign(b,{background:C.blueLight,color:C.blue,padding:"8px 14px"});if(variant==="ghost")Object.assign(b,{background:"transparent",color:C.textSec,padding:"8px 10px"});if(variant==="danger")Object.assign(b,{background:C.dangerBg,color:C.dangerText,padding:"8px 14px"});return<button onClick={onClick} disabled={disabled} style={b}>{children}</button>;}
function Card({children,style:sx,borderColor}){return<div style={{background:C.bg,borderRadius:14,border:`1px solid ${borderColor||C.border}`,...sx}}>{children}</div>;}
function PBar({value,max,color}){return<div style={{width:48,height:5,background:C.borderLight,borderRadius:3,flexShrink:0}}><div style={{width:`${Math.min((value/max)*100,100)}%`,height:"100%",background:color||C.blue,borderRadius:3}}/></div>;}

/* ── Data ── */
const patients=[
  {id:1,name:"김○○",age:34,type:"재진",diagnosis:"우울장애",predictedMin:12,status:"진료중",risk:"low",scaleChange:-3,time:"09:00"},
  {id:2,name:"이○○",age:7,type:"초진",diagnosis:"ADHD 의심",predictedMin:45,status:"대기",risk:"medium",scaleChange:null,time:"09:40",isChild:true},
  {id:3,name:"박○○",age:28,type:"재진",diagnosis:"공황장애",predictedMin:15,status:"대기",risk:"high",scaleChange:5,time:"09:55"},
  {id:4,name:"최○○",age:5,type:"재진",diagnosis:"분리불안",predictedMin:25,status:"대기",risk:"medium",scaleChange:-1,time:"10:20",isChild:true},
  {id:5,name:"정○○",age:42,type:"재진",diagnosis:"조현병",predictedMin:20,status:"대기",risk:"low",scaleChange:-2,time:"10:45"},
  {id:6,name:"강○○",age:19,type:"초진",diagnosis:"사회불안장애",predictedMin:35,status:"대기",risk:"medium",scaleChange:null,time:"11:05"},
  {id:7,name:"윤○○",age:4,type:"초진",diagnosis:"발달지연 의심",predictedMin:50,status:"대기",risk:"medium",scaleChange:null,time:"11:40",isChild:true},
  {id:8,name:"한○○",age:55,type:"재진",diagnosis:"양극성장애",predictedMin:18,status:"대기",risk:"low",scaleChange:-4,time:"12:30"},
];
const weeklyStats=[{day:"월",w:12},{day:"화",w:18},{day:"수",w:8},{day:"목",w:15},{day:"금",w:22}];
const childGames=[
  {id:"memory",name:"기억력 게임",icon:"🧩",desc:"카드 뒤집기로 작업기억 측정",domain:"작업기억",age:"3-7세"},
  {id:"pattern",name:"패턴 찾기",icon:"🔷",desc:"규칙 발견으로 유동추론 측정",domain:"유동추론",age:"4-7세"},
  {id:"story",name:"이야기 만들기",icon:"📖",desc:"그림보고 이야기 구성",domain:"언어·정서",age:"3-7세"},
  {id:"maze",name:"미로 탈출",icon:"🏰",desc:"길찾기로 시공간 처리 측정",domain:"시공간",age:"4-7세"},
  {id:"emotion",name:"감정 알아맞히기",icon:"😊",desc:"표정 인식으로 사회인지 측정",domain:"사회인지",age:"3-7세"},
  {id:"speed",name:"두더지 잡기",icon:"⚡",desc:"반응속도 및 주의력 측정",domain:"처리속도",age:"3-7세"},
];

/* ══════ 1. DASHBOARD ══════ */
function Dashboard(){
  const m=useW()<768;
  const[ct,setCt]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setCt(new Date()),1000);return()=>clearInterval(t);},[]);
  const tp=patients.reduce((a,p)=>a+p.predictedMin,0);
  const hr=patients.filter(p=>p.risk==="high").length;
  return(<div>
    <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",marginBottom:m?16:24,gap:8}}>
      <div><h2 style={{color:C.text,fontSize:m?18:21,fontWeight:700,margin:0}}>오늘의 진료실</h2><p style={{color:C.textSec,fontSize:12,margin:"4px 0 0"}}>{ct.toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"})}</p></div>
      <Badge text="정상 운영 중" variant="success"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:m?"1fr 1fr":"repeat(4,1fr)",gap:m?10:14,marginBottom:m?16:24}}>
      {[{l:"오늘 예약",v:`${patients.length}명`,s:"초진 3·재진 5",i:"👥",b:true},{l:"예상 진료",v:`${Math.floor(tp/60)}h ${tp%60}m`,s:"AI 예측",i:"⏱"},{l:"평균 대기",v:"8분",s:"목표 10분",i:"⏳"},{l:"위험 알림",v:`${hr}건`,s:"척도 악화",i:"🚨"}].map((s,i)=>(
        <div key={i} style={{background:s.b?C.blueLight:C.surface,borderRadius:12,padding:m?"14px 16px":"18px 22px",border:`1px solid ${s.b?C.blueMid:C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{color:C.textSec,fontSize:11,marginBottom:4}}>{s.l}</div><div style={{color:s.b?C.blueDark:C.text,fontSize:m?20:26,fontWeight:700}}>{s.v}</div><div style={{color:C.textMut,fontSize:10,marginTop:2}}>{s.s}</div></div><span style={{fontSize:18,opacity:.6}}>{s.i}</span></div>
        </div>))}
    </div>
    <Card style={{overflow:"hidden",marginBottom:m?16:20}}>
      <div style={{padding:m?"12px 16px":"14px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}><span style={{color:C.text,fontWeight:600,fontSize:14}}>진료 타임라인</span><span style={{color:C.textMut,fontSize:11}}>AI 정확도 91.3%</span></div>
      {m?patients.map((p,i)=>(
        <div key={p.id} style={{padding:"12px 16px",borderBottom:i<patients.length-1?`1px solid ${C.borderLight}`:"none",background:p.status==="진료중"?C.blueLight:"transparent"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:C.text,fontWeight:600,fontSize:13,fontFamily:"monospace"}}>{p.time}</span><span style={{color:C.text,fontSize:14,fontWeight:600}}>{p.name}{p.isChild?" 👶":""}</span></div>
            <Badge text={p.status} variant={p.status==="진료중"?"blue":"default"}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><span style={{color:C.textSec,fontSize:12}}>{p.diagnosis}</span><span style={{color:C.textMut,fontSize:11,marginLeft:6}}>{p.type}·{p.age}세</span></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Badge text={p.risk==="high"?"고위험":p.risk==="medium"?"주의":"안정"} variant={p.risk==="high"?"danger":p.risk==="medium"?"warn":"success"}/>
              <span style={{color:C.textSec,fontSize:11}}>{p.predictedMin}분</span>
              {p.scaleChange!=null?<span style={{color:p.scaleChange>0?C.dangerText:C.successText,fontSize:11,fontWeight:600}}>{p.scaleChange>0?`▲${p.scaleChange}`:`▼${Math.abs(p.scaleChange)}`}</span>:<span style={{color:C.textMut,fontSize:10}}>신규</span>}
            </div></div></div>
      )):patients.map((p,i)=>(
        <div key={p.id} style={{display:"grid",gridTemplateColumns:"64px 90px 1fr 100px 70px 70px 60px",alignItems:"center",padding:"12px 22px",gap:10,borderBottom:i<patients.length-1?`1px solid ${C.borderLight}`:"none",background:p.status==="진료중"?C.blueLight:"transparent"}}>
          <span style={{color:C.text,fontWeight:600,fontSize:13,fontFamily:"monospace"}}>{p.time}</span>
          <span style={{color:C.text,fontSize:13,fontWeight:500}}>{p.name}{p.isChild?" 👶":""}</span>
          <div><span style={{color:C.textSec,fontSize:12}}>{p.diagnosis}</span><span style={{color:C.textMut,fontSize:11,marginLeft:8}}>{p.type}·{p.age}세</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><PBar value={p.predictedMin} max={50}/><span style={{color:C.textSec,fontSize:11}}>{p.predictedMin}분</span></div>
          <Badge text={p.risk==="high"?"고위험":p.risk==="medium"?"주의":"안정"} variant={p.risk==="high"?"danger":p.risk==="medium"?"warn":"success"}/>
          <Badge text={p.status} variant={p.status==="진료중"?"blue":"default"}/>
          {p.scaleChange!=null?<span style={{color:p.scaleChange>0?C.dangerText:C.successText,fontSize:12,fontWeight:600}}>{p.scaleChange>0?`▲${p.scaleChange}`:`▼${Math.abs(p.scaleChange)}`}</span>:<span style={{color:C.textMut,fontSize:11}}>신규</span>}
        </div>))}
    </Card>
    <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:14}}>
      <Card style={{padding:m?16:22}}><div style={{color:C.text,fontWeight:600,fontSize:14,marginBottom:18}}>주간 대기시간</div><div style={{display:"flex",alignItems:"flex-end",gap:m?10:14,height:100}}>{weeklyStats.map((d,i)=>(<div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:d.w*4,borderRadius:"5px 5px 0 0",background:d.w>15?C.dangerBg:C.blue,position:"relative"}}><span style={{position:"absolute",top:-16,left:"50%",transform:"translateX(-50%)",color:C.textSec,fontSize:10,fontWeight:600}}>{d.w}</span></div><div style={{color:C.textSec,fontSize:11,marginTop:6}}>{d.day}</div></div>))}</div></Card>
      <Card style={{padding:m?16:22}}><div style={{color:C.text,fontWeight:600,fontSize:14,marginBottom:18}}>AI 스케줄링 효과</div>{[{l:"대기 단축",v:"-42%",p:42},{l:"노쇼 감소",v:"-67%",p:67},{l:"진료 효율",v:"+31%",p:31},{l:"만족도",v:"4.6/5",p:92}].map((it,i)=>(<div key={i} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.textSec,fontSize:12}}>{it.l}</span><span style={{color:C.blue,fontWeight:700,fontSize:13}}>{it.v}</span></div><div style={{height:5,background:C.surface,borderRadius:3}}><div style={{width:`${it.p}%`,height:"100%",background:C.blue,borderRadius:3}}/></div></div>))}</Card>
    </div>
  </div>);
}

/* ══════ 2. CHILD ASSESSMENT ══════ */
function ChildAssess(){
  const m=useW()<768;
  const[ag,setAg]=useState(null);
  const[mc,setMc]=useState([]);const[fl,setFl]=useState([]);const[mt,setMt]=useState([]);const[mv,setMv]=useState(0);
  const[gst,setGst]=useState(null);const[rt,setRt]=useState([]);const[gc,setGc]=useState(false);
  const lft=useRef(null);const ej=["🐶","🐱","🐰","🦊","🐻","🐸"];
  const startMem=()=>{const c=[...ej,...ej].sort(()=>Math.random()-.5).map((e,i)=>({id:i,emoji:e}));setMc(c);setFl([]);setMt([]);setMv(0);setRt([]);setGc(false);setGst(Date.now());lft.current=Date.now();setAg("memory");};
  const flip=(id)=>{if(fl.length===2||fl.includes(id)||mt.includes(id))return;const n=Date.now();if(lft.current)setRt(p=>[...p,n-lft.current]);lft.current=n;const nf=[...fl,id];setFl(nf);if(nf.length===2){setMv(x=>x+1);if(mc[nf[0]].emoji===mc[nf[1]].emoji){const nm=[...mt,nf[0],nf[1]];setMt(nm);setFl([]);if(nm.length===mc.length)setGc(true);}else setTimeout(()=>setFl([]),800);}};

  const[moles,setMoles]=useState(Array(9).fill(false));const[ms,setMs]=useState(0);const[mti,setMti]=useState(15);const[ma,setMa]=useState(false);const[mr,setMr]=useState([]);
  const mat=useRef(null);const mir=useRef(null);const tr=useRef(null);
  const startMole=()=>{setMs(0);setMti(15);setMa(true);setMr([]);setAg("speed");tr.current=setInterval(()=>{setMti(p=>{if(p<=1){clearInterval(tr.current);clearInterval(mir.current);setMa(false);setMoles(Array(9).fill(false));return 0;}return p-1;});},1000);mir.current=setInterval(()=>{const idx=Math.floor(Math.random()*9);setMoles(()=>{const n=Array(9).fill(false);n[idx]=true;return n;});mat.current=Date.now();setTimeout(()=>setMoles(p=>{const n=[...p];n[idx]=false;return n;}),1200);},1500);};
  const hitM=(i)=>{if(!moles[i])return;setMr(p=>[...p,Date.now()-mat.current]);setMs(s=>s+1);setMoles(p=>{const n=[...p];n[i]=false;return n;});};
  useEffect(()=>()=>{clearInterval(mir.current);clearInterval(tr.current);},[]);
  const amr=mr.length>0?Math.round(mr.reduce((a,b)=>a+b,0)/mr.length):0;

  const Res=({metrics,note})=>(<Card style={{marginTop:20,padding:m?16:24}} borderColor={C.blue}><div style={{color:C.blue,fontWeight:700,fontSize:15,marginBottom:14}}>AI 분석 결과</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:m?10:16}}>{metrics.map((d,i)=><div key={i} style={{textAlign:"center"}}><div style={{color:C.textMut,fontSize:11}}>{d.l}</div><div style={{color:C.text,fontSize:m?18:22,fontWeight:700,margin:"4px 0"}}>{d.v}</div>{d.n&&<div style={{color:C.blue,fontSize:10}}>{d.n}</div>}</div>)}</div><div style={{marginTop:14,padding:12,background:C.surface,borderRadius:10}}><div style={{color:C.textSec,fontSize:11,marginBottom:4}}>📋 임상 소견</div><div style={{color:C.text,fontSize:12,lineHeight:1.7}}>{note}</div></div></Card>);

  if(ag==="memory"){const tt=gc?Math.round((Date.now()-gst)/1000):null;const ar=rt.length>0?Math.round(rt.reduce((a,b)=>a+b,0)/rt.length):0;
    return(<div><Btn variant="ghost" onClick={()=>setAg(null)}>← 목록</Btn>
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",margin:"12px 0 20px",gap:8}}><div><h2 style={{color:C.text,fontSize:m?18:20,fontWeight:700,margin:0}}>🧩 기억력 게임</h2></div><div style={{display:"flex",gap:16}}><div style={{textAlign:"center"}}><div style={{color:C.textMut,fontSize:10}}>시도</div><div style={{color:C.blue,fontSize:20,fontWeight:700}}>{mv}</div></div><div style={{textAlign:"center"}}><div style={{color:C.textMut,fontSize:10}}>매칭</div><div style={{color:C.successText,fontSize:20,fontWeight:700}}>{mt.length/2}/{ej.length}</div></div></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:m?8:12,maxWidth:380,margin:"0 auto"}}>{mc.map(c=>{const sh=fl.includes(c.id)||mt.includes(c.id);const dn=mt.includes(c.id);return<div key={c.id} onClick={()=>flip(c.id)} style={{aspectRatio:"1",borderRadius:12,background:dn?C.blueLight:sh?C.surface:C.bg,border:`2px solid ${dn?C.blue:sh?C.blueMid:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:m?28:34,cursor:"pointer",userSelect:"none"}}>{sh?c.emoji:<span style={{color:C.textMut}}>?</span>}</div>;})}</div>
      {gc&&<><Res metrics={[{l:"소요시간",v:`${tt}초`,n:"상위 35%"},{l:"시도",v:`${mv}회`,n:mv<=10?"효율적":"탐색적"},{l:"반응",v:`${ar}ms`,n:"정상"}]} note={`작업기억 ${mv}회 시도, ${ar}ms. ${mv<=10?"체계적 전략.":"시행착오, 계획능력 지원 권장."}`}/><Btn onClick={startMem} style={{marginTop:12}}>다시하기</Btn></>}
    </div>);}

  if(ag==="speed"){return(<div><Btn variant="ghost" onClick={()=>{setAg(null);setMa(false);clearInterval(mir.current);clearInterval(tr.current);}}>← 목록</Btn>
    <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",margin:"12px 0 20px",gap:8}}><div><h2 style={{color:C.text,fontSize:m?18:20,fontWeight:700,margin:0}}>⚡ 두더지 잡기</h2></div><div style={{display:"flex",gap:14,alignItems:"center"}}><div style={{textAlign:"center"}}><div style={{color:C.textMut,fontSize:10}}>점수</div><div style={{color:C.blue,fontSize:20,fontWeight:700}}>{ms}</div></div><div style={{background:mti<=5?C.dangerBg:C.blueLight,color:mti<=5?C.dangerText:C.blue,padding:"5px 12px",borderRadius:8,fontWeight:700,fontSize:17,fontFamily:"monospace"}}>{mti}초</div></div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:m?8:12,maxWidth:320,margin:"0 auto"}}>{moles.map((a,i)=><div key={i} onClick={()=>hitM(i)} style={{aspectRatio:"1",borderRadius:16,background:a?C.blueLight:C.surface,border:`2px solid ${a?C.blue:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:m?32:38,cursor:ma?"pointer":"default",transform:a?"scale(1.05)":"scale(1)",userSelect:"none"}}>{a?"🐹":"🕳️"}</div>)}</div>
    {!ma&&mti===0&&<><Res metrics={[{l:"적중률",v:`${ms}/10`},{l:"반응속도",v:`${amr}ms`},{l:"주의",v:ms>=7?"양호":ms>=4?"보통":"저하"}]} note={`적중 ${ms}/10, ${amr}ms. ${amr<500?"높은 각성.":amr<800?"또래 평균.":"정밀 평가 권장."}`}/><Btn onClick={startMole} style={{marginTop:12}}>다시하기</Btn></>}
    {!ma&&mti>0&&<div style={{textAlign:"center",marginTop:24}}><Btn onClick={startMole}>게임 시작!</Btn></div>}
  </div>);}

  return(<div>
    <div style={{marginBottom:m?16:24}}><h2 style={{color:C.text,fontSize:m?18:21,fontWeight:700,margin:0}}>아동 인지·정서 평가</h2><p style={{color:C.textSec,fontSize:12,margin:"4px 0 0"}}>게임형 평가 — AI가 데이터 수집</p></div>
    <div style={{display:"grid",gridTemplateColumns:m?"1fr 1fr":"repeat(3,1fr)",gap:m?10:14}}>{childGames.map(g=><Card key={g.id} style={{padding:m?16:22,cursor:(g.id==="memory"||g.id==="speed")?"pointer":"default"}} onClick={()=>{if(g.id==="memory")startMem();else if(g.id==="speed")setAg("speed");}}><div style={{fontSize:m?28:34,marginBottom:8}}>{g.icon}</div><div style={{color:C.text,fontWeight:600,fontSize:13,marginBottom:3}}>{g.name}</div><div style={{color:C.textSec,fontSize:11,marginBottom:10,lineHeight:1.4}}>{g.desc}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}><Badge text={g.domain} variant="blue"/><span style={{color:C.textMut,fontSize:10}}>{g.age}</span></div>{(g.id==="memory"||g.id==="speed")&&<div style={{marginTop:8,textAlign:"center",color:C.blue,fontSize:11,fontWeight:600}}>▶ 플레이</div>}</Card>)}</div>
  </div>);
}

/* ══════ 3. DRAWING TEST ══════ */
function DrawingTest(){
  const m=useW()<768;const cr=useRef(null);const[dr,setDr]=useState(false);const[tl,setTl]=useState("pen");const[lw,setLw]=useState(3);const[pr,setPr]=useState("house");const[st,setSt]=useState([]);const[cs,setCs]=useState([]);const[ar,setAr]=useState(null);const[az,setAz]=useState(false);const sr=useRef(null);
  const pm={house:{l:"집",e:"🏠",t:"집을 그려주세요"},tree:{l:"나무",e:"🌳",t:"나무를 그려주세요"},person:{l:"사람",e:"🧑",t:"사람을 그려주세요"},family:{l:"가족",e:"👨‍👩‍👧‍👦",t:"가족을 그려주세요"}};
  useEffect(()=>{const cv=cr.current;if(!cv)return;const ctx=cv.getContext("2d");cv.width=cv.offsetWidth*2;cv.height=cv.offsetHeight*2;ctx.scale(2,2);ctx.fillStyle="#FAFBFC";ctx.fillRect(0,0,cv.offsetWidth,cv.offsetHeight);sr.current=Date.now();setSt([]);setAr(null);},[pr]);
  const gp=(e)=>{const r=cr.current.getBoundingClientRect();const cx=e.touches?e.touches[0].clientX:e.clientX;const cy=e.touches?e.touches[0].clientY:e.clientY;return{x:cx-r.left,y:cy-r.top};};
  const sd=(e)=>{e.preventDefault();setDr(true);const p=gp(e);setCs([{...p,time:Date.now()}]);cr.current.getContext("2d").beginPath();cr.current.getContext("2d").moveTo(p.x,p.y);};
  const dd=(e)=>{e.preventDefault();if(!dr)return;const p=gp(e);setCs(prev=>[...prev,{...p,time:Date.now()}]);const ctx=cr.current.getContext("2d");ctx.strokeStyle=tl==="eraser"?"#FAFBFC":"#111827";ctx.lineWidth=tl==="eraser"?20:lw;ctx.lineCap="round";ctx.lineJoin="round";ctx.lineTo(p.x,p.y);ctx.stroke();};
  const ed=(e)=>{e.preventDefault();if(!dr)return;setDr(false);if(cs.length>1)setSt(prev=>[...prev,{points:cs,duration:cs[cs.length-1].time-cs[0].time}]);setCs([]);};
  const cl=()=>{const ctx=cr.current.getContext("2d");ctx.fillStyle="#FAFBFC";ctx.fillRect(0,0,cr.current.offsetWidth,cr.current.offsetHeight);setSt([]);setAr(null);sr.current=Date.now();};
  const an=()=>{setAz(true);setTimeout(()=>{const ts=st.length;const pa=[];for(let i=1;i<st.length;i++)pa.push(st[i].points[0].time-st[i-1].points[st[i-1].points.length-1].time);setAr({totalStrokes:ts,longPauses:pa.filter(p=>p>3000).length,startArea:st.length>0?(st[0].points[0].y<200?"상단":"하단"):"-",pressure:Math.round(70+Math.random()*25),detail:ts>20?"높음":ts>10?"보통":"낮음"});setAz(false);},1800);};

  return(<div>
    <div style={{marginBottom:16}}><h2 style={{color:C.text,fontSize:m?18:21,fontWeight:700,margin:0}}>디지털 그림검사 (HTP 2.0)</h2><p style={{color:C.textSec,fontSize:12,margin:"4px 0 0"}}>과정 데이터 자동 기록</p></div>
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>{Object.entries(pm).map(([k,v])=><Btn key={k} variant={pr===k?"secondary":"ghost"} onClick={()=>setPr(k)} style={{fontSize:12}}>{v.e} {v.l}</Btn>)}</div>
    <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 240px",gap:14}}>
      <Card style={{padding:m?10:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}><span style={{color:C.blue,fontSize:13,fontWeight:600}}>✏️ {pm[pr].t}</span><div style={{display:"flex",gap:4}}><Btn variant={tl==="pen"?"secondary":"ghost"} onClick={()=>setTl("pen")} style={{padding:"4px 10px",fontSize:11}}>펜</Btn><Btn variant={tl==="eraser"?"danger":"ghost"} onClick={()=>setTl("eraser")} style={{padding:"4px 10px",fontSize:11}}>지우개</Btn></div></div>
        <canvas ref={cr} onMouseDown={sd} onMouseMove={dd} onMouseUp={ed} onMouseLeave={ed} onTouchStart={sd} onTouchMove={dd} onTouchEnd={ed} style={{width:"100%",height:m?280:380,borderRadius:10,cursor:"crosshair",touchAction:"none",border:`1px solid ${C.border}`,display:"block"}}/>
        <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center",flexWrap:"wrap"}}>
          <Btn variant="danger" onClick={cl} style={{fontSize:11,padding:"5px 12px"}}>초기화</Btn>
          <input type="range" min="1" max="8" value={lw} onChange={e=>setLw(Number(e.target.value))} style={{flex:1,minWidth:60,accentColor:C.blue}}/>
          <Btn onClick={an} disabled={st.length===0||az} style={{marginLeft:"auto",fontSize:12}}>{az?"분석중...":"AI 분석"}</Btn>
        </div>
      </Card>
      <div style={{display:"flex",flexDirection:m?"row":"column",gap:10,flexWrap:"wrap"}}>
        <Card style={{padding:16,flex:1,minWidth:m?"calc(50% - 5px)":"auto"}}><div style={{color:C.text,fontWeight:600,fontSize:13,marginBottom:10}}>과정 데이터</div>{[{l:"획 수",v:`${st.length}`},{l:"경과",v:`${sr.current?Math.round((Date.now()-sr.current)/1000):0}초`}].map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<1?`1px solid ${C.borderLight}`:"none"}}><span style={{color:C.textSec,fontSize:11}}>{x.l}</span><span style={{color:C.text,fontSize:11,fontWeight:600}}>{x.v}</span></div>)}</Card>
        {ar&&<Card style={{padding:16,flex:1,minWidth:m?"calc(50% - 5px)":"auto"}} borderColor={C.blue}><div style={{color:C.blue,fontWeight:600,fontSize:13,marginBottom:10}}>AI 결과</div>{[{l:"시작",v:ar.startArea},{l:"세밀도",v:ar.detail},{l:"필압",v:`${ar.pressure}%`},{l:"멈춤",v:`${ar.longPauses}회`}].map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.borderLight}`}}><span style={{color:C.textSec,fontSize:10}}>{x.l}</span><span style={{color:C.text,fontSize:10,fontWeight:600}}>{x.v}</span></div>)}<div style={{marginTop:8,padding:8,background:C.surface,borderRadius:6}}><div style={{color:C.text,fontSize:10,lineHeight:1.5}}>{pm[pr].l}—{ar.totalStrokes}획{ar.longPauses>2?". 멈춤 빈번→불안 시사":""}{ar.detail==="높음"?". 세밀→높은 인지":""}</div></div></Card>}
      </div>
    </div>
  </div>);
}

/* ══════ 4. FULL BATTERY ══════ */
function FullBattery(){
  const m=useW()<768;const[gen,setGen]=useState(false);const[pg,setPg]=useState(0);const[rp,setRp]=useState(null);
  const go=()=>{setGen(true);setPg(0);setRp(null);[15,35,55,70,85,95,100].forEach((p,i)=>{setTimeout(()=>{setPg(p);if(p===100)setTimeout(()=>{setGen(false);setRp(RPT);},400);},( i+1)*700);});};
  const RPT={patient:"김○○",age:34,gender:"여",referral:"우울 및 불안",date:"2026-03-19",
    sections:[
      {title:"인지기능 (WAIS-IV)",summary:"IQ 112 | 언어118·지각109·작업기억105·처리속도96",detail:"평균 상 수준. 처리속도 저하는 우울감의 인지 영향 시사.",scores:[{n:"언어이해",v:118,x:150},{n:"지각추론",v:109,x:150},{n:"작업기억",v:105,x:150},{n:"처리속도",v:96,x:150}]},
      {title:"MMPI-2",summary:"2-7 코드: 우울-강박",detail:"D=78T, Pt=72T 상승. Si=65T 사회적 위축.",scores:[{n:"Hs",v:55,x:100},{n:"D",v:78,x:100},{n:"Hy",v:58,x:100},{n:"Pd",v:52,x:100},{n:"Pa",v:48,x:100},{n:"Pt",v:72,x:100},{n:"Sc",v:56,x:100},{n:"Ma",v:42,x:100}],flag:"D,Pt 임상 유의"},
      {title:"투사검사",summary:"내향형, 감정 억제, 자기상 위축",detail:"Rorschach 내향형. HTP 집 소형/문 없음. SCT 무망감.",flag:"자살사고 추가 평가 권장"},
    ],
    diagnosis:{primary:"주요우울장애, 중등도 (F32.1)",diff:["지속성 우울장애 감별","강박장애 공존 가능"],risk:"중등도 — C-SSRS 권장"},
    recs:["SSRI 고려","CBT/IPT 권장","자살위험 모니터링","4주후 재검사"],
  };
  if(!rp)return(<div><div style={{marginBottom:20}}><h2 style={{color:C.text,fontSize:m?18:21,fontWeight:700,margin:0}}>AI 종합심리검사 보고서</h2><p style={{color:C.textSec,fontSize:12,margin:"4px 0 0"}}>3~5시간 → 5분 초안</p></div><Card style={{padding:m?24:40,textAlign:"center"}}><div style={{fontSize:44,marginBottom:12}}>📋</div><div style={{color:C.text,fontSize:15,fontWeight:600,marginBottom:20}}>풀배터리 AI 통합 분석</div><div>{gen?<div><div style={{height:6,background:C.surface,borderRadius:3,maxWidth:320,margin:"0 auto",overflow:"hidden"}}><div style={{width:`${pg}%`,height:"100%",background:C.blue,borderRadius:3,transition:"width .4s"}}/></div><div style={{color:C.textMut,fontSize:11,marginTop:6}}>{pg}%</div></div>:<Btn onClick={go}>AI 보고서 생성</Btn>}</div></Card></div>);

  return(<div><div style={{marginBottom:16}}><h2 style={{color:C.text,fontSize:m?18:21,fontWeight:700,margin:0}}>AI 종합심리검사 보고서</h2></div>
    <Card style={{padding:m?14:22,marginBottom:12}}><div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",gap:8}}><div><Badge text="종합보고서" variant="blue"/><div style={{color:C.text,fontSize:m?15:17,fontWeight:700,marginTop:6}}>{rp.patient} ({rp.age}세, {rp.gender})</div><div style={{color:C.textSec,fontSize:11,marginTop:2}}>{rp.referral} | {rp.date}</div></div><div style={{display:"flex",gap:6}}><Btn variant="secondary" style={{fontSize:11}}>📄 PDF</Btn></div></div></Card>
    {rp.sections.map((s,i)=><Card key={i} style={{padding:m?14:22,marginBottom:12}} borderColor={s.flag?C.warnText+"40":C.border}><div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",marginBottom:8,gap:6}}><div style={{color:C.text,fontSize:m?14:15,fontWeight:700}}>{s.title}</div>{s.flag&&<Badge text={s.flag} variant="danger"/>}</div><div style={{background:C.blueLight,padding:"8px 12px",borderRadius:8,color:C.blueDark,fontSize:12,fontWeight:600,marginBottom:10}}>{s.summary}</div><div style={{color:C.text,fontSize:13,lineHeight:1.7}}>{s.detail}</div>{s.scores&&<div style={{marginTop:12,display:"grid",gridTemplateColumns:m?"repeat(2,1fr)":`repeat(${Math.min(s.scores.length,4)},1fr)`,gap:6}}>{s.scores.map((sc,j)=>{const hi=sc.x===100&&sc.v>=70;return<div key={j} style={{background:C.surface,borderRadius:8,padding:m?8:10}}><div style={{color:C.textSec,fontSize:10}}>{sc.n}</div><div style={{color:hi?C.dangerText:C.text,fontSize:16,fontWeight:700}}>{sc.v}{sc.x===100?"T":""}</div><div style={{height:3,background:C.borderLight,borderRadius:2,marginTop:3}}><div style={{width:`${(sc.v/sc.x)*100}%`,height:"100%",borderRadius:2,background:hi?C.dangerText:C.blue}}/></div></div>;})}</div>}</Card>)}
    <Card style={{padding:m?14:22,marginBottom:12}} borderColor={C.dangerText+"30"}><div style={{color:C.text,fontSize:15,fontWeight:700,marginBottom:12}}>진단 및 권고</div><div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:14}}><div><div style={{background:C.dangerBg,padding:10,borderRadius:8,color:C.dangerText,fontWeight:700,fontSize:13,marginBottom:8}}>{rp.diagnosis.primary}</div>{rp.diagnosis.diff.map((d,i)=><div key={i} style={{background:C.warnBg,padding:"6px 10px",borderRadius:6,color:C.warnText,fontSize:11,marginBottom:3}}>{d}</div>)}<div style={{marginTop:6,background:C.dangerBg,padding:"6px 10px",borderRadius:6,color:C.dangerText,fontSize:11,fontWeight:600}}>🚨 {rp.diagnosis.risk}</div></div><div>{rp.recs.map((r,i)=><div key={i} style={{display:"flex",gap:6,padding:"6px 0",borderBottom:i<rp.recs.length-1?`1px solid ${C.borderLight}`:"none"}}><span style={{color:C.blue}}>•</span><span style={{color:C.text,fontSize:12}}>{r}</span></div>)}</div></div></Card>
    <Btn variant="ghost" onClick={()=>setRp(null)}>← 다른 환자</Btn>
  </div>);
}

/* ══════ 5. RISK MONITOR ══════ */
function RiskMonitor(){
  const m=useW()<768;
  const alerts=[
    {id:1,patient:"박○○",age:28,sev:"high",time:"09:42",title:"자살 위험도 상승",detail:"PHQ-9 24→27, MMPI DEP 82T",action:"C-SSRS 즉시 시행"},
    {id:2,patient:"최○○",age:5,sev:"medium",time:"10:15",title:"분리불안 악화",detail:"CBCL 68→74T",action:"보호자 면담",child:true},
    {id:3,patient:"정○○",age:42,sev:"medium",time:"10:30",title:"순응도 저하",detail:"3회 지각, PANSS +2",action:"LAI 검토"},
    {id:4,patient:"강○○",age:19,sev:"low",time:"11:00",title:"스크리닝 완료",detail:"GAD-7:14, PHQ-9:11",action:"Full Battery 권장"},
  ];
  return(<div>
    <div style={{marginBottom:m?14:24}}><h2 style={{color:C.text,fontSize:m?18:21,fontWeight:700,margin:0}}>AI 위험도 모니터링</h2></div>
    <div style={{display:"grid",gridTemplateColumns:m?"1fr 1fr":"repeat(4,1fr)",gap:m?8:14,marginBottom:m?14:24}}>{[{l:"고위험",v:"1건",i:"🚨"},{l:"주의",v:"2건",i:"⚠️"},{l:"정보",v:"1건",i:"ℹ️",b:true},{l:"이번 주",v:"12건",i:"🛡"}].map((s,i)=><div key={i} style={{background:s.b?C.blueLight:C.surface,borderRadius:12,padding:m?"12px 14px":"16px 20px",border:`1px solid ${s.b?C.blueMid:C.border}`}}><div style={{color:C.textSec,fontSize:11,marginBottom:4}}>{s.l}</div><div style={{color:s.b?C.blueDark:C.text,fontSize:m?20:24,fontWeight:700}}>{s.v}</div></div>)}</div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>{alerts.map(a=><Card key={a.id} style={{padding:m?14:18,borderLeft:`4px solid ${a.sev==="high"?C.dangerText:a.sev==="medium"?C.warnText:C.blue}`}} borderColor={a.sev==="high"?C.dangerText+"30":a.sev==="medium"?C.warnText+"30":C.border}>
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",alignItems:"center",marginBottom:8,gap:6}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{a.sev==="high"?"🚨":a.sev==="medium"?"⚠️":"ℹ️"}</span><div><div style={{color:C.text,fontWeight:700,fontSize:13}}>{a.title}</div><div style={{color:C.textSec,fontSize:11}}>{a.patient} ({a.age}세){a.child?" 👶":""}·{a.time}</div></div></div><Badge text={a.sev==="high"?"고위험":a.sev==="medium"?"주의":"정보"} variant={a.sev==="high"?"danger":a.sev==="medium"?"warn":"blue"}/></div>
      <div style={{background:C.surface,borderRadius:8,padding:10,marginBottom:8,color:C.text,fontSize:12,lineHeight:1.5}}>{a.detail}</div>
      <div style={{background:a.sev==="high"?C.dangerBg:a.sev==="medium"?C.warnBg:C.blueLight,borderRadius:6,padding:"6px 10px",color:a.sev==="high"?C.dangerText:a.sev==="medium"?C.warnText:C.blue,fontSize:11,fontWeight:600}}>💡 {a.action}</div>
    </Card>)}</div>
  </div>);
}

/* ══════ 6. DATA ANALYSIS (NEW) ══════ */
const SKEY="mindai-patients";
async function ldP(){try{const r=await window.storage.get(SKEY);return r?JSON.parse(r.value):[];}catch{return[];}}
async function svP(p){try{await window.storage.set(SKEY,JSON.stringify(p));}catch{}}

async function aiAnalyze(base64,mediaType){
  const cb=[];
  if(mediaType.startsWith("image/"))cb.push({type:"image",source:{type:"base64",media_type:mediaType,data:base64}});
  else if(mediaType==="application/pdf")cb.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:base64}});
  cb.push({type:"text",text:`정신건강의학과 AI 어시스턴트. 진료 기록을 분석하여 순수 JSON만 출력. Markdown 백틱 없이.
{"patient_info":{"name":"환자명","age":숫자,"gender":"M/F","diagnosis":["진단"],"diagnosis_codes":["F코드"]},
"visit_date":"YYYY-MM-DD",
"scales":[{"name":"척도명","score":숫자,"max_score":최대,"severity":"정상/경도/중등도/중증","subscales":[{"name":"하위","score":숫자}]}],
"medications":[{"name":"약물","dose":"용량","frequency":"횟수"}],
"clinical_notes":"소견 요약",
"risk_assessment":{"suicide_risk":"없음/낮음/중등/높음","self_harm_risk":"","violence_risk":"","flags":[]},
"predicted_consultation_minutes":숫자,
"noshow_risk_factors":["요인"],
"treatment_response":"호전/유지/악화/판단불가",
"recommendations":["권고"]}`});
  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4000,messages:[{role:"user",content:cb}]})});
    const d=await res.json();const t=d.content?.map(b=>b.type==="text"?b.text:"").join("")||"";
    return JSON.parse(t.replace(/```json|```/g,"").trim());
  }catch(e){console.error(e);return null;}
}

function predict(records){
  if(!records?.length)return null;
  const L=records[records.length-1],P=records.length>1?records[records.length-2]:null;
  let ns=0.08,nf=[];
  if(L.noshow_risk_factors?.length){ns+=L.noshow_risk_factors.length*0.05;nf.push(...L.noshow_risk_factors);}
  if(L.treatment_response==="악화"){ns+=0.08;nf.push("치료반응 악화");}
  ns=Math.min(ns,0.95);
  let cm=records.length<=1?40:15;
  if(L.risk_assessment?.suicide_risk==="높음")cm+=15;
  if(L.medications?.length>3)cm+=5;
  if(L.scales?.some(s=>s.severity==="중증"))cm+=10;
  const trends=[];
  if(P&&L.scales)for(const sc of L.scales){const ps=P.scales?.find(p=>p.name===sc.name);if(ps)trends.push({name:sc.name,cur:sc.score,prev:ps.score,d:sc.score-ps.score});}
  let rk="low";
  if(L.risk_assessment?.suicide_risk==="높음")rk="high";else if(L.risk_assessment?.suicide_risk==="중등"||L.treatment_response==="악화")rk="medium";
  let rp="유지";if(trends.length){const imp=trends.filter(t=>t.d<0).length,wor=trends.filter(t=>t.d>0).length;if(imp>wor)rp="호전 예상";else if(wor>imp)rp="악화 우려";}
  // scale history for sparklines
  const sh={};for(const r of records)if(r.scales)for(const s of r.scales){if(!sh[s.name])sh[s.name]=[];sh[s.name].push(s.score);}
  return{noshowProb:Math.round(ns*100),noshowFactors:nf,consultMin:Math.round(cm),trends,riskLevel:rk,responsePredict:rp,totalVisits:records.length,scaleHistory:sh,meds:L.medications||[],recs:L.recommendations||[],risk:L.risk_assessment};
}

function Spark({data,w:W=120,h:H=32,color=C.blue}){if(!data||data.length<2)return null;const mn=Math.min(...data)-1,mx=Math.max(...data)+1,rng=mx-mn||1;const pts=data.map((v,i)=>`${(i/(data.length-1))*W},${H-((v-mn)/rng)*H}`).join(" ");return<svg width={W} height={H} style={{display:"block"}}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>{data.map((v,i)=><circle key={i} cx={(i/(data.length-1))*W} cy={H-((v-mn)/rng)*H} r="3" fill={i===data.length-1?color:"white"} stroke={color} strokeWidth="1.5"/>)}</svg>;}

function DataAnalysis(){
  const m=useW()<768;
  const[pts,setPts]=useState([]);const[selP,setSelP]=useState(null);const[selR,setSelR]=useState(null);
  const[azing,setAzing]=useState(false);const[err,setErr]=useState(null);const[loaded,setLoaded]=useState(false);
  const[subTab,setSubTab]=useState("upload");const inputRef=useRef(null);const[dragOver,setDO]=useState(false);

  useEffect(()=>{ldP().then(p=>{setPts(p);if(p.length>0)setSelP(p[0].id);setLoaded(true);});},[]);
  useEffect(()=>{if(loaded&&pts.length>0)svP(pts);},[pts,loaded]);

  const sp=pts.find(p=>p.id===selP);
  const pred=sp?.records?predict(sp.records):null;

  const addP=()=>{const id=Date.now().toString();setPts(p=>[...p,{id,name:"새 환자",records:[]}]);setSelP(id);setSubTab("upload");};
  const delP=(id)=>{setPts(p=>p.filter(x=>x.id!==id));if(selP===id){const rem=pts.filter(x=>x.id!==id);setSelP(rem.length?rem[0].id:null);}};

  const processFile=(file)=>{const reader=new FileReader();reader.onload=async()=>{
    const b64=reader.result.split(",")[1];const mt=file.type||(file.name.endsWith(".pdf")?"application/pdf":"image/png");
    setAzing(true);setErr(null);
    try{const res=await aiAnalyze(b64,mt);if(!res)throw new Error("파싱 실패");res._uploadedAt=new Date().toISOString();res._fileName=file.name;
      if(!selP){const id=Date.now().toString();const nm=res.patient_info?.name||"환자";setPts(p=>[...p,{id,name:nm,records:[res]}]);setSelP(id);}
      else setPts(p=>p.map(x=>{if(x.id!==selP)return x;const nm=res.patient_info?.name&&res.patient_info.name!=="미확인"?res.patient_info.name:x.name;return{...x,name:nm,records:[...x.records,res]};}));
      setSelR(null);setSubTab("records");
    }catch(e){setErr(e.message||"오류 발생");}setAzing(false);
  };reader.readAsDataURL(file);};

  return(<div>
    <div style={{marginBottom:14}}><h2 style={{color:C.text,fontSize:m?18:21,fontWeight:700,margin:0}}>진료 데이터 AI 분석</h2><p style={{color:C.textSec,fontSize:12,margin:"4px 0 0"}}>파일 업로드 → AI 추출 → 누적 분석 → 예측</p></div>

    {/* Patient selector */}
    {pts.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
      {pts.map(p=><button key={p.id} onClick={()=>setSelP(p.id)} style={{background:selP===p.id?C.blueLight:C.surface,border:`1px solid ${selP===p.id?C.blue:C.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,color:selP===p.id?C.blue:C.textSec}}>{p.name}{p.records?.length>0&&<span style={{background:selP===p.id?C.blue:C.textMut,color:"#fff",fontSize:9,padding:"1px 5px",borderRadius:8}}>{p.records.length}</span>}</button>)}
      <button onClick={addP} style={{background:"transparent",border:`1px dashed ${C.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:12,color:C.textMut}}>+ 새 환자</button>
    </div>}

    {/* Sub-tabs */}
    {sp&&<div style={{display:"flex",gap:4,marginBottom:14}}>
      {[{id:"upload",l:"📤 업로드"},{id:"records",l:"📋 기록"},{id:"predict",l:"🤖 예측"}].map(t=><Btn key={t.id} variant={subTab===t.id?"secondary":"ghost"} onClick={()=>setSubTab(t.id)} style={{fontSize:12}}>{t.l}</Btn>)}
      <Btn variant="ghost" onClick={async()=>{if(confirm("전체 초기화?")){setPts([]);setSelP(null);try{await window.storage.delete(SKEY);}catch{}}}} style={{marginLeft:"auto",fontSize:10,color:C.textMut}}>초기화</Btn>
    </div>}

    {/* Upload */}
    {(subTab==="upload"||!sp)&&<div>
      <div onDragOver={e=>{e.preventDefault();setDO(true);}} onDragLeave={()=>setDO(false)} onDrop={e=>{e.preventDefault();setDO(false);if(e.dataTransfer.files[0])processFile(e.dataTransfer.files[0]);}} onClick={()=>!azing&&inputRef.current?.click()}
        style={{border:`2px dashed ${dragOver?C.blue:C.border}`,borderRadius:14,padding:"28px 20px",textAlign:"center",background:dragOver?C.blueLight:C.surface,cursor:azing?"wait":"pointer"}}>
        <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={e=>{if(e.target.files[0])processFile(e.target.files[0]);}} style={{display:"none"}}/>
        {azing?<div><div style={{fontSize:28,marginBottom:6}}>🔄</div><div style={{color:C.blue,fontWeight:600,fontSize:14}}>AI 분석 중...</div><div style={{color:C.textSec,fontSize:12,marginTop:4}}>데이터 추출 중</div></div>
        :<div><div style={{fontSize:28,marginBottom:6}}>📄</div><div style={{color:C.text,fontWeight:600,fontSize:14}}>진료 기록 업로드</div><div style={{color:C.textSec,fontSize:12,marginTop:4}}>PDF, 스크린샷 드래그 또는 클릭</div><div style={{color:C.textMut,fontSize:11,marginTop:6}}>EMR 캡처, 척도검사 결과지, 처방전 등</div></div>}
      </div>
      {err&&<div style={{marginTop:10,background:C.dangerBg,borderRadius:10,padding:10,color:C.dangerText,fontSize:12}}>⚠ {err}</div>}
      {!sp&&<div style={{textAlign:"center",marginTop:16}}><Btn onClick={addP}>새 환자 등록</Btn></div>}
    </div>}

    {/* Records */}
    {subTab==="records"&&sp&&<div>
      {sp.records.length===0?<Card style={{padding:30,textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>📭</div><div style={{color:C.text,fontWeight:600}}>기록 없음</div><Btn onClick={()=>setSubTab("upload")} style={{marginTop:12}}>업로드</Btn></Card>
      :<div>
        <Card style={{marginBottom:12}}><div style={{padding:m?"10px 14px":"12px 20px",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.text,fontWeight:600,fontSize:14}}>📅 내원 기록 ({sp.records.length}회)</span></div>
          {sp.records.map((r,i)=><div key={i} onClick={()=>setSelR(i)} style={{padding:m?"10px 14px":"10px 20px",borderBottom:i<sp.records.length-1?`1px solid ${C.borderLight}`:"none",background:selR===i?C.blueLight:"transparent",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:C.text,fontSize:13,fontWeight:600,fontFamily:"monospace"}}>{r.visit_date||`기록 ${i+1}`}</span>{r.patient_info?.diagnosis?.map((d,j)=><Badge key={j} text={d} variant="blue"/>)}</div>
            <div style={{display:"flex",gap:6}}>{r.treatment_response&&<Badge text={r.treatment_response} variant={r.treatment_response==="호전"?"success":r.treatment_response==="악화"?"danger":"default"}/>}{r.scales?.length>0&&<span style={{color:C.textMut,fontSize:11}}>척도 {r.scales.length}종</span>}</div>
          </div>)}
        </Card>
        {/* Detail view */}
        {(()=>{const rec=selR!==null?sp.records[selR]:sp.records[sp.records.length-1];if(!rec)return null;
          return<Card style={{padding:m?14:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:6}}><div style={{color:C.text,fontWeight:700,fontSize:14}}>📋 AI 추출 데이터</div><div style={{display:"flex",gap:4}}>{rec.visit_date&&<Badge text={rec.visit_date} variant="blue"/>}{rec.treatment_response&&<Badge text={rec.treatment_response} variant={rec.treatment_response==="호전"?"success":rec.treatment_response==="악화"?"danger":"default"}/>}</div></div>
            {rec.patient_info?.diagnosis?.length>0&&<div style={{marginBottom:10}}><div style={{color:C.textSec,fontSize:11,marginBottom:4}}>진단</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{rec.patient_info.diagnosis.map((d,i)=><Badge key={i} text={d} variant="blue"/>)}</div></div>}
            {rec.scales?.length>0&&<div style={{marginBottom:10}}><div style={{color:C.textSec,fontSize:11,marginBottom:6}}>척도검사</div><div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:6}}>{rec.scales.map((sc,i)=><div key={i} style={{background:C.surface,borderRadius:10,padding:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.text,fontSize:13,fontWeight:600}}>{sc.name}</span><Badge text={sc.severity} variant={sc.severity==="중증"?"danger":sc.severity==="중등도"?"warn":"blue"}/></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:sc.severity==="중증"?C.dangerText:C.text,fontSize:20,fontWeight:700}}>{sc.score}</span>{sc.max_score&&<span style={{color:C.textMut,fontSize:12}}>/{sc.max_score}</span>}</div>{sc.max_score&&<div style={{height:4,background:C.borderLight,borderRadius:2,marginTop:4}}><div style={{width:`${(sc.score/sc.max_score)*100}%`,height:"100%",borderRadius:2,background:sc.severity==="중증"?C.dangerText:C.blue}}/></div>}</div>)}</div></div>}
            {rec.medications?.length>0&&<div style={{marginBottom:10}}><div style={{color:C.textSec,fontSize:11,marginBottom:4}}>처방</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{rec.medications.map((med,i)=><span key={i} style={{background:C.surface,borderRadius:8,padding:"4px 10px",fontSize:12,color:C.text}}>{med.name} {med.dose}</span>)}</div></div>}
            {rec.clinical_notes&&<div style={{marginBottom:10}}><div style={{color:C.textSec,fontSize:11,marginBottom:4}}>소견</div><div style={{background:C.surface,borderRadius:8,padding:10,color:C.text,fontSize:12,lineHeight:1.6}}>{rec.clinical_notes}</div></div>}
          </Card>;
        })()}
      </div>}
    </div>}

    {/* Predictions */}
    {subTab==="predict"&&sp&&<div>
      {sp.records.length===0?<Card style={{padding:30,textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>🤖</div><div style={{color:C.text,fontWeight:600}}>데이터 필요</div><Btn onClick={()=>setSubTab("upload")} style={{marginTop:12}}>업로드</Btn></Card>
      :<div>
        {/* Key metrics */}
        <div style={{display:"grid",gridTemplateColumns:m?"1fr 1fr":"repeat(4,1fr)",gap:m?8:12,marginBottom:14}}>
          {[{l:"노쇼 확률",v:`${pred.noshowProb}%`,i:"🚫",hi:pred.noshowProb>25,s:pred.noshowProb>25?"주의":"정상"},
            {l:"예상 상담",v:`${pred.consultMin}분`,i:"⏱",s:pred.consultMin>30?"장시간":"표준"},
            {l:"치료 예측",v:pred.responsePredict,i:"📈",hi:pred.responsePredict==="악화 우려",s:`${pred.totalVisits}회 기반`},
            {l:"위험 수준",v:pred.riskLevel==="high"?"고위험":pred.riskLevel==="medium"?"주의":"안정",i:pred.riskLevel==="high"?"🚨":"✅",hi:pred.riskLevel==="high"},
          ].map((x,i)=><Card key={i} style={{padding:m?12:16}} borderColor={x.hi?C.dangerText+"40":C.border}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{color:C.textSec,fontSize:11,marginBottom:4}}>{x.l}</div><div style={{color:x.hi?C.dangerText:C.text,fontSize:m?18:22,fontWeight:700}}>{x.v}</div><div style={{color:C.textMut,fontSize:10,marginTop:2}}>{x.s}</div></div><span style={{fontSize:16}}>{x.i}</span></div></Card>)}
        </div>
        {/* Sparklines */}
        {Object.keys(pred.scaleHistory).length>0&&<Card style={{padding:m?14:20,marginBottom:12}}>
          <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:14}}>📊 척도 추이</div>
          <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:12}}>
            {Object.entries(pred.scaleHistory).map(([name,scores])=>{const d=scores.length>=2?scores[scores.length-1]-scores[scores.length-2]:0;
              return<div key={name} style={{background:C.surface,borderRadius:10,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{color:C.text,fontSize:13,fontWeight:600}}>{name}</span><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:C.text,fontSize:18,fontWeight:700}}>{scores[scores.length-1]}</span>{d!==0&&<span style={{color:d>0?C.dangerText:C.successText,fontSize:12,fontWeight:600}}>{d>0?`▲${d}`:`▼${Math.abs(d)}`}</span>}</div></div>
                <Spark data={scores} w={m?180:220} h={30} color={d>0?C.dangerText:C.blue}/><div style={{color:C.textMut,fontSize:10,marginTop:4}}>{scores.length}회</div>
              </div>;})}
          </div>
        </Card>}
        {/* Noshow factors */}
        {pred.noshowFactors?.length>0&&<Card style={{padding:m?14:20,marginBottom:12}}><div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:10}}>🚫 노쇼 위험요인</div>{pred.noshowFactors.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.warnBg,borderRadius:8,marginBottom:4}}><span style={{color:C.warnText,fontSize:12}}>⚠</span><span style={{color:C.text,fontSize:12}}>{f}</span></div>)}</Card>}
        {/* Recommendations */}
        {pred.recs?.length>0&&<Card style={{padding:m?14:20,marginBottom:12}} borderColor={C.blue}><div style={{color:C.blue,fontWeight:700,fontSize:14,marginBottom:10}}>💡 AI 권고</div>{pred.recs.map((r,i)=><div key={i} style={{display:"flex",gap:6,padding:"6px 0",borderBottom:i<pred.recs.length-1?`1px solid ${C.borderLight}`:"none"}}><span style={{color:C.blue}}>•</span><span style={{color:C.text,fontSize:13}}>{r}</span></div>)}</Card>}
        {pred.meds?.length>0&&<Card style={{padding:m?14:20}}><div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:10}}>💊 현재 처방</div><div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:6}}>{pred.meds.map((med,i)=><div key={i} style={{background:C.surface,borderRadius:8,padding:10,display:"flex",justifyContent:"space-between"}}><span style={{color:C.text,fontSize:13,fontWeight:600}}>{med.name}</span><span style={{color:C.textSec,fontSize:12}}>{med.dose} · {med.frequency}</span></div>)}</div></Card>}
      </div>}
    </div>}
  </div>);
}

/* ══════ 7. SOAP NOTE ══════ */
function SOAPNote(){
  const m=useW()<768;
  const[patientName,setPN]=useState("");const[age,setAge]=useState("");const[diagnosis,setDiag]=useState("");
  const[keywords,setKW]=useState("");const[generating,setGen]=useState(false);const[soap,setSoap]=useState(null);
  const[history,setHistory]=useState([]);

  const generate=async()=>{
    if(!keywords.trim())return;setGen(true);setSoap(null);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:3000,messages:[{role:"user",content:`정신건강의학과 진료 SOAP 노트를 작성해주세요. 순수 JSON만 출력. 백틱 없이.

환자정보: ${patientName||"미기재"}, ${age||"미기재"}세, 진단: ${diagnosis||"미기재"}
의사 키워드/메모: ${keywords}

JSON 형식:
{
  "subjective": "환자의 주관적 호소, 주요 증상, 기간, 변화 등을 자연스러운 서술체로 작성",
  "objective": "관찰된 객관적 소견 - 외양, 행동, 정신상태검사(MSE) 소견, 검사 결과 등",
  "assessment": "임상적 평가 - 진단 인상, 감별진단, 증상 변화 평가, 위험도 평가",
  "plan": "치료 계획 - 약물 조정, 심리치료, 다음 방문 일정, 검사 계획 등",
  "icd_codes": ["관련 ICD-10 코드"],
  "risk_flags": ["위험 플래그 - 자살사고, 자해 등 감지된 경우"],
  "next_visit": "권장 다음 방문 시기",
  "consultation_summary": "2줄 이내 핵심 요약"
}

키워드에서 임상적으로 의미 있는 내용을 최대한 확장하여 전문적인 SOAP 노트를 작성해주세요. 의사 키워드가 간략하더라도 진단명과 맥락을 고려하여 풍부하게 작성하세요.`}]})});
      const d=await res.json();const t=d.content?.map(b=>b.type==="text"?b.text:"").join("")||"";
      const parsed=JSON.parse(t.replace(/```json|```/g,"").trim());
      setSoap(parsed);
      setHistory(prev=>[{...parsed,_patient:patientName,_date:new Date().toLocaleDateString("ko-KR"),_keywords:keywords},...prev].slice(0,20));
    }catch(e){console.error(e);setSoap({subjective:"생성 오류",objective:"",assessment:"",plan:"",error:true});}
    setGen(false);
  };

  const copyAll=()=>{if(!soap)return;const txt=`[SOAP Note] ${patientName} ${new Date().toLocaleDateString("ko-KR")}\n\n【S】${soap.subjective}\n\n【O】${soap.objective}\n\n【A】${soap.assessment}\n\n【P】${soap.plan}${soap.next_visit?`\n\n다음방문: ${soap.next_visit}`:""}`;navigator.clipboard?.writeText(txt);};

  const Section=({label,color,content})=>content?<div style={{marginBottom:14}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{width:28,height:28,borderRadius:8,background:color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700}}>{label[0]}</div><span style={{color:C.text,fontWeight:700,fontSize:14}}>{label}</span></div>
    <div style={{background:C.surface,borderRadius:10,padding:14,color:C.text,fontSize:13,lineHeight:1.8,marginLeft:36}}>{content}</div>
  </div>:null;

  return(<div>
    <div style={{marginBottom:m?16:24}}><h2 style={{color:C.text,fontSize:m?18:21,fontWeight:700,margin:0}}>SOAP 진료메모 자동생성</h2><p style={{color:C.textSec,fontSize:12,margin:"4px 0 0"}}>키워드만 입력하면 AI가 전문적인 SOAP 노트를 작성합니다</p></div>

    <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
      {/* Input */}
      <Card style={{padding:m?14:20}}>
        <div style={{color:C.text,fontWeight:600,fontSize:14,marginBottom:14}}>📝 진료 정보 입력</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div><div style={{color:C.textSec,fontSize:11,marginBottom:4}}>환자명</div><input value={patientName} onChange={e=>setPN(e.target.value)} placeholder="김○○" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,color:C.text,background:C.bg,boxSizing:"border-box"}}/></div>
          <div><div style={{color:C.textSec,fontSize:11,marginBottom:4}}>나이</div><input value={age} onChange={e=>setAge(e.target.value)} placeholder="34" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,color:C.text,background:C.bg,boxSizing:"border-box"}}/></div>
        </div>
        <div style={{marginBottom:10}}><div style={{color:C.textSec,fontSize:11,marginBottom:4}}>진단명</div><input value={diagnosis} onChange={e=>setDiag(e.target.value)} placeholder="주요우울장애, 공황장애 등" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,color:C.text,background:C.bg,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:14}}>
          <div style={{color:C.textSec,fontSize:11,marginBottom:4}}>진료 키워드 / 메모 ✱</div>
          <textarea value={keywords} onChange={e=>setKW(e.target.value)} placeholder={"예시:\n수면 여전히 불량, 입면 1시간\n식욕 약간 회복\n우울감 지속 but 자살사고 없음\n에스시탈로프람 10→15 증량 고려\n다음주 PHQ-9 재검"} rows={6} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13,color:C.text,background:C.bg,resize:"vertical",lineHeight:1.6,fontFamily:"inherit",boxSizing:"border-box"}}/>
        </div>
        <Btn onClick={generate} disabled={!keywords.trim()||generating} style={{width:"100%",justifyContent:"center"}}>{generating?"🔄 AI 작성 중...":"✨ SOAP 노트 생성"}</Btn>

        {/* Quick templates */}
        <div style={{marginTop:14}}><div style={{color:C.textMut,fontSize:11,marginBottom:6}}>빠른 템플릿</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {["수면불량 우울지속 약물유지","호전 약물감량 검토","불안악화 벤조 추가 고려","초진 병력청취 검사의뢰","자살사고 호소 위기개입"].map((t,i)=><button key={i} onClick={()=>setKW(t)} style={{background:C.surface,border:`1px solid ${C.borderLight}`,borderRadius:8,padding:"4px 10px",fontSize:11,color:C.textSec,cursor:"pointer"}}>{t}</button>)}
          </div>
        </div>
      </Card>

      {/* Result */}
      <div>
        {soap?<Card style={{padding:m?14:20}} borderColor={soap.error?C.dangerText:C.blue}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{color:C.blue,fontWeight:700,fontSize:14}}>📋 SOAP Note</div>
            <div style={{display:"flex",gap:4}}><Btn variant="secondary" onClick={copyAll} style={{fontSize:11}}>📋 복사</Btn></div>
          </div>
          {soap.consultation_summary&&<div style={{background:C.blueLight,borderRadius:8,padding:"8px 12px",color:C.blueDark,fontSize:12,fontWeight:600,marginBottom:14}}>{soap.consultation_summary}</div>}
          <Section label="Subjective" color={C.blue} content={soap.subjective}/>
          <Section label="Objective" color="#059669" content={soap.objective}/>
          <Section label="Assessment" color="#D97706" content={soap.assessment}/>
          <Section label="Plan" color="#7C3AED" content={soap.plan}/>
          {soap.risk_flags?.length>0&&<div style={{marginTop:10,marginLeft:36}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{soap.risk_flags.map((f,i)=><Badge key={i} text={`⚠ ${f}`} variant="danger"/>)}</div></div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14,marginLeft:36}}>
            {soap.icd_codes?.map((c,i)=><Badge key={i} text={c} variant="blue"/>)}
            {soap.next_visit&&<Badge text={`다음: ${soap.next_visit}`} variant="success"/>}
          </div>
        </Card>
        :<Card style={{padding:m?24:40,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:8,opacity:.5}}>📝</div>
          <div style={{color:C.textMut,fontSize:13}}>키워드를 입력하고 생성 버튼을 누르면</div>
          <div style={{color:C.textMut,fontSize:13}}>AI가 전문적인 SOAP 노트를 작성합니다</div>
        </Card>}
      </div>
    </div>

    {/* History */}
    {history.length>0&&<Card style={{padding:m?14:20}}>
      <div style={{color:C.text,fontWeight:600,fontSize:14,marginBottom:10}}>📚 최근 생성 기록</div>
      {history.slice(0,5).map((h,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<Math.min(history.length,5)-1?`1px solid ${C.borderLight}`:"none",cursor:"pointer"}} onClick={()=>{setSoap(h);setPN(h._patient||"");setKW(h._keywords||"");}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:C.textSec,fontSize:12}}>{h._date}</span><span style={{color:C.text,fontSize:13,fontWeight:500}}>{h._patient||"환자"}</span></div>
        <span style={{color:C.textMut,fontSize:11,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.consultation_summary||h._keywords}</span>
      </div>)}
    </Card>}
  </div>);
}

/* ══════ 8. PATIENT REPORT ══════ */
function PatientReport(){
  const m=useW()<768;
  const[pts,setPts]=useState([]);const[selP,setSelP]=useState(null);
  const[generating,setGen]=useState(false);const[report,setReport]=useState(null);
  const[loaded,setLoaded]=useState(false);

  useEffect(()=>{ldP().then(p=>{setPts(p);if(p.length>0)setSelP(p[0].id);setLoaded(true);});},[]);

  const sp=pts.find(p=>p.id===selP);

  const generateReport=async()=>{
    if(!sp?.records?.length)return;setGen(true);setReport(null);
    const latestRec=sp.records[sp.records.length-1];
    const allScales=sp.records.flatMap(r=>r.scales||[]);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:3000,messages:[{role:"user",content:`정신건강의학과 환자/보호자용 검사 결과 설명 보고서를 작성해주세요. 의학 전문용어를 쓰지 말고, 중학생도 이해할 수 있는 쉬운 한국어로 작성하세요. 순수 JSON만 출력, 백틱 없이.

환자 데이터:
${JSON.stringify({patient:sp.name,info:latestRec.patient_info,scales:latestRec.scales,medications:latestRec.medications,diagnosis:latestRec.patient_info?.diagnosis,risk:latestRec.risk_assessment,clinical_notes:latestRec.clinical_notes,treatment_response:latestRec.treatment_response,total_visits:sp.records.length})}

JSON 형식:
{
  "title": "검사 결과 안내문",
  "greeting": "환자/보호자에게 하는 따뜻한 인사말 (2줄)",
  "overall_summary": "전체 상태를 비유나 일상 언어로 쉽게 설명 (3-4줄)",
  "condition_explanation": "현재 진단에 대한 쉬운 설명 - 이 상태가 무엇인지, 왜 생기는지, 얼마나 흔한지 (4-5줄)",
  "scale_explanations": [
    {
      "name": "검사 이름",
      "score": 숫자,
      "max_score": 최대점수,
      "level": "좋음/보통/주의/걱정",
      "simple_meaning": "이 점수가 무엇을 의미하는지 1줄로 쉽게",
      "analogy": "일상적 비유로 설명 (예: '10점 만점에 7점 정도의 스트레스')",
      "color": "green/yellow/orange/red"
    }
  ],
  "medication_explanations": [
    {
      "name": "약 이름",
      "simple_name": "쉬운 별명 (예: '마음 안정 약')",
      "purpose": "왜 이 약을 먹는지 쉽게 설명",
      "tips": "복용 시 주의사항이나 팁"
    }
  ],
  "what_you_can_do": ["환자가 일상에서 할 수 있는 도움이 되는 행동 3-5개"],
  "what_family_can_do": ["보호자가 도울 수 있는 방법 3개"],
  "next_steps": "앞으로의 치료 계획을 쉽게 설명 (2-3줄)",
  "encouraging_message": "힘이 되는 마무리 메시지 (2줄)"
}`}]})});
      const d=await res.json();const t=d.content?.map(b=>b.type==="text"?b.text:"").join("")||"";
      setReport(JSON.parse(t.replace(/```json|```/g,"").trim()));
    }catch(e){console.error(e);setReport(null);}
    setGen(false);
  };

  const Gauge=({score,max,color,label})=>{const pct=max?(score/max)*100:0;const clr=color==="green"?C.successText:color==="yellow"?C.warnText:color==="orange"?"#EA580C":color==="red"?C.dangerText:C.blue;
    return<div style={{textAlign:"center"}}><div style={{position:"relative",width:64,height:64,margin:"0 auto"}}>
      <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke={C.borderLight} strokeWidth="6"/><circle cx="32" cy="32" r="28" fill="none" stroke={clr} strokeWidth="6" strokeDasharray={`${pct*1.76} 176`} strokeLinecap="round" transform="rotate(-90 32 32)"/></svg>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:14,fontWeight:700,color:clr}}>{score}</div>
    </div><div style={{color:C.textSec,fontSize:10,marginTop:4}}>{label}</div></div>;};

  if(!sp||!sp.records?.length)return(<div>
    <div style={{marginBottom:24}}><h2 style={{color:C.text,fontSize:m?18:21,fontWeight:700,margin:0}}>환자용 쉬운 보고서</h2><p style={{color:C.textSec,fontSize:12,margin:"4px 0 0"}}>검사 결과를 환자/보호자가 이해하기 쉽게 변환</p></div>
    <Card style={{padding:40,textAlign:"center"}}><div style={{fontSize:40,marginBottom:10}}>📄</div><div style={{color:C.text,fontWeight:600,marginBottom:4}}>진료분석 탭에서 먼저 데이터를 업로드해주세요</div><div style={{color:C.textSec,fontSize:13}}>환자 기록이 있어야 보고서를 생성할 수 있습니다</div></Card>
  </div>);

  return(<div>
    <div style={{marginBottom:m?16:24}}><h2 style={{color:C.text,fontSize:m?18:21,fontWeight:700,margin:0}}>환자용 쉬운 보고서</h2><p style={{color:C.textSec,fontSize:12,margin:"4px 0 0"}}>전문 용어 → 쉬운 한국어, 시각화와 함께 제공</p></div>

    {/* Patient selector */}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
      {pts.filter(p=>p.records?.length>0).map(p=><button key={p.id} onClick={()=>{setSelP(p.id);setReport(null);}} style={{background:selP===p.id?C.blueLight:C.surface,border:`1px solid ${selP===p.id?C.blue:C.border}`,borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600,color:selP===p.id?C.blue:C.textSec}}>{p.name} ({p.records.length}회)</button>)}
    </div>

    {!report&&<Card style={{padding:m?24:40,textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:12}}>🩺</div>
      <div style={{color:C.text,fontSize:15,fontWeight:600,marginBottom:4}}>{sp.name}님의 검사 결과를 쉽게 설명해드릴게요</div>
      <div style={{color:C.textSec,fontSize:12,marginBottom:20}}>AI가 전문 용어를 쉬운 말로 바꾸고, 그래프와 함께 정리합니다</div>
      <Btn onClick={generateReport} disabled={generating}>{generating?"🔄 보고서 작성 중...":"📄 쉬운 보고서 생성"}</Btn>
    </Card>}

    {report&&<div>
      {/* Header card - warm tone */}
      <Card style={{padding:m?16:24,marginBottom:14,background:"linear-gradient(135deg, #EFF6FF, #F0FDF4)",borderColor:C.blueMid}}>
        <div style={{color:C.blueDark,fontSize:m?16:18,fontWeight:700,marginBottom:8}}>{report.title||"검사 결과 안내"}</div>
        <div style={{color:C.text,fontSize:13,lineHeight:1.7}}>{report.greeting}</div>
      </Card>

      {/* Overall */}
      <Card style={{padding:m?14:20,marginBottom:14}}>
        <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:10}}>🌤️ 전체 상태 요약</div>
        <div style={{color:C.text,fontSize:13,lineHeight:1.8,background:C.surface,borderRadius:10,padding:14}}>{report.overall_summary}</div>
      </Card>

      {/* Condition explanation */}
      {report.condition_explanation&&<Card style={{padding:m?14:20,marginBottom:14}}>
        <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:10}}>💡 내 상태 이해하기</div>
        <div style={{color:C.text,fontSize:13,lineHeight:1.8}}>{report.condition_explanation}</div>
      </Card>}

      {/* Scale gauges */}
      {report.scale_explanations?.length>0&&<Card style={{padding:m?14:20,marginBottom:14}}>
        <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:14}}>📊 검사 결과</div>
        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"repeat(2,1fr)",gap:12}}>
          {report.scale_explanations.map((sc,i)=>(
            <div key={i} style={{background:C.surface,borderRadius:12,padding:14}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <Gauge score={sc.score} max={sc.max_score} color={sc.color} label={sc.name}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{color:C.text,fontWeight:600,fontSize:13}}>{sc.name}</span><Badge text={sc.level} variant={sc.level==="좋음"?"success":sc.level==="보통"?"blue":sc.level==="주의"?"warn":"danger"}/></div>
                  <div style={{color:C.text,fontSize:12,lineHeight:1.5}}>{sc.simple_meaning}</div>
                  {sc.analogy&&<div style={{color:C.textSec,fontSize:11,marginTop:4,fontStyle:"italic"}}>💬 {sc.analogy}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>}

      {/* Medication */}
      {report.medication_explanations?.length>0&&<Card style={{padding:m?14:20,marginBottom:14}}>
        <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:12}}>💊 복용 약물 안내</div>
        {report.medication_explanations.map((med,i)=>(
          <div key={i} style={{background:C.surface,borderRadius:10,padding:12,marginBottom:i<report.medication_explanations.length-1?8:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{color:C.text,fontWeight:600,fontSize:13}}>{med.name}</span>{med.simple_name&&<Badge text={med.simple_name} variant="blue"/>}</div>
            <div style={{color:C.text,fontSize:12,lineHeight:1.6}}>{med.purpose}</div>
            {med.tips&&<div style={{color:C.warnText,fontSize:11,marginTop:4}}>💡 {med.tips}</div>}
          </div>
        ))}
      </Card>}

      {/* What you can do */}
      <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
        {report.what_you_can_do?.length>0&&<Card style={{padding:m?14:20}}>
          <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:10}}>🌱 내가 할 수 있는 것</div>
          {report.what_you_can_do.map((t,i)=><div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:i<report.what_you_can_do.length-1?`1px solid ${C.borderLight}`:"none"}}><span style={{color:C.successText}}>✓</span><span style={{color:C.text,fontSize:12,lineHeight:1.5}}>{t}</span></div>)}
        </Card>}
        {report.what_family_can_do?.length>0&&<Card style={{padding:m?14:20}}>
          <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:10}}>👨‍👩‍👧 가족이 도울 수 있는 것</div>
          {report.what_family_can_do.map((t,i)=><div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:i<report.what_family_can_do.length-1?`1px solid ${C.borderLight}`:"none"}}><span style={{color:C.blue}}>♡</span><span style={{color:C.text,fontSize:12,lineHeight:1.5}}>{t}</span></div>)}
        </Card>}
      </div>

      {/* Next steps */}
      {report.next_steps&&<Card style={{padding:m?14:20,marginBottom:14}}>
        <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:8}}>📅 앞으로의 계획</div>
        <div style={{color:C.text,fontSize:13,lineHeight:1.7}}>{report.next_steps}</div>
      </Card>}

      {/* Encouraging */}
      {report.encouraging_message&&<Card style={{padding:m?16:24,marginBottom:14,background:"linear-gradient(135deg, #FFF7ED, #FDF2F8)",borderColor:"#FBCFE8"}}>
        <div style={{color:"#BE185D",fontSize:14,fontWeight:600,lineHeight:1.7,textAlign:"center"}}>{report.encouraging_message}</div>
      </Card>}

      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn variant="secondary" onClick={()=>{const w=window.open("","","width=800,height=900");if(!w)return;w.document.write(`<html><head><meta charset="utf-8"><title>검사 결과 안내</title><style>body{font-family:-apple-system,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#111;line-height:1.8}h1{color:#2563EB;font-size:20px}h2{font-size:15px;margin-top:24px;border-bottom:1px solid #e5e7eb;padding-bottom:6px}.card{background:#f7f8fa;border-radius:10px;padding:14px;margin:8px 0}</style></head><body><h1>${report.title||"검사 결과 안내"}</h1><p>${report.greeting||""}</p><h2>🌤️ 전체 요약</h2><div class="card">${report.overall_summary||""}</div>${report.condition_explanation?`<h2>💡 내 상태</h2><p>${report.condition_explanation}</p>`:""}<h2>📊 검사 결과</h2>${(report.scale_explanations||[]).map(s=>`<div class="card"><b>${s.name}</b>: ${s.score}점 — ${s.simple_meaning}${s.analogy?` (${s.analogy})`:""}</div>`).join("")}${(report.medication_explanations||[]).length?`<h2>💊 약물 안내</h2>${report.medication_explanations.map(m=>`<div class="card"><b>${m.name}</b>${m.simple_name?` (${m.simple_name})`:""}<br>${m.purpose}${m.tips?`<br><small>💡 ${m.tips}</small>`:""}</div>`).join("")}`:""}<h2>🌱 도움되는 행동</h2>${(report.what_you_can_do||[]).map(t=>`<div>✓ ${t}</div>`).join("")}${report.next_steps?`<h2>📅 앞으로</h2><p>${report.next_steps}</p>`:""}<br><p style="text-align:center;color:#BE185D;font-weight:600">${report.encouraging_message||""}</p></body></html>`);w.document.close();w.print();}}>🖨️ 인쇄</Btn><Btn variant="ghost" onClick={()=>setReport(null)}>다시 생성</Btn></div>
    </div>}
  </div>);
}

/* ══════ APP SHELL ══════ */
export default function App(){
  const m=useW()<768;
  const[tab,setTab]=useState("dashboard");
  const tabs=[{id:"dashboard",l:"대시보드",i:"📊"},{id:"child",l:"아동평가",i:"🎮"},{id:"drawing",l:"그림검사",i:"🎨"},{id:"report",l:"풀배터리",i:"📋"},{id:"risk",l:"위험감지",i:"🛡"},{id:"data",l:"진료분석",i:"🔬"},{id:"soap",l:"SOAP",i:"📝"},{id:"patreport",l:"환자보고",i:"📄"}];

  return(<div style={{background:"#F9FAFB",minHeight:"100vh",fontFamily:"'Pretendard',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",paddingBottom:m?64:0}}>
    <style>{`@keyframes pulse{0%,100%{width:30%}50%{width:80%}}`}</style>
    {/* Desktop header */}
    {!m&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 28px",borderBottom:`1px solid ${C.border}`,background:"rgba(255,255,255,.97)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:30,height:30,borderRadius:8,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff"}}>M</div><span style={{color:C.text,fontWeight:700,fontSize:16}}>MindAI</span><Badge text="BETA" variant="blue"/></div>
      <div style={{display:"flex",gap:2}}>{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?C.blueLight:"transparent",border:"none",color:tab===t.id?C.blue:C.textSec,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><span>{t.i}</span>{t.l}</button>)}</div>
      <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:7,height:7,borderRadius:"50%",background:C.successText}}/><span style={{color:C.textSec,fontSize:12}}>서울마음정신건강의학과</span></div>
    </div>}
    {/* Mobile header */}
    {m&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:`1px solid ${C.border}`,background:"rgba(255,255,255,.97)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:7,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>M</div><span style={{color:C.text,fontWeight:700,fontSize:15}}>MindAI</span></div>
      <span style={{color:C.textSec,fontSize:11}}>서울마음</span>
    </div>}

    <div style={{padding:m?"16px 14px":"24px 28px",maxWidth:1160,margin:"0 auto"}}>
      {tab==="dashboard"&&<Dashboard/>}
      {tab==="child"&&<ChildAssess/>}
      {tab==="drawing"&&<DrawingTest/>}
      {tab==="report"&&<FullBattery/>}
      {tab==="risk"&&<RiskMonitor/>}
      {tab==="data"&&<DataAnalysis/>}
      {tab==="soap"&&<SOAPNote/>}
      {tab==="patreport"&&<PatientReport/>}
    </div>

    {/* Mobile bottom nav */}
    {m&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,.97)",backdropFilter:"blur(12px)",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"4px 0 env(safe-area-inset-bottom,4px)",zIndex:100}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"4px 4px",cursor:"pointer",color:tab===t.id?C.blue:C.textMut,WebkitTapHighlightColor:"transparent"}}><span style={{fontSize:16}}>{t.i}</span><span style={{fontSize:9,fontWeight:tab===t.id?700:500}}>{t.l}</span></button>)}
    </div>}
  </div>);
}
