const API_KEY = '7e863169c39e42ac68d117c538af97fc';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original'; // Use 'original' for banner images for better quality
const POSTER_IMG_URL = 'https://image.tmdb.org/t/p/w500'; // Keep w500 for list posters
let currentItem;

async function fetchTrending(type) {
    const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
    const data = await res.json();
    return data.results;
}

async function fetchTrendingAnime() {
    let allResults = [];
    for (let page = 1; page <= 3; page++) {
        const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
        const data = await res.json();
        const filtered = data.results.filter(item =>
            item.original_language === 'ja' && item.genre_ids.includes(16)
        );
        allResults = allResults.concat(filtered);
    }
    return allResults;
}

async function fetchTagalogMovies() {
    let allTagalogMovies = [];
    for (let page = 1; page <= 2; page++) {
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&with_original_language=tl&page=${page}`);
        const data = await res.json();
        const filtered = data.results.filter(item => item.poster_path && item.overview);
        allTagalogMovies = allTagalogMovies.concat(filtered);
    }
    const uniqueTagalogMovies = Array.from(new Map(allTagalogMovies.map(item => [item.id, item])).values());
    return uniqueTagalogMovies;
}

// Function to safely stringify and escape for onclick
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// NEW FUNCTION: Populate the Swiper banner
async function populateBannerSwiper() {
    const popularMovies = await fetchTrending('movie'); // Get trending movies for banner
    const bannerContainer = document.querySelector('#banner .swiper-wrapper');
    bannerContainer.innerHTML = ''; // Clear existing content

    // Filter for items that actually have a backdrop image
    const bannerItems = popularMovies.filter(item => item.backdrop_path).slice(0, 5); // Take top 5 with backdrop

    if (bannerItems.length === 0) {
        console.warn("No movies with backdrop paths found for the banner. Check API key or data.");
        // Optionally display a fallback banner or message
        bannerContainer.innerHTML = `
            <div class="swiper-slide" style="background-color: #333; display: flex; align-items: center; justify-content: center;">
                <div class="banner-content">
                    <h2 class="banner-title">No Banner Content Available</h2>
                    <p>Please check your internet connection or API key.</p>
                </div>
            </div>
        `;
        return; // Exit if no items to display
    }

    bannerItems.forEach(item => {
        const slide = document.createElement('div');
        slide.classList.add('swiper-slide');
        slide.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
        slide.innerHTML = `
            <div class="banner-content">
                <h2 class="banner-title">${escapeHtml(item.title || item.name)}</h2>
                <p class="banner-overview">${escapeHtml(item.overview ? item.overview.substring(0, 150) + '...' : 'No overview available.')}</p>
                <button class="watch-now-button" onclick="showDetails(${escapeHtml(JSON.stringify(item))})">Watch Now</button>
            </div>
        `;
        bannerContainer.appendChild(slide);
    });

    // Initialize Swiper after slides are added
    new Swiper('#banner', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
}


function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
        if (item.poster_path) {
            const img = document.createElement('img');
            img.src = `${POSTER_IMG_URL}${item.poster_path}`;
            img.alt = item.title || item.name || 'Poster';
            img.onclick = () => showDetails(item);
            container.appendChild(img);
        }
    });
}

function showDetails(item) {
    currentItem = item;
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-description').textContent = item.overview;
    document.getElementById('modal-image').src = `${POSTER_IMG_URL}${item.poster_path}`;
    document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));

    document.getElementById('server').value = 'vidsrc.cc';
    changeServer();

    document.getElementById('modal').style.display = 'flex';
}

function changeServer() {
    if (!currentItem) {
        console.error("No item selected for video playback.");
        return;
    }
    const server = document.getElementById('server').value;
    const type = currentItem.media_type === "tv" ? "tv" : "movie";

    let embedURL = "";

    if (server === "vidsrc.cc") {
        embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
    } else if (server === "vidsrc.me") {
        embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
    } else if (server === "player.videasy.net") {
        embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
    }

    document.getElementById('modal-video').src = embedURL;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-video').src = '';
}

function openSearchModal() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('search-input').focus();
}

function closeSearchModal() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('search-input').value = '';
}

async function searchTMDB() {
    const query = document.getElementById('search-input').value;
    if (!query.trim()) {
        document.getElementById('search-results').innerHTML = '';
        return;
    }

    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
    const data = await res.json();

    const container = document.getElementById('search-results');
    container.innerHTML = '';
    data.results.forEach(item => {
        if (item.poster_path && (item.media_type === "movie" || item.media_type === "tv")) {
            const img = document.createElement('img');
            img.src = `${POSTER_IMG_URL}${item.poster_path}`;
            img.alt = item.title || item.name || 'Poster';
            img.onclick = () => {
                closeSearchModal();
                showDetails(item);
            };
            container.appendChild(img);
        }
    });
}

async function init() {
    await populateBannerSwiper(); // Ensure banner is populated first

    const movies = await fetchTrending('movie');
    const tvShows = await fetchTrending('tv');
    const anime = await fetchTrendingAnime();
    const tagalogMovies = await fetchTagalogMovies();

    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(anime, 'anime-list');
    displayList(tagalogMovies, 'tagalog-movies-list');
}

document.addEventListener('DOMContentLoaded', init);
