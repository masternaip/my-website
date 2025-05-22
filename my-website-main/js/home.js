const API_KEY = '7e863169c39e42ac68d117c538af97fc';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
let currentItem;

async function fetchTrending(type) {
    const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
    const data = await res.json();
    return data.results;
}
async function fetchNewMovies() {
    try {
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=primary_release_date.desc&page=1`);
        const data = await res.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching new movies:', error);
        return [];
    }
}

function displayNewMovies(movies) {
    const container = document.getElementById('new-movies-list');
    container.innerHTML = '';
    movies.forEach(item => {
        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => handleMovieClick(item);
        container.appendChild(img);
    });
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

function displayBanner(item) {
    document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
    document.getElementById('banner-title').textContent = item.title || item.name;
}

function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => handleMovieClick(item);
        container.appendChild(img);
    });
}

function handleMovieClick(item) {
    window.open('https://www.w3schools.com/', '_blank');
    showDetails(item);
}

function showDetails(item) {
    currentItem = item;
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-description').textContent = item.overview;
    document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
    document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
    playVideo();
    document.getElementById('modal').style.display = 'flex';

    // Create the download button dynamically
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Mediafire Download'; // Renamed the button text
    downloadButton.id = 'download-mediafire-button'; // Keep the ID for potential specific styling
    downloadButton.onclick = () => window.open('https://www.w3schools.com/', '_blank');

    // Find the modal content element to append the button
    const modalContent = document.querySelector('.modal-content');
    // Append the button to the modal content
    if (modalContent) {
        modalContent.appendChild(downloadButton);
    }
}

function playVideo() {
    const type = currentItem.media_type === "movie" ? "movie" : "tv";
    const embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
    document.getElementById('modal-video').src = embedURL;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-video').src = '';
    // Remove the dynamically created download button when the modal closes
    const downloadButton = document.getElementById('download-mediafire-button');
    if (downloadButton) {
        downloadButton.remove();
    }
}

function openSearchModal() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('search-input').focus();
}

function closeSearchModal() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
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
        if (!item.poster_path) return;
        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => {
            window.open('https://www.w3schools.com/', '_blank');
            closeSearchModal();
            showDetails(item);
        };
        container.appendChild(img);
    });
}

async function init() {
    const movies = await fetchTrending('movie');
    const tvShows = await fetchTrending('tv');
    const anime = await fetchTrendingAnime();
    const newMovies = await fetchNewMovies();

    displayBanner(movies[Math.floor(Math.random() * movies.length)]);
    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(anime, 'anime-list');
}

init();
