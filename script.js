import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURATION FIREBASE ---
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

// --- 1. ÉCOUTER FIREBASE (SYNCHRO EN DIRECT) ---
onValue(ref(db, 'evenements/'), (snapshot) => {
    fbEvents = snapshot.val() || {};
    renderCalendar();
    renderEventList();
    checkNotifications();
});

// Écoute aussi le bandeau d'alerte
onValue(ref(db, 'site/alerte'), (snapshot) => {
    const message = snapshot.val();
    const bandeau = document.getElementById('top-announcement');
    const zoneTexte = document.getElementById('announcement-text');
    if (message && message.trim() !== "") {
        zoneTexte.innerText = message;
        bandeau.style.display = 'block';
    } else {
        bandeau.style.display = 'none';
    }
});

// --- 2. GESTION DES NOTIFICATIONS ---
function checkNotifications() {
    const planningBtn = document.querySelector('a[href="#calendrier"]');
    if (!planningBtn) return;
    const countStored = localStorage.getItem('eventCount') || 0;
    const countCurrent = Object.keys(fbEvents).length;

    if (countCurrent > countStored) {
        planningBtn.style.position = 'relative';
        if (!document.getElementById('notif-dot')) {
            const dot = document.createElement('span');
            dot.id = 'notif-dot';
            dot.style.cssText = "position:absolute; top:-5px; right:-5px; width:10px; height:10px; background:red; border-radius:50%; border:2px solid white;";
            planningBtn.appendChild(dot);
        }
    }
}

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

window.changeMonth = function(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    window.renderCalendar();
};

window.showInfo = function(titre, details) {
    const panel = document.getElementById('info-panel');
    if (!panel) return;
    panel.style.opacity = 0;
    setTimeout(() => {
        panel.innerHTML = `<h4>${titre}</h4><p>${details}</p>`;
        panel.style.opacity = 1;
    }, 150);
};

// --- 4. LISTE DES PROCHAINS ÉVÉNEMENTS (J-X) ---
function renderEventList() {
    const listDiv = document.getElementById('main-event-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Transformation de l'objet Firebase en tableau filtré
    const activeEvents = Object.keys(fbEvents)
        .map(dateKey => ({ dateStr: dateKey, ...fbEvents[dateKey] }))
        .filter(ev => {
            const eventDate = new Date(ev.dateStr);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today && ev.type !== 'train';
        })
        .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));

    if (activeEvents.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; opacity:0.7;">Aucun spectacle prévu. ✨</p>';
        return;
    }

    activeEvents.slice(0, 3).forEach(ev => {
        const eventDate = new Date(ev.dateStr);
        eventDate.setHours(0, 0, 0, 0);
        
        // Calcul millisecondes -> Jours
        const diffDays = Math.round((eventDate - today) / (1000 * 60 * 60 * 24));

        const item = document.createElement('div');
        item.className = 'event-item';
        item.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#fff; padding:12px; border-radius:12px; margin-bottom:10px; border:1px solid #eee; box-shadow: 0 2px 5px rgba(0,0,0,0.05)";
        
        let labelJours = diffDays === 0 ? "JOUR J ! ✨" : `J - ${diffDays}`;
        let badgeColor = diffDays === 0 ? "#ff1493" : "#BA6E8F";

        const icon = ev.type === 'show' ? '🎭' : '📅';
        
        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.2rem">${icon}</span>
                <div>
                    <strong style="color:#0C0420;">${ev.title}</strong><br>
                    <small style="color:#7B466A; font-weight:bold;">${ev.dateStr}</small>
                </div>
            </div>
            <div style="background:${badgeColor}; color:white; padding:4px 10px; border-radius:15px; font-size:0.75rem; font-weight:bold; white-space:nowrap;">
                ${labelJours}
            </div>
        `;
        listDiv.appendChild(item);
    });
}

// --- 5. LIGHTBOX PHOTOS ---
window.openLightbox = function(galleryItem) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const albumContainer = document.getElementById('album-link-container');

    if (!lightbox || !lightboxImg) return;

    // 1. Récupérer les données de l'élément cliqué
    const img = galleryItem.querySelector('img');
    const albumUrl = galleryItem.getAttribute('data-album');

    // 2. Remplir la lightbox
    lightboxImg.src = img.src;
    lightboxCaption.innerText = img.alt;

    // 3. Gérer le bouton "Voir l'album"
    albumContainer.innerHTML = ""; // On vide d'abord
    if (albumUrl && albumUrl !== "" && albumUrl !== "LIEN_VERS_ALBUM_1") {
        const albumBtn = document.createElement('a');
        albumBtn.href = albumUrl;
        albumBtn.target = "_blank";
        albumBtn.className = "btn-view-album";
        albumBtn.innerHTML = "📂 Voir tout le dossier photos";
        albumContainer.appendChild(albumBtn);
    }

    // 4. Afficher
    lightbox.style.display = 'flex';
};

window.closeLightbox = function() {
    document.getElementById('lightbox').style.display = 'none';
}