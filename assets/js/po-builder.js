
const POBuilder = (() => {
  let _data={}, _visible=false, _currentService=null;
  const FIELDS={
    nombre_cliente:{i:'👤',l:'Cliente',  req:['grua','bat','llanta','gas','llaves','mec']},
    placa:         {i:'🪪',l:'Placa',    req:['grua','bat','llanta','gas','llaves','mec']},
    marca:         {i:'🚗',l:'Marca',    req:['grua','bat','llanta','mec']},
    modelo:        {i:'🔖',l:'Modelo',   req:['grua','bat','llanta','mec']},
    año:           {i:'📅',l:'Año',      req:['grua','mec']},
    color:         {i:'🎨',l:'Color',    req:['grua']},
    ubicación:     {i:'📍',l:'Ubicación',req:['grua','bat','llanta','gas','llaves','mec']},
    ubicacion_destino:{i:'🏁',l:'Ubicación destino',req:['grua'],wide:true},
    tipo_asistencia:{i:'🔧',l:'Servicio',req:['grua','bat','llanta','gas','llaves','mec']},
  };
  const SUGS={
    grua:  [{i:'📍',t:'Punto de referencia',q:'¿Puede darme un punto de referencia cercano?'},{i:'🔢',t:'Cédula del cliente',q:'¿Me puede confirmar su número de cédula?'}],
    bat:   [{i:'🔌',t:'¿Intentó arrancar?',q:'¿Ya intentó arrancar el vehículo?'},{i:'📍',t:'¿Vía pública?',q:'¿Está en vía pública o parqueo privado?'}],
    llanta:[{i:'🛞',t:'¿Llanta de repuesto?',q:'¿Su vehículo tiene llanta de emergencia?'},{i:'📍',t:'Posición segura',q:'¿El vehículo está en posición segura?'}],
    gas:   [{i:'⛽',t:'Tipo combustible',q:'¿Su vehículo es gasolina o diesel?'},{i:'📐',t:'Cantidad necesaria',q:'¿Cuántos litros aproximadamente necesita?'}],
    llaves:[{i:'🚪',t:'¿Tiene copia?',q:'¿Tiene una copia de la llave en casa?'},{i:'🔐',t:'¿Llave electrónica?',q:'¿Tiene seguro electrónico o llave convencional?'}],
    mec:   [{i:'💨',t:'¿Sale humo?',q:'¿El vehículo emite humo o hay olores extraños?'},{i:'🌡️',t:'Luz advertencia',q:'¿Vio alguna luz de advertencia encendida?'}],
    info:  [{i:'📄',t:'Número de póliza',q:'¿Me puede proporcionar su número de póliza?'}],
  };
  const WAIT={grua:20,bat:15,llanta:15,gas:25,llaves:20,mec:25,info:5};

  function _showPanel(){
    if(!_visible){_visible=true;
      const empty=document.getElementById('pb-empty');
      if(empty)empty.style.display='none';
      const body=document.getElementById('pb-body');
      if(body){body.style.display='flex';body.style.flexDirection='column';}
      const meta=document.getElementById('pb-meta-row');
      if(meta)meta.style.display='flex';
      const notes=document.querySelector('.po-notes');
      if(notes)notes.classList.add('visible');
    }
  }
  function addField(key,value,_forceNew){
    const isNew=_forceNew!==undefined?_forceNew:!_data[key]; _data[key]=value;
    _showPanel(); _upsertRow(key,value,isNew);
    _updateSugs(); _updateWait(); _updateStatus();
    // Flash pill ONLY on first detection, not on edits/updates
    if(isNew){ const f=FIELDS[key]; if(f) FlashPill.show(f.i,f.l,String(value).substring(0,26)); }
  }
  function setService(svcId,svcName){
    if(typeof initKBChecklist !== 'undefined') initKBChecklist(svcId);
    const isNew = _currentService !== svcId;
    _currentService=svcId; _data.tipo_asistencia=svcName;
    _showPanel(); _upsertRow('tipo_asistencia',svcName,isNew);
    _updateSugs(); _updateWait(); _updateStatus();
    // FlashPill for service only on first detection
    if(isNew) FlashPill.show('🔧','Servicio',svcName);
  }
  function _upsertRow(key,value,isNew){
    const body=document.getElementById('pb-body'); if(!body)return;
    const f=FIELDS[key]; if(!f)return;
    let row=document.getElementById('pbr_'+key);
    if(row){
      const inp=row.querySelector('.pf-input');
      if(inp&&document.activeElement!==inp){
        inp.value=value;
        row.classList.add('new'); setTimeout(()=>row.classList.remove('new'),600);
      }
      return;
    }

    // Determine layout
    const WIDE=['nombre_cliente','ubicación','tipo_asistencia'];
    const SECTIONS={
      tipo_asistencia:'Servicio',
      nombre_cliente:'Cliente',
      placa:'Vehículo',
    };

    // Insert section divider if first field of section
    if(SECTIONS[key]){
      const existingSec=document.getElementById('pfsec_'+key);
      if(!existingSec){
        const sec=document.createElement('div');
        sec.className='pf-section';sec.id='pfsec_'+key;
        sec.textContent=SECTIONS[key];
        body.appendChild(sec);
      }
    }

    // Create grid wrapper for pair fields if needed
    const isWide=WIDE.includes(key);
    let container=body;
    if(!isWide){
      // Find or create current grid
      let grid=body.querySelector('.pf-grid:last-child');
      const gridKeys=['placa','tablilla','marca','modelo','año','color'];
      const gridIdx=gridKeys.indexOf(key);
      // Create new grid if needed (first of grid group or grid is full)
      if(!grid||grid.children.length>=4||gridIdx===0){
        grid=document.createElement('div');
        grid.className='pf-grid';
        body.appendChild(grid);
      }
      container=grid;
    }

    row=document.createElement('div');
    const isUbic = key==='ubicación';
    row.className='pf-row'+(isNew?' new':'')+(isWide?' wide':'')+(isUbic?' has-map':'');
    row.id='pbr_'+key;
    const mapBtn=isUbic?`<button class="pf-map-btn" onclick="openMapFromField()" title="Ver en mapa">🗺</button>`:'';
    row.innerHTML=`<span class="pf-ico">${f.i}</span><div class="pf-body"><div class="pf-lbl">${f.l}</div><input class="pf-input" value="${String(value).substring(0,60)}" placeholder="—" onchange="POBuilder._edit('${key}',this.value)" oninput="POBuilder._edit('${key}',this.value)">${mapBtn}</div>`;
    container.appendChild(row);
    if(isNew) setTimeout(()=>row.classList.remove('new'),600);
  }
  function _edit(key,value){_data[key]=value;_updateStatus();}
  function _updateSugs(){
    const wrap=document.getElementById('pb-sug-wrap');
    const list=document.getElementById('pb-sug-list');
    if(!wrap||!list)return;
    const sugs=(SUGS[_currentService]||[]).filter(s=>!(s.t.includes('referencia')&&_data.ubicación)&&!(s.t.includes('cédula')&&_data.nombre_cliente));
    if(!sugs.length){wrap.style.display='none';return;}
    list.innerHTML='';
    sugs.slice(0,2).forEach(s=>{
      const el=document.createElement('div'); el.className='pb-sug';
      el.innerHTML=`<span class="po-sug-i">${s.i}</span><span class="po-sug-t">${s.t}</span><span class="po-sug-arr">›</span>`;
      el.onclick=()=>{showToast('💬 '+s.q);el.style.opacity='.4';el.style.pointerEvents='none';};
      list.appendChild(el);
    });
    wrap.style.display='';
  }
  function _updateWait(){
    const el=document.getElementById('pb-wait'); if(!el||!_currentService){if(el)el.textContent='—';return;}
    const mins=WAIT[_currentService]||15;
    const hr=new Date().getHours(); const rush=(hr>=7&&hr<=17?'':hr>=8&&hr<=9||hr>=17&&hr<=19?' slow':'');
  }
  function _updateStatus(){
    const REQUIRED = ['tipo_asistencia','nombre_cliente','ubicación'];
    const req=Object.entries(FIELDS).filter(([k,v])=>v.req.includes(_currentService||'grua')).map(([k])=>k);
    const filled=req.filter(k=>_data[k]&&String(_data[k]).trim());
    const complete=filled.length>=req.length;
    const st=document.getElementById('pb-status');
    if(st){st.textContent=complete?'Listo':`${filled.length}/${req.length}`;st.className='po-badge'+(complete?' ready':'');}
    // Show/hide cta button based on completion
    const ctaEl=document.getElementById('pb-cta');
    if(ctaEl) ctaEl.style.display=filled.length>0?'flex':'none';
    // Only close popup if required fields are now missing (e.g. after reset)
    const reqFilled = REQUIRED.every(k=>_data[k]&&String(_data[k]).trim()&&_data[k]!=='N/A');
    if(!reqFilled){
      closePOValidation();
    }
  }
  function loadFromAnalysis(data){
    let d=0;
    Object.keys(FIELDS).forEach(k=>{
      const val=data[k]; if(val&&String(val).trim()&&val!=='N/A'){setTimeout(()=>addField(k,val),d);d+=130;}
    });
  }
  function reset(){
    _data={}; _visible=false; _currentService=null;
    const empty=document.getElementById('pb-empty');if(empty)empty.style.display='flex';
    const pbScroll=document.getElementById('pb-body');if(pbScroll){pbScroll.style.display='none';pbScroll.innerHTML='';}
    const pbMeta=document.getElementById('pb-meta-row');if(pbMeta)pbMeta.style.display='none';
    const poSugs=document.getElementById('pb-sug-wrap');if(poSugs)poSugs.style.display='none';
    const b=document.getElementById('pb-body');if(b)b.innerHTML='';
    const st=document.getElementById('pb-status');if(st){st.textContent='En curso';st.className='pb-status';}
    const cta=document.getElementById('pb-cta');if(cta)cta.style.display='none';
    const sw=document.getElementById('pb-sug-wrap');if(sw)sw.style.display='none';
    const w=document.getElementById('pb-wait');if(w){w.textContent='—';w.className='pb-wait-val';}
    const nt=document.getElementById('pb-notes-ta');if(nt)nt.value='';
    const notes=document.querySelector('.po-notes');if(notes)notes.classList.remove('visible');
  }
  function getData(){return{..._data};}
  return{addField,setService,loadFromAnalysis,reset,getData,_edit,get _currentSvc(){return _currentService?{id:_currentService}:null}};
})();


const SF = (() => {
  // field map: key → {id, label, icon}
  const FIELDS = {
    nombre_cliente: {id:'f-fname', label:'Nombre',    icon:'👤', split:true},
    placa:          {id:'f-plate', label:'Placa',     icon:'🪪'},
    marca:          {id:'f-make',  label:'Marca',     icon:'🚗'},
    modelo:         {id:'f-model', label:'Modelo',    icon:'🔖'},
    año:            {id:'f-year',  label:'Año',       icon:'📅'},
    color:          {id:'f-color', label:'Color',     icon:'🎨'},
    ubicación:      {id:'f-location', label:'Ubicación', icon:'📍'},
  };

  let _pending = {}; // key → {val, rendered}

  function _applyField(key, val) {
    // Wire into POBuilder
    if(typeof POBuilder !== 'undefined') { POBuilder.addField(key, val, true); }
  }

  function _flashField(el) {
    el.classList.remove('sfok'); void el.offsetWidth;
    el.classList.add('sfok');
    setTimeout(() => el.classList.remove('sfok'), 900);
  }

  function _removeBubble(key) {
    const b = document.getElementById('sfb_' + key);
    if (!b) return;
    b.onclick = null;
    b.style.transition = 'opacity .26s ease, transform .26s ease, max-height .28s ease .1s, margin .28s ease .1s';
    b.style.opacity = '0';
    b.style.transform = 'translateX(8px)';
    b.style.maxHeight = b.offsetHeight + 'px';
    requestAnimationFrame(() => {
      b.style.maxHeight = '0';
      b.style.marginBottom = '0';
    });
    setTimeout(() => b.remove(), 380);
  }

  function render(data) {
    // data = lastAnalysis object
    const wrap = document.getElementById('sfwrap');
    if (!wrap) return;
    // show analyzing briefly
    const pill = document.getElementById('sfanalyzing');
    if (pill) { pill.classList.add('show'); setTimeout(() => pill.classList.remove('show'), 1200); }

    let delay = 200;
    Object.keys(FIELDS).forEach(key => {
      const val = data[key];
      if (!val || !String(val).trim() || val === 'N/A') return;
      if (_pending[key]) return; // already rendered

      _pending[key] = val;
      const f = FIELDS[key];

      setTimeout(() => {
        // Don't render if already applied
        if (document.getElementById('sfb_' + key)) return;

        const b = document.createElement('div');
        b.className = 'sfb';
        b.id = 'sfb_' + key;
        b.innerHTML = '<div class="sfb-ico">' + f.icon + '</div><div class="sfb-body"><div class="sfb-lbl">' + f.label + '</div><div class="sfb-val">' + String(val) + '</div></div>';
        b.onclick = () => {
          _applyField(key, String(val));
          _removeBubble(key);
          showToast('✓ ' + f.label + ' aplicado');
          AgentBar.checkComplete(data);
        };
        wrap.appendChild(b);
      }, delay);
      delay += 90;
    });
  }

  function reset() {
    _pending = {};
    const wrap = document.getElementById('sfwrap');
    if (wrap) wrap.innerHTML = '';
  }

  return { render, reset };
})();

