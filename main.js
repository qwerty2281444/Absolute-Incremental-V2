export const player = {
  money: new Decimal(0),
  addend: new Decimal(1),
  moneyMult: new Decimal(1),
  moneyExp: new Decimal(1),
};

// ---------- upgrade table --------------------------------------
export const upgrades = {
  addend: {
    text: "+1 Addend",   cost:new Decimal(1), ratio:new Decimal(2.5),
    effect(){ player.addend = player.addend.plus(1); }
  },
  mult:   {
    text: "×1.5 Money",  cost:new Decimal(100), ratio:new Decimal(1.8),
    effect(){ player.moneyMult = player.moneyMult.mul(1.5); }
  },
  exp:    {
    text: "^1.1 Money",  cost:new Decimal(1e6), ratio:new Decimal(2),
    effect(){ player.moneyExp = player.moneyExp.mul(1.1); }
  },
};

// ---------- helpers --------------------------------------------
const fmt = n=> (n.gte(1e6)? n.toExponential(2): n.toFixed(3));

function buy(id){ const u=upgrades[id]; if(player.money.lt(u.cost)) return;
  player.money=player.money.sub(u.cost); u.effect();
  u.cost=u.cost.mul(u.ratio); render(); }

function buyMax(id){ const u=upgrades[id],r=u.ratio;
  if(r.lte(1)||player.money.lt(u.cost))return;
  const n=player.money.mul(r.sub(1)).div(u.cost).add(1).log(r).floor();
  const total=u.cost.mul(r.pow(n).sub(1)).div(r.sub(1));
  if(player.money.lt(total)||n.lte(0))return;
  player.money=player.money.sub(total);
  for(let i=0;i<n.toNumber();i++)u.effect();
  u.cost=u.cost.mul(r.pow(n)); render(); }

// ---------- UI --------------------------------------------------
function render(){
  const box=document.getElementById('panel-container');
  box.innerHTML='';

  /* money panel */
  const core=document.createElement('div'); core.className='panel';
  core.innerHTML=`<h2>💰 Money: $${fmt(player.money)}</h2>`;
  Object.entries(upgrades).forEach(([id,u])=>{
    const b=document.createElement('button'); b.className='btn';
    b.textContent=`${u.text} (Cost ${fmt(u.cost)})`;
    b.disabled=player.money.lt(u.cost);
    b.onclick=()=>buy(id);
    /* shift-click = buy max */
    b.oncontextmenu=e=>{e.preventDefault();buyMax(id);};
    core.appendChild(b);
  });
  box.appendChild(core);
}

// ---------- game loop ------------------------------------------
let last=performance.now();
function loop(t){
  const dt=(t-last)/1000; last=t;
  const gain= player.addend.mul(player.moneyMult).pow(player.moneyExp);
  player.money = player.money.plus(gain.mul(dt));
  render(); requestAnimationFrame(loop);
}

// ---------- save / load ----------------------------------------
function save(){ localStorage.setItem('incSave',JSON.stringify(player)); }
function load(){
  const raw=JSON.parse(localStorage.getItem('incSave')||'{}');
  Object.keys(player).forEach(k=>{ if(raw[k]) player[k]=new Decimal(raw[k]); });
}
window.addEventListener('beforeunload',save);
setInterval(save,10000);

// ---------- bootstrap ------------------------------------------
load(); render(); requestAnimationFrame(loop);