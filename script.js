import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// --- ১. Firebase কনফিগারেশন ---
const firebaseConfig = {
    apiKey: "AIzaSyDqG0TFBK-0ZM5IjTwU4VC39esnCDsShI0",
    databaseURL: "https://trounament-d8110-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const session = localStorage.getItem('session');

// --- ২. ফেক ডেটা সোর্স (নাম ও বড় অংকের অ্যাকশন) ---
const fakeNames = [
    "Abir Hasan", "Sumona Mim", "Sabbir Khan", "Riyad Ahmed", "Nila Akter", 
    "Rakib Rayhan", "Tanvir Hossein", "Mitu Sarkar", "Arif Billah", "Sonia Afrin",
    "Kamrul Islam", "Jannat Ferdous", "Mehedi Hasan", "Farhana Islam", "Sajid Khan",
    "Tamanna Akter", "Nahid Ahmed", "Rina Begum", "Emon Ali", "Priya Das",
    "Sagor Hossain", "Tania Akter", "Mustafizur Rahman", "Rafi Ahmed", "Sharmin Sultana",
    "Hridoy Khan", "Ayesha Siddiqua", "Sabbir Ahmed", "Mitu Akter", "Fahim Shahriar",
    "Sadia Islam", "Imran Hossain", "Liza Akter", "Zubayer Ahmed", "Nusrat Jahan"
];

const fakeActions = [
    "৳৫,৫০০ উত্তোলন করেছেন", 
    "নতুন Quantum Bot কিনেছেন", 
    "৳১২,০০০ বোনাস পেয়েছেন", 
    "৳৩,৫০০ কমিশন পেয়েছেন",
    "৳২০,০০০ উইথড্র সাকসেস",
    "লেভেল ৩ বোনাস পেয়েছেন",
    "একাউন্ট একটিভ করেছেন",
    "৳১০,০০০ ডিপোজিট করেছেন",
    "৳৪,৫০০ রেফারে ইনকাম করেছেন",
    "৳৩০,০০০ উইথড্র রিকোয়েস্ট দিয়েছেন",
    "সাকসেসফুলি টাকা রিসিভ করেছেন",
    "গোল্ডেন রোবট আনলক করেছেন"
];

function startLivePopups() {
    const box = document.getElementById('liveNotify');
    const content = document.getElementById('notifyContent');
    if(!box || !content) return;

    setInterval(() => {
        const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
        const action = fakeActions[Math.floor(Math.random() * fakeActions.length)];
        content.innerHTML = `<i class="fas fa-check-circle" style="color:var(--accent)"></i> <b>${name}</b> মাত্র <b>${action}</b>`;
        box.classList.add('show');
        setTimeout(() => box.classList.remove('show'), 4500);
    }, 10000); 
}

// --- ৩. পেজ নেভিগেশন ---
window.showPage = (id) => {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    
    // লিডারবোর্ড ওপেন করলেই নতুন ডেটা জেনারেট হবে
    if(id === 'leaderView') loadLeaderboard();
};

// --- ৪. অথেন্টিকেশন সুইচ ---
const toggleText = document.getElementById('toggleText');
const regFields = document.getElementById('regFields');
const authBtn = document.getElementById('authBtn');

if (toggleText) {
    toggleText.onclick = () => {
        const isReg = regFields.classList.toggle('hidden');
        authBtn.innerText = isReg ? "প্রবেশ করুন" : "রেজিস্ট্রেশন করুন";
        toggleText.innerText = isReg ? "নতুন একাউন্ট খুলুন" : "লগইন করুন";
    };
}

// --- ৫. রেজিস্ট্রেশন ও লগইন লজিক ---
if (authBtn) {
    authBtn.onclick = async () => {
        const phone = document.getElementById('uPhone').value.trim();
        const pass = document.getElementById('uPass').value.trim();
        const isReg = !regFields.classList.contains('hidden');

        if (phone.length < 10 || pass.length < 6) return alert("সঠিক নম্বর ও ৬ ডিজিট পাসওয়ার্ড দিন!");

        const email = `${phone}@earnpro.com`;
        authBtn.innerText = "লোডিং...";
        authBtn.disabled = true;

        try {
            if (isReg) {
                const name = document.getElementById('rName').value.trim();
                const refer = document.getElementById('rRefer').value.trim().toUpperCase();

                if (!name || !refer) {
                    authBtn.disabled = false;
                    authBtn.innerText = "রেজিস্ট্রেশন করুন";
                    return alert("নাম এবং রেফার কোড দিন!");
                }

                const usersSnap = await get(ref(db, 'users'));
                const allUsers = usersSnap.val() || {};
                let referUid = (refer === "BD2026") ? "ADMIN" : Object.keys(allUsers).find(uid => allUsers[uid].myCode === refer);

                if (!referUid) {
                    authBtn.disabled = false;
                    authBtn.innerText = "রেজিস্ট্রেশন করুন";
                    return alert("ভুল রেফার কোড!");
                }

                const res = await createUserWithEmailAndPassword(auth, email, pass);
                await set(ref(db, 'users/' + res.user.uid), {
                    name, phone, pass, uid: res.user.uid,
                    myCode: Math.random().toString(36).substring(2,8).toUpperCase(),
                    referredBy: referUid, 
                    status: "Pending", 
                    trx: "", 
                    invested: 0, 
                    balance: 0,
                    l1_bonus: 0, l2_bonus: 0, l3_bonus: 0
                });
                localStorage.setItem('session', res.user.uid);
                location.reload();
            } else {
                const res = await signInWithEmailAndPassword(auth, email, pass);
                localStorage.setItem('session', res.user.uid);
                location.reload();
            }
        } catch (err) {
            authBtn.disabled = false;
            authBtn.innerText = isReg ? "রেজিস্ট্রেশন করুন" : "প্রবেশ করুন";
            alert("ত্রুটি: তথ্য ভুল অথবা একাউন্ট আগে থেকেই আছে!");
        }
    };
}

// --- ৬. রিয়েলটাইম ডাটা আপডেট ---
if (session) {
    startLivePopups();

    onValue(ref(db, 'users/' + session), (snap) => {
        const u = snap.val();
        if (!u) return;

        document.getElementById('authView').classList.add('hidden');
        if (u.status === "Active") {
            showPage('homeView');
            document.getElementById('bottomNav').classList.remove('hidden');
            
            document.getElementById('totalBal').innerText = "৳ " + (Number(u.balance) || 0).toFixed(2);
            document.getElementById('investDisp').innerText = "৳ " + (Number(u.invested) || 0);
            document.getElementById('uMyCode').innerText = u.myCode || "-------";

            if(document.getElementById('l1I')) document.getElementById('l1I').innerText = "৳ " + (Number(u.l1_bonus) || 0).toFixed(2);
            if(document.getElementById('l2I')) document.getElementById('l2I').innerText = "৳ " + (Number(u.l2_bonus) || 0).toFixed(2);
            if(document.getElementById('l3I')) document.getElementById('l3I').innerText = "৳ " + (Number(u.l3_bonus) || 0).toFixed(2);

            countMyReferrals(session);
        } else {
            showPage('depoView');
            if (u.trx) {
                document.getElementById('trxArea').classList.add('hidden');
                document.getElementById('pendingBox').classList.remove('hidden');
            }
        }
    });

    onValue(ref(db, 'settings'), (snap) => {
        if (snap.exists() && document.getElementById('joinFeeDisp')) {
            document.getElementById('joinFeeDisp').innerText = snap.val().joinFee || "100";
        }
    });
}

// --- ৭. মেম্বার কাউন্টিং লজিক ---
async function countMyReferrals(myUid) {
    const usersSnap = await get(ref(db, 'users'));
    if (!usersSnap.exists()) return;
    
    const allUsers = usersSnap.val();
    let l1 = 0, l2 = 0, l3 = 0;
    let l1Uids = [], l2Uids = [];

    Object.keys(allUsers).forEach(uid => {
        if (allUsers[uid].referredBy === myUid) {
            l1++; l1Uids.push(uid);
        }
    });

    Object.keys(allUsers).forEach(uid => {
        if (l1Uids.includes(allUsers[uid].referredBy)) {
            l2++; l2Uids.push(uid);
        }
    });

    Object.keys(allUsers).forEach(uid => {
        if (l2Uids.includes(allUsers[uid].referredBy)) {
            l3++;
        }
    });

    if(document.getElementById('l1Count')) document.getElementById('l1Count').innerText = "মেম্বার: " + l1;
    if(document.getElementById('l2Count')) document.getElementById('l2Count').innerText = "মেম্বার: " + l2;
    if(document.getElementById('l3Count')) document.getElementById('l3Count').innerText = "মেম্বার: " + l3;
}

// --- ৮. ট্রানজেকশন সাবমিট ---
const depositBtn = document.getElementById('subTrxBtn'); 
if (depositBtn) {
    depositBtn.onclick = async () => {
        const trx = document.getElementById('trxId').value.trim();
        if (trx.length < 5) return alert("সঠিক TrxID দিন!");

        depositBtn.innerText = "লোডিং...";
        depositBtn.disabled = true;

        await update(ref(db, 'users/' + session), { trx: trx });
        await set(ref(db, 'depositRequests/' + Date.now()), {
            uid: session, trx: trx, status: "pending",
            time: new Date().toLocaleString('bn-BD')
        });
        
        alert("সাবমিট হয়েছে! অ্যাডমিন চেক করে একাউন্ট খুলে দিবে।");
        location.reload();
    };
}

// --- ৯. লিডারবোর্ড লোড (অটো ফেক ডেটা জেনারেটর) ---
function loadLeaderboard() {
    const list = document.getElementById('leaderboardList');
    if(!list) return;
    list.innerHTML = "";

    const topMembers = [];
    // ১০ জন ইউজারের জন্য র‍্যান্ডম নাম ও অংক জেনারেট হবে (৳৫,০০০ - ৳৯৯,০০০)
    for(let i=0; i<10; i++) {
        const randomName = fakeNames[Math.floor(Math.random() * fakeNames.length)];
        const randomAmount = Math.floor(Math.random() * (99000 - 5000 + 1)) + 5000;
        topMembers.push({name: randomName, amount: randomAmount});
    }

    // বড় অংক অনুযায়ী সাজানো
    topMembers.sort((a, b) => b.amount - a.amount);

    topMembers.forEach((member, i) => {
        const row = document.createElement('div');
        row.className = "leaderboard-row animate__animated animate__fadeInUp";
        row.style.animationDelay = `${i * 0.1}s`;
        
        let rankColor = i === 0 ? '#fbbf24' : (i === 1 ? '#e2e8f0' : (i === 2 ? '#cd7f32' : '#94a3b8'));

        row.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="color: ${rankColor}; font-weight:bold;">#${i+1}</span>
                <b>${member.name}</b>
            </div>
            <span style="color:var(--accent); font-weight:bold;">৳${member.amount.toLocaleString()}</span>
        `;
        list.appendChild(row);
    });
}

// --- ১০. রেফার কোড কপি ---
window.copyCode = () => {
    const code = document.getElementById('uMyCode').innerText;
    if(code !== "-------") {
        navigator.clipboard.writeText(code).then(() => alert("রেফার কোড কপি হয়েছে!"));
    }
};

// --- ১১. লগআউট ---
window.logoutUser = () => {
    if(confirm("আপনি কি নিশ্চিতভাবে লগআউট করতে চান?")) {
        localStorage.removeItem('session');
        location.reload();
    }
};

// --- ডাইনামিক ফেক পেমেন্ট স্লাইডার লজিক ---
function startFakePaymentSlider() {
    const slider = document.getElementById('paymentSlider');
    if (!slider) return;

    const operators = ["bKash", "Nagad"];
    const statusText = ["Success", "Paid", "Completed"];

    function createCard() {
        const op = operators[Math.floor(Math.random() * operators.length)];
        const amount = (Math.floor(Math.random() * (55000 - 450 + 1)) + 1500).toFixed(0);
        // র্যান্ডম ফোন নম্বর জেনারেটর
        const phone = "01" + (Math.floor(Math.random() * 6) + 3) + "***" + Math.floor(1000 + Math.random() * 9000);
        // র্যান্ডম TrxID জেনারেটর
        const trx = Math.random().toString(36).substring(2, 11).toUpperCase();
        
        const d = new Date();
        const timeStr = d.getHours() + ":" + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();

        const card = document.createElement('div');
        card.className = "proof-card animate__animated animate__fadeInRight";
        
        const tagType = op === "bKash" ? "tag-bkash" : "tag-nagad";

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="proof-tag ${tagType}">${op}</span>
                <span style="color:#2dd4bf; font-size:9px;"><i class="fas fa-check-double"></i> ${statusText[Math.floor(Math.random()*statusText.length)]}</span>
            </div>
            <div class="p-amt">৳ ${amount}.00</div>
            <div class="p-details">Mob: ${phone}</div>
            <div class="p-details">Time: Today, ${timeStr} ${d.getHours() >= 12 ? 'PM' : 'AM'}</div>
            <div class="p-details">TrxID: ${trx}</div>
        `;

        // নতুন কার্ড স্লাইডারের শুরুতে যোগ হবে
        slider.prepend(card);

        // ১০টির বেশি কার্ড হয়ে গেলে পুরনোটি মুছে ফেলবে পারফরম্যান্সের জন্য
        if (slider.children.length > 10) {
            slider.removeChild(slider.lastChild);
        }
    }

    // শুরুতে ৪-৫টি কার্ড তৈরি করে রাখা
    for(let i=0; i<5; i++) { createCard(); }

    // প্রতি ১৫ সেকেন্ড পর পর একটি করে নতুন ফেক পেমেন্ট কার্ড আসবে
    setInterval(createCard, 15000);
}

// এটি কল করার জন্য আপনার existing `onValue` বা সেশন চেক ব্লকে এটি যোগ করুন
// উদাহরণস্বরূপ:
if (session) {
    startFakePaymentSlider();
}