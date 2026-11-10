'use strict';
(()=>{
const FY=340,K=1,G=2100,JV=-790,HJV=-860,AS=1.5;
let W=800,H=400,OY=0,SC=1,PORT=false,CX=36,fsTried=false;
const SP=window.SPRITES,cv=document.getElementById('game'),x=cv.getContext('2d');
const URLS=Object.assign({archie:'assets/archie-sprite-sheet.svg',props:'assets/props.svg',living:'assets/bg-living.svg',kitchen:'assets/bg-kitchen.svg',hall:'assets/bg-hall.svg',bedroom:'assets/bg-bedroom.svg',park:'assets/bg-park.svg',banner:'assets/banner.svg'},window.ASSET_URLS||{});
const IMG={};let nOk=0,nAll=0,bad='',AC=null,CAM=0;
for(const k in URLS){nAll++;const im=new Image();im.onload=()=>{if(k==='archie'){AC=document.createElement('canvas');AC.width=1600*AS;AC.height=2040*AS;AC.getContext('2d').drawImage(im,0,0,AC.width,AC.height)}else{const b=document.createElement('canvas');b.width=im.naturalWidth||im.width;b.height=im.naturalHeight||im.height;b.getContext('2d').drawImage(im,0,0,b.width,b.height);IMG[k]=b}nOk++};im.onerror=()=>{bad=k};im.src=URLS[k];IMG[k]=im}
function fit(){const d=Math.min(2,window.devicePixelRatio||1),cw=cv.clientWidth||800,ch=cv.clientHeight||400,a=cw/ch;PORT=a<1.05;
 if(PORT){W=500/.85;H=W/a;OY=Math.max(60,(H-400)*.45);CX=14}else{W=Math.max(640,400*a)/.85;H=W/a;OY=Math.max(0,(H-400)*.6);CX=36}
 cv.width=Math.round(cw*d);cv.height=Math.round(ch*d);SC=cv.width/W;x.imageSmoothingEnabled=true;x.imageSmoothingQuality='medium'}
addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,200));if(window.visualViewport)visualViewport.addEventListener('resize',fit);fit();
const pr=n=>SP.props[n];
const ps=(n,dx,dy,w,h)=>{const r=pr(n);x.drawImage(IMG.props,r[0]*2,r[1]*2,r[2]*2,r[3]*2,snap(dx),snap(dy),w||r[2],h||r[3])};
const snap=v=>Math.round(v*SC)/SC;
const arch=(row,k,dx,dy)=>x.drawImage(AC,k*160*AS,row*120*AS,160*AS,120*AS,snap(dx),snap(dy),160*K,120*K);
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
// furniture: t = walkable tops [x0,x1,height], v = vase slots [x,height]
const FD={stand:{t:[[0,56,84]],v:[[8,84]]},coffee:{t:[[0,160,52]],v:[[14,52],[62,52],[110,52]]},ledge:{t:[[0,130,150]],v:[[18,150],[74,150]],y:-266},
shelf:{t:[[0,130,50],[0,130,115],[0,130,180]],v:[[10,50],[76,50],[10,115],[76,115],[44,180]],n:3},counter:{t:[[0,230,96]],v:[[16,96],[96,96],[176,96]]},oven:{t:[[0,130,90]]},
sofa:{t:[[14,226,84]],v:[[100,84]]},night:{t:[[0,60,64]],v:[[10,64]]},dresser:{t:[[0,130,84]],v:[[14,84],[78,84]]},bed:{t:[[10,290,62]]},
log:{t:[[8,202,42]]},stump:{t:[[6,58,56]]},rock:{t:[[10,86,40]]}};
const ZSEQ=['living','kitchen','hall','park','bedroom'],ZLEN={living:2600,kitchen:2400,hall:2000,park:1700,bedroom:2400};
const ZF={living:['coffee','stand','shelf','sofa','ledge','fp'],kitchen:['counter','oven','ledge','stand','fp','counter'],hall:['stand','ledge','fp','shelf','coffee'],bedroom:['night','dresser','ledge','fp','stand'],park:['log','log','stump','rock']};
const TOPC={living:'#f6e3c4',kitchen:'#e1f2e8',hall:'#efe1cb',bedroom:'#e7def5',park:'#9ad6f5'};
const FLOOR={living:['#c8915c','#a9743f'],kitchen:['#f3eee4','#d8cfbf'],hall:['#a8744a','#875a34'],bedroom:['#cdb9e6','#b7a0d6'],park:['#86c35e','#5f9a3c']};
let S,hi=0,duck=false,duckId=null,night=false;
try{hi=+localStorage.getItem('archie-hi')||0}catch(e){}
function reset(){S={mode:'title',t:0,pt:0,anim:0,wx:0,sp:300,score:0,lives:9,c:{y:FY,vy:0,on:true,last:0,jt:-9,hj:false,land:0,wet:0,inv:0,drop:0,crawl:false,sup:null},
 ents:[],zones:[{ty:'living',x0:-400,x1:ZLEN.living}],gx:520,req:-9,lastBonus:-999,intro:0,tub:null,flash:0,ps:[],pops:[],cause:'',overT:0,zone:'living'}}
reset();
const zoneAt=wx=>S.zones.find(z=>wx>=z.x0&&wx<z.x1)||S.zones[S.zones.length-1];
function addF(ty,X){const r=pr(ty==='bed'?'bed0':ty),f=FD[ty],e={k:'f',ty,x:X,w:r[2],y:f.y!=null?FY+f.y:FY-r[3],t:f.t,fire:0,woke:0};S.ents.push(e);
 if(f.v){const sl=f.v.slice().sort(()=>Math.random()-.5),n=f.n||1+Math.floor(Math.random()*f.v.length);
  for(const s of sl.slice(0,n)){const ty=Math.floor(Math.random()*4);S.ents.push({k:'v',ty,x:X+s[0]+(20-SP.vs[ty][0]/2),base:FY-s[1],st:0})}}
 return r[2]}
function place(z,X,room){
 const t=S.pt,r=Math.random(),fits=w=>w<=room;
 if(z.ty==='park'){
  if(r<Math.min(.46,.3+t*.003)&&t>2&&fits(222)){S.ents.push({k:'gator',x:X,w:222,hit:0});return 222}
  const ty=pick(ZF.park);return fits(pr(ty)[2])?addF(ty,X):0}
 if(z.ty==='bedroom'&&!z.bed&&X>z.x0+400){if(!fits(300))return 0;z.bed=1;return addF('bed',X)}
 if(r<Math.min(.4,.16+t*.0055)&&t>3&&fits(150)){S.ents.push({k:'bath',x:X,w:150,hit:0});return 150}
 let ty=pick(ZF[z.ty]);if(ty==='oven'){if(z.oven)ty='counter';else z.oven=1}
 if(ty==='fp'){const k=Math.floor(Math.random()*3),w=pr('fp'+k)[2];if(!fits(w))return 0;S.ents.push({k:'fp',ty:k,x:X,w,h:pr('fp'+k)[3],st:0,tt:0});return w}
 if(fits(pr(ty)[2]))return addF(ty,X);return fits(56)?addF('stand',X):0}
function gen(){
 let L=S.zones[S.zones.length-1];
 while(L.x1<S.wx+W*3){const ty=ZSEQ[(ZSEQ.indexOf(L.ty)+1)%ZSEQ.length],z={ty,x0:L.x1,x1:L.x1+ZLEN[ty]};
  const spr=ty==='park'?'door_front':L.ty==='park'?'door_house':'doorway';S.ents.push({k:'dw',spr,x:L.x1-pr(spr)[2]/2,w:pr(spr)[2]});S.zones.push(z);L=z}
 while(S.gx<S.wx+W+300){const z=zoneAt(S.gx);if(S.gx<z.x0+130){S.gx=z.x0+130;continue}
  const w=place(z,S.gx,z.x1-130-S.gx);if(!w){S.gx=z.x1+130;continue}
  S.gx+=w+(.75+Math.random()*.55)*S.sp*.9+40}
 if(S.wx-(S.lastClean||0)>400){S.lastClean=S.wx;S.zones=S.zones.filter(z=>z.x1>S.wx-200);S.ents=S.ents.filter(e=>e.x+(e.w||200)>S.wx-300)}}
const gainLife=(wx,y)=>{if(S.lives<9){S.lives++;pop('+1 LIFE',wx,y,'#e2741c')}else{S.score+=100;pop('+100',wx,y,'#e2741c')}};
const pop=(txt,wx,y,col,big)=>S.pops.push({txt,x:wx,y,col,big,t:0});
const burst=(wx,y,n,col,sp)=>{for(let i=0;i<n;i++)S.ps.push({x:wx,y,vx:rnd(-sp,sp),vy:rnd(-sp*1.6,-sp*.4),t:0,col,r:rnd(2,4)})};
function hurt(cause){S.lives--;S.flash=.35;pop('-1',S.wx+CX+90,S.c.y-80,'#e23b2e');if(S.lives<=0){S.mode='over';S.overT=0;S.cause=cause;if(S.score>hi){hi=Math.floor(S.score);try{localStorage.setItem('archie-hi',hi)}catch(e){}}}}
function press(){
 if(S.mode==='title'){S.mode='intro';S.intro=0;return}
 if(S.mode==='over'){if(S.overT>.8)reset();return}
 if(S.mode!=='play')return;
 const c=S.c;if(!c.on&&!c.hj&&c.jt>0&&S.t-c.jt<.6){c.vy=Math.min(c.vy,HJV);c.hj=true;return}
 S.req=S.t}
function step(dt){
 S.t+=dt;S.flash=Math.max(0,S.flash-dt);
 for(const p of S.ps){p.vy+=1400*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.t+=dt;if(p.y>FY+8){p.y=FY+8;p.vx*=.6;p.vy=0}}S.ps=S.ps.filter(p=>p.t<1.1);
 for(const p of S.pops)p.t+=dt;S.pops=S.pops.filter(p=>p.t<(p.big?2:.9));
 if(S.mode==='title'){S.anim+=dt;return}
 if(S.mode==='intro'){S.intro+=dt;if(S.intro>.72){S.mode='play';S.ents.push({k:'ebox',x:S.wx+CX,w:130})}return}
 if(S.mode==='over'){S.overT+=dt;return}
 const c=S.c;S.pt+=dt;S.sp=300+Math.min(PORT?280:340,S.pt*6);const d=S.sp*dt;S.wx+=d;S.anim+=dt*S.sp/300;S.score+=d/120;gen();
 c.inv=Math.max(0,c.inv-dt);c.wet=Math.max(0,c.wet-dt);c.land=Math.max(0,c.land-dt);c.drop=Math.max(0,c.drop-dt);
 S.zone=zoneAt(S.wx+CX+80).ty;
 if(S.t-S.req<.12&&(c.on||S.t-c.last<.09)){c.vy=JV;c.on=false;c.last=-9;c.jt=S.t;c.hj=false;S.req=-9}
 const fc=S.wx+CX+105*K,L=fc-16,R=fc+16,pv=c.y;
 c.vy+=G*dt;c.y+=c.vy*dt;
 let gr=FY,sup=null;
 if(!c.drop)for(const e of S.ents)if(e.t&&R>e.x&&L<e.x+e.w)for(const tp of e.t)if(R>e.x+tp[0]&&L<e.x+tp[1]){const ty=FY-tp[2];if(pv<=ty+4&&ty<gr){gr=ty;sup=e}}
 if(c.y>=gr&&c.vy>=0){if(!c.on&&c.vy>500)c.land=.1;c.y=gr;c.vy=0;c.on=true;c.last=S.t;c.hj=false;c.sup=sup}else{c.on=false;c.sup=null}
 c.crawl=false;
 if(c.sup){const s=c.sup;if(s.ty==='oven'){s.fire=1.2;if(!s.life){s.life=1;gainLife(s.x+65,FY-150)}}
  if(s.ty==='bed'&&!s.woke&&S.pt-S.lastBonus>60){s.woke=1;S.lastBonus=S.pt;S.score+=500;pop('MEGA BONUS! +500',s.x+150,FY-190,'#ff3d8b',1);burst(s.x+150,FY-120,30,'#ffd23a',260);gainLife(s.x+150,FY-200)}}
 for(const e of S.ents)if(e.k==='gator')e.x-=28*dt;
 const top=c.y-(c.crawl?60:88),ax0=S.wx+CX+60*K,ax1=S.wx+CX+150*K;
 for(const e of S.ents){
  if(e.k==='f'&&e.fire)e.fire=Math.max(0,e.fire-dt);
  else if(e.k==='bath'&&!e.hit&&fc>e.x+14&&fc<e.x+e.w-14&&c.y>FY-44){e.hit=1;S.tub=e;c.wet=1.9;burst(fc,FY-50,18,'#7ec8f0',220);hurt('bath')}
  else if(e.k==='gator'&&!e.hit&&!c.inv&&fc>e.x+26&&fc<e.x+e.w-24&&c.y>FY-38){e.hit=1;c.inv=1.2;hurt('gator')}
  else if(e.k==='v'){const[w,h]=SP.vs[e.ty];
   if(!e.st&&e.x+6<ax1&&e.x+w-6>ax0&&e.base-h<c.y-4&&e.base>top){e.st=1;e.vx=150;e.vy=-140;e.va=rnd(5,8);e.a=0;e.y=e.base;S.score+=10;pop('+10',e.x+w/2,e.base-h,'#2b2622')}
   else if(e.st===1){e.vy+=G*dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.a+=e.va*dt;if(e.y>=FY){e.y=FY;e.st=2;burst(e.x+w/2,FY-6,14,'#6b4a2a',120)}}}
  else if(e.k==='fp'){if(!e.st&&e.x+12<ax1&&e.x+e.w-12>ax0&&c.y>FY-e.h+20){e.st=1;e.tt=0;S.score+=20;pop('+20',e.x+e.w/2,FY-e.h,'#2b2622')}
   else if(e.st===1){e.tt+=dt;if(e.tt>.4){e.st=2;burst(e.x+e.w+40,FY-6,22,'#6b4a2a',160)}}}}
 if(S.tub&&S.mode==='play'&&(fc<S.tub.x||fc>S.tub.x+S.tub.w))S.tub=null;
}
// ---------- drawing
function drawWorld(){
 const fh=H-OY-FY;
 for(const z of S.zones){const a=z.x0-CAM,b=z.x1-CAM;if(b<0||a>W)continue;
  const l=Math.max(0,a),r=Math.min(W,b);x.save();x.beginPath();x.rect(l,-OY-2,r-l,H+4);x.clip();
  if(OY>0){x.fillStyle=TOPC[z.ty];x.fillRect(l,-OY-2,r-l,OY+4);if(z.ty!=='park'){x.fillStyle='#fbf7f0';x.fillRect(l,-OY-2,r-l,16);x.fillStyle='rgba(59,36,20,.35)';x.fillRect(l,-OY+14,r-l,2)}}
  for(let tx=a+Math.floor((l-a)/800)*800;tx<r;tx+=800)x.drawImage(IMG[z.ty],0,0,1600,680,tx,0,800,FY);
  const f=FLOOR[z.ty];x.fillStyle=f[0];x.fillRect(l,FY,r-l,fh);x.fillStyle=f[1];
  if(z.ty==='kitchen'){for(let gx=Math.floor((CAM+l)/40)*40;gx<CAM+r;gx+=40)for(let j=0;j*30<fh;j++)if(((gx/40)+j)%2)x.fillRect(gx-CAM,FY+j*30,40,30)}
  else if(z.ty==='park'){x.fillRect(l,FY+18,r-l,fh);x.fillStyle='#b88f5c';x.fillRect(l,FY+26,r-l,20)}
  else{for(let gx=Math.floor((CAM+l)/96)*96;gx<CAM+r;gx+=96)x.fillRect(gx-CAM,FY,2,fh);for(let j=28;j<fh;j+=30)x.fillRect(l,FY+j,r-l,2);
   if(z.ty==='hall'){x.fillStyle='#b8423a';x.fillRect(l,FY+12,r-l,30);x.fillStyle='#e9c46a';x.fillRect(l,FY+15,r-l,2);x.fillRect(l,FY+37,r-l,2)}
   if(z.ty==='bedroom'){x.fillStyle='rgba(255,255,255,.18)';for(let gx=Math.floor((CAM+l)/24)*24;gx<CAM+r;gx+=24)x.fillRect(gx-CAM,FY+8+(gx/24%3)*14,10,3)}}
  x.restore()}
 const E=S.ents,sx=e=>e.x-CAM,vis=e=>sx(e)<W+40&&sx(e)+(e.w||200)>-60;
 for(const e of E)if(e.k==='dw'&&vis(e)){const r=pr(e.spr);ps(e.spr,sx(e),FY-r[3])}
 for(const e of E)if(e.k==='f'&&vis(e)){ps(e.ty==='bed'?(e.woke?'bed1':'bed0'):e.ty,sx(e),e.y);
  if(e.ty==='oven'&&e.fire)for(let i=0;i<4;i++){x.globalAlpha=Math.min(1,e.fire*2);const h=26+5*Math.sin(S.t*20+i);ps('flame'+((Math.floor(S.t*10)+i)%2),sx(e)+12+i*30,e.y+1-h,24,h)}x.globalAlpha=1;
  if(e.ty==='bed'&&!e.woke){x.fillStyle='#6b5a9a';x.font='bold 16px system-ui,sans-serif';for(let i=0;i<3;i++){const t=(S.t*.6+i/3)%1;x.globalAlpha=1-t;x.fillText('z',sx(e)+168+t*30+i*4,e.y+78-t*40)}x.globalAlpha=1}}
 for(const e of E){if(!vis(e))continue;
  if(e.k==='v'&&e.st===2)ps('brk'+e.ty,sx(e)-18,FY-26);
  else if(e.k==='fp'&&e.st===2)ps('fbrk'+e.ty,sx(e)-20,FY-56)}
 for(const e of E){if(!vis(e))continue;const X0=sx(e);
  if(e.k==='fp'&&e.st<2){if(!e.st)ps('fp'+e.ty,X0,FY-e.h);else{x.save();x.translate(X0+e.w*.7,FY);x.rotate(Math.min(1,e.tt/.4)*1.45);ps('fp'+e.ty,-e.w*.7,-e.h);x.restore()}}
  else if(e.k==='bath'&&e!==S.tub)ps('bath',X0,FY-66);
  else if(e.k==='gator'){const near=e.x-(CAM+CX)<280&&e.x-(CAM+CX)>-120;ps('gator'+((near?2:0)+Math.floor(S.t*6)%2),X0,FY-76)}
  else if(e.k==='ebox')arch(16,0,X0,FY-116*K)}
 for(const e of E)if(e.k==='v'&&e.st<2&&vis(e)){const[w,h]=SP.vs[e.ty];if(!e.st)ps('vase'+e.ty,sx(e),e.base-h);else{x.save();x.translate(sx(e)+w/2,e.y-h/2);x.rotate(e.a);ps('vase'+e.ty,-w/2,-h/2);x.restore()}}
}
function drawArchie(){
 const c=S.c;if(!AC)return;
 if(S.mode==='title')return arch(13,Math.floor(S.anim*6)%10,CX,FY-116*K);
 if(S.mode==='intro'){const i=Math.floor(S.intro/.12);return i<5?arch(14,i,CX,FY-116*K):arch(15,0,CX,FY-116*K)}
 const set=c.wet>0?1:S.zone==='park'?2:0,RUN=[0,7,10][set],JMP=[1,8,11][set],HJ=[2,9,12][set],DK=[3,6,3][set],DN=[6,5,6][set],f=Math.floor(S.anim*14);
 let row,k;
 if(S.mode==='over'){row=S.cause==='bath'?7:10;k=0}
 else if(!c.on){row=c.hj?HJ:JMP;k=c.vy<-450?2:c.vy<-150?3:c.vy<120?4:c.vy<420?5:6}
 else if(c.crawl){row=DK;k=f%DN}else if(c.land>0){row=JMP;k=7}else{row=RUN;k=f%8}
 if(c.inv>0&&S.mode==='play'&&Math.floor(S.t*14)%2)return;
 arch(row,k,CX,c.y-116*K+(S.tub&&c.on?24:0));
 if(S.tub)ps('bath',S.tub.x-CAM,FY-66);
}
function drawTop(){
 for(const p of S.ps){x.globalAlpha=Math.max(0,1-p.t);x.fillStyle=p.col;x.beginPath();x.arc(p.x-CAM,p.y,p.r,0,7);x.fill()}x.globalAlpha=1;
 x.textAlign='center';for(const p of S.pops){const a=p.big?2:.9;x.globalAlpha=Math.max(0,1-p.t/a);x.font=`800 ${p.big?30:18}px system-ui,sans-serif`;x.lineWidth=4;x.strokeStyle='#fff';const X0=p.big?W/2:p.x-CAM,Y=p.big?150-p.t*20:p.y-p.t*40;x.strokeText(p.txt,X0,Y);x.fillStyle=p.col;x.fillText(p.txt,X0,Y)}x.globalAlpha=1;
 if(night){x.fillStyle='rgba(18,24,70,.38)';x.fillRect(0,-OY,W,H)}
 if(S.flash){x.fillStyle=`rgba(255,60,40,${S.flash})`;x.fillRect(0,-OY,W,H)}
}
function txt(s,X,Y,sz,col='#2b2622'){x.font=`800 ${sz}px system-ui,sans-serif`;x.lineWidth=5;x.strokeStyle='rgba(255,255,255,.9)';x.strokeText(s,X,Y);x.fillStyle=col;x.fillText(s,X,Y)}
const BTN=()=>({night:[W-26,78,18]});
function btn(b,label,on){if(!b)return;x.globalAlpha=on?.9:.55;x.fillStyle='#fff';x.beginPath();x.arc(b[0],b[1],b[2],0,7);x.fill();x.globalAlpha=.9;x.lineWidth=2;x.strokeStyle='rgba(59,36,20,.5)';x.stroke();x.globalAlpha=1;x.fillStyle='#2b2622';x.font=`800 ${Math.round(b[2]*.36)}px system-ui,sans-serif`;x.fillText(label,b[0],b[1]+b[2]*.13)}
function hud(){
 const hd=SP.head,B=BTN(),sz=PORT?32:28;if(AC)for(let i=0;i<S.lives;i++)x.drawImage(AC,hd[0]*AS,hd[1]*AS,hd[2]*AS,hd[3]*AS,10+i*(sz+1),10,sz,sz*hd[3]/hd[2]);
 x.textAlign='right';txt('Score '+Math.floor(S.score),W-14,32,PORT?24:20);txt('Best '+Math.max(hi,Math.floor(S.score)),W-14,54,14);x.textAlign='center';
 {const b=B.night;btn(b,'',night);x.fillStyle=night?'#f2b62b':'#5b5f8a';x.beginPath();x.arc(b[0],b[1],b[2]*.5,0,7);x.fill();
  if(!night){x.fillStyle='#fff';x.beginPath();x.arc(b[0]+b[2]*.28,b[1]-b[2]*.2,b[2]*.42,0,7);x.fill()}else{x.strokeStyle='#f2b62b';x.lineWidth=2;for(let i=0;i<8;i++){const a=i*Math.PI/4;x.beginPath();x.moveTo(b[0]+Math.cos(a)*b[2]*.66,b[1]+Math.sin(a)*b[2]*.66);x.lineTo(b[0]+Math.cos(a)*b[2]*.86,b[1]+Math.sin(a)*b[2]*.86);x.stroke()}}}
 const cy=OY+(PORT?90:110);
 if(S.mode==='title'){const bw=PORT?W*.94:Math.min(W*.62,640),bh=bw*.37,by=(PORT?OY-bh*.55:OY+8)+Math.sin(S.t*2)*4;
  x.drawImage(IMG.banner,W/2-bw/2,by,bw,bh);const ty=by+bh+30,k=1+Math.sin(S.t*4)*.05;
  x.save();x.translate(W/2,ty);x.scale(k,k);txt('Tap to start',0,0,26);x.restore();
  if(PORT){txt('Tap anywhere to jump',W/2,ty+30,15);txt('Tap again in the air to jump higher',W/2,ty+50,15)}else txt('Tap anywhere to jump, tap again in the air to jump higher',W/2,ty+30,15)}
 if(S.mode==='over'){txt('Game over',W/2,cy+20,38,'#c0392b');txt('Score '+Math.floor(S.score),W/2,cy+55,22);if(S.overT>.8)txt('Tap to play again',W/2,cy+85,18)}
}
function draw(){
 x.setTransform(SC,0,0,SC,0,0);x.clearRect(0,0,W,H);
 if(nOk<nAll||!AC){x.fillStyle='#f4efe6';x.fillRect(0,0,W,H);x.textAlign='center';txt(bad?'Could not load '+bad:'Loading Archie… '+nOk+'/'+nAll,W/2,H/2,22);return}
 CAM=snap(S.wx);x.setTransform(SC,0,0,SC,0,Math.round(OY*SC));drawWorld();drawArchie();drawTop();x.setTransform(SC,0,0,SC,0,0);hud()}
let last=0,acc=0;const STEP=1/120;
function loop(ts){let dt=(ts-last)/1000||0;last=ts;if(dt>.1)dt=.1;if(nOk===nAll&&AC){acc+=dt;while(acc>=STEP){step(STEP);acc-=STEP}}draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
const lp=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]};
const hit=(b,p)=>b&&Math.hypot(p[0]-b[0],p[1]-b[1])<b[2]+8;
cv.addEventListener('pointerdown',e=>{e.preventDefault();const p=lp(e),B=BTN();
 if(!fsTried&&matchMedia('(pointer:coarse)').matches){fsTried=true;const el=document.documentElement;try{const r=el.requestFullscreen&&el.requestFullscreen({navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{})}catch(_){}}
 if(hit(B.night,p)){night=!night;return}
 press()});
addEventListener('keydown',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(!e.repeat)press()}});
window.__archie={get S(){return S},step,draw,press,reset,setDuck:v=>duck=v};
})();
