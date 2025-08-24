// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type');
const id = urlParams.get('id');
const page = parseInt(urlParams.get('page')) || 1;

// DOM Elements
const categoryTitle = document.getElementById('category-title');
const moviesContainer = document.getElementById('movies-container');
const seeMoreBtn = document.getElementById('see-more-btn');

// Load appropriate movies based on type
document.addEventListener('DOMContentLoaded', () => {
    if (type === 'new-releases') {
        categoryTitle.textContent = 'New Releases';
        loadNewReleases(page);
    } else if (type === 'genre') {
        categoryTitle.textContent = 'Genre Movies';
        loadGenreMovies(id, page);
    } else if (type === 'top-rated') {
        categoryTitle.textContent = 'Top Rated Movies';
        loadTopRated(page);
    }
});

// See More button handler
seeMoreBtn.addEventListener('click', () => {
    const nextPage = page + 1;
    window.location.href = `category.html?type=${type}&id=${id || ''}&page=${nextPage}`;
});

// Movie loading functions
async function loadNewReleases(page) {
    const currentDate = new Date().toISOString().split('T')[0];
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoDate = oneMonthAgo.toISOString().split('T')[0];
    
    const data = await fetchFromAPI('discover/movie', {
        'primary_release_date.gte': oneMonthAgoDate,
        'primary_release_date.lte': currentDate,
        sort_by: 'popularity.desc',
        page: page
    });
    
    if (data) displayMovies(data.results, moviesContainer);
}

async function loadGenreMovies(genreId, page) {
    const data = await fetchFromAPI('discover/movie', {
        with_genres: genreId,
        page: page
    });
    
    if (data) displayMovies(data.results, moviesContainer);
}

async function loadTopRated(page) {
    const data = await fetchFromAPI('movie/top_rated', {
        page: page
    });
    
    if (data) displayMovies(data.results, moviesContainer);
}

// Reused functions from main.js
async function fetchFromAPI(endpoint, queryParams = {}) {
    const API_KEY = '9232542dac86882f04df7d38ef0ccde0'; // Replace with your actual key
    const BASE_URL = 'https://api.themoviedb.org/3';
    
    try {
        const params = new URLSearchParams({
            api_key: API_KEY,
            ...queryParams
        });
        const response = await fetch(`${BASE_URL}/${endpoint}?${params}`);
        
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

function displayMovies(movies, container) {
    if (!movies || movies.length === 0) {
        container.innerHTML = '<div class="col-12 text-center">No movies found</div>';
        return;
    }
    
    const IMG_URL = 'https://image.tmdb.org/t/p/w500';
    container.innerHTML = movies.map(movie => `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="card movie-card h-100" data-movie-id="${movie.id}">
                <div class="position-relative">
                    <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'placeholder.jpg'}" 
                         class="card-img-top movie-poster" 
                         alt="${movie.title}"
                         loading="lazy">
                    <span class="badge rating-badge text-white">
                        ★ ${movie.vote_average.toFixed(1)}
                    </span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${movie.title}</h5>
                    <p class="card-text text-muted">
                        ${movie.release_date ? movie.release_date.substring(0, 4) : 'Year unknown'}
                    </p>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add click event listeners to movie cards - THIS WAS MISSING!
    addMovieClickHandlers(container);
}

// Add click handlers to movie cards - NEW FUNCTION ADDED
function addMovieClickHandlers(container) {
    container.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Prevent navigation if clicking on a link
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