import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAeGgQL3Lg0PE54veFBX9jguANTr7hX8xQ",
    authDomain: "majorette-pinkladies-site.firebaseapp.com",
    databaseURL: "https://majorette-pinkladies-site-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "majorette-pinkladies-site",
    storageBucket: "majorette-pinkladies-site.firebasestorage.app",
    messagingSenderId: "870826859078",
    appId: "1:870826859078:web:f76b3b4e80bce1e8798847"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentDate = new Date();
let fbEvents = {};

// --- 1. ÉCOUTER FIREBASE ---
onValue(ref(db, 'evenements/'), (snapshot) => {
    fbEvents = snapshot.val() || {};
    console.log("Données reçues :", fbEvents);
    
    renderCalendar();
    renderEventList();
    checkNotifications(); // Nouvelle fonction pour le point rouge
});

// --- 2. GESTION DU POINT ROUGE (NOTIFICATIONS) ---
function checkNotifications() {
    const planningBtn = document.querySelector('a[href="#calendrier"]');
    if (!planningBtn) return;

    const countStored = localStorage.getItem('eventCount') || 0;
    const countCurrent = Object.keys(fbEvents).length;

    // Si nouveau contenu, on ajoute un petit point rouge
    if (countCurrent > countStored) {
        planningBtn.style.position = 'relative';
        if (!document.getElementById('notif-dot')) {
            const dot = document.createElement('span');
            dot.id = 'notif-dot';
            dot.style.cssText = "position:absolute; top:-5px; right:-5px; width:10px; height:10px; background:red; border-radius:50%; border:2px solid var(--dark-blue);";
            planningBtn.appendChild(dot);
        }
    }
}

// Nettoyer la notif quand on clique sur le planning
document.addEventListener('click', (e) => {
    if (e.target.closest('a[href="#calendrier"]')) {
        localStorage.setItem('eventCount', Object.keys(fbEvents).length);
        const dot = document.getElementById('notif-dot');
        if (dot) dot.remove();
    }
});

// --- 3. RENDU DU CALENDRIER ---
window.renderCalendar = function() {
    const grid = document.getElementById('calendarGrid');
    const monthYearText = document.getElementById('currentMonthYear');
    
    if (!grid || !monthYearText) return;

    grid.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
    monthYearText.innerText = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let startDay = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;

    for (let x = 0; x < startDay; x++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        grid.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.innerText = day;

        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (fbEvents[dateKey]) {
            const ev = fbEvents[dateKey];
            dayDiv.classList.add(`day-${ev.type}`);
            dayDiv.onclick = () => window.showInfo(ev.title, ev.desc);
        }
        grid.appendChild(dayDiv);
    }
};

// --- 4. NAVIGATION ET INFOS ---
window.changeMonth = function(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    window.renderCalendar();
};

window.showInfo = function(titre, details) {
    const panel = document.getElementById('info-panel');
    if (!panel) return;
    panel.style.opacity = 0;
    setTimeout(() => {
        panel.innerHTML = `
            <h4>${titre}</h4>
            <div style="width:40px;height:3px;background:var(--pink-soft);margin-bottom:15px;"></div>
            <p>${details}</p>
        `;
        panel.style.opacity = 1;
    }, 150);
};

// --- 5. LISTE J-X ---
function renderEventList() {
    const listDiv = document.getElementById('main-event-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    const today = new Date();
    today.setHours(0,0,0,0);

    // --- LE FILTRE EST ICI ---
    const activeEvents = Object.keys(fbEvents)
        .filter(dateKey => {
            const eventDate = new Date(dateKey);
            const isFuture = eventDate >= today;
            const isNotTraining = fbEvents[dateKey].type !== 'train'; // On exclut les entraînements
            return isFuture && isNotTraining;
        })
        .sort(); // Trie par date
    // -------------------------

    if (activeEvents.length === 0) {
        listDiv.innerHTML = '<p style="font-size:0.9rem; opacity:0.8;">Aucun spectacle ou gala prévu pour le moment. ✨</p>';
        return;
    }

    activeEvents.slice(0, 3).forEach(dateStr => {
        const diff = Math.ceil((new Date(dateStr) - today) / (1000 * 60 * 60 * 24));
        const item = document.createElement('div');
        item.className = 'event-item';
        
        // On change l'icône selon le type
        const icon = fbEvents[dateStr].type === 'show' ? '🎭' : '📅';
        
        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.2rem">${icon}</span>
                <div>
                    <strong style="color:var(--dark-blue);">${fbEvents[dateStr].title}</strong><br>
                    <small style="color:var(--purple-main); font-weight:bold;">${dateStr}</small>
                </div>
            </div>
            <div class="days-left" style="background:var(--pink-bold); color:white; padding:4px 10px; border-radius:15px; font-size:0.75rem; font-weight:bold;">
                J - ${diff}
            </div>
        `;
        
        // Un petit style pour rendre ça joli
        item.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#fff; padding:12px; border-radius:12px; margin-bottom:10px; border:1px solid #eee; box-shadow: 0 2px 5px rgba(0,0,0,0.05)";
        
        listDiv.appendChild(item);
    });
}

// --- 6. LIGHTBOX PHOTOS ---
window.openLightbox = function(imgElement) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    lightbox.style.display = 'flex';
    lightboxImg.src = imgElement.src;
    lightboxCaption.innerText = imgElement.alt;
};

window.closeLightbox = function() {
    document.getElementById('lightbox').style.display = 'none';
};



