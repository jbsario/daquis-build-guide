/* Daquis Residence: first-person walkthrough. WebGL, no libraries.
   Model data comes from window.DRB (mm, x across with B = 0, z from row 1 to row 4, y up).
   Room layout, fixtures and furniture follow A2-02 (approximate positions); lights follow the
   E2-10 circuits (positions approximate, see E1-09); pipe routes are simplified (P1-07 sizes). */
(function(){
'use strict';
let D,ov,cv,gl,P,mm,hud={},raf=0,last=0,built=false;
const B={op:[],gl:[],xr:[]},GB={},picks=[],lights=[],surfs=[],walls=[],solids=[],mapW=[];
const cam={x:0,y:-200,z:-5200,yaw:0,pitch:-0.03},st={night:false,pipes:false,on:[1,1,1,1],info:null};
const keys={};let joy=null,look=null,downAt=null;
const EYE=1600,STEP=360,HEAD=1850,R=260;
const C3=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255]};
const COL={wall:C3('ECE9E2'),wallx:C3('F7F7F4'),dark:C3('41484E'),stone:C3('B9B1A3'),conc:C3('BDBAB3'),tile:C3('D8D2C6'),wood:C3('A07B55'),woodd:C3('6E4F33'),ceil:C3('F4F4F1'),
  ctr:C3('E6E3DD'),chrome:C3('C9CED3'),porc:C3('F8F8F6'),glass:C3('9DC0D2'),sofa:C3('7D8A92'),bed:C3('D9D3C8'),sheet:C3('EEF0F2'),black:C3('2A2E31'),fridge:C3('D3D7DA'),
  car:C3('C3C8CC'),tyre:C3('222527'),road:C3('4A5055'),walk:C3('C9CCC8'),grass:C3('7FA35E'),hill:C3('8FAF6E'),soil:C3('7A5A3C'),steel:C3('5D6A72'),lamp:C3('FFF4D6'),
  water:C3('2F8FE0'),sewer:C3('A0662F'),vent:C3('7E8C96'),beam:C3('E3E1DC'),col:C3('E8E6E1'),rail:C3('5B6167'),closet:C3('C9B59A'),plant:C3('5F9C45')};
const m=v=>v/1000;

/* ---------------- geometry builders (mm in, metres in buffers) ---------------- */
function V(buf,p,n,c,e){B[buf].push(m(p[0]),m(p[1]),m(p[2]),n[0],n[1],n[2],c[0],c[1],c[2],e||0)}
function tri(buf,a,b,c,col,e){const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...n)||1;n=n.map(x=>x/l);
  V(buf,a,n,col,e);V(buf,b,n,col,e);V(buf,c,n,col,e)}
function quad(buf,a,b,c,d,col,e){tri(buf,a,b,c,col,e);tri(buf,a,c,d,col,e)}
function pick(x0,y0,z0,x1,y1,z1,info,xr){if(info)picks.push({xr:!!xr,a:[m(Math.min(x0,x1)),m(Math.min(y0,y1)),m(Math.min(z0,z1))],b:[m(Math.max(x0,x1)),m(Math.max(y0,y1)),m(Math.max(z0,z1))],info})}
/* axis box; o: {buf,top,side,e,info,solid} */
function box(x0,y0,z0,x1,y1,z1,col,o){o=o||{};const bf=o.buf||'op',t=o.top||col,s=o.side||col,e=o.e||0;
  const p=(x,y,z)=>[x,y,z];
  quad(bf,p(x0,y1,z0),p(x1,y1,z0),p(x1,y1,z1),p(x0,y1,z1),t,e);quad(bf,p(x0,y0,z1),p(x1,y0,z1),p(x1,y0,z0),p(x0,y0,z0),o.bot||s,e);
  quad(bf,p(x0,y0,z0),p(x1,y0,z0),p(x1,y1,z0),p(x0,y1,z0),s,e);quad(bf,p(x1,y0,z1),p(x0,y0,z1),p(x0,y1,z1),p(x1,y1,z1),s,e);
  quad(bf,p(x0,y0,z1),p(x0,y0,z0),p(x0,y1,z0),p(x0,y1,z1),s,e);quad(bf,p(x1,y0,z0),p(x1,y0,z1),p(x1,y1,z1),p(x1,y1,z0),s,e);
  pick(x0,y0,z0,x1,y1,z1,o.info,bf==='xr');if(o.solid)solids.push({x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1),y0,y1})}
/* oriented box along a->b (plan), thickness t, colours per side: cin / cout (outer = away from house centre) */
function obox(a,b,t,y0,y1,cin,cout,o){o=o||{};const bf=o.buf||'op',dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1)return;const nx=-dz/L*t/2,nz=dx/L*t/2;
  const P4=[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]];const mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;
  const sideCol=(p,q)=>{const fx=(p[0]+q[0])/2-mx,fz=(p[1]+q[1])/2-mz,ox=mx-0,oz=mz-4900;return fx*ox+fz*oz>0?cout:cin};
  for(let i=0;i<4;i++){const p=P4[i],q=P4[(i+1)%4];quad(bf,[p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],y1,q[1]],[p[0],y1,p[1]],i===0||i===2?sideCol(p,q):cin,o.e)}
  quad(bf,[P4[0][0],y1,P4[0][1]],[P4[1][0],y1,P4[1][1]],[P4[2][0],y1,P4[2][1]],[P4[3][0],y1,P4[3][1]],o.top||cin,o.e);
  quad(bf,[P4[3][0],y0,P4[3][1]],[P4[2][0],y0,P4[2][1]],[P4[1][0],y0,P4[1][1]],[P4[0][0],y0,P4[0][1]],cin,o.e);
  if(o.info){const xs=P4.map(p=>p[0]),zs=P4.map(p=>p[1]);pick(Math.min(...xs),y0,Math.min(...zs),Math.max(...xs),y1,Math.max(...zs),o.info)}}
/* convex polygon prism (plan points [x,z]) */
function prismP(F,y0,y1,top,side,o){o=o||{};const bf=o.buf||'op';for(let i=1;i<F.length-1;i++){tri(bf,[F[0][0],y1,F[0][1]],[F[i][0],y1,F[i][1]],[F[i+1][0],y1,F[i+1][1]],top,o.e);tri(bf,[F[0][0],y0,F[0][1]],[F[i+1][0],y0,F[i+1][1]],[F[i][0],y0,F[i][1]],o.bot||side,o.e)}
  for(let i=0;i<F.length;i++){const p=F[i],q=F[(i+1)%F.length];quad(bf,[p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],y1,q[1]],[p[0],y1,p[1]],side,o.e)}
  if(o.info){const xs=F.map(p=>p[0]),zs=F.map(p=>p[1]);pick(Math.min(...xs),y0,Math.min(...zs),Math.max(...xs),y1,Math.max(...zs),o.info)}}
function cyl(cx,cz,r,y0,y1,col,o){o=o||{};const n=o.n||10,bf=o.buf||'op';for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2,p=[cx+r*Math.cos(a),cz+r*Math.sin(a)],q=[cx+r*Math.cos(b),cz+r*Math.sin(b)];
  quad(bf,[p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],y1,q[1]],[p[0],y1,p[1]],col,o.e);tri(bf,[cx,y1,cz],[p[0],y1,p[1]],[q[0],y1,q[1]],o.top||col,o.e);tri(bf,[cx,y0,cz],[q[0],y0,q[1]],[p[0],y0,p[1]],col,o.e)}
  if(o.info)pick(cx-r,y0,cz-r,cx+r,y1,cz+r,o.info)}
/* pipe segment (x-ray layer), square section */
function pipe(a,b,r,col,info){const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];const ax=Math.abs(d[0])>Math.abs(d[1])&&Math.abs(d[0])>Math.abs(d[2])?0:Math.abs(d[1])>Math.abs(d[2])?1:2;
  const lo=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.min(a[2],b[2])],hi=[Math.max(a[0],b[0]),Math.max(a[1],b[1]),Math.max(a[2],b[2])];for(let k=0;k<3;k++)if(k!==ax){lo[k]-=r;hi[k]+=r}
  box(lo[0],lo[1],lo[2],hi[0],hi[1],hi[2],col,{buf:'xr',info})}
function poly(buf,pts,col){for(let i=1;i<pts.length-1;i++)tri(buf,pts[0],pts[i],pts[i+1],col)}
/* clip convex polygon by half-plane a*x+b*z<=c */
function clip(F,a,b,c){const o=[];for(let i=0;i<F.length;i++){const p=F[i],q=F[(i+1)%F.length],fp=a*p[0]+b*p[1]-c,fq=a*q[0]+b*q[1]-c;if(fp<=0)o.push(p);if(fp*fq<0){const t=fp/(fp-fq);o.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t])}}return o}
function minusRect(F,h){const[x0,x1,z0,z1]=h,o=[];o.push(clip(F,0,1,z0));o.push(clip(F,0,-1,-z1));let mid=clip(clip(F,0,-1,-z0),0,1,z1);o.push(clip(mid,1,0,x0));o.push(clip(mid,-1,0,-x1));return o.filter(p=>p.length>2)}
function inPoly(F,x,z){let s=0;for(let i=0;i<F.length;i++){const p=F[i],q=F[(i+1)%F.length],c=(q[0]-p[0])*(z-p[1])-(q[1]-p[1])*(x-p[0]);if(c!==0){if(s===0)s=Math.sign(c);else if(Math.sign(c)!==s)return false}}return true}
function surfPoly(F,h,lv){surfs.push({t:(x,z)=>inPoly(F,x,z),h:()=>h,lv})}
function surfBox(x0,x1,z0,z1,h,lv){surfs.push({t:(x,z)=>x>=Math.min(x0,x1)&&x<=Math.max(x0,x1)&&z>=Math.min(z0,z1)&&z<=Math.max(z0,z1),h:()=>h,lv})}

/* wall with openings given as plan intervals along z (or x for walls running across).
   ops: [from,to,sill,head,kind] kind 'd' door (walkable gap), 'w' window (glass), 'g' glass door (glass to floor) */
function wall(a,b,y0,y1,o){o=o||{};const t=o.t||150,ops=(o.ops||[]).slice().sort((p,q)=>p[0]-q[0]),cin=o.cin||COL.wall,cout=o.cout||cin,useX=Math.abs(b[0]-a[0])>Math.abs(b[1]-a[1]);
  const coord=p=>useX?p[0]:p[1],c0=coord(a),c1=coord(b),dir=Math.sign(c1-c0)||1,at=v=>{const s=(v-c0)/(c1-c0);return[a[0]+(b[0]-a[0])*s,a[1]+(b[1]-a[1])*s]};
  const L=Math.hypot(b[0]-a[0],b[1]-a[1]),info=o.info||`${o.name||'Wall'}|150mm CHB, plastered both faces|${m(L).toFixed(2)}m long × ${m(y1-y0).toFixed(2)}m high`;
  let cur=c0;const seg=(p,q,ya,yb)=>{if(Math.abs(q-p)<5||yb-ya<5)return;obox(at(p),at(q),t,ya,yb,cin,cout,{info})};
  const col=[];ops.forEach(([f,tt,sill,head,k])=>{const p=dir>0?Math.min(f,tt):Math.max(f,tt),q=dir>0?Math.max(f,tt):Math.min(f,tt);
    seg(cur,p,y0,y1);seg(p,q,y0,y0+sill);seg(p,q,y0+head,y1);
    if(k!=='d'){const A2=at(p),B2=at(q);obox(A2,B2,24,y0+sill,y0+head,COL.glass,COL.glass,{buf:'gl',info:`${k==='g'?'Glass door':'Window'}${o.wn?' '+o.wn:''}|${m(Math.abs(q-p)).toFixed(2)} × ${m(head-sill).toFixed(2)}m · aluminum frame, 6mm glass (A2-02)`});
      const n=Math.max(1,Math.round(Math.abs(q-p)/900));for(let i=1;i<n;i++){const s=at(p+(q-p)*i/n);box(s[0]-25,y0+sill,s[1]-25,s[0]+25,y0+head,s[1]+25,COL.steel)}
      obox(A2,B2,60,y0+sill-30,y0+sill,COL.steel,COL.steel);obox(A2,B2,60,y0+head,y0+head+30,COL.steel,COL.steel)}
    else col.push([p,q]);cur=q});
  seg(cur,c1,y0,y1);
  /* collision: wall minus door gaps */
  let c=c0;const segs=[];col.forEach(([p,q])=>{segs.push([c,p]);c=q});segs.push([c,c1]);
  segs.forEach(([p,q])=>{if(Math.abs(q-p)>5)walls.push({a:at(p),b:at(q),t,y0,y1})});
  if(o.lv!=null)mapW.push({lv:o.lv,a,b,ops:ops.map(x=>[at(x[0]),at(x[1]),x[4]])})}

/* ---------------- the house ---------------- */
function build(){const{A,C,AO,CO,ZF,ZB}=D;
  const F0=0,F2=2650,F3=6050,CE0=2550,CE2=5950,CE3=8950;
  const xa3=z=>AO(z)+75,xc3=z=>CO(z)-75;
  /* --- outside: road, sidewalk, yard, hill --- */
  box(-12000,-260,-9000,12000,-200,-3200,COL.grass);
  box(-12000,-260,-3200,12000,-210,-1700,COL.road,{info:'Road|Asphalt, in front of the lot (not in plans)'});
  for(let x=-11000;x<12000;x+=3000)box(x,-209,-2480,x+1500,-205,-2420,COL.wallx);
  box(-12000,-260,-1700,12000,-200,-150,COL.walk,{info:'Sidewalk and driveway|Level −0.20'});
  surfBox(-11000,11000,-8800,-120,-200,'out');
  const H=z=>z<=-2000?-200:z>=5200?2650+350*Math.min(1,(z-5200)/7800):-200+2850*(z+2000)/7200;
  const hz=[-150,1000,3000,5200,9000,13000];
  for(let i=0;i<hz.length-1;i++){const a=hz[i],b=hz[i+1];
    poly('op',[[-12000,H(a),a],[A(a)-1520,H(a),a],[A(b)-1520,H(b),b],[-12000,H(b),b]],COL.hill);
    poly('op',[[C(a)+1300,H(a),a],[12000,H(a),a],[12000,H(b),b],[C(b)+1300,H(b),b]],COL.hill)}
  poly('op',[[-12000,H(10500),10500],[12000,H(10500),10500],[12000,H(13000),13000],[-12000,H(13000),13000]],COL.hill);
  [[-12000,A(-150)-1520],[C(-150)+1300,12000]].forEach(([x0,x1])=>quad('op',[x0,-200,-150],[x1,-200,-150],[x1,H(-150),-150],[x0,H(-150),-150],COL.soil));
  /* exterior stair (A side): 14 risers × 204, landing at +2.65 to door D1 */
  const SN=D.SN,SZ0=D.SZ0,SRUN=D.SRUN,SR=2850/SN;
  for(let i=0;i<SN;i++){const za=SZ0+i*SRUN,zb=za+SRUN,top=-200+SR*(i+1);
    prismP([[A(za)-1500,za],[A(za)-300,za],[A(zb)-300,zb],[A(zb)-1500,zb]],-200,top,COL.tile,COL.conc,{info:`Exterior stair, riser ${i+1} of ${SN}|Riser ≈ 204mm · tread 280mm · width 1.20m (assumed count)|Top of this step ${m(top).toFixed(2)}m`});
    surfs.push({t:(x,z)=>z>=za&&z<=zb&&x>=A(z)-1500&&x<=A(z)-300,h:()=>top,lv:'out'})}
  {const za=SZ0+SN*SRUN,zb=5200;prismP([[A(za)-1500,za],[A(za)-75,za],[A(zb)-75,zb],[A(zb)-1500,zb]],-200,F2,COL.tile,COL.conc,{info:'Stair landing|+2.65, beside the 2nd floor door D1|1.20m wide'});
    surfs.push({t:(x,z)=>z>=za&&z<=zb&&x>=A(z)-1500&&x<=A(z),h:()=>F2,lv:'out'});
    box(A(za)-1560,F2,za,A(za)-1500,F2+1000,zb,COL.rail,{solid:true});for(let i=0;i<SN;i++){const z=SZ0+i*SRUN;box(A(z)-1560,-200+SR*(i+1),z,A(z)-1500,-200+SR*(i+1)+950,z+SRUN,COL.rail)}
    walls.push({a:[A(SZ0)-1530,SZ0],b:[A(za)-1530,za],t:60,y0:-200,y1:F2+1000})}
  /* --- slabs (floors and ceilings) --- */
  const LOWF=D.LOWF,OUT=D.OUT;
  prismP(LOWF,-100,F0,COL.conc,COL.conc,{info:'Garage slab on fill|100mm, 10mm bars @ 600 both ways|FFL ±0.00'});surfPoly(LOWF,F0,0);
  const H2=[A(7000)-200,-1620,7140,8680];
  minusRect(LOWF,H2).forEach(F=>{prismP(F,CE0,F2,COL.tile,COL.ceil,{bot:COL.ceil,info:'2nd floor slab|100mm, #10 @ 150 both ways (Grade 40)|FFL +2.65 · garage ceiling +2.55'});surfPoly(F,F2,2)});
  const H3=[50,2880,8895,9980];
  minusRect(OUT,H3).forEach(F=>{prismP(F,CE2,F3,COL.tile,COL.ceil,{bot:COL.ceil,info:'3rd floor slab|100mm, #10 @ 150 both ways (Grade 40)|FFL +6.05 · 2nd floor ceiling +5.95'});surfPoly(F,F3,3)});
  prismP(OUT,CE3,CE3+30,COL.ceil,COL.ceil,{bot:COL.ceil,info:'3rd floor ceiling|Assumed ceiling board at +8.95 under the roof beams'});
  /* roof sheets + parapet (seen from outside) */
  const ry=z=>9620+(9360-9620)*(z-ZF)/(ZB-ZF);poly('op',[[AO(ZF)+150,ry(ZF),ZF+150],[CO(ZF)-150,ry(ZF),ZF+150],[CO(ZB)-150,ry(ZB),ZB-150],[AO(ZB)+150,ry(ZB),ZB-150]],COL.steel);
  prismP(OUT,CE3+30,9300,COL.wallx,COL.wallx);
  [[[AO(ZF),ZF],[CO(ZF),ZF]],[[AO(ZB),ZB],[CO(ZB),ZB]],[[AO(ZF),ZF],[AO(ZB),ZB]],[[CO(ZF),ZF],[CO(ZB),ZB]]].forEach(([a,b])=>obox(a,b,150,9300,9750,COL.wallx,COL.wallx,{info:'Parapet|+9.30 to +9.75 · 450mm high'}));
  /* --- columns --- */
  D.MAIN.forEach(c=>{const h=c[3]/2,top=(c[0]==='C5'||c[0]==='C8')?CE3:CE2+100;
    box(c[1]-h,-100,c[2]-h,c[1]+h,top,c[2]+h,COL.col,{info:`Column ${c[0]}|${c[3]} × ${c[3]}mm concrete (≈ ${c[3]+35} finished) · C28|Garage ${c[0]==='C10'||c[0]==='C11'?'8-#16':'4-#20'} · Grade 60`,solid:true})});
  D.UPC.forEach((c,k)=>{const n=D.UPN[k];if(n==='C5'||n==='C8')return;box(c[1]-c.hx,F3,c[2]-c.hz,c[1]+c.hx,CE3,c[2]+c.hz,COL.col,{info:`Column ${n}|${c.hx*2} × ${c.hz*2}mm · C28 · starts on the 3rd floor`,solid:true})});
  /* --- beams under the 2nd and 3rd floor slabs --- */
  [['f2',F2],['f3',F3]].forEach(([lv,top])=>D.LB(lv).forEach(s=>{const R=D.brec(s);if(!R)return;obox(s[0],s[1],R.w,top-R.d,top-100,COL.beam,COL.beam,{info:`${D.LEVN[lv]} ${s.mk}|${R.w} × ${R.d}mm · bottom ${R.bot[1]} · top ${R.top[1]}|Stirrups #10 ${R.st.map(x=>x[0]+' @ '+x[1]).join(' / ')}${R.cant?' · CANTILEVERED':''}`})}));
  /* --- garage (level 0) --- */
  wall([A(0),0],[A(9980),9980],F0,CE0,{cout:COL.stone,lv:0,name:'Garage wall, A side (holds back the hill)'});
  wall([A(9980),9980],[C(9980),9980],F0,CE0,{lv:0,name:'Garage rear wall (holds back the hill)'});
  wall([C(0),0],[C(9980),9980],F0,CE0,{cout:COL.stone,lv:0,name:'Garage wall, C side'});
  wall([A(0),0],[C(0),0],F0,CE0,{cout:COL.stone,lv:0,ops:[[A(0)+700,C(0)-700,0,2250,'d']],name:'Garage front'});
  wall([A(6990),6990],[-75,6990],F0,CE0,{lv:0,name:'Stair room wall'});
  wall([0,6990],[0,9905],F0,CE0,{lv:0,ops:[[8890,9730,0,2100,'d']],name:'Stair room wall (door D2)'});
  box(A(0)+700,2250,-90,C(0)-700,2550,-60,COL.dark,{info:'Garage door (rolled up)|Opening ≈ 3.90 × 2.25m · roll-up door, spec not in plans'});
  car(1550,4840,9080);car(0,-900,3380);
  box(D.LPP.x-200,1050,D.LPP.z-220,D.LPP.x+20,1750,D.LPP.z+220,COL.chrome,{info:'Panel board LPP|18 circuits · 29,770 W · 129.42 A · 125AT main at the service post|Feeder 2-38mm² + 1-8mm² THHN in 25mm RSC (E2-10)'});
  spiral(-2300,7910,F0,F2);
  /* --- 2nd floor (level 2) --- */
  wall([A(0),0],[A(9980),9980],F2,CE2,{lv:2,cout:COL.wallx,ops:[[8850,9570,0,2100,'d'],[6400,8750,900,2100,'w'],[4620,5770,0,2100,'g'],[2790,3600,0,2100,'d'],[670,2690,900,2400,'w']],name:'2nd floor wall, A side'});
  wall([A(9980),9980],[C(9980),9980],F2,CE2,{lv:2,cout:COL.wallx,ops:[[-1540,-730,1000,2100,'w'],[2360,2770,1500,2100,'w']],name:'2nd floor rear wall'});
  wall([C(0),0],[C(9980),9980],F2,CE2,{lv:2,cout:COL.wallx,ops:[[4620,6060,1000,2100,'w']],name:'2nd floor wall, C side'});
  wall([A(0),0],[C(0),0],F2,CE2,{lv:2,cout:COL.wallx,ops:[[A(0)+200,-150,0,2400,'w'],[150,C(0)-200,0,2400,'w']],name:'2nd floor front (glass wall W1)',wn:'W1 (sliding)'});
  wall([A(6990),6990],[-75,6990],F2,CE2,{lv:2,ops:[[-980,-220,0,2100,'d']],name:'Service area wall (door D2)'});
  wall([0,6990],[0,9905],F2,CE2,{lv:2,name:'Stair wall'});
  wall([1907,7160],[1907,8895],F2,CE2,{lv:2,ops:[[7930,8560,0,2100,'d']],name:'T&B 1 wall (door D6)'});
  wall([1907,8895],[1907,9905],F2,4750,{lv:2,name:'T&B 1 wall under the stair'});
  wall([1907,7160],[C(7160)-75,7160],F2,CE2,{lv:2,name:'T&B 1 wall'});
  straightStair(F2,F3);
  /* kitchen, dining, living */
  box(180,F2,3850,1250,F2+880,6060,COL.wood,{top:COL.ctr,info:'Kitchen island|1.07 × 2.21m · counter at +0.88|Sink, faucet and range nearby (A2-02)',solid:true});
  sink(905,5590,F2+880,'Kitchen sink (island)','z-',`20mm cold water (PPR) · drain 50mm with trap to the 100mm sewer|Water: P1-07`);
  box(2310,F2,3850,C(5000)-80,F2+880,6200,COL.wood,{top:COL.ctr,info:'Kitchen counter (C side)|0.60m deep · range on top',solid:true});
  box(2380,F2+880,5000,2860,F2+900,5910,COL.black,{info:'Range|2,000 W range outlet, CKT 7 (20AT 2P)'});
  [[2500,5200],[2740,5200],[2500,5700],[2740,5700]].forEach(([x,z])=>cyl(x,z,80,F2+900,F2+915,C3('555B60')));
  box(2250,F2,6250,C(6600)-90,F2+1800,7100,COL.fridge,{info:'Refrigerator|Outlet on CKT 8 (500 W)',solid:true});
  table(-2100,-1135,4280,6300,F2,'Dining table (A2-02)');
  sofa(-1240,1300,2550,3270,F2,'z+');sofa(-2100,-1270,580,2160,F2,'x-');sofa(1350,2160,580,2160,F2,'x+');
  box(-700,F2,1200,500,F2+420,1900,COL.woodd,{info:'Coffee table'});
  /* service area */
  box(-680,F2,8030,-70,F2+880,9280,COL.wood,{top:COL.ctr,info:'Service counter (dirty kitchen)',solid:true});
  [[-380,8450],[-380,8800]].forEach(([x,z])=>cyl(x,z,90,F2+880,F2+900,C3('555B60')));
  laundry(-1390,-780,9330,9905,F2);
  /* T&B 1 */
  wc(2700,8650,F2,'x+','T&B 1');
  vanity(2210,2920,7235,7790,F2,'z-','T&B 1');
  shower(2565,C(9500)-80,9180,9905,F2,'z+','T&B 1',1);
  /* --- 3rd floor (level 3) --- */
  const zf3=-500;
  wall([xa3(zf3),zf3],[xa3(ZB),ZB-75],F3,CE3,{lv:3,cout:COL.dark,ops:[[7400,9200,900,2400,'w'],[4420,6200,900,2400,'w'],[770,3750,900,2400,'w']],name:'3rd floor wall, A side'});
  wall([xa3(ZB),ZB-75],[xc3(ZB),ZB-75],F3,CE3,{lv:3,cout:COL.dark,ops:[[560,3450,900,2400,'w']],name:'3rd floor rear wall'});
  wall([xc3(zf3),zf3],[xc3(ZB),ZB-75],F3,CE3,{lv:3,cout:COL.dark,ops:[[8370,9330,900,2100,'w'],[5800,6300,1500,2100,'w']],name:'3rd floor wall, C side'});
  wall([xa3(zf3),zf3],[xc3(zf3),zf3],F3,CE3,{lv:3,cout:COL.dark,ops:[[xa3(0)+400,-200,600,2400,'w'],[200,xc3(0)-400,600,2400,'w']],name:'3rd floor front wall',wn:'W4 / W5'});
  box(AO(ZF),F3,ZF,CO(ZF),F3+900,ZF+120,COL.wallx,{info:'Front ledge parapet|600mm ledge in front of the master bedroom windows'});
  wall([xa3(6990),6990],[-75,6990],F3,CE3,{lv:3,name:'Bedroom 1 / 2 wall'});
  wall([0,6990],[0,ZB-150],F3,CE3,{lv:3,ops:[[7210,7980,0,2100,'d']],name:'Bedroom 1 wall (door D3)'});
  wall([0,3990],[0,6990],F3,CE3,{lv:3,ops:[[5910,6990,0,2100,'d']],name:'Bedroom 2 wall (door D3)'});
  wall([xa3(3990),3990],[-75,3990],F3,CE3,{lv:3,name:'Master bedroom wall'});
  wall([1215,7500],[xc3(7500),7500],F3,CE3,{lv:3,name:'T&B 2 wall'});
  wall([1215,5670],[xc3(5670),5670],F3,CE3,{lv:3,name:'T&B 2 / closet wall'});
  wall([1215,5670],[1215,7500],F3,CE3,{lv:3,ops:[[5670,6350,0,2100,'d']],name:'T&B 2 wall (door D5)'});
  wall([1270,3940],[1270,5670],F3,CE3,{lv:3,name:'Walk-in closet wall'});
  wall([1270,3940],[xc3(3940),3940],F3,CE3,{lv:3,ops:[[1980,2690,0,2100,'d']],name:'Walk-in closet wall'});
  wall([50,8895],[2880,8895],F3,F3+1000,{lv:3,t:60,cin:COL.rail,name:'Stair railing',info:'Stair railing|1.00m high around the stair opening (assumed)'});
  bed(-2280,-100,8370,9900,F3,'x+','Bedroom 1 bed');bed(-2280,-100,4330,5870,F3,'x+','Bedroom 2 bed');bed(-2485,-860,1780,3750,F3,'z+','Master bed');
  [[-2860,3500],[-660,3500]].forEach(([x,z])=>box(x-220,F3,z-200,x+220,F3+500,z+200,COL.woodd,{info:'Night table',solid:true}));
  box(xa3(7300)+60,F3,7160,-1675,F3+2200,7740,COL.closet,{info:'Closet (Bedroom 1)|≈ 0.58m deep · built-in',solid:true});
  box(xa3(6700)+60,F3,6440,-1675,F3+2200,6990-75,COL.closet,{info:'Closet (Bedroom 2)|≈ 0.55m deep · built-in',solid:true});
  sofa(810,2480,2120,2930,F3,'z-');box(860,F3,770,2430,F3+500,1060,COL.woodd,{info:'TV console (master bedroom)',solid:true});
  box(1400,F3,4100,1600,F3+2100,5500,COL.closet,{info:'Walk-in closet shelves',solid:true});box(3000,F3,4100,xc3(4800)-80,F3+2100,5500,COL.closet,{info:'Walk-in closet shelves',solid:true});
  /* T&B 2 */
  vanity(1370,2030,6920,7425,F3,'z+','T&B 2');
  wc(2385,7100,F3,'z+','T&B 2');
  shower(2890,xc3(7200)-80,6900,7425,F3,'z+','T&B 2',2);
  tub(2130,xc3(6000)-80,5745,6350,F3);
  /* --- lights (E2-10 circuits; positions approximate) --- */
  const L0=[[-1300,1500],[1300,1500],[-1300,4700],[1300,4700],[1300,7600],[1300,9200],[-2000,8600]];
  L0.forEach(([x,z])=>light(x,CE0,z,1,'Garage lighting','CKT 1 · 14 lighting outlets · 15AT 2P · 700 W'));
  const L2=[[-1200,1300],[1200,1300],[-1200,2900],[1200,2900],[-1600,5300],[700,4900],[2300,5000],[-800,8900],[-2300,8200],[2500,8000],[500,8000]];
  L2.forEach(([x,z])=>light(x,CE2,z,2,'2nd floor lighting','CKT 2 · 26 lighting outlets · 15AT 2P · 1,300 W'));
  const L3=[[-2000,800],[1500,800],[-2000,2800],[1500,2800],[-1700,8800],[-1700,5100],[2300,6600],[2300,4800],[600,6500],[1800,8300],[1500,9400]];
  L3.forEach(([x,z])=>light(x,CE3,z,3,'3rd floor lighting','CKT 3 · 29 lighting outlets · 15AT 2P · 1,450 W'));
  [[A(0)-200,2000,-150],[C(0)+200,2000,-150],[A(3200)-200,F2+2300,3200]].forEach(([x,y,z])=>{box(x-70,y,z-120,x+70,y+180,z+120,COL.lamp,{e:4,info:'Outdoor wall light|Lighting circuit (assumed exterior fixture)'});lights.push({p:[m(x),m(y),m(z)],c:4,lv:y<1500?0:2})});
  /* --- plumbing x-ray (simplified routes; sizes from P1-07) --- */
  const S1=D.STACK1[0];pipe([S1[0],-470,S1[2]],[S1[0],9700,S1[2]],55,COL.sewer,'Soil stack 100ØSS|T&B 1 and T&B 2 · 100mm PVC · vent through the roof (P1-07)');
  const S2=D.STACK2[0];pipe([S2[0],-430,S2[2]],[S2[0],F2+600,S2[2]],40,COL.sewer,'Soil stack 75ØSS|Service area · 75mm PVC (P1-07)');
  pipe([-150,-450,9750],[1630,-520,8070],55,COL.sewer,'Sewer main|100mm PVC, 1% minimum slope, to the septic tank');pipe([1630,-520,8070],[1630,-650,3450],55,COL.sewer,'Sewer main|100mm PVC to the septic tank (P1-07)');
  const WR=[C(9700)-200,9700];pipe([WR[0],-300,WR[1]],[WR[0],CE3-150,WR[1]],14,COL.water,'Cold water riser 20ØCWR|20mm PPR from the meter and gate valve at the front (P1-07)');
  WATER.forEach(([x,y,z,lv])=>{const yc=(lv===2?CE2:CE3)-150;pipe([WR[0],yc,WR[1]],[WR[0],yc,z],14,COL.water,'Cold water line|20mm PPR (route simplified)');pipe([WR[0],yc,z],[x,yc,z],14,COL.water,'Cold water branch|20mm PPR to the fixture');pipe([x,yc,z],[x,y,z],14,COL.water,'Cold water drop|20mm PPR to the angle valve / faucet')});
  DRAIN.forEach(([x,z,lv])=>{const yb=(lv===2?F2:F3)-160;pipe([x,lv===2?F2:F3,z],[x,yb,z],30,COL.sewer,'Fixture drain|50mm PVC through the slab with a trap');pipe([x,yb,z],[x,yb,S1[2]],30,COL.sewer,'Branch drain|To the 100ØSS stack, 2% slope (route simplified)');pipe([x,yb,S1[2]],[S1[0],yb,S1[2]],30,COL.sewer,'Branch drain|To the 100ØSS stack')});
}
const WATER=[],DRAIN=[];
/* ---------------- furniture and fixtures ---------------- */
function car(cx,z0,z1){const w=1800,x0=cx-w/2,x1=cx+w/2,inf='Car|Silver compact crossover (not in plans) · parking only';
  box(x0,250,z0,x1,900,z1,COL.car,{info:inf,solid:true});box(x0+120,900,z0+900,x1-120,1500,z1-1300,COL.car,{side:COL.glass,top:COL.car,solid:true});
  [[x0,z0+700],[x1,z0+700],[x0,z1-700],[x1,z1-700]].forEach(([x,z])=>box(x-110,0,z-330,x+110,620,z+330,COL.tyre))}
function table(x0,x1,z0,z1,F,inf){box(x0,F+720,z0,x1,F+760,z1,COL.wood,{info:inf+'|'+m(x1-x0).toFixed(2)+' × '+m(z1-z0).toFixed(2)+'m'});
  [[x0+60,z0+60],[x1-60,z0+60],[x0+60,z1-60],[x1-60,z1-60]].forEach(([x,z])=>box(x-30,F,z-30,x+30,F+720,z+30,COL.woodd));solids.push({x0,x1,z0,z1,y0:F,y1:F+760});
  for(let k=0;k<3;k++){const z=z0+(z1-z0)*(k+0.5)/3;[x0-350,x1+350].forEach(x=>box(x-200,F,z-200,x+200,F+450,z+200,COL.woodd))}}
function sofa(x0,x1,z0,z1,F,back){box(x0,F,z0,x1,F+420,z1,COL.sofa,{info:'Sofa (A2-02 layout)',solid:true});
  const b={'z+':[x0,z1-180,x1,z1],'z-':[x0,z0,x1,z0+180],'x-':[x0,z0,x0+180,z1],'x+':[x1-180,z0,x1,z1]}[back];box(b[0],F+420,b[1],b[2],F+820,b[3],COL.sofa)}
function bed(x0,x1,z0,z1,F,head,inf){box(x0,F,z0,x1,F+300,z1,COL.woodd,{solid:true});box(x0+30,F+300,z0+30,x1-30,F+520,z1-30,COL.sheet,{info:inf+'|'+m(x1-x0).toFixed(2)+' × '+m(z1-z0).toFixed(2)+'m (A2-02)'});
  const h={'x+':[x1-80,z0,x1,z1],'z+':[x0,z1-80,x1,z1]}[head];box(h[0],F,h[1],h[2],F+1100,h[3],COL.wood)}
function faucet(x,z,y,dir,inf,tall){const d={'x+':[1,0],'x-':[-1,0],'z+':[0,1],'z-':[0,-1]}[dir],h=tall?330:180,reach=tall?220:130;
  cyl(x,z,28,y,y+h,COL.chrome,{info:inf,n:8});box(Math.min(x,x+d[0]*reach)-18,y+h-30,Math.min(z,z+d[1]*reach)-18,Math.max(x,x+d[0]*reach)+18,y+h,Math.max(z,z+d[1]*reach)+18,COL.chrome,{info:inf});
  box(x-d[1]*70-12,y+40,z+d[0]*70-12,x-d[1]*70+12,y+110,z+d[0]*70+12,COL.chrome)}
function sink(cx,cz,y,inf,dir,more){box(cx-240,y-180,cz-200,cx+240,y+2,cz+200,C3('9AA1A6'),{info:`${inf}|Stainless basin ≈ 480 × 400mm|${more}`});
  const d={'z-':[0,1],'z+':[0,-1],'x+':[-1,0],'x-':[1,0]}[dir];faucet(cx+d[0]*260,cz+d[1]*260,y,dir,`${inf.replace('sink','faucet')}|Gooseneck faucet · 20mm cold water (PPR)|Angle valve under the counter`,true);
  WATER.push([cx+d[0]*260,y-300,cz+d[1]*260,y>5000?3:2]);DRAIN.push([cx,cz,y>5000?3:2])}
function laundry(x0,x1,z0,z1,F){box(x0,F,z0,x1,F+850,z1,COL.porc,{info:'Laundry sink (service area)|Deep tub ≈ '+m(x1-x0).toFixed(2)+' × '+m(z1-z0).toFixed(2)+'m · 75ØSS stack nearby|20mm cold water · hose bibb for the washer',solid:true});
  box(x0+60,F+600,z0+60,x1-60,F+852,z1-60,C3('B8BEC2'));faucet((x0+x1)/2,z1-30,F+1050,'z-','Laundry faucet|Wall-mounted · 20mm cold water (PPR) · P1-07');
  WATER.push([(x0+x1)/2,F+1050,z1-30,2])}
function vanity(x0,x1,z0,z1,F,wallSide,tb){const wz=wallSide==='z-'?z0:z1,dir=wallSide==='z-'?'z+':'z-';
  box(x0,F,z0,x1,F+820,z1,COL.wood,{top:COL.ctr,info:`Lavatory vanity (${tb})|${m(x1-x0).toFixed(2)}m wide · counter at +0.82`,solid:true});
  const cx=(x0+x1)/2,cz=(z0+z1)/2;box(cx-230,F+700,cz-170,cx+230,F+822,cz+170,COL.porc,{info:`Lavatory (${tb})|Vitreous china basin · drain 50mm with P-trap|To the 100ØSS stack (P1-07)`});
  faucet(cx,wz+(dir==='z+'?70:-70),F+822,dir,`Lavatory faucet (${tb})|Single lever, 20mm cold water (20ØCWR riser) · P1-07|Angle valve and flexible hose under the counter`,false);
  box(cx-300,F+1050,wz+(dir==='z+'?5:-25),cx+300,F+1800,wz+(dir==='z+'?25:-5),C3('B9D3E0'),{info:`Mirror (${tb})`});
  WATER.push([cx,F+550,wz+(dir==='z+'?40:-40),F>5000?3:2]);DRAIN.push([cx,cz,F>5000?3:2])}
function wc(cx,cz,F,back,tb){const d={'x+':[1,0],'z+':[0,1]}[back],tx=cx+d[0]*230,tz=cz+d[1]*230;
  box(tx-(d[0]?90:220),F+380,tz-(d[1]?90:220),tx+(d[0]?90:220),F+800,tz+(d[1]?90:220),COL.porc,{info:`Water closet tank (${tb})|Supply 20mm with angle valve · close-coupled tank`});
  box(cx-190+d[0]*40,F,cz-190+d[1]*40,cx+190+d[0]*40,F+400,cz+190+d[1]*40,COL.porc,{info:`Water closet (${tb})|Floor-mounted · soil pipe 100mm to the 100ØSS stack|Vent 50ØVS through the roof (P1-07)`,solid:true});
  box(cx-170+d[0]*40,F+400,cz-170+d[1]*40,cx+170+d[0]*40,F+430,cz+170+d[1]*40,COL.wallx);
  WATER.push([tx+d[0]*80,F+200,tz+d[1]*80,F>5000?3:2]);DRAIN.push([cx,cz,F>5000?3:2])}
function shower(x0,x1,z0,z1,F,wallSide,tb,wh){const wz=wallSide==='z+'?z1:z0,cx=(x0+x1)/2,s=wallSide==='z+'?-1:1;
  box(x0,F,z0,x1,F+20,z1,C3('C6CED3'),{info:`Shower area (${tb})|${m(x1-x0).toFixed(2)} × ${m(z1-z0).toFixed(2)}m · floor drain 50mm (FD)`});
  cyl(cx,(z0+z1)/2,60,F+20,F+26,C3('8D959B'),{info:`Floor drain (${tb})|50mm FD to the 100ØSS stack`});
  box(cx-25,F+2000,wz+s*0,cx+25,F+2040,wz+s*300,COL.chrome,{info:`Shower arm (${tb})|20mm supply from the water heater`});cyl(cx,wz+s*320,90,F+1960,F+2000,COL.chrome,{info:`Shower head (${tb})|Fed by the electric water heater`});
  box(cx-60,F+1050,wz+s*0,cx+60,F+1170,wz+s*40,COL.chrome,{info:`Shower valve (${tb})|Mixing valve at +1.10 · 20mm cold water (PPR)`});
  box(cx-160,F+1350,wz+s*0,cx+160,F+1800,wz+s*130,COL.porc,{info:`Electric water heater (${tb})|1,500 W · CKT ${wh===1?15:16} · 20AT 2P · 2-3.5mm² + 1-3.5mm² ground (E2-10)`});
  obox([x0,z0+(s>0?z1-z0:0)],[x1,z0+(s>0?z1-z0:0)],12,F,F+2000,COL.glass,COL.glass,{buf:'gl',info:`Shower glass (${tb})|Fixed panel, 2.00m high (assumed)`});
  WATER.push([cx,F+1100,wz+s*20,F>5000?3:2]);DRAIN.push([cx,(z0+z1)/2,F>5000?3:2])}
function tub(x0,x1,z0,z1,F){box(x0,F,z0,x1,F+550,z1,COL.porc,{info:'Bathtub (T&B 2)|'+m(x1-x0).toFixed(2)+' × '+m(z1-z0).toFixed(2)+'m · drain 50mm to the 100ØSS stack',solid:true});
  box(x0+70,F+300,z0+70,x1-70,F+552,z1-70,C3('DCE6EA'));faucet(x1-120,(z0+z1)/2,F+560,'x-','Bathtub faucet (T&B 2)|Wall spout and mixer · 20mm cold water (PPR)',false);
  WATER.push([x1-120,F+560,(z0+z1)/2,3]);DRAIN.push([x1-250,(z0+z1)/2,3])}
function light(x,y,z,c,name,ckt){cyl(x,z,110,y-30,y,COL.lamp,{e:c,n:12,info:`Ceiling light · ${name}|${ckt}|Branch 2-3.5mm² + 1-3.5mm² ground THHN in 20mm PVC|Position approximate (see E1-09)`});lights.push({p:[m(x),m(y-60),m(z)],c,lv:c})}
/* spiral stair garage -> 2nd floor: 13 risers over 300°, centre pole */
function spiral(cx,cz,y0,y1){const N=13,R0=760,span=300/180*Math.PI,a0=Math.PI/3,rise=(y1-y0)/N;
  cyl(cx,cz,60,y0,y1+900,COL.steel,{info:'Spiral stair|Garage to the service area · 13 risers ≈ 204mm · Ø1.50m (A2-02)'});
  for(let k=0;k<N;k++){const a=a0+span*k/N,b=a0+span*(k+1)/N,top=y0+rise*(k+1),pts=[[cx,cz]];for(let j=0;j<=4;j++){const t=a+(b-a)*j/4;pts.push([cx+R0*Math.cos(t),cz+R0*Math.sin(t)])}
    prismP(pts,top-50,top,COL.wood,COL.woodd,{info:`Spiral stair tread ${k+1} of ${N}|Top at ${m(top).toFixed(2)}m`});box(cx+R0*Math.cos(b)-15,top,cz+R0*Math.sin(b)-15,cx+R0*Math.cos(b)+15,top+900,cz+R0*Math.sin(b)+15,COL.rail)}
  const ang=(x,z)=>{let t=Math.atan2(z-cz,x-cx)-a0;t=((t%(2*Math.PI))+2*Math.PI)%(2*Math.PI);return t};
  surfs.push({t:(x,z)=>{const r=Math.hypot(x-cx,z-cz);return r<=R0+40&&ang(x,z)<span},h:(x,z)=>y0+rise*(Math.floor(ang(x,z)/span*N)+1),lv:'s'});
  surfs.push({t:(x,z)=>{const r=Math.hypot(x-cx,z-cz);return r<=R0+40&&ang(x,z)>=span},h:()=>y1,lv:'s'});
  {const pts=[[cx,cz]];for(let j=0;j<=6;j++){const t=a0+span+(2*Math.PI-span)*j/6;pts.push([cx+R0*Math.cos(t),cz+R0*Math.sin(t)])}prismP(pts,y1-100,y1,COL.tile,COL.ceil)}}
/* main stair 2nd -> 3rd: risers 1–7 toward the rear, landing (8), 9–17 toward C (17 × 200) */
function straightStair(y0,y1){const r=200,inf=k=>`Stair to the 3rd floor, step ${k} of 17|17 risers × 200mm · from +2.65 to +6.05 (A2-02)`;
  for(let k=1;k<=7;k++){const z0=7180+(k-1)*245,z1=z0+245,top=y0+r*k;box(50,y0,z0,1000,top,z1,COL.tile,{side:COL.wallx,info:inf(k)});surfBox(50,1000,z0,z1,top,'st')}
  const lt=y0+8*r;box(50,lt-180,8895,1000,lt,9905,COL.tile,{side:COL.wallx,bot:COL.ceil,info:'Stair landing|+4.25 · turn toward the C side'});surfBox(50,1000,8895,9905,lt,'st');
  for(let k=9;k<=17;k++){const x0=1000+(k-9)*235,x1=x0+235,top=y0+r*k;box(x0,top-380,8895,x1,top,9905,COL.tile,{side:COL.wallx,bot:COL.ceil,info:inf(k)});surfBox(x0,x1,8895,9905,top,'st')}
  box(1000,y0,7180,1040,lt+900,8895,COL.rail,{info:'Stair railing|0.90m above the nosings (assumed)'});walls.push({a:[1020,7180],b:[1020,8895],t:40,y0,y1:lt+900});
  box(1000,lt,8870,3115,y1+900,8895,COL.rail);walls.push({a:[1000,8880],b:[2880,8880],t:30,y0:lt,y1:y1+900})}

/* ---------------- WebGL ---------------- */
const VS=`attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;attribute float aE;uniform mat4 uM;varying vec3 vP;varying vec3 vN;varying vec3 vC;varying float vE;
void main(){vP=aP;vN=aN;vC=aC;vE=aE;gl_Position=uM*vec4(aP,1.0);}`;
const FS=`precision mediump float;varying vec3 vP;varying vec3 vN;varying vec3 vC;varying float vE;
uniform vec3 uSun;uniform vec3 uSunC;uniform vec3 uAmb;uniform vec3 uLP[12];uniform vec3 uLC[12];uniform float uOn[4];uniform float uA;uniform float uX;uniform vec3 uEye;uniform vec3 uFog;
void main(){if(uX>0.5){gl_FragColor=vec4(vC*1.1,uA);return;}
 vec3 n=normalize(vN);if(dot(n,uEye-vP)<0.0)n=-n;
 vec3 c=uAmb*(0.75+0.25*n.y)+uSunC*max(dot(n,uSun),0.0);
 for(int i=0;i<12;i++){vec3 d=uLP[i]-vP;float dy=uLP[i].y-vP.y;if(dy>-0.25&&dy<3.3){float r2=dot(d,d);c+=uLC[i]*(0.3+0.7*max(dot(n,normalize(d)),0.0))/(1.0+r2*0.55);}}
 vec3 col=vC*c;float e=0.0;if(vE>0.5&&vE<1.5)e=uOn[0];else if(vE>1.5&&vE<2.5)e=uOn[1];else if(vE>2.5&&vE<3.5)e=uOn[2];else if(vE>3.5)e=uOn[3];
 if(vE>0.5)col=mix(vC*0.35,vec3(1.0,0.95,0.82)*1.4,e);
 float fd=clamp((length(uEye-vP)-25.0)/80.0,0.0,1.0);col=mix(col,uFog,fd);
 gl_FragColor=vec4(col/(1.0+0.12*col),uA);}`;
function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o}
function initGL(){gl=cv.getContext('webgl',{antialias:true})||cv.getContext('experimental-webgl');if(!gl)return false;
  P=gl.createProgram();gl.attachShader(P,sh(gl.VERTEX_SHADER,VS));gl.attachShader(P,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(P);gl.useProgram(P);
  ['uM','uSun','uSunC','uAmb','uLP','uLC','uOn','uA','uX','uEye','uFog'].forEach(k=>P[k]=gl.getUniformLocation(P,k));
  ['aP','aN','aC','aE'].forEach(k=>P[k]=gl.getAttribLocation(P,k));
  for(const k in B){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(B[k]),gl.STATIC_DRAW);GB[k]={b,n:B[k].length/10}}
  gl.enable(gl.DEPTH_TEST);return true}
function drawBuf(k){const g=GB[k];if(!g||!g.n)return;gl.bindBuffer(gl.ARRAY_BUFFER,g.b);const S=40;
  gl.enableVertexAttribArray(P.aP);gl.vertexAttribPointer(P.aP,3,gl.FLOAT,false,S,0);gl.enableVertexAttribArray(P.aN);gl.vertexAttribPointer(P.aN,3,gl.FLOAT,false,S,12);
  gl.enableVertexAttribArray(P.aC);gl.vertexAttribPointer(P.aC,3,gl.FLOAT,false,S,24);gl.enableVertexAttribArray(P.aE);gl.vertexAttribPointer(P.aE,1,gl.FLOAT,false,S,36);gl.drawArrays(gl.TRIANGLES,0,g.n)}
function mat(){const w=cv.width,h=cv.height,f=1/Math.tan(70*Math.PI/360),a=w/h,n=0.05,fr=150;
  const e=[m(cam.x),m(cam.y+EYE),m(cam.z)],cp=Math.cos(cam.pitch),fw=[Math.sin(cam.yaw)*cp,Math.sin(cam.pitch),Math.cos(cam.yaw)*cp];
  let s=[fw[1]*0-fw[2]*1,fw[2]*0-fw[0]*0,fw[0]*1-fw[1]*0];const sl=Math.hypot(...s);s=s.map(x=>x/sl);const u=[s[1]*fw[2]-s[2]*fw[1],s[2]*fw[0]-s[0]*fw[2],s[0]*fw[1]-s[1]*fw[0]];
  const V=[s[0],u[0],-fw[0],0,s[1],u[1],-fw[1],0,s[2],u[2],-fw[2],0,-(s[0]*e[0]+s[1]*e[1]+s[2]*e[2]),-(u[0]*e[0]+u[1]*e[1]+u[2]*e[2]),fw[0]*e[0]+fw[1]*e[1]+fw[2]*e[2],1];
  const Pm=[-f/a,0,0,0,0,f,0,0,0,0,(fr+n)/(n-fr),-1,0,0,2*fr*n/(n-fr),0];/* x mirrored so A stays on the left seen from the road */
  const M=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=Pm[k*4+r]*V[c*4+k];M[c*4+r]=v}return{M,e,fw}}
function frame(t){raf=requestAnimationFrame(frame);const dt=Math.min(0.05,(t-(last||t))/1000);last=t;step(dt);
  const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.round(cv.clientWidth*dpr),h=Math.round(cv.clientHeight*dpr);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
  gl.viewport(0,0,cv.width,cv.height);const N=st.night,sky=N?[0.03,0.04,0.08]:[0.70,0.82,0.93];gl.clearColor(...sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const{M,e}=mat();gl.uniformMatrix4fv(P.uM,false,new Float32Array(M));gl.uniform3fv(P.uEye,e);gl.uniform3fv(P.uFog,sky);
  const sd=[0.35,0.82,-0.45],sl=Math.hypot(...sd);gl.uniform3fv(P.uSun,sd.map(x=>x/sl));gl.uniform3fv(P.uSunC,N?[0,0,0]:[0.62,0.6,0.55]);gl.uniform3fv(P.uAmb,N?[0.05,0.055,0.075]:[0.52,0.54,0.58]);
  const on=[st.on[0],st.on[1],st.on[2],N?1:0].map(x=>x?1:0);gl.uniform1fv(P.uOn,on);
  const near=lights.filter(L=>on[L.c-1]).map(L=>[L,(L.p[0]-e[0])**2+((L.p[1]-e[1])*2.2)**2+(L.p[2]-e[2])**2]).sort((a,b)=>a[1]-b[1]).slice(0,12);
  const lp=new Float32Array(36),lc=new Float32Array(36),k=N?1.0:0.35;near.forEach(([L],i)=>{lp.set(L.p,i*3);lc.set([1.0*k,0.9*k,0.72*k],i*3)});gl.uniform3fv(P.uLP,lp);gl.uniform3fv(P.uLC,lc);
  gl.uniform1f(P.uX,0);gl.uniform1f(P.uA,1);gl.disable(gl.BLEND);gl.depthMask(true);drawBuf('op');
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.uniform1f(P.uA,N?0.35:0.28);drawBuf('gl');
  if(st.pipes){gl.disable(gl.DEPTH_TEST);gl.uniform1f(P.uX,1);gl.uniform1f(P.uA,0.92);drawBuf('xr');gl.enable(gl.DEPTH_TEST)}
  gl.depthMask(true);hudTick(t)}

/* ---------------- movement, floors, collisions ---------------- */
function floorAt(x,z,feet){let best=null,block=false;for(const s of surfs){if(!s.t(x,z))continue;const h=s.h(x,z);if(h<=feet+STEP){if(best===null||h>best)best=h}else if(h<feet+HEAD)block=true}return block?null:best}
function collide(x,z,feet){for(const w of walls){if(w.y1<=feet+300||w.y0>=feet+EYE)continue;const dx=w.b[0]-w.a[0],dz=w.b[1]-w.a[1],L2=dx*dx+dz*dz;let t=((x-w.a[0])*dx+(z-w.a[1])*dz)/L2;t=Math.max(0,Math.min(1,t));
    const px=w.a[0]+dx*t,pz=w.a[1]+dz*t,d=Math.hypot(x-px,z-pz),lim=R+w.t/2;if(d<lim){const k=(lim-d)/(d||1);x+=(x-px)*k;z+=(z-pz)*k}}
  for(const b of solids){if(b.y1<=feet+STEP||b.y0>=feet+EYE)continue;const px=Math.max(b.x0,Math.min(x,b.x1)),pz=Math.max(b.z0,Math.min(z,b.z1)),d=Math.hypot(x-px,z-pz);
    if(d<R){if(d<1e-3){const dl=[x-b.x0,b.x1-x,z-b.z0,b.z1-z],i=dl.indexOf(Math.min(...dl));if(i===0)x=b.x0-R;else if(i===1)x=b.x1+R;else if(i===2)z=b.z0-R;else z=b.z1+R}else{const k=(R-d)/d;x+=(x-px)*k;z+=(z-pz)*k}}}
  return[x,z]}
let fall=0;
function step(dt){let f=0,s=0;if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyD)s+=1;if(keys.KeyA)s-=1;
  if(keys.ArrowLeft)cam.yaw-=1.8*dt;if(keys.ArrowRight)cam.yaw+=1.8*dt;
  if(joy){f+=-joy.dy;s+=joy.dx}const run=keys.ShiftLeft||keys.ShiftRight?2:1,sp=1400*run*dt,l=Math.hypot(f,s);if(l>1){f/=l;s/=l}
  if(f||s){const sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw),dx=(sy*f+cy*s)*sp,dz=(cy*f-sy*s)*sp;
    for(const[ax,az]of[[dx,dz],[dx,0],[0,dz]]){let[nx,nz]=collide(cam.x+ax,cam.z+az,cam.y);const h=floorAt(nx,nz,cam.y);if(h!==null&&h>=cam.y-600){cam.x=nx;cam.z=nz;if(h>cam.y)cam.y=h;break}}}
  const h=floorAt(cam.x,cam.z,cam.y);if(h!==null&&h<cam.y){fall+=9.8*dt;cam.y=Math.max(h,cam.y-fall*1000*dt)}else fall=0}
function setLevel(k){const S={out:[0,-200,-5200,0],0:[300,0,1200,0],2:[0,2650,1000,0],3:[-500,6050,900,0.3]}[k];cam.x=S[0];cam.y=S[1];cam.z=S[2];cam.yaw=S[3];cam.pitch=-0.05;fall=0}
function levelName(){const y=cam.y;return y<-100?'Outside':y<1300?'Garage':y<4300?'2nd floor':'3rd floor'}

/* ---------------- picking ---------------- */
function pickAt(cx,cy){const{e,fw}=mat(),w=cv.clientWidth,h=cv.clientHeight,f=Math.tan(70*Math.PI/360),a=w/h,nx=(cx/w*2-1)*f*a,ny=(1-cy/h*2)*f;
  let s=[-fw[2],0,fw[0]];const sl=Math.hypot(...s);s=s.map(x=>x/sl);const u=[s[1]*fw[2]-s[2]*fw[1],s[2]*fw[0]-s[0]*fw[2],s[0]*fw[1]-s[1]*fw[0]];
  /* screen right = world -s because of the mirror */
  const d=[fw[0]-s[0]*nx+u[0]*ny,fw[1]-s[1]*nx+u[1]*ny,fw[2]-s[2]*nx+u[2]*ny];let best=null,bt=1e9;
  for(const p of picks){if(p.xr&&!st.pipes)continue;
    let t0=0,t1=bt;let ok=true;for(let k=0;k<3;k++){if(Math.abs(d[k])<1e-9){if(e[k]<p.a[k]||e[k]>p.b[k]){ok=false;break}continue}let ta=(p.a[k]-e[k])/d[k],tb=(p.b[k]-e[k])/d[k];if(ta>tb)[ta,tb]=[tb,ta];t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>t1){ok=false;break}}
    if(ok&&t0<bt&&t0<12){const vol=(p.b[0]-p.a[0])*(p.b[1]-p.a[1])*(p.b[2]-p.a[2]);if(t0<bt-0.02||!best||vol<best.vol){bt=t0;best={...p,vol}}}}return best}

/* ---------------- HUD ---------------- */
const CSS=`.wk{position:fixed;inset:0;z-index:1000;background:#000;color:var(--ink);font:14px var(--f-body,system-ui)}
.wk .view{position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block}
.wk .bar{position:absolute;top:0;left:0;right:0;display:flex;flex-wrap:wrap;gap:6px;padding:max(8px,env(safe-area-inset-top)) 10px 8px;align-items:center;background:linear-gradient(var(--paper),color-mix(in srgb,var(--paper) 0%,transparent));pointer-events:none}
.wk .bar>*{pointer-events:auto}
.wk button{min-height:40px;min-width:40px;padding:0 12px;border-radius:20px;border:1px solid var(--line);background:color-mix(in srgb,var(--paper) 90%,transparent);color:var(--ink);font:600 13px var(--f-body,system-ui);cursor:pointer}
.wk button[aria-pressed=true]{background:var(--ink);color:var(--paper)}
.wk .x{margin-left:auto;background:var(--accent);border-color:var(--accent);color:#fff}
.wk .lvl{font:600 12px var(--f-mono,monospace);background:color-mix(in srgb,var(--paper) 90%,transparent);padding:4px 10px;border-radius:12px}
.wk .ch{position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none}
.wk .ch:before,.wk .ch:after{content:"";position:absolute;background:#fff;box-shadow:0 0 2px #000}.wk .ch:before{left:8px;top:0;width:2px;height:18px}.wk .ch:after{top:8px;left:0;height:2px;width:18px}
.wk .lab{position:absolute;left:50%;top:calc(50% + 18px);transform:translateX(-50%);font:600 12px var(--f-mono,monospace);background:color-mix(in srgb,var(--ink) 80%,transparent);color:var(--paper);padding:3px 8px;border-radius:10px;pointer-events:none;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis}
.wk .sheet{position:absolute;left:10px;right:10px;bottom:max(10px,env(safe-area-inset-bottom));max-width:520px;margin:0 auto;background:var(--paper);border:1px solid var(--line);border-top:3px solid var(--accent);border-radius:10px;padding:12px 48px 12px 14px;font-size:13.5px;line-height:1.5}
.wk .sheet b{display:block;font-size:15px;margin-bottom:4px}.wk .sheet ul{margin:0;padding-left:16px}.wk .sheet .cl{position:absolute;top:6px;right:6px;border-radius:20px}
.wk .joy{position:absolute;left:18px;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 10px);width:120px;height:120px;border-radius:60px;border:2px solid color-mix(in srgb,var(--paper) 70%,transparent);background:color-mix(in srgb,var(--ink) 25%,transparent);touch-action:none}
.wk .joy i{position:absolute;left:40px;top:40px;width:40px;height:40px;border-radius:20px;background:color-mix(in srgb,var(--paper) 85%,transparent)}
.wk .map{position:absolute;right:10px;bottom:calc(max(10px,env(safe-area-inset-bottom)) + 26px);width:112px;height:146px;border-radius:8px;border:1px solid var(--line);background:color-mix(in srgb,var(--paper) 88%,transparent);pointer-events:none}
.wk .grp{display:inline-flex;align-items:center;gap:4px;font:600 12px var(--f-body,system-ui);background:color-mix(in srgb,var(--paper) 90%,transparent);border-radius:22px;padding:0 0 0 10px}
.wk .help{position:absolute;right:10px;bottom:max(6px,env(safe-area-inset-bottom));font:12px var(--f-body,system-ui);color:#fff;text-shadow:0 1px 2px #000;max-width:46vw;text-align:right;pointer-events:none}
.wk .nogl{position:absolute;inset:0;display:grid;place-items:center;padding:24px;text-align:center;color:#fff}
@media (hover:none){.wk .help .kb{display:none}}@media (hover:hover){.wk .joy{display:none}}`;
function ui(){const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
  ov=document.createElement('div');ov.className='wk';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','First-person walkthrough');
  ov.innerHTML=`<canvas class="view" aria-label="First-person view of the house"></canvas><div class="ch"></div><div class="lab" hidden></div>
  <div class="bar"><span class="grp">Go <button data-l="out" aria-label="Go outside">Out</button><button data-l="0" aria-label="Go to the garage">G</button><button data-l="2" aria-label="Go to the 2nd floor">2</button><button data-l="3" aria-label="Go to the 3rd floor">3</button></span>
  <button data-t="night" aria-pressed="false">Night</button><button data-t="pipes" aria-pressed="false">Pipes</button><span class="grp">Lights <button data-c="1" aria-pressed="true" aria-label="Garage lights">G</button><button data-c="2" aria-pressed="true" aria-label="2nd floor lights">2</button><button data-c="3" aria-pressed="true" aria-label="3rd floor lights">3</button></span><button class="x" aria-label="Close the walkthrough">✕</button><span class="lvl"></span></div>
  <canvas class="map" width="260" height="340"></canvas><div class="joy"><i></i></div>
  <div class="help"><span class="kb">W A S D or arrows to walk · Shift to run · drag to look · </span>tap anything for details</div><div class="sheet" hidden></div>`;
  document.body.appendChild(ov);cv=ov.querySelector('.view');hud.lab=ov.querySelector('.lab');hud.sheet=ov.querySelector('.sheet');hud.lvl=ov.querySelector('.lvl');hud.map=ov.querySelector('.map').getContext('2d');
  ov.querySelector('.x').onclick=close;ov.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>setLevel(b.dataset.l));
  ov.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{st[b.dataset.t]=!st[b.dataset.t];b.setAttribute('aria-pressed',st[b.dataset.t])});
  ov.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const i=+b.dataset.c-1;st.on[i]=st.on[i]?0:1;b.setAttribute('aria-pressed',!!st.on[i])});
  /* look + tap */
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);look={id:e.pointerId,x:e.clientX,y:e.clientY};downAt=[e.clientX,e.clientY,performance.now()]});
  cv.addEventListener('pointermove',e=>{if(!look||look.id!==e.pointerId)return;cam.yaw+=(e.clientX-look.x)*0.0045;cam.pitch=Math.max(-1.3,Math.min(1.3,cam.pitch-(e.clientY-look.y)*0.0045));look.x=e.clientX;look.y=e.clientY});
  const up=e=>{if(look&&look.id===e.pointerId){if(downAt&&Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])<8&&performance.now()-downAt[2]<500){const r=cv.getBoundingClientRect(),p=pickAt(e.clientX-r.left,e.clientY-r.top);showInfo(p)}look=null}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',()=>look=null);
  const jy=ov.querySelector('.joy'),knob=jy.querySelector('i');
  jy.addEventListener('pointerdown',e=>{jy.setPointerCapture(e.pointerId);joy={id:e.pointerId,dx:0,dy:0};jmove(e)});
  const jmove=e=>{if(!joy||joy.id!==e.pointerId)return;const r=jy.getBoundingClientRect();let dx=(e.clientX-r.left-60)/45,dy=(e.clientY-r.top-60)/45;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}joy.dx=dx;joy.dy=dy;knob.style.transform=`translate(${dx*40}px,${dy*40}px)`};
  jy.addEventListener('pointermove',jmove);const jend=()=>{joy=null;knob.style.transform=''};jy.addEventListener('pointerup',jend);jy.addEventListener('pointercancel',jend);
  hud.kd=e=>{if(e.key==='Escape'){close();return}keys[e.code]=true;if(/Arrow|Space/.test(e.code))e.preventDefault()};hud.ku=e=>{keys[e.code]=false};
  window.addEventListener('keydown',hud.kd);window.addEventListener('keyup',hud.ku)}
function showInfo(p){if(!p){hud.sheet.hidden=true;return}const L=p.info.split('|');hud.sheet.innerHTML=`<b>${L[0]}</b><ul>${L.slice(1).map(x=>`<li>${x}</li>`).join('')}</ul><button class="cl" aria-label="Close details">✕</button>`;hud.sheet.hidden=false;hud.sheet.querySelector('.cl').onclick=()=>hud.sheet.hidden=true}
let lastPick=0;
function hudTick(t){if(t-lastPick>200){lastPick=t;const p=pickAt(cv.clientWidth/2,cv.clientHeight/2);hud.lab.hidden=!p;if(p)hud.lab.textContent=p.info.split('|')[0]+(p.info.split('|')[1]?' · '+p.info.split('|')[1]:'');
    hud.lvl.textContent=`${levelName()} · floor ${(cam.y/1000).toFixed(2)}m`;drawMap()}}
function drawMap(){const c=hud.map,W=260,H=340,lv=cam.y<1300?0:cam.y<4300?2:3,sc=0.021,ox=W/2,oz=H-40,X=x=>ox+x*sc,Z=z=>oz-z*sc;c.clearRect(0,0,W,H);
  c.lineWidth=3;c.strokeStyle=getComputedStyle(ov).getPropertyValue('--ink')||'#222';mapW.filter(w=>w.lv===(cam.y<-100?0:lv)).forEach(w=>{c.beginPath();c.moveTo(X(w.a[0]),Z(w.a[1]));c.lineTo(X(w.b[0]),Z(w.b[1]));c.stroke()});
  c.fillStyle='#C24E22';c.save();c.translate(X(cam.x),Z(cam.z));c.rotate(cam.yaw);c.beginPath();c.moveTo(0,-14);c.lineTo(8,8);c.lineTo(-8,8);c.closePath();c.fill();c.restore()}
function close(){cancelAnimationFrame(raf);raf=0;window.removeEventListener('keydown',hud.kd);window.removeEventListener('keyup',hud.ku);ov.remove();ov=null;document.body.style.overflow='';for(const k in keys)keys[k]=false}
window.DRBWalk={open(data){D=data;if(!built){build();built=true}ui();document.body.style.overflow='hidden';
  try{if(!initGL()){ov.insertAdjacentHTML('beforeend','<div class="nogl">This browser or device cannot show 3D (WebGL is off).</div>');return}}catch(err){ov.insertAdjacentHTML('beforeend',`<div class="nogl">3D could not start: ${String(err.message||err).slice(0,120)}</div>`);return}
  setLevel('out');last=0;raf=requestAnimationFrame(frame)},
  _debug:()=>({keys,cam,picks:picks.length,tris:Object.fromEntries(Object.entries(B).map(([k,v])=>[k,v.length/30])),lights:lights.length,surfs:surfs.length,walls:walls.length,floorAt,pickAt,setLevel,st,step})};
})();
