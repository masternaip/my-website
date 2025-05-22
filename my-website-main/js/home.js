const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original'; // For high-res banner backdrops
let currentItem; // Stores the currently selected movie/TV show for modal details

// --- API Fetching Functions ---

/**
 * Fetches trending movies or TV shows for the week.
 * @param {string} type - 'movie' or 'tv'.
 * @returns {Array} - Array of trending items.
 */
async function fetchTrending(type) {
    try {
        const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
        const data = await res.json();
        return data.results;
    } catch (error) {
        console.error(`Error fetching trending ${type}:`, error);
        return [];
    }
}

/**
 * Fetches trending anime (TV shows with Japanese original language and Anime genre ID 16).
 * Fetches from multiple pages to get a broader selection.
 * @returns {Array} - Array of trending anime items.
 */
async function fetchTrendingAnime() {
    let allResults = [];
    // Fetch from multiple pages to get more anime (max 3 pages for demo)
    for (let page = 1; page <= 3; page++) {
        try {
            const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
            const data = await res.json();
            const filtered = data.results.filter(item =>
                item.original_language === 'ja' && (item.genre_ids.includes(16) || item.genre_ids.includes(10759)) // 16: Animation, 10759: Action & Adventure (often related to anime)
            );
            allResults = allResults.concat(filtered);
        } catch (error) {
            console.error(`Error fetching trending anime page ${page}:`, error);
        }
    }
    return allResults;
}

/**
 * Fetches movies with original language set to Tagalog ('tl').
 * @returns {Array} - Array of Tagalog movie items.
 */
async function fetchTagalogMovies() {
    try {
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=tl&sort_by=popularity.desc&page=1`);
        const data = await res.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching Tagalog movies:', error);
        return [];
    }
}

// --- Display Functions ---

/**
 * Displays items in the Swiper banner.
 * @param {Array} items - Array of movie/TV show items.
 */
function displayBanner(items) {
    const swiperWrapper = document.querySelector('#banner .swiper-wrapper');
    swiperWrapper.innerHTML = ''; // Clear previous content

    items.slice(0, 10).forEach(item => { // Limit to 10 items for the banner
        if (!item.backdrop_path) return; // Skip if no backdrop image

        const slide = document.createElement('div');
        slide.classList.add('swiper-slide');
        slide.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%), url(${BACKDROP_URL}${item.backdrop_path})`;
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundPosition = 'center';
        slide.style.display = 'flex';
        slide.style.alignItems = 'flex-end';
        slide.style.padding = '20px';
        slide.style.color = 'white';

        const titleElement = document.createElement('h2');
        titleElement.textContent = item.title || item.name;
        titleElement.style.fontSize = '2em';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.7)';

        slide.appendChild(titleElement);
        swiperWrapper.appendChild(slide);
    });

    // Initialize Swiper after content is loaded
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

/**
 * Displays a list of items (movies/TV shows) in a given container.
 * @param {Array} items - Array of movie/TV show items.
 * @param {string} containerId - ID of the HTML container element.
 */
function displayList(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear previous content
    items.forEach(item => {
        if (!item.poster_path) return; // Skip if no poster image

        const img = document.createElement('img');
        img.src = `${IMG_URL}${item.poster_path}`;
        img.alt = item.title || item.name;
        img.onerror = () => { img.src = 'https://placehold.co/500x750/cccccc/000000?text=No+Image'; }; // Placeholder for broken images
        img.onclick = () => handleMovieClick(item); // Attach click handler
        container.appendChild(img);
    });
}

// --- Modal and Details Functions ---

/**
 * Handles the click event on a movie/TV show item.
 * Opens an external URL and then shows the details modal after a delay.
 * @param {Object} item - The movie/TV show item object.
 */
function handleMovieClick(item) {
    // Open external URL in a new tab (as per previous request)
    window.open('https://www.w3schools.com/', '_blank'); // Example URL

    // Show movie details after a delay
    setTimeout(() => {
        showDetails(item);
    }, 2000); // 2-second delay
}

/**
 * Displays the details modal for a given movie/TV show item.
 * @param {Object} item - The movie/TV show item object.
 */
function showDetails(item) {
    currentItem = item; // Store the item globally for server selection
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-description').textContent = item.overview || 'No description available.';
    document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
    document.getElementById('modal-image').alt = item.title || item.name;
    document.getElementById('modal-image').onerror = () => { document.getElementById('modal-image').src = 'https://placehold.co/500x750/cccccc/000000?text=No+Image'; };

    // Display rating stars
    const ratingElement = document.getElementById('modal-rating');
    ratingElement.innerHTML = '★'.repeat(Math.round(item.vote_average / 2)) + '<span>☆</span>'.repeat(5 - Math.round(item.vote_average / 2));
    ratingElement.style.color = '#FFD700'; // Gold color for stars

    // Set initial server selection and load video
    const serverSelect = document.getElementById('server');
    serverSelect.value = 'vidsrc.cc'; // Default to vidsrc.cc
    changeServer(); // Load video for the default server

    document.getElementById('modal').style.display = 'flex'; // Show the modal
}

/**
 * Changes the video source in the modal based on the selected server.
 */
function changeServer() {
    if (!currentItem) return; // Ensure an item is selected

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

    const modalVideo = document.getElementById('modal-video');
    modalVideo.src = embedURL; // Set the iframe source
}

/**
 * Closes the details modal and clears the video source.
 */
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-video').src = ''; // Stop video playback
}

// --- Search Modal Functions ---

/**
 * Opens the search modal and focuses the input.
 */
function openSearchModal() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('search-input').value = ''; // Clear previous search
    document.getElementById('search-results').innerHTML = ''; // Clear previous results
    document.getElementById('search-input').focus();
}

/**
 * Closes the search modal and clears results.
 */
function closeSearchModal() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('search-results').innerHTML = '';
}

/**
 * Performs a multi-search on TMDB based on user query.
 */
async function searchTMDB() {
    const query = document.getElementById('search-input').value;
    const searchResultsContainer = document.getElementById('search-results');
    searchResultsContainer.innerHTML = ''; // Clear previous results

    if (!query.trim()) {
        return; // Do nothing if query is empty
    }

    try {
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
        const data = await res.json();

        data.results.forEach(item => {
            // Only display items with a poster and a known media type
            if (!item.poster_path || (item.media_type !== 'movie' && item.media_type !== 'tv')) return;

            const img = document.createElement('img');
            img.src = `${IMG_URL}${item.poster_path}`;
            img.alt = item.title || item.name;
            img.onerror = () => { img.src = 'https://placehold.co/500x750/cccccc/000000?text=No+Image'; }; // Placeholder for broken images
            img.onclick = () => {
                closeSearchModal(); // Close search modal
                handleMovieClick(item); // Show details (with redirect delay)
            };
            searchResultsContainer.appendChild(img);
        });

        if (data.results.length === 0) {
            searchResultsContainer.innerHTML = '<p>No results found.</p>';
        }

    } catch (error) {
        console.error('Error during search:', error);
        searchResultsContainer.innerHTML = '<p>Error searching. Please try again.</p>';
    }
}

// --- Initialization ---

/**
 * Initializes the application by fetching and displaying all content.
 */
async function init() {
    const movies = await fetchTrending('movie');
    const tvShows = await fetchTrending('tv');
    const anime = await fetchTrendingAnime();
    const tagalogMovies = await fetchTagalogMovies();

    // Display banner with a selection of trending movies (or tv shows if movies are empty)
    if (movies.length > 0) {
        displayBanner(movies);
    } else if (tvShows.length > 0) {
        displayBanner(tvShows);
    } else {
        // Fallback if no trending items are available
        document.querySelector('#banner .swiper-wrapper').innerHTML = '<div class="swiper-slide" style="background-color: #333; display: flex; justify-content: center; align-items: center; color: white;"><h2>No trending content available.</h2></div>';
    }


    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(anime, 'anime-list');
    displayList(tagalogMovies, 'tagalog-movies-list');
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
