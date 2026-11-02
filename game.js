'use strict';
/* =====================  SABİTLER & VERİ  ===================== */
const SAVE_KEY='mobiwar_save_v29', OLD_KEY='mobiwar_save_v28', SAVE_BACKUP='mobiwar_save_backup';
let storageOk=true,_lastBk=0;
const NCONT=24, MIN_PER_CONT=2, MAX_PER_CONT=4, CART_CAP=5000, OFFLINE_MAX=7*86400;
const BOT_LEVELS={kolay:{label:'Kolay',skill:.65,gold:.6,food:.6,attack:.65,def:.75,loss:1.2,build:.65,loot:.8},orta:{label:'Orta',skill:1,gold:.6,food:.6,attack:1,def:1,loss:1,build:1,loot:1},zor:{label:'Zor',skill:1.15,gold:.75,food:.75,attack:1.12,def:1.12,loss:.9,build:1.1,loot:1.05},cokzor:{label:'Çok Zor',skill:1.3,gold:.85,food:.85,attack:1.25,def:1.25,loss:.8,build:1.2,loot:1.1},hard:{label:'Hard',skill:1.5,gold:1,food:1,attack:1.4,def:1.4,loss:.7,build:1.35,loot:1.2}};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const fmt=n=>{n=Math.floor(n||0);if(n>=1e6)return(n/1e6).toFixed(2)+'M';if(n>=1e5)return Math.floor(n/1e3)+'K';return n.toLocaleString('tr-TR');};
function formatTime(s){s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;const p=n=>n<10?'0'+n:''+n;let a=[];if(h>0)a.push(p(h)+'sa');if(m>0||h>0)a.push(p(m)+'dk');a.push(p(x)+'sn');return a.join(' ');}

const BUILD={
 ciftlik:{name:"Çiftlik",icon:"🌾",max:40,g:50,f:80,t:30,req:{},desc:"Şehrin yemeğini üretir. Seviye arttıkça saatlik yemek üretimi yükselir. İttifak Seviye 2 ile üretim +%15 artar.",fx:l=>`+${fmt(foodRate(l))} yemek/sa`},
 maden:{name:"Maden",icon:"⛏️",max:40,g:40,f:60,t:25,req:{},desc:"Şehrin altınını üretir. Seviye arttıkça saatlik altın üretimi yükselir. İttifak Seviye 2 ile üretim +%15 artar.",fx:l=>`+${fmt(goldRate(l))} altın/sa`},
 kale:{name:"Kale",icon:"🏰",max:10,g:300,f:250,t:120,req:{},desc:"Şehrin merkez binasıdır. Yapı sınırını belirler (seviye × 10) ve her seviye tüm şehir savunmasına +%4 güç kazandırır.",fx:l=>`Yapı sınırı ${l*10} • Şehir savunması +%${l*4}`},
 kisla:{name:"Kışla",icon:"⛺",max:20,g:100,f:100,t:45,req:{kale:1},desc:"Asker eğitim merkezidir. Birlik eğitim sürelerini kısaltır ve her 4 seviyede +1 ek sefer hakkı sağlar.",fx:l=>`Eğitim süresi -%${Math.min(70,Math.round(3.5*l))} • Ek sefer +${Math.floor(l/4)}`},
 akademi:{name:"Akademi",icon:"📜",max:20,g:150,f:120,t:60,req:{kale:1},desc:"Araştırma binası. Tüm şehirler için ortaktır. Teknoloji araştırmalarını açar ve araştırma sürelerini kısaltır.",fx:l=>`Araştırma süresi -%${Math.min(80,4*l)}`},
 mimarhane:{name:"Mimarhane",icon:"📐",max:20,g:200,f:150,t:90,req:{kale:2},desc:"İnşaat mühendisliği. Tüm bina inşaat ve yükseltme sürelerini kısaltır.",fx:l=>`İnşaat süresi -%${Math.min(80,4*l)}`},
 magara:{name:"Mağara",icon:"⛰️",max:20,g:120,f:100,t:40,req:{kale:1},desc:"Kaynak sığınağı. Baskınlarda belirli miktarda altın ve yemeği yağmadan korur. Yurt Tutma araştırması korumayı artırır.",fx:l=>`Korunan: ${fmt(400*l)}💰 + ${fmt(400*l)}🍗`},
 mabet:{name:"Mabet",icon:"⛩️",max:20,g:250,f:200,t:100,req:{kale:3},desc:"Kahraman tapınağı. Tüm birliklerinin gücünü artırır (en fazla %40). Kahraman odağında seçilen yön (saldırı/savunma) tam bonus, diğeri yarı bonus alır.",fx:l=>`Kahraman: saldırı & savunma +%${Math.min(40,2*l)}`},
 gecit:{name:"Geçit",icon:"🌉",max:20,g:500,f:400,t:180,req:{kale:4},desc:"Ulaşım yapısı. Saldırı, casusluk ve nakliye sefer sürelerini kısaltır (en fazla %60).",fx:l=>`Sefer süresi -%${Math.min(60,3*l)}`}
};
const TROOPS={
 "Baltacı":{icon:"🪓",cls:"inf",atk:52,def:38,g:200,f:450,sup:1,t:8,req:{kisla:1,res:{"Demircilik":1}},details:"Hat kıran ağır piyade. Süvarilere karşı etkilidir; menzilli birlikler karşısında savunması sınırlıdır. Demircilik ile saldırı gücü artar."},
 "Nişancı":{icon:"🏹",cls:"rng",atk:82,def:22,g:450,f:650,sup:1,t:10,req:{kisla:3,res:{"Okçuluk":1}},details:"Uzaktan saldıran birlik. Piyadeleri baskılar; hızlı süvariler ve ağır yaratıklar karşısında kırılgandır. Okçuluk ile saldırı gücü artar."},
 "Akıncı":{icon:"🐎",cls:"cav",atk:145,def:58,g:1200,f:2400,sup:2,t:20,req:{kisla:4,res:{"Demircilik":1}},details:"Hızlı süvari. Okçu birliklerini avlamakta etkilidir; ağır piyade ve savunma yapıları karşısında zorlanır. Demircilik ile saldırı gücü artar."},
 "Tulpar":{icon:"🦄",cls:"cav",atk:250,def:125,g:4000,f:3200,sup:3,t:40,req:{kisla:7,res:{"Okçuluk":5}},details:"Seçkin süvari. Okçu hatlarını parçalar ve yüksek savunmasıyla uzun süre dayanır; ağır piyade ve kuşatma birliklerine karşı verimi düşer. Okçuluk araştırması saldırı gücünü artırır."},
 "Ejderha":{icon:"🐉",cls:"mon",magic:true,atk:720,def:420,g:45000,f:20000,sup:8,t:180,req:{kisla:10,res:{"Efsunculuk":12}},details:"Efsanevi yaratık. Büyü ve fiziksel savunması güçlüdür; ancak yüksek maliyeti nedeniyle kaybı ağırdır. Efsunculuk ile saldırı gücü artar."},
 "Mancınık":{icon:"🎯",cls:"sge",atk:330,def:18,g:12000,f:6000,sup:5,t:60,req:{kisla:8,res:{"Zift Ateşi":5}},details:"Kuşatma makinesi. Savunma yapılarını parçalamada üstündür; hareketli birlikler karşısında savunmasızdır. Zift Ateşi ile saldırı gücü artar."},
 "Tepegöz":{icon:"👹",cls:"mon",atk:420,def:300,g:18000,f:24000,sup:6,t:90,req:{kisla:8,res:{"İçgüdü":6}},details:"Devasa yaratık. Yüksek dayanıklılığıyla ön safta görev yapar; çevik süvariler karşısında verimi düşer. İçgüdü araştırması savaş kayıplarını azaltır."},
 "Büyücü":{icon:"🧙",cls:"mag",magic:true,atk:300,def:80,g:2000,f:2000,sup:4,t:50,req:{kisla:5,res:{"Efsunculuk":4}},details:"Büyü saldırısı kullanan birlik. Büyülü savunmaları aşmada etkilidir; fiziksel saldırılara karşı kırılgandır. Efsunculuk ile saldırı gücü artar."},
 "Casus Karga":{icon:"🦅",cls:"spy",atk:0,def:5,g:100,f:200,sup:0,t:10,req:{kisla:3,res:{"Casusluk":1}},details:"Casusluk için kullanılan özel birlik. Sefer başına bir Karga gönderilir; Karga hedefe ulaşmadan casusluk raporu alınamaz. Casusluk seviyesi rapor ayrıntısını belirler."},
 "Kundakçı":{icon:"🔥",cls:"sge",atk:190,def:12,g:1600,f:1600,sup:4,t:25,req:{kisla:6,res:{"Zift Ateşi":3}},details:"Ateşli kuşatma birliği. Savunma yapılarını yıpratır; hareketli ordulara karşı zayıftır. Zift Ateşi araştırması saldırı gücünü artırır."},
 "Kağnı":{icon:"🛒",cls:"cart",nonCombat:true,atk:0,def:15,g:1000,f:1000,sup:1,t:12,req:{kisla:3,res:{"Haritacılık":1}},details:"Savaşmaz. 5.000 birim ganimet ve kaynak taşır. Haritacılık sefer sürelerini azaltır."},
 "Kaos":{icon:"⚡",cls:"mon",magic:true,atk:1000,def:650,g:50000,f:50000,sup:12,t:400,req:{kisla:15,res:{"Efsunculuk":15}},details:"Kaosun cisimleşmiş hali. Çok yüksek saldırı ve savunmaya sahiptir; en güçlü savunmaları bile zorlar. Efsunculuk ile saldırı gücü artar."}
};
const CAP={"Kağnı":CART_CAP};
const unitCap=n=>CAP[n]||0;
const CLS_NAME={inf:"Piyade",rng:"Okçu",cav:"Süvari",sge:"Kuşatma",mon:"Yaratık",mag:"Büyücü",spy:"Casus",cart:"Taşıyıcı"};
const CLS_BEATS={cav:'rng',rng:'inf',inf:'cav'};
const isMagicUnit=n=>!!(TROOPS[n]&&TROOPS[n].magic);
const DEF={
 "Sur":{icon:"🧱",def:110,g:1200,f:1200,t:25,kale:1,res:{},max:20,level:true,details:"Şehrin temel savunma hattıdır. Seviye yükseldikçe savunma gücü doğrusal olarak artar. Üst sınır 20."},
 "Tılsım Kalkanı":{icon:"🔮",def:180,g:4000,f:4000,t:35,kale:0,res:{"Efsunculuk":8},sur:10,max:20,level:true,magic:true,details:"Büyü saldırılarına karşı özel koruma sağlar. Seviye yükseldikçe büyücü, Ejderha ve Kaos gibi büyülü birliklere karşı savunma katkısı artar. Üst sınır 20."},
 "Okçu Kulesi":{icon:"🏹",def:90,g:300,f:450,t:15,kale:0,sur:1,res:{},details:"Menzilli savunma. Piyade birliklerine karşı etkilidir."},
 "Kapan":{icon:"🪤",def:42,g:300,f:50,t:6,kale:0,sur:1,res:{},details:"Saldıran ordunun öncü birliklerini yıpratan gizli tuzak."},
 "Kaynar Kazan":{icon:"♨️",def:130,g:2400,f:3200,t:20,kale:0,sur:3,res:{"Zift Ateşi":3},details:"Yoğun savunma hattı. Piyade ve süvari yığınlarına karşı etkilidir."},
 "Taşatar":{icon:"☄️",def:190,g:1000,f:8000,t:30,kale:5,sur:5,res:{"Zift Ateşi":6},details:"Ağır kuşatma savunması. Yoğun ordulara karşı yüksek yapı hasarı verir."},
 "Nöbetçi":{icon:"💂",def:105,g:2400,f:2000,t:8,kale:0,sur:4,res:{"Demircilik":4,"Zırh":3},details:"Ağır nöbetçi birliği. Fiziksel saldırılara karşı güçlü savunma sağlar."},
 "Zemberek":{icon:"⚙️",def:260,g:20000,f:16000,t:18,kale:6,sur:6,res:{"Okçuluk":10},details:"Uzak menzilli mekanik savunma. Kalabalık süvari ve yaratık birliklerini hedefler."}
};
const RES={
  "Okçuluk":{icon:"🏹",name:"Okçuluk",k:"atk",pct:10,targets:["Nişancı","Tulpar"],defTargets:["Zemberek"],ak:1,max:10,desc:"Nişancı ve Tulpar saldırı gücünü artırır. Zemberek savunmasının uzmanlık araştırmasıdır."},
  "Demircilik":{icon:"⚒️",name:"Demircilik",k:"atk",pct:10,targets:["Baltacı","Akıncı"],defTargets:["Nöbetçi"],ak:1,max:10,desc:"Baltacı ve Akıncı saldırı gücünü artırır. Nöbetçi savunmasının uzmanlık araştırmasıdır."},
  "Haritacılık":{icon:"🗺️",name:"Haritacılık",k:"speed",pct:5,ak:2,max:15,desc:"Nakliye, saldırı ve Casus Karga seferlerini hızlandırır. Kağnı kullanımının temel araştırmasıdır."},
  "Efsunculuk":{icon:"🔮",name:"Efsunculuk",k:"atk",pct:12,targets:["Büyücü","Ejderha","Kaos"],ak:5,max:15,desc:"Büyücü, Ejderha ve Kaos saldırı gücünü artırır. Tılsım Kalkanı'nın temel araştırmasıdır."},
  "Casusluk":{icon:"🦅",name:"Casusluk",k:"spy",pct:0,ak:2,max:15,desc:"Casusluk raporlarını ayrıntılandırır ve başarı şansını artırır."},
  "Zırh":{icon:"🛡️",name:"Zırh",k:"def",pct:8,ak:3,max:10,desc:"Tüm savaş birliklerinin savunma gücünü artırır."},
  "Zift Ateşi":{icon:"🔥",name:"Zift Ateşi",k:"atk",pct:12,targets:["Kundakçı","Mancınık"],defTargets:["Kaynar Kazan","Taşatar"],ak:4,max:10,desc:"Kundakçı ve Mancınık kuşatma gücünü artırır. Kaynar Kazan ve Taşatar uzmanlığıdır."},
  "Tahkimat":{icon:"🧱",name:"Tahkimat",k:"struct",pct:10,ak:3,max:10,desc:"Tüm savunma yapılarının temel savunma gücünü artırır."},
  "Yurt Tutma":{icon:"⛺",name:"Yurt Tutma",k:"cave",pct:15,ak:4,max:15,desc:"Mağara korumasını artırır. Her 3 seviyede 1 yeni şehir kurma hakkı verir. Seviye sınırı 15; en fazla 5 yeni şehir (toplam 6 şehir)."},
  "Gece Görüş":{icon:"🌙",name:"Gece Görüş",k:"night",pct:3,ak:3,max:5,desc:"Gece saldırılarındaki %15 saldırı cezasını azaltır (5. seviyede tamamen kaldırır)."},
  "İçgüdü":{icon:"👁️",name:"İçgüdü",k:"loss",pct:5,ak:2,max:10,desc:"Savaşlarda verilen kayıpları azaltır. Tepegöz için üretim koşulunu karşılar."},
  "Tılsım":{icon:"🧿",name:"Tılsım",k:"tilsim",pct:10,ak:4,max:10,desc:"Tılsım Kalkanı'nın savunma katsayısını artırır."}
};
function resEffect(n,l){const R=RES[n];switch(R.k){
 case'atk':return`+%${R.pct*l} saldırı`;case'speed':return`-%${5*l} nakliye, saldırı ve Casus Karga süresi`;
 case'spy':return`Casusluk seviyesi ${l}`;case'def':return`+%${8*l} savunma`;case'struct':return`+%${10*l} yapı gücü`;
 case'cave':return`+%${15*l} Mağara koruması • ${Math.floor(l/3)} yeni şehir hakkı`;case'night':return`Gece cezası %${Math.max(0,15-3*l)}`;
 case'loss':return`-%${5*l} kayıp`;case'tilsim':return`+%${10*l} Tılsım Kalkanı`;}return'';}
const PERS={builder:"Tüccar",warrior:"Savaşçı",turtle:"Savunmacı"};
const QUESTS=[
 {id:'q1',t:"Çiftliği Seviye 3 yap",c:()=>bl('ciftlik')>=3,r:[300,300]},
 {id:'q2',t:"Madeni Seviye 3 yap",c:()=>bl('maden')>=3,r:[300,300]},
 {id:'q3',t:"Kaleyi Seviye 2 yap",c:()=>bl('kale')>=2,r:[500,500]},
 {id:'q4',t:"Kışla kur",c:()=>bl('kisla')>=1,r:[400,400]},
 {id:'q5',t:"Akademi kur",c:()=>bl('akademi')>=1,r:[400,400]},
 {id:'q6',t:"İlk araştırmanı tamamla",c:()=>Object.values(g.research).some(x=>x>=1),r:[600,600]},
 {id:'q7',t:"20 asker eğit",c:()=>g.stats.trained>=20,r:[800,800]},
 {id:'q8',t:"5 Sur inşa et",c:()=>(g.myDefenses["Sur"]||0)>=5,r:[600,600]},
 {id:'q9',t:"İlk casusluğunu yap",c:()=>g.stats.spies>=1,r:[500,500]},
 {id:'q10',t:"Bir ittifağa katıl veya kur",c:()=>!!g.alliance.name,r:[700,700]},
 {id:'q11',t:"İlk saldırı zaferini kazan",c:()=>g.stats.attackWins>=1,r:[1500,1500]},
 {id:'q12',t:"Kaleyi Seviye 5 yap",c:()=>bl('kale')>=5,r:[3000,3000]},
 {id:'q13',t:"3 saldırıyı püskürt",c:()=>g.stats.defWins>=3,r:[2500,2500]},
 {id:'q14',t:"5 saldırı zaferi kazan",c:()=>g.stats.attackWins>=5,r:[5000,5000]},
 {id:'q15',t:"Kışlayı Seviye 10 yap",c:()=>bl('kisla')>=10,r:[8000,8000]},
 {id:'q16',t:"100 puana ulaş",c:()=>pScore()>=100,r:[10000,10000]},
 {id:'q17',t:'500 puana ulaş',c:()=>pScore()>=500,r:[15000,15000]},
 {id:'q18',t:'1.000 puana ulaş',c:()=>pScore()>=1000,r:[25000,25000]},
 {id:'q19',t:'10 Kağnı üret',c:()=>g.myTroops['Kağnı']>=10,r:[5000,5000]},
 {id:'q20',t:'İlk pazar ticaretini yap',c:()=>g.marketTrades>=1,r:[3000,3000]},
 {id:'q21',t:'İttifak düşmanına karşı 1 zafer kazan',c:()=>(g.stats.enemyAllianceWins||0)>=1,r:[10000,10000]},
 {id:'q22',t:'3 farklı şehre sahip ol',c:()=>g.cities.length>=3,r:[8000,8000]},
 {id:'q23',t:'10 saldırı zaferi kazan',c:()=>g.stats.attackWins>=10,r:[20000,20000]},
 {id:'q24',t:'25 saldırıyı püskürt',c:()=>g.stats.defWins>=25,r:[25000,25000]},
 {id:'q25',t:'5.000 puana ulaş',c:()=>pScore()>=5000,r:[50000,50000]}
];

const DAILY_QUESTS=[
 {id:'d1',t:"2 casusluk yap",c:()=>(g.daily.spies||0)>=2,r:[800,800]},
 {id:'d2',t:"1 saldırı zaferi kazan",c:()=>(g.daily.attackWins||0)>=1,r:[1200,1200]},
 {id:'d3',t:"5000 kaynak üret (altın+yemek)",c:()=>(g.daily.produced||0)>=5000,r:[1000,1000]},
 {id:'d4',t:"1 ittifak bağışı yap",c:()=>(g.daily.donated||0)>=1,r:[600,600]},
 {id:'d5',t:"3 birim eğit",c:()=>(g.daily.trained||0)>=3,r:[700,700]}
];

/* =====================  DURUM  ===================== */
let g=null, dirty=false, lastTick=Date.now(), tickN=0;
const ui={tab:'komuta',komutaTab:'ozet',durumTab:'ozet',sehirTab:'yapilar',cont:1,mapSort:'score',open:{binalar:true,savunma:false,kisla:false,akademi:false},amt:{},target:null,mtab:'casus',attNames:[],allyName:'',touchAt:0};

function newGame(){
 const now=Math.floor(Date.now()/1000);
 g={v:30,createdAt:now,simTime:now,lastSave:Date.now(),gold:10000,food:10000,spent:0,
  buildings:{ciftlik:1,maden:1,kale:1,kisla:0,akademi:0,mimarhane:0,magara:0,mabet:0,gecit:0},
  research:{},myTroops:{},myDefenses:{},reports:[],unread:false,scoreLoss:0,rankPrevMap:{},rankStamp:now,botDifficulty:'orta',market:{rate:1.25},allianceWars:[],audio:true,audioMode:'full',notify:true,marketTrades:0,playerPos:null,hero:{name:'Kahraman',trait:'atk'},allyChat:[],weekly:{week:0,attackWins:0,spies:0,claimed:{}},
  events:{build:null,research:null,troop:null},
  alliance:{name:null,isLeader:false,goldDonated:0,foodDonated:0},alliances:[],pendingJoin:null,
  tasks:{building:null,buildQueue:[],research:null,queue:[]},marches:[],incomingAttacks:[],nextId:1,
  stats:{trained:0,spies:0,attackWins:0,attackLosses:0,defWins:0,defLosses:0},quests:{},botAcc:0,bots:[],
  daily:{day:0,spies:0,attackWins:0,produced:0,donated:0,trained:0,claimed:{}},
  presets:[]};
 genBots();
 g.sharedAcademyLevel=0;g.sharedAcademyTask=null;g.cities=[{id:1,name:'Başkent',continent:g.playerPos.continent,row:g.playerPos.row}];g.activeCityId=1;
}
function randomPos(used){
 let x,y,k,tries=0;do{x=rnd(1,100);y=rnd(1,100);k=x+':'+y;tries++;}while(used.has(k)&&tries<500);used.add(k);return{x,y};
}
function genBots(){
 const fn=["Ahmet","Mehmet","Mustafa","Ali","Huseyin","Hasan","Ibrahim","Can","Emre","Burak","Kaan","Efe","Arda","Kerem","Mert","Berk","Deniz","Baris","Tolga","Ozan","Demir","Kaya","Sahin","Celik","Yildiz","Aydin","Arslan","Dogan","Kilic","Aslan"];
 const ln=["Ozturk","Yilmaz","Demir","Kaya","Sahin","Celik","Yildiz","Aydin","Arslan","Dogan","Kilic","Aslan","Koc","Kurt","Ozkan","Simsek","Polat","Ozdemir","Erdogan","Tekin"];
 const an=["Kurtlar","Osmanli","Anadolu","Turan","Alp","Sancak","Kilic","Bozkurt"];
 const now=g.simTime, playerCont=rnd(1,NCONT), usedByCont=Array.from({length:NCONT+1},()=>new Set());
 g.playerPos={continent:playerCont,row:rnd(1,10)};
 usedByCont[playerCont].add(String(g.playerPos.row)); // oyuncu konumu dolu
 g.alliances=an.map(n=>({name:n,leader:null,donated:0}));g.bots=[];
 let id=1;
 for(let c=1;c<=NCONT;c++){
  const total=rnd(MIN_PER_CONT,MAX_PER_CONT), botCount=c===playerCont?total-1:total;
  for(let j=0;j<botCount;j++){
   const ally=(id%3===0)?an[id%an.length]:null, rowPool=[1,2,3,4,5,6,7,8,9,10].filter(r=>![...usedByCont[c]].includes(String(r))); const row=rowPool.length?rowPool[rnd(0,rowPool.length-1)]:rnd(1,10); usedByCont[c].add(String(row));
   const b={id,name:fn[id%fn.length]+"_"+ln[(id*7)%ln.length]+id,continent:c,row,x:row,y:row,
    pers:['builder','warrior','turtle','warrior','builder'][id%5],skill:0.8+Math.random()*0.5,
    gold:1500,food:1500,spent:0,alliance:ally,
    lv:{ciftlik:1+rnd(0,2),maden:1+rnd(0,2),kale:1,kisla:rnd(0,1),akademi:0,magara:rnd(0,1)},
    tech:0,troops:{"Baltacı":rnd(4,12)},defs:{"Sur":rnd(2,5)},busyUntil:0,nextAtk:now+rnd(1800,5400),difficulty:g.botDifficulty,lootGold:0,lootFood:0,scoreLoss:0,warWagons:0,
    research:{},construction:null,buildQueue:[]};
   g.bots.push(b);const a=g.alliances.find(x=>x.name===ally);if(a&&!a.leader)a.leader=b.name;id++;
  }
 }
 ui.cont=playerCont;
}
function fixSave(){
 g.v=30;if(g.createdAt==null)g.createdAt=0;g.simTime=g.simTime||Math.floor(Date.now()/1000);g.lastSave=g.lastSave||Date.now();
 g.buildings=Object.assign({ciftlik:1,maden:1,kale:1,kisla:0,akademi:0,mimarhane:0,magara:0,mabet:0,gecit:0},g.buildings||{});
 g.research=g.research||{};g.myTroops=g.myTroops||{};g.myDefenses=g.myDefenses||{};g.reports=g.reports||[];
 g.events=Object.assign({build:null,research:null,troop:null},g.events||{});
 g.alliance=Object.assign({name:null,isLeader:false,goldDonated:0,foodDonated:0},g.alliance||{});
 g.alliances=g.alliances||[];
 g.tasks=Object.assign({building:null,buildQueue:[],research:null,queue:[]},g.tasks||{});
 g.tasks.buildQueue=g.tasks.buildQueue||[];g.tasks.queue=g.tasks.queue||[];g.marches=g.marches||[];g.incomingAttacks=g.incomingAttacks||[];
 g.scoreLoss=g.scoreLoss||0;g.rankPrevMap=g.rankPrevMap||{};g.rankStamp=g.rankStamp||g.simTime;g.botDifficulty=g.botDifficulty||'orta';g.market=Object.assign({rate:1.25},g.market||{});g.allianceWars=g.allianceWars||[];g.audio=g.audio!==false;g.notify=g.notify!==false;g.marketTrades=g.marketTrades||0;g.playerPos=g.playerPos||null;g.sharedAcademyLevel=(g.sharedAcademyLevel!=null?g.sharedAcademyLevel:(g.buildings.akademi||0));g.sharedAcademyTask=g.sharedAcademyTask||null;
 if(g.vassal){delete g.vassal;}
 for(const b of (g.bots||[])){b.difficulty=b.difficulty||g.botDifficulty;b.lootGold=b.lootGold||0;b.lootFood=b.lootFood||0;b.scoreLoss=b.scoreLoss||0;b.warWagons=b.warWagons||0;b.row=b.row||((b.y||rnd(1,10)-1)%10+1);b.x=b.row;b.y=b.row;b.buildQueue=b.buildQueue||[];b.research=b.research||{};}
 g.stats=Object.assign({trained:0,spies:0,attackWins:0,attackLosses:0,defWins:0,defLosses:0,enemyAllianceWins:0},g.stats||{});
 g.quests=g.quests||{};g.botAcc=g.botAcc||0;g.nextId=g.nextId||1;
 g.daily=Object.assign({day:0,spies:0,attackWins:0,produced:0,donated:0,trained:0,claimed:{}},g.daily||{});
 g.presets=g.presets||[];
 g.audioMode=g.audioMode||(g.audio===false?'off':'full');
 g.hero=Object.assign({name:'Kahraman',trait:'atk'},g.hero||{});
 g.allyChat=g.allyChat||[];
 g.weekly=Object.assign({week:0,attackWins:0,spies:0,claimed:{}},g.weekly||{});
 if(g.tasks.building&&(!g.tasks.buildQueue||!g.tasks.buildQueue.length)){g.tasks.buildQueue=[g.tasks.building];}g.tasks.buildQueue=(g.tasks.buildQueue||[]).slice(0,3);const oldAk=g.tasks.buildQueue.find(x=>x.key==='akademi');if(oldAk&&!g.sharedAcademyTask)g.sharedAcademyTask=oldAk;g.tasks.buildQueue=g.tasks.buildQueue.filter(x=>x.key!=='akademi');g.tasks.building=g.tasks.buildQueue[0]||null;
 if(!g.playerPos){g.playerPos={continent:rnd(1,NCONT),row:rnd(1,10)};}if(!g.playerPos.row)g.playerPos.row=(g.playerPos.y||rnd(1,10)-1)%10+1;g.playerPos.x=g.playerPos.row;g.playerPos.y=g.playerPos.row;ui.cont=g.playerPos.continent;
 if(!g.cities||!g.cities.length){g.cities=[{id:1,name:'Başkent',continent:g.playerPos.continent,row:g.playerPos.row}];g.activeCityId=1;}g.activeCityId=g.activeCityId||g.cities[0].id;g.cities.forEach(c=>{c.row=Math.max(1,Math.min(10,Number(c.row)||1));c.continent=Math.max(1,Math.min(NCONT,Number(c.continent)||g.playerPos.continent));});const active=g.cities.find(c=>c.id===g.activeCityId)||g.cities[0];g.activeCityId=active.id;g.playerPos={continent:active.continent,row:active.row};ui.cont=active.continent;g.buildings.akademi=g.sharedAcademyLevel;
 g.gold=g.gold||0;g.food=g.food||0;g.spent=g.spent||0;
 if(!g.bots||!g.bots.length){
  // Mevcut şehir/konumu koruyarak sadece botları üret
  const keepPos=g.playerPos?{...g.playerPos}:null;
  const keepCities=g.cities?g.cities.slice():null;
  const keepActive=g.activeCityId;
  genBots();
  if(keepPos)g.playerPos=keepPos;
  if(keepCities&&keepCities.length){g.cities=keepCities;g.activeCityId=keepActive||keepCities[0].id;}
 }
 if(g.alliance.name&&!g.alliances.find(a=>a.name===g.alliance.name)){g.alliance.name=null;g.alliance.isLeader=false;}
}
function migrate(o){
 try{
  g.gold=o.gold!=null?o.gold:g.gold;g.food=o.food!=null?o.food:g.food;g.spent=o.spentResources||0;
  if(o.buildings)for(const k in BUILD){if(o.buildings[k])g.buildings[k]=Math.min(BUILD[k].max,o.buildings[k].level||0);}
  if(o.researchLevels)for(const r in RES){g.research[r]=Math.min(RES[r].max,o.researchLevels[r]||0);}
  const add=(map,store)=>{for(const n in (map||{}))if(store[n]!==undefined||true)if((TROOPS[n]||DEF[n])&&map[n]>0)store[n]=(store[n]||0)+map[n];};
  for(const n in (o.myTroops||{}))if(TROOPS[n])g.myTroops[n]=o.myTroops[n];
  for(const n in (o.myDefenses||{}))if(DEF[n])g.myDefenses[n]=o.myDefenses[n];
  const t=o.tasks||{};
  [t.building,t.research].forEach(x=>{if(x){g.gold+=x.costGold||0;g.food+=x.costFood||0;g.spent=Math.max(0,g.spent-(x.costGold||0)-(x.costFood||0));}});
  (t.troopQueue||[]).forEach(q=>{if(q.isDefense&&DEF[q.name])g.myDefenses[q.name]=(g.myDefenses[q.name]||0)+1;else if(TROOPS[q.name])g.myTroops[q.name]=(g.myTroops[q.name]||0)+1;});
  const m=t.march;
  if(m){if(m.type==='saldiri'&&m.troopsSent)for(const n in m.troopsSent)if(TROOPS[n])g.myTroops[n]=(g.myTroops[n]||0)+m.troopsSent[n];
   if(m.type==='nakliye'&&!m.isReturning){g.gold+=m.gold||0;g.food+=m.food||0;}}
  if(o.alliance&&o.alliance.name){
   const nm=String(o.alliance.name).slice(0,16);
   g.alliance={name:nm,isLeader:!!o.alliance.isLeader,goldDonated:o.alliance.goldDonated||0,foodDonated:o.alliance.foodDonated||0};
   if(!g.alliances.find(a=>a.name===nm))g.alliances.push({name:nm,leader:pName(),donated:(o.alliance.goldDonated||0)+(o.alliance.foodDonated||0)});
  }
  setTimeout(()=>toast("✅ Eski kaydın aktarıldı!"),600);
 }catch(e){console.error(e);}
}
function readStorage(key){
 try{return localStorage.getItem(key);}catch(e){storageOk=false;return null;}
}
function writeStorage(key,val){
 try{localStorage.setItem(key,val);return true;}catch(e){storageOk=false;console.error(e);return false;}
}
function tryParseSave(raw){
 if(!raw)return null;
 try{
  const o=JSON.parse(raw);
  if(!o||typeof o!=='object')return null;
  if(!o.bots&&!o.cities)return null;
  return o;
 }catch(e){console.error(e);return null;}
}
function load(){
 // Depolama testi
 try{
  const t='__mw_test__';
  localStorage.setItem(t,'1');localStorage.removeItem(t);
  storageOk=true;
 }catch(e){storageOk=false;}

 const candidates=[SAVE_KEY, SAVE_BACKUP, OLD_KEY];
 for(const key of candidates){
  const raw=readStorage(key);
  const o=tryParseSave(raw);
  if(o){
   g=o;
   try{fixSave();}
   catch(e){
    console.error('fixSave',e);
    try{writeStorage(key+'_corrupt',raw);}catch(_e){}
    continue;
   }
   // Başarılı yükleme — yedekle
   try{writeStorage(SAVE_KEY, JSON.stringify(g));writeStorage(SAVE_BACKUP, JSON.stringify(g));}catch(e){}
   return true;
  }
 }
 // Hiç kayıt yok
 newGame();
 return false;
}
function citySnapshot(){return{gold:g.gold,food:g.food,buildings:{...g.buildings},myTroops:{...g.myTroops},myDefenses:{...g.myDefenses},tasks:JSON.parse(JSON.stringify(g.tasks))};}
function storeActiveCity(){if(!g.cities||!g.cities.length)return;g.sharedResearchTask=g.tasks.research||g.sharedResearchTask||null;const c=g.cities.find(x=>x.id===g.activeCityId);if(c){Object.assign(c,citySnapshot());c.tasks.research=null;c.buildings.akademi=g.sharedAcademyLevel||0;}}
function restoreCity(c){if(!c)return;g.gold=c.gold||0;g.food=c.food||0;/* spent & scoreLoss are GLOBAL - not restored per city */g.buildings=Object.assign({ciftlik:0,maden:0,kale:1,kisla:0,akademi:g.sharedAcademyLevel||0,mimarhane:0,magara:0,mabet:0,gecit:0},c.buildings||{});g.buildings.akademi=g.sharedAcademyLevel||0;g.myTroops={...(c.myTroops||{})};g.myDefenses={...(c.myDefenses||{})};g.tasks=Object.assign({building:null,buildQueue:[],research:null,queue:[]},JSON.parse(JSON.stringify(c.tasks||{})));g.tasks.research=g.sharedResearchTask||null;g.events=Object.assign({build:null,research:null,troop:null},g.events||{});/* stats GLOBAL — şehirden yüklenmez */g.playerPos={continent:c.continent,row:c.row};ui.cont=c.continent;}
function switchCity(id){
  if(id===g.activeCityId)return;
  storeActiveCity();
  const c=g.cities.find(x=>x.id===id);if(!c)return;
  g.activeCityId=id;restoreCity(c);save();refresh();
  const tr=Object.values(c.myTroops||{}).reduce((s,x)=>s+(x||0),0);
  const inc=(g.incomingAttacks||[]).filter(a=>a.targetCityId===c.id).length;
  toast(`🏙️ ${c.name} • ${fmt(Math.floor(c.gold||0))}💰 ${fmt(Math.floor(c.food||0))}🍗 • ${tr} asker${inc?` • ⚔️${inc} gelen`:''}`);
}
function renameCity(id){
  const c=g.cities.find(x=>x.id===id); if(!c)return;
  const name=prompt('Şehir adı (max 14 karakter):', c.name||'');
  if(name===null)return;
  const clean=name.trim().slice(0,14);
  if(!clean){alert('İsim boş olamaz');return;}
  c.name=clean;
  if(id===g.activeCityId) toast(`🏙️ Şehir adı: ${clean}`);
  dirty=true; save(); refresh();
}
function canFoundMore(){const max=1+Math.floor(rl('Yurt Tutma')/3);return g.cities.length<max&&g.cities.length<6;}
function openFoundCityModal(continent, row){
  const max=1+Math.floor(rl('Yurt Tutma')/3);
  if(g.cities.length>=max||g.cities.length>=6){alert(`Şehir sınırı: ${max} şehir (Yurt Tutma her 3 seviyede +1).`);return;}
  if(g.cities.some(c=>c.continent===continent&&c.row===row)||g.bots.some(b=>b.continent===continent&&b.row===row)){alert('Bu koordinat dolu!');return;}
  if((g.marches||[]).some(m=>m.type==='kurulus'&&!m.back&&m.continent===continent&&m.row===row)){alert('Bu koordinata zaten kurucu seferi yolda!');return;}
  ui.foundCont=continent;ui.foundRow=row;
  const names=Object.keys(g.myTroops).filter(n=>g.myTroops[n]>0);
  ui.foundNames=names;
  const t=travelTimeCoords(g.playerPos.continent,g.playerPos.row,continent,row,false);
  const nextId=Math.max(0,...g.cities.map(c=>c.id))+1;
  const rows=names.map((n,i)=>`<div class="row"><span>${TROOPS[n].icon} ${n} (${g.myTroops[n]})</span><input type="number" inputmode="numeric" min="0" max="${g.myTroops[n]}" value="0" id="fd-${i}"></div>`).join('')||'<p class="mut small">Askerin yok — en az 1 birlik veya Kağnı gönder.</p>';
  openModal(`<h3>🏗️ Şehir Kurma Seferi</h3>
  <p class="small mut">Koordinat <b>${continent}.${row}</b> • Süre <b class="gold">${formatTime(t)}</b><br>Kurucu sefer <b>sefer hakkını tüketmez</b>. Yeni şehir yalnızca gönderdiğin kaynak ve birliklerle başlar.</p>
  <div class="row"><span>Şehir adı</span><input type="text" id="fd-name" maxlength="14" value="Şehir ${nextId}" style="text-align:left;flex:1"></div>
  <div class="row"><span>Altın (gönder)</span><input type="number" id="fd-g" min="0" max="${Math.floor(g.gold)}" value="0"></div>
  <div class="row"><span>Yemek (gönder)</span><input type="number" id="fd-f" min="0" max="${Math.floor(g.food)}" value="0"></div>
  <div class="sep"></div><div class="small gold" style="margin-bottom:6px">Kurucu ordu / Kağnı</div>
  ${rows}
  <button class="btn gold full" style="margin-top:10px" onclick="sendFoundCity()">🚀 Kurucu Seferi Başlat</button>
  <button class="btn full" style="margin-top:8px" onclick="closeModal()">İptal</button>`);
}
function sendFoundCity(){
  const continent=ui.foundCont, row=ui.foundRow;
  if(continent==null||row==null)return;
  if(!canFoundMore()){alert('Şehir hakkın yok!');return;}
  if(g.cities.some(c=>c.continent===continent&&c.row===row)||g.bots.some(b=>b.continent===continent&&b.row===row)){alert('Koordinat dolu!');return;}
  const army={};let total=0;
  (ui.foundNames||[]).forEach((n,i)=>{const el=$('fd-'+i);let v=Math.min(g.myTroops[n]||0,Math.max(0,parseInt(el&&el.value)||0));if(v>0){army[n]=v;total+=v;}});
  const gg=Math.max(0,Math.min(Math.floor(g.gold),parseInt($('fd-g')&&$('fd-g').value)||0));
  const ff=Math.max(0,Math.min(Math.floor(g.food),parseInt($('fd-f')&&$('fd-f').value)||0));
  if(total<=0){alert('En az 1 birlik veya Kağnı göndermelisin!');return;}
  const carts=army['Kağnı']||0;
  if(gg+ff>0&&carts*CART_CAP<gg+ff){alert(`Kağnı kapasitesi yetersiz (adet başı ${CART_CAP}).`);return;}
  let cname=(($('fd-name')&&$('fd-name').value)||'').trim().slice(0,14);
  if(!cname)cname=`Şehir ${Math.max(0,...g.cities.map(c=>c.id))+1}`;
  for(const n in army)g.myTroops[n]-=army[n];clean(g.myTroops);
  g.gold-=gg;g.food-=ff;
  const t=travelTimeCoords(g.playerPos.continent,g.playerPos.row,continent,row,false);
  g.marches.push({id:g.nextId++,type:'kurulus',target:null,continent,row,cityName:cname,troops:army,gold:gg,food:ff,timeLeft:t,one:t,back:false,loot:null,fromCityId:g.activeCityId,freeSlot:true});
  closeModal();refresh();toast(`🏗️ Kurucu sefer yola çıktı → ${continent}.${row} (${formatTime(t)})`);
}
function completeFoundCity(m){
  if(!canFoundMore()){
    const fromC=g.cities.find(c=>c.id===m.fromCityId);
    if(giveCity(m.fromCityId,m.troops,m.gold,m.food)){}
    else{for(const n in m.troops)g.myTroops[n]=(g.myTroops[n]||0)+(m.troops[n]||0);g.gold+=(m.gold||0);g.food+=(m.food||0);}
    pushReport({kind:'info',title:'Şehir kurulamadı',summary:'Şehir hakkın kalmadığı için birlikler iade edildi.',html:'Yurt Tutma yetersiz veya şehir sınırına ulaşıldı.'});
    return;
  }
  if(g.cities.some(c=>c.continent===m.continent&&c.row===m.row)||g.bots.some(b=>b.continent===m.continent&&b.row===m.row)){
    const fromC=g.cities.find(c=>c.id===m.fromCityId);
    if(giveCity(m.fromCityId,m.troops,m.gold,m.food)){}
    pushReport({kind:'info',title:'Şehir kurulamadı',summary:'Koordinat dolu; sefer iade edildi.',html:'Hedef koordinat artık dolu.'});
    return;
  }
  storeActiveCity();
  const id=Math.max(0,...g.cities.map(c=>c.id))+1;
  const city={id,name:m.cityName||(`Şehir ${id}`),continent:m.continent,row:m.row,
    gold:m.gold||0,food:m.food||0,
    buildings:{ciftlik:0,maden:0,kale:1,kisla:0,akademi:g.sharedAcademyLevel||0,mimarhane:0,magara:0,mabet:0,gecit:0},
    myTroops:Object.assign({},m.troops||{}),myDefenses:{},
    tasks:{building:null,buildQueue:[],research:null,queue:[]},
    events:{build:null,research:null,troop:null}};
  g.cities.push(city);
  g.activeCityId=id;restoreCity(city);save();
  pushReport({kind:'info',title:`🏙️ Şehir kuruldu: ${city.name}`,summary:`${city.continent}.${city.row} • ${fmt(city.gold)}💰 ${fmt(city.food)}🍗`,html:`<b>${esc(city.name)}</b> kuruldu.<br>Koordinat: ${city.continent}.${city.row}<br>Başlangıç: ${fmt(city.gold)}💰 ${fmt(city.food)}🍗<br>Gelen birlikler yeni şehirde kaldı.`});
  toast(`🏙️ ${city.name} kuruldu! (${city.continent}.${city.row})`);
}
function giveCity(id,tr,gd,fd){const c=g.cities.find(x=>x.id===id);if(!c||c.id===g.activeCityId){for(const n in tr)g.myTroops[n]=(g.myTroops[n]||0)+(tr[n]||0);g.gold+=gd||0;g.food+=fd||0;}else{for(const n in tr)c.myTroops[n]=(c.myTroops[n]||0)+(tr[n]||0);c.gold=(c.gold||0)+(gd||0);c.food=(c.food||0)+(fd||0);}return true;}
function foundCityAt(continent, row){openFoundCityModal(continent, row);}
function foundCity(){const pp=g.playerPos;let pos=null;for(let d=1;d<=10&&!pos;d++){for(let r=1;r<=10;r++){if(Math.abs(r-pp.row)===d&&!g.cities.some(c=>c.continent===pp.continent&&c.row===r)&&!g.bots.some(b=>b.continent===pp.continent&&b.row===r)){pos={continent:pp.continent,row:r};break;}}}if(!pos){for(let c=1;c<=24&&!pos;c++){const cc=((pp.continent-1+c)%24)+1;for(let r=1;r<=10;r++)if(!g.cities.some(x=>x.continent===cc&&x.row===r)&&!g.bots.some(b=>b.continent===cc&&b.row===r)){pos={continent:cc,row:r};break;}}}if(!pos){alert('Uygun koordinat bulunamadı.');return;}openFoundCityModal(pos.continent, pos.row);}
function save(){
 try{storeActiveCity();}catch(e){console.error(e);}
 g.lastSave=Date.now();
 g.v=30;
 let payload;
 try{payload=JSON.stringify(g);}
 catch(e){console.error('stringify',e);try{toast('⚠️ Kayıt serileştirilemedi');}catch(_e){}return false;}
 const prev=readStorage(SAVE_KEY);
 const ok1=writeStorage(SAVE_KEY,payload);
 if(prev&&Date.now()-_lastBk>300000){writeStorage(SAVE_BACKUP,prev);_lastBk=Date.now();}
 const ok2=ok1;
 if(!ok1&&!ok2){
  try{toast('⚠️ Kayıt başarısız! Tarayıcı depolaması kapalı veya dolu.');}catch(_e){}
  return false;
 }
 return true;
}

/* =====================  HESAPLAMALAR  ===================== */
const bl=k=>k==='akademi'?(g.sharedAcademyLevel||0):(g.buildings[k]||0), rl=k=>g.research[k]||0;
const curve=l=>l<=0?0:l*Math.pow(1.05,l-1);
function allyEntry(n){return g.alliances.find(a=>a.name===n);}
function allyLevel(n){if(!n)return 0;const a=allyEntry(n);if(!a)return 0;const t=[0,1000,4000,10000,25000];let l=1;for(let i=1;i<5;i++)if(a.donated>=t[i])l=i+1;return l;}
const ALLY_T=[0,1000,4000,10000,25000];
const myAllyLevel=()=>allyLevel(g.alliance.name);
const prodMul=()=>myAllyLevel()>=2?1.15:1;
function goldRate(l,m){return 140*curve(l===undefined?bl('maden'):l)*(m===undefined?prodMul():m);}
function foodRate(l,m){return 182*curve(l===undefined?bl('ciftlik'):l)*(m===undefined?prodMul():m);}
const totalB=()=>Object.entries(g.buildings).reduce((s,[k,x])=>s+(k==='akademi'?0:x),0);
const maxB=()=>bl('kale')*10+(myAllyLevel()>=5?10:0);
const pScore=()=>Math.max(0,Math.floor(g.spent/1000)-Math.floor((g.scoreLoss||0)/1000));
const bScore=b=>Math.max(0,Math.floor(b.spent/1000)-Math.floor((b.scoreLoss||0)/1000));
const lossValue=(o,T)=>Object.keys(o||{}).reduce((z,n)=>z+(T[n]?o[n]*(T[n].g+T[n].f):0),0);
function ul(obj){
  return Object.keys(obj||{}).filter(n=>obj[n]>0)
    .map(n=>{
      const u=TROOPS[n]||DEF[n];
      return `${u?u.icon:''} ${n}: ${obj[n]}`;
    }).join('\n') || '—';
}
function addLoss(side,val){if(!val)return;if(side.me)g.scoreLoss=(g.scoreLoss||0)+val;else if(side.bot)side.bot.scoreLoss=(side.bot.scoreLoss||0)+val;}
const difficulty=()=>BOT_LEVELS[g.botDifficulty]||BOT_LEVELS.orta;
const botDiff=b=>BOT_LEVELS[b.difficulty||g.botDifficulty]||BOT_LEVELS.orta;
const supplyCap=lv=>Infinity;
function supplyUsed(){let s=0;for(const n in g.myTroops)if(TROOPS[n])s+=g.myTroops[n]*TROOPS[n].sup;
 g.marches.forEach(m=>{
  if(m.fromCityId!=null&&m.fromCityId!==g.activeCityId)return;
  for(const n in m.troops)if(TROOPS[n])s+=m.troops[n]*TROOPS[n].sup;
 });
 g.tasks.queue.forEach(b=>{if(!b.def&&TROOPS[b.name])s+=b.count*TROOPS[b.name].sup;});return s;}
function supplyOnMarch(){let s=0;g.marches.forEach(m=>{
  if(m.fromCityId!=null&&m.fromCityId!==g.activeCityId)return;
  for(const n in m.troops)if(TROOPS[n])s+=m.troops[n]*TROOPS[n].sup;
 });return s;}
const seferHakki=()=>1+Math.floor(bl('kisla')/4)+Math.floor(rl('Haritacılık')/3);
const evMul=t=>g.events[t]?1+g.events[t].rate/100:1;
const buildMul=()=>Math.max(0.2,1-0.04*bl('mimarhane'));
const researchMul=()=>Math.max(0.2,1-0.04*bl('akademi'));
const trainMul=()=>Math.max(0.3,1-0.035*bl('kisla'));
function buildCostAt(k,l){const B=BUILD[k],gr=k==='kale'?1.45:1.3;return{g:Math.floor(B.g*Math.pow(gr,l)),f:Math.floor(B.f*Math.pow(gr,l))};}
const buildCost=k=>buildCostAt(k,bl(k));
function buildTimeAt(k,l){return Math.floor(BUILD[k].t*Math.pow(k==='kale'?1.4:1.25,l));}
const buildTime=k=>Math.max(2,Math.floor(buildTimeAt(k,bl(k))*buildMul()));
function resCost(n){const R=RES[n],l=rl(n);return{g:Math.floor((120+30*R.ak)*Math.pow(1.45,l)),f:Math.floor((100+25*R.ak)*Math.pow(1.45,l))};}
function resTime(n){const R=RES[n];return Math.max(2,Math.floor((60+20*R.ak)*Math.pow(1.3,rl(n))*researchMul()/evMul('research')));}
const troopTime=n=>Math.max(2,Math.ceil(TROOPS[n].t*trainMul()));
const defTime=n=>Math.max(2,Math.ceil(DEF[n].t*trainMul()));
const defCap=()=>Infinity;
function defLevelCost(n,level){
 const d=DEF[n], l=Math.max(1,Number(level)||1);
 if(!d.level)return{g:d.g,f:d.f};
 const mul=1.35;
 return{g:Math.floor(d.g*Math.pow(mul,l-1)),f:Math.floor(d.f*Math.pow(mul,l-1))};
}
function defCount(n){let c=g.myDefenses[n]||0;g.tasks.queue.forEach(b=>{if(b.def&&b.name===n)c+=b.count;});return c;}
function isNight(){const h=new Date(g.simTime*1000).getHours();return h>=22||h<6;}
const clockStr=()=>new Date(g.simTime*1000).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
function travelTimeCoords(fromCont,fromRow,toCont,toRow,spy){
 const dc=Math.abs((toCont||1)-(fromCont||1));
 const dr=Math.abs((toRow||1)-(fromRow||1));
 const distance=Math.max(1,dc*10+dr);
 const mapBonus=Math.max(0.25,1-0.05*rl('Haritacılık'));
 const m=mapBonus*(1-0.03*bl('gecit'))*(myAllyLevel()>=4?0.85:1);
 const t=Math.max(15,Math.ceil(distance*90*m));return spy?Math.max(15,Math.ceil(t/8)):t;
}
function travelTime(b,spy){
 const pp=g.playerPos||{continent:1,row:1};
 return travelTimeCoords(pp.continent,pp.row,b.continent||1,b.row||b.y||1,spy);
}
function atkResMul(name){let p=0;for(const r in RES){const R=RES[r];if(R.k==='atk'&&R.targets.includes(name))p+=R.pct*rl(r)/100;}return 1+p;}
function defResMul(name,getter=rl){let p=0;for(const r in RES){const R=RES[r];if(R.defTargets&&R.defTargets.includes(name))p+=R.pct*getter(r)/100;}return 1+p;}
/** Botun kendi araştırma seviyesi — oyuncu g.research'ten bağımsız */
function botRl(b,name){return (b.research&&b.research[name])||0;}
function botAtkResMul(b,name){let p=0;for(const r in RES){const R=RES[r];if(R.k==='atk'&&R.targets.includes(name))p+=R.pct*botRl(b,r)/100;}return 1+p;}
function heroBonus(){return Math.min(0.4,0.02*bl('mabet'));}
function heroAtkBonus(){const h=heroBonus();return (g.hero&&g.hero.trait==='def')?h*0.5:h;}
function heroDefBonus(){const h=heroBonus();return (g.hero&&g.hero.trait==='atk')?h*0.5:h;}
function playerSide(){
 const al=myAllyLevel()>=3?0.2:0,ha=heroAtkBonus(),hd=heroDefBonus(),zirh=0.08*rl('Zırh');
 return{me:true,troops:g.myTroops,defs:g.myDefenses,kale:bl('kale'),
  atk:n=>atkResMul(n)*(1+al)*(1+ha),def:()=>(1+zirh)*(1+al)*(1+hd),
  str:n=>(1+0.1*rl('Tahkimat'))*defResMul(n)*(1+al)*(n==='Tılsım Kalkanı'?1+0.1*rl('Tılsım'):1),
  night:Math.max(0,0.15-0.03*rl('Gece Görüş')),loss:Math.max(0.5,1-0.05*rl('İçgüdü'))};
}
function botSide(b){
 const al=allyLevel(b.alliance)>=3?0.2:0,d=botDiff(b);
 const zirh=0.08*botRl(b,'Zırh'), tah=0.1*botRl(b,'Tahkimat'), til=0.1*botRl(b,'Tılsım');
 const night=Math.max(0,0.15-0.03*botRl(b,'Gece Görüş'));
 const loss=Math.max(0.5,1-0.05*botRl(b,'İçgüdü'));
 // Sadece botun kendi araştırması + zorluk çarpanı — oyuncu akademisi ETKİ ETMEZ
 return{me:false,bot:b,troops:b.troops,defs:b.defs,kale:b.lv.kale,
  atk:n=>botAtkResMul(b,n)*(1+al)*d.attack,
  def:()=>(1+zirh)*(1+al)*d.def,
  str:n=>(1+tah)*defResMul(n,r=>botRl(b,r))*(1+al)*(n==='Tılsım Kalkanı'?1+til:1),
  night,loss:loss*d.loss};
}

/* =====================  SAVAŞ  ===================== */
function classPower(side,troops,mode){
 let tot=0;const by={};
 for(const n in troops){const c=troops[n];if(!(c>0)||!TROOPS[n])continue;const u=TROOPS[n];
  if(u.nonCombat)continue;const p=c*(mode==='atk'?u.atk*side.atk(n):u.def*side.def(n));if(p<=0)continue;tot+=p;by[u.cls]=(by[u.cls]||0)+p;}
 return{tot,by};
}
function clsMod(cls,eBy,eTot){
 if(!eTot)return 1;let m=0;const beats=CLS_BEATS[cls];
 if(beats)m+=0.3*(eBy[beats]||0)/eTot;
 for(const c in CLS_BEATS)if(CLS_BEATS[c]===cls)m-=0.3*(eBy[c]||0)/eTot;
 return 1+m;
}
function structPower(side,enemyBy,enemyTot,magicShare=0){
 let t=0;
 for(const n in side.defs){
  const c=side.defs[n];if(!(c>0)||!DEF[n])continue;
  let factor=1;
  if(DEF[n].magic){
   // enemyBy sınıf bazlıdır; büyülü birlik payını tek tek birliklerden hesaplıyoruz.
   factor=Math.max(0,Math.min(1,magicShare));
  }
  t+=c*DEF[n].def*side.str(n)*factor;
 }
 return t;
}
function predict(army,att,def,night){
 // İki tarafın da saldırı ve savunma gücü hesaba katılır.
 // Saldırı sınıf avantajı verir; savunma ise birliklerin dayanıklılığını temsil eder.
 const A0=classPower(att,army,'atk'),Adef=classPower(att,army,'def');
 const D0=classPower(def,def.troops,'atk'),Ddef=classPower(def,def.troops,'def');
 let magicPower=0;
 for(const n in army){const u=TROOPS[n];if(u&&(u.magic||u.cls==='mag'))magicPower+=(army[n]||0)*u.atk*att.atk(n);}
 const magicShare=A0.tot>0?magicPower/A0.tot:0;
 let Aoff=0,Doff=0;
 for(const c in A0.by)Aoff+=A0.by[c]*clsMod(c,D0.by,D0.tot);
 for(const c in D0.by)Doff+=D0.by[c]*clsMod(c,A0.by,A0.tot);
 if(night)Aoff*=1-att.night;
 const siegeShare=A0.tot>0?(A0.by.sge||0)/A0.tot:0;
 const structureFactor=1-Math.min(0.6,0.8*siegeShare);
 const structures=structPower(def,A0.by,A0.tot,magicShare)*0.5*structureFactor;
 // Saldıran tarafın hücum inisiyatifi, Kale 1'in +%4 savunma bonusunu dengeler.
 const A=(Aoff*0.6+Adef.tot*0.4)*1.04;
 const D=(Doff*0.6+Ddef.tot*0.4+structures)*(1+0.04*def.kale);
 return{A,D};
}
const clean=o=>{for(const k in o)if(!(o[k]>0))delete o[k];};
function fight(army,att,def,night){
 // Tur bazlı savaş: iki tarafın da saldırı ve savunma gücü her tur yeniden hesaplanır.
 const attackFortune=0.85+Math.random()*0.30;
 const defenseFortune=0.85+Math.random()*0.30;
 const battleAtt=Object.assign({},att,{
  atk:n=>att.atk(n)*attackFortune,
  def:()=>att.def()*attackFortune
 });
 const battleDef=Object.assign({},def,{
  atk:n=>def.atk(n)*defenseFortune,
  def:()=>def.def()*defenseFortune,
  str:n=>def.str(n)*defenseFortune
 });
 const initial=predict(army,battleAtt,battleDef,night);
 const out={win:false,A:initial.A,D:initial.D,finalA:0,finalD:0,rounds:0,roundLog:[],endedBy:'round-limit',night,attackFortune,defenseFortune,
  sent:Object.assign({},army),defBefore:Object.assign({},def.troops),structBefore:Object.assign({},def.defs),aLost:{},dLost:{},sLost:{}};
 const rr=x=>{const f=Math.floor(x);return f+(Math.random()<x-f?1:0);};
 const total=o=>Object.values(o||{}).reduce((a,b)=>a+(Number(b)||0),0);
 const hasFighters=o=>Object.keys(o||{}).some(n=>TROOPS[n]&&!TROOPS[n].nonCombat&&TROOPS[n].cls!=='spy'&&(o[n]||0)>0);
 const troopValue=(side,troops)=>{
  const a=classPower(side,troops,'atk').tot;
  const d=classPower(side,troops,'def').tot;
  return a*0.6+d*0.4;
 };
 const structureValue=()=>{
  const ap=classPower(battleAtt,army,'atk');
  let magicPower=0;
  for(const n in army){const u=TROOPS[n];if(u&&(u.magic||u.cls==='mag'))magicPower+=(army[n]||0)*u.atk*battleAtt.atk(n);}
  const magicShare=ap.tot>0?magicPower/ap.tot:0;
  return structPower(battleDef,ap.by,ap.tot,magicShare);
 };
 const addLosses=(current,dict,rate,lossBag,cartHalf=false)=>{
  let removed=0;
  for(const n in current){if(!dict[n]||!(current[n]>0))continue;
   const f=cartHalf&&dict[n].cls==='cart'?rate*0.5:rate;
   const lost=Math.min(current[n],rr(current[n]*f));
   if(lost>0){current[n]-=lost;lossBag[n]=(lossBag[n]||0)+lost;removed+=lost;}
  }
  clean(current);return removed;
 };
 const MAX_ROUNDS=30;
 const BREAK_THRESHOLD=0.15; // Birlik gücü başlangıcın %15'ine düşünce taraf savaşamaz hale gelir.
 const initialAttackerTroopValue=troopValue(battleAtt,army);
 const initialDefenderTroopValue=troopValue(battleDef,def.troops);
 const initialStructureValue=structureValue();
 for(let round=1;round<=MAX_ROUNDS;round++){
  clean(army);clean(def.troops);clean(def.defs);
  if(!hasFighters(army)){
   for(const n in army){if(!TROOPS[n]||!(army[n]>0))continue;const rate=TROOPS[n].cls==='cart'?0.5:1;const lost=Math.min(army[n],rr(army[n]*rate));if(lost>0){army[n]-=lost;out.aLost[n]=(out.aLost[n]||0)+lost;}}
   clean(army);out.rounds=1;out.roundLog.push({round:1,aPower:initial.A,dPower:initial.D,aLost:0,dLost:0,sLost:0,aRemain:total(army),dRemain:total(def.troops),sRemain:total(def.defs)});out.endedBy='attacker-eliminated';break;
  }
  if(!hasFighters(def.troops)&&total(def.defs)===0){out.win=true;out.endedBy='defender-eliminated';break;}
  const p=predict(army,battleAtt,battleDef,night);
  if(!(p.A>0)){out.endedBy='attacker-power-zero';break;}
  const combined=Math.max(1,p.A+p.D);
  const aShare=p.A/combined,dShare=p.D/combined;
  // Güçlü taraf daha az kayıp verir. Eşit güçte iki taraf da yaklaşık aynı kaybı yaşar.
  const attackerRate=Math.max(0.03,Math.min(0.22,(0.015+0.14*dShare)*(att.loss||1)));
  const defenderRate=Math.max(0.03,Math.min(0.22,(0.015+0.14*aShare)*(def.loss||1)));
  const attackProfile=classPower(battleAtt,army,'atk');
  const siegeShare=attackProfile.tot>0?(attackProfile.by.sge||0)/attackProfile.tot:0;
  const structureRate=Math.max(0.004,Math.min(0.30,(0.01+0.30*siegeShare)*(def.loss||1)));
  const aLostThis=addLosses(army,TROOPS,attackerRate,out.aLost,true);
  const dLostThis=addLosses(def.troops,TROOPS,defenderRate,out.dLost,false);
  const sLostThis=addLosses(def.defs,DEF,structureRate,out.sLost,false);
  out.rounds=round;
  out.roundLog.push({round,aPower:p.A,dPower:p.D,aLost:aLostThis,dLost:dLostThis,sLost:sLostThis,
   aRemain:total(army),dRemain:total(def.troops),sRemain:total(def.defs)});
  const aRemainValue=troopValue(battleAtt,army);
  const dRemainValue=troopValue(battleDef,def.troops);
  const sRemainValue=structureValue();
  const attackerBroken=initialAttackerTroopValue>0&&aRemainValue<=initialAttackerTroopValue*BREAK_THRESHOLD;
  const defenderTroopsBroken=initialDefenderTroopValue<=0||dRemainValue<=initialDefenderTroopValue*BREAK_THRESHOLD;
  const defenderStructuresBroken=initialStructureValue<=0||sRemainValue<=initialStructureValue*BREAK_THRESHOLD;
  if(attackerBroken&&defenderTroopsBroken&&defenderStructuresBroken){out.endedBy='decisive';break;}
  if(attackerBroken){out.endedBy='attacker-broken';break;}
  if(defenderTroopsBroken&&defenderStructuresBroken){out.endedBy='defender-broken';out.win=true;break;}
  if(round===MAX_ROUNDS)out.endedBy='round-limit';
 }
 clean(army);clean(def.troops);clean(def.defs);
 const finalPower=predict(army,battleAtt,battleDef,night);
 out.finalA=finalPower.A;out.finalD=finalPower.D;
 if(out.endedBy==='round-limit'||out.endedBy==='decisive')out.win=hasFighters(army)&&finalPower.A>finalPower.D;
 else if(out.endedBy==='attacker-power-zero'||out.endedBy==='attacker-eliminated'||out.endedBy==='attacker-broken')out.win=false;
 else if(out.endedBy==='defender-eliminated'||out.endedBy==='defender-broken')out.win=hasFighters(army);
 const initialDefValue=lossValue(out.defBefore,TROOPS)+lossValue(out.structBefore,DEF);
 out.aLossValue=lossValue(out.aLost,TROOPS);
 out.dLossValue=lossValue(out.dLost,TROOPS)+lossValue(out.sLost,DEF);
 out.dLossRatio=initialDefValue>0?Math.min(1,out.dLossValue/initialDefValue):0;
 addLoss(att,out.aLossValue);addLoss(def,out.dLossValue);
 return out;
}
function protectedAmt(side){return side.me?bl('magara')*400*(1+0.15*rl('Yurt Tutma')):(side.bot.lv.magara||0)*400;}
function casualtyFromLosses(res){
  let goldCost=0,foodCost=0;
  const add=(lost,T)=>{for(const n in lost||{}){const u=T[n];if(!u)continue;const c=lost[n]||0;goldCost+=c*(u.g||0);foodCost+=c*(u.f||0);}};
  add(res.aLost,TROOPS);add(res.dLost,TROOPS);add(res.sLost,DEF);
  const total=goldCost+foodCost;
  if(total<=0)return{g:0,f:0};
  const loot=Math.floor(total*0.40);
  const g=Math.floor(loot*(goldCost/total));
  return{g,f:loot-g};
}
/** Depo + kayıp ganimeti. Saldıran kazanırsa kağnı kapasitesine göre alır; kalan savunanın. Savunan kazanırsa kayıp ganimeti savunanın. */
function settleBattleLoot(army,att,def,res){
  const cas=casualtyFromLosses(res);
  const defR=def.me?g:def.bot;
  const loot={g:0,f:0,pg:0,pf:0,lg:0,lf:0,cap:0,frac:0,lr:res.dLossRatio||0,
    casG:cas.g,casF:cas.f,casTakenG:0,casTakenF:0,casKeptG:0,casKeptF:0,depotG:0,depotF:0};
  let cap=0;for(const n in army)cap+=army[n]*unitCap(n);
  loot.cap=Math.floor(cap);

  if(res.win){
    const depot=doLoot(army,def,res,0);
    loot.g=depot.g;loot.f=depot.f;loot.pg=depot.pg;loot.pf=depot.pf;loot.lg=depot.lg;loot.lf=depot.lf;loot.frac=depot.frac;
    loot.depotG=depot.g;loot.depotF=depot.f;
    const used=depot.g+depot.f;
    let left=Math.max(0,loot.cap-used);
    const casTot=cas.g+cas.f;
    if(casTot>0&&left>0){
      const k=Math.min(1,left/casTot);
      const tg=Math.floor(cas.g*k),tf=Math.floor(cas.f*k);
      loot.casTakenG=tg;loot.casTakenF=tf;
      loot.casKeptG=cas.g-tg;loot.casKeptF=cas.f-tf;
      loot.g+=tg;loot.f+=tf;
    }else{
      loot.casKeptG=cas.g;loot.casKeptF=cas.f;
    }
    // Taşınamayan kayıp ganimeti savunanın kasasına
    if(loot.casKeptG||loot.casKeptF){defR.gold=(defR.gold||0)+loot.casKeptG;defR.food=(defR.food||0)+loot.casKeptF;}
  }else{
    // Savunan kazandı → tüm kayıp ganimeti savunanın
    loot.casKeptG=cas.g;loot.casKeptF=cas.f;
    defR.gold=(defR.gold||0)+cas.g;defR.food=(defR.food||0)+cas.f;
  }
  return loot;
}
let _lootMul=1;
const farmMul=b=>{const n=(b.farm||0)*Math.exp(-Math.max(0,g.simTime-(b.farmT||0))/21600);return Math.max(0.3,1-0.15*n);};
function doLoot(army,def,res,extra){
 let cap=extra||0;for(const n in army)cap+=army[n]*unitCap(n);
 const R=def.me?g:def.bot,prot=protectedAmt(def),lr=res.dLossRatio||0;
 const frac=Math.min(0.6,0.1+0.5*lr)*_lootMul;
 const pg=Math.floor(Math.max(0,R.gold-prot)*frac),pf=Math.floor(Math.max(0,R.food-prot)*frac),tot=pg+pf;
 const k=tot>0?Math.min(1,cap/tot):0,gi=Math.floor(pg*k),fi=Math.floor(pf*k);
 R.gold-=gi;R.food-=fi;
 return{g:gi,f:fi,pg:pg,pf:pf,lg:pg-gi,lf:pf-fi,cap:Math.floor(cap),frac:frac,lr:lr};
}
function detailedUnitLines(initialObj, lostObj, unitDict) {
  const keys = new Set([...Object.keys(initialObj), ...Object.keys(lostObj)]);
  let list = [];
  keys.forEach(n => {
    if(!unitDict[n]) return;
    const init = initialObj[n] || 0;
    const lost = lostObj[n] || 0;
    const kalan = Math.max(0, init - lost);
    if(init > 0 || lost > 0) {
      list.push(`${unitDict[n].icon || ''} ${n}: Başlangıç: ${init} | Kayıp: ${lost} | Kalan: ${kalan}`);
    }
  });
  return list.length ? list.join('\n') : '—';
}

function battleHtml(an, dn, r, loot, remain) {
  const defInitial = {};
  for(const n in r.defBefore) defInitial[n] = (r.defBefore[n] || 0);
  const structInitial = {};
  for(const n in r.structBefore) structInitial[n] = (r.structBefore[n] || 0);
  const attInitial = {};
  for(const n in r.sent) attInitial[n] = (r.sent[n] || 0);

  const aLossVal = lossValue(r.aLost, TROOPS);
  const dLossVal = lossValue(r.dLost, TROOPS) + lossValue(r.sLost, DEF);
  const ratio = r.A > 0 ? Math.round((r.A / Math.max(1, r.D)) * 100) : 0;

  let header = r.win
    ? `✅ <b style="color:#34d399">ZAFER</b> — ${esc(an)} kazandı`
    : `❌ <b style="color:#f87171">YENİLGİ</b> — ${esc(dn)} savundu`;

  let powerLine = `⚡ İlk tur gücü: Saldırı <b>${fmt(Math.floor(r.A||0))}</b>  vs  Savunma <b>${fmt(Math.floor(r.D||0))}</b>  (${ratio}%)`;
  powerLine += `\n🕒 Savaş süresi: <b>${r.rounds||1} tur</b> • Son güç: ${fmt(Math.floor(r.finalA||0))} vs ${fmt(Math.floor(r.finalD||0))}`;
  powerLine += `\n🎲 Savaş talihi: Saldıran %${Math.round((r.attackFortune||1)*100)} • Savunan %${Math.round((r.defenseFortune||1)*100)}`;
  if(r.endedBy==='round-limit') powerLine += `\n⏳ ${30} tur sonunda kalan güç karşılaştırıldı.`;
  if(r.endedBy==='attacker-broken') powerLine += `\n🛡️ Saldıran ordunun savaş gücü kritik seviyeye düştü; saldırı durduruldu.`;
  if(r.endedBy==='defender-broken') powerLine += `\n🏆 Savunanın ordusu ve savunma hattı etkisiz hale getirildi.`;
  if(r.endedBy==='decisive') powerLine += `\n⚔️ İki tarafın da savaş gücü kritik seviyeye düştü; kalan güç karşılaştırıldı.`;
  if(r.night) powerLine += `\n🌙 Gece savaşı (saldırı gücü düştü)`;
  const roundDetails=(r.roundLog||[]).map(x=>`Tur ${x.round}: Saldıran -${fmt(x.aLost)} • Savunan -${fmt(x.dLost)} • Yapılar -${fmt(x.sLost)}`).join('\n');

  let lootText = '';
  const casLine=`💀 <b>Kayıp ganimeti</b> (birim maliyetinin %40'ı)\n• Oluşan: ${fmt(loot.casG||0)}💰  ${fmt(loot.casF||0)}🍗\n`;
  if (r.win) {
    lootText = `🎁 <b>Depo ganimeti</b>\n` +
               `• Ortaya çıkan: ${fmt(loot.pg || 0)}💰  ${fmt(loot.pf || 0)}🍗\n` +
               `• Depodan taşınan: ${fmt(loot.depotG||0)}💰  ${fmt(loot.depotF||0)}🍗\n` +
               `• Depoda kalan (kapasite/koruma): ${fmt(loot.lg || 0)}💰  ${fmt(loot.lf || 0)}🍗\n` +
               `• Kağnı kapasitesi: ${fmt(loot.cap || 0)}\n\n` +
               casLine +
               `• Saldıranın aldığı kayıp ganimeti: <b>${fmt(loot.casTakenG||0)}💰  ${fmt(loot.casTakenF||0)}🍗</b>\n` +
               `• Savunanda kalan kayıp ganimeti: ${fmt(loot.casKeptG||0)}💰  ${fmt(loot.casKeptF||0)}🍗\n\n` +
               `📦 <b>Toplam ganimet (saldıran): ${fmt(loot.g)}💰  ${fmt(loot.f)}🍗</b>`;
  } else {
    const rg = remain && remain.g != null ? fmt(remain.g) : '?';
    const rf = remain && remain.f != null ? fmt(remain.f) : '?';
    lootText = `🛡️ <b>Savunan kazandı — depo ganimeti yok</b>\n` +
               casLine +
               `• Kayıp ganimeti savunanın kasasına eklendi: <b>${fmt(loot.casKeptG||0)}💰  ${fmt(loot.casKeptF||0)}🍗</b>\n` +
               `• Şehirde kalan kaynak: <b>${rg}💰  ${rf}🍗</b>`;
  }

  return `${header}\n${powerLine}\n\n<b>📜 Tur tur savaş raporu:</b>\n${roundDetails||'—'}\n\n` +
         `<b>⚔️ Saldıran:</b> ${esc(an)}\n` +
         `${detailedUnitLines(attInitial, r.aLost, TROOPS)}\n` +
         `📉 Kayıp değeri: <b>${fmt(aLossVal)}</b>\n\n` +
         `<b>🛡️ Savunan:</b> ${esc(dn)}\n` +
         `${detailedUnitLines(defInitial, r.dLost, TROOPS)}\n` +
         (Object.keys(structInitial).length ? `\n<b>🏰 Savunma Yapıları:</b>\n${detailedUnitLines(structInitial, r.sLost, DEF)}\n` : '') +
         `📉 Kayıp değeri: <b>${fmt(dLossVal)}</b>\n\n` +
         `${lootText}`;
}

function incomingBattleHtml(b, r, loot, remain){
  const defInitial = {};
  for(const n in r.defBefore) defInitial[n] = (r.defBefore[n] || 0);
  const structInitial = {};
  for(const n in r.structBefore) structInitial[n] = (r.structBefore[n] || 0);
  const attInitial = {};
  for(const n in r.sent) attInitial[n] = (r.sent[n] || 0);

  const aLossVal = lossValue(r.aLost, TROOPS);
  const dLossVal = lossValue(r.dLost, TROOPS) + lossValue(r.sLost, DEF);
  const ratio = r.A > 0 ? Math.round((r.A / Math.max(1, r.D)) * 100) : 0;

  // r.win = saldıran (bot) kazandı
  let header = r.win
    ? `⚠️ <b style="color:#f87171">SAVUNMA YARILDI</b> — ${esc(b.name)} kazandı`
    : `🛡️ <b style="color:#34d399">SALDIRI PÜSKÜRTÜLDÜ</b> — Sen savundun`;

  let powerLine = `⚡ İlk tur gücü: Saldırı <b>${fmt(Math.floor(r.A||0))}</b>  vs  Savunma <b>${fmt(Math.floor(r.D||0))}</b>  (${ratio}%)`;
  powerLine += `\n🕒 Savaş süresi: <b>${r.rounds||1} tur</b> • Son güç: ${fmt(Math.floor(r.finalA||0))} vs ${fmt(Math.floor(r.finalD||0))}`;
  powerLine += `\n🎲 Savaş talihi: Saldıran %${Math.round((r.attackFortune||1)*100)} • Savunan %${Math.round((r.defenseFortune||1)*100)}`;
  if(r.endedBy==='round-limit') powerLine += `\n⏳ ${30} tur sonunda kalan güç karşılaştırıldı.`;
  if(r.endedBy==='attacker-broken') powerLine += `\n🛡️ Saldıran ordunun savaş gücü kritik seviyeye düştü; saldırı durduruldu.`;
  if(r.endedBy==='defender-broken') powerLine += `\n🏆 Savunanın ordusu ve savunma hattı etkisiz hale getirildi.`;
  if(r.endedBy==='decisive') powerLine += `\n⚔️ İki tarafın da savaş gücü kritik seviyeye düştü; kalan güç karşılaştırıldı.`;
  if(r.night) powerLine += `\n🌙 Gece savaşı`;
  const roundDetails=(r.roundLog||[]).map(x=>`Tur ${x.round}: Saldıran -${fmt(x.aLost)} • Savunan -${fmt(x.dLost)} • Yapılar -${fmt(x.sLost)}`).join('\n');

  let lootText = '';
  const casLine=`💀 <b>Kayıp ganimeti</b> (birim maliyetinin %40'ı)\n• Oluşan: ${fmt(loot.casG||0)}💰  ${fmt(loot.casF||0)}🍗\n`;
  if (r.win) {
    lootText = `🎁 <b>Düşman ganimet aldı</b>\n` +
               `• Depodan: ${fmt(loot.depotG||0)}💰  ${fmt(loot.depotF||0)}🍗\n` +
               `• Kayıp ganimetinden aldığı: ${fmt(loot.casTakenG||0)}💰  ${fmt(loot.casTakenF||0)}🍗\n` +
               `• Sende kalan kayıp ganimeti: ${fmt(loot.casKeptG||0)}💰  ${fmt(loot.casKeptF||0)}🍗\n` +
               `• <b>Toplam götürülen: ${fmt(loot.g)}💰  ${fmt(loot.f)}🍗</b>`;
  } else {
    const rg = remain && remain.g != null ? fmt(remain.g) : '?';
    const rf = remain && remain.f != null ? fmt(remain.f) : '?';
    lootText = `🛡️ <b>Kaynakların güvende</b>\n` +
               casLine +
               `• Kayıp ganimeti senin kasana eklendi: <b>${fmt(loot.casKeptG||0)}💰  ${fmt(loot.casKeptF||0)}🍗</b>\n` +
               `• Şehirde kalan: <b>${rg}💰  ${rf}🍗</b>`;
  }

  return `${header}\n${powerLine}\n\n<b>📜 Tur tur savaş raporu:</b>\n${roundDetails||'—'}\n\n` +
         `<b>⚔️ Saldıran:</b> ${esc(b.name)}\n` +
         `${detailedUnitLines(attInitial, r.aLost, TROOPS)}\n` +
         `📉 Kayıp değeri: <b>${fmt(aLossVal)}</b>\n\n` +
         `<b>🛡️ Savunan:</b> Admin (Sen)\n` +
         `${detailedUnitLines(defInitial, r.dLost, TROOPS)}\n` +
         (Object.keys(structInitial).length ? `\n<b>🏰 Savunma Yapıları:</b>\n${detailedUnitLines(structInitial, r.sLost, DEF)}\n` : '') +
         `📉 Kayıp değeri: <b>${fmt(dLossVal)}</b>\n\n` +
         `${lootText}`;
}
function pushReport(r){r.id=r.id||(g.nextId++);r.time=clockStr();r.read=false;g.reports.unshift(r);for(let i=g.reports.length-1;i>=0&&g.reports.length>80;i--)if(g.reports[i].kind!=='request')g.reports.splice(i,1);g.unread=true;dirty=true;}
let suppressBattleFlash=false;
function showBattleFlash(won,title,summary){
  if(suppressBattleFlash)return;
  const col=won?'#34d399':'#f87171';
  const icon=won?'⚔️':'💀';
  openModal(`<div style="text-align:center;padding:12px 4px">
    <div style="font-size:48px;line-height:1.2">${icon}</div>
    <h2 style="color:${col};margin:8px 0">${esc(title)}</h2>
    <p class="small" style="line-height:1.5;margin-bottom:14px">${esc(summary)}</p>
    <button class="btn gold full" onclick="closeModal();switchTab('mesaj')">Raporu Aç</button>
    <button class="btn full" style="margin-top:8px" onclick="closeModal()">Kapat</button>
  </div>`);
  if(g.audioMode!=='off')beep(won?'market':'attack');
  if(g.notify&&navigator.vibrate){try{navigator.vibrate(won?[40,30,40]:[80,40,80]);}catch(e){}}
}
function checkWeeklyReset(){
  const week=Math.floor(g.simTime/604800);
  if((g.weekly.week||0)!==week)g.weekly={week,attackWins:0,spies:0,claimed:{}};
}
const WEEKLY_QUESTS=[
  {id:'w1',t:'Bu hafta 5 zafer kazan',c:()=>(g.weekly.attackWins||0)>=5,r:[5000,5000]},
  {id:'w2',t:'Bu hafta 10 casusluk yap',c:()=>(g.weekly.spies||0)>=10,r:[4000,4000]},
  {id:'w3',t:'Bu hafta 15 zafer kazan',c:()=>(g.weekly.attackWins||0)>=15,r:[12000,12000]}
];
function claimWeekly(id){
  checkWeeklyReset();
  const q=WEEKLY_QUESTS.find(x=>x.id===id);
  if(!q||g.weekly.claimed[id]||!q.c())return;
  g.weekly.claimed[id]=true;g.gold+=q.r[0];g.food+=q.r[1];
  toast(`📅 Haftalık ödül: +${fmt(q.r[0])}💰 +${fmt(q.r[1])}🍗`);refresh();
}
function setAudioMode(m){g.audioMode=m;g.audio=m!=='off';refresh();toast('Ses: '+(m==='off'?'Kapalı':m==='low'?'Düşük':'Tam'));}
function renamePreset(idx){
  const p=g.presets[idx];if(!p)return;
  const n=prompt('Şablon adı:',p.name);if(!n)return;
  p.name=n.trim().slice(0,16);dirty=true;refresh();
}
const pName=()=>g.playerName||'Admin';
function setPlayerName(){const n=prompt('Oyuncu adı (max 14):',pName());if(n===null)return;const c=n.replace(/[<>&'"`\\]/g,'').trim().slice(0,14);if(!c)return;g.playerName=c;dirty=true;refresh();}
function setHeroName(){
  const n=prompt('Kahraman adı (max 16):',(g.hero&&g.hero.name)||'Kahraman');
  if(!n)return;g.hero.name=n.trim().slice(0,16);dirty=true;refresh();
}
function setHeroTrait(t){g.hero.trait=t;dirty=true;refresh();toast(t==='atk'?'🗡️ Saldırı odaklı kahraman':'🛡️ Savunma odaklı kahraman');}
function sendAllyChat(){
  if(!g.alliance.name)return;
  const el=$('ally-chat-in');if(!el)return;
  const msg=el.value.trim().slice(0,120);if(!msg)return;
  g.allyChat=g.allyChat||[];
  g.allyChat.push({t:clockStr(),name:pName(),msg});
  if(g.allyChat.length>40)g.allyChat=g.allyChat.slice(-40);
  el.value='';dirty=true;refresh();
}

/* =====================  BOT YAPAY ZEKÂSI  ===================== */
/* =====================  BOT YAPAY ZEKÂ v2  =====================
   - Oyuncu gibi KUYRUK kullanır: inşaat kuyruğu + araştırma + eğitim kuyruğu aynı anda çalışır
   - Kaynağı bekletmez: gelir gelir harcar (hem puan hem ganimete karşı koruma)
   - İleriye dönük: her yatırımı "geri dönüş süresi"ne göre seçer, kale/yapı sınırını önceden planlar,
     pahalı hedef için tasarruf eder (rezerv), fazla kaynağı pazarda dengeler
   - Oyuncunun ordu gücüne ve kendisine yapılan baskınlara göre savunma planlar
   - Saldırıyı net kâra (ganimet - kayıp) göre seçer */
const BOT_AI={H:72,maxWait:7200,qBuild:{kolay:1,orta:3,zor:3,cokzor:3,hard:3},qTrain:{kolay:2,orta:3,zor:4,cokzor:4,hard:4},
 armyFill:{warrior:.9,turtle:.65,builder:.4},armyU:{warrior:1.5,turtle:1.0,builder:.7},
 tgt:{warrior:{kisla:12,akademi:8,mimarhane:6,gecit:4},builder:{kisla:6,akademi:6,mimarhane:8,gecit:0},turtle:{kisla:8,akademi:6,mimarhane:5,gecit:0}}};
/* Casusluk sisi: botun casusluğu senden yüksekse net görür, düşükse tahmini bulanık, çok düşükse hedefi göremez */
const botFogSigma=d=>d>=2?0:d===1?.08:d===0?.2:d===-1?.35:d===-2?.5:.65;
function botFogNoise(b,salt){const k=(((b.id*7919+salt*104729+Math.floor(g.simTime/1800)*15485863)%1000003)*9301+49297)%233280;return k/116640-1;}
const botMult=(b,d)=>(allyLevel(b.alliance)>=2?1.15:1)*b.skill*d.skill;
function botInit(b){
 if(b.ai===2)return;b.ai=2;
 b.buildQueue=b.buildQueue||[];
 if(b.construction){b.buildQueue.unshift({key:b.construction.key,timeLeft:b.construction.timeLeft,total:b.construction.timeLeft});b.construction=null;}
 b.trainQueue=b.trainQueue||[];
 if(b.trainTask){b.trainQueue.unshift(b.trainTask);b.trainTask=null;}
 b.threat=b.threat||0;b.threatT=b.threatT||g.simTime;b.wake=0;b.raids=b.raids||0;
}
/* Oyuncunun toplam saldırı gücü (tüm şehirler + seferdekiler) — 2 dakikada bir yenilenir */
let _pIntel={t:-1e9,atk:0,by:{}};
function playerIntel(){
 if(g.simTime-_pIntel.t<120)return _pIntel;
 const tot={},add=o=>{for(const n in (o||{}))if(TROOPS[n]&&o[n]>0)tot[n]=(tot[n]||0)+o[n];};
 add(g.myTroops);(g.cities||[]).forEach(c=>{if(c.id!==g.activeCityId)add(c.myTroops);});(g.marches||[]).forEach(m=>add(m.troops));
 const cp=classPower(playerSide(),tot,'atk');
 return _pIntel={t:g.simTime,atk:cp.tot,by:cp.by};
}
function botNoteRaid(b,w){botInit(b);const tn=g.simTime;b.threat=botThreat(b,tn)+w;b.threatT=tn;b.raids=(b.raids||0)+1;b.wake=0;}
function botThreat(b,tn){return (b.threat||0)*Math.exp(-Math.max(0,tn-(b.threatT||tn))/43200);}
const botDefPower=b=>{const s=botSide(b);return predict({},s,s,false).D;};
function botSup(b){let s=0;for(const n in b.troops)if(TROOPS[n])s+=b.troops[n]*TROOPS[n].sup;for(const x of b.trainQueue)if(!x.def&&TROOPS[x.name])s+=x.count*TROOPS[x.name].sup;return s;}

function botCtx(b,d,tn){
 const m=botMult(b,d),side=botSide(b),thr=botThreat(b,tn);
 const sg=botFogSigma(botSpy(b)-mySpy()),it0=playerIntel(),it=sg>=.5?{atk:it0.atk*(1+sg*botFogNoise(b,1)),by:{}}:{atk:it0.atk*(1+sg*botFogNoise(b,1)),by:it0.by};
 const gr=goldRate(b.lv.maden,m*d.gold),fr=foodRate(b.lv.ciftlik,m*d.food);
 let tv=0,dv=0,pend=0;const cls={};
 for(const n in b.troops){const u=TROOPS[n];if(!u||u.cls==='cart'||u.cls==='spy')continue;const v=b.troops[n]*(u.g+u.f);tv+=v;cls[u.cls]=(cls[u.cls]||0)+v;}
 for(const n in b.defs)if(DEF[n])dv+=b.defs[n]*(DEF[n].g+DEF[n].f);
 const kale=b.lv.kale||1,str=n=>side.str(n);
 for(const x of b.trainQueue){
  if(x.def&&DEF[x.name]){dv+=x.count*(DEF[x.name].g+DEF[x.name].f);pend+=x.count*DEF[x.name].def*str(x.name)*(1+0.04*kale);}
  else if(TROOPS[x.name]){const u=TROOPS[x.name];if(u.cls!=='cart'&&u.cls!=='spy'){tv+=x.count*(u.g+u.f);cls[u.cls]=(cls[u.cls]||0)+x.count*(u.g+u.f);pend+=x.count*u.def*side.def()*(1+0.04*kale);}}
 }
 const D=botDefPower(b)+pend;
 /* hedef savunma: oyuncunun ordusuna oranlı (zorluğa & maruz kalınan baskına göre) ya da servete oranlı taban */
 const need=Math.max(0.05*b.spent+20,it.atk*0.5*d.def*d.def*(1+0.5*Math.min(2,thr)));
 const cap=supplyCap(b.lv),used=botSup(b);
 return{m,gr,fr,side,it,thr,D,need,tv,dv,cls,cap,used,left:cap-used,H:BOT_AI.H,
  share:(tv+dv)/(b.spent+2000),maxShare:0.5+0.1*Math.min(3,thr),kale,
  deficit:Math.max(0,Math.min(1,(need-D)/need)),d};
}
function botEcoU(b,ctx,k,l){
 const c=buildCostAt(k,l),d=ctx.d;
 const dInc=k==='maden'?100*(curve(l+1)-curve(l))*ctx.m*d.gold:130*(curve(l+1)-curve(l))*ctx.m*d.food;
 const ratio=ctx.fr/Math.max(1,ctx.gr);/* ideal yemek/altın ≈ 1.2 */
 const adj=Math.pow(Math.min(2.5,Math.max(.4,k==='maden'?ratio/1.2:1.2/ratio)),.8);
 return dInc*ctx.H/(c.g+c.f)*adj;
}
function botBuildCands(b,ctx,out){
 const d=ctx.d,q=b.buildQueue,mim=Math.max(0.2,1-0.04*(b.lv.mimarhane||0)),T=BOT_AI.tgt[b.pers];
 const lim=(b.lv.kale||1)*10;let tot=0;for(const k in b.lv)if(k!=='akademi')tot+=b.lv[k]||0;
 for(const x of q)if(x.key!=='akademi'&&x.key!=='kale')tot++;
 const room=lim-tot;
 const ecoU={};let ecoPot=0;
 for(const k of['ciftlik','maden']){const l=(b.lv[k]||0)+(q.some(x=>x.key===k)?1:0);if(l>=BUILD[k].max)continue;ecoU[k]=botEcoU(b,ctx,k,l);ecoPot=Math.max(ecoPot,ecoU[k]);}
 const exposure=Math.max(ctx.gr,ctx.fr)*2;/* ~2 saatlik üretim çalınabilir stok sayılır */
 const magNeed=Math.ceil(exposure/(400*(1+0.15*botRl(b,'Yurt Tutma'))));
 for(const k in BUILD){
  if(k==='mabet')continue;
  const B=BUILD[k];if(q.some(x=>x.key===k))continue;
  const l=(b.lv[k]||0);if(l>=B.max)continue;
  let ok=true;for(const r in B.req)if((b.lv[r]||0)<B.req[r])ok=false;if(!ok)continue;
  if(k!=='kale'&&k!=='akademi'&&room<=0)continue;
  let u=0;
  if(k==='ciftlik'||k==='maden')u=ecoU[k]||0;
  else if(k==='kale'){u=Math.max(ecoPot,2)*(room<=0?3:room===1?1.5:room===2?.9:.3);if(l>=BUILD.kale.max)continue;}
  else if(k==='kisla')u=l<Math.min(T.kisla,2+2*(b.lv.akademi||0))?1.6*(1+2*ctx.deficit):.2;/* birimler araştırma ister: kışla akademiyi geçmesin */
  else if(k==='akademi')u=l<T.akademi?(l*2<(b.lv.kisla||0)+2?1.9:1.3):.15;
  else if(k==='mimarhane')u=l<T.mimarhane?1.0:.1;
  else if(k==='magara')u=l<magNeed?(0.8+1.5*Math.min(2,ctx.thr)):.05;
  else if(k==='gecit')u=l<T.gecit?.7:0;
  if(u<=0)continue;
  const c=buildCostAt(k,l),t=Math.max(8,Math.floor(buildTimeAt(k,l)*0.75/d.build*mim));
  out.push({kind:'build',key:k,u,cg:c.g,cf:c.f,t,soft:false});
 }
}
function botResearchCands(b,ctx,out){
 const d=ctx.d;if(b.researchTask||b.buildQueue.some(x=>x.key==='akademi'))return;
 const ak=b.lv.akademi||0;if(ak<1)return;
 const rm=Math.max(0.2,1-0.04*ak);
 const vTar=names=>names.reduce((s,n)=>s+((b.troops[n]||0)+(b.trainQueue.reduce((z,x)=>z+(x.name===n&&!x.def?x.count:0),0)))*(TROOPS[n].g+TROOPS[n].f),0);
 /* birim açma ihtiyacı: kışlası yeten ama araştırması eksik birimler */
 const unlock={};
 for(const n in TROOPS){const u=TROOPS[n];if(u.cls==='cart'||u.cls==='spy'||(b.lv.kisla||0)<u.req.kisla)continue;for(const r in (u.req.res||{}))if(botRl(b,r)<u.req.res[r])unlock[r]=Math.max(unlock[r]||0,u.atk+u.def);}
 for(const n in RES){
  const R=RES[n],l=botRl(b,n);if(ak<R.ak||l>=R.max)continue;
  const cg=Math.floor((120+30*R.ak)*Math.pow(1.45,l)),cf=Math.floor((100+25*R.ak)*Math.pow(1.45,l)),cost=cg+cf;
  let ben=0;
  if(R.k==='atk')ben=R.pct/100*vTar(R.targets)*(b.pers==='warrior'?.8:.4)+(l<2?R.pct*3:0);
  else if(R.k==='def')ben=0.08*ctx.tv*.9+(l<1?30:0);
  else if(R.k==='struct')ben=0.10*ctx.dv;
  else if(R.k==='tilsim')ben=0.10*(b.defs['Tılsım Kalkanı']||0)*(DEF['Tılsım Kalkanı'].g+DEF['Tılsım Kalkanı'].f);
  else if(R.k==='loss')ben=0.05*(ctx.tv+ctx.dv)*.15;
  else if(R.k==='cave')ben=0.15*400*(b.lv.magara||0)*.5;
  else if(R.k==='spy')ben=l<5?0.015*b.spent*(b.pers==='warrior'?1.3:1):0;
  let u=ben*1.5/cost;
  if(unlock[n]&&l<5)u=Math.max(u,1.4);
  if(u<=0.05)continue;
  out.push({kind:'res',key:n,u,cg,cf,t:Math.max(10,Math.floor((60+20*R.ak)*Math.pow(1.25,l)*0.7*rm/d.build)),soft:false});
 }
}
function botPickTroop(b,ctx,units,mode){
 const p=b.pers,wa=mode==='def'?0.25:(p==='warrior'?1:p==='builder'?.5:.35),wd=mode==='def'?1:(p==='warrior'?.5:p==='builder'?.7:1);
 const supBound=ctx.left<ctx.cap*0.3,tvv=Math.max(1,ctx.tv);let best=null,bs=-1;
 for(const n of units){
  const u=TROOPS[n],cost=u.g+u.f;
  const pw=wa*u.atk*ctx.side.atk(n)+wd*u.def*ctx.side.def();
  const share=(ctx.cls[u.cls]||0)/tvv,div=share>0.5?1-0.8*(share-0.5):1;
  const cnt=ctx.it.atk>0?Math.max(0.6,clsMod(u.cls,ctx.it.by,ctx.it.atk)):1;
  const s=pw/(cost+(supBound?160:40)*u.sup)*div*(mode==='def'?cnt:1);
  if(s>bs){bs=s;best=n;}
 }
 return best;
}
function botArmyCands(b,ctx,out){
 const d=ctx.d,kis=b.lv.kisla||0;if(kis<1)return;
 const units=botUnits(b);
 const fill=BOT_AI.armyFill[b.pers],fr=ctx.used/Math.max(1,ctx.cap);
 const over=ctx.share>ctx.maxShare;
 const tq=b.trainQueue;
 /* kağnı (ganimet taşıyıcı) */
 const carts=(b.troops['Kağnı']||0)+tq.reduce((z,x)=>z+(x.name==='Kağnı'?x.count:0),0);
 const combat=Object.keys(b.troops).reduce((z,n)=>z+(TROOPS[n]&&TROOPS[n].cls!=='cart'&&TROOPS[n].cls!=='spy'?b.troops[n]:0),0);
 const wantC=Math.ceil(combat*(b.pers==='warrior'?.15:b.pers==='builder'?.1:.04));
 if(carts<wantC&&ctx.left>0){const u=TROOPS['Kağnı'];out.push({kind:'troop',key:'Kağnı',u:0.9*BOT_AI.armyU[b.pers],unit:u,n:Math.min(wantC-carts,ctx.left,40),soft:true});}
 /* savaş birimi */
 if(units.length&&fr<fill&&ctx.left>0&&!over){
  const n=botPickTroop(b,ctx,units,ctx.deficit>0.3?'def':'mix');
  if(n){const u=TROOPS[n];const maxB=Math.max(4,Math.ceil(ctx.cap*0.12/u.sup));
   out.push({kind:'troop',key:n,u:BOT_AI.armyU[b.pers]*(1-fr/fill)*(1+1.5*ctx.deficit)*(1+0.5*Math.min(2,ctx.thr)),unit:u,n:Math.min(maxB,Math.floor(ctx.left/u.sup)),soft:true});}
 }
 /* savunma yapıları */
 const capD=(b.lv.kale||1)*10;
 let bd=null,be=-1;
 for(const n in DEF){const D=DEF[n];if((b.lv.kale||1)<D.kale)continue;let ok=true;for(const r in (D.res||{}))if(botRl(b,r)<D.res[r])ok=false;if(!ok)continue;
  const have=(b.defs[n]||0)+tq.reduce((z,x)=>z+(x.def&&x.name===n?x.count:0),0);if(have>=capD)continue;
  const e=D.def*ctx.side.str(n)/(D.g+D.f);if(e>be){be=e;bd=n;}}
 if(bd){
  const D=DEF[bd],have=(b.defs[bd]||0)+tq.reduce((z,x)=>z+(x.def&&x.name===bd?x.count:0),0);
  const per=D.def*ctx.side.str(bd)*(1+0.04*ctx.kale);
  const nn=Math.min(capD-have,Math.max(2,Math.ceil(Math.max(0,ctx.need-ctx.D)/per)),80);
  const u=over?0.1:(ctx.deficit*Math.max(2,1.6*ctx.deficit*3)+(ctx.D<ctx.need?0.3:0.15)*BOT_AI.armyU[b.pers]);
  if(nn>0)out.push({kind:'def',key:bd,u,unit:D,n:nn,soft:true});
 }
}
function botBuy(b,c,tn){
 if(c.kind==='build'){b.gold-=c.cg;b.food-=c.cf;b.spent+=c.cg+c.cf;b.buildQueue.push({key:c.key,timeLeft:c.t,total:c.t});}
 else if(c.kind==='res'){b.gold-=c.cg;b.food-=c.cf;b.spent+=c.cg+c.cf;b.researchTask={name:c.key,timeLeft:c.t,total:c.t};}
 else{const u=c.unit,n=c.n,cg=u.g*n,cf=u.f*n;b.gold-=cg;b.food-=cf;b.spent+=cg+cf;
  b.trainQueue.push({name:c.key,count:n,def:c.kind==='def',timeLeft:Math.max(5,Math.ceil(u.t*n*0.5*Math.max(0.3,1-0.035*(b.lv.kisla||0)))) });}
}
/* Pazar: biri bol diğeri kıt ise hedef için takas (oyuncudakiyle aynı kayıp oranı) */
function botMarket(b,c,ctx){
 const mg=c.cg-b.gold,mf=c.cf-b.food;
 if(mg>0&&mf<=0){const spare=b.food-c.cf-50;const need=Math.ceil(mg/0.76)+1;if(spare>=need&&need>=100){b.food-=need;b.gold+=Math.floor(need*0.76);return true;}}
 else if(mf>0&&mg<=0){const spare=b.gold-c.cg-50;const need=Math.ceil(mf/0.8)+1;if(spare>=need&&need>=100){b.gold-=need;b.food+=Math.floor(need*0.8);return true;}}
 return false;
}
function botThink(b,tn){
 const d=botDiff(b),q=b.buildQueue,tq=b.trainQueue;
 const canB=q.length<BOT_AI.qBuild[b.difficulty||g.botDifficulty||'orta'];
 const canR=!b.researchTask&&!q.some(x=>x.key==='akademi');
 const canT=tq.length<BOT_AI.qTrain[b.difficulty||g.botDifficulty||'orta'];
 if(!canB&&!canR&&!canT){b.wake=1e15;return;}
 for(let guard=0;guard<10;guard++){
  const ctx=botCtx(b,d,tn),C=[];
  if(canB&&q.length<BOT_AI.qBuild[b.difficulty||g.botDifficulty||'orta'])botBuildCands(b,ctx,C);
  if(canR&&!b.researchTask)botResearchCands(b,ctx,C);
  if(canT&&tq.length<BOT_AI.qTrain[b.difficulty||g.botDifficulty||'orta'])botArmyCands(b,ctx,C);
  if(!C.length){b.wake=tn+900;return;}
  C.sort((x,y)=>y.u-x.u);
  let done=false,reserve=null,eta=600;
  for(const c of C){
   if(c.soft){/* birlik/savunma: rezerve saygı göster, miktarı sığdır */
    const u=c.unit;let n=c.n;
    const gA=b.gold-(reserve?reserve.g:0),fA=b.food-(reserve?reserve.f:0);
    n=Math.min(n,Math.floor(gA/u.g),Math.floor(fA/u.f));
    if(n>=Math.min(c.n,3)&&n>=1){c.n=n;botBuy(b,c,tn);done=true;break;}
    continue;
   }
   const okG=b.gold-c.cg>=(reserve?reserve.g:0),okF=b.food-c.cf>=(reserve?reserve.f:0);
   /* ucuz ama değerli iş (≈10 dk gelirden azı) rezervi geçebilir; yoksa akademi gibi ucuz yapılar hiç alınamaz */
   const cheap=b.gold>=c.cg&&b.food>=c.cf&&(c.cg+c.cf)/(ctx.gr+ctx.fr)*3600<=600;
   if((okG&&okF)||cheap){botBuy(b,c,tn);done=true;break;}
   if(!reserve){
    const e=Math.max(Math.max(0,c.cg-b.gold)/ctx.gr,Math.max(0,c.cf-b.food)/ctx.fr)*3600;
    if(e<=BOT_AI.maxWait){
     if(e>300&&botMarket(b,c,ctx)){done=true;break;}
     reserve={g:c.cg,f:c.cf};eta=e;
    }
   }
  }
  if(!done){b.need=(reserve&&eta>900)?{g:Math.max(0,reserve.g-b.gold),f:Math.max(0,reserve.f-b.food),t:tn}:null;b.wake=tn+Math.max(15,Math.min(eta,900));return;}
 }
}
/* Üretim + görev ilerletme (olay tabanlı: görev bittiği anda bir sonrakine geçer) */
function botProgress(b,step){
 const q=b.buildQueue;
 if(q.length){q[0].timeLeft-=step;while(q.length&&q[0].timeLeft<=0){const x=q.shift();b.lv[x.key]=(b.lv[x.key]||0)+1;b.wake=0;if(q.length)q[0].timeLeft+=x.timeLeft;}}
 const r=b.researchTask;
 if(r){r.timeLeft-=step;if(r.timeLeft<=0){b.research=b.research||{};b.research[r.name]=(b.research[r.name]||0)+1;b.tech=Math.min(20,Object.values(b.research).reduce((s,x)=>s+(x||0),0));b.researchTask=null;b.wake=0;}}
 const tq=b.trainQueue;
 if(tq.length){tq[0].timeLeft-=step;while(tq.length&&tq[0].timeLeft<=0){const x=tq.shift();if(x.def)b.defs[x.name]=(b.defs[x.name]||0)+x.count;else b.troops[x.name]=(b.troops[x.name]||0)+x.count;b.wake=0;if(tq.length)tq[0].timeLeft+=x.timeLeft;}}
}
function botAdvance(b,dt,t0){
 const d=botDiff(b);let rem=dt,el=0,guard=0;
 while(rem>0){
  const tn=t0+el;
  if(tn>=b.wake)botThink(b,tn);
  let step=rem;
  if(guard++<400){
   const c=[];if(b.buildQueue.length)c.push(b.buildQueue[0].timeLeft);if(b.researchTask)c.push(b.researchTask.timeLeft);if(b.trainQueue.length)c.push(b.trainQueue[0].timeLeft);
   if(b.wake>tn&&b.wake<1e14)c.push(b.wake-tn);
   for(const x of c)if(x>0&&x<step)step=x;
   step=Math.max(1,step);if(step>rem)step=rem;
  }
  const m=botMult(b,d);
  b.gold+=goldRate(b.lv.maden,m*d.gold)*step/3600;b.food+=foodRate(b.lv.ciftlik,m*d.food)*step/3600;
  botProgress(b,step);rem-=step;el+=step;
 }
}
function botStep(dt){
 const now=g.simTime,t0=now-g.botAcc;
 for(const b of g.bots){
  botInit(b);
  if(b.alliance){const a=allyEntry(b.alliance);if(a)a.donated+=dt*0.012;}
  botAdvance(b,dt,t0);
  if(now>=b.nextAtk&&Object.keys(b.troops).length&&Math.random()<1-Math.exp(-dt/200))botTryAttack(b,now);
  if(g.alliance.name&&!b.alliance&&Math.random()<0.00001*dt)botJoinRequest(b);
 }
 for(const a of g.alliances){botAllyAid(a,now);botAllyOps(a,now);}
}

/* ===== İTTİFAK: kaynak yardımı + ortak saldırı ===== */
function botAllyAid(a,now){
 if(now<(a.aidAt||0))return;a.aidAt=now+600;
 const mem=g.bots.filter(b=>b.alliance===a.name);if(mem.length<2)return;
 let nb=null,nv=0;
 for(const m of mem){if(m.need&&now-m.need.t<3600){const v=m.need.g+m.need.f;if(v>nv){nv=v;nb=m;}}}
 if(!nb)return;
 let donor=null,dv=0,dg=0,df=0;
 for(const m of mem){
  if(m===nb||(m.need&&now-m.need.t<3600))continue;
  const d=botDiff(m),mm=botMult(m,d),sG=m.gold-0.5*goldRate(m.lv.maden,mm*d.gold),sF=m.food-0.5*foodRate(m.lv.ciftlik,mm*d.food);
  const gg=Math.min(Math.max(0,sG)*0.5,nb.need.g*1.1),ff=Math.min(Math.max(0,sF)*0.5,nb.need.f*1.1);
  if(gg+ff>dv){dv=gg+ff;donor=m;dg=gg;df=ff;}
 }
 if(!donor||dv<200)return;
 g.stats.botAid=(g.stats.botAid||0)+1; dg=Math.floor(dg);df=Math.floor(df);donor.gold-=dg;donor.food-=df;nb.gold+=dg;nb.food+=df;nb.wake=0;
 if(a.name===g.alliance.name){g.allyChat=g.allyChat||[];g.allyChat.push({t:clockStr(),name:donor.name,msg:`${nb.name} oyuncusuna ${fmt(dg)}💰 ${fmt(df)}🍗 yardım gönderdi.`});if(g.allyChat.length>40)g.allyChat=g.allyChat.slice(-40);}
}
function botCoalReturn(a,army){
 const ids=Object.keys(a.contrib).map(Number),L=g.bots.find(x=>x.id===a.botId);
 for(const n in army){
  let tot=0;ids.forEach(i=>tot+=(a.contrib[i][n]||0));if(!tot)continue;
  let left=army[n];
  ids.forEach(i=>{const m=g.bots.find(x=>x.id===i);if(!m)return;const k=Math.floor(army[n]*(a.contrib[i][n]||0)/tot);if(k>0){m.troops[n]=(m.troops[n]||0)+k;left-=k;}});
  if(left>0&&L)L.troops[n]=(L.troops[n]||0)+left;
 }
 ids.forEach(i=>{const m=g.bots.find(x=>x.id===i);if(m){m.wake=0;}});
}
function botCoalLoot(a,lg,lf){
 const ids=Object.keys(a.contrib).map(Number),w={};let T=0;
 ids.forEach(i=>{let v=0;for(const n in a.contrib[i])if(TROOPS[n])v+=a.contrib[i][n]*(TROOPS[n].g+TROOPS[n].f);w[i]=v;T+=v;});
 ids.forEach(i=>{const m=g.bots.find(x=>x.id===i);if(!m||!T)return;m.gold+=Math.floor(lg*w[i]/T);m.food+=Math.floor(lf*w[i]/T);});
}
function botAllyOps(a,now){
 if(now<(a.opsAt||0))return;
 const mem=g.bots.filter(b=>b.alliance===a.name);
 if(mem.length<2||a.name===g.alliance.name){a.opsAt=now+3600;return;}
 const tot={},contrib={},part=[];
 for(const m of mem){
  const c={};let pw=0;
  for(const n in m.troops){const u=TROOPS[n];if(!u||u.cls==='spy')continue;const cnt=m.troops[n];if(!(cnt>0))continue;const k=Math.floor(cnt*(u.cls==='cart'?0.4:0.65));if(k>0){c[n]=k;if(u.cls!=='cart')pw+=k*u.sup;}}
  if(pw>=8){contrib[m.id]=c;for(const n in c)tot[n]=(tot[n]||0)+c[n];part.push(m);}
 }
 if(part.length<2){a.opsAt=now+900+Math.random()*900;return;}
 let L=part[0],lp=-1;for(const m of part){const p=classPower(botSide(m),contrib[m.id],'atk').tot;if(p>lp){lp=p;L=m;}}
 const att=botSide(L),night=isNight(),cands=[];
 if(a.name!==g.alliance.name&&g.simTime-(g.createdAt||0)>=21600){storeActiveCity();(g.cities||[]).forEach(city=>cands.push({playerCity:city}));}
 const pool=g.bots.filter(t=>t.alliance!==a.name);
 pool.sort((x,y)=>botDist(x,L)-botDist(y,L));
 for(let i=0;i<Math.min(8,pool.length);i++)cands.push(pool[i]);
 let best=null,bestNet=0;
 for(const c of cands){
  const isP=!!c.playerCity,def=isP?citySide(c.playerCity):botSide(c);
  const sd=botSpy(L)-(isP?mySpy():botSpy(c)),sg=botFogSigma(sd),nz=botFogNoise(L,isP?2000+c.playerCity.id:c.id+500);
  if(isP&&sd<=-3&&nz>-0.2)continue;
  const fm=Math.max(0.2,1+sg*nz),thr=isP?1.5:1.3;
  const p=predict(tot,att,def,night);if(!(p.A>=thr*p.D*fm))continue;
  /* tek bot zaten yapabiliyorsa ortak saldırıya gerek yok */
  let solo=false;for(const m of part){const ar=botPickArmy(m,def,thr,night,fm);if(ar){solo=true;break;}}
  if(solo)continue;
  const r=Math.min(0.999,p.D*fm/p.A);let cap=0,val=0;
  for(const n in tot){cap+=tot[n]*unitCap(n);if(TROOPS[n])val+=tot[n]*(TROOPS[n].g+TROOPS[n].f);}
  const R=isP?(c.playerCity.id===g.activeCityId?g:c.playerCity):c,prot=isP?cityProt(c.playerCity):protectedAmt(def),frac=Math.min(0.6,0.1+0.5*Math.min(1,0.5+0.4*(1-r)));
  const net=Math.min(cap,frac*(Math.max(0,(R.gold||0)-prot)+Math.max(0,(R.food||0)-prot)))-0.8*Math.pow(r,1.5)*att.loss*val;
  if(net>bestNet&&net>0.02*val){bestNet=net;best=c;}
 }
 if(!best){a.opsAt=now+1200+Math.random()*1800;return;}
 for(const m of part){for(const n in contrib[m.id])m.troops[n]=Math.max(0,(m.troops[n]||0)-contrib[m.id][n]);clean(m.troops);m.nextAtk=now+1800+Math.random()*1800;m.wake=0;}
 a.opsAt=now+5400+Math.random()*3600;
 if(best.playerCity){
  const city=best.playerCity,dc=Math.abs((L.continent||1)-(city.continent||1)),dr=Math.abs((L.row||1)-(city.row||1));
  const distance=Math.max(1,dc*10+dr),speed=Math.max(0.35,1-0.03*(L.lv.gecit||0)),eta=Math.max(60,Math.ceil(distance*90*speed))+60;
  const nm=`${a.name} İttifakı (${L.name} +${part.length-1})`;
  g.incomingAttacks.push({id:g.nextId++,botId:L.id,botName:nm,targetCityId:city.id,targetCityName:city.name,continent:city.continent,row:city.row,troops:tot,contrib,attackerSpyLevel:botSpy(L),defenderSpyLevel:mySpy(),timeLeft:eta,totalTime:eta,launchedAt:now});
  g.incomingAttacks.sort((x,y)=>(Number(x.timeLeft)||0)-(Number(y.timeLeft)||0));
  notifyEvent('⚔️ ORTAK SALDIRI',`${nm}, ${city.name} şehrine saldırı başlattı! ${formatTime(eta)} sonra ulaşacak.`);
  dirty=true;if(ui.tab==='sehir'||ui.tab==='komuta')renderCurrent();
 }else{
  const def=botSide(best),army=Object.assign({},tot),res=fight(army,att,def,night);
  const fake={botId:L.id,contrib};botCoalReturn(fake,army);
  if(res.win){const lt=doLoot(army,def,res,0);botCoalLoot(fake,lt.g,lt.f);botNoteRaid(best,1);}
 }
}
function botLoop(){const st=Math.max(10,Math.ceil(g.botAcc/120));while(g.botAcc>=st){botStep(st);g.botAcc-=st;}}
function botJoinRequest(b){
 if(g.reports.filter(r=>r.kind==='request').length>=5)return;
 if(g.reports.some(r=>r.kind==='request'&&r.botId===b.id))return;
 if(allyMembers(g.alliance.name)>=20)return;
 pushReport({kind:'request',botId:b.id,title:`🛡️ İttifak isteği: ${b.name}`,summary:`${b.name} ittifakına katılmak istiyor.`,html:`<b>${esc(b.name)}</b> adlı oyuncu <b>${esc(g.alliance.name)}</b> ittifakına katılmak istiyor.`});
}
function botUnits(b){
 return Object.keys(TROOPS).filter(n=>{
  const u=TROOPS[n];if(u.cls==='spy'||u.cls==='cart')return false;
  if((b.lv.kisla||0)<u.req.kisla)return false;
  // Birim gereksinimleri botun kendi araştırmasına bakılır
  for(const r in (u.req.res||{}))if(botRl(b,r)<u.req.res[r])return false;
  return true;
 });
}
function botPickArmy(b,def,thr,night,fm){fm=fm||1;
  /* Tüm orduyu gönderme — hedefe yetecek kadar + biraz kağnı, evde rezerv bırak */
  const att=botSide(b);
  const combat=Object.keys(b.troops||{}).filter(n=>TROOPS[n]&&TROOPS[n].cls!=='spy'&&TROOPS[n].cls!=='cart'&&(b.troops[n]||0)>0);
  if(!combat.length)return null;
  const fractions=[0.35,0.5,0.65,0.8,0.95];
  let bestArmy=null,bestR=0;
  for(const fr of fractions){
    const army={};
    combat.forEach(n=>{const c=Math.floor((b.troops[n]||0)*fr);if(c>0)army[n]=c;});
    const carts=b.troops['Kağnı']||0;
    if(carts>0)army['Kağnı']=Math.max(1,Math.min(carts,Math.ceil(carts*0.4)));
    if(!Object.keys(army).filter(n=>n!=='Kağnı').length)continue;
    const p=predict(army,att,def,night);const ratio=p.D>0?p.A/(p.D*fm):99;
    if(ratio>=thr&&ratio>bestR){bestR=ratio;bestArmy=army;}
    if(ratio>=thr*1.15)break; // yeterince güçlü, fazla gönderme
  }
  return bestArmy;
}
/* Saldırı: hedefi "net kâr" (ganimet - beklenen kayıp) ile seçer; oyuncunun savunmayı artırma ihtimaline karşı pay bırakır */
const botDist=(x,y)=>Math.abs((x.continent||1)-(y.continent||1))*10+Math.abs((x.row||1)-(y.row||1));
function botTryAttack(b,now){
 const thrBase=Math.random()<0.08?0.9:(b.pers==='warrior'?1.15:(b.pers==='builder'?1.5:1.8));
 const att=botSide(b),night=isNight(),cands=[];
 if(!(b.alliance&&b.alliance===g.alliance.name)&&g.simTime-(g.createdAt||0)>=21600){
  storeActiveCity();
  (g.cities||[]).forEach(city=>cands.push({playerCity:city}));
 }
 const pool=g.bots.filter(t=>t!==b&&!(t.alliance&&t.alliance===b.alliance));
 pool.sort((x,y)=>{const ex=isEnemyAlliance(b.alliance,x.alliance)?1:0,ey=isEnemyAlliance(b.alliance,y.alliance)?1:0;const dx=botDist(x,b),dy=botDist(y,b);return (ey-ex)||(dx-dy);});
 for(let i=0;i<Math.min(8,pool.length);i++)cands.push(pool[i]);
 let best=null,bestArmy=null,bestNet=0;
 for(const c of cands){
  const isP=!!c.playerCity,def=isP?citySide(c.playerCity):botSide(c);
  const thr=isP?thrBase+0.15:thrBase;/* oyuncu yolda savunma ekleyebilir → ekstra pay */
  const sd=botSpy(b)-(isP?mySpy():botSpy(c)),sg=botFogSigma(sd),nz=botFogNoise(b,isP?1000+c.playerCity.id:c.id);
  if(isP&&sd<=-3&&nz>-0.2)continue;/* casusluk çok düşük: hedefi göremiyor */
  const fm=Math.max(0.2,1+sg*nz);/* algılanan savunma = gerçek × fm */
  const army=botPickArmy(b,def,thr,night,fm);
  if(!army)continue;
  const p=predict(army,att,def,night);if(!(p.D>=0&&p.A>p.D*fm))continue;
  const r=Math.min(0.999,p.D*fm/p.A),aF=0.8*Math.pow(r,1.5)*att.loss;
  let cap=0,val=0;for(const n in army){cap+=army[n]*unitCap(n);if(TROOPS[n])val+=army[n]*(TROOPS[n].g+TROOPS[n].f);}
  const R=isP?(c.playerCity.id===g.activeCityId?g:c.playerCity):c,prot=isP?cityProt(c.playerCity):protectedAmt(def);
  const frac=Math.min(0.6,0.1+0.5*Math.min(1,0.5+0.4*(1-r)));
  const loot=Math.min(cap,frac*(Math.max(0,(R.gold||0)-prot)+Math.max(0,(R.food||0)-prot)));
  const net=loot-aF*val;
  if(net>bestNet&&net>0.02*val){bestNet=net;best=c;bestArmy=army;}
 }
 if(best&&bestArmy)botAttack(b,best,bestArmy);else b.nextAtk=now+(b.pers==='warrior'?420:900)+Math.random()*900;
}
const cityProt=city=>((city.buildings&&city.buildings.magara)||0)*400*(1+0.15*rl('Yurt Tutma'));
function citySide(city){
 /* aktif olmayan şehir için geçici savunma tarafı */
 const troops=city.id===g.activeCityId?g.myTroops:(city.myTroops||{});
 const defs=city.id===g.activeCityId?g.myDefenses:(city.myDefenses||{});
 const kale=(city.buildings&&city.buildings.kale)||1;
 const al=myAllyLevel()>=3?0.2:0,mb=Math.min(0.4,0.02*((city.buildings&&city.buildings.mabet)||0)),ha=(g.hero&&g.hero.trait==='def')?mb*0.5:mb,hd=(g.hero&&g.hero.trait==='atk')?mb*0.5:mb,zirh=0.08*rl('Zırh');
 return{me:true,troops,defs,kale,
  atk:n=>atkResMul(n)*(1+al)*(1+ha),def:()=>(1+zirh)*(1+al)*(1+hd),
  str:n=>(1+0.1*rl('Tahkimat'))*defResMul(n)*(1+al)*(n==='Tılsım Kalkanı'?1+0.1*rl('Tılsım'):1),night:Math.max(0,0.15-0.03*rl('Gece Görüş')),loss:Math.max(0.5,1-0.05*rl('İçgüdü'))};
}
function botAttack(b,target,armyOpt){
 const now=g.simTime,army=Object.assign({},armyOpt||b.troops);
 if(target&&target.playerCity){
  const city=target.playerCity;
  const dc=Math.abs((b.continent||1)-(city.continent||1)),dr=Math.abs((b.row||1)-(city.row||1));
  const distance=Math.max(1,dc*10+dr);
  // Oyuncu Haritacılığı düşman hızını ETKİLEMEZ
  const speed=Math.max(0.35,1-0.03*(b.lv.gecit||0));
  const eta=Math.max(30,Math.ceil(distance*90*speed));
  for(const n in army)b.troops[n]=Math.max(0,(b.troops[n]||0)-army[n]);
  g.incomingAttacks.push({id:g.nextId++,botId:b.id,botName:b.name,targetCityId:city.id,targetCityName:city.name,continent:city.continent,row:city.row,troops:army,attackerSpyLevel:botSpy(b),defenderSpyLevel:mySpy(),timeLeft:eta,totalTime:eta,launchedAt:now});
  g.incomingAttacks.sort((a,b)=>(Number(a.timeLeft)||0)-(Number(b.timeLeft)||0));
  b.nextAtk=now+1500+Math.random()*2100;
  notifyEvent('⚔️ GELEN SALDIRI',`${b.name}, ${city.name} şehrine saldırı başlattı! ${formatTime(eta)} sonra ulaşacak.`);
  toast(`🚨 ${b.name} saldırıya çıktı! Kırmızı kılıç işaretine dokun.`);
  dirty=true;
  if(ui.tab==='sehir'||ui.tab==='komuta')renderCurrent();
  return;
 }
const att=botSide(b),def=botSide(target);
 for(const n in army){if(TROOPS[n])b.troops[n]=Math.max(0,(b.troops[n]||0)-(army[n]||0));}
 const res=fight(army,att,def,isNight());
 if(res.win)botNoteRaid(target,0.6);
 for(const n in army){if(TROOPS[n])b.troops[n]=(b.troops[n]||0)+(army[n]||0);}
 clean(b.troops);
 let loot={g:0,f:0};
 if(res.win){loot=doLoot(army,def,res,0);b.gold+=loot.g;b.food+=loot.f;b.lootGold=(b.lootGold||0)+loot.g;b.lootFood=(b.lootFood||0)+loot.f;}
 b.nextAtk=now+1500+Math.random()*2100;
} 
function incomingAttackHtml(a){const troops=a.troops||{},total=Object.values(troops).reduce((x,y)=>x+(Number(y)||0),0);const atk=Number.isFinite(a.attackerSpyLevel)?a.attackerSpyLevel:0;const def=Number.isFinite(a.defenderSpyLevel)?a.defenderSpyLevel:mySpy();const diff=atk-def;let intel='';if(diff>0){intel=`<div class="kv"><span>Gelen toplam birlik</span><b>${fmt(total)}</b></div><div class="small mut">Düşmanın casusluğu daha güçlü. Birlik türleri gizli.</div>`;}else if(diff===0){const types=Object.keys(troops).filter(n=>(troops[n]||0)>0).map(n=>`${(TROOPS[n]||{}).icon||'⚔️'} ${esc(n)}`).join(' • ')||'—';intel=`<div class="kv"><span>Gelen toplam birlik</span><b>${fmt(total)}</b></div><div class="small"><b>Görülebilen birlik türleri:</b><br>${types}</div><div class="small mut">Casusluk seviyeleri eşit: birlik adetleri gizli.</div>`;}else{intel=`<div class="kv"><span>Gelen toplam birlik</span><b>${fmt(total)}</b></div><div class="small"><b>Birlik türleri ve adetleri</b><br>${ul(troops).replace(/\n/g,'<br>')}</div><div class="small mut">Savunmanın casusluğu daha güçlü; ayrıntılı istihbarat elde edildi.</div>`;}return `<div class="card"><h3>🔴 ⚔️ Gelen Saldırı</h3><div class="kv"><span>Saldıran</span><b>${esc(a.botName)}</b></div><div class="kv"><span>Hedef şehir</span><b>${esc(a.targetCityName||'Şehir')}</b></div><div class="kv"><span>Koordinat</span><b>${a.continent}.${a.row}</b></div><div class="kv"><span>Kalan süre</span><b class="bad" data-timer="in${a.id}">${formatTime(a.timeLeft)}</b></div>${intel}<div class="small mut">Saldırı yolda. Varışta savaş otomatik gerçekleşecek.</div></div>`;}
function openIncomingAttacks(cityId){const list=(g.incomingAttacks||[]).filter(a=>!cityId||a.targetCityId===cityId).sort((a,b)=>(Number(a.timeLeft)||0)-(Number(b.timeLeft)||0));if(!list.length){openModal('<h3>🛡️ Gelen saldırı yok</h3><p class="mut small">Şu anda şehirlerine doğru ilerleyen düşman ordusu bulunmuyor.</p>');return;}openModal(`<h2>🚨 GELEN SALDIRILAR (${list.length})</h2><div class="small mut">En yakın saldırı en üstte gösterilir.</div>${list.map(incomingAttackHtml).join('')}`);}
function resolveIncomingAttack(a){
 const b=g.bots.find(x=>x.id===a.botId);if(!b)return;
 const currentId=g.activeCityId,current=g.cities.find(c=>c.id===currentId),target=g.cities.find(c=>c.id===a.targetCityId)||current;
 if(current)storeActiveCity();restoreCity(target);g.activeCityId=target.id;
 const army=Object.assign({},a.troops||{}),att=botSide(b),def=playerSide(),res=fight(army,att,def,isNight());
 if(a.contrib)botCoalReturn(a,army);else for(const n in army)b.troops[n]=(b.troops[n]||0)+army[n];
 const loot=settleBattleLoot(army,att,def,res);
 if(res.win){g.stats.defLosses++;if(a.contrib)botCoalLoot(a,loot.g,loot.f);else{b.gold=(b.gold||0)+loot.g;b.food=(b.food||0)+loot.f;}}else g.stats.defWins++;
 const remain={g:Math.floor(g.gold||0),f:Math.floor(g.food||0)};
 storeActiveCity();if(current){restoreCity(current);g.activeCityId=currentId;}
 const html=incomingBattleHtml(b,res,loot,remain);
 const sum=res.win?`${a.botName}, ${a.targetCityName} şehrine ulaştı. Ganimet: ${fmt(loot.g)}💰 ${fmt(loot.f)}🍗`:`${a.botName} püskürtüldü. Kalan: ${fmt(remain.g)}💰 ${fmt(remain.f)}🍗`;
 notifyEvent(res.win?'⚠️ SALDIRI ULAŞTI':'🛡️ SALDIRI PÜSKÜRTÜLDÜ',`${a.botName} → ${a.targetCityName}`);
 pushReport({kind:'battle',won:!res.win,title:`${res.win?'⚠️ Savunma yarıldı':'🛡️ Saldırı püskürtüldü'}: ${a.botName}`,summary:sum,html});
 showBattleFlash(!res.win,res.win?`Savunma yarıldı`:`Saldırı püskürtüldü`,sum);
 toast(res.win?`⚠️ ${a.targetCityName} saldırıya uğradı!`:`🛡️ ${a.targetCityName} saldırıyı püskürttü!`);dirty=true;
}

/* =====================  ZAMAN İŞLEME  ===================== */
function produce(b,n){
 if(b.def)g.myDefenses[b.name]=(g.myDefenses[b.name]||0)+n;
 else{g.myTroops[b.name]=(g.myTroops[b.name]||0)+n;g.stats.trained+=n;g.daily.trained=(g.daily.trained||0)+n;pulse('train');}
 dirty=true;
}
function procQueue(sec){
 let rem=sec;const q=g.tasks.queue;
 while(q.length&&rem>0){
  const b=q[0];
  if(rem<b.cur){b.cur-=rem;rem=0;break;}
  rem-=b.cur;produce(b,1);b.count--;b.cur=b.unit;
  if(b.count>0){const n=Math.min(b.count,Math.floor(rem/b.unit));if(n>0){produce(b,n);b.count-=n;rem-=n*b.unit;}}
  if(b.count<=0)q.shift();
 }
}
function completeDue(){
 const t=g.tasks;
 if(g.sharedAcademyTask&&g.sharedAcademyTask.timeLeft<=0){g.sharedAcademyLevel=(g.sharedAcademyLevel||0)+1;g.buildings.akademi=g.sharedAcademyLevel;g.sharedAcademyTask=null;toast(`📜 Ortak Akademi Seviye ${g.sharedAcademyLevel} tamamlandı`);pulse('build');dirty=true;}
 // Bina/eğitim kuyrukları tickCityQueues ile tüm şehirlerde işlenir
 if(t.research&&t.research.timeLeft<=0){const n=t.research.name;g.research[n]=rl(n)+1;toast(`📜 ${n} Seviye ${g.research[n]} araştırıldı`);pulse('research');t.research=null;g.sharedResearchTask=null;dirty=true;}
 for(const m of g.marches.slice())if(m.timeLeft<=0)marchArrive(m);
 for(const a of (g.incomingAttacks||[]).slice())if(a.timeLeft<=0){g.incomingAttacks=g.incomingAttacks.filter(x=>x.id!==a.id);resolveIncomingAttack(a);}
 if(g.pendingJoin&&g.pendingJoin.timeLeft<=0)resolveJoin();
 for(const k in g.events)if(g.events[k]&&g.events[k].timeLeft<=0){g.events[k]=null;dirty=true;}
}
function tickCityQueues(city,step,isActive){
  const t=city.tasks||(city.tasks={building:null,buildQueue:[],research:null,queue:[]});
  const ev=city.events||(city.events={build:null,research:null,troop:null});
  // üretim
  const mul=myAllyLevel()>=2?1.15:1;
  const blv=(k)=>(city.buildings&&city.buildings[k])||0;
  const addG=goldRate(blv('maden'),mul)*step/3600,addF=foodRate(blv('ciftlik'),mul)*step/3600;
  city.gold=(city.gold||0)+addG;city.food=(city.food||0)+addF;
  if(isActive){g.daily.produced=(g.daily.produced||0)+addG+addF;}
  // inşaat kuyruğu
  if(t.buildQueue&&t.buildQueue.length){
    t.buildQueue[0].timeLeft-=step*evMul('build');
    while(t.buildQueue.length&&t.buildQueue[0].timeLeft<=0){
      const x=t.buildQueue.shift();
      if(x.key==='akademi'){/* ortak akademi advance'da */}
      else city.buildings[x.key]=(city.buildings[x.key]||0)+1;
      if(isActive){pulse('build');dirty=true;if(x.key!=='akademi')toast(`🏛️ ${BUILD[x.key].name} Seviye ${city.buildings[x.key]} tamamlandı`);}
    }
    t.buildQueue.forEach((x,i)=>x.active=i===0);t.building=t.buildQueue[0]||null;
  }
  // eğitim kuyruğu
  let rem=step*evMul('troop');const q=t.queue||[];
  while(q.length&&rem>0){
    const b=q[0];
    if(rem<b.cur){b.cur-=rem;rem=0;break;}
    rem-=b.cur;
    if(b.def){city.myDefenses=city.myDefenses||{};city.myDefenses[b.name]=(city.myDefenses[b.name]||0)+1;}
    else{city.myTroops=city.myTroops||{};city.myTroops[b.name]=(city.myTroops[b.name]||0)+1;if(isActive){g.stats.trained++;g.daily.trained=(g.daily.trained||0)+1;}}
    b.count--;b.cur=b.unit;
    if(b.count<=0)q.shift();
  }
}
function advance(sec){
 sec=Math.floor(sec);if(sec<=0)return;
 let rem=sec,guard=0;completeDue();
 while(rem>0&&guard++<3000){
  let step=rem;const t=g.tasks,c=[];
  if(t.building)c.push(t.building.timeLeft);if(g.sharedAcademyTask)c.push(g.sharedAcademyTask.timeLeft);if(t.research)c.push(t.research.timeLeft);
  g.marches.forEach(m=>c.push(m.timeLeft));(g.incomingAttacks||[]).forEach(a=>c.push(a.timeLeft));if(g.pendingJoin)c.push(g.pendingJoin.timeLeft);
  for(const k in g.events)if(g.events[k])c.push(g.events[k].timeLeft);
  // pasif şehir kuyruk süreleri
  storeActiveCity();
  (g.cities||[]).forEach(city=>{
    const tq=(city.tasks&&city.tasks.buildQueue)||[];
    if(tq[0]&&tq[0].timeLeft>0)c.push(tq[0].timeLeft);
    (city.tasks&&city.tasks.queue||[]).forEach(b=>{if(b.cur>0)c.push(b.cur);});
  });
  for(const x of c)if(x>0&&x<step)step=x;
  step=Math.max(1,Math.ceil(step));if(step>rem)step=rem;
  // tüm şehirler
  storeActiveCity();
  (g.cities||[]).forEach(city=>{
    const active=city.id===g.activeCityId;
    tickCityQueues(city,step,active);
  });
  // aktif şehri g'ye yansıt
  const activeC=(g.cities||[]).find(x=>x.id===g.activeCityId);
  if(activeC){g.gold=activeC.gold;g.food=activeC.food;g.buildings=Object.assign({},activeC.buildings||{});g.buildings.akademi=g.sharedAcademyLevel||0;g.myTroops=activeC.myTroops||{};g.myDefenses=activeC.myDefenses||{};g.tasks=Object.assign({building:null,buildQueue:[],research:null,queue:[]},activeC.tasks||{});g.tasks.research=g.sharedResearchTask||null;}
  if(g.sharedAcademyTask)g.sharedAcademyTask.timeLeft-=step;
  if(g.tasks.research)g.tasks.research.timeLeft-=step;
  g.marches.forEach(m=>m.timeLeft-=step);(g.incomingAttacks||[]).forEach(a=>a.timeLeft-=step);if(g.pendingJoin)g.pendingJoin.timeLeft-=step;
  g.simTime+=step;g.botAcc+=step;botLoop();updateRankSnapshot();completeDue();rem-=step;
 }
 if(g.incomingAttacks&&g.incomingAttacks.length>1){
  g.incomingAttacks.sort((a,b)=>(Number(a.timeLeft)||0)-(Number(b.timeLeft)||0));
 }
}
function tick(){
 const now=Date.now();let dt=Math.floor((now-lastTick)/1000);
 if(dt<1)return;
 lastTick+=dt*1000;if(dt>OFFLINE_MAX)dt=OFFLINE_MAX;
 const r0=g.reports.length;
 const g0=g.gold,f0=g.food,m0=g.marches.length;
 suppressBattleFlash=dt>30;
 try{advance(dt);checkDailyReset();checkWeeklyReset();}catch(e){showErr(e);}
 suppressBattleFlash=false;
 if(dt>120){
   dirty=true;
   const dg=Math.max(0,Math.floor(g.gold-g0)), df=Math.max(0,Math.floor(g.food-f0));
   const nr=Math.max(0,g.reports.length-r0);
   const finished=Math.max(0,m0-g.marches.filter(m=>!m.back).length); // rough
   let msg=`⏳ ${formatTime(dt)} geçti`;
   if(dg||df) msg+=` • +${fmt(dg)}💰 +${fmt(df)}🍗`;
   if(nr) msg+=` • ${nr} yeni rapor`;
   toast(msg);
 }
 tickN++;updateHeader();updateTimers();
 const touching=Date.now()-ui.touchAt<1500;
 const typing=document.activeElement&&document.activeElement.tagName==='INPUT';
 if((dirty||tickN%4===0||dt>1)&&!touching&&!typing&&ui.tab!=='daha'&&!$('ov').classList.contains('show')){dirty=false;try{renderCurrent();}catch(e){showErr(e);}}
 if(tickN%5===0||dt>5)save();
}

/* =====================  SEFERLER  ===================== */
function marchArrive(m){
 const bot=g.bots.find(b=>b.id===m.target);
 if(m.back){
  // Dönüş: birlikler aktif şehre (veya fromCity'ye) geri gelsin
  // Basitlik için aktif şehre ekliyoruz; idealde fromCityId'ye eklenmeli
  if(m.fromCityId){giveCity(m.fromCityId,m.troops,m.loot&&m.loot.g,m.loot&&m.loot.f);}else if(false){
    // Kaynak şehre ekle
    const fromC=g.cities.find(c=>c.id===m.fromCityId);
    if(fromC){
      for(const n in m.troops) fromC.myTroops[n]=(fromC.myTroops[n]||0)+m.troops[n];
      if(m.loot){fromC.gold=(fromC.gold||0)+(m.loot.g||0); fromC.food=(fromC.food||0)+(m.loot.f||0);}
    } else {
      for(const n in m.troops) g.myTroops[n]=(g.myTroops[n]||0)+m.troops[n];
      if(m.loot){g.gold+=m.loot.g||0;g.food+=m.loot.f||0;}
    }
  } else {
    giveCity(g.activeCityId,m.troops,m.loot&&m.loot.g,m.loot&&m.loot.f);
  }
  g.marches=g.marches.filter(x=>x!==m);dirty=true;
  if(m.type==='saldiri'||m.type==='destek'||m.type==='kurulus')toast(`🚩 Ordun döndü${m.loot&&(m.loot.g||m.loot.f)?` (+${fmt(m.loot.g)}💰 +${fmt(m.loot.f)}🍗)`:''}`);
  return;
 }
 // Gidiş varışı
 if(m.type==='kurulus'){
   completeFoundCity(m);
   g.marches=g.marches.filter(x=>x!==m);dirty=true;refresh();
   return;
 }
 if(m.type==='destek' && m.targetCityId){
   // Destek: birlikleri hedef şehre ekle, Kağnılar da dahil, geri dönüş yok (destek kalır)
   const targetC=g.cities.find(c=>c.id===m.targetCityId);
   if(targetC){
     giveCity(m.targetCityId,m.troops,0,0);
     pushReport({kind:'info',title:`🛡️ Destek ulaştı: ${m.targetCityName}`,summary:`${Object.keys(m.troops).map(n=>m.troops[n]+' '+n).join(', ')} birlik ${m.targetCityName} şehrine ulaştı.`,html:`Destek birlikleri <b>${esc(m.targetCityName)}</b> şehrine başarıyla ulaştı.`});
     toast(`🛡️ Destek ${m.targetCityName} şehrine ulaştı!`);
   }
   g.marches=g.marches.filter(x=>x!==m);dirty=true;
   return;
 }
 if(m.type==='nakliye' && m.internal && m.targetCityId){
   // Dahili nakliye: kaynakları hedef şehre ekle, Kağnılar geri dönsün
   const targetC=g.cities.find(c=>c.id===m.targetCityId);
   if(targetC){
     targetC.gold=(targetC.gold||0)+(m.gold||0);
     targetC.food=(targetC.food||0)+(m.food||0);
     if(g.activeCityId===m.targetCityId){g.gold+=m.gold||0;g.food+=m.food||0;}
     pushReport({kind:'info',title:`🛒 Nakliye ulaştı: ${m.targetCityName}`,summary:`${fmt(m.gold)} altın, ${fmt(m.food)} yemek ${m.targetCityName} şehrine ulaştı.`,html:`Kaynaklar <b>${esc(m.targetCityName)}</b> şehrine teslim edildi.`});
     toast(`🛒 Nakliye ${m.targetCityName} şehrine ulaştı!`);
   }
   m.gold=0;m.food=0;
   m.back=true;m.timeLeft=m.one;dirty=true; // Kağnılar geri dönsün
   return;
 }
 if(bot){
  if(m.type==='casus')spyReport(bot,m);
  else if(m.type==='saldiri'){
   const att=playerSide(),def=botSide(bot),res=fight(m.troops,att,def,isNight());
   botNoteRaid(bot,res.win?1.5:0.3);
   _lootMul=farmMul(bot);const loot=settleBattleLoot(m.troops,att,def,res);_lootMul=1;
   if(res.win){bot.farm=(bot.farm||0)*Math.exp(-Math.max(0,g.simTime-(bot.farmT||0))/21600)+1;bot.farmT=g.simTime;}
   if(res.win){g.stats.attackWins++;g.daily.attackWins=(g.daily.attackWins||0)+1;g.weekly.attackWins=(g.weekly.attackWins||0)+1;if(bot.alliance&&isEnemyAlliance(g.alliance.name,bot.alliance))g.stats.enemyAllianceWins=(g.stats.enemyAllianceWins||0)+1;}else g.stats.attackLosses++;
   m.loot={g:loot.g,f:loot.f};
   const remain={g:Math.floor(bot.gold||0),f:Math.floor(bot.food||0)};
   const sum=res.win?`${bot.name} yenildi. ${fmt(loot.g)}💰 ${fmt(loot.f)}🍗 ganimet.`:`${bot.name} saldırını püskürttü. Kalan: ${fmt(remain.g)}💰 ${fmt(remain.f)}🍗`;
   pushReport({kind:'battle',won:res.win,targetId:bot.id,title:`${res.win?'⚔️ Zafer':'⚔️ Yenilgi'}: ${bot.name}`,summary:sum,html:battleHtml(pName(),bot.name,res,loot,remain)});
   showBattleFlash(res.win,res.win?`Zafer: ${bot.name}`:`Yenilgi: ${bot.name}`,sum);
   toast(res.win?`⚔️ ${bot.name} yenildi!`:`💀 ${bot.name} saldırını püskürttü`);
  }else if(m.type==='nakliye'){
   bot.gold+=m.gold;bot.food+=m.food;m.gold=0;m.food=0;
   pushReport({kind:'info',title:`🛒 Nakliye: ${bot.name}`,summary:`${bot.name} oyuncusuna kaynak ulaştırıldı.`,html:`${esc(bot.name)} oyuncusuna başarıyla teslim edildi.`});
  }
 }
 m.back=true;m.timeLeft=m.one;dirty=true;
}
function cancelMarch(id){
  const m=g.marches.find(x=>x.id===id);
  if(!m||m.back){toast('Bu sefer zaten dönüşte veya bulunamadı');return;}
  // Gittiği süre kadar dönüş süresi
  const traveled=Math.max(1, m.one - m.timeLeft);
  m.back=true;
  m.timeLeft=traveled;
  if(m.type==='nakliye'||m.type==='kurulus'){
    m.loot={g:m.gold||0,f:m.food||0};
    m.gold=0;m.food=0;
  }
  dirty=true;
  toast('↩️ Sefer geri çağrıldı. Dönüş süresi: '+formatTime(traveled));
  refresh();
}
const botSpy=b=>Math.min(15,botRl(b,'Casusluk')+((b.troops&&b.troops['Casus Karga']>0)?1:0)+(b.pers==='turtle'?1:0));
const mySpy=()=>rl('Casusluk');
function spyReport(b,m){
 const L=mySpy(),T=botSpy(b),D=L-T;g.stats.spies++;g.daily.spies=(g.daily.spies||0)+1;g.weekly.spies=(g.weekly.spies||0)+1;pulse('spy');
 const sgn=D>0?'+'+D:''+D;
 if(Math.random()<Math.min(0.9,Math.max(0.02,0.3-0.1*D))){
  pushReport({kind:'spy',won:false,targetId:b.id,title:`🦅 Casus yakalandı: ${b.name}`,summary:'Casusun yakalandı, bilgi alınamadı.',html:`Casusun hedefte yakalandı ve bilgi getiremedi.\n\nSenin casusluk seviyesi: ${L}\nSeviye farkı: ${sgn}\n\nCasusluk seviyen yükseldikçe daha ayrıntılı bilgi elde edersin.`});
  return;
 }
 const nz=x=>Math.round(x*(0.75+Math.random()*0.5)/100)*100,side=botSide(b);
 let h=`<b>Hedef:</b> ${esc(b.name)} (${esc(b.alliance||'Bağımsız')})\n<b>Kıta:</b> ${b.continent}  <b>Puan:</b> ${bScore(b)}\n<b>Senin casusluk seviyen:</b> ${L}`+(D>=2?`   <b>Hedefin:</b> ${T}`:'')+`\n<b>Seviye farkı:</b> ${sgn}${D>=3?' (tam bilgi)':''}\n\n`;
 const tc=Object.values(b.troops).reduce((s,x)=>s+x,0);
 if(D<=-2)h+=`<b>Kaynaklar (kaba tahmin)</b>\n💰 ~${fmt(nz(b.gold))}\n🍗 ~${fmt(nz(b.food))}\n\nDaha fazla bilgi için casusluk seviyeni yükselt.`;
 else if(D===-1)h+=`<b>Kaynaklar (tahmini)</b>\n💰 ~${fmt(nz(b.gold))}\n🍗 ~${fmt(nz(b.food))}\n\n<b>Asker sayısı (tahmini):</b> ~${Math.max(0,Math.round(tc*(0.75+Math.random()*0.5)))}`;
 else h+=`<b>Kaynaklar</b>\n💰 ${fmt(b.gold)}\n🍗 ${fmt(b.food)}\n\n<b>Toplam asker:</b> ${fmt(tc)}`;
 if(D>=1)h+=`\n\n<b>Birlikler</b>\n${ul(b.troops)}`;
 if(D>=1){
  const ap=classPower(side,b.troops,'atk'),dp=predict({},side,side,false);
  h+=`\n\n<b>Tahmini güç</b>\nSaldırı ${fmt(ap.tot)}\nSavunma ${fmt(dp.D)}`;
 }
 if(D>=2)h+=`\n\n<b>Savunma yapıları</b>\n${ul(b.defs)}\n\n<b>Kale:</b> ${b.lv.kale}  <b>Mağara:</b> ${b.lv.magara}`;
 if(D>=3){
  let lines=[];for(const k in b.troops){const u=TROOPS[k];if(u)lines.push(`${u.icon} ${k}: ${b.troops[k]}  (⚔️${u.atk} 🛡️${u.def} 🎒${unitCap(k)})`);}
  h+=`\n\n<b>🏗️ Tüm Yapılar</b>\nÇiftlik ${b.lv.ciftlik} • Maden ${b.lv.maden} • Kale ${b.lv.kale}\nKışla ${b.lv.kisla} • Akademi ${b.lv.akademi} • Mağara ${b.lv.magara}`;
  const rLines=Object.keys(RES).filter(n=>botRl(b,n)>0).map(n=>`${n} Sv ${botRl(b,n)}`).join(' • ')||'Yok';
  h+=`\n\n<b>📜 Araştırmalar</b>\n${rLines}\nCasusluk: ${T}`;
  h+=`\n\n<b>⚔️ Ordu Ayrıntısı</b>\n${lines.join('\n')||'—'}`;
 }
 pushReport({kind:'spy',won:true,targetId:b.id,title:`🦅 Casusluk raporu: ${b.name}`,summary:`${b.name} hakkında bilgi toplandı (fark ${sgn}).`,html:h});
}

/* =====================  İTTİFAK  ===================== */
const allyMembers=n=>g.bots.filter(b=>b.alliance===n).length+(g.alliance.name===n?1:0);
function toggleAllianceWar(n){if(!g.alliance.name||!allyEntry(n))return;const i=g.allianceWars.indexOf(n);if(i>=0){g.allianceWars.splice(i,1);toast(`${n} ile savaş sona erdi.`);}else{g.allianceWars.push(n);notifyEvent('⚔️ İTTİFAK SAVAŞI',`${n} ile savaş ilan edildi!`);}refresh();}
function isEnemyAlliance(myAlly,otherAlly){if(!myAlly||!otherAlly)return false;/* sadece kendi ittifakının ilan ettiği savaşlar */return myAlly===g.alliance.name&&(g.allianceWars||[]).includes(otherAlly);}
function createAlliance(){
 const name=($('new-ally')?$('new-ally').value:'').replace(/['"\\<>&`]/g,'').trim().slice(0,16);
 if(!name){alert("İttifak adı giriniz!");return;}
 if(g.alliances.some(a=>a.name.toLowerCase()===name.toLowerCase())){alert("Bu isimde bir ittifak var!");return;}
 if(g.gold<1000){alert("1000 altın gerekiyor!");return;}
 g.gold-=1000;g.alliance={name,isLeader:true,goldDonated:0,foodDonated:0};g.alliances.push({name,leader:pName(),donated:0});
 ui.allyName='';refresh();
}
function leaveAlliance(){
 if(!confirm("İttifaktan ayrılmak istiyor musun?"))return;
 const n=g.alliance.name,a=allyEntry(n);
 if(a&&g.alliance.isLeader){const m=g.bots.find(b=>b.alliance===n);if(m)a.leader=m.name;else g.alliances=g.alliances.filter(x=>x!==a);}
 g.alliance={name:null,isLeader:false,goldDonated:0,foodDonated:0};refresh();
}
function requestJoin(n){
 if(g.alliance.name){alert("Zaten bir ittifaktasın!");return;}
 if(g.pendingJoin){alert("Bekleyen bir isteğin var!");return;}
 g.pendingJoin={name:n,timeLeft:90};toast(`📨 "${n}" ittifakına istek gönderildi`);refresh();
}
function resolveJoin(){
 const n=g.pendingJoin.name;g.pendingJoin=null;dirty=true;
 if(g.alliance.name||!allyEntry(n))return;
 if(allyMembers(n)<20&&Math.random()<0.85){
  g.alliance={name:n,isLeader:false,goldDonated:0,foodDonated:0};
  pushReport({kind:'info',title:`🛡️ ${n} isteğin kabul edildi`,summary:`Artık ${n} ittifakındasın.`,html:`<b>${esc(n)}</b> ittifakına kabul edildin!`});
 }else pushReport({kind:'info',title:`🛡️ ${n} isteğin reddedildi`,summary:'İttifak isteğin reddedildi.',html:`<b>${esc(n)}</b> ittifakı isteğini reddetti.`});
}
function donate(type,amt){
 if(!g.alliance.name)return;
 if(type==='gold'&&g.gold>=amt){g.gold-=amt;g.alliance.goldDonated+=amt;}
 else if(type==='food'&&g.food>=amt){g.food-=amt;g.alliance.foodDonated+=amt;}
 else{alert("Yeterli kaynağın yok!");return;}
 const a=allyEntry(g.alliance.name),old=allyLevel(a.name);a.donated+=amt;
 g.daily.donated=(g.daily.donated||0)+1;
 if(allyLevel(a.name)>old)toast(`🎉 İttifak Seviye ${allyLevel(a.name)} oldu!`);
 refresh();
}
function acceptReq(id){
 const r=g.reports.find(x=>x.id===id);if(!r||r.kind!=='request')return;
 const b=g.bots.find(x=>x.id===r.botId);
 if(b&&!b.alliance&&g.alliance.name){if(allyMembers(g.alliance.name)>=20){alert("İttifak dolu (20 üye)!");return;}b.alliance=g.alliance.name;toast(`✅ ${b.name} ittifaka katıldı`);}
 g.reports=g.reports.filter(x=>x.id!==id&&!(x.kind==='request'&&x.botId===r.botId));refresh();
}
function rejectReq(id){g.reports=g.reports.filter(x=>x.id!==id);refresh();}

/* =====================  İNŞAAT / ARAŞTIRMA / ÜRETİM  ===================== */
function addSpent(a,b){g.spent+=a+b;}
function subSpent(a,b){g.spent=Math.max(0,g.spent-a-b);}
function upgradeB(k){
 const B=BUILD[k],l=bl(k),q=g.tasks.buildQueue||[];
 if(k==='akademi'&&g.sharedAcademyTask){alert('Ortak Akademi zaten yükseltiliyor.');return;}
 if(q.length>=3){alert('İnşaat kuyusu dolu (3/3)!');return;}
 if(q.some(x=>x.key===k)){alert(`${B.name} zaten inşaat kuyusunda. Her bina türünden aynı anda yalnızca 1 adet eklenebilir.`);return;}
 if(l+q.filter(x=>x.key===k).length>=B.max)return;
 for(const r in B.req)if(bl(r)<B.req[r]){alert('Gereksinim karşılanmadı!');return;}
 if(k!=='kale'&&totalB()+q.length>=maxB()){alert('Yapı sınırına ulaştın! Kaleyi yükselt.');return;}
 const lvl=l+q.filter(x=>x.key===k).length;
 const c=buildCostAt(k,lvl);if(g.gold<c.g||g.food<c.f){alert('Yetersiz kaynak!');return;}
 g.gold-=c.g;g.food-=c.f;addSpent(c.g,c.f);
 // Mimarhane + inşaat etkinliği uygulanır
 const t=Math.max(2,Math.floor(buildTimeAt(k,lvl)*buildMul()));
 const item={id:g.nextId++,key:k,name:B.name,timeLeft:t,total:t,gC:c.g,fC:c.f,active:q.length===0};
 if(k==='akademi'){g.sharedAcademyTask=item;toast('📜 Ortak Akademi yükseltmesi başladı');}
 else{q.push(item);g.tasks.buildQueue=q;g.tasks.building=q[0];toast(q.length===1?`🔨 ${B.name} inşaatı başladı`:`⏳ ${B.name} kuyruğa eklendi (pasif)`);}
 pulse('build');refresh();
}
function cancelBuilding(id){
 if(g.sharedAcademyTask&&g.sharedAcademyTask.id===id){const t=g.sharedAcademyTask;const pen=Math.min(0.8,Math.max(0.2,(t.total-t.timeLeft)/t.total)),rg=Math.floor(t.gC*(1-pen)),rf=Math.floor(t.fC*(1-pen));g.gold+=rg;g.food+=rf;subSpent(rg,rf);g.sharedAcademyTask=null;refresh();return;}
 const q=g.tasks.buildQueue||[],i=q.findIndex(x=>x.id===id);if(i<0)return;const t=q[i];
 const pen=i===0?Math.min(0.8,Math.max(0.2,(t.total-t.timeLeft)/t.total)):0.2,rg=Math.floor(t.gC*(1-pen)),rf=Math.floor(t.fC*(1-pen));
 g.gold+=rg;g.food+=rf;subSpent(rg,rf);q.splice(i,1);q.forEach((x,j)=>x.active=j===0);g.tasks.buildQueue=q;g.tasks.building=q[0]||null;refresh();
}
function startResearch(n){
 const R=RES[n];
 if(g.tasks.research){alert("Zaten devam eden bir araştırma var!");return;}
 if(g.sharedAcademyTask||(g.tasks.building&&g.tasks.building.key==='akademi')){alert("Ortak Akademi yükseltilirken araştırma yapılamaz!");return;}
 if(bl('akademi')<R.ak){alert("Akademi seviyesi yetersiz!");return;}
 if(rl(n)>=R.max)return;
 const c=resCost(n);if(g.gold<c.g||g.food<c.f){alert("Yetersiz kaynak!");return;}
 g.gold-=c.g;g.food-=c.f;addSpent(c.g,c.f);const t=resTime(n);
 g.tasks.research={name:n,timeLeft:t,total:t,gC:c.g,fC:c.f};g.sharedResearchTask=g.tasks.research;refresh();
}
function cancelResearch(){
 const t=g.tasks.research;if(!t)return;
 const pen=Math.min(0.8,Math.max(0.2,(t.total-t.timeLeft)/t.total)),rg=Math.floor(t.gC*(1-pen)),rf=Math.floor(t.fC*(1-pen));
 g.gold+=rg;g.food+=rf;subSpent(rg,rf);g.tasks.research=null;g.sharedResearchTask=null;refresh();
}
function troopReq(n){
 const u=TROOPS[n];let ok=bl('kisla')>=u.req.kisla;const txt=[`<span class="${ok?'ok':'bad'}">Kışla ${u.req.kisla}</span>`];
 for(const r in u.req.res){const o=rl(r)>=u.req.res[r];if(!o)ok=false;txt.push(`<span class="${o?'ok':'bad'}">${r} ${u.req.res[r]}</span>`);}
 return{ok,txt};
}
function defReq(n){
 const d=DEF[n];let ok=true,txt=[];
 if(d.kale){const o=bl('kale')>=d.kale;if(!o)ok=false;txt.push(`<span class="${o?'ok':'bad'}">Kale ${d.kale}</span>`);}
 if(d.sur){const o=defCount('Sur')>=d.sur;if(!o)ok=false;txt.push(`<span class="${o?'ok':'bad'}">Sur ${d.sur}</span>`);}
 for(const r in d.res){const o=rl(r)>=d.res[r];if(!o)ok=false;txt.push(`<span class="${o?'ok':'bad'}">${r} ${d.res[r]}</span>`);}
 return{ok,txt};
}
const getAmt=k=>Math.max(1,Math.floor(parseInt(ui.amt[k])||1));
function setAmt(k,v){ui.amt[k]=v;}
function maxAmt(kind,n){
 const u=kind==='t'?TROOPS[n]:DEF[n];
 let m=kind==='t'?Math.min(Math.floor(g.gold/u.g),Math.floor(g.food/u.f)):9999;
 if(kind==='d'&&u.level){
  let costG=0,costF=0,lv=defCount(n);m=0;
  while(m<u.max-lv){
   const c=defLevelCost(n,lv+m+1);
   if(g.gold<costG+c.g||g.food<costF+c.f)break;
   costG+=c.g;costF+=c.f;m++;
  }
 }
 ui.amt[kind+':'+n]=Math.max(1,m);renderCurrent();
}
function queueTroops(n){
 const u=TROOPS[n],amt=getAmt('t:'+n);
 if(!troopReq(n).ok){alert("Gereksinim karşılanmadı!");return;}
 if(g.gold<u.g*amt||g.food<u.f*amt){alert("Yetersiz kaynak!");return;}
 g.gold-=u.g*amt;g.food-=u.f*amt;addSpent(u.g*amt,u.f*amt);
 const t=troopTime(n);g.tasks.queue.push({id:g.nextId++,name:n,def:false,count:amt,unit:t,cur:t,gC:u.g,fC:u.f});refresh();
}
function queueDef(n){
 const d=DEF[n],amt=Math.max(1,getAmt('d:'+n)),cur=defCount(n);
 if(!defReq(n).ok){alert("Gereksinim karşılanmadı!");return;}
 if(d.level&&cur+amt>d.max){alert(`${n} en fazla ${d.max}. seviyeye çıkabilir.`);return;}
 if(d.level){
  let tg=0,tf=0;
  for(let i=1;i<=amt;i++){const c=defLevelCost(n,cur+i);tg+=c.g;tf+=c.f;}
  if(g.gold<tg||g.food<tf){alert("Sonraki seviyeler için yeterli kaynak yok!");return;}
  g.gold-=tg;g.food-=tf;addSpent(tg,tf);
  for(let i=1;i<=amt;i++){const c=defLevelCost(n,cur+i),t=defTime(n);g.tasks.queue.push({id:g.nextId++,name:n,def:true,count:1,unit:t,cur:t,gC:c.g,fC:c.f,levelScaled:true});}
 }else{
  if(g.gold<d.g*amt||g.food<d.f*amt){alert("Yetersiz kaynak!");return;}
  g.gold-=d.g*amt;g.food-=d.f*amt;addSpent(d.g*amt,d.f*amt);
  const t=defTime(n);g.tasks.queue.push({id:g.nextId++,name:n,def:true,count:amt,unit:t,cur:t,gC:d.g,fC:d.f});
 }
 refresh();
}
function cancelBatch(id){
 const i=g.tasks.queue.findIndex(b=>b.id===id);if(i<0)return;
 const b=g.tasks.queue[i],rg=Math.floor(b.gC*b.count*0.9),rf=Math.floor(b.fC*b.count*0.9);
 g.gold+=rg;g.food+=rf;subSpent(rg,rf);g.tasks.queue.splice(i,1);refresh();
}

/* =====================  GÖREVLER  ===================== */
function claimQuest(id){
 const q=QUESTS.find(x=>x.id===id);if(!q||g.quests[id]||!q.c())return;
 g.quests[id]=true;g.gold+=q.r[0];g.food+=q.r[1];toast(`🎁 Ödül: +${fmt(q.r[0])}💰 +${fmt(q.r[1])}🍗`);refresh();
}
function checkDailyReset(){
  const day=Math.floor(g.simTime/86400);
  if((g.daily.day||0)!==day){
    g.daily={day,spies:0,attackWins:0,produced:0,donated:0,trained:0,claimed:{}};
  }
}
function claimDaily(id){
  checkDailyReset();
  const q=DAILY_QUESTS.find(x=>x.id===id);
  if(!q||g.daily.claimed[id]||!q.c())return;
  g.daily.claimed[id]=true;
  g.gold+=q.r[0];g.food+=q.r[1];
  toast(`📅 Günlük ödül: +${fmt(q.r[0])}💰 +${fmt(q.r[1])}🍗`);
  refresh();
}

/* =====================  GÖNDERİM  ===================== */
function curBot(){return g.bots.find(b=>b.id===ui.target);}
function activeSeferCount(){return (g.marches||[]).filter(m=>m.type!=='kurulus').length;}
function noSlot(){const n=activeSeferCount();if(n>=seferHakki()){alert(`Sefer hakkın dolu (${n}/${seferHakki()})! Kışlayı veya Haritacılığı geliştir.`);return true;}return false;}
function sendSpy(){
 const b=curBot();if(!b||noSlot())return;
 const karga=g.myTroops['Casus Karga']||0;
 if(karga<1){alert('Casusluk için en az 1 Casus Karga gerekir! Kargayı üretmeden casusluk yapılamaz.');return;}
 g.myTroops['Casus Karga']--;
 clean(g.myTroops);
 const t=travelTime(b,true);
 g.marches.push({id:g.nextId++,type:'casus',target:b.id,troops:{'Casus Karga':1},timeLeft:t,one:t,back:false,loot:null,fromCityId:g.activeCityId});
 closeModal();refresh();toast('🦅 Casus Karga yola çıktı');
}
function sendAttack(){
 const b=curBot();if(!b||noSlot())return;
 if(b.alliance&&b.alliance===g.alliance.name){alert("İttifak üyesine saldıramazsın!");return;}
 const army={};let atk=0;
 ui.attNames.forEach((n,i)=>{const el=$('att-'+i);let v=Math.min(g.myTroops[n]||0,Math.max(0,parseInt(el&&el.value)||0));if(v>0){army[n]=v;atk+=v*TROOPS[n].atk;}});
 if(!Object.keys(army).length){alert("Lütfen en az 1 birlik seç!");return;}
 if(atk<=0){alert("Saldırı gücü olan birlik seçmelisin!");return;}
 for(const n in army)g.myTroops[n]-=army[n];clean(g.myTroops);
 const t=travelTime(b,false);g.marches.push({id:g.nextId++,type:'saldiri',target:b.id,troops:army,timeLeft:t,one:t,back:false,loot:null,fromCityId:g.activeCityId});
 closeModal();refresh();toast('⚔️ Ordu yola çıktı');
}
function sendTransport(){
 const b=curBot();if(!b||noSlot())return;
 const gg=Math.max(0,parseInt($('tr-g').value)||0),ff=Math.max(0,parseInt($('tr-f').value)||0),k=Math.max(0,parseInt($('tr-k').value)||0);
 if(gg+ff<=0){alert("Gönderilecek kaynak yok!");return;}
 if(k<1||k>(g.myTroops['Kağnı']||0)){alert("Yeterli Kağnın yok!");return;}
 if(gg+ff>k*CART_CAP){alert(`Kağnı kapasitesi yetersiz (adet başı ${CART_CAP}).`);return;}
 if(g.gold<gg||g.food<ff){alert("Yetersiz kaynak!");return;}
 g.gold-=gg;g.food-=ff;g.myTroops['Kağnı']-=k;clean(g.myTroops);
 const t=travelTime(b,false);g.marches.push({id:g.nextId++,type:'nakliye',target:b.id,troops:{'Kağnı':k},gold:gg,food:ff,timeLeft:t,one:t,back:false,loot:null,fromCityId:g.activeCityId});
 closeModal();refresh();toast('🛒 Nakliye yola çıktı');
}

/* =====================  ADMIN  ===================== */
function setBotDifficulty(k){if(!BOT_LEVELS[k])return;g.botDifficulty=k;g.bots.forEach(b=>b.difficulty=k);toast('🤖 Bot zorluğu: '+BOT_LEVELS[k].label);refresh();}
function marketTrade(type,amt){
  amt=Math.max(100,Math.floor(amt||1000));
  if(type==='g2f'){
    if(g.gold<amt){alert('Yeterli altın yok!');return;}
    const out=Math.floor(amt*0.8);
    g.gold-=amt;g.food+=out; // pazar puan şişirmesin
    toast(`🛒 ${fmt(amt)}💰 → ${fmt(out)}🍗`);
  }else{
    if(g.food<amt){alert('Yeterli yemek yok!');return;}
    const out=Math.floor(amt*0.76);
    g.food-=amt;g.gold+=out;
    toast(`🛒 ${fmt(amt)}🍗 → ${fmt(out)}💰`);
  }
  g.marketTrades=(g.marketTrades||0)+1;pulse('market');refresh();
}
function marketTradeAll(type){
  if(type==='g2f')marketTrade('g2f',Math.floor(g.gold));
  else marketTrade('f2g',Math.floor(g.food));
}
function toggleAudio(){g.audio=!g.audio;g.audioMode=g.audio?'full':'off';refresh();}
function toggleNotify(){g.notify=!g.notify;refresh();}
function beep(kind){
  if(g.audioMode==='off'||g.audio===false)return;
  try{
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const c=window.__ac||(window.__ac=new C());
    const o=c.createOscillator(),gain=c.createGain();
    o.frequency.value=kind==='attack'?180:kind==='spy'?520:kind==='market'?260:360;
    gain.gain.value=g.audioMode==='low'?0.02:0.045;
    o.connect(gain);gain.connect(c.destination);o.start();o.stop(c.currentTime+(g.audioMode==='low'?0.08:0.12));
  }catch(e){}
}
function pulse(kind){beep(kind);if(g.notify&&navigator.vibrate)navigator.vibrate(kind==='attack'?[120,60,180]:[60]);}
function notifyEvent(title,msg){pulse(title.includes('SALDIRI')?'attack':'event');toast(title+' '+msg);}
function executeTimeWarp(){const m=Math.max(1,parseInt($('tw-min').value)||60);advance(m*60);alert(`⏩ ${m} dakika ileri sarıldı!`);refresh();}
function scaleTimers(list,mul){
  (list||[]).forEach(x=>{
    if(!x)return;
    if(x.timeLeft!=null)x.timeLeft=Math.max(1,Math.floor(x.timeLeft*mul));
    if(x.total!=null)x.total=Math.max(1,Math.floor(x.total*mul));
    if(x.unit!=null)x.unit=Math.max(1,Math.floor(x.unit*mul));
    if(x.cur!=null)x.cur=Math.max(1,Math.floor(x.cur*mul));
  });
}
function applyEventToExisting(kind,rate){
  // Hız artışı: kalan süreleri kısalt (rate %50 → x1.5 hız → süre / 1.5)
  const mul=1/(1+Math.max(1,rate)/100);
  storeActiveCity();
  if(false){
    scaleTimers(g.tasks.buildQueue,mul);
    if(g.sharedAcademyTask)scaleTimers([g.sharedAcademyTask],mul);
    (g.cities||[]).forEach(c=>{
      if(c.tasks&&c.tasks.buildQueue)scaleTimers(c.tasks.buildQueue,mul);
    });
    if(g.tasks.buildQueue)g.tasks.building=g.tasks.buildQueue[0]||null;
  }else if(kind==='research'){
    if(g.tasks.research)scaleTimers([g.tasks.research],mul);
    if(g.sharedResearchTask)scaleTimers([g.sharedResearchTask],mul);
  }else if(false){
    scaleTimers(g.tasks.queue,mul);
    (g.cities||[]).forEach(c=>{
      if(c.tasks&&c.tasks.queue)scaleTimers(c.tasks.queue,mul);
    });
  }
}
function startEvent(t){
  const m=Math.max(1,parseInt($('ev-'+t+'-t').value)||30),r=Math.max(1,parseInt($('ev-'+t+'-r').value)||50);
  // Etkinlik GLOBAL'dir; tüm şehirlerin kuyrukları tickCityQueues içinde bu hızla ilerler.
  g.events[t]={timeLeft:m*60,rate:r};
  save();
  toast(`⚡ ${t==='build'?'İnşaat':t==='research'?'Araştırma':'Eğitim'} hızı +%${r} (${m} dk) — tüm şehirlerde aktif`);
  refresh();
}
function cheatBuild(){
 if(g.sharedAcademyTask){g.sharedAcademyTask.timeLeft=0;}
 if(g.tasks.building){g.tasks.building.timeLeft=0;}
 completeDue();refresh();toast('🚀 İnşaat ve Akademi tamamlandı!');
}
function cheatResearch(){if(!g.tasks.research){alert("Araştırma yok!");return;}g.tasks.research.timeLeft=0;completeDue();refresh();}
function cheatTroops(){if(!g.tasks.queue.length){alert("Kuyruk boş!");return;}g.tasks.queue.forEach(b=>{produce(b,b.count);});g.tasks.queue=[];refresh();}
function cheatRes(){
  const a=Math.max(0,parseInt($('cheat-g')&&$('cheat-g').value)||0);
  const f=Math.max(0,parseInt($('cheat-f')&&$('cheat-f').value)||0);
  if(a+f<=0){alert('Miktar gir!');return;}
  g.gold+=a;g.food+=f;refresh();toast(`+${fmt(a)}💰 +${fmt(f)}🍗`);
}
function cheatResMinus(){
  const a=Math.max(0,parseInt($('cheat-g')&&$('cheat-g').value)||0);
  const f=Math.max(0,parseInt($('cheat-f')&&$('cheat-f').value)||0);
  if(a+f<=0){alert('Miktar gir!');return;}
  g.gold=Math.max(0,g.gold-a);g.food=Math.max(0,g.food-f);refresh();toast(`-${fmt(a)}💰 -${fmt(f)}🍗`);
}
function cheatBotLoot(mode){
  const a=Math.max(0,parseInt($('bot-loot-g')&&$('bot-loot-g').value)||0);
  const f=Math.max(0,parseInt($('bot-loot-f')&&$('bot-loot-f').value)||0);
  if(a+f<=0){alert('Miktar gir!');return;}
  const name=(($('bot-loot-name')&&$('bot-loot-name').value)||'').trim().toLowerCase();
  let list=g.bots||[];
  if(name){
    list=list.filter(b=>(b.name||'').toLowerCase().includes(name));
    if(!list.length){alert('Eşleşen bot yok!');return;}
  }
  list.forEach(b=>{
    if(mode==='add'){b.gold=(b.gold||0)+a;b.food=(b.food||0)+f;}
    else{b.gold=Math.max(0,(b.gold||0)-a);b.food=Math.max(0,(b.food||0)-f);}
  });
  dirty=true;refresh();
  toast(`${mode==='add'?'+':'-'}${fmt(a)}💰 ${fmt(f)}🍗 → ${list.length} bot`);
}
function cheatBotLootAll(mode){
  $('bot-loot-name')&&($('bot-loot-name').value='');
  cheatBotLoot(mode);
}
function cheatMarch(){if(!g.marches.length){alert("Sefer yok!");return;}for(let i=0;i<2;i++){g.marches.forEach(m=>m.timeLeft=0);completeDue();}refresh();}
function resetGame(){
 if(!confirm("Oyunu tamamen sıfırlamak istediğine emin misin? Her şey silinir."))return;
 localStorage.removeItem(SAVE_KEY);localStorage.removeItem(OLD_KEY);localStorage.removeItem(SAVE_BACKUP);_pIntel={t:-1e9,atk:0,by:{}};newGame();lastTick=Date.now();save();switchTab('komuta');
}
function exportSave(){
 const s=JSON.stringify(g);
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(()=>toast('📋 Kayıt panoya kopyalandı')).catch(()=>prompt('Kaydı kopyala:',s));
 else prompt('Kaydı kopyala:',s);
}
function importSave(){
 const s=prompt('Kayıt metnini yapıştır:');if(!s)return;
 try{const o=JSON.parse(s);if(!o||!(o.v>=24&&o.v<=40)||!o.bots)throw 0;g=o;fixSave();_pIntel={t:-1e9,atk:0,by:{}};lastTick=Date.now();save();refresh();toast('✅ Kayıt yüklendi');}catch(e){alert('Geçersiz kayıt!');}
}


/* =====================  GELİŞTİRİCİ SAVAŞ SİMÜLATÖRÜ  ===================== */
const DEV_RES_NAMES=Object.keys(RES);
const DEV_COMBAT_UNITS=Object.keys(TROOPS).filter(n=>!TROOPS[n].nonCombat&&TROOPS[n].cls!=='spy');
const DEV_DEF_NAMES=Object.keys(DEF);
function devNum(id){const e=$(id);return Math.max(0,Math.floor(Number(e&&e.value)||0));}
function devResearch(prefix){const r={};DEV_RES_NAMES.forEach(n=>{const id=prefix+'-r-'+n.replace(/[^a-zA-Z0-9]/g,'_');r[n]=Math.max(0,Math.min(RES[n].max,devNum(id)));});return r;}
function devAtkMul(research,name){let p=0;for(const r in RES){const R=RES[r];if(R.k==='atk'&&R.targets&&R.targets.includes(name))p+=(R.pct*(research[r]||0))/100;}return 1+p;}
function devDefMul(research){return 1+0.08*(research['Zırh']||0);}
function devStructMul(research,n){let p=1+0.1*(research['Tahkimat']||0);p*=defResMul(n,r=>research[r]||0);if(n==='Tılsım Kalkanı')p*=1+0.1*(research['Tılsım']||0);return p;}
function devSide(research,troops,defs,role){
 const nightPenalty=Math.max(0,0.15-0.03*(research['Gece Görüş']||0));
 const loss=Math.max(0.5,1-0.05*(research['İçgüdü']||0));
 return{me:false,troops,defs,kale:devNum('dev-'+role+'-kale'),
  atk:n=>devAtkMul(research,n),def:()=>devDefMul(research),
  str:n=>devStructMul(research,n),night:nightPenalty,loss};
}
function devArmy(prefix){const o={};DEV_COMBAT_UNITS.forEach(n=>{const v=devNum(prefix+'-u-'+n.replace(/[^a-zA-Z0-9]/g,'_'));if(v>0)o[n]=v;});return o;}
function devDefs(prefix){const o={};DEV_DEF_NAMES.forEach(n=>{const v=devNum(prefix+'-d-'+n.replace(/[^a-zA-Z0-9]/g,'_'));if(v>0)o[n]=v;});return o;}
function devFmtPct(x){return `${x>=0?'+':''}${(x*100).toFixed(1)}%`;}
function devCopyResearch(side){const prefix=side==='a'?'dev-a':'dev-d';DEV_RES_NAMES.forEach(n=>{const id=prefix+'-r-'+n.replace(/[^a-zA-Z0-9]/g,'_');const e=$(id);if(e)e.value=rl(n);});refreshDevResearchLabels(prefix);}
function refreshDevResearchLabels(prefix){const box=$(prefix+'-research-values');if(!box)return;box.innerHTML=DEV_RES_NAMES.map(n=>`<span class="pill">${esc(n)} ${devNum(prefix+'-r-'+n.replace(/[^a-zA-Z0-9]/g,'_'))}</span>`).join(' ');}
function devPreset(kind){
 const map={zero:()=>DEV_RES_NAMES.forEach(n=>{const e=$('dev-a-r-'+n.replace(/[^a-zA-Z0-9]/g,'_'));if(e)e.value=0;}),current:()=>devCopyResearch('a'),max:()=>DEV_RES_NAMES.forEach(n=>{const e=$('dev-a-r-'+n.replace(/[^a-zA-Z0-9]/g,'_'));if(e)e.value=RES[n].max;})};
 (map[kind]||map.zero)();refreshDevResearchLabels('dev-a');
}
function devRun(iterations){
 const aa=devArmy('dev-a'),dd=devArmy('dev-d'),ad=devDefs('dev-a'),de=devDefs('dev-d');
 if(!Object.keys(aa).length||!Object.keys(dd).length){alert('İki tarafta da en az 1 savaş birliği seçmelisin.');return;}
 const ar=devResearch('dev-a'),dr=devResearch('dev-d');
 const a0=JSON.parse(JSON.stringify(aa)),d0=JSON.parse(JSON.stringify(dd)),ad0=JSON.parse(JSON.stringify(ad)),de0=JSON.parse(JSON.stringify(de));
 let wins=0,totalAL=0,totalDL=0,totalSL=0,sumA=0,sumD=0,sumRounds=0,last=null;
 for(let i=0;i<iterations;i++){
  const a=JSON.parse(JSON.stringify(a0)),d=JSON.parse(JSON.stringify(d0)),aDefs=JSON.parse(JSON.stringify(ad0)),dDefs=JSON.parse(JSON.stringify(de0));
  const att=devSide(ar,a,aDefs,'a'),def=devSide(dr,d,dDefs,'d');
  const res=fight(a,att,def,false);last={res,ar,dr,a0,d0,ad0,de0};
  if(res.win)wins++;
  totalAL+=Object.values(res.aLost).reduce((x,y)=>x+y,0);
  totalDL+=Object.values(res.dLost).reduce((x,y)=>x+y,0);
  totalSL+=Object.values(res.sLost).reduce((x,y)=>x+y,0);
  sumA+=res.A;sumD+=res.D;sumRounds+=res.rounds||0;
 }
 const wr=wins/iterations,avgAL=totalAL/iterations,avgDL=totalDL/iterations,avgSL=totalSL/iterations;
 const out=$('dev-result');if(!out)return;
 const rr=last.res, ratio=rr.D>0?rr.A/rr.D:99;
 const unitBlock=(initial,lost,dict)=>DEV_COMBAT_UNITS.concat(DEV_DEF_NAMES).map(n=>{if(!dict[n]||!(initial[n]>0))return '';const l=lost[n]||0;return `<div class="row"><span>${dict[n].icon||''} ${esc(n)}</span><b>${fmt(initial[n])} → ${fmt(Math.max(0,initial[n]-l))} <span class="mut xs">(kayıp ${fmt(l)})</span></b></div>`;}).join('');
 out.innerHTML=`<div class="card" style="border-color:var(--gold)"><h3>🧪 Tur Bazlı Simülasyon — ${iterations} savaş</h3>
  <div class="grid2"><div class="kv"><span>Zafer oranı</span><b class="${wr>=.5?'ok':'bad'}">%${(wr*100).toFixed(1)}</b></div><div class="kv"><span>Ortalama güç</span><b>${fmt(sumA/iterations)} vs ${fmt(sumD/iterations)}</b></div></div>
  <div class="kv"><span>Ortalama savaş süresi</span><b>${(sumRounds/iterations).toFixed(1)} tur</b></div><div class="kv"><span>Ortalama saldıran kaybı</span><b>${fmt(avgAL)}</b></div><div class="kv"><span>Ortalama savunan birlik kaybı</span><b>${fmt(avgDL)}</b></div><div class="kv"><span>Ortalama savunma yapısı kaybı</span><b>${fmt(avgSL)}</b></div>
  <div class="sep"></div><b class="gold small">Son savaşın ayrıntısı</b><p class="small">${rr.win?'🏆 Saldıran kazandı':'🛡️ Savunan kazandı'} • İlk güç oranı: <b>${ratio.toFixed(2)}×</b> • Süre: <b>${rr.rounds} tur</b></p><div class="small mut">${(rr.roundLog||[]).map(x=>`Tur ${x.round}: -${fmt(x.aLost)} saldıran / -${fmt(x.dLost)} savunan / -${fmt(x.sLost)} yapı`).join('<br>')}</div>
  <b class="small">⚔️ Saldıran</b>${unitBlock(rr.sent,rr.aLost,TROOPS)}
  <b class="small">🛡️ Savunan</b>${unitBlock(rr.defBefore,rr.dLost,TROOPS)}
  ${Object.keys(rr.structBefore).length?`<b class="small">🏰 Savunma yapıları</b>${unitBlock(rr.structBefore,rr.sLost,DEF)}`:''}
  <p class="mut xs">Bu test gerçek oyunun kaynaklarını, ordularını veya kayıtlarını değiştirmez. Akademi değerleri yalnızca simülasyonda kullanılır.</p></div>`;
}
function devResearchRows(prefix){return DEV_RES_NAMES.map(n=>{const id=prefix+'-r-'+n.replace(/[^a-zA-Z0-9]/g,'_');return `<div class="row"><span>${RES[n].icon} ${esc(n)} <span class="mut xs">maks ${RES[n].max}</span></span><input type="number" id="${id}" min="0" max="${RES[n].max}" value="0" style="width:70px;text-align:center"></div>`;}).join('');}
function devUnitRows(prefix){return DEV_COMBAT_UNITS.map(n=>{const id=prefix+'-u-'+n.replace(/[^a-zA-Z0-9]/g,'_');return `<div class="row"><span>${TROOPS[n].icon} ${esc(n)}</span><input type="number" id="${id}" min="0" value="0" style="width:90px;text-align:center"></div>`;}).join('');}
function devDefRows(prefix){return DEV_DEF_NAMES.map(n=>{const id=prefix+'-d-'+n.replace(/[^a-zA-Z0-9]/g,'_');return `<div class="row"><span>${DEF[n].icon} ${esc(n)}</span><input type="number" id="${id}" min="0" value="0" style="width:90px;text-align:center"></div>`;}).join('');}
function openDevSimulator(){
 openModal(`<h2>🧪 Geliştirici Savaş Test Merkezi</h2><p class="small mut">Gerçek savaş motorunu kullanır. Burada yaptığın değişiklikler oyundaki hesabını değiştirmez.</p>
 <div class="grid2"><div><div class="card"><h3>⚔️ Saldıran</h3><div class="row"><span>Kale</span><input type="number" id="dev-a-kale" min="1" max="10" value="1" style="width:70px"></div>${devUnitRows('dev-a')}<div class="sep"></div><b class="gold small">📜 Akademi</b>${devResearchRows('dev-a')}<div class="grid2"><button class="btn sm" onclick="devPreset('zero')">Tümü 0</button><button class="btn sm" onclick="devPreset('current')">Oyuncu araştırması</button></div><div id="dev-a-research-values" class="small mut" style="margin-top:6px"></div></div></div>
 <div><div class="card"><h3>🛡️ Savunan</h3><div class="row"><span>Kale</span><input type="number" id="dev-d-kale" min="1" max="10" value="1" style="width:70px"></div>${devUnitRows('dev-d')}<div class="sep"></div><b class="gold small">🏰 Savunma Yapıları</b>${devDefRows('dev-d')}<div class="sep"></div><b class="gold small">📜 Akademi</b>${devResearchRows('dev-d')}<div id="dev-d-research-values" class="small mut" style="margin-top:6px"></div></div></div></div>
 <div class="card"><h3>⚙️ Simülasyon</h3><div class="grid2"><button class="btn gold" onclick="devRun(1)">⚔️ 1 Savaş</button><button class="btn gold" onclick="devRun(100)">🎲 100 Savaş</button></div><button class="btn full" style="margin-top:8px" onclick="devRun(1000)">📊 1.000 Savaş ile Denge Testi</button><p class="mut xs">Her savaş en fazla 30 tur sürer; bir tarafın birlik gücü başlangıcın %15'ine düştüğünde savaş daha erken bitebilir. 100/1.000 tekrar, savaş şansı ve rastgele kayıp yuvarlamalarını ölçer. Gece, kahraman ve ittifak bonusları bu izole testte kapalıdır.</p></div>
 <div id="dev-result"><div class="card"><p class="mut small" style="text-align:center">Sonuç burada görünecek.</p></div></div>
 <button class="btn full" onclick="closeModal()">Kapat</button>`);
 refreshDevResearchLabels('dev-a');refreshDevResearchLabels('dev-d');
}

/* =====================  ARAYÜZ  ===================== */
function showErr(e){const el=$('err');el.style.display='block';el.textContent='Hata: '+(e&&e.message?e.message:e)+(e&&e.stack?' | '+String(e.stack).split('\n')[1]:'');}
window.addEventListener('error',ev=>showErr(ev.message+' (satır '+ev.lineno+')'));
function toast(msg){const r=$('toasts');if(!r)return;const t=document.createElement('div');t.className='toast';t.textContent=msg;r.appendChild(t);while(r.children.length>3)r.removeChild(r.firstChild);setTimeout(()=>t.remove(),3200);}
function openModal(h){$('ov-box').innerHTML=h;$('ov').classList.add('show');}
function closeModal(){$('ov').classList.remove('show');if(ui.tab==='mesaj')rMesaj();updateHeader();}
$('ov').addEventListener('click',e=>{if(e.target===$('ov'))closeModal();});
document.addEventListener('touchstart',()=>{ui.touchAt=Date.now();},{passive:true});
document.addEventListener('touchend',()=>{ui.touchAt=Date.now();try{const C=window.AudioContext||window.webkitAudioContext;if(C&&window.__ac&&window.__ac.state==='suspended')window.__ac.resume();}catch(e){}},{passive:true});

function refresh(){updateHeader();renderCurrent();save();}
function switchTab(t){
 if(t==='harita'){
  const activeCity=g.cities.find(c=>c.id===g.activeCityId)||g.cities[0];
  if(activeCity){ui.cont=activeCity.continent;}
 }
 ui.tab=t;['komuta','sehir','ordular','harita','mesaj','daha'].forEach(x=>{$('tab-'+x).classList.toggle('on',x===t);$('nb-'+x).classList.toggle('on',x===t);});
 if(t==='mesaj')g.unread=g.reports.some(r=>!r.read&&r.kind!=='request');
 renderCurrent();updateHeader();window.scrollTo(0,0);
}
function renderCurrent(){({komuta:rKomuta,sehir:rSehir,ordular:rDurum,harita:rHarita,mesaj:rMesaj,daha:rDaha})[ui.tab]();}
function updateHeader(){const _hn=$('h-nick');if(_hn&&g)_hn.textContent=pName();
 $('h-gold').textContent=fmt(g.gold);$('h-food').textContent=fmt(g.food);
 $('h-gr').textContent=`+${fmt(goldRate())}/sa`;$('h-fr').textContent=`+${fmt(foodRate())}/sa`;
 const activeCity=g.cities.find(c=>c.id===g.activeCityId)||g.cities[0];
 if(activeCity){
  $('h-coord').textContent=`${activeCity.continent}.${activeCity.row}`;
 }
 $('h-clock').textContent=(isNight()?'🌙 ':'☀️ ')+clockStr();
 $('badge').style.display=(g.unread&&ui.tab!=='mesaj')?'block':'none';
}
function updateTimers(){
 document.querySelectorAll('[data-timer]').forEach(el=>{
  const k=el.getAttribute('data-timer');let v=null;
  if(k==='building'&&g.tasks.building)v=g.tasks.building.timeLeft;
  else if(k==='academy'&&g.sharedAcademyTask)v=g.sharedAcademyTask.timeLeft;
  else if(k==='research'&&g.tasks.research)v=g.tasks.research.timeLeft;
  else if(k.startsWith('m')){const m=g.marches.find(x=>x.id===+k.slice(1));if(m)v=m.timeLeft;}
  else if(k.startsWith('in')){const a=(g.incomingAttacks||[]).find(x=>x.id===+k.slice(2));if(a)v=a.timeLeft;}
  else if(k.startsWith('e-')){const e=g.events[k.slice(2)];if(e)v=e.timeLeft;}
  else if(k.startsWith('q')){const b=g.tasks.queue.find(x=>x.id===+k.slice(1));if(b)v=b.cur+(b.count-1)*b.unit;}

  if(v!==null)el.textContent=formatTime(v);
 });
}
const costChips=(c,gd,fd)=>`<span class="${g.gold>=c.g?'':'bad'}">💰${fmt(c.g)}</span> <span class="${g.food>=c.f?'':'bad'}">🍗${fmt(c.f)}</span>`;

function acc(id,title,sub,body){
 return`<div class="acc"><div class="hd" onclick="toggleAcc('${id}')"><div>${title}<div class="mut xs" style="font-weight:400">${sub}</div></div><span>${ui.open[id]?'▲':'▼'}</span></div>${ui.open[id]?`<div class="bd">${body}</div>`:''}</div>`;
}
function toggleAcc(id){ui.open[id]=!ui.open[id];renderCurrent();}

/* ---- KOMUTA ---- */
function allPlayers(){return[{me:true,name:pName(),score:pScore(),alliance:g.alliance.name},...g.bots.map(b=>({id:b.id,name:b.name,score:bScore(b),alliance:b.alliance}))].sort((a,b)=>b.score-a.score);}
function rankKey(p){return p.me?'me':String(p.id);}
function rankArrow(p,rank){const prev=g.rankPrevMap&&g.rankPrevMap[rankKey(p)];if(prev==null)return '<span class="mut">•</span>';if(rank<prev)return '<span class="ok">▲</span>';if(rank>prev)return '<span class="bad">▼</span>';return '<span class="mut">•</span>';}
function updateRankSnapshot(){if(g.simTime-(g.rankStamp||0)<300)return;const a=allPlayers(),old=g.rankPrevMap||{};g.rankPrevMap={};a.forEach((p,i)=>{g.rankPrevMap[rankKey(p)]=i+1;});g.rankStamp=g.simTime;}

function allianceRanking(){
 const m={};g.alliances.forEach(a=>m[a.name]={name:a.name,score:0,n:0,level:allyLevel(a.name)});
 const add=(n,s)=>{if(n&&m[n]){m[n].score+=s;m[n].n++;}};
 add(g.alliance.name,pScore());g.bots.forEach(b=>add(b.alliance,bScore(b)));
 return Object.values(m).filter(x=>x.n>0).sort((a,b)=>b.score-a.score);
}
function switchKomutaTab(t){ui.komutaTab=t;rKomuta();}
function rKomuta(){
 const ap=allPlayers(),rank=ap.findIndex(p=>p.me)+1;
 const tab=ui.komutaTab||'ozet';
 // Sekme çubuğu
 let h=`<div class="card" style="padding:6px 4px"><div class="tabs" style="margin:0">
  <button class="${tab==='ozet'?'on':''}" onclick="switchKomutaTab('ozet')">Özet</button>
  <button class="${tab==='gorev'?'on':''}" onclick="switchKomutaTab('gorev')">Görevler</button>
  <button class="${tab==='ittifak'?'on':''}" onclick="switchKomutaTab('ittifak')">İttifak</button>
  <button class="${tab==='sira'?'on':''}" onclick="switchKomutaTab('sira')">Sıralama</button>
 </div></div>`;

 if(tab==='ozet'){
  storeActiveCity();
  let totG=0,totF=0,totTroops=0,totDefs=0,nearest=null;
  g.cities.forEach(c=>{
    totG+=c.gold||0; totF+=c.food||0;
    for(const n in (c.myTroops||{})) totTroops+=(c.myTroops[n]||0);
    for(const n in (c.myDefenses||{})) totDefs+=(c.myDefenses[n]||0);
  });
  (g.incomingAttacks||[]).forEach(a=>{
    if(nearest==null || a.timeLeft<nearest.timeLeft) nearest=a;
  });
  h+=`<div class="card"><h2>👑 HÜKÜMDARLIK</h2>
  <div class="kv"><span>Hükümdar</span><b class="gold">${esc(pName())}</b></div>
  <div class="kv"><span>Puan</span><b>${pScore()}</b></div>
  <div class="kv"><span>Sıra</span><b class="blue">${rank} / ${ap.length}</b></div>
  <div class="kv"><span>İttifak</span><b class="gold">${esc(g.alliance.name||'Yok')}</b></div>
  <div class="kv"><span>Kahraman</span><b class="gold">${esc((g.hero&&g.hero.name)||'Kahraman')}</b></div>
  <div class="kv"><span>Kahraman bonusu</span><b class="ok">ATK +%${Math.round(heroAtkBonus()*100)} / DEF +%${Math.round(heroDefBonus()*100)}</b></div>
  </div>`;
  h+=`<div class="card"><h3>📊 Genel Durum</h3>
  <div class="kv"><span>Şehir</span><b>${g.cities.length} / 6</b></div>
  <div class="kv"><span>Yapı (aktif şehir)</span><b class="gold">${totalB()} / ${maxB()}</b></div>
  <div class="kv"><span>Sefer Hakkı</span><b>${typeof activeSeferCount==='function'?activeSeferCount():g.marches.length} / ${seferHakki()}</b></div>
  <div class="kv"><span>Toplam Altın</span><b class="gold">${fmt(totG)}</b></div>
  <div class="kv"><span>Toplam Yemek</span><b>${fmt(totF)}</b></div>
  <div class="kv"><span>Üretim (aktif şehir)</span><b class="ok">+${fmt(Math.floor(goldRate()))}💰/s +${fmt(Math.floor(foodRate()))}🍗/s</b></div>
  <div class="kv"><span>Toplam Asker</span><b>${fmt(totTroops)}</b></div>
  <div class="kv"><span>Toplam Savunma</span><b>${fmt(totDefs)}</b></div>
  <div class="kv"><span>En Yakın Saldırı</span><b class="${nearest?'bad':'ok'}">${nearest?`${esc(nearest.botName)} → ${esc(nearest.targetCityName)} (${formatTime(nearest.timeLeft)})`:'Yok'}</b></div>
  </div>`;
 }

 if(tab==='gorev'){
  const open=QUESTS.filter(q=>!g.quests[q.id]);
  h+=`<div class="card"><h3><span>🎯 Ana Görevler</span><span class="mut xs">${QUESTS.length-open.length}/${QUESTS.length}</span></h3>`;
  if(!open.length)h+='<p class="mut small">Tüm görevleri tamamladın! 🏆</p>';
  open.slice(0,8).forEach(q=>{const done=q.c();h+=`<div class="row"><span>${done?'✅':'⬜'} ${q.t}<br><span class="xs mut">Ödül: ${fmt(q.r[0])}💰 ${fmt(q.r[1])}🍗</span></span><button class="btn gold sm" ${done?'':'disabled'} onclick="claimQuest('${q.id}')">Al</button></div>`;});
  h+='</div>';
  checkDailyReset();
  const dOpen=DAILY_QUESTS.filter(q=>!g.daily.claimed[q.id]);
  h+=`<div class="card"><h3><span>📅 Günlük Görevler</span><span class="mut xs">${DAILY_QUESTS.length-dOpen.length}/${DAILY_QUESTS.length}</span></h3>`;
  if(!dOpen.length)h+='<p class="mut small">Bugünkü görevlerin tamamı alındı! Yarın yenilenecek.</p>';
  dOpen.forEach(q=>{const done=q.c();h+=`<div class="row"><span>${done?'✅':'⬜'} ${q.t}<br><span class="xs mut">Ödül: ${fmt(q.r[0])}💰 ${fmt(q.r[1])}🍗</span></span><button class="btn gold sm" ${done?'':'disabled'} onclick="claimDaily('${q.id}')">Al</button></div>`;});
  h+='</div>';
  checkWeeklyReset();
  const wOpen=WEEKLY_QUESTS.filter(q=>!g.weekly.claimed[q.id]);
  h+=`<div class="card"><h3><span>📆 Haftalık Görevler</span><span class="mut xs">${WEEKLY_QUESTS.length-wOpen.length}/${WEEKLY_QUESTS.length}</span></h3>`;
  if(!wOpen.length)h+='<p class="mut small">Bu haftaki görevler tamam! Yeni haftada yenilenir.</p>';
  wOpen.forEach(q=>{const done=q.c();h+=`<div class="row"><span>${done?'✅':'⬜'} ${q.t}<br><span class="xs mut">Ödül: ${fmt(q.r[0])}💰 ${fmt(q.r[1])}🍗</span></span><button class="btn gold sm" ${done?'':'disabled'} onclick="claimWeekly('${q.id}')">Al</button></div>`;});
  h+='</div>';
 }

 if(tab==='ittifak'){
  const lv=myAllyLevel();
  h+=`<div class="card"><span><span>🛡️ İttifak</span><span class="ok small" style="cursor:pointer;text-decoration:underline;float:right" onclick="openAllyInfo()">Seviye ${lv} ℹ️</span></span></div>`;
  if(g.alliance.name){
   const a=allyEntry(g.alliance.name),nx=lv<5?ALLY_T[lv]:null;
   const members=[{name:(pName()+' (Sen)'),score:pScore(),leader:g.alliance.isLeader,id:null},...g.bots.filter(b=>b.alliance===a.name).map(b=>({name:b.name,score:bScore(b),leader:a.leader===b.name,id:b.id}))].sort((x,y)=>y.score-x.score);
   h+=`<div class="card"><div class="kv"><span>Ad</span><b class="gold">${esc(a.name)}</b></div><div class="kv"><span>Lider</span><b>${esc(a.leader||'-')}</b></div><div class="kv"><span>Üye</span><b>${allyMembers(a.name)}/20</b></div>
   <div class="kv"><span>Toplam bağış</span><b>${fmt(a.donated)}${nx?' / '+fmt(nx):' (MAKS)'}</b></div>
   <div class="bar"><i style="width:${nx?Math.min(100,a.donated/nx*100):100}%"></i></div>
   <div class="kv"><span>Senin bağışın</span><b>${fmt(g.alliance.goldDonated)}💰 ${fmt(g.alliance.foodDonated)}🍗</b></div>
   <div class="sep"></div><div class="small gold" style="margin-bottom:6px">Üyeler</div>
   ${members.map(m=>`<div class="row" ${m.id?`onclick="openPlayerModal(${m.id})" style="cursor:pointer"`:''}><span>${m.leader?'👑 ':''}${esc(m.name)}</span><b>${m.score}</b></div>`).join('')}
   <div class="grid2" style="margin-top:8px"><button class="btn gold sm" onclick="donate('gold',200)">200 Altın</button><button class="btn gold sm" onclick="donate('food',200)">200 Yemek</button><button class="btn gold sm" onclick="donate('gold',1000)">1000 Altın</button><button class="btn gold sm" onclick="donate('food',1000)">1000 Yemek</button></div>
   <div class="sep"></div><div class="small gold" style="margin-bottom:6px">💬 İttifak Sohbeti</div>
   <div style="max-height:160px;overflow-y:auto;margin-bottom:8px">${(g.allyChat||[]).slice(-20).map(m=>`<div class="small" style="margin:4px 0"><b class="gold">${esc(m.name)}</b> <span class="mut xs">${m.t||''}</span><br>${esc(m.msg)}</div>`).join('')||'<p class="mut xs">Henüz mesaj yok.</p>'}</div>
   <div class="row"><input type="text" id="ally-chat-in" maxlength="120" placeholder="Mesaj yaz..." style="flex:1;text-align:left"><button class="btn gold sm" onclick="sendAllyChat()">Gönder</button></div>
   <button class="btn red full sm" style="margin-top:8px" onclick="leaveAlliance()">Ayrıl</button></div>`;
  }else{
   h+=`<div class="card"><div class="row"><input type="text" id="new-ally" maxlength="16" placeholder="İttifak adı (1000 altın)" value="${esc(ui.allyName)}" oninput="ui.allyName=this.value" style="width:auto;flex:1;text-align:left"><button class="btn gold sm" onclick="createAlliance()">Kur</button></div>`;
   if(g.pendingJoin)h+=`<p class="small gold">📨 "${esc(g.pendingJoin.name)}" yanıtı bekleniyor...</p>`;
   allianceRanking().forEach(a=>{h+=`<div class="row"><span>🛡️ ${esc(a.name)} <span class="pill">Sv ${a.level}</span><span class="pill">${a.n} üye</span></span><button class="btn gold sm" ${g.pendingJoin?'disabled':''} onclick="requestJoin('${esc(a.name).replace(/'/g,"\\'")}')">İstek</button></div>`;});
   h+=`</div>`;
  }
  h+=`<div class="card"><h3>⚔️ Dostlar & Düşmanlar</h3><p class="mut xs">İttifakına savaş ilan eden ittifakların üyeleri hedef önceliğine girer. Dost ittifaklara saldırı kapalıdır.</p>${g.alliance.name?g.alliances.filter(a=>a.name!==g.alliance.name).map(a=>{const w=g.allianceWars.includes(a.name);return `<div class="row"><span>🛡️ ${esc(a.name)} <span class="pill">${w?'DÜŞMAN':'DOST/NEUTRAL'}</span></span><button class="btn ${w?'red':'gold'} sm" onclick="toggleAllianceWar('${esc(a.name).replace(/'/g,"\'")}')">${w?'Savaşı Bitir':'Savaş İlan Et'}</button></div>`;}).join(''):'<p class="mut small">Önce bir ittifaka katıl veya kur.</p>'}</div>`;
 }

 if(tab==='sira'){
  h+=`<div class="card"><h3>🏆 Dünya Sıralaması</h3>`;
  ap.slice(0,30).forEach((p,i)=>{
   const pName = p.me ? pName() : p.name;
   h+=`<div class="list-row ${p.me?'me':''}" ${p.me?'':`onclick="selectPlayer(${p.id})"`}><span>${i+1}. ${rankArrow(p,i+1)} ${esc(pName)}${p.alliance?` <span class="gold xs">[${esc(p.alliance)}]</span>`:''}</span><span>${p.score}</span></div>`;
  });
  if(rank>30)h+=`<div class="list-row me"><span>${rank}. ${esc(pName())}</span><span>${pScore()}</span></div>`;
  h+='</div><div class="card"><h3>🛡️ İttifak Sıralaması</h3>';
  const ar=allianceRanking();if(!ar.length)h+='<p class="mut small">Aktif ittifak yok.</p>';
  ar.forEach((a,i)=>{h+=`<div class="row"><span>${i+1}. 🛡️ ${esc(a.name)} <span class="pill">${a.n} üye</span></span><b class="gold">${a.score}</b></div>`;});
  h+='</div>';
 }

 $('tab-komuta').innerHTML=h;
}
function selectPlayer(id){switchTab('harita');openPlayerModal(id);}
function openAllyInfo(){
 const lv=myAllyLevel(),L=[["Temel Birlik","İttifak kurulur. Üyeler birlikte gelişir."],["Zenginlik Damarları","Altın ve yemek üretimi +%15."],["Çelik Zırhlar","Tüm birliklerin saldırı ve savunması +%20."],["Hızlı İntikal","Sefer ve casus süreleri %15 daha kısa."],["Kraliyet Kalesi","Yapı sınırı +10."]];
 openModal(`<h3>🛡️ İttifak Seviyeleri</h3>`+L.map((x,i)=>`<div class="row" style="${lv===i+1?'border-color:var(--gold)':''}"><span><b class="gold">Seviye ${i+1} — ${x[0]}</b><br><span class="mut xs">${x[1]} (Bağış: ${fmt(ALLY_T[i])})</span></span></div>`).join('')+`<button class="btn full" onclick="closeModal()">Kapat</button>`);
}

/* ---- ŞEHİR ---- */
function cardB(k){
 const B=BUILD[k],l=bl(k),c=buildCost(k);
 const q=g.tasks.buildQueue||[];
 // Akademi ayrı (ortak), diğerleri kuyrukta
 const qIdx=k==='akademi'?-1:q.findIndex(x=>x.key===k);
 const qItem=k==='akademi'?null:(qIdx>=0?q[qIdx]:null);
 const akAct=k==='akademi'?g.sharedAcademyTask:null;
 const isActive=!!(akAct||(qIdx===0&&qItem));
 const isQueued=qIdx>0; // 2. veya 3. sırada — pasif
 const actTask=akAct||(isActive?qItem:null);

 let ok=true;const rq=[];for(const r in B.req){const o=bl(r)>=B.req[r];if(!o)ok=false;rq.push(`<span class="${o?'ok':'bad'}">${BUILD[r].name} ${B.req[r]}</span>`);}
 const maxed=l>=B.max,lim=k!=='kale'&&totalB()+q.filter(x=>x.key===k).length>=maxB(),aff=g.gold>=c.g&&g.food>=c.f;
 const queueFull=(k==='akademi'?!!g.sharedAcademyTask:q.length>=3);

 let btn;
 if(isActive&&actTask){
  // 1. sırada / aktif yükseltme
  btn=`<div class="timer" data-timer="${k==='akademi'?'academy':'building'}">${formatTime(actTask.timeLeft)}</div><button class="btn red sm" onclick="cancelBuilding(${actTask.id})">İptal</button>`;
 }else if(isQueued&&qItem){
  // Sırada bekleyen — pasif görünüm + iptal
  btn=`<div class="mut xs" style="text-align:center;margin-bottom:4px">⏳ Sırada #${qIdx+1}</div><button class="btn red sm" onclick="cancelBuilding(${qItem.id})">İptal</button>`;
 }else{
  btn=`<button class="btn gold" ${(!ok||maxed||lim||!aff||queueFull)?'disabled':''} onclick="upgradeB('${k}')">${maxed?'MAKS':'Yükselt'}</button>`;
 }

 const cls=isQueued?' item-queued':(isActive?' item-active-build':'');
 return`<div class="card item${cls}"><div><div class="t"><span>${B.icon}</span><u onclick="openInfo('b','${k}')">${B.name}</u><span class="mut small" style="font-weight:400">Sv ${l}/${B.max}</span>${isQueued?'<span class="pill" style="margin-left:4px">Sırada</span>':isActive?'<span class="pill" style="margin-left:4px;border-color:var(--gold);color:var(--gold)">Yükseliyor</span>':''}</div>
 <div class="s">${costChips(c)} ⏱️ ${formatTime(buildTime(k))}</div>
 <div class="s mut">${l>0?B.fx(l):'—'} ➜ ${l<B.max?B.fx(l+1):'—'}</div>
 <div class="s xs">${rq.join(' | ')}${lim&&!maxed?' <span class="bad">Yapı sınırı!</span>':''}</div></div><div class="act">${btn}</div></div>`;
}
function cardT(n){
 const u=TROOPS[n],rq=troopReq(n),k='t:'+n;
 return`<div class="card item"><div><div class="t"><span>${u.icon}</span><u onclick="openInfo('t','${n}')">${n}</u><span class="pill">${CLS_NAME[u.cls]}</span></div>
 <div class="s">⚔️${Math.floor(u.atk*atkResMul(n))} 🛡️${u.def} • ${n==='Kağnı'?`🎒${fmt(unitCap(n))} taşıma`:'⚡ Savaş birliği'} • ⏱️${formatTime(troopTime(n))}</div>
 <div class="s">💰${fmt(u.g)} 🍗${fmt(u.f)}</div><div class="s xs">${rq.txt.join(' | ')}</div></div>
 <div class="act row"><input class="q" type="number" inputmode="numeric" min="1" value="${getAmt(k)}" oninput="setAmt('${k}',this.value)"><div style="display:flex;flex-direction:column;gap:4px"><button class="btn gold sm" ${rq.ok?'':'disabled'} onclick="queueTroops('${n}')">Eğit</button><button class="btn sm" ${rq.ok?'':'disabled'} onclick="maxAmt('t','${n}')">Maks</button></div></div></div>`;
}
function cardD(n){
 const d=DEF[n],rq=defReq(n),k='d:'+n,lv=defCount(n),maxed=d.level&&lv>=d.max;
 const next=d.level?defLevelCost(n,Math.min(d.max,lv+1)):null;
 return`<div class="card item"><div><div class="t"><span>${d.icon}</span><u onclick="openInfo('d','${n}')">${n}</u><span class="pill">${d.level?`Sv ${lv}/${d.max}`:`${lv} adet`}</span></div>
 <div class="s">🛡️${d.level?`${d.def} / seviye` : d.def} • ⏱️${formatTime(defTime(n))} • ${d.level?(maxed?'MAKS':`💰${fmt(next.g)} 🍗${fmt(next.f)}`):`💰${fmt(d.g)} 🍗${fmt(d.f)}`}</div><div class="s xs">${rq.txt.join(' | ')}</div></div>
 <div class="act row"><input class="q" type="number" inputmode="numeric" min="1" value="${getAmt(k)}" oninput="setAmt('${k}',this.value)"><div style="display:flex;flex-direction:column;gap:4px"><button class="btn gold sm" ${(!rq.ok||maxed)?'disabled':''} onclick="queueDef('${n}')">${maxed?'MAKS':'Üret'}</button><button class="btn sm" ${(!rq.ok||maxed)?'disabled':''} onclick="maxAmt('d','${n}')">Maks</button></div></div></div>`;
}
function cardR(n){
 const R=RES[n],l=rl(n),act=g.tasks.research&&g.tasks.research.name===n,c=resCost(n);
 const akUp=!!g.sharedAcademyTask||(g.tasks.building&&g.tasks.building.key==='akademi'),okAk=bl('akademi')>=R.ak,maxed=l>=R.max,busy=!!g.tasks.research&&!act,aff=g.gold>=c.g&&g.food>=c.f;
 const btn=act?`<div class="timer" data-timer="research">${formatTime(g.tasks.research.timeLeft)}</div><button class="btn red sm" onclick="cancelResearch()">İptal</button>`:
  `<button class="btn gold" ${(!okAk||maxed||busy||akUp||!aff)?'disabled':''} onclick="startResearch('${n}')">${maxed?'MAKS':'Araştır'}</button>`;
 return`<div class="card item"><div><div class="t"><span>${R.icon}</span><u onclick="openInfo('r','${n}')">${R.name}</u><span class="mut small" style="font-weight:400">Sv ${l}/${R.max}</span></div>
 <div class="s">${costChips(c)} ⏱️ ${formatTime(resTime(n))}</div>
 <div class="s mut">${l>0?resEffect(n,l):'—'} ➜ ${l<R.max?resEffect(n,l+1):'—'}</div>
 <div class="s xs"><span class="${okAk?'ok':'bad'}">Akademi ${R.ak}</span>${akUp?' <span class="bad">Akademi yükseltiliyor</span>':''}</div></div><div class="act">${btn}</div></div>`;
}
function switchSehirTab(t){ui.sehirTab=t;rSehir();}
function rSehir(){
 const tab=ui.sehirTab||'yapilar';
 // Üst kısım (şehir seçici + özet) aynı kalır
 let h=`<div class="card city-switcher"><div class="city-tabs">${g.cities.map((c,i)=>`<button class="btn city-tab ${c.id===g.activeCityId?'city-active':''}" onclick="switchCity(${c.id})"><span class="city-emblem">${g.cities.length===1?'🏰✨':'🏰'}</span><span>${esc(c.name)}</span><small>${c.continent}.${c.row}</small>${(g.incomingAttacks||[]).filter(a=>a.targetCityId===c.id).length?`<b class="incoming-sword" onclick="event.stopPropagation();openIncomingAttacks(${c.id})">⚔️ ${(g.incomingAttacks||[]).filter(a=>a.targetCityId===c.id).length}</b>`:''}</button>`).join('')}</div>${g.cities.length<(1+Math.floor(rl('Yurt Tutma')/3))&&g.cities.length<6?`<button class="btn gold full" onclick="foundCity()">➕ Yeni Şehir Kur (${g.cities.length}/${Math.min(6,1+Math.floor(rl('Yurt Tutma')/3))})</button>`:`<div class="mut xs" style="text-align:center">Yeni şehir hakkı: Yurt Tutma ${Math.floor(rl('Yurt Tutma')/3)} / 5</div>`}<button class="btn sm full" style="margin-top:6px" onclick="renameCity(g.activeCityId)">✏️ Aktif Şehri Yeniden Adlandır</button></div><div class="card" style="text-align:center"><span class="mut small">🏛️ Yapı Sayısı: </span><b class="gold">${totalB()} / ${maxB()}</b> &nbsp; <span class="mut small">⚔️ Asker: </span><b class="gold">${fmt(Object.values(g.myTroops||{}).reduce((a,b)=>a+(Number(b)||0),0))} birlik</b></div>`;

 // Alt kısım sekmeli
 h+=`<div class="card" style="padding:6px 4px"><div class="tabs" style="margin:0">
  <button class="${tab==='yapilar'?'on':''}" onclick="switchSehirTab('yapilar')">Yapılar</button>
  <button class="${tab==='akademi'?'on':''}" onclick="switchSehirTab('akademi')">Akademi</button>
  <button class="${tab==='savunma'?'on':''}" onclick="switchSehirTab('savunma')">Savunma</button>
  <button class="${tab==='kisla'?'on':''}" onclick="switchSehirTab('kisla')">Kışla</button>
 </div></div>`;

 if(tab==='yapilar'){
  h+=`<div class="card"><h3>🏛️ Şehir Yapıları</h3><p class="mut xs" style="margin-bottom:8px">Binalarını geliştir</p>${Object.keys(BUILD).map(cardB).join('')}</div>`;
 }
 if(tab==='akademi'){
  h+=`<div class="card"><h3>📜 Akademi Araştırmaları</h3><p class="mut xs" style="margin-bottom:8px">Akademi Sv ${bl('akademi')}</p>`;
  h+=bl('akademi')<1?'<p class="mut small" style="padding:8px">Araştırma için önce Akademi inşa et.</p>':Object.keys(RES).map(cardR).join('');
  h+='</div>';
 }
 if(tab==='savunma'){
  h+=`<div class="card"><h3>🏰 Savunma Sistemleri</h3><p class="mut xs" style="margin-bottom:8px">Sur ve Tılsım Kalkanı seviye bazlıdır (maks. 20). Diğer savunmalar sınırsızdır.</p>${Object.keys(DEF).map(cardD).join('')}</div>`;
 }
 if(tab==='kisla'){
  h+=`<div class="card"><h3>⚔️ Kışla — Asker Üretimi</h3><p class="mut xs" style="margin-bottom:8px">Kışla Sv ${bl('kisla')} | Sefer hakkı ${seferHakki()}</p>`;
  h+=bl('kisla')<1?'<p class="mut small" style="padding:8px">Asker eğitmek için önce Kışla inşa et.</p>':Object.keys(TROOPS).map(cardT).join('');
  h+='</div>';
 }

 $('tab-sehir').innerHTML=h;
}

/* ---- DURUM ---- */
function switchDurumTab(t){ui.durumTab=t;rDurum();}
function rDurum(){
 const tab=ui.durumTab||'ozet';
 let h=`<div class="card" style="padding:6px 4px"><div class="tabs" style="margin:0">
  <button class="${tab==='ozet'?'on':''}" onclick="switchDurumTab('ozet')">Özet</button>
  <button class="${tab==='ordu'?'on':''}" onclick="switchDurumTab('ordu')">Ordu</button>
  <button class="${tab==='kuyruk'?'on':''}" onclick="switchDurumTab('kuyruk')">Kuyruklar</button>
  <button class="${tab==='sefer'?'on':''}" onclick="switchDurumTab('sefer')">Seferler</button>
 </div></div>`;

 if(tab==='ozet'){
  let ev='';for(const k in g.events){const e=g.events[k];if(e)ev+=`<div class="row"><span>${k==='build'?'🏛️ İnşaat':k==='research'?'📜 Araştırma':'⚔️ Eğitim'} hızı <b class="ok">+%${e.rate}</b></span><span class="gold" data-timer="e-${k}">${formatTime(e.timeLeft)}</span></div>`;}
  h+=`<div class="card"><h3>🛡️ Genel Durum</h3>`;
  if(ev)h+=`<h3 class="small">⚡ Aktif Etkinlikler</h3>${ev}`;
  h+=``;
  h+=`<div class="kv"><span>Sefer hakkı</span><b>${g.marches.length} / ${seferHakki()}</b></div>`;
  const ps=playerSide();
  h+=`<div class="kv"><span>Savunma gücü</span><b>${fmt(predict({},ps,ps,false).D)}</b></div>`;
  h+=`<div class="kv"><span>Saldırı gücü (evdeki)</span><b>${fmt(classPower(ps,g.myTroops,'atk').tot)}</b></div></div>`;
  const incoming=(g.incomingAttacks||[]).slice().sort((a,b)=>(Number(a.timeLeft)||0)-(Number(b.timeLeft)||0));
  if(incoming.length)h+=`<div class="card incoming-alert" onclick="openIncomingAttacks()"><b>🔴 ⚔️ GELEN SALDIRILAR (${incoming.length})</b>${incoming.map(a=>`<div>${esc(a.botName)} → ${esc(a.targetCityName)} • <i data-timer="in${a.id}">${formatTime(a.timeLeft)}</i></div>`).join('')}<small>Detay için dokun</small></div>`;
 }

 if(tab==='ordu'){
  const tk=Object.keys(g.myTroops).filter(n=>g.myTroops[n]>0),dk=Object.keys(g.myDefenses).filter(n=>g.myDefenses[n]>0);
  h+=`<div class="card"><h3>⚔️ Askerler</h3>`+(tk.length?tk.map(n=>`<div class="row"><span>${TROOPS[n].icon} ${n}</span><b>${g.myTroops[n]}</b></div>`).join(''):'<p class="mut small">Askerin yok.</p>')+`</div>`;
  h+=`<div class="card"><h3>🏰 Savunma Yapıları</h3>`+(dk.length?dk.map(n=>`<div class="row"><span>${DEF[n].icon} ${n}</span><b>${g.myDefenses[n]}</b></div>`).join(''):'<p class="mut small">Savunma yapın yok.</p>')+`</div>`;
 }

 if(tab==='kuyruk'){
  const t=g.tasks;
  h+=`<div class="card"><h3>⏳ Kuyruklar</h3>`;
  h+=`<div class="small gold" style="margin:8px 0 4px">🏛️ İnşaat Kuyruğu (3)</div>`;
  if(g.sharedAcademyTask)h+=`<div class="row"><span>📜 Ortak Akademi (tüm şehirlerde)</span><span><span class="gold" data-timer="academy">${formatTime(g.sharedAcademyTask.timeLeft)}</span> <button class="btn red sm" onclick="cancelBuilding(${g.sharedAcademyTask.id})">İptal</button></span></div>`;
  h+=(t.buildQueue||[]).length?(t.buildQueue||[]).map((b,i)=>`<div class="row"><span>${i===0?'🔨':'⏳'} ${b.name} ${i===0?'(aktif)':'(sırada)'}</span><span>${i===0?`<span class="gold" data-timer="building">${formatTime(b.timeLeft)}</span>`:''} <button class="btn red sm" onclick="cancelBuilding(${b.id})">İptal</button></span></div>`).join(''):'<p class="mut small">İnşaat kuyusu boş.</p>';
  h+=`<div class="row"><span>📜 Araştırma: ${t.research?`<b class="gold">${t.research.name}</b>`:'<span class="mut">Boşta</span>'}</span>${t.research?`<span><span class="gold" data-timer="research">${formatTime(t.research.timeLeft)}</span> <button class="btn red sm" onclick="cancelResearch()">İptal</button></span>`:''}</div>`;
  h+=`<div class="small gold" style="margin:8px 0 4px">⚔️ Eğitim / Savunma Kuyruğu</div>`;
  h+=t.queue.length?t.queue.map(b=>`<div class="row"><span>${b.def?DEF[b.name].icon:TROOPS[b.name].icon} ${b.name} ×${b.count}</span><span><span class="gold" data-timer="q${b.id}">${formatTime(b.cur+(b.count-1)*b.unit)}</span> <button class="btn red sm" onclick="cancelBatch(${b.id})">İptal</button></span></div>`).join(''):'<p class="mut small">Kuyruk boş.</p>';
  h+='</div>';
 }

 if(tab==='sefer'){
  h+=`<div class="card"><h3>🚩 Seferler (${typeof activeSeferCount==='function'?activeSeferCount():g.marches.length}/${seferHakki()})${(g.marches||[]).some(m=>m.type==='kurulus')?' · 🏗️ kurucu':''}</h3>`;
  h+=g.marches.length?g.marches.map(m=>{const b=g.bots.find(x=>x.id===m.target);const tn={casus:'Casusluk',saldiri:'Saldırı',nakliye:'Nakliye',destek:'Destek',kurulus:'Şehir Kurma'}[m.type]||m.type;
   const targetName=m.type==='kurulus'?`${m.continent}.${m.row}`:(m.targetCityName||(b?b.name:'?'));
   const canCancel=!m.back;
   return`<div class="row"><span>🚩 ${tn} → ${esc(targetName)}<br><span class="mut xs">${m.back?'Dönüş yolunda':'Gidiş yolunda'}</span></span><span><span class="gold" data-timer="m${m.id}">${formatTime(m.timeLeft)}</span>${canCancel?` <button class="btn red sm" onclick="cancelMarch(${m.id})">İptal</button>`:''}</span></div>`;}).join(''):'<p class="mut small">Hareketlilik yok.</p>';
  h+='</div>';
 }

 $('tab-ordular').innerHTML=h;
}

/* ---- HARİTA ---- */
function rHarita(){
 const pp=g.playerPos||{continent:ui.cont,row:1};
 const players=[];
 g.bots.filter(b=>b.continent===ui.cont).forEach(b=>players.push({me:false,name:b.name,row:b.row||b.y||1,score:bScore(b),id:b.id,alliance:b.alliance||'',bot:b}));
 g.cities.filter(c=>c.continent===ui.cont).forEach(c=>players.push({me:true,name:c.name||pName(),row:c.row,score:pScore(),id:null,cityId:c.id,alliance:g.alliance.name||''}));
 let h=`<div class="card map-panel"><div class="map-toolbar"><span class="map-label">KITA</span><button class="btn map-step" onclick="changeCont(-1)" aria-label="Önceki kıta">−</button><span class="map-number">${ui.cont}</span><button class="btn map-step" onclick="changeCont(1)" aria-label="Sonraki kıta">+</button><span class="map-count">24 kıta • ${players.length} yerleşim</span><div class="map-tools"><button class="btn" title="Şehrime git" onclick="goMyCity()">🏰</button></div></div><div class="map-table-head"><span>#</span><span>OYUNCU / KOORDİNAT</span><span style="text-align:right">SIRA / PUAN</span></div>`;
 for(let i=1;i<=10;i++){
  const p=players.find(x=>Number(x.row)===i);
  if(!p){
   h+=`<div class="map-entry" onclick="openEmptyCoordModal(${ui.cont}, ${i})"><span class="map-rank">${i}</span><span class="map-player map-empty">Boş Arsa <small>${ui.cont}.${i} (Şehir kurmak için dokun)</small></span><span class="map-score map-empty">+</span></div>`;
   continue;
  }
  const coord=`${ui.cont}.${i}${p.alliance?` • [${esc(p.alliance)}]`:''}`;
  // Sefer göstergeleri
  let marchMarks='';
  (g.marches||[]).forEach(m=>{
    const bot=g.bots.find(x=>x.id===m.target);
    const onBot=bot&&bot.continent===ui.cont&&Number(bot.row||bot.y)===i;
    const onCity=m.targetCityId&&g.cities.some(c=>c.id===m.targetCityId&&c.continent===ui.cont&&c.row===i);
    if(onBot||onCity){
      const ic=m.type==='casus'?'🦅':m.type==='destek'?'🛡️':m.type==='nakliye'?'🛒':m.type==='kurulus'?'🏗️':(m.back?'↩️':'🚩');
      marchMarks+=` ${ic}`;
    }
  });
  (g.incomingAttacks||[]).forEach(a=>{
    if(a.continent===ui.cont&&Number(a.row)===i)marchMarks+=' ⚔️';
  });
  h+=`<div class="map-entry ${p.me?'mine':''} ${Number(i)===Number(ui.focusRow)?'item-active-build':''}" ${p.me?`onclick="onOwnCityClick(${p.cityId})"`:`onclick="openPlayerModal(${p.id})"`}><span class="map-rank">${i}</span><span class="map-player ${p.me?'gold':''}">${p.me?'👑 ':''}${esc(p.name)}${marchMarks}<small>${coord}</small></span><span class="map-score">${fmt(p.score)}<small>${p.me?(p.cityId===g.activeCityId?'Aktif şehrin':'Senin şehrin'):'Oyuncu puanı'}</small></span></div>`;
 }
 h+=`<div class="map-foot">Koordinat: <b>${ui.cont}.${pp.row||1}</b> • Aynı kıtadaki sıralar yakındır; kıtalar arası mesafe daha uzundur.<br>Bir oyuncuya dokunarak casusluk, saldırı veya nakliye başlatabilirsin.</div></div>`;$('tab-harita').innerHTML=h;
}
function setMapSort(sort){ui.mapSort=sort;renderCurrent();}

function goMyCity(){
 const activeCity=g.cities.find(c=>c.id===g.activeCityId)||g.cities[0];
 if(activeCity){
  ui.cont=activeCity.continent;
  renderCurrent();
  toast(`🏰 ${activeCity.name} konumuna odaklanıldı (${activeCity.continent}.${activeCity.row})`);
 }
}
function changeCont(d){ui.cont+=d;if(ui.cont<1)ui.cont=NCONT;if(ui.cont>NCONT)ui.cont=1;renderCurrent();}
function goToPlayerCoord(continent, row){
 closeModal();
 ui.cont=continent;
 ui.focusRow=Number(row)||1;
 switchTab('harita');
 toast(`🗺️ ${continent}.${ui.focusRow} koordinatına gidildi.`);
}
function onOwnCityClick(cityId){
  if(cityId===g.activeCityId){
    // Aktif şehir - sadece bilgi / şehir değiştirme
    const c=g.cities.find(x=>x.id===cityId);
    toast(`📍 Aktif şehrin: ${c?c.name:''}`);
    return;
  }
  openOwnCityModal(cityId);
}
function openOwnCityModal(cityId){
  const target=g.cities.find(c=>c.id===cityId);
  if(!target)return;
  const from=g.cities.find(c=>c.id===g.activeCityId)||g.cities[0];
  ui.targetCityId=cityId;
  ui.mtab='destek';
  const names=Object.keys(g.myTroops).filter(n=>g.myTroops[n]>0 && TROOPS[n] && TROOPS[n].cls!=='spy');
  ui.attNames=names;
  const tt=travelTimeCoords(from.continent,from.row,target.continent,target.row,false);
  const rows=names.map((n,i)=>`<div class="row"><span>${TROOPS[n].icon} ${n} (${g.myTroops[n]})</span><input type="number" inputmode="numeric" min="0" max="${g.myTroops[n]}" value="0" id="att-${i}" oninput="updAtt()"></div>`).join('')||'<p class="mut small">Gönderilecek askerin yok!</p>';
  openModal(`<h3>🏙️ Kendi Şehrin: ${esc(target.name)}</h3>
  <p class="small" style="text-align:center;margin:0 0 8px">Hedef: <b>${esc(target.name)}</b> (${target.continent}.${target.row})<br>
  <span class="mut xs">Kaynak şehir: ${esc(from.name)} (${from.continent}.${from.row}) • Sefer hakkı ${typeof activeSeferCount==='function'?activeSeferCount():g.marches.length}/${seferHakki()}</span></p>
  <div class="tabs">
    <button id="mt-destek" class="on" onclick="switchMTOwn('destek')">Destek</button>
    <button id="mt-nakliye" onclick="switchMTOwn('nakliye')">Nakliye</button>
  </div>
  <div id="mp-destek">
    <p class="small mut">Seçtiğin birlikleri bu şehre destek olarak gönder. Varışta birlikler hedef şehrin ordusuna eklenir.</p>
    <div class="row" style="background:none;border:0;padding:0 0 6px"><b class="gold">Birliklerin</b><span><button class="btn sm" onclick="selAll()">⚔️ Tümünü Seç</button> <button class="btn sm" onclick="savePreset()">💾 Kaydet</button></span></div>
    ${(g.presets||[]).length?`<div class="small mut" style="margin-bottom:6px">Şablonlar: ${(g.presets||[]).map((p,i)=>`<button class="btn sm" style="margin:2px" onclick="loadPreset(${i})">${esc(p.name)}</button>`).join('')}</div>`:''}
    ${rows}
    <div class="row"><span>⏱️ Tek yön süre</span><b class="gold">${formatTime(tt)}</b></div>
    <button class="btn gold full" onclick="sendSupport()">Destek Gönder</button>
  </div>
  <div id="mp-nakliye" style="display:none">
    <p class="small mut">Kağnı ile altın ve yemek gönder. Kaynaklar hedef şehre ulaşır.</p>
    <div class="row"><span>Altın</span><input type="number" id="tr-g" min="0" value="0"></div>
    <div class="row"><span>Yemek</span><input type="number" id="tr-f" min="0" value="0"></div>
    <div class="row"><span>Kağnı (${g.myTroops['Kağnı']||0} var)</span><input type="number" id="tr-k" min="0" value="${Math.min(1,g.myTroops['Kağnı']||0)}"></div>
    <div class="row"><span>⏱️ Tek yön süre</span><b class="gold">${formatTime(tt)}</b></div>
    <button class="btn gold full" onclick="sendInternalTransport()">Kaynak Gönder</button>
  </div>
  <div class="grid2" style="margin-top:10px">
    <button class="btn sm" onclick="switchCity(${cityId});closeModal()">Bu Şehre Geç</button>
    <button class="btn full" onclick="closeModal()">Kapat</button>
  </div>`);
}
function switchMTOwn(t){
  ['destek','nakliye'].forEach(x=>{
    const el=$('mp-'+x); if(el) el.style.display=x===t?'block':'none';
    const btn=$('mt-'+x); if(btn) btn.classList.toggle('on',x===t);
  });
  ui.mtab=t;
}
function sendSupport(){
  if(noSlot())return;
  const targetId=ui.targetCityId;
  const target=g.cities.find(c=>c.id===targetId);
  if(!target){alert('Hedef şehir bulunamadı');return;}
  const army={}; let total=0;
  ui.attNames.forEach((n,i)=>{
    const el=$('att-'+i);
    let v=Math.min(g.myTroops[n]||0, Math.max(0, parseInt(el&&el.value)||0));
    if(v>0){army[n]=v; total+=v;}
  });
  if(!total){alert('En az 1 birlik seç!');return;}
  for(const n in army){g.myTroops[n]-=army[n];} clean(g.myTroops);
  const from=g.cities.find(c=>c.id===g.activeCityId)||g.cities[0];
  const t=travelTimeCoords(from.continent,from.row,target.continent,target.row,false);
  g.marches.push({
    id:g.nextId++, type:'destek', target:null, targetCityId:targetId, targetCityName:target.name,
    troops:army, timeLeft:t, one:t, back:false, loot:null, fromCityId:g.activeCityId
  });
  closeModal(); refresh();
  toast(`🛡️ Destek ${target.name} şehrine yola çıktı (${formatTime(t)})`);
}
function sendInternalTransport(){
  if(noSlot())return;
  const targetId=ui.targetCityId;
  const target=g.cities.find(c=>c.id===targetId);
  if(!target){alert('Hedef şehir bulunamadı');return;}
  const gg=Math.max(0,parseInt($('tr-g').value)||0);
  const ff=Math.max(0,parseInt($('tr-f').value)||0);
  const k=Math.max(0,parseInt($('tr-k').value)||0);
  if(gg+ff<=0){alert('Gönderilecek kaynak yok!');return;}
  if(k<1||k>(g.myTroops['Kağnı']||0)){alert('Yeterli Kağnın yok!');return;}
  if(gg+ff > k*CART_CAP){alert(`Kağnı kapasitesi yetersiz (adet başı ${CART_CAP}).`);return;}
  if(g.gold<gg||g.food<ff){alert('Yetersiz kaynak!');return;}
  g.gold-=gg; g.food-=ff;
  g.myTroops['Kağnı']-=k; clean(g.myTroops);
  const from=g.cities.find(c=>c.id===g.activeCityId)||g.cities[0];
  const t=travelTimeCoords(from.continent,from.row,target.continent,target.row,false);
  g.marches.push({
    id:g.nextId++, type:'nakliye', target:null, targetCityId:targetId, targetCityName:target.name,
    troops:{'Kağnı':k}, gold:gg, food:ff, timeLeft:t, one:t, back:false, loot:null, fromCityId:g.activeCityId, internal:true
  });
  closeModal(); refresh();
  toast(`🛒 Nakliye ${target.name} şehrine yola çıktı`);
}
function openPlayerModal(id){
 const b=g.bots.find(x=>x.id===id);if(!b)return;
 ui.target=id;ui.mtab='casus';
 const names=Object.keys(g.myTroops).filter(n=>g.myTroops[n]>0);ui.attNames=names;
 const tt=travelTime(b,false),st=travelTime(b,true);
 const rows=names.map((n,i)=>`<div class="row"><span>${TROOPS[n].icon} ${n} (${g.myTroops[n]})</span><input type="number" inputmode="numeric" min="0" max="${g.myTroops[n]}" value="0" id="att-${i}" oninput="updAtt()"></div>`).join('')||'<p class="mut small">Askerin yok!</p>';
 openModal(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3>👤 Oyuncu Bilgileri</h3><button class="btn sm gold" style="padding:4px 8px;font-size:14px" title="Oyuncunun kalesine git" onclick="goToPlayerCoord(${b.continent}, ${b.row||b.y||1})">🏰 Kaleye Git</button></div>
<div class="card" style="margin:0 0 8px;padding:10px"><div class="kv"><span>Oyuncu</span><b class="gold">${esc(b.name)}</b></div><div class="kv"><span>İttifak</span><b>${esc(b.alliance||'Bağımsız')}</b></div><div class="kv"><span>Koordinat</span><b>${b.continent}.${b.row||b.y||1}</b></div><div class="kv"><span>Puan</span><b>${bScore(b)}</b></div><div class="kv"><span>Kale</span><b>Seviye ${b.lv.kale||1}</b></div><div class="kv"><span>Karakter</span><b>${PERS[b.pers]||'Savaşçı'}</b></div></div>
<p class="small" style="text-align:center;margin:0 0 8px"><span class="mut xs">Hedef koordinat: ${b.continent}.${b.row||b.y||1} • Sefer hakkın: ${typeof activeSeferCount==='function'?activeSeferCount():g.marches.length}/${seferHakki()}</span></p>
 <div class="tabs"><button id="mt-casus" class="on" onclick="switchMT('casus')">Casusluk</button><button id="mt-saldiri" onclick="switchMT('saldiri')">Saldırı</button><button id="mt-nakliye" onclick="switchMT('nakliye')">Nakliye</button></div>
 <div id="mp-casus"><p class="small mut">Casus Karga gönderip hedef hakkında bilgi topla. Bilgi miktarı, senin casusluk seviyen ile hedefin casusluk seviyesi arasındaki farka bağlıdır; <b>3 seviye</b> fark her şeyi ortaya çıkarır. Senin Casusluk seviyen: <b>${mySpy()}</b>. Casusluk için mutlaka Casus Karga gönderilmelidir.</p><div class="row"><span>⏱️ Tek yön süre</span><b class="gold">${formatTime(st)}</b></div><button class="btn gold full" ${((g.myTroops['Casus Karga']||0)>0)?'':'disabled'} onclick="sendSpy()">🦅 Casus Karga Gönder (${g.myTroops['Casus Karga']||0} mevcut)</button></div>
 <div id="mp-saldiri" style="display:none"><div class="row" style="background:none;border:0;padding:0 0 6px"><b class="gold">Birliklerin</b><span><button class="btn sm" onclick="selAll()">⚔️ Tümünü Seç</button> <button class="btn sm" onclick="savePreset()">💾 Kaydet</button></span></div>
 ${(g.presets||[]).length?`<div class="small mut" style="margin-bottom:6px">Şablonlar: ${(g.presets||[]).map((p,i)=>`<button class="btn sm" style="margin:2px" onclick="loadPreset(${i})">${esc(p.name)}</button>`).join('')}</div>`:''}
 ${rows}
 <div class="row"><span>🛒 Taşıma kapasitesi</span><b class="ok" id="att-cap">0</b></div><div class="row"><span>⚔️ Saldırı gücü (ham)</span><b id="att-pw">0</b></div><div class="row"><span>📊 Güç tahmini</span><b id="att-est" class="mut xs">Birlik seçince tahmin görünür</b></div><div class="row"><span>⏱️ Tek yön süre</span><b class="gold">${formatTime(tt)}</b></div>${isNight()?'<p class="small gold">🌙 Gece: saldırı gücün düşer.</p>':''}<button class="btn gold full" onclick="sendAttack()">Saldırı Seferi Başlat</button></div>
 <div id="mp-nakliye" style="display:none"><div class="row"><span>Altın</span><input type="number" id="tr-g" min="0" value="0"></div><div class="row"><span>Yemek</span><input type="number" id="tr-f" min="0" value="0"></div><div class="row"><span>Kağnı (${g.myTroops['Kağnı']||0} var)</span><input type="number" id="tr-k" min="0" value="${Math.min(1,g.myTroops['Kağnı']||0)}"></div><div class="row"><span>⏱️ Tek yön süre</span><b class="gold">${formatTime(tt)}</b></div><button class="btn gold full" onclick="sendTransport()">Kaynak Gönder</button></div>
 <button class="btn full" style="margin-top:10px" onclick="closeModal()">Kapat</button>`);
}
function switchMT(t){['casus','saldiri','nakliye'].forEach(x=>{$('mp-'+x).style.display=x===t?'block':'none';$('mt-'+x).classList.toggle('on',x===t);});}
function selAll(){ui.attNames.forEach((n,i)=>{const e=$('att-'+i);if(e)e.value=g.myTroops[n];});updAtt();}
function savePreset(){
  const army={};
  ui.attNames.forEach((n,i)=>{const e=$('att-'+i);const v=Math.max(0,parseInt(e&&e.value)||0);if(v>0)army[n]=v;});
  if(!Object.keys(army).length){alert('Önce birlik seç!');return;}
  const name=prompt('Şablon adı (max 16 karakter):','Ordu '+(g.presets.length+1));
  if(!name)return;
  g.presets.push({name:name.trim().slice(0,16),army});
  if(g.presets.length>6)g.presets.shift();
  dirty=true;toast('💾 Şablon kaydedildi'); 
  // refresh modal buttons if possible
}
function loadPreset(idx){
  const p=g.presets[idx]; if(!p)return;
  ui.attNames.forEach((n,i)=>{
    const e=$('att-'+i); if(!e)return;
    e.value=Math.min(g.myTroops[n]||0, p.army[n]||0);
  });
  updAtt();
  toast('📋 Şablon yüklendi: '+p.name);
}
function deletePreset(idx){
  if(!confirm('Bu şablonu sil?'))return;
  g.presets.splice(idx,1); dirty=true; toast('Şablon silindi');
}
function updAtt(){
 let cap=0,pw=0,army={};
 ui.attNames.forEach((n,i)=>{const e=$('att-'+i);if(!e)return;let v=Math.min(g.myTroops[n]||0,Math.max(0,parseInt(e.value)||0));const u=TROOPS[n];
  cap+=v*unitCap(n);pw+=v*u.atk;if(v>0)army[n]=v;});
 const c=$('att-cap'),p=$('att-pw');if(c)c.textContent=fmt(cap);if(p)p.textContent=fmt(pw);
 const est=$('att-est');
 if(est){
  const b=curBot();
  if(!b||!Object.keys(army).length){est.innerHTML='<span class="mut">Birlik seçince tahmin görünür</span>';}
  else{
   const night=isNight();
   const pr=predict(army,playerSide(),botSide(b),night);
   const ratio=pr.D>0?pr.A/pr.D:99;
   let verdict,col;
   if(ratio>=1.25){verdict='Muhtemel zafer';col='#34d399';}
   else if(ratio>=1.05){verdict='Sıkı mücadele';col='#fbbf24';}
   else if(ratio>=0.85){verdict='Riskli';col='#fb923c';}
   else{verdict='Muhtemel yenilgi';col='#f87171';}
   est.innerHTML=`⚔️ ${fmt(Math.floor(pr.A))} vs 🛡️ ${fmt(Math.floor(pr.D))} <b style="color:${col}">(${verdict})</b>${night?' <span class="gold">🌙</span>':''}`;
  }
 }
}

function openEmptyCoordModal(cont, row){
 const max=1+Math.floor(rl('Yurt Tutma')/3);
 const canFound=g.cities.length<max&&g.cities.length<6;
 openModal(`<h3>🗺️ Boş Koordinat (${cont}.${row})</h3>
 <p class="small mut" style="text-align:center;margin:0 0 12px">Bu koordinatta yerleşim bulunmuyor.</p>
 <div class="kv"><span>Mevcut Şehir Sayısı</span><b>${g.cities.length} / ${max}</b></div>
 <div class="kv"><span>Yurt Tutma Seviyesi</span><b class="gold">${rl('Yurt Tutma')} (Her 3 seviye = 1 yeni şehir)</b></div>
 ${canFound?`<button class="btn gold full" style="margin-top:12px" onclick="foundCityAt(${cont}, ${row})">🏗️ Bu Koordinata Şehir Kur</button>`:`<p class="small bad" style="text-align:center;margin-top:10px">Şehir sınırına ulaştın veya Yurt Tutma seviyen yetersiz!</p>`}
 <button class="btn full" style="margin-top:8px" onclick="closeModal()">Kapat</button>`);
}

/* ---- MESAJ ---- */
function rMesaj(){
 // Badge kapanır ama tek tek okundu işareti openReport'ta konur
 const hasUnread=g.reports.some(r=>!r.read && r.kind!=='request');
 g.unread=hasUnread;
 let h=`<div class="card"><h3><span>✉️ MESAJLAR & RAPORLAR</span><span><button class="btn sm" onclick="markAllReportsRead()">Tümünü oku</button> <button class="btn red sm" onclick="g.reports=[];refresh()">Temizle</button></span></h3>`;
 if(!g.reports.length)h+='<p class="mut small" style="text-align:center;padding:14px">Henüz mesaj yok.</p>';
 g.reports.forEach((r,i)=>{
  if(r.kind==='request'){h+=`<div class="row msg-unread" style="flex-direction:column;align-items:stretch;border-left:3px solid var(--gold)"><div><b class="gold">${r.title}</b><div class="small mut">${r.summary}</div></div><div class="grid2"><button class="btn green sm" onclick="acceptReq(${r.id})">Kabul Et</button><button class="btn red sm" onclick="rejectReq(${r.id})">Reddet</button></div></div>`;return;}
  const col=r.kind==='battle'?(r.won?'#059669':'#dc2626'):(r.kind==='spy'?'#0284c7':'#4a50a0');
  const cls=r.read?'msg-read':'msg-unread';
  const dot=r.read?'':'● ';
  h+=`<div class="row msg-row ${cls}" style="border-left:3px solid ${col}" onclick="openReport(${r.id})"><div style="min-width:0"><b>${dot}${esc(r.title)}</b><div class="small mut" style="margin-top:3px">${esc(r.summary)}</div></div><span class="mut xs" style="white-space:nowrap">${r.time||''}</span></div>`;
 });
 h+='</div>';$('tab-mesaj').innerHTML=h;
}
function markAllReportsRead(){
  g.reports.forEach(r=>{r.read=true;});
  g.unread=false; dirty=true; refresh();
}
function openReport(id){const r=g.reports.find(x=>x.id===id)||g.reports[id];if(!r)return;
  r.read=true;
  g.unread=g.reports.some(x=>!x.read && x.kind!=='request');
  dirty=true;
  const col=r.kind==='battle'?(r.won?'#34d399':'#f87171'):(r.kind==='spy'?(r.won?'#60a5fa':'#f87171'):'var(--gold)');
  let extra='';
  if(r.kind==='battle' && r.targetId && g.bots.find(b=>b.id===r.targetId)){
    extra=`<button class="btn gold full" style="margin-top:8px" onclick="closeModal();openPlayerModal(${r.targetId});switchMT('saldiri')">⚔️ Tekrar Saldır</button>`;
  }
  if(r.kind==='spy' && r.targetId && g.bots.find(b=>b.id===r.targetId)){
    extra=`<button class="btn gold full" style="margin-top:8px" onclick="closeModal();openPlayerModal(${r.targetId});switchMT('saldiri')">⚔️ Saldır</button>`;
  }
  openModal(`<h3 style="color:${col}">${esc(r.title)}</h3><div class="pre">${r.html}</div>${extra}<button class="btn full" style="margin-top:10px" onclick="closeModal()">Kapat</button>`);
}

/* ---- DAHA ---- */
function rDaha(){
 const evBox=(t,l)=>`<div class="row" style="flex-direction:column;align-items:stretch"><b class="gold small">${l}</b><div class="grid2"><input type="number" id="ev-${t}-t" value="30" placeholder="Süre (dk)"><input type="number" id="ev-${t}-r" value="50" placeholder="Hız (%)"></div><button class="btn red sm" onclick="startEvent('${t}')">Başlat</button></div>`;
 const am=g.audioMode||'full';
 const presetsHtml=(g.presets||[]).length?(g.presets||[]).map((p,i)=>`<div class="row"><span>📋 ${esc(p.name)} <span class="mut xs">(${Object.keys(p.army||{}).length} birim)</span></span><span><button class="btn sm" onclick="renamePreset(${i})">✏️</button> <button class="btn red sm" onclick="deletePreset(${i});refresh()">Sil</button></span></div>`).join(''):'<p class="mut small">Henüz şablon yok. Saldırı ekranından kaydedebilirsin.</p>';
 $('tab-daha').innerHTML=`<div class="card" style="border-color:#7f1d1d"><h2 style="color:var(--red)">👑 HÜKÜMDAR AYRICALIKLARI</h2>
 <div class="row" style="flex-direction:column;align-items:stretch"><b class="gold small">⏩ Zamanı İleri Sar</b><div class="grid2"><input type="number" id="tw-min" value="60"><button class="btn gold sm" onclick="executeTimeWarp()">Sar İleri (dk)</button></div></div>
 <div class="card" style="border-color:#7c3aed"><h3>🧪 Geliştirici Test Merkezi</h3><p class="mut small">Birlik, savunma ve Akademi seviyelerini değiştirerek gerçek savaş motorunu simüle et. Sonuçlar oyuna kaydedilmez.</p><button class="btn gold full" onclick="openDevSimulator()">⚔️ Savaş Simülatörünü Aç</button></div>
 <div class="grid2"><button class="btn sm" onclick="cheatBuild()">🚀 İnşaatı Bitir</button><button class="btn sm" onclick="cheatResearch()">⚡ Araştırmayı Bitir</button><button class="btn sm" onclick="cheatTroops()">⚔️ Kuyruğu Bitir</button><button class="btn sm" onclick="cheatMarch()">🚩 Seferleri Bitir</button></div>
 <div class="sep"></div>
 <b class="gold small">Senin kaynakların</b>
 <div class="grid2" style="margin-top:6px"><input type="number" id="cheat-g" min="0" value="10000" placeholder="Altın"><input type="number" id="cheat-f" min="0" value="10000" placeholder="Yemek"></div>
 <div class="grid2" style="margin-top:6px"><button class="btn gold sm" onclick="cheatRes()">➕ Kaynak Ekle</button><button class="btn red sm" onclick="cheatResMinus()">➖ Kaynak Sil</button></div>
 <div class="sep"></div>
 <b class="gold small">Bot ganimeti</b>
 <p class="mut xs">İsim boşsa tüm botlar. Kısmi isim yazarsan eşleşenler.</p>
 <input type="text" id="bot-loot-name" placeholder="Bot adı (opsiyonel, boş = hepsi)" style="width:100%;text-align:left;margin:6px 0">
 <div class="grid2"><input type="number" id="bot-loot-g" min="0" value="5000" placeholder="Altın"><input type="number" id="bot-loot-f" min="0" value="5000" placeholder="Yemek"></div>
 <div class="grid2" style="margin-top:6px"><button class="btn gold sm" onclick="cheatBotLoot('add')">➕ Bota Ekle</button><button class="btn red sm" onclick="cheatBotLoot('sub')">➖ Bottan Sil</button></div>
 <div class="sep"></div><h3 style="justify-content:center">⚡ Krallık Etkinliği</h3>${evBox('build','1. İnşa Hızı')}${evBox('research','2. Araştırma Hızı')}${evBox('troop','3. Asker Eğitim Hızı')}</div>
 <div class="card"><h3>🤖 Bot Zorluğu</h3><div class="grid2">${Object.entries(BOT_LEVELS).map(([k,v])=>`<button class="btn sm ${g.botDifficulty===k?'green':''}" onclick="setBotDifficulty('${k}')">${v.label}</button>`).join('')}</div><p class="mut xs">Orta normal seviyedir.</p></div>
 <div class="card"><h3>⛩️ Kahraman</h3>
  <div class="kv"><span>İsim</span><b class="gold">${esc((g.hero&&g.hero.name)||'Kahraman')}</b></div>
  <div class="kv"><span>Bonus</span><b>ATK +%${Math.round(heroAtkBonus()*100)} / DEF +%${Math.round(heroDefBonus()*100)}</b></div>
  <div class="grid2" style="margin-top:8px"><button class="btn sm" onclick="setHeroName()">✏️ İsim</button><button class="btn sm" onclick="setPlayerName()">👑 Oyuncu Adı</button><button class="btn sm ${(g.hero&&g.hero.trait)==='atk'?'green':''}" onclick="setHeroTrait('atk')">🗡️ Saldırı</button><button class="btn sm ${(g.hero&&g.hero.trait)==='def'?'green':''}" onclick="setHeroTrait('def')">🛡️ Savunma</button></div>
  <p class="mut xs">Mabet seviyesi kahraman gücünü artırır. Odak seçimi ATK veya DEF'e daha fazla bonus verir.</p></div>
 <div class="card"><h3>📋 Ordu Şablonları</h3>${presetsHtml}</div>
 <div class="card"><h3>🛒 Pazar</h3>
  <div class="kv"><span>Kur</span><b>Altın→Yemek %80 • Yemek→Altın %76</b></div>
  <div class="kv"><span>Senin kaynakların</span><b>${fmt(Math.floor(g.gold))}💰 ${fmt(Math.floor(g.food))}🍗</b></div>
  <div class="grid2"><button class="btn gold sm" onclick="marketTrade('g2f',1000)">1K 💰→🍗</button><button class="btn sm" onclick="marketTrade('f2g',1000)">1K 🍗→💰</button>
  <button class="btn gold sm" onclick="marketTrade('g2f',5000)">5K 💰→🍗</button><button class="btn sm" onclick="marketTrade('f2g',5000)">5K 🍗→💰</button></div>
  <div class="grid2" style="margin-top:6px"><button class="btn sm" onclick="marketTradeAll('g2f')">Tüm Altını Çevir</button><button class="btn sm" onclick="marketTradeAll('f2g')">Tüm Yemeği Çevir</button></div>
 </div>
 <div class="card"><h3>🔊 Ses & Titreşim</h3>
  <div class="grid2"><button class="btn sm ${am==='off'?'green':''}" onclick="setAudioMode('off')">Kapalı</button><button class="btn sm ${am==='low'?'green':''}" onclick="setAudioMode('low')">Düşük</button><button class="btn sm ${am==='full'?'green':''}" onclick="setAudioMode('full')">Tam</button><button class="btn sm" onclick="toggleNotify()">Bildirim: ${g.notify?'AÇIK':'KAPALI'}</button></div>
  <p class="mut xs">Zafer/yenilgi kartında titreşim; inşaat ve savaşta kısa ses.</p></div>
 <div class="card"><h3>💾 Kayıt</h3><div class="grid2"><button class="btn sm" onclick="exportSave()">📋 Kaydı Kopyala</button><button class="btn sm" onclick="importSave()">📥 Kayıt Yükle</button></div><p class="mut xs">Oyun otomatik kaydedilir.</p></div>
 <div class="card"><button class="btn red full" onclick="resetGame()">🔄 Oyunu Tamamen Sıfırla</button></div>
 <div class="card"><div class="mut xs" style="text-align:center">Mobiwar v2.3 • Çevrimdışı • ${g.bots.length} bot</div></div>`;
}

/* ---- BİLGİ PENCERESİ ---- */
function openInfo(type,k){
 let t='',d='',s='';const kv=(a,b)=>`<div class="kv"><span>${a}</span><b>${b}</b></div>`;
 if(type==='b'){
  const B=BUILD[k],l=bl(k);
  t=`${B.icon} ${B.name}`;
  d=B.desc;
  s=kv('Seviye',`${l} / ${B.max}`);
  if(l>0)s+=kv('Şimdiki etki',B.fx(l));
  if(l<B.max){
   const c=buildCostAt(k,l);
   s+=kv('Sonraki seviye',B.fx(l+1));
   s+=kv('Sonraki maliyet',`${fmt(c.g)}💰 ${fmt(c.f)}🍗 • ${formatTime(buildTimeAt(k,l))}`);
  }
  // Gereksinimler
  const reqs=Object.keys(B.req||{});
  if(reqs.length)s+=kv('Gereksinim',reqs.map(r=>`${BUILD[r].name} ${B.req[r]}`).join(', '));
  else s+=kv('Gereksinim','Yok');

  // Çiftlik / Maden: 1–100 üretim kaydırma listesi
  if(k==='ciftlik'||k==='maden'){
   const rateFn=k==='maden'?goldRate:foodRate;
   const unit=k==='maden'?'💰/sa':'🍗/sa';
   let scroll=`<div style="margin-top:12px"><div class="small gold" style="margin-bottom:6px">📊 Seviye üretim tablosu (yatay kaydır)</div>`;
   scroll+=`<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;display:flex;gap:6px;padding:6px 2px 10px;scroll-snap-type:x mandatory">`;
   for(let i=1;i<=B.max;i++){
    const cur=i===l;
    const val=Math.floor(rateFn(i));
    scroll+=`<div style="flex:0 0 auto;min-width:68px;scroll-snap-align:start;text-align:center;padding:8px 6px;border-radius:10px;border:1px solid ${cur?'var(--gold)':'var(--line)'};background:${cur?'linear-gradient(135deg,#3a2c17,#1b1a28)':'#141628'}">
      <div style="font-size:10px;color:${cur?'var(--gold)':'var(--mut)'};font-weight:700">Sv ${i}</div>
      <div style="font-size:12px;font-weight:800;margin-top:4px;color:${cur?'#fbbf24':'#e5e7eb'}">+${fmt(val)}</div>
      <div style="font-size:9px;color:var(--mut)">${unit}</div>
    </div>`;
   }
   scroll+=`</div></div>`;
   s+=scroll;
  } else {
   // Diğer yapılar: önemli seviyelerde etki özeti
   let scroll=`<div style="margin-top:12px"><div class="small gold" style="margin-bottom:6px">📈 Seviye etkileri (yatay kaydır)</div>`;
   scroll+=`<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;display:flex;gap:6px;padding:6px 2px 10px">`;
   const steps=[];
   for(let i=1;i<=B.max;i++){
    if(i===1||i===B.max||i%5===0||i===l||i===l+1)steps.push(i);
   }
   // unique sorted
   [...new Set(steps)].sort((a,b)=>a-b).forEach(i=>{
    const cur=i===l;
    scroll+=`<div style="flex:0 0 auto;min-width:110px;text-align:center;padding:8px 8px;border-radius:10px;border:1px solid ${cur?'var(--gold)':'var(--line)'};background:${cur?'linear-gradient(135deg,#3a2c17,#1b1a28)':'#141628'}">
      <div style="font-size:10px;color:${cur?'var(--gold)':'var(--mut)'};font-weight:700">Sv ${i}</div>
      <div style="font-size:11px;margin-top:4px;line-height:1.35;color:#e5e7eb">${B.fx(i)}</div>
    </div>`;
   });
   scroll+=`</div></div>`;
   s+=scroll;
  }
 }
 else if(type==='t'){const u=TROOPS[k];t=`${u.icon} ${k}`;d=u.details;s=kv('Sınıf',CLS_NAME[u.cls])+kv('Saldırı',`${u.atk} (etkin ${Math.floor(u.atk*atkResMul(k))})`)+kv('Savunma',u.def)+(k==='Kağnı'?kv('Taşıma kapasitesi',unitCap(k)):'')+kv('Eğitim süresi',formatTime(troopTime(k)))+kv('Maliyet',`${u.g}💰 ${u.f}🍗`)+(u.cls==='cart'?kv('Özel','Savaşmaz; 5.000 ganimet taşır'):u.cls==='inf'?kv('Avantaj','Süvariye karşı güçlü'):u.cls==='rng'?kv('Avantaj','Piyadeye karşı güçlü'):u.cls==='cav'?kv('Avantaj','Okçulara karşı güçlü'):u.cls==='mon'?kv('Avantaj','Piyade hatlarına karşı güçlü; hızlı birliklere karşı dikkat'):u.cls==='mag'?kv('Avantaj','Büyü saldırısı; Tılsım Kalkanına karşı özel hedef'):u.cls==='sge'?kv('Özel','Savunma yapılarına karşı güçlü'):u.cls==='spy'?kv('Özel','Casusluk seferi için kullanılır'):'');}
 else if(type==='d'){const x=DEF[k],lv=defCount(k);t=`${x.icon} ${k}`;d=x.details;s=x.level?kv('Seviye',`${lv} / ${x.max}`)+kv('Seviye başı savunma',x.def)+kv('Sonraki seviye maliyeti',lv<x.max?`${fmt(defLevelCost(k,lv+1).g)}💰 ${fmt(defLevelCost(k,lv+1).f)}🍗`:'MAKS'):kv('Savunma gücü',x.def)+kv('Maliyet',`${x.g}💰 ${x.f}🍗`);s+=kv('Üretim süresi',formatTime(defTime(k)))+(x.sur?kv('Gereksinim',`Sur ${x.sur}`):x.kale?kv('Gereksinim',`Kale ${x.kale}`):'')+(x.res&&Object.keys(x.res).length?kv('Araştırma',Object.entries(x.res).map(([r,v])=>`${r} ${v}`).join(', ')):'');}
 else{const R=RES[k],l=rl(k);t=`${R.icon} ${k}`;d=R.desc;s=kv('Seviye',`${l} / ${R.max}`)+(l>0?kv('Şimdiki etki',resEffect(k,l)):'')+(l<R.max?kv('Sonraki seviye',resEffect(k,l+1)):'')+kv('Akademi gereksinimi',`Sv ${R.ak}`);}
 openModal(`<h3>${t}</h3><p class="small mut" style="line-height:1.6">${d}</p><div class="pre" style="white-space:normal">${s}</div><button class="btn full" style="margin-top:10px" onclick="closeModal()">Kapat</button>`);
}

/* =====================  BAŞLAT  ===================== */
function applyOfflineProgress(){
  const now=Date.now();
  const last=Number(g.lastSave)||now;
  let dt=Math.floor((now-last)/1000);
  if(dt<2){lastTick=now;return;}
  if(dt>OFFLINE_MAX)dt=OFFLINE_MAX;
  suppressBattleFlash=true;
  try{advance(dt);checkDailyReset();checkWeeklyReset();}
  catch(e){console.error(e);showErr(e);}
  suppressBattleFlash=false;
  lastTick=now;
  g.lastSave=now;
  save();
  dirty=true;
  const msg=`⏳ ${formatTime(dt)} yokken oyun ilerledi`;
  setTimeout(()=>toast(msg),400);
}
const loadedOk=load();
if(!storageOk){
  setTimeout(()=>alert('⚠️ Tarayıcı kaydı kapalı görünüyor. İlerleme saklanamayabilir. Safari / Gizli mod / depolama iznini kontrol et.'),500);
}else if(loadedOk){
  setTimeout(()=>toast('📂 Kayıt yüklendi'),300);
}
applyOfflineProgress();
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){save();}
  else{tick();}
});
window.addEventListener('pagehide',()=>{save();});
window.addEventListener('beforeunload',()=>{save();});
window.addEventListener('freeze',()=>{save();});
switchTab('komuta');
tick();
setInterval(tick,1000);
// Periyodik yedek kayıt
setInterval(()=>{if(g)save();},30000);
