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

// Variables Calendrier
let currentDate = new Date();
let fbEvents = {};

// Ecoute Firebase
onValue(ref(db, 'evenements/'), (snapshot) => {
    fbEvents = snapshot.val() || {};
    if(typeof renderCalendar === 'function') renderCalendar();
    // Appel des fonctions de liste ici si besoin
});

// Fonctions Globales
window.openLightbox = function(el) {
    const lb = document.getElementById('lightbox');
    const mediaContainer = document.getElementById('lightbox-media-container');
    const caption = document.getElementById('lightbox-caption');
    const albumContainer = document.getElementById('album-link-container');
    
    const sourceMedia = el.querySelector('img, video');
    const albumUrl = el.getAttribute('data-album');

    mediaContainer.innerHTML = "";
    if (sourceMedia.tagName === "IMG") {
        mediaContainer.innerHTML = `<img src="${sourceMedia.src}">`;
    } else {
        mediaContainer.innerHTML = `<video src="${sourceMedia.src}" controls autoplay></video>`;
    }

    caption.innerText = sourceMedia.alt || "Souvenir Pink Lady's";
    albumContainer.innerHTML = albumUrl ? `<a href="${albumUrl}" target="_blank" class="btn-view-album" style="color:pink; text-decoration:none; margin-top:10px; display:block;">📂 Voir l'album complet</a>` : "";
    
    lb.style.display = "flex";
}

window.closeLightbox = function() {
    document.getElementById('lightbox').style.display = "none";
    document.getElementById('lightbox-media-container').innerHTML = ""; // Stop la vidéo
}

// Pour que les fonctions de changement de mois marchent
window.changeMonth = (dir) => {
    currentDate.setMonth(currentDate.getMonth() + dir);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const header = document.getElementById('currentMonthYear');
    if(!grid) return;
    
    grid.innerHTML = "";
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    header.innerText = new Intl.DateTimeFormat('fr-FR', {month:'long', year:'numeric'}).format(currentDate);

    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysMonth = new Date(year, month + 1, 0).getDate();

    for(let i=0; i<firstDay; i++) grid.innerHTML += `<div class="calendar-day empty"></div>`;
    
    for(let day=1; day<=daysMonth; day++) {
        const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        let cls = "";
        if(fbEvents[dateKey]) cls = `day-${fbEvents[dateKey].type}`;
        grid.innerHTML += `<div class="calendar-day ${cls}">${day}</div>`;
    }
}