import {initializeApp} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,updateProfile,GoogleAuthProvider,signInWithPopup} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";import {getFirestore,collection,doc,setDoc,addDoc,query,where,onSnapshot,serverTimestamp,updateDoc} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";const firebaseConfig={apiKey:"AIzaSyBQxz-Oz3HhfcDr2jy15SjRcw6QHq1qBNY",authDomain:"chatss-daa4b.firebaseapp.com",projectId:"chatss-daa4b",storageBucket:"chatss-daa4b.firebasestorage.app",messagingSenderId:"482024813698",appId:"1:482024813698:web:4dde60bb2d14293423f09b"};const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);const $=id=>document.getElementById(id);let currentUser=null,selectedUser=null,unUsers=null,unMessages=null;
let soundEnabled=true, unreadByUser={}, lastSeenMessageIds=new Set(), firstMessageSnapshot=true;

function playMessageSound(){
  if(!soundEnabled) return;
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C) return;
    const c=new C(),o=c.createOscillator(),g=c.createGain();
    o.type="sine";o.frequency.value=880;g.gain.value=.055;
    o.connect(g);g.connect(c.destination);o.start();
    g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.18);
    o.stop(c.currentTime+.18);
  }catch(e){}
}
function updateUnreadBadge(){
  const n=Object.values(unreadByUser).reduce((a,b)=>a+b,0),el=$("unreadTotal");
  if(!el)return;el.textContent=n;el.classList.toggle("hidden",n===0);
}
function showNotification(title,text){
  if(!("Notification" in window)||Notification.permission!=="granted")return;
  try{new Notification(title,{body:text,tag:"mail-agent-message"})}catch(e){}
}
async function enableNotifications(){
  if("Notification" in window && Notification.permission==="default"){
    try{await Notification.requestPermission()}catch(e){}
  }
}function err(e){$("authError").textContent=e?.message||"Ошибка";console.error(e)}$("signupBtn").onclick=async()=>{try{const email=$("email").value.trim(),password=$("password").value,name=$("displayName").value.trim()||email.split("@")[0];const c=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(c.user,{displayName:name});await setDoc(doc(db,"users",c.user.uid),{uid:c.user.uid,name,email,status:"online",lastSeen:serverTimestamp()})}catch(e){err(e)}};$("loginBtn").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value)}catch(e){err(e)}};$("googleBtn").onclick=async()=>{try{const c=await signInWithPopup(auth,new GoogleAuthProvider());await setDoc(doc(db,"users",c.user.uid),{uid:c.user.uid,name:c.user.displayName||"User",email:c.user.email,status:"online",lastSeen:serverTimestamp()},{merge:true})}catch(e){err(e)}};$("logoutBtn").onclick=()=>signOut(auth);onAuthStateChanged(auth,async u=>{currentUser=u;if(!u){$("authScreen").classList.remove("hidden");$("app").classList.add("hidden");return}$("authScreen").classList.add("hidden");$("app").classList.remove("hidden");$("myName").textContent=u.displayName||u.email.split("@")[0];$("myEmail").textContent=u.email;$("myAvatar").textContent=(u.displayName||u.email)[0].toUpperCase();await setDoc(doc(db,"users",u.uid),{uid:u.uid,name:u.displayName||u.email.split("@")[0],email:u.email,status:"online",lastSeen:serverTimestamp()},{merge:true});loadUsers();watchUnread();enableNotifications()});function loadUsers(){if(unUsers)unUsers();unUsers=onSnapshot(collection(db,"users"),s=>{const t=$("searchUsers").value.toLowerCase();$("usersList").innerHTML="";s.forEach(d=>{const u=d.data();if(u.uid===currentUser.uid||!`${u.name||""} ${u.email||""}`.toLowerCase().includes(t))return;const e=document.createElement("div");e.className="user";e.innerHTML=`<div class="avatar">${esc((u.name||"U")[0].toUpperCase())}</div><div><b>${esc(u.name||"User")}</b><small>${u.status==="online"?"🟢 В сети":"⚪ Не в сети"}</small></div>`;e.onclick=()=>openChat(u);$("usersList").appendChild(e)})})}$("searchUsers").oninput=loadUsers;function watchUnread(){
 onSnapshot(query(collection(db,"messages"),where("participants","array-contains",currentUser.uid)),s=>{
   const counts={};
   s.forEach(d=>{
     const m=d.data();
     if(m.senderId!==currentUser.uid && m.receiverId===currentUser.uid && selectedUser?.uid!==m.senderId){
       counts[m.senderId]=(counts[m.senderId]||0)+1;
     }
   });
   unreadByUser=counts;updateUnreadBadge();
 });
}
const chatId=(a,b)=>[a,b].sort().join("_");function openChat(u){selectedUser=u;firstMessageSnapshot=true;lastSeenMessageIds=new Set();$("emptyChat").classList.add("hidden");$("chatPanel").classList.remove("hidden");$("chatName").textContent=u.name;$("chatStatus").textContent=u.status==="online"?"🟢 В сети":"⚪ Не в сети";$("chatAvatar").textContent=(u.name||"U")[0].toUpperCase();if(unMessages)unMessages();unMessages=onSnapshot(query(collection(db,"messages"),where("chatId","==",chatId(currentUser.uid,u.uid))),s=>{const a=[];s.forEach(d=>{
 const m=d.data();a.push(m);
 const key=d.id||m.createdAtMs;
 if(!firstMessageSnapshot && !lastSeenMessageIds.has(key) && m.senderId!==currentUser.uid){
   playMessageSound();
   showNotification(u.name||"Новое сообщение",m.text||"Новое сообщение");
   $("newMessageBanner").textContent="🔔 Новое сообщение от "+(u.name||"контакта");
   $("newMessageBanner").classList.remove("hidden");
 }
 lastSeenMessageIds.add(key);
});a.sort((x,y)=>(x.createdAtMs||0)-(y.createdAtMs||0));$("messages").innerHTML="";a.forEach(m=>{const e=document.createElement("div");e.className="msg"+(m.senderId===currentUser.uid?" mine":"");e.innerHTML=`<div class="bubble">${esc(m.text||"")}</div><small>${m.createdAtMs?new Date(m.createdAtMs).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):""}</small>`;$("messages").appendChild(e)});$("messages").scrollTop=$("messages").scrollHeight;unreadByUser[u.uid]=0;updateUnreadBadge();firstMessageSnapshot=false},e=>$("messages").innerHTML=`<div class="error">Ошибка загрузки сообщений: ${esc(e.message)}</div>`)}$("soundBtn").onclick=()=>{
  soundEnabled=!soundEnabled;
  $("soundBtn").textContent=soundEnabled?"🔊":"🔇";
};
$("newMessageBanner").onclick=()=>{
  $("newMessageBanner").classList.add("hidden");
  $("messages").scrollTop=$("messages").scrollHeight;
};
$("messageForm").onsubmit=async e=>{e.preventDefault();const text=$("messageInput").value.trim();if(!text||!selectedUser)return;try{await addDoc(collection(db,"messages"),{chatId:chatId(currentUser.uid,selectedUser.uid),participants:[currentUser.uid,selectedUser.uid].sort(),text,senderId:currentUser.uid,receiverId:selectedUser.uid,createdAt:serverTimestamp(),createdAtMs:Date.now()});$("messageInput").value=""}catch(e){err(e)}};$("statusBtn").onclick=async()=>{const n=$("statusBtn").textContent.includes("В сети")?"offline":"online";await updateDoc(doc(db,"users",currentUser.uid),{status:n,lastSeen:serverTimestamp()});$("statusBtn").textContent=n==="online"?"🟢 В сети":"⚪ Не в сети"};$("emojiBtn").onclick=()=>{$("emojiPanel").classList.toggle("hidden");if(!$("emojiPanel").children.length)["😀","😂","😍","👍","❤️","🔥","😎","😢","😡","🎉","🤔","👏"].forEach(x=>{const b=document.createElement("button");b.textContent=x;b.onclick=()=>{$("messageInput").value+=x;$("messageInput").focus()};$("emojiPanel").appendChild(b)})};function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}