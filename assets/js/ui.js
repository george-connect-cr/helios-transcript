
const FlashPill = (() => {
  let _queue = [], _running = false;

  function show(icon, label, value) {
    _queue.push({icon, label, value});
    if (!_running) _next();
  }

  function _next() {
    if (!_queue.length) { _running = false; return; }
    _running = true;
    const {icon, label, value} = _queue.shift();
    const stage = document.getElementById('flash-stage');
    if (!stage) { _running = false; return; }

    const pill = document.createElement('div');
    pill.className = 'flash-pill';
    pill.innerHTML = `<span class="flash-ico">${icon}</span><span class="flash-lbl">${label}</span><span class="flash-val">${value}</span>`;
    stage.appendChild(pill);

    // auto-remove after 2s
    setTimeout(() => {
      pill.classList.add('out');
      setTimeout(() => { pill.remove(); _next(); }, 300);
    }, 1800);
  }

  return { show };
})();


const ServiceDetector=(()=>{
  const S=[
    {id:'grua',n:'Grúa / Remolque',i:'🚛',h:'Vehículo varado — necesita remolque',c:'hi',kw:[/\bgrú[a]?\b/i,/\bremolque\b/i,/\bvarad[oa]\b/i,/\bno arranca\b/i,/\bno enciende\b/i,/\baccidente\b/i,/\bchoc[oó]\b/i,/\batascad[oa]\b/i]},
    {id:'bat',n:'Batería descargada',i:'🔋',h:'Arranque o cambio de batería',c:'hi',kw:[/\bbater[íi]a\b/i,/\bno prende\b/i,/\bdescargada\b/i,/\bjump\b/i,/\bcables\b/i]},
    {id:'llanta',n:'Llanta ponchada',i:'🛞',h:'Cambio de neumático',c:'hi',kw:[/\bllanta\b/i,/\bponch[ae]\b/i,/\bneum[aá]tico\b/i,/\bdesinflad[oa]\b/i,/\breventó\b/i]},
    {id:'gas',n:'Sin combustible',i:'⛽',h:'Suministro de gasolina o diesel',c:'hi',kw:[/\bgasolina\b/i,/\bcombustible\b/i,/\btanque vac[íi]o\b/i]},
    {id:'llaves',n:'Apertura de vehículo',i:'🔑',h:'Llaves perdidas o encerradas',c:'hi',kw:[/\bllaves?\b/i,/\bencerr[aá]d[oa]\b/i,/\bno puedo abrir\b/i,/\bapertura\b/i]},
    {id:'mec',n:'Asistencia mecánica',i:'🔧',h:'Falla mecánica en ruta',c:'md',kw:[/\bfalla\b/i,/\bhumo\b/i,/\brecalentad[oa]\b/i,/\bfrenos?\b/i,/\bgotea\b/i]},
    {id:'info',n:'Consulta informativa',i:'ℹ️',h:'El cliente solicita información',c:'lo',kw:[/\bcuánto cuesta\b/i,/\bprecio\b/i,/\bcobertura\b/i,/\bpóliza\b/i]},
  ];
  let _det=null,_sc={};
  function analyze(t){
    const lo=t.toLowerCase();let best=null,bs=0;
    S.forEach(s=>{
      let sc=0;s.kw.forEach(r=>{if(r.test(lo))sc++;});
      _sc[s.id]=(_sc[s.id]||0)+sc;
      if(_sc[s.id]>bs){bs=_sc[s.id];best=s;}
    });
    if(best&&bs>0&&best.id!==_det){_det=best.id;_show(best);}
  }
  let _dismissTimer=null, _shownOnce=false;
  function _show(s){
    const pop=document.getElementById('svc-popup');
    if(!pop)return;
    // fill popup
    document.getElementById('svc-ico').textContent=s.i;
    document.getElementById('svc-name').textContent=s.n;
    document.getElementById('svc-hint').textContent=s.h;
    const conf=document.getElementById('svc-conf');
    conf.textContent={hi:'Alta confianza',md:'Confianza media',lo:'Baja confianza'}[s.c];
    conf.className='svc-pop-badge '+s.c;
    // Only show popup if not already shown for this service
    if(!_shownOnce){
      _shownOnce=true;
      clearTimeout(_dismissTimer);
      pop.classList.add('show');
      _dismissTimer=setTimeout(()=>{ pop.classList.remove('show'); }, 3000);
    }
    if(window.lastAnalysis)window.lastAnalysis.tipo_asistencia=s.n;
    else window._detectedService=s.n;
    document.getElementById('ca-empty').style.display='none';
    POBuilder.setService(s.id, s.n);
  }
  function reset(){_det=null;_sc={};_shownOnce=false;clearTimeout(_dismissTimer);const p=document.getElementById('svc-popup');if(p)p.classList.remove('show');}
  return{analyze,reset};
})();


const Recs=(()=>{
  let _a=new Set();
  const C=[
    {id:'placa',ico:'🪪',lbl:'Placa',
      txt:'Confirma la placa del vehículo con el cliente para evitar errores.',
      trig:d=>!d.placa, done:(d,s,t)=>!!d.placa||(t||'').toLowerCase().includes('tablilla')},
    {id:'ubic_ref',ico:'📍',lbl:'Referencia',
      txt:'Solicita un punto de referencia adicional para facilitar el despacho.',
      trig:d=>!!d.ubicación&&d.ubicación.length<22, done:d=>d.ubicación&&d.ubicación.length>=22},
    {id:'eta',ico:'⏱',lbl:'ETA',
      txt:'Comunica el tiempo estimado de llegada antes de cerrar la llamada.',
      trig:d=>!!d.tipo_asistencia&&!!d.ubicación,
      done:(d,s,t)=>{
        const txt=(t||'').toLowerCase();
        return txt.includes('minuto') || txt.includes('eta') || txt.includes('tiempo estimado') ||
               txt.includes('llegará en') || txt.includes('llega en') || txt.includes('aproximadamente') ||
               txt.includes('media hora') || txt.includes('veinte minutos') || txt.includes('treinta minutos');
      }},
    {id:'sent_neg',ico:'⚠️',lbl:'Cliente molesto',
      txt:'El cliente parece molesto. Usa lenguaje empático y ofrece solución concreta.',
      trig:(d,s)=>s&&Number(s.valor)===-1,
      done:(d,s,t)=>{
        const txt=(t||'').toLowerCase();
        return txt.includes('entiendo') || txt.includes('comprendo') || txt.includes('disculpe') ||
               txt.includes('le ofrezco') || txt.includes('lo ayudo') || txt.includes('solución');
      }},
  ];
  function check(data,sent,transcriptText){
    const t = transcriptText || document.getElementById('t-body')?.innerText || '';
    C.forEach(c=>{
      if(_a.has(c.id)){if(c.done(data,sent,t))_dismiss(c.id);}
      else if(c.trig(data,sent)){_a.add(c.id);_show(c);}
    });
  }
  function _show(c){
    const s=document.getElementById('rec-stack');
    if(!s||document.getElementById('rec_'+c.id))return;
    const t=document.createElement('div');
    t.className='rec-toast';t.id='rec_'+c.id;
    t.innerHTML=`<div class="rec-ico">${c.ico}</div><div class="rec-body"><div class="rec-lbl">✦ ${c.lbl}</div><div class="rec-txt">${c.txt}</div></div><button class="rec-done-btn" onclick="Recs.dismiss('${c.id}')" title="Cumplido">✓</button>`;
    s.appendChild(t);
    requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  }
  function _dismiss(id){
    const t=document.getElementById('rec_'+id);
    if(t){
      t.classList.add('done');
      setTimeout(()=>t.remove(), 850);
    }
    _a.delete(id);
  }
  function dismiss(id){_dismiss(id);}
  function showInsightText(text){
    if(!text)return;
    const id='ins_'+Date.now();
    const s=document.getElementById('rec-stack');if(!s)return;
    const t=document.createElement('div');t.className='rec-toast';t.id='rec_'+id;
    t.innerHTML=`<div class="rec-ico">✦</div><div class="rec-body"><div class="rec-lbl">Recomendación IA</div><div class="rec-txt">${text}</div></div><button class="rec-done-btn" onclick="Recs.dismiss('${id}')" title="Entendido">✓</button>`;
    s.appendChild(t);
    requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
    setTimeout(()=>_dismiss(id),14000);
  }
  function reset(){_a.clear();const s=document.getElementById('rec-stack');if(s)s.innerHTML='';}
  return{check,dismiss,showInsightText,reset};
})();

