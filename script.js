// Konfigurasi API
const API_BASE = '/api/proxy?endpoint=';

// DOM Elements
const ongoingGrid = document.getElementById('ongoingGrid');
const completeGrid = document.getElementById('completeGrid');
const scheduleContainer = document.getElementById('scheduleContainer');
const genreGrid = document.getElementById('genreGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const animeModal = document.getElementById('animeModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Ditznime starting with REAL API...');
    loadHomePage(); // <-- PAKE HOME, bukan ongoing/complete terpisah
    loadSchedule();
    loadGenres();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    searchBtn.addEventListener('click', () => {
        const keyword = searchInput.value.trim();
        if (keyword) {
            searchAnime(keyword);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    closeModal.addEventListener('click', () => {
        animeModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === animeModal) {
            animeModal.style.display = 'none';
        }
    });

    // Nav links
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            
            if (target === '#home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                loadHomePage();
            } else if (target === '#ongoing') {
                document.getElementById('ongoing').scrollIntoView({ behavior: 'smooth' });
            } else if (target === '#complete') {
                document.getElementById('complete').scrollIntoView({ behavior: 'smooth' });
            } else if (target === '#schedule') {
                document.getElementById('schedule').scrollIntoView({ behavior: 'smooth' });
            }
            
            navMenu.classList.remove('active');
        });
    });
}

// Fetch API
async function fetchAPI(endpoint) {
    try {
        console.log('Fetching:', endpoint);
        const response = await fetch(`${API_BASE}${endpoint}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// LOAD HOME PAGE (ini yg bener)
async function loadHomePage() {
    // Show loading
    ongoingGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    completeGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    const data = await fetchAPI('home');
    
    if (data && data.status === 'success' && data.data) {
        // Ongoing Anime
        if (data.data.ongoing && data.data.ongoing.animeList) {
            displayAnimeGrid(data.data.ongoing.animeList.slice(0, 12), ongoingGrid);
        } else {
            ongoingGrid.innerHTML = '<div class="error-message">Tidak ada ongoing anime</div>';
        }
        
        // Completed Anime
        if (data.data.completed && data.data.completed.animeList) {
            displayAnimeGrid(data.data.completed.animeList.slice(0, 12), completeGrid);
        } else {
            completeGrid.innerHTML = '<div class="error-message">Tidak ada completed anime</div>';
        }
    } else {
        ongoingGrid.innerHTML = '<div class="error-message">Gagal load homepage</div>';
        completeGrid.innerHTML = '<div class="error-message">Gagal load homepage</div>';
    }
}

// Display Anime Grid
function displayAnimeGrid(animeList, container) {
    if (!animeList || animeList.length === 0) {
        container.innerHTML = '<div class="error-message">Tidak ada anime</div>';
        return;
    }
    
    container.innerHTML = '';
    
    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        
        // PAKE animeId buat detail, bukan slug biasa
        const animeId = anime.animeId || anime.href?.split('/').pop() || '';
        
        card.onclick = () => showAnimeDetail(animeId);
        
        const poster = anime.poster || 'https://via.placeholder.com/300x400/2a2a2a/ff6b6b?text=No+Image';
        const title = anime.title || 'Unknown';
        const episodes = anime.episodes || anime.episode_count || '?';
        const releaseDay = anime.releaseDay || '';
        
        card.innerHTML = `
            <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400/2a2a2a/ff6b6b?text=Error'">
            <div class="anime-info">
                <h3>${title}</h3>
                <p>${releaseDay ? releaseDay + ' • ' : ''}${episodes} Ep</p>
                ${anime.score ? `<span class="episode">⭐ ${anime.score}</span>` : ''}
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Show Anime Detail
async function showAnimeDetail(animeId) {
    modalBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    animeModal.style.display = 'block';
    
    // Dari response home, href-nya "/anime/anime/goumon-baito-sub-indo"
    // Berarti endpoint detail: /anime/goumon-baito-sub-indo
    const data = await fetchAPI(`anime/${animeId}`);
    
    if (data && data.status === 'success') {
        displayAnimeDetail(data.data);
    } else {
        modalBody.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Gagal load detail anime</p>
                <button class="retry-btn" onclick="showAnimeDetail('${animeId}')">Coba Lagi</button>
                <button class="retry-btn" onclick="animeModal.style.display='none'">Tutup</button>
            </div>
        `;
    }
}

// Display Anime Detail
function displayAnimeDetail(anime) {
    // Dari response home, struktur detail bisa dicek nanti
    modalBody.innerHTML = `
        <div class="anime-detail">
            <img src="${anime.poster || 'https://via.placeholder.com/300x400/2a2a2a/ff6b6b?text=No+Image'}" 
                 alt="${anime.title}"
                 onerror="this.src='https://via.placeholder.com/300x400/2a2a2a/ff6b6b?text=Error'">
            <div class="detail-info">
                <h2>${anime.title || 'Unknown'}</h2>
                <p><strong>Japanese:</strong> ${anime.japanese || '-'}</p>
                <p><strong>Rating:</strong> ⭐ ${anime.score || anime.rating || 'N/A'}</p>
                <p><strong>Status:</strong> ${anime.status || 'Unknown'}</p>
                <p><strong>Episode:</strong> ${anime.episodes || anime.episode_count || '?'}</p>
                <p><strong>Release Day:</strong> ${anime.releaseDay || '?'}</p>
                
                ${anime.genres ? `
                    <div class="genre-tags">
                        ${anime.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>
                ` : ''}
                
                <p><strong>Sinopsis:</strong> ${anime.synopsis || 'Tidak ada sinopsis'}</p>
                
                <button class="retry-btn" onclick="showEpisodes('${anime.animeId || anime.id}')" style="margin-top:20px;">
                    <i class="fas fa-play"></i> Lihat Episode
                </button>
            </div>
        </div>
    `;
}

// Show Episodes
async function showEpisodes(animeId) {
    modalBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    // Dari home, href untuk episode mungkin /episode/:slug
    const data = await fetchAPI(`episode/${animeId}`);
    
    if (data && data.status === 'success') {
        const episodeList = data.data?.episodeList || [];
        
        modalBody.innerHTML = `
            <div style="color:#fff;">
                <h2 style="color:#ff6b6b; margin-bottom:20px;">Daftar Episode</h2>
                <div style="display:flex; flex-wrap:wrap; gap:10px;">
                    ${episodeList.map((ep, i) => `
                        <button class="episode-item" onclick="watchEpisode('${animeId}', '${ep.episode || i+1}')">
                            Episode ${ep.episode || i+1}
                        </button>
                    `).join('')}
                </div>
                <button class="retry-btn" onclick="showAnimeDetail('${animeId}')" style="margin-top:20px;">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
            </div>
        `;
    } else {
        modalBody.innerHTML = `
            <div class="error-message">
                <p>Tidak ada episode</p>
                <button class="retry-btn" onclick="showAnimeDetail('${animeId}')">Kembali</button>
            </div>
        `;
    }
}

// Watch Episode
async function watchEpisode(animeId, episodeNum) {
    modalBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    const data = await fetchAPI(`watch/${animeId}/${episodeNum}`);
    
    if (data && data.status === 'success' && data.data?.streamUrl) {
        modalBody.innerHTML = `
            <div style="color:#fff;">
                <h2 style="color:#ff6b6b; margin-bottom:20px;">Episode ${episodeNum}</h2>
                
                <div class="video-container">
                    <iframe 
                        src="${data.data.streamUrl}" 
                        frameborder="0" 
                        allow="autoplay; encrypted-media" 
                        allowfullscreen>
                    </iframe>
                </div>
                
                ${data.data.downloadLinks ? `
                    <div class="download-links">
                        <h3 style="color:#ff6b6b; margin:20px 0 10px;">Download:</h3>
                        ${Object.entries(data.data.downloadLinks).map(([quality, url]) => `
                            <a href="${url}" target="_blank" class="download-btn">
                                <i class="fas fa-download"></i> ${quality}
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
                
                <button class="retry-btn" onclick="showEpisodes('${animeId}')" style="margin-top:20px;">
                    <i class="fas fa-arrow-left"></i> Kembali ke Episode
                </button>
            </div>
        `;
    } else {
        modalBody.innerHTML = `
            <div class="error-message">
                <p>Gagal memuat video</p>
                <button class="retry-btn" onclick="showEpisodes('${animeId}')">Kembali</button>
            </div>
        `;
    }
}

// Load Schedule (dari /schedule)
async function loadSchedule() {
    scheduleContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    scheduleContainer.innerHTML = '';
    
    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const dayName = dayNames[i];
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'schedule-day';
        dayDiv.innerHTML = `<h3>${dayName}</h3>`;
        
        const data = await fetchAPI(`schedule?scheduled_day=${day}`);
        
        if (data && data.status === 'success' && data.data?.scheduleList) {
            data.data.scheduleList.slice(0, 4).forEach(item => {
                const scheduleItem = document.createElement('div');
                scheduleItem.className = 'schedule-item';
                scheduleItem.onclick = () => showAnimeDetail(item.animeId);
                scheduleItem.innerHTML = `
                    <h4>${item.title}</h4>
                    <p>${item.time || '??:??'} WIB</p>
                `;
                dayDiv.appendChild(scheduleItem);
            });
        } else {
            dayDiv.innerHTML += '<p style="color:#666; padding:10px;">Tidak ada jadwal</p>';
        }
        
        scheduleContainer.appendChild(dayDiv);
    }
}

// Load Genres (dari /genre)
async function loadGenres() {
    genreGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    const data = await fetchAPI('genre');
    
    if (data && data.status === 'success' && data.data?.genreList) {
        genreGrid.innerHTML = '';
        data.data.genreList.slice(0, 18).forEach(genre => {
            const genreItem = document.createElement('div');
            genreItem.className = 'genre-item';
            genreItem.onclick = () => showAnimeByGenre(genre.slug);
            genreItem.textContent = genre.name;
            genreGrid.appendChild(genreItem);
        });
    } else {
        genreGrid.innerHTML = '<div class="error-message">Gagal load genre</div>';
    }
}

// Search Anime (dari /search/:keyword)
async function searchAnime(keyword) {
    modalBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    animeModal.style.display = 'block';
    
    const data = await fetchAPI(`search/${encodeURIComponent(keyword)}`);
    
    if (data && data.status === 'success' && data.data?.animeList) {
        modalBody.innerHTML = `
            <div style="color:#fff;">
                <h2 style="color:#ff6b6b; margin-bottom:20px;">Hasil Pencarian: "${keyword}"</h2>
                <div class="anime-grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
                    ${data.data.animeList.map(anime => `
                        <div class="anime-card" onclick="showAnimeDetail('${anime.animeId}')">
                            <img src="${anime.poster || 'https://via.placeholder.com/300x400/2a2a2a/ff6b6b?text=No+Image'}" 
                                 alt="${anime.title}"
                                 onerror="this.src='https://via.placeholder.com/300x400/2a2a2a/ff6b6b?text=Error'">
                            <div class="anime-info">
                                <h3>${anime.title}</h3>
                                <p>${anime.type || 'Anime'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        modalBody.innerHTML = `
            <div class="error-message">
                <i class="fas fa-search"></i>
                <p>Anime "${keyword}" tidak ditemukan</p>
                <button class="retry-btn" onclick="animeModal.style.display='none'">Tutup</button>
            </div>
        `;
    }
}

// Show Anime by Genre
async function showAnimeByGenre(genreSlug) {
    modalBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    animeModal.style.display = 'block';
    
    const data = await fetchAPI(`genre/${genreSlug}`);
    
    if (data && data.status === 'success' && data.data?.animeList) {
        modalBody.innerHTML = `
            <div style="color:#fff;">
                <h2 style="color:#ff6b6b; margin-bottom:20px;">Genre: ${genreSlug}</h2>
                <div class="anime-grid" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">
                    ${data.data.animeList.map(anime => `
                        <div class="anime-card" onclick="showAnimeDetail('${anime.animeId}')">
                            <img src="${anime.poster || 'https://via.placeholder.com/300x400/2a2a2a/ff6b6b?text=No+Image'}" 
                                 alt="${anime.title}"
                                 onerror="this.src='https://via.placeholder.com/300x400/2a2a2a/ff6b6b?text=Error'">
                            <div class="anime-info">
                                <h3>${anime.title}</h3>
                                <p>${anime.type || 'Anime'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        modalBody.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Gagal load anime untuk genre ini</p>
                <button class="retry-btn" onclick="animeModal.style.display='none'">Tutup</button>
            </div>
        `;
    }
}

// Global functions
window.showAnimeDetail = showAnimeDetail;
window.showEpisodes = showEpisodes;
window.watchEpisode = watchEpisode;
window.showAnimeByGenre = showAnimeByGenre;