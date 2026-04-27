
const AgentBar = (() => {
  let done = 0, goal = 20;  // done = POs creados en el día

  function setDemo(){ done = 19; sync(); }

  function sync() {
    const pct = Math.round(done / goal * 100);
    const dEl = document.getElementById('ag-done');
    const bEl = document.getElementById('ag-bar');
    const sEl = document.getElementById('ag-star');

    if(dEl) dEl.textContent = done;
    if(bEl){
      bEl.style.width = Math.min(pct, 100) + '%';
      bEl.classList.toggle('done', pct >= 100);
    }

    // Star fills progressively based on % toward goal
    if(sEl){
      if(pct <= 0){
        // Empty — grayscale
        sEl.style.filter = 'grayscale(1) brightness(10)';
        sEl.style.opacity = '.25';
        sEl.classList.remove('on');
      } else if(pct < 50){
        // Quarter fill — slight color
        sEl.style.filter = 'sepia(1) saturate(1.5) hue-rotate(5deg)';
        sEl.style.opacity = '.5';
        sEl.classList.remove('on');
      } else if(pct < 80){
        // Half fill — more color
        sEl.style.filter = 'sepia(1) saturate(2) hue-rotate(5deg)';
        sEl.style.opacity = '.75';
        sEl.classList.remove('on');
      } else if(pct < 100){
        // Almost there — vivid
        sEl.style.filter = 'none';
        sEl.style.opacity = '.9';
        sEl.classList.remove('on');
      } else {
        // 100% — full glow + animation
        sEl.style.filter = 'none';
        sEl.style.opacity = '1';
        if(!sEl.classList.contains('on')){
          sEl.classList.add('on');
          showCelebration(done, goal);
        }
      }
    }
  }

  function init() { sync(); }

  function increment() {
    done = Math.min(done + 1, goal);
    sync();
    if(done >= goal){
      setTimeout(()=>showCelebration(done, goal), 200);
    } else {
      showToast('PO #' + done + ' registrado — ' + Math.round(done/goal*100) + '% de meta');
    }
  }

  return { init, increment, setDemo };
})();


function _autoFillPO(data){
  if(!data.placa&&data.tablilla)data.placa=data.tablilla;
  const map=[
    ['tipo_asistencia',data.tipo_asistencia],
    ['nombre_cliente', data.nombre_cliente],
    ['ubicación',      data.ubicación],
    ['placa',          data.placa],
    ['marca',          data.marca],
    ['modelo',         data.modelo],
    ['año',            data.año],
    ['color',          data.color],
    ['ubicacion_destino', data.ubicacion_destino],
  ];
  const toAdd = map.filter(([k,v])=>v&&v!=='N/A');
  if(!toAdd.length) return;

  // Block popup during fill
  _pvpDismissed = true;

  // Add all fields synchronously so _data is complete
  toAdd.forEach(([key,val]) => POBuilder.addField(key, val, true));

  if(data.tipo_asistencia) ServiceDetector.analyze(data.tipo_asistencia);

  // After DOM settles, unblock and open popup once with complete data (unless user closed it)
  setTimeout(()=>{
    _pvpDismissed = false;
    if(!_pvpClosedByUser) openPOValidation();
  }, 400);
}

function confirmPO(){
  try{
    // Sync popup edits back to POBuilder
    document.querySelectorAll('.pvp-input').forEach(inp=>{
      if(inp.dataset.key && inp.value.trim())
        POBuilder._edit(inp.dataset.key, inp.value.trim());
    });
    // Read nota from popup BEFORE closing it
    const pvpNota = document.getElementById('pvp-nota');
    const notaFromPopup = pvpNota ? pvpNota.value.trim() : '';

    _pvpDismissed=false;
    closePOValidation();

    const data = POBuilder.getData();
    // Apply nota: popup takes priority over notes area
    const noteEl = document.getElementById('pb-notes-ta');
    if(noteEl && noteEl.value.trim()) data.nota = noteEl.value.trim();
    if(notaFromPopup) data.nota = notaFromPopup;

    const num = 'PO-' + Math.floor(100000+Math.random()*900000);
    const now = new Date();
    const ts  = now.toLocaleString('es-CR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});

    const timerEl = document.getElementById('call-timer-val');
    const callDuration = timerEl ? timerEl.textContent : '—';

    const sent  = lastAnalysis?.sentimiento_cliente || null;
    const proto = lastAnalysis?.protocolo_agente    || null;
    const scores = _buildScores(data, sent, proto, callDuration);

    const svcId = POBuilder._currentSvc?.id || 'grua';
    const WAIT  = {grua:20,bat:15,llanta:15,gas:25,llaves:20,mec:25,info:5};

    // Save to list
    const poEntry = {num, ts, data:{...data},
      meta:{callDuration, sentVal:sent?Number(sent.valor):0,
            waitTime:WAIT[svcId]||15, scores}};
    _poList.push(poEntry);
    _poCount = _poList.length;

    // Update counter pill
    const ctr  = document.getElementById('po-counter');
    const cnum = document.getElementById('po-count-num');
    if(cnum) cnum.textContent = _poCount;
    if(ctr)  ctr.classList.add('show');

    // Add to drawer
    _renderDrawerCard(poEntry);
    updateDrawerCount();

    // Fill confirm modal
    const pcmNum  = document.getElementById('pcm-num');
    const pcmTs   = document.getElementById('pcm-ts');
    const pcmBody = document.getElementById('pcm-body');
    if(pcmNum) pcmNum.textContent = num;
    if(pcmTs)  pcmTs.textContent  = ts;
    if(pcmBody){
      pcmBody.innerHTML = '';
      const ICONS={tipo_asistencia:'🔧',nombre_cliente:'👤',ubicación:'📍',
                   placa:'🪪',marca:'🚗',modelo:'🔖',año:'📅',color:'🎨'};
      const LBLS ={tipo_asistencia:'Servicio',nombre_cliente:'Cliente',ubicación:'Ubicación',
                   placa:'Placa',marca:'Marca',modelo:'Modelo',año:'Año',color:'Color'};
      Object.entries(ICONS).forEach(([k,ico])=>{
        const val=data[k]; if(!val||String(val).trim()===''||val==='N/A') return;
        const row=document.createElement('div'); row.className='pcm-field';
        row.innerHTML='<span class="pd-det-i">'+ico+'</span><div><div class="pd-det-lbl">'+LBLS[k]+'</div><div class="pd-det-v">'+String(val)+'</div></div>';
        pcmBody.appendChild(row);
      });

      // Nota: read directly from both sources
      const notaFinal = _pvpNotaValue ||
        notaFromPopup ||
        (document.getElementById('pb-notes-ta')||{}).value?.trim() || '';
      if(notaFinal){
        const nrow=document.createElement('div'); nrow.className='pcm-field';
        nrow.innerHTML='<span class="pd-det-i" style="filter:grayscale(1) brightness(10);opacity:.85;transition:filter .2s,opacity .2s" class="pcm-nota-ico">📝</span><div><div class="pd-det-lbl">Nota</div><div class="pd-det-v" style="font-style:italic;color:var(--t1)">'+notaFinal+'</div></div>';
        pcmBody.appendChild(nrow);
        data.nota = notaFinal; // ensure saved in poEntry
        _pvpNotaValue = ''; // reset after use
      }
    }

    const ov = document.getElementById('po-confirm-ov');
    if(ov) ov.classList.add('show');

    POBuilder.reset();
    AgentBar.increment();
    showToast('PO '+num+' creado');
  }catch(err){
    console.error('confirmPO error:', err);
    showToast('Error al crear PO: '+err.message);
  }
}

function closePOConfirm(){document.getElementById('po-confirm-ov').classList.remove('show');}

function openMapFromPO(){if(_poData.data?.ubicación)window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(_poData.data.ubicación+', Costa Rica'),'_blank');}

function resetPOBuilder(){POBuilder.reset();}

function openDrawer(){
  renderDrawer();
  document.getElementById('po-drawer-ov').classList.add('show');
}


function renderDrawer(){
  const list  = document.getElementById('pd-list');
  const empty = document.getElementById('pd-empty');
  const cnt   = document.getElementById('pdh-count');
  if(cnt) cnt.textContent = _poList.length + ' POs';
  if(!list) return;
  if(!_poList.length){
    if(empty) empty.style.display='flex';
    list.innerHTML='';
    return;
  }
  if(empty) empty.style.display='none';
  list.innerHTML='';
  [..._poList].reverse().forEach(po=>{
    const card = document.createElement('div');
    card.className = 'pd-card';
    card.id = 'pdc_'+po.num;
    card.onclick = ()=>openDetail(po.num);
    card.innerHTML =
      '<div class="pd-card-top">'+
        '<span class="pd-card-num">'+po.num+'</span>'+
        '<span class="pd-card-svc">'+(po.data.tipo_asistencia||'—')+'</span>'+
        '<span class="pd-card-ts">'+po.ts+'</span>'+
      '</div>'+
      '<div class="pd-card-fields">'+
        (po.data.nombre_cliente?'<span class="pd-card-tag">👤 '+po.data.nombre_cliente+'</span>':'')+
        (po.data.placa?'<span class="pd-card-tag">🪪 '+po.data.placa+'</span>':'')+
        (po.data.ubicación?'<span class="pd-card-tag">📍 '+po.data.ubicación+'</span>':'')+
      '</div>';
    list.appendChild(card);
  });
}

function closeDrawer(){
  document.getElementById('po-drawer-ov').classList.remove('show');
  closeDetail();
}

function filterPOs(query){
  const q=query.trim().toLowerCase();
  const clear=document.getElementById('pd-search-clear');
  if(clear) clear.classList.toggle('show', q.length>0);

  const cards=document.querySelectorAll('.pd-card');
  let visible=0;
  cards.forEach(card=>{
    const match = !q || card.textContent.toLowerCase().includes(q);
    card.style.display = match ? '' : 'none';
    if(match) visible++;
  });
  const empty=document.getElementById('pd-empty');
  if(empty) empty.style.display = (visible===0 && _poList.length>0) ? 'flex' : 'none';
  // update empty text
  if(empty && q && visible===0) empty.querySelector('.pd-empty-t').textContent='Sin resultados para "'+query+'"';
  else if(empty && _poList.length===0) { empty.style.display='flex'; empty.querySelector('.pd-empty-t').textContent='No hay POs creados aún'; }
}

function clearSearch(){
  const inp=document.getElementById('pd-search-input');
  if(inp){ inp.value=''; filterPOs(''); }
}

function openDetail(num){
  const po = _poList.find(p=>p.num===num);
  if(!po) return;
  _activeDetailId = num;
  const m  = po.meta || {};
  const sc = m.scores || {satisfaction:70,ahtScore:80,completeness:75,speechScore:80,speechItems:[]};

  // Highlight active card
  document.querySelectorAll('.pd-card').forEach(c=>c.classList.remove('active'));
  const activeCard = document.getElementById('pdc_'+num);
  if(activeCard) activeCard.classList.add('active');

  // Header
  const detNum = document.getElementById('pd-det-num');
  const detTs  = document.getElementById('pd-det-ts');
  if(detNum) detNum.textContent = num;
  if(detTs)  detTs.textContent  = po.ts;

  const body = document.getElementById('pd-det-body');
  if(!body) return;

  const sentLbl = m.sentVal===1?'Satisfecho':m.sentVal===0?'Neutro':'Molesto';
  const sentEmo = m.sentVal===1?'😊':m.sentVal===0?'😐':'😠';

  // Build HTML
  const ICONS = {tipo_asistencia:'🔧',nombre_cliente:'👤',ubicación:'📍',
                 placa:'🪪',marca:'🚗',modelo:'🔖',año:'📅',color:'🎨',nota:'📝'};
  const LBLS  = {tipo_asistencia:'Servicio',nombre_cliente:'Cliente',ubicación:'Ubicación',
                 placa:'Placa',marca:'Marca',modelo:'Modelo',año:'Año',color:'Color',nota:'Nota'};

  let html = '<div class="pd-det-fields">';
  Object.entries(ICONS).forEach(([k,ico])=>{
    const val = po.data[k];
    if(!val||String(val).trim()===''||val==='N/A') return;
    html += '<div class="pd-det-row"><span class="pd-det-i">'+ico+'</span><div><div class="pd-det-lbl">'+LBLS[k]+'</div><div class="pd-det-v">'+String(val)+'</div></div></div>';
  });
  html += '</div>';

  // Metrics
  html += '<div class="pd-metrics">';
  html += '<div class="pd-metric"><div class="pd-metric-lbl">Sentimiento</div><div class="pd-metric-val" style="font-size:20px">'+sentEmo+'</div><div class="pd-metric-sub">'+sentLbl+'</div></div>';
  html += '<div class="pd-metric"><div class="pd-metric-lbl">Duración</div><div class="pd-metric-val">'+(m.callDuration||'—')+'</div></div>';
  html += '<div class="pd-metric"><div class="pd-metric-lbl">Espera est.</div><div class="pd-metric-val">'+(m.waitTime?m.waitTime+' min':'—')+'</div></div>';
  html += '</div>';

  // Score bars
  const scoreRows = [
    {l:'Satisfacción',v:sc.satisfaction},
    {l:'AHT',         v:sc.ahtScore},
    {l:'Completitud', v:sc.completeness},
    {l:'Speech',      v:sc.speechScore},
  ];
  html += '<div class="pd-scores">';
  scoreRows.forEach(s=>{
    const c = s.v>=80?'good':s.v>=60?'warn':'bad';
    html += '<div class="pd-score-row"><span class="pd-score-lbl">'+s.l+'</span><div class="pd-score-bar"><div class="pd-score-fill '+c+'" style="width:'+s.v+'%"></div></div><span class="pd-score-num '+c+'">'+s.v+'%</span></div>';
  });
  html += '</div>';

  // Speech
  if(sc.speechItems&&sc.speechItems.length){
    html += '<div class="pd-speech"><div class="pd-speech-title">Speech</div>';
    sc.speechItems.forEach(item=>{
      html += '<div class="pd-speech-item"><div class="pd-speech-dot '+(item.ok?'ok':'fail')+'"></div>'+item.label+'</div>';
    });
    html += '</div>';
  }

  body.innerHTML = html;
  document.getElementById('pd-detail').classList.remove('hidden');
}

function closeDetail(){
  _activeDetailId=null;
  document.querySelectorAll('.pd-card').forEach(c=>c.classList.remove('active'));
  document.getElementById('pd-detail').classList.add('hidden');
}

function openMapFromDetail(){
  const po=_poList.find(p=>p.num===_activeDetailId);
  if(po?.data?.ubicación)
    window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(po.data.ubicación+', Costa Rica'),'_blank');
}

function openDashboard(){_buildDashboard();document.getElementById('dash-ov').classList.add('show');document.getElementById('dash-date').textContent=new Date().toLocaleDateString('es-CR',{weekday:'long',day:'numeric',month:'long'});}

function closeDashboard(){document.getElementById('dash-ov').classList.remove('show');}

function _buildDashboard(){
  const pos=_poList, n=pos.length;
  const avg=arr=>arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length):0;
  const satAvg=avg(pos.map(p=>p.meta?.scores?.satisfaction||0))||72;
  const ahtAvg=avg(pos.map(p=>p.meta?.scores?.ahtScore||0))||80;
  const compAvg=avg(pos.map(p=>p.meta?.scores?.completeness||0))||75;
  const speechAvg=avg(pos.map(p=>p.meta?.scores?.speechScore||0))||78;
  const overall=Math.round(satAvg*.35+ahtAvg*.2+compAvg*.25+speechAvg*.2);

  // Date
  const dd=document.getElementById('dash-date');
  if(dd) dd.textContent=new Date().toLocaleDateString('es-CR',{weekday:'long',day:'numeric',month:'long'});
  const dd2=document.getElementById('dash-date2');
  if(dd2) dd2.textContent=new Date().toLocaleDateString('es-CR',{day:'2-digit',month:'short'});

  // Ring
  const ring=document.getElementById('dash-ring-fill');
  const scoreEl=document.getElementById('dash-total-score');
  if(scoreEl) scoreEl.textContent=overall;
  setTimeout(()=>{
    if(ring){
      const c=overall>=80?'var(--g)':overall>=60?'var(--y)':'var(--r)';
      ring.style.strokeDashoffset=402-(402*overall/100);
      ring.style.stroke=c;
    }
  },100);

  // Grade
  const R=[{min:88,lbl:'A+',sub:'Rendimiento excepcional. Superaste todos los estándares.'},{min:73,lbl:'A',sub:'Buen desempeño. Cumpliste la mayoría de estándares.'},{min:55,lbl:'B',sub:'Desempeño aceptable con oportunidades de mejora.'},{min:0,lbl:'C',sub:'Varios indicadores por debajo del estándar.'}];
  const r=R.find(x=>overall>=x.min);
  const gradeEl=document.getElementById('dash-grade');
  const descEl=document.getElementById('dash-grade-desc');
  if(gradeEl){ gradeEl.textContent=r.lbl; gradeEl.style.color=overall>=73?'var(--g)':overall>=55?'var(--y)':'var(--r)'; }
  if(descEl) descEl.textContent=r.sub;

  // KPIs
  const fcr=n>0?Math.round(pos.filter(p=>(p.meta?.scores?.completeness||0)>=75).length/n*100):87;
  const kpis={
    'dk-pos': n,
    'dk-sat': satAvg+'%',
    'dk-aht': ahtAvg+'%',
    'dk-fcr': fcr+'%',
    'dk-speech': speechAvg+'%',
  };
  Object.entries(kpis).forEach(([id,val])=>{
    const el=document.getElementById(id);
    if(el) el.textContent=val;
  });
  const satEl=document.getElementById('dk-sat');
  if(satEl) satEl.className='dash-kpi-val '+(satAvg>=80?'g':satAvg>=65?'y':'r');

  // Score bars
  const sb=document.getElementById('dash-score-bars');
  if(sb){
    sb.innerHTML=[
      {l:'Satisfacción',v:satAvg},{l:'AHT',v:ahtAvg},
      {l:'Completitud',v:compAvg},{l:'Speech',v:speechAvg},{l:'Total',v:overall}
    ].map(s=>{
      const c=s.v>=80?'g':s.v>=60?'y':'r';
      const col=s.v>=80?'var(--g)':s.v>=60?'var(--y)':'var(--r)';
      return`<div class="dsb-row"><span class="dsb-lbl">${s.l}</span><div class="dsb-bar"><div class="dsb-fill ${c}" style="width:0%" data-w="${s.v}%"></div></div><span class="dsb-num" style="color:${col}">${s.v}%</span></div>`;
    }).join('');
    setTimeout(()=>sb.querySelectorAll('.dsb-fill').forEach(f=>f.style.width=f.dataset.w),160);
  }

  // Calls list
  const ce=document.getElementById('dash-calls');
  if(ce){
    if(n===0){
      ce.innerHTML='<div class="dash-empty-calls">Sin POs registrados aún. Usa ✦ Demo para ver un ejemplo.</div>';
    } else {
      ce.innerHTML=pos.map((po,idx)=>{
        const tot=po.meta?.scores?Math.round((po.meta.scores.satisfaction*.3+po.meta.scores.ahtScore*.2+po.meta.scores.completeness*.2+po.meta.scores.speechScore*.3)):72;
        const c=tot>=80?'g':tot>=65?'y':'r';
        return`<div class="dpo-row" id="dpo_${idx}" onclick="_toggleDPO(${idx})"><span class="dash-call-num">${po.num}</span><span class="dash-call-svc">${po.data.tipo_asistencia||'—'} · ${po.data.nombre_cliente||'—'}</span><span class="dash-call-score ${c}">${tot}%</span><span class="dash-call-ts">${po.ts}</span><span class="dpo-chevron">›</span></div><div class="dpo-detail" id="dpod_${idx}"></div>`;
      }).join('');
    }
  }

  // Speech compliance
  const defP=['Saludo de bienvenida','Identificación del cliente','Validación de ubicación','Confirmación de servicio','ETA comunicado al cliente'];
  const allI={};
  pos.forEach(po=>(po.meta?.scores?.speechItems||[]).forEach(it=>{
    if(!allI[it.label])allI[it.label]={ok:0,total:0};
    allI[it.label].total++;if(it.ok)allI[it.label].ok++;
  }));
  const spEl=document.getElementById('dash-speech-detail');
  if(spEl) spEl.innerHTML=defP.map(k=>{
    const d=allI[k]||{ok:0,total:n||1};
    const pct=n>0?Math.round(d.ok/d.total*100):0;
    const ok=pct>=70||n===0;
    return`<div class="dsd-row"><div class="dsd-dot ${ok?'ok':'fail'}"></div><span class="dsd-lbl">${k}</span><span class="dsd-rate" style="color:var(--${ok?'g':'r'})">${n>0?pct+'%':'—'}</span></div>`;
  }).join('');

  // Recommendations
  const recsEl=document.getElementById('dash-recs');
  if(recsEl) recsEl.innerHTML=_genRecs(overall,satAvg,ahtAvg,compAvg,speechAvg,n,0).map(r=>{
    const cl=r.p==='alta'?'r':r.p==='media'?'y':'g';
    return`<div class="dash-rec ${cl}"><div class="dash-rec-head"><span class="dash-rec-ico">${r.ico}</span><span class="dash-rec-title">${r.title}</span><span class="dash-rec-badge ${cl}">${r.p}</span></div><div class="dash-rec-txt">${r.body}</div></div>`;
  }).join('');
}

function _genRecs(overall,sat,aht,comp,speech,n,wait){
  const recs=[];
  if(sat<70)recs.push({ico:'😊',title:'Mejorar empatía con el cliente',body:'El índice de satisfacción está por debajo del estándar. Practica frases de empatía y confirma comprensión durante la llamada.',p:'alta'});
  if(aht<70)recs.push({ico:'⏱',title:'Reducir tiempo de atención',body:'El AHT supera el rango óptimo. Prepara las preguntas clave y evita silencios prolongados.',p:'alta'});
  if(comp<75)recs.push({ico:'📋',title:'Capturar todos los datos del PO',body:'Nombre, placa, ubicación y tipo de servicio son obligatorios. Completa el formulario en cada llamada.',p:'alta'});
  if(speech<70)recs.push({ico:'🎤',title:'Reforzar protocolo de atención',body:'El cumplimiento del speech está por debajo del 70%. Repasa: bienvenida, confirmación y ETA al cliente.',p:'media'});
  if(wait>22)recs.push({ico:'🚀',title:'Optimizar despacho en hora pico',body:'Los tiempos de espera son altos. Coordina con el equipo para priorizar casos urgentes en franjas críticas.',p:'media'});
  if(n===0)recs.push({ico:'📊',title:'Crea POs durante las llamadas',body:'Sin POs no hay métricas de desempeño. Completa el formulario en cada llamada de asistencia.',p:'media'});
  if(overall>=85)recs.push({ico:'⭐',title:'Mantén el nivel de excelencia',body:'Tu rendimiento supera el estándar del equipo. Considera compartir tus mejores prácticas.',p:'baja'});
  if(!recs.length)recs.push({ico:'👍',title:'Buen trabajo general',body:'Tu desempeño es sólido. Busca consistencia y mejora continua día a día.',p:'baja'});
  return recs.slice(0,5);
}

function _toggleDPO(idx){
  const row=document.getElementById('dpo_'+idx);
  const detail=document.getElementById('dpod_'+idx);
  if(!row||!detail)return;
  const isOpen=detail.classList.contains('show');
  document.querySelectorAll('.dpo-row').forEach(r=>r.classList.remove('open'));
  document.querySelectorAll('.dpo-detail').forEach(d=>d.classList.remove('show'));
  if(isOpen)return;
  row.classList.add('open'); detail.classList.add('show');
  if(detail.innerHTML.trim())return;
  const po=_poList[idx]; if(!po)return;
  const m=po.meta||{};
  const sc=m.scores||{satisfaction:70,ahtScore:80,completeness:75,speechScore:80,speechItems:[]};
  const tot=Math.round(sc.satisfaction*.3+sc.ahtScore*.2+sc.completeness*.2+sc.speechScore*.3);
  const gc=v=>v>=80?'var(--g)':v>=65?'var(--y)':'var(--r)';
  const sentLbl=m.sentVal===1?'😊 Satisfecho':m.sentVal===0?'😐 Neutro':'😠 Molesto';
  let html=`<div class="dpo-grid">
    <div class="dpo-metric"><div class="dpo-metric-lbl">Score</div><div class="dpo-metric-val" style="color:${gc(tot)}">${tot}%</div></div>
    <div class="dpo-metric"><div class="dpo-metric-lbl">Satisfacción</div><div class="dpo-metric-val" style="color:${gc(sc.satisfaction)}">${sc.satisfaction}%</div></div>
    <div class="dpo-metric"><div class="dpo-metric-lbl">Duración</div><div class="dpo-metric-val">${m.callDuration||'—'}</div></div>
    <div class="dpo-metric"><div class="dpo-metric-lbl">Sentimiento</div><div class="dpo-metric-val" style="font-size:18px">${m.sentVal===1?'😊':m.sentVal===0?'😐':'😠'}</div></div>
  </div>
  <div class="dpo-bars">
    ${[{l:'Satisfacción',v:sc.satisfaction},{l:'AHT',v:sc.ahtScore},{l:'Completitud',v:sc.completeness},{l:'Speech',v:sc.speechScore}].map(b=>{const c=b.v>=80?'g':b.v>=65?'y':'r';return '<div class="dpo-bar-row"><span class="dpo-bar-lbl">'+b.l+'</span><div class="dpo-bar-bg"><div class="dpo-bar-fill '+c+'" style="width:0%" data-w="'+b.v+'%"></div></div><span class="dpo-bar-num">'+b.v+'%</span></div>';}).join('')}
  </div>`;
  if(sc.speechItems?.length){
    html+=`<div class="dpo-speech">${sc.speechItems.map(i=>'<div class="dpo-speech-chip '+(i.ok?'ok':'fail')+'">'+(i.ok?'✓':'✗')+' '+i.label+'</div>').join('')}</div>`;
  }
  detail.innerHTML=html;
  setTimeout(()=>detail.querySelectorAll('.dpo-bar-fill').forEach(f=>f.style.width=f.dataset.w),50);
}

function _buildScores(data,sent,proto,callDuration){
  // Satisfaction: based on sentiment valor
  const sentVal=sent?Number(sent.valor):0;
  const satisfaction=sentVal===1?92:sentVal===0?70:38;

  // AHT score: based on call duration — ideal 2-5 min
  let ahtScore=80;
  if(callDuration&&callDuration!=='—'){
    const parts=callDuration.split(':');
    const mins=parseInt(parts[0]||0);

    if(mins<3||mins>8){ ahtScore=Math.max(20, ahtScore-(Math.abs(mins-5)*8)); }
  }
  const required=['nombre_cliente','ubicación','tipo_asistencia','placa','tablilla','marca','modelo'];
  const filled=required.filter(k=>data[k]&&String(data[k]).trim());

  // Speech compliance: protocol + data
  const proto_ok=proto?.cumple===true;
  const speechItems=[
    {label:'Saludo de bienvenida',       ok: proto_ok },
    {label:'Identificación del cliente', ok: !!data.nombre_cliente },
    {label:'Validación de ubicación',    ok: !!data.ubicación },
    {label:'Confirmación del servicio',  ok: !!data.tipo_asistencia },
    {label:'ETA comunicado al cliente',  ok: proto_ok && !!data.ubicación && !!data.tipo_asistencia },
  ];
  const speechScore=Math.round(speechItems.filter(i=>i.ok).length/speechItems.length*100);
  const completeness=Math.round(filled.length/required.length*100);

  return{satisfaction,ahtScore,completeness,speechScore,speechItems};
}

AgentBar.init()


/* ══ BASE DE CONOCIMIENTO — Contrato Asistencia Vial CONNECT ══ */