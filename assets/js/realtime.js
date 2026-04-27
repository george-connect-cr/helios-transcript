
let wpsClient=null,lastAnalysis=null,isDark=false,_retries=0;

async function connectWebPubSub(){
  try{
    setStatus('conectando','warn');
    const res=await fetch(CONFIG.NEGOTIATE_URL+'?userId=viewer-'+Date.now(),{headers:{'Authorization':'Bearer '+CONFIG.AUTH_TOKEN}});
    if(!res.ok)throw new Error('Negotiate '+res.status);
    const{url}=await res.json();
    if(window.WebPubSubClient){
      wpsClient=new WebPubSubClient(url);
      wpsClient.on('connected',()=>{setStatus('conectado','live');_retries=0;});
      wpsClient.on('disconnected',()=>{setStatus('desconectado','err');setTimeout(connectWebPubSub,CONFIG.RECONNECT_MS);});
      wpsClient.on('server-message',e=>handleMessage(e.message.data));
      await wpsClient.start();
    }else{
      const ws=new WebSocket(url);
      window._ws=ws;
      ws.onopen=()=>{setStatus('conectado','live');showToast('✓ Conectado');_retries=0;};
      ws.onclose=()=>{setStatus('desconectado','err');setTimeout(connectWebPubSub,CONFIG.RECONNECT_MS);};
      ws.onerror=()=>setStatus('error','err');
      ws.onmessage=e=>{
        try{
          const raw=JSON.parse(e.data);
          let p;
          if(raw.content!==undefined) p=typeof raw.content==='string'?JSON.parse(raw.content):raw.content;
          else if(raw.data!==undefined) p=typeof raw.data==='string'?JSON.parse(raw.data):raw.data;
          else p=raw;
          handleMessage(p);
        }catch(err){console.error('WS parse:',err);}
      };
    }
  }catch(err){
    console.error('WPS connect error:',err);
    setStatus('error · '+err.message.substring(0,20),'err');
    setTimeout(connectWebPubSub,CONFIG.RECONNECT_MS);
  }
}

function handleMessage(p){
  if(!p)return;
  if(p.transcript&&p.speaker){appendTranscript(p.speaker,p.transcript);return;}
  if(p.type==='analysis'&&p.data){
    try{
      const parsed=JSON.parse(p.data.replace(/```json|```/g,'').trim());
      lastAnalysis=parsed;
      // Fill PO builder immediately with all detected fields
      _autoFillPO(parsed);
      renderTags(parsed);
      renderSentiment(parsed.sentimiento_cliente);
      if(parsed.insight_atencion)showInsight(parsed.insight_atencion);
      if(typeof Recs!=='undefined') Recs.check(parsed, parsed.sentimiento_cliente);
      // KB: validación en tiempo real
      const kbTxt = [parsed.tipo_asistencia,parsed.motivo_llamada,parsed.ubicación].filter(Boolean).join(' ');
      const kbAlertas = KB.buscar(kbTxt);
      kbAlertas.forEach(a => setTimeout(()=>showToast(a, 6000), 300));
      // KB: sugerencias por servicio
      const svcKbId = POBuilder._currentSvc?.id;
      if(svcKbId){ renderKBSugs(KB.sugerenciasParaServicio(svcKbId)); }
      showToast('✦ Análisis listo — datos inferidos automáticamente');
    }catch(e){console.warn('Analysis parse:',e);}
  }
}

function appendTranscript(speaker,text){
  checkKBTranscript(document.getElementById('t-body')?.innerText||'');
  const body=document.getElementById('t-body');
  if(body.querySelector('span[style]'))body.innerHTML='';
  const line=document.createElement('div');
  line.className='tline';
  const isAg=(speaker||'').toLowerCase().includes('agent')||(speaker||'').toLowerCase()==='agente';
  const spk=document.createElement('span');
  spk.className='spk '+(isAg?'ag':'cl');
  spk.textContent=isAg?'Agente':'Cliente';
  const txt=document.createElement('span');
  txt.className='stxt';
  txt.textContent=text;
  line.appendChild(spk);line.appendChild(txt);
  body.appendChild(line);
  // Smart scroll: only auto-scroll if user is near the bottom
  const isNearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 80;
  if(isNearBottom){
    body.scrollTop=body.scrollHeight;
    _hideScrollArrow();
  } else {
    _showScrollArrow();
  }
  if(typeof CallTimer!=='undefined') CallTimer.start();
  if(typeof ServiceDetector!=='undefined') ServiceDetector.analyze(text);
  // Re-check recs on every transcript line
  if(typeof Recs!=='undefined' && typeof lastAnalysis!=='undefined' && lastAnalysis){
    Recs.check(lastAnalysis, lastAnalysis.sentimiento_cliente, body.innerText);
  }
}

function _showScrollArrow(){
  const arr = document.getElementById('t-scroll-arrow');
  if(arr) arr.classList.add('show');
}
function _hideScrollArrow(){
  const arr = document.getElementById('t-scroll-arrow');
  if(arr) arr.classList.remove('show');
}
function _scrollToLatest(){
  const body = document.getElementById('t-body');
  if(body){ body.scrollTo({top:body.scrollHeight, behavior:'smooth'}); }
  _hideScrollArrow();
}

function renderTags(data){
  const c=document.getElementById('t-inferred');
  c.innerHTML='';
  const map=[
    {key:'nombre_cliente',icon:'👤',hint:'Nombre',fn:applyNombre},
    {key:'placa',icon:'🪪',hint:'Placa',fn:v=>setField('f-plate',v)},
    {key:'marca',icon:'🚗',hint:'Marca',fn:v=>setField('f-make',v)},
    {key:'modelo',icon:'🔖',hint:'Modelo',fn:v=>setField('f-model',v)},
    {key:'año',icon:'📅',hint:'Año',fn:v=>setField('f-year',v)},
    {key:'color',icon:'🎨',hint:'Color',fn:v=>setField('f-color',v)},
    {key:'ubicación',icon:'📍',hint:'Ubicación',fn:v=>setField('f-location',v)},
    {key:'tipo_asistencia',icon:'🔧',hint:'Asistencia',fn:()=>{}},
    {key:'motivo_llamada',icon:'📞',hint:'Motivo',fn:()=>{}},
  ];
  let d=0;
  map.forEach(f=>{
    const v=data[f.key];
    if(!v||!v.trim()||v==='N/A')return;
    const tag=document.createElement('div');
    tag.className='tag';
    tag.title='Click → '+f.hint;
    tag.textContent=f.icon+' '+v;
    tag.style.transitionDelay=d+'ms';
    tag.addEventListener('click',()=>{
      f.fn(v);tag.classList.add('done');
      showToast('✓ '+f.hint+' aplicado');
    });
    c.appendChild(tag);
    requestAnimationFrame(()=>tag.classList.add('show'));
    d+=70;
  });
}

function applyNombre(name){
  // Also fill POBuilder
  if(typeof POBuilder!=='undefined') POBuilder.addField('nombre_cliente',name,false);
  // Legacy field support
  const p=name.trim().split(' ');
  const fn=document.getElementById('f-fname');if(fn)fn.value=p[0]||'';
  const ln=document.getElementById('f-lname');if(ln&&p.length>1)ln.value=p.slice(1).join(' ');
}

function renderSentiment(sent){
  if(!sent)return;
  const row=document.getElementById('sentiment-card');if(row){row.classList.add('show');}
  const v=Number(sent.valor);
  const cfg={
    '-1':{ emoji:'😠', label:'Molesto',    color:'#ef4444', pct:10, gradient:'linear-gradient(90deg,#ef4444,#f87171)' },
     '0':{ emoji:'😐', label:'Neutro',     color:'#f59e0b', pct:50, gradient:'linear-gradient(90deg,#f59e0b,#fcd34d)' },
     '1':{ emoji:'😊', label:'Satisfecho', color:'#22c55e', pct:88, gradient:'linear-gradient(90deg,#22c55e,#4ade80)' },
  };
  const c = cfg[String(v)] || cfg['0'];
  const emoji = document.getElementById('sent-emoji');
  emoji.textContent = c.emoji;
  emoji.style.animation = 'none';
  requestAnimationFrame(()=>{ emoji.style.animation=''; });
  const lbl = document.getElementById('sentiment-label');
  lbl.textContent = c.label;
  lbl.style.color = c.color;
  document.getElementById('sentiment-val').textContent = sent.descripcion || '';
  const fill = document.getElementById('sentiment-fill');
  fill.style.width = c.pct + '%';
  fill.style.background = c.gradient;
}

function showInsight(text){
  const card=document.getElementById('insight');
  document.getElementById('insighttxt').textContent=text;
  card.style.display='block';
}

function applyAnalysis(){
  if(!lastAnalysis){showToast('⚠ Sin análisis disponible');return;}
  const a=lastAnalysis; let n=0;
  // Map analysis fields to POBuilder (Helios uses POBuilder, not f-* IDs)
  const fieldMap=[
    ['tipo_asistencia',a.tipo_asistencia],
    ['nombre_cliente', a.nombre_cliente],
    ['ubicación',      a.ubicación],
    ['placa',          a.placa],
    ['marca',          a.marca],
    ['modelo',         a.modelo],
    ['año',            a.año],
    ['color',          a.color],
  ];
  fieldMap.forEach(([key,val])=>{
    if(val?.trim&&val.trim()&&val!=='N/A'){
      POBuilder.addField(key,val,false);
      n++;
    }
  });
  document.querySelectorAll('.tag').forEach(t=>t.classList.add('done'));
  showToast(n>0?'✓ SmartFill aplicó '+n+' campos':'⚠ Conversación sin datos aún');
  if(a.sentimiento_cliente) renderSentiment(a.sentimiento_cliente);
  if(a.insight_atencion) showInsight(a.insight_atencion);
}

function setField(id,val){
  const el=document.getElementById(id);
  if(!el||!val)return;
  el.value=val;el.classList.remove('hl');el.classList.add('ok');
}

function triggerSmartFill(){
  const payload={callUniqueId:'DEMO-'+Date.now(),transcript:'Hola buenos días, le llama Mariam Fernandez, cédula 101230456, teléfono 12345678, tengo un Land Rover Range Rover 97, gris, placa ARC123, me quedé varada cerca del Parque Central.',speaker:'cliente'};
  appendTranscript(payload.speaker,payload.transcript);
  setTimeout(()=>{
    const demo={placa:'ARC123',marca:'Land Rover',modelo:'Range Rover',año:'1997',color:'Gris',nombre_cliente:'Mariam Fernandez',ubicación:'Parque Central, San José',tipo_asistencia:'Avería en vía',sentimiento_cliente:{valor:0,descripcion:'Tranquila pero urgente'},motivo_llamada:'Vehículo varado',protocolo_agente:{cumple:true,detalles:'Saludo correcto'},insight_atencion:'Zona céntrica con tráfico. Prioriza despacho rápido y confirma ETA al cliente.'};
    lastAnalysis=demo;
    _autoFillPO(demo);
    // KB: mostrar checklist y validaciones
    setTimeout(()=>{
      const svcId = 'grua'; // demo es avería = grúa
      initKBChecklist(svcId);
      const kbAlertas = KB.buscar(demo.tipo_asistencia + ' ' + demo.motivo_llamada);
      kbAlertas.forEach((a,i) => setTimeout(()=>showToast(a, 6000), i*800));
    }, 500);
    renderTags(demo);
    renderSentiment(demo.sentimiento_cliente);
    showInsight(demo.insight_atencion);
    if(typeof Recs!=='undefined') Recs.check(demo, demo.sentimiento_cliente);
    showToast('✦ Demo: análisis listo — datos cargados en PO');
  },1800);
  try{fetch(CONFIG.FUNCTION_URL,{method:'POST',headers:{'Authorization':'Bearer '+CONFIG.AUTH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
  }catch(e){console.warn("Demo fetch:",e);}
}

function setStatus(text,state){
  const dot=document.getElementById('cdot');
  const lbl=document.getElementById('clbl');
  dot.className='cdot '+state;
  lbl.textContent=text;
}

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3000);
}

window.addEventListener('DOMContentLoaded', ()=>{ setTheme('light'); connectWebPubSub(); });

function triggerDemo(){ AgentBar.setDemo(); triggerSmartFill(); }
let _poList = [];
let _activeDetail = -1;
let _poCount = 0;

function setTheme(t){
  isDark = (t === 'dark');
  document.body.classList.toggle('light', !isDark);
  document.getElementById('th-dark').classList.toggle('on', isDark);
  document.getElementById('th-light').classList.toggle('on', !isDark);
}

const CallTimer=(()=>{
  let _s=null,_t=null,_on=false;
  const W=4*60,A=6*60;
  function fmt(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
  function tick(){
    if(!_on)return;
    const s=Math.floor((Date.now()-_s)/1000);
    const v=document.getElementById('call-timer-val');
    const d=document.getElementById('t-dot');
    const l=null; // timer-lbl removed from compact bar
    const al=document.getElementById('t-alert');
    if(v)v.textContent=fmt(s);
    if(v&&d){
      v.className='td-num';d.className='td-dot';
      if(al) al.style.display='none'; // hide by default
      if(s>=A){
        v.classList.add('alert'); d.classList.add('alert');
        if(al){ al.style.display='inline'; al.className='t-row-alert on'; }
      } else if(s>=W){
        v.classList.add('warn'); d.classList.add('warn');
        if(al) al.style.display='none'; // no icon on warn, just color
      } else {
        // normal — dot stays green
        d.style.background='#6aaa90';
      }
    }
    _t=setTimeout(tick,1000);
  }
  function start(){
    if(_on)return;_on=true;_s=Date.now();
    const row=document.getElementById('timer-row');if(row)row.classList.add('on');
    tick();
  }
  function reset(){
    _on=false;clearTimeout(_t);
    const row=document.getElementById('timer-row');if(row)row.classList.remove('on');
    const v=document.getElementById('call-timer-val');if(v){v.textContent='0:00';v.className='td-num';}
    const d=document.getElementById('t-dot');if(d)d.className='td-dot';
    const l=document.getElementById('call-timer-lbl');if(l)l.textContent='En llamada';
    const al=document.getElementById('t-alert');if(al){al.className='t-row-alert';al.style.display='none';}
  }
  return{start,reset};
})();

