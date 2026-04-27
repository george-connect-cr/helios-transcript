
function showCelebration(done, goal){
  const ov = document.getElementById('celebrate-ov');
  const cnt = document.getElementById('cel-count');
  if(cnt) cnt.textContent = done + '/' + goal;
  if(ov) ov.classList.add('show');
  _spawnConfetti();
}

function closeCelebration(){
  const ov = document.getElementById('celebrate-ov');
  if(ov) ov.classList.remove('show');
  const wrap = document.getElementById('confetti-wrap');
  if(wrap) wrap.innerHTML = '';
}

function _spawnConfetti(){
  const wrap = document.getElementById('confetti-wrap');
  if(!wrap) return;
  wrap.innerHTML = '';
  const colors = ['#bf9455','#6aaa90','#cc7580','#ffffff','#ff5c00','#a0b8ff'];
  for(let i=0;i<60;i++){
    const p = document.createElement('div');
    p.className = 'confetti-p';
    p.style.left = Math.random()*100 + 'vw';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.width = (6+Math.random()*6) + 'px';
    p.style.height = (6+Math.random()*6) + 'px';
    p.style.borderRadius = Math.random()>.5 ? '50%' : '2px';
    p.style.animationDuration = (2+Math.random()*3) + 's';
    p.style.animationDelay = (Math.random()*1.5) + 's';
    wrap.appendChild(p);
  }
  setTimeout(()=>{ if(wrap) wrap.innerHTML=''; }, 6000);
}
