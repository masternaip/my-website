const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
let currentItem;

// Banner slideshow variables
let bannerItems = [];
let currentBannerIndex = 0;
let bannerInterval;

// Fetch trending movies/tv shows (daily)
async function fetchTrending(type) {
    const res = await fetch(`${BASE_URL}/trending/${type}/day?api_key=${API_KEY}`);
    const data = await res.json();
    return data.results;
}

// Fetch weekly trending movies
async function fetchWeeklyTrendingMovies() {
    const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
    const data = await res.json();
    return data.results;
}

// Fetch movies by company/network
async function fetchMoviesByCompany(companyId) {
    const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&sort_by=popularity.desc`);
    const data = await res.json();
    return data.results;
}
async function fetchMoviesByNetwork(networkId) {
    const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_networks=${networkId}&sort_by=popularity.desc`);
    const data = await res.json();
    return data.results;
}

// Banner display and slideshow
function displayBanner(item) {
    const bannerElement = document.getElementById('banner');
    const bannerTitle = document.getElementById('banner-title');
    const bannerDescription = document.getElementById('banner-description');

    bannerElement.style.opacity = 0;
    bannerTitle.style.opacity = 0;
    bannerDescription.style.opacity = 0;

    setTimeout(() => {
        bannerElement.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
        bannerTitle.textContent = item.title || item.name;
        bannerDescription.textContent = item.overview;
        currentItem = item;
        bannerElement.style.opacity = 1;
        bannerTitle.style.opacity = 1;
        bannerDescription.style.opacity = 1;
    }, 500);
}
function updateBannerDots() {
    const dotsContainer = document.getElementById('banner-nav-dots');
    dotsContainer.innerHTML = '';
    bannerItems.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === currentBannerIndex) dot.classList.add('active');
        dot.onclick = () => {
            clearInterval(bannerInterval);
            currentBannerIndex = index;
            displayBanner(bannerItems[currentBannerIndex]);
            updateBannerDots();
            startBannerSlideshow();
        };
        dotsContainer.appendChild(dot);
    });
}
function startBannerSlideshow() {
    clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;
        displayBanner(bannerItems[currentBannerIndex]);
        updateBannerDots();
    }, 8000);
}

// General list display
function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
        if (!item.poster_path) return;
        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => showDetails(item);
        container.appendChild(img);
    });
}

// Modal details
function showDetails(item) {
    currentItem = item;
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-description').textContent = item.overview;
    document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
    const rating = Math.round(item.vote_average / 2);
    document.getElementById('modal-rating').innerHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    changeServer();
    document.getElementById('modal').style.display = 'flex';
}
function changeServer() {
    const server = document.getElementById('server').value;
    const type = currentItem.media_type === "movie" ? "movie" : "tv";
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

// Search modal
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
        if (item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv')) {
            const img = document.createElement('img');
            img

