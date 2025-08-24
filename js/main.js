// Configuration - Load from environment variables
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '9232542dac86882f04df7d38ef0ccde0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// DOM Elements
const featuredMoviesEl = document.getElementById('featured-movies');
const topRatedMoviesEl = document.getElementById('top-rated-movies');
const bollywoodMoviesContainer = document.getElementById('bollywood-movies-container');
const bollywoodTabsEl = document.getElementById('bollywood-tabs');
const genreMoviesContainer = document.getElementById('genre-movies-container');
const genreTabsEl = document.getElementById('genre-tabs');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

// Global variables
let currentGenre = null;
let currentGenrePage = 1;
let newReleasesPage = 1;
let topRatedPage = 1;
let currentBollywoodType = 'new';
let currentBollywoodPage = 1;

// Generic API Fetch Function with Error Handling
async function fetchFromAPI(endpoint, queryParams = {}) {
    try {
        // Construct URL
        const params = new URLSearchParams({
            api_key: API_KEY,
            ...queryParams
        });
        const url = `${BASE_URL}/${endpoint}?${params}`;
        
        const response = await fetch(url);
        
        // Check for HTTP errors
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for API errors
        if (data.success === false) {
            throw new Error(data.status_message || 'Unknown API error');
        }
        
        return data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        showError(error.message);
        return null;
    }
}

// Display Error Message
function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'alert alert-danger error-message';
    errorEl.textContent = `Error: ${message}`;
    document.querySelector('main').prepend(errorEl);
    
    // Remove error after 5 seconds
    setTimeout(() => errorEl.remove(), 5000);
}

// Display Movies
function displayMovies(movies, container, append = false) {
    if (!movies || movies.length === 0) {
        if (!append) {
            container.innerHTML = '<div class="col-12 text-center">No movies found</div>';
        }
        return;
    }

    const placeholderUrl = '/placeholder-movie.jpg';
    
    const moviesHTML = movies.map(movie => {
        const posterUrl = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : placeholderUrl;
        const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'Year unknown';
        
        return `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="card movie-card h-100" data-movie-id="${movie.id}">
                <div class="position-relative">
                    <img src="${posterUrl}" 
                         class="card-img-top movie-poster" 
                         alt="${movie.title}"
                         loading="lazy"
                         onerror="this.src='${placeholderUrl}'">
                    <span class="badge rating-badge text-white">
                        ★ ${movie.vote_average.toFixed(1)}
                    </span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${movie.title}</h5>
                    <p class="card-text text-muted">${releaseYear}</p>
                </div>
            </div>
        </div>`;
    }).join('');
    
    if (append) {
        container.innerHTML += moviesHTML;
    } else {
        container.innerHTML = moviesHTML;
    }
    
    // Add click event to movie cards
    addMovieClickHandlers(container);
}

// Add click handlers to movie cards
function addMovieClickHandlers(container) {
    container.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') return;
            
            const movieId = card.dataset.movieId;
            if (movieId) {
                // Store movie ID in localStorage before navigating
                localStorage.setItem('selectedMovieId', movieId);
                window.location.href = 'movie-details.html';
            }
        });
    });
}

// Display Genre Movies
function displayGenreMovies(movies, hasMore) {
    if (!movies || movies.length === 0) {
        genreMoviesContainer.innerHTML = '<div class="col-12 text-center">No movies found in this genre</div>';
        return;
    }

    const placeholderUrl = '/placeholder-movie.jpg';
    
    // Clear existing content
    genreMoviesContainer.innerHTML = '';
    
    // Show movies
    movies.forEach(movie => {
        const posterUrl = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : placeholderUrl;
        const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
        
        genreMoviesContainer.innerHTML += `
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="card movie-card h-100" data-movie-id="${movie.id}">
                <img src="${posterUrl}" 
                     class="card-img-top movie-poster" 
                     alt="${movie.title}"
                     onerror="this.src='${placeholderUrl}'">
                <div class="card-body">
                    <h5 class="card-title">${movie.title}</h5>
                    <p class="card-text">
                        <span class="badge bg-primary">★ ${movie.vote_average.toFixed(1)}</span>
                        <small class="text-muted">${releaseYear}</small>
                    </p>
                </div>
            </div>
        </div>`;
    });
    
    // Add "See More" button if there are more pages
    if (hasMore) {
        const seeMoreContainer = document.createElement('div');
        seeMoreContainer.className = 'col-12 text-center mt-4';
        seeMoreContainer.innerHTML = `
            <a href="category.html?type=genre&id=${currentGenre}&page=${currentGenrePage + 1}" 
               class="btn btn-primary see-more-btn">
                See More
            </a>
        `;
        genreMoviesContainer.appendChild(seeMoreContainer);
    }
    
    // Add click event to movie cards
    addMovieClickHandlers(genreMoviesContainer);
}

// Fetch and Display New Release Movies
async function fetchNewReleases(loadMore = false) {
    if (!loadMore) {
        newReleasesPage = 1; // Reset to first page if not loading more
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoDate = oneMonthAgo.toISOString().split('T')[0];
    
    const data = await fetchFromAPI('discover/movie', {
        'primary_release_date.gte': oneMonthAgoDate,
        'primary_release_date.lte': currentDate,
        sort_by: 'popularity.desc',
        include_image_language: 'en,null',
        page: newReleasesPage
    });
    
    if (data) {
        const moviesWithPosters = data.results.filter(movie => movie.poster_path);
        
        if (loadMore) {
            // Append new movies to existing ones
            displayMovies(moviesWithPosters, featuredMoviesEl, true);
        } else {
            // Show initial set of movies
            displayMovies(moviesWithPosters.slice(0, 12), featuredMoviesEl);
        }
        
        // Add "See More" button if there are more pages
        if (data.total_pages > newReleasesPage) {
            addSeeMoreButton();
        }
    }
}

// Fetch and Display Top Rated Movies
async function fetchTopRatedMovies(loadMore = false) {
    if (!loadMore) {
        topRatedPage = 1; // Reset to first page if not loading more
    }
    
    const data = await fetchFromAPI('movie/top_rated', {
        page: topRatedPage
    });
    
    if (data) {
        if (loadMore) {
            // Append new movies to existing ones
            displayMovies(data.results, topRatedMoviesEl, true);
        } else {
            // Show initial set of movies
            displayMovies(data.results.slice(0, 12), topRatedMoviesEl);
        }
        
        // Add "See More" button if there are more pages
        if (data.total_pages > topRatedPage) {
            addTopRatedSeeMoreButton();
        }
    }
}

// Bollywood Movies Functions
async function fetchBollywoodMovies(type = 'new', page = 1) {
    bollywoodMoviesContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"></div></div>';
    
    let endpoint, queryParams;
    
    switch (type) {
        case 'new':
            const currentDate = new Date().toISOString().split('T')[0];
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const threeMonthsAgoDate = threeMonthsAgo.toISOString().split('T')[0];
            
            endpoint = 'discover/movie';
            queryParams = {
                'primary_release_date.gte': threeMonthsAgoDate,
                'primary_release_date.lte': currentDate,
                with_original_language: 'hi',
                sort_by: 'popularity.desc',
                page: page
            };
            break;
            
        case 'popular':
            endpoint = 'discover/movie';
            queryParams = {
                with_original_language: 'hi',
                sort_by: 'popularity.desc',
                page: page
            };
            break;
            
        case 'top':
            endpoint = 'discover/movie';
            queryParams = {
                with_original_language: 'hi',
                sort_by: 'vote_average.desc',
                'vote_count.gte': 100,
                page: page
            };
            break;
    }
    
    const data = await fetchFromAPI(endpoint, queryParams);
    
    if (data && data.results) {
        displayBollywoodMovies(data.results, data.total_pages > page, type);
    }
}

function displayBollywoodMovies(movies, hasMore, type) {
    if (!movies || movies.length === 0) {
        bollywoodMoviesContainer.innerHTML = '<div class="col-12 text-center">No Bollywood movies found</div>';
        return;
    }

    const placeholderUrl = '/placeholder-movie.jpg';
    
    bollywoodMoviesContainer.innerHTML = movies.map(movie => {
        const posterUrl = movie.poster_path ? `${IMG_URL}${movie.poster_path}` : placeholderUrl;
        const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
        
        return `
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="card movie-card h-100" data-movie-id="${movie.id}">
                <img src="${posterUrl}" 
                     class="card-img-top movie-poster" 
                     alt="${movie.title}"
                     onerror="this.src='${placeholderUrl}'">
                <div class="card-body">
                    <h5 class="card-title">${movie.title}</h5>
                    <p class="card-text">
                        <span class="badge bg-primary">★ ${movie.vote_average.toFixed(1)}</span>
                        <small class="text-muted">${releaseYear}</small>
                    </p>
                </div>
            </div>
        </div>`;
    }).join('');
    
    // Add "See More" button if there are more pages
    if (hasMore) {
        const seeMoreContainer = document.createElement('div');
        seeMoreContainer.className = 'col-12 text-center mt-4';
        seeMoreContainer.innerHTML = `
            <a href="category.html?type=bollywood&subtype=${type}&page=2" 
               class="btn btn-primary see-more-btn">
                See More
            </a>
        `;
        bollywoodMoviesContainer.appendChild(seeMoreContainer);
    }
    
    // Add click event to movie cards
    addMovieClickHandlers(bollywoodMoviesContainer);
}

// Bollywood tab handlers
function initializeBollywoodTabs() {
    bollywoodTabsEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-link')) {
            // Remove active class from all tabs
            bollywoodTabsEl.querySelectorAll('.nav-link').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Add active class to clicked tab
            e.target.classList.add('active');
            
            // Get the type and fetch movies
            const type = e.target.dataset.type;
            currentBollywoodType = type;
            currentBollywoodPage = 1;
            fetchBollywoodMovies(type, 1);
        }
    });
}

// Fetch and display genres
async function fetchGenres() {
    const data = await fetchFromAPI('genre/movie/list');
    if (data && data.genres) {
        displayGenreTabs(data.genres);
        // Load first genre by default
        if (data.genres.length > 0) {
            currentGenre = data.genres[0].id;
            fetchMoviesByGenre(currentGenre);
        }
    }
}

// Display genre tabs
function displayGenreTabs(genres) {
    genreTabsEl.innerHTML = `
        <div class="genre-tabs">
            ${genres.map(genre => `
                <div class="genre-tab ${genre.id === currentGenre ? 'active' : ''}" 
                     data-genre-id="${genre.id}">
                    ${genre.name}
                </div>
            `).join('')}
        </div>
    `;

    // Add click event to genre tabs
    document.querySelectorAll('.genre-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentGenre = parseInt(tab.dataset.genreId);
            currentGenrePage = 1;
            document.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            fetchMoviesByGenre(currentGenre);
        });
    });
}

// Fetch movies by genre
async function fetchMoviesByGenre(genreId, page = 1) {
    genreMoviesContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"></div></div>';
    
    const data = await fetchFromAPI('discover/movie', {
        with_genres: genreId,
        page: page
    });
    
    if (data && data.results) {
        const hasMorePages = data.total_pages > page;
        displayGenreMovies(data.results, hasMorePages);
    }
}

// Handle Search
async function handleSearch(event) {
    if (event) event.preventDefault();
    
    const query = searchInput.value.trim();
    
    if (!query) {
        showError('Please enter a search term');
        return;
    }
    
    try {
        // Show loading state
        featuredMoviesEl.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"></div></div>';
        
        const data = await fetchFromAPI('search/movie', { query });
        
        if (data) {
            featuredMoviesEl.innerHTML = '<h3 class="mb-4">Search Results</h3>';
            displayMovies(data.results, featuredMoviesEl);
        }
    } catch (error) {
        showError('Failed to perform search. Please try again.');
    }
}

// Add at the top of your file
let searchTimeout;

// Then modify the keyup event listener
searchInput.addEventListener('keyup', (event) => {
    clearTimeout(searchTimeout);
    
    if (event.key === 'Enter') {
        handleSearch(event);
    } else {
        // Optional: Add live search as user types (with debounce)
        searchTimeout = setTimeout(() => {
            if (searchInput.value.trim().length >= 3) {
                handleSearch();
            }
        }, 500);
    }
});

// For new releases:
function addSeeMoreButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'col-12 text-center mt-4';
    buttonContainer.innerHTML = `
        <a href="category.html?type=new-releases&page=1" class="btn btn-primary">
            See More New Releases
        </a>
    `;
    featuredMoviesEl.parentNode.appendChild(buttonContainer);
}

// For top rated:
function addTopRatedSeeMoreButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'col-12 text-center mt-4';
    buttonContainer.innerHTML = `
        <a href="category.html?type=top-rated&page=1" class="btn btn-primary">
            See More Top Rated
        </a>
    `;
    topRatedMoviesEl.parentNode.appendChild(buttonContainer);
}

// Event Listeners
searchForm.addEventListener('submit', handleSearch);

// Initialize the page
async function init() {
    try {
        await Promise.all([
            fetchNewReleases(false),
            fetchTopRatedMovies(false),
            fetchGenres(),
            fetchBollywoodMovies('new', 1) // Load Bollywood movies by default
        ]);
        
        // Initialize Bollywood tabs
        initializeBollywoodTabs();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize page. Please try again.');
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', init);