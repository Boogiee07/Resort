// ratings.js - Unified Rating System for Pansol Resorts
// Include this file in both index2.html and resort-details.html

/**
 * Initialize Firebase Firestore for ratings
 * Call this after Firebase is initialized
 */
function initializeRatingSystem() {
    console.log('Rating system initialized');
}

/**
 * Fetch ratings for a single resort
 * @param {string} resortId - The resort ID
 * @returns {Promise<Object>} Rating data {average, count, reviews}
 */
async function fetchResortRating(resortId) {
    try {
        const snapshot = await firebase.firestore()
            .collection('feedback')
            .where('resortId', '==', resortId)
            .get();
        
        const reviews = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.rating && typeof data.rating === 'number') {
                reviews.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        if (reviews.length === 0) {
            return { average: 0, count: 0, reviews: [] };
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const average = totalRating / reviews.length;

        return {
            average: parseFloat(average.toFixed(1)),
            count: reviews.length,
            reviews: reviews
        };
    } catch (error) {
        console.error(`Error fetching rating for resort ${resortId}:`, error);
        return { average: 0, count: 0, reviews: [] };
    }
}

/**
 * Fetch ratings for multiple resorts
 * @param {Array<string>} resortIds - Array of resort IDs
 * @returns {Promise<Object>} Map of resortId to rating data
 */
async function fetchAllResortRatings(resortIds) {
    try {
        const ratingsMap = {};
        
        // Fetch all feedback at once
        const snapshot = await firebase.firestore()
            .collection('feedback')
            .get();
        
        // Initialize all resorts with 0 ratings
        resortIds.forEach(id => {
            ratingsMap[id] = { average: 0, count: 0, reviews: [] };
        });
        
        // Group feedback by resort
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.rating && typeof data.rating === 'number' && data.resortId) {
                if (!ratingsMap[data.resortId]) {
                    ratingsMap[data.resortId] = { average: 0, count: 0, reviews: [] };
                }
                ratingsMap[data.resortId].reviews.push({
                    id: doc.id,
                    ...data
                });
            }
        });
        
        // Calculate averages
        Object.keys(ratingsMap).forEach(resortId => {
            const reviews = ratingsMap[resortId].reviews;
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
                ratingsMap[resortId].average = parseFloat((totalRating / reviews.length).toFixed(1));
                ratingsMap[resortId].count = reviews.length;
            }
        });
        
        return ratingsMap;
    } catch (error) {
        console.error('Error fetching all ratings:', error);
        return {};
    }
}

/**
 * Generate star rating HTML
 * @param {number} rating - Rating value (0-5)
 * @param {string} size - Size class ('sm', 'md', 'lg')
 * @returns {string} HTML string for stars
 */
function generateStarRatingHTML(rating, size = 'sm') {
    const sizeClasses = {
        'sm': 'text-xs',
        'md': 'text-sm',
        'lg': 'text-lg'
    };
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = `<div class="star-rating inline-flex items-center gap-0.5 ${sizeClasses[size]}">`;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<span class="star filled text-yellow-400">★</span>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<span class="star filled text-yellow-400">★</span>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<span class="star empty text-gray-300">★</span>';
    }
    
    if (rating > 0) {
        starsHTML += `<span class="ml-1 font-semibold text-gray-700">${rating.toFixed(1)}</span>`;
    }
    
    starsHTML += '</div>';
    return starsHTML;
}

/**
 * Generate rating badge HTML for resort cards
 * @param {number} rating - Rating value (0-5)
 * @param {number} count - Number of reviews
 * @returns {string} HTML string for rating badge
 */
function generateRatingBadgeHTML(rating, count) {
    if (count === 0) {
        return `<div class="text-xs text-gray-500">No reviews yet</div>`;
    }
    
    return `
        <div class="rating-badge inline-flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-yellow-100 px-2 py-1 rounded-lg border border-yellow-200">
            <span class="text-yellow-500 font-bold">★</span>
            <span class="font-bold text-yellow-800">${rating.toFixed(1)}</span>
            <span class="text-xs text-yellow-700">(${count})</span>
        </div>
    `;
}

/**
 * Generate detailed rating display for resort details page
 * @param {number} rating - Rating value (0-5)
 * @param {number} count - Number of reviews
 * @param {string} resortId - Resort ID for linking to reviews
 * @returns {Object} HTML strings for stars and text
 */
function generateDetailedRatingHTML(rating, count, resortId) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);
    
    let starsHTML = '';
    
    if (count === 0) {
        starsHTML = '<span class="text-sm text-gray-500">No ratings yet</span>';
    } else {
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<span class="star filled text-yellow-400 text-xl md:text-2xl">★</span>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHTML += '<span class="star filled text-yellow-400 text-xl md:text-2xl">★</span>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<span class="star empty text-gray-300 text-xl md:text-2xl">★</span>';
        }
    }
    
    const ratingText = count === 0 
        ? 'Be the first to rate!' 
        : `${rating.toFixed(1)} out of 5 (<a href="reviews.html?id=${resortId}" class="text-blue-600 hover:text-blue-800 font-semibold underline transition-colors">${count} ${count === 1 ? 'review' : 'reviews'}</a>)`;
    
    return {
        stars: starsHTML,
        text: ratingText
    };
}

/**
 * Update resort card with rating
 * @param {string} resortId - Resort ID
 * @param {Object} ratingData - Rating data {average, count}
 */
function updateResortCardRating(resortId, ratingData) {
    const cardElement = document.querySelector(`[data-resort-id="${resortId}"]`);
    if (!cardElement) return;
    
    const ratingContainer = cardElement.querySelector('.resort-rating');
    if (ratingContainer) {
        ratingContainer.innerHTML = generateRatingBadgeHTML(ratingData.average, ratingData.count);
    }
}

/**
 * Save rating to Firestore
 * @param {Object} feedbackData - Feedback data to save
 * @returns {Promise<string>} Document ID
 */
async function saveRating(feedbackData) {
    try {
        const docRef = await firebase.firestore()
            .collection('feedback')
            .add({
                ...feedbackData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            });
        
        console.log('Rating saved with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving rating:', error);
        throw error;
    }
}

/**
 * Get rating statistics for a resort
 * @param {Array<Object>} reviews - Array of review objects
 * @returns {Object} Statistics {5star, 4star, 3star, 2star, 1star, percentages}
 */
function getRatingStatistics(reviews) {
    const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviews.forEach(review => {
        const rating = Math.floor(review.rating);
        if (rating >= 1 && rating <= 5) {
            stats[rating]++;
        }
    });
    
    const total = reviews.length || 1;
    const percentages = {};
    
    for (let i = 1; i <= 5; i++) {
        percentages[i] = ((stats[i] / total) * 100).toFixed(0);
    }
    
    return {
        counts: stats,
        percentages: percentages,
        total: reviews.length
    };
}

// Export functions for global use
window.RatingSystem = {
    initialize: initializeRatingSystem,
    fetchResortRating: fetchResortRating,
    fetchAllResortRatings: fetchAllResortRatings,
    generateStarRatingHTML: generateStarRatingHTML,
    generateRatingBadgeHTML: generateRatingBadgeHTML,
    generateDetailedRatingHTML: generateDetailedRatingHTML,
    updateResortCardRating: updateResortCardRating,
    saveRating: saveRating,
    getRatingStatistics: getRatingStatistics
};

console.log('Rating System loaded successfully');
