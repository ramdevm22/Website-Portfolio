// Get movie ID from URL
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');

// Fetch Movie Details
async function fetchMovieDetails() {
    if (!movieId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits,videos`);
        const movie = await response.json();
        displayMovieDetails(movie);
    } catch (error) {
        console.error('Error fetching movie details:', error);
    }
}

// Display Movie Details
function displayMovieDetails(movie) {
    const movieDetailsEl = document.getElementById('movie-details');
    
    // Format genres
    const genres = movie.genres.map(genre => genre.name).join(', ');
    
    // Format directors
    const directors = movie.credits.crew.filter(person => person.job === 'Director')
                       .map(director => director.name).join(', ');
    
    // Format main cast
    const mainCast = movie.credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
    
    // Find trailer
    const trailer = movie.videos.results.find(video => video.type === 'Trailer');
    
    movieDetailsEl.innerHTML = `
        <div class="col-md-4">
            <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/300x450'}" 
                 class="img-fluid rounded" alt="${movie.title}">
        </div>
        <div class="col-md-8">
            <h1>${movie.title} <small class="text-muted">(${movie.release_date.substring(0, 4)})</small></h1>
            <div class="mb-3">
                <span class="badge bg-primary me-1">${movie.vote_average.toFixed(1)} ★</span>
                <span class="text-muted me-3">${movie.runtime} min</span>
                <span>${genres}</span>
            </div>
            
            <h3>Overview</h3>
            <p>${movie.overview}</p>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h4>Director</h4>
                    <p>${directors || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <h4>Cast</h4>
                    <p>${mainCast}</p>
                </div>
            </div>
            
            ${trailer ? `
            <div class="mt-4">
                <h4>Trailer</h4>
                <div class="ratio ratio-16x9">
                    <iframe src="https://www.youtube.com/embed/${trailer.key}" 
                            allowfullscreen></iframe>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// Initialize movie details page
document.addEventListener('DOMContentLoaded', fetchMovieDetails);