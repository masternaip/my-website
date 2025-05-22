const API_KEY = 'a1e72fd93ed59f56e6332813b9f8dcae'; // Your TMDb API Key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original'; // For high-res banner backdrops
let currentItem; // Stores the currently selected movie/TV show for modal details
let episodesData = []; // To store episode details for TV shows

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
 * Fetches trending anime (TV shows with Japanese original language and Animation/Action & Adventure genre ID).
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
        const backdropPath = item.backdrop_path;
        const fullBackdropUrl = backdropPath ? `${BACKDROP_URL}${backdropPath}` : '';

        console.log(`Banner Item: ${item.title || item.name}, Backdrop Path: ${backdropPath}, Full URL: ${fullBackdropUrl}`);

        const slide = document.createElement('div');
        slide.classList.add('swiper-slide');
        
        if (fullBackdropUrl) {
            slide.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%), url(${fullBackdropUrl})`;
            slide.style.backgroundSize = 'cover';
            slide.style.backgroundPosition = 'center';
        } else {
            slide.style.backgroundColor = '#333'; // Fallback solid color
            console.warn(`No backdrop image for banner item: ${item.title || item.name}. Using fallback color.`);
        }
        
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
        const posterPath = item.poster_path;
        const fullPosterUrl = posterPath ? `${IMG_URL}${posterPath}` : 'https://placehold.co/500x750/cccccc/000000?text=No+Image';

        console.log(`List Item: ${item.title || item.name}, Poster Path: ${posterPath}, Full URL: ${fullPosterUrl}`);

        const img = document.createElement('img');
        img.src = fullPosterUrl;
        img.alt = item.title || item.name;
        img.onerror = () => {
            img.src = 'https://placehold.co/500x750/cccccc/000000?text=Image+Error'; // More specific error placeholder
            console.error(`Failed to load image for ${item.title || item.name}: ${fullPosterUrl}`);
        };
        img.onclick = () => handleMovieClick(item); // Attach click handler
        container.appendChild(img);
    });
}

// --- Modal and Details Functions ---

/**
 * Handles the click event on a movie/TV show item.
 * Directly shows the details modal.
 * @param {Object} item - The movie/TV show item object.
 */
function handleMovieClick(item) {
    showDetails(item);
}

/**
 * Displays the details modal for a given movie/TV show item.
 * @param {Object} item - The movie/TV show item object.
 */
function showDetails(item) {
    currentItem = item; // Store the item globally for server selection
    document.getElementById('modal-title').textContent = item.title || item.name;
    document.getElementById('modal-description').textContent = item.overview || 'No description available.';
    
    const modalImage = document.getElementById('modal-image');
    const posterPath = item.poster_path;
    const fullPosterUrl = posterPath ? `${IMG_URL}${posterPath}` : 'https://placehold.co/500x750/cccccc/000000?text=No+Image';
    modalImage.src = fullPosterUrl;
    modalImage.alt = item.title || item.name;
    modalImage.onerror = () => { modalImage.src = 'https://placehold.co/500x750/cccccc/000000?text=Image+Error'; };

    // Display rating stars
    const ratingElement = document.getElementById('modal-rating');
    ratingElement.innerHTML = '★'.repeat(Math.round(item.vote_average / 2)) + '<span>☆</span>'.repeat(5 - Math.round(item.vote_average / 2));
    ratingElement.style.color = '#FFD700'; // Gold color for stars

    // Set initial server selection and load video
    const serverSelect = document.getElementById('server');
    // Ensure the server select element exists before trying to set its value
    if (serverSelect) {
        serverSelect.value = 'vidsrc.cc'; // Default to vidsrc.cc
    }
    
    const episodeSelectContainer = document.getElementById('episode-select-container');
    const episodeTitleContainer = document.getElementById('episode-title-container');
    const currentEpisodeTitleSpan = document.getElementById('current-episode-title');

    if (item.media_type === 'tv') {
        episodeSelectContainer.style.display = 'flex';
        episodeTitleContainer.style.display = 'block'; // Show episode title container
        currentEpisodeTitleSpan.textContent = 'Loading...'; // Initial loading text
        loadEpisodes(item.id);
    } else {
        episodeSelectContainer.style.display = 'none';
        episodeTitleContainer.style.display = 'none'; // Hide for movies
        changeServer(); // Load movie video
    }

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

    // Construct embed URL based on selected server
    if (server === "vidsrc.cc") {
        embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
    } else if (server === "vidsrc.me") {
        embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
    } else if (server === "player.videasy.net") {
        embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
    }

    if (type === 'tv' && currentItem.media_type === 'tv') { // Ensure it's a TV show before adding episode params
        embedURL += `?season=${selectedSeason}&episode=${selectedEpisode}`;
    }

    const modalVideo = document.getElementById('modal-video');
    const loadingMessage = document.getElementById('video-loading-message');

    // Reset iframe src to clear previous content and trigger new load
    modalVideo.src = '';
    modalVideo.style.display = 'none'; // Hide iframe while loading

    if (loadingMessage) {
        loadingMessage.textContent = 'Loading video...';
        loadingMessage.style.display = 'block'; // Show loading message
        loadingMessage.style.color = '#666'; // Reset color
    }

    // Set the new iframe source
    modalVideo.src = embedURL;
    console.log('Attempting to load video from:', embedURL); // Log the URL being loaded

    // Clear previous event listeners to prevent multiple fires
    modalVideo.onload = null;
    modalVideo.onerror = null;

    // Add new event listeners for loading state and potential errors
    modalVideo.onload = () => {
        if (loadingMessage) {
            loadingMessage.style.display = 'none'; // Hide loading message
        }
        modalVideo.style.display = 'block'; // Show iframe
        console.log('Video iframe loaded successfully.');
    };

    modalVideo.onerror = () => {
        if (loadingMessage) {
            loadingMessage.textContent = 'Failed to load video. It might be unavailable or blocked.';
            loadingMessage.style.color = 'red';
        }
        modalVideo.style.display = 'none'; // Keep iframe hidden on error
        console.error('Video iframe failed to load or encountered an error.');
    };

    // Fallback for cases where onload/onerror might not fire reliably for cross-origin iframes
    const loadTimeout = setTimeout(() => {
        if (modalVideo.style.display === 'none' && loadingMessage && loadingMessage.textContent === 'Loading video...') {
            loadingMessage.textContent = 'Video might be unavailable or blocked by security policies.';
            loadingMessage.style.color = 'orange';
            console.warn('Video iframe load timed out or was blocked by security policies.');
        }
    }, 10000); // 10 seconds timeout

    // Clear timeout if loaded successfully (re-assign onload to ensure it clears the timeout)
    const originalOnLoad = modalVideo.onload;
    modalVideo.onload = () => {
        clearTimeout(loadTimeout);
        if (originalOnLoad) originalOnLoad(); // Call the original onload logic if it exists
    };
}

/**
 * Closes the details modal and clears the video source.
 */
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-video').src = ''; // Stop video playback
    // Remove the loading message if it exists
    const loadingMessage = document.getElementById('video-loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
    // Hide episode/season selectors on close
    document.getElementById('episode-select-container').style.display = 'none';
    document.getElementById('episode-title-container').style.display = 'none';
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
            img.onerror = () => { img.src = 'https://placehold.co/500x750/cccccc/000000?text=Image+Error'; }; // Placeholder for broken images
            img.onclick = () => {
                closeSearchModal(); // Close search modal
                handleMovieClick(item); // Show details
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

// --- TV Show Episode/Season Selection Functions ---

async function loadEpisodes(tvId) {
    const seasonSelect = document.getElementById('season-select');
    const episodeSelect = document.getElementById('episode-select');
    const currentEpisodeTitleSpan = document.getElementById('current-episode-title');

    seasonSelect.innerHTML = ''; // Clear previous options
    episodeSelect.innerHTML = ''; // Clear previous options
    currentEpisodeTitleSpan.textContent = 'Loading seasons...';

    try {
        // Fetch TV show details to get the number of seasons
        const tvDetailsRes = await fetch(`${BASE_URL}/tv/${tvId}?api_key=${API_KEY}`);
        const tvDetailsData = await tvDetailsRes.json();
        const seasons = tvDetailsData.seasons;

        if (!seasons || seasons.length === 0) {
            currentEpisodeTitleSpan.textContent = 'No season data available.';
            return;
        }

        // Populate season dropdown
        seasons.forEach(season => {
            if (season.season_number > 0) { // Exclude "Specials" season 0 if present
                const option = document.createElement('option');
                option.value = season.season_number;
                option.textContent = `Season ${season.season_number} (${season.episode_count || 0} episodes)`;
                seasonSelect.appendChild(option);
            }
        });

        // Set initial selected season (default to the first available season > 0)
        selectedSeason = seasons.find(s => s.season_number > 0)?.season_number || 1;
        seasonSelect.value = selectedSeason;

        // Fetch episodes for the initially selected season
        await fetchEpisodes(tvId, selectedSeason);

        // Event listener for season changes
        seasonSelect.onchange = async (event) => {
            selectedSeason = parseInt(event.target.value);
            await fetchEpisodes(tvId, selectedSeason);
        };

        // Event listener for episode changes
        episodeSelect.onchange = () => {
            selectedEpisode = parseInt(episodeSelect.value);
            updateEpisodeTitle();
        };

    } catch (error) {
        console.error('Error loading seasons:', error);
        currentEpisodeTitleSpan.textContent = 'Failed to load season data.';
    }
}

async function fetchEpisodes(tvId, seasonNumber) {
    const episodeSelect = document.getElementById('episode-select');
    const currentEpisodeTitleSpan = document.getElementById('current-episode-title');
    episodeSelect.innerHTML = ''; // Clear previous options
    episodesData = []; // Clear previous episode data
    currentEpisodeTitleSpan.textContent = `Loading episodes for Season ${seasonNumber}...`;

    try {
        const episodeRes = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
        const episodeData = await episodeRes.json();
        episodesData = episodeData.episodes; // Store the episode data

        if (!episodesData || episodesData.length === 0) {
            currentEpisodeTitleSpan.textContent = 'No episodes found for this season.';
            return;
        }

        episodesData.forEach(episode => {
            const option = document.createElement('option');
            option.value = episode.episode_number;
            option.textContent = `E${episode.episode_number}: ${episode.name || 'Untitled'}`;
            episodeSelect.appendChild(option);
        });

        // Set initial selected episode (default to the first episode)
        selectedEpisode = episodesData[0]?.episode_number || 1;
        episodeSelect.value = selectedEpisode;
        updateEpisodeTitle();

    } catch (error) {
        console.error(`Error fetching episodes for season ${seasonNumber}:`, error);
        currentEpisodeTitleSpan.textContent = 'Failed to load episode data.';
    }
}

function playSelectedEpisode() {
    // This function is triggered by the "Play Episode" button
    // It should load the video with the currently selected season and episode
    selectedSeason = parseInt(document.getElementById('season-select').value);
    selectedEpisode = parseInt(document.getElementById('episode-select').value);
    changeServer(); // This function now handles loading the video with episode params
    updateEpisodeTitle();
}

function updateEpisodeTitle() {
    const episodeTitleElement = document.getElementById('current-episode-title');
    const selectedEpisodeValue = parseInt(document.getElementById('episode-select').value);

    if (episodesData && episodesData.length > 0) {
        const foundEpisode = episodesData.find(ep => ep.episode_number === selectedEpisodeValue);
        if (foundEpisode) {
            episodeTitleElement.textContent = foundEpisode.name || 'Untitled Episode';
        } else {
            episodeTitleElement.textContent = "Episode Title Not Found";
        }
    } else {
        episodeTitleElement.textContent = "Select an Episode";
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
