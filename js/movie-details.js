// Configuration
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '9232542dac86882f04df7d38ef0ccde0'; // Fallback for testing
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// DOM Elements
const movieDetailsEl = document.getElementById('movie-details');
const loadingSpinnerEl = document.getElementById('loading-spinner');
const errorMessageEl = document.getElementById('error-message');

// Get movie ID from localStorage
const movieId = localStorage.getItem('selectedMovieId');

// Helper functions
const formatCurrency = (amount) => amount ? '$' + amount.toLocaleString() : 'N/A';

const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

// Main function to fetch and display movie details
async function displayMovieDetails() {
    if (!movieId) {
        showError('No movie selected. Please go back and select a movie.');
        return;
    }

    try {
        showLoading();
        
        // Fetch movie details with credits
        const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const movie = await response.json();
        renderMovieDetails(movie);
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Failed to load movie details: ${error.message}`);
    }
}

function showLoading() {
    loadingSpinnerEl.classList.remove('d-none');
    movieDetailsEl.classList.add('d-none');
    errorMessageEl.classList.add('d-none');
}

function showError(message) {
    loadingSpinnerEl.classList.add('d-none');
    errorMessageEl.textContent = message;
    errorMessageEl.classList.remove('d-none');
}

function renderMovieDetails(movie) {
    // Basic Info
    document.getElementById('movie-poster').src = 
        movie.poster_path ? `${IMG_URL}${movie.poster_path}` : '/placeholder-movie.jpg';
    document.getElementById('movie-title').textContent = movie.title;
    document.getElementById('movie-rating').textContent = `★ ${movie.vote_average?.toFixed(1) || 'N/A'}`;
    document.getElementById('movie-year').textContent = 
        movie.release_date ? movie.release_date.substring(0, 4) : 'N/A';
    document.getElementById('movie-runtime').textContent = formatRuntime(movie.runtime);
    document.getElementById('movie-overview').textContent = movie.overview || 'No overview available.';

    // Additional Details
    document.getElementById('movie-release-date').textContent = movie.release_date || 'N/A';
    document.getElementById('movie-status').textContent = movie.status || 'N/A';
    document.getElementById('movie-language').textContent = 
        movie.original_language ? movie.original_language.toUpperCase() : 'N/A';
    document.getElementById('movie-budget').textContent = formatCurrency(movie.budget);
    document.getElementById('movie-revenue').textContent = formatCurrency(movie.revenue);

    // Genres
    const genresEl = document.getElementById('movie-genres');
    genresEl.innerHTML = movie.genres?.length > 0 
        ? movie.genres.map(genre => genre.name).join(', ')
        : 'N/A';

    // Top 5 Cast Members
    const castEl = document.getElementById('movie-cast');
    if (movie.credits?.cast?.length > 0) {
        castEl.innerHTML = movie.credits.cast.slice(0, 5).map(actor => `
            <div class="col-12 mb-2">
                <strong>${actor.name}</strong> as ${actor.character || 'N/A'}
            </div>
        `).join('');
    } else {
        castEl.innerHTML = '<div class="col-12">No cast information available</div>';
    }

    // Show the content
    loadingSpinnerEl.classList.add('d-none');
    movieDetailsEl.classList.remove('d-none');
}

// Initialize
document.addEventListener('DOMContentLoaded', displayMovieDetails);