
const KB = {

  servicios: {
    grua:    { nombre:'Remolque por avería/accidente', planes:{basico:{eventos:1,monto:150},premium:{eventos:2,monto:200},plus:{eventos:3,monto:300}} },
    rescate: { nombre:'Maniobras de rescate',          planes:{basico:null,premium:{eventos:1,monto:150},plus:{eventos:2,monto:150}} },
    llanta:  { nombre:'Cambio de llanta',              planes:{basico:{eventos:1,monto:90},premium:{eventos:3,monto:120},plus:{eventos:5,monto:150}} },
    bateria: { nombre:'Paso de corriente',             planes:{basico:{eventos:1,monto:90},premium:{eventos:3,monto:120},plus:{eventos:5,monto:150}} },
    gasolina:{ nombre:'Envío de combustible',          planes:{basico:{eventos:1,monto:90},premium:{eventos:3,monto:120},plus:{eventos:5,monto:150}} },
    llaves:  { nombre:'Apertura vehicular',            planes:{basico:{eventos:1,monto:120},premium:{eventos:3,monto:190},plus:{eventos:3,monto:250}} },
    traslado:{ nombre:'Transporte continuación viaje', planes:{basico:null,premium:{eventos:2,monto:100},plus:{eventos:3,monto:150}} },
  },

  restricciones: [
    { keywords:['uber','didi','pedidos ya','taxi','público','plataforma'],        alerta:'⚠ Vehículos de transporte público o plataformas digitales NO están cubiertos.' },
    { keywords:['carga','camión','plataforma','tonelada'],                        alerta:'⚠ Vehículos de carga o más de 3.5 toneladas NO están cubiertos.' },
    { keywords:['herido','ambulancia','accidentado'],                             alerta:'⚠ Vehículos con heridos: coordina emergencias primero (911). Luego gestiona grúa.' },
    { keywords:['moto','motocicleta','bicicleta','cuadraciclo','can am'],         alerta:'⚠ Motos < 325cc, bicimotos y cuadraciclos NO están cubiertos.' },
    { keywords:['fuera de costa rica','panamá','nicaragua','extranjero'],         alerta:'⚠ El servicio aplica ÚNICAMENTE dentro de Costa Rica.' },
    { keywords:['sin marchamo','marchamo vencido','no circula'],                  alerta:'⚠ Vehículos sin marchamo vigente NO tienen cobertura.' },
    { keywords:['ebrio','borracho','alcohol','drogas'],                           alerta:'⚠ Servicio NO aplica si el conductor está bajo efectos de alcohol o drogas.' },
    { keywords:['llanta','moto'],                                                 alerta:'⚠ Cambio de llanta NO aplica para motocicletas.' },
    { keywords:['cochera','garaje','parqueo','casa'],                             alerta:'⚠ Grúa NO se gestiona en garajes o cocheras privadas sin condiciones adecuadas.' },
    { keywords:['combustible','gasolina','sin gasolina'],                         alerta:'ℹ Combustible: CONNECT cubre 1 galón solo en el primer servicio del año. En vía pública únicamente.' },
    { keywords:['copia','duplicado de llave','llave perdida'],                    alerta:'⚠ Apertura vehicular NO incluye copia de llaves ni reparación de cerraduras.' },
    { keywords:['baúl','cajuela','maletero'],                                     alerta:'⚠ Apertura vehicular NO aplica para baúl si no abre desde el interior.' },
    { keywords:['nuevo cliente','afiliación','primera vez'],                      alerta:'ℹ Los beneficios inician 72 horas después de la afiliación.' },
    { keywords:['daño','reclamo','queja','golpe'],                                alerta:'ℹ Reclamos por daños deben reportarse en máximo 24 horas al 2504-6000.' },
  ],

  reglas: {
    vigencia:        'Beneficios inician 72h después de afiliación. Sin vigencia: NO hay servicio.',
    pago:            'Cliente debe estar al día en pagos. Verificar antes de gestionar.',
    acompanamiento:  'Cliente debe acompañar la grúa en todo el trayecto (cabina). Máx 2 personas.',
    identificacion:  'Cliente debe presentar cédula para apertura vehicular y al solicitar servicios.',
    autorizacion:    'Servicios NO preprogramados — solo en el momento de la emergencia.',
    vehiculos_max:   'Máximo 3 vehículos por cliente. Antigüedad máxima 20 años.',
    cancelacion:     'Cancelación comunica por escrito. Cobro suspende el mes siguiente.',
    telefono:        '2504-6000',
  },

  // Sugerencias contextuales por tipo de servicio
  sugerencias: {
    grua:    ['Confirmar ubicación exacta (calle, referencia)', 'Preguntar si puede viajar en la grúa', 'Verificar que el vehículo vaya vacío', 'Confirmar destino del remolque', 'Verificar marchamo vigente'],
    llanta:  ['Confirmar que tiene llanta de repuesto en buen estado', 'Verificar que NO es motocicleta', 'Preguntar si tiene las herramientas (gato, llave)'],
    bateria: ['Confirmar modelo del vehículo (algunos no permiten paso de corriente)', 'Preguntar si ha intentado arrancar varias veces'],
    gasolina:['Confirmar que está en vía pública', 'Confirmar tipo de combustible (gasolina/diesel)', 'Informar que pago de gasolina es por tarjeta'],
    llaves:  ['Confirmar que las llaves están DENTRO del vehículo', 'Pedir cédula del cliente en sitio', 'Verificar que NO es motocicleta'],
    rescate: ['Solo aplica Plan Premium o Plus', 'Debe ir vinculado a servicio de remolque'],
    traslado:['Solo si viajan MÁS de 2 personas o autorización especial', 'Máximo 4 personas', 'Solo Plan Premium o Plus'],
  },

  buscar(texto) {
    const t = texto.toLowerCase();
    const alertas = [];
    this.restricciones.forEach(r => {
      if(r.keywords.some(k => t.includes(k))) alertas.push(r.alerta);
    });
    return alertas;
  },

  sugerenciasParaServicio(svcId) {
    return this.sugerencias[svcId] || [];
  },

  infoServicio(svcId, plan) {
    const svc = this.servicios[svcId];
    if(!svc) return null;
    const p = svc.planes[plan||'basico'];
    if(!p) return { nombre: svc.nombre, cubierto: false };
    return { nombre: svc.nombre, cubierto: true, eventos: p.eventos, monto: p.monto };
  }
};

/* ── PO Validation Popup ─────────────────────────────── */
let _pvpDismissed = false;
let _pvpClosedByUser = false; // permanent for this call
let _pvpNotaValue = "";

function openPOValidation(){
  if(_pvpDismissed || _pvpClosedByUser) return;
  const popup = document.getElementById('po-validate-popup');
  const fieldsEl = document.getElementById('pvp-fields');
  const warnEl = document.getElementById('pvp-warn');
  if(!popup||!fieldsEl) return;
  // If already open, just update warn status — don't re-render inputs (would reset edits)
  if(popup.classList.contains('show')){
    _pvpRefreshStatus();
    return;
  }
  const data = POBuilder.getData();
  const DEF=[
    {k:'tipo_asistencia',i:'🔧',l:'Servicio',req:true},
    {k:'nombre_cliente', i:'👤',l:'Cliente', req:true},
    {k:'ubicación',      i:'📍',l:'Ubicación',req:true},
    {k:'placa',          i:'🪪',l:'Placa',   req:false},
    {k:'marca',          i:'🚗',l:'Marca',   req:false},
    {k:'modelo',         i:'🔖',l:'Modelo',  req:false},
    {k:'año',            i:'📅',l:'Año',     req:false},
    {k:'color',          i:'🎨',l:'Color',   req:false},
    {k:'ubicacion_destino',i:'🏁',l:'Destino remolque',req:false},
  ];
  // Always show nota field (optional)
  const notaVal = (POBuilder.getData().nota||'');
  fieldsEl.innerHTML=''; let miss=0;
  DEF.forEach(f=>{
    const val=data[f.k];
    const ok=val&&String(val).trim()&&val!=='N/A';
    if(!ok&&f.req) miss++;
    const row=document.createElement('div');
    row.className='pvp-field '+(ok?'ok':f.req?'miss':'');
    row.innerHTML='<span class="pvp-field-ico">'+f.i+'</span><div class="pvp-field-info"><div class="pvp-field-lbl">'+f.l+(f.req?' *':'')+'</div><input class="pvp-input'+(ok?'':' empty')+'" data-key="'+f.k+'" value="'+(ok?String(val).replace(/"/g,'&quot;'):'')+'" placeholder="—" oninput="_pvpRefreshStatus()"></div>'+(f.req?'<div class="pvp-status '+(ok?'ok':'miss')+'" id="pvp-st-'+f.k+'">'+(ok?'✓':'✗')+'</div>':'');
    fieldsEl.appendChild(row);
  });
  // Nota field
  const notaWrap = document.getElementById('pvp-nota-wrap');
  const notaInp  = document.getElementById('pvp-nota');
  if(notaInp){ notaInp.value = notaVal; }
  if(notaWrap){ notaWrap.style.display='flex'; }

  warnEl.classList.toggle('show',miss>0);
  popup.classList.add('show');
}

function closePOValidation(byUser){
  if(byUser){ _pvpDismissed=true; _pvpClosedByUser=true; }
  const p=document.getElementById('po-validate-popup');
  if(p) p.classList.remove('show');
}

function openMapFromField(){
  const loc=(POBuilder.getData().ubicación)||'';
  if(!loc){showToast('⚠ Sin ubicación registrada');return;}
  window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(loc+', Costa Rica'),'_blank');
}
function _pvpRefreshStatus(){
  const REQUIRED = ['tipo_asistencia','nombre_cliente','ubicación'];
  let allOk = true;
  document.querySelectorAll('.pvp-input').forEach(inp => {
    const key = inp.dataset.key;
    const val = inp.value.trim();
    const filled = val.length > 0;
    const st = document.getElementById('pvp-st-'+key);
    if(st){ st.textContent=filled?'✓':'✗'; st.className='pvp-status '+(filled?'ok':'miss'); }
    inp.classList.toggle('empty', !filled);
    if(REQUIRED.includes(key) && !filled) allOk = false;
  });
  const warn = document.getElementById('pvp-warn');
  if(warn) warn.classList.toggle('show', !allOk);
}

function reopenPOValidation(){
  _pvpDismissed = false;
  _pvpClosedByUser = false;
  openPOValidation();
}


function _renderDrawerCard(po) {
  const list = document.getElementById('pd-list');
  const empty = document.getElementById('pd-empty');
  if (!list) return;
  if (empty) empty.style.display = 'none';
  const idx = _poList.length - 1;
  const card = document.createElement('div');
  card.className = 'pd-card';
  card.id = 'pdc_'+po.num;
  card.onclick = () => openDetail(po.num);
  card.innerHTML =
    '<div class="pd-card-top">' +
      '<span class="pd-card-num">'+po.num+'</span>' +
      '<span class="pd-card-svc">'+(po.data.tipo_asistencia||'—')+'</span>' +
      '<span class="pd-card-ts">'+po.ts+'</span>' +
    '</div>' +
    '<div class="pd-card-fields">' +
      (po.data.nombre_cliente?'<span class="pd-card-tag">👤 '+po.data.nombre_cliente+'</span>':'') +
      (po.data.placa?'<span class="pd-card-tag">🪪 '+po.data.placa+'</span>':'') +
      (po.data.ubicación?'<span class="pd-card-tag">📍 '+po.data.ubicación+'</span>':'') +
    '</div>';
  list.insertBefore(card, list.firstChild);
}

function updateDrawerCount(){
  const cnt = document.getElementById('pdh-count');
  if(cnt) cnt.textContent = _poList.length + ' POs';
}

/* ══ KB CHECKLIST — dinámico por transcripción ══════════ */
const KB_CHECKS = {
  grua: [
    { id:'ubicacion',    txt:'Confirmar ubicación exacta del vehículo', keywords:['ubicado','ubicación','estoy en','encuentro en','calle','avenida','cañón','frente a','detrás de','costado','cien metros','doscientos'] },
    { id:'vehiculo',     txt:'Datos del vehículo (placa, marca, modelo)', keywords:['placa','tablilla','marca','modelo','color','año'] },
    { id:'marchamo',     txt:'Verificar marchamo vigente',               keywords:['marchamo','circulación','al día','vigente','tiene marchamo'] },
    { id:'destino_orig', txt:'Confirmar ubicación destino (taller)',      keywords:['taller','llevar a','destino','dirección del taller','mecánico','donde lo llevo','me lo lleven a','lo lleven'] },
    { id:'grua_viaje',   txt:'¿Puede viajar en la cabina de la grúa?',   keywords:['voy en la grúa','viajo en','sí puedo','puedo ir','acompañar','me quedo','alguien de confianza','cabina'] },
    { id:'vacio',        txt:'Confirmar que el vehículo irá vacío',       keywords:['vacío','nadie adentro','solo yo','sin pasajeros','va vacío'] },
  ],
  bat: [
    { id:'ubicacion',  txt:'Confirmar ubicación exacta',          keywords:['ubicado','ubicación','estoy en','encuentro en','calle','avenida','frente a'] },
    { id:'intentos',   txt:'¿Cuántas veces intentó arrancar?',    keywords:['veces','intenté','arrancar','no arranca','probé'] },
    { id:'modelo',     txt:'Confirmar modelo del vehículo',       keywords:['marca','modelo','año','es un','tengo un'] },
    { id:'vehiculo',   txt:'Datos completos del vehículo',        keywords:['placa','tablilla','marca','modelo','color','año'] },
  ],
  llanta: [
    { id:'ubicacion',  txt:'Confirmar ubicación exacta',          keywords:['ubicado','ubicación','estoy en','encuentro en','calle','avenida','frente a'] },
    { id:'repuesto',   txt:'¿Tiene llanta de repuesto?',          keywords:['repuesto','llanta de repuesto','sí tengo','tengo llanta','neumático de repuesto'] },
    { id:'herramientas',txt:'¿Tiene gato y llave?',              keywords:['gato','llave de rueda','herramientas','sí tengo herramientas'] },
    { id:'vehiculo',   txt:'Datos completos del vehículo',        keywords:['placa','tablilla','marca','modelo','color','año'] },
  ],
  gas: [
    { id:'ubicacion',  txt:'Confirmar ubicación exacta (vía pública)', keywords:['estoy en','calle','carretera','ruta','autopista','vía','encuentro en'] },
    { id:'combustible',txt:'Tipo de combustible',                 keywords:['gasolina','diesel','regular','súper','tipo de combustible'] },
    { id:'tarjeta',    txt:'Informar pago por tarjeta',           keywords:['tarjeta','débito','crédito','pago','informado','enterado'] },
    { id:'vehiculo',   txt:'Datos completos del vehículo',        keywords:['placa','tablilla','marca','modelo','color','año'] },
  ],
  llaves: [
    { id:'ubicacion',  txt:'Confirmar ubicación exacta',          keywords:['ubicado','estoy en','encuentro en','calle','avenida','frente a'] },
    { id:'llaves_adentro', txt:'¿Llaves están DENTRO del vehículo?', keywords:['adentro','dentro','sí están','las llaves están','inside','encerradas'] },
    { id:'cedula',     txt:'Cliente debe presentar cédula',       keywords:['cédula','identificación','documento','id'] },
    { id:'vehiculo',   txt:'Datos completos del vehículo',        keywords:['placa','tablilla','marca','modelo','color','año'] },
  ],
  mec: [
    { id:'ubicacion',  txt:'Confirmar ubicación exacta',          keywords:['ubicado','estoy en','encuentro en','calle','avenida','frente a'] },
    { id:'falla',      txt:'Describir la falla del vehículo',     keywords:['falla','problema','ruido','humo','no enciende','no arranca','averío','luz'] },
    { id:'vehiculo',   txt:'Datos completos del vehículo',        keywords:['placa','tablilla','marca','modelo','color','año'] },
  ],
  info: [
    { id:'nombre',     txt:'Identificar al cliente',              keywords:['nombre','me llamo','soy','cliente','afiliado'] },
    { id:'consulta',   txt:'Registrar consulta del cliente',      keywords:['pregunta','consulta','quiero saber','me gustaría','información sobre'] },
  ],
};

let _kbState = {};   // { itemId: 'pending' | 'done' }
let _kbSvcId = null;

function initKBChecklist(svcId){
  if(!KB_CHECKS[svcId]) return;
  // Clear previous KB pills
  document.querySelectorAll('.kb-rec').forEach(p=>p.remove());
  _kbSvcId = svcId;
  _kbState = {};
  (KB_CHECKS[svcId]||[]).forEach(c => { _kbState[c.id] = 'pending'; });
  // Stagger pill appearance
  const checks = KB_CHECKS[svcId];
  checks.forEach((c, i) => {
    setTimeout(() => {
      if(_kbState[c.id] === 'pending') _showKBPill(c);
    }, i * 300);
  });
}

function checkKBTranscript(transcriptText){
  if(!_kbSvcId) return;
  const checks = KB_CHECKS[_kbSvcId] || [];
  const t = transcriptText.toLowerCase();
  let changed = false;
  checks.forEach(c => {
    if(_kbState[c.id] === 'pending'){
      if(c.keywords.some(k => t.includes(k))){
        _kbState[c.id] = 'done';
        changed = true;
        _dismissKBPill(c.id);
      }
    }
  });
  if(changed) _renderKBChecklist();
}

function _renderKBChecklist(){
  const checks = KB_CHECKS[_kbSvcId] || [];
  checks.forEach(c => {
    if(_kbState[c.id] === 'pending' && !document.getElementById('kbpill_'+c.id)){
      _showKBPill(c);
    }
  });
}

function _showKBPill(c){
  const stack = document.getElementById('rec-stack');
  if(!stack) return;
  const el = document.createElement('div');
  el.className = 'rec-toast kb-rec';
  el.id = 'kbpill_' + c.id;
  const btn = document.createElement('button');
  btn.className = 'rec-ck';
  btn.textContent = '✓';
  btn.onclick = function(){ _dismissKBPill(c.id); };
  el.innerHTML =
    '<span class="rec-ico">📋</span>' +
    '<div class="rec-body">' +
      '<div class="rec-lbl">Checklist</div>' +
      '<div class="rec-txt">' + c.txt + '</div>' +
    '</div>';
  el.appendChild(btn);
  stack.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add('show'); });
}

function _dismissKBPill(itemId){
  const el = document.getElementById('kbpill_'+itemId);
  if(!el) return;
  el.classList.add('done');
  setTimeout(()=>el.remove(), 850);
}

function renderKBSugs(sugs){
  // Legacy — kept for compatibility
  const el = document.getElementById('kb-sugs');
  if(!el) return;
  el.innerHTML = sugs.map(s=>'<div class="kb-sug"><span class="kb-sug-dot"></span><span class="kb-sug-txt">'+s+'</span></div>').join('');
  document.getElementById('kb-card').style.display='block';
}