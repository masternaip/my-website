const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae'; // Your TMDb API Key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
let currentItem; // To store the currently selected item for modal details

// New variables for banner slideshow
let bannerItems = [];
let currentBannerIndex = 0;
let bannerInterval; // To hold the interval ID

// Function to fetch trending movies/tv shows (now specifically daily trending)
async function fetchTrending(type) {
    const res = await fetch(`${BASE_URL}/trending/${type}/day?api_key=${API_KEY}`);
    const data = await res.json();
    return data.results;
}

// Function to fetch weekly trending movies
async function fetchWeeklyTrendingMovies() {
    const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
    const data = await res.json();
    return data.results;
}

// NEW: Function to fetch movies by production company
async function fetchMoviesByCompany(companyId) {
    // You can adjust sort_by as needed, e.g., 'vote_average.desc' for "top"
    const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&sort_by=popularity.desc`);
    const data = await res.json();
    return data.results;
}

// NEW: Function to fetch movies by network (useful for Netflix originals)
async function fetchMoviesByNetwork(networkId) {
    const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_networks=${networkId}&sort_by=popularity.desc`);
    const data = await res.json();
    return data.results;
}


// Function to display the main banner
function displayBanner(item) {
    const bannerElement = document.getElementById('banner');
    const bannerTitle = document.getElementById('banner-title');
    const bannerDescription = document.getElementById('banner-description');

    // Apply fade-out effect
    bannerElement.style.opacity = 0;
    bannerTitle.style.opacity = 0;
    bannerDescription.style.opacity = 0;

    // After fade-out, change content and fade in
    setTimeout(() => {
        bannerElement.style.backgroundImage = `url(${IMG_URL}${item.backdrop_path}`;
        bannerTitle.textContent = item.title || item.name;
        bannerDescription.textContent = item.overview;
        currentItem = item; // Set the current item for the banner as well

        // Apply fade-in effect
        bannerElement.style.opacity = 1;
        bannerTitle.style.opacity = 1;
        bannerDescription.style.opacity = 1;
    }, 500); // Half of the transition duration in CSS
}

// Function to update active dot for banner slideshow
function updateBannerDots() {
    const dotsContainer = document.getElementById('banner-nav-dots');
    dotsContainer.innerHTML = ''; // Clear existing dots

    bannerItems.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === currentBannerIndex) {
            dot.classList.add('active');
        }
        dot.onclick = () => {
            clearInterval(bannerInterval); // Stop current interval
            currentBannerIndex = index;
            displayBanner(bannerItems[currentBannerIndex]);
            updateBannerDots();
            startBannerSlideshow(); // Restart interval
        };
        dotsContainer.appendChild(dot);
    });
}

// Function to start the banner slideshow
function startBannerSlideshow() {
    // Clear any existing interval to prevent multiple slideshows
    clearInterval(bannerInterval);

    bannerInterval = setInterval(() => {
        currentBannerIndex = (currentBannerIndex + 1) % bannerItems.length;
        displayBanner(bannerItems[currentBannerIndex]);
        updateBannerDots();
    }, 8000); // Change banner every 8 seconds (adjust as needed)
}


// Function to display lists of movies/tv shows
function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear previous content
    items.forEach(item => {
        if (!item.poster_path) return; // Skip items without a poster
        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onclick = () => showDetails(item); // Attach click event to show details
        container.appendChild(img);
    });
}

// Function to show details modal
function showDetails(item) {
    currentItem = item; // Store the clicked item
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-description').textContent = item.overview;
    document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
    // Display star rating
    const rating = Math.round(item.vote_average / 2); // Convert 10-point scale to 5-star
    document.getElementById('modal-rating').innerHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    changeServer(); // Initialize video player with default server
    document.getElementById('modal').style.display = 'flex'; // Show the modal
}

// Function to change the video streaming server
function changeServer() {
    const server = document.getElementById('server').value;
    const type = currentItem.media_type === "movie" ? "movie" : "tv"; // Determine if movie or TV show
    let embedURL = "";

    if (server === "vidsrc.cc") {
        embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
    } else if (server === "vidsrc.me") {
        embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`; // Note: vidsrc.me often uses 'net'
    } else if (server === "player.videasy.net") {
        embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
    }

    document.getElementById('modal-video').src = embedURL; // Update iframe source
}

// Function to close the detail modal
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-video').src = ''; // Stop video playback
}

// Function to open the search modal
function openSearchModal() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('search-input').focus(); // Focus on search input
}

// Function to close the search modal
function closeSearchModal() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('search-results').innerHTML = ''; // Clear search results
    document.getElementById('search-input').value = ''; // Clear search input
}

// Function to search TMDB
async function searchTMDB() {
    const query = document.getElementById('search-input').value;
    if (!query.trim()) {
        document.getElementById('search-results').innerHTML = ''; // Clear if query is empty
        return;
    }

    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
    const data = await res.json();

    const container = document.getElementById('search-results');
    container.innerHTML = '';
    data.results.forEach(item => {
        // Only display items with a poster and a known media type (movie or tv)
        if (item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv')) {
            const img = document.createElement('img');
            img.src = `${IMG_URL}${item.poster_path}`;
            img.alt = item.title || item.name;
            img.onclick = () => {
                closeSearchModal(); // Close search modal
                showDetails(item); // Show details of the clicked item
            };
            container.appendChild(img);
        }
    });
}

// Initialize function to load content on page load
async function init() {
    const movies = await fetchTrending('movie');
    const tvShows = await fetchTrending('tv');
    const weeklyTrendMovie = await fetchWeeklyTrendingMovies();

    // NEW: Fetch movies by production company/network
    const hboMovies = await fetchMoviesByCompany(3268); // HBO production company ID
    const netflixMovies = await fetchMoviesByNetwork(213); // Netflix network ID for originals
    const marvelMovies = await fetchMoviesByCompany(420); // Marvel Studios production company ID
    const disneyMovies = await fetchMoviesByCompany(2); // Walt Disney Pictures production company ID
    // Alternative for Disney: fetch a curated list from TMDB if you prefer:
    // const disneyMovies = await fetch(`${BASE_URL}/list/5905?api_key=${API_KEY}`).then(res => res.json()).then(data => data.items);


    // Populate bannerItems with a mix of daily trending movies and TV shows
    bannerItems = [...movies.slice(0, 5), ...tvShows.slice(0, 5)]; // Take top 5 from each
    if (bannerItems.length > 0) {
        displayBanner(bannerItems[currentBannerIndex]);
        updateBannerDots();
        startBannerSlideshow(); // Start the slideshow
    }

    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(weeklyTrendMovie, 'weekly-trend-movie-list');

    // NEW: Display the new lists
    displayList(hboMovies, 'hbo-movies-list');
    displayList(netflixMovies, 'netflix-movies-list');
    displayList(marvelMovies, 'marvel-movies-list');
    displayList(disneyMovies, 'disney-movies-list');


    // Add scroll event listener to header for background change
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Call init when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
