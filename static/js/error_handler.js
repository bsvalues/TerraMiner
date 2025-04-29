/**
 * TerraMiner Error Handling Utilities
 * Standardized error handling for API calls and UI components
 */

/**
 * Error types with standardized messages and handling logic
 */
const ErrorTypes = {
    // API Errors
    API_UNAVAILABLE: {
        title: "API Unavailable",
        message: "The API service is currently unavailable. Please try again later.",
        icon: "exclamation-triangle",
        retry: true
    },
    NETWORK_ERROR: {
        title: "Network Error",
        message: "There was a problem connecting to the server. Please check your internet connection.",
        icon: "wifi-off",
        retry: true
    },
    AUTHENTICATION_ERROR: {
        title: "Authentication Error",
        message: "Your session has expired or you do not have permission to access this resource.",
        icon: "shield-lock",
        action_text: "Login Again",
        action_url: "/login"
    },
    SERVER_ERROR: {
        title: "Server Error",
        message: "The server encountered an error while processing your request.",
        icon: "server",
        retry: true
    },
    
    // Data Errors
    DATA_NOT_FOUND: {
        title: "Data Not Found",
        message: "The requested data could not be found.",
        icon: "file-earmark-x",
        retry: false
    },
    INVALID_DATA: {
        title: "Invalid Data",
        message: "The data format is invalid or corrupted.",
        icon: "file-earmark-x",
        retry: false
    },
    
    // External API Errors
    ZILLOW_API_ERROR: {
        title: "Zillow API Error",
        message: "There was an error retrieving data from the Zillow API.",
        icon: "building",
        retry: true
    },
    NARRPR_API_ERROR: {
        title: "NARRPR API Error",
        message: "There was an error retrieving data from the NARRPR API.",
        icon: "building",
        retry: true
    },
    
    // Generic Error
    UNKNOWN_ERROR: {
        title: "Unknown Error",
        message: "An unexpected error occurred. Please try again later.",
        icon: "question-circle",
        retry: true
    }
};

/**
 * Show an error message in the specified container
 * @param {string} containerId - The ID of the container to show the error
 * @param {Object} error - The error object or error type
 * @param {Function} retryFunction - Optional function to call when retry button is clicked
 */
function showErrorMessage(containerId, error, retryFunction = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Determine error type
    let errorConfig;
    
    if (typeof error === 'string' && ErrorTypes[error]) {
        // If error is a key in ErrorTypes
        errorConfig = ErrorTypes[error];
    } else if (error.name && ErrorTypes[error.name]) {
        // If error has a name property that's a key in ErrorTypes
        errorConfig = ErrorTypes[error.name];
    } else {
        // Default to unknown error
        errorConfig = ErrorTypes.UNKNOWN_ERROR;
    }
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-container text-center py-4';
    
    // Build error message HTML
    let errorHtml = `
        <div class="error-icon mb-3">
            <i class="bi bi-${errorConfig.icon} text-danger" style="font-size: 3rem;"></i>
        </div>
        <h4 class="error-title mb-2">${errorConfig.title}</h4>
        <p class="error-message text-muted mb-3">${errorConfig.message}</p>
    `;
    
    // Add error details if available
    if (error.message && error.message !== errorConfig.message) {
        errorHtml += `
            <div class="error-details mb-4">
                <div class="d-grid gap-2 col-md-6 mx-auto">
                    <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#${containerId}-error-details" aria-expanded="false">
                        Show Technical Details
                    </button>
                </div>
                <div class="collapse mt-2" id="${containerId}-error-details">
                    <div class="card card-body text-start bg-dark">
                        <pre class="mb-0 text-danger"><code>${error.message}</code></pre>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Add action button if configured
    if (errorConfig.action_text && errorConfig.action_url) {
        errorHtml += `<a href="${errorConfig.action_url}" class="btn btn-primary">${errorConfig.action_text}</a>`;
    } else if (errorConfig.retry && retryFunction) {
        errorHtml += `<button type="button" class="btn btn-primary retry-button">Retry</button>`;
    }
    
    // Set the HTML and show the error container
    errorElement.innerHTML = errorHtml;
    
    // Clear the container and add the error message
    container.innerHTML = '';
    container.appendChild(errorElement);
    
    // Add event listener to retry button if present
    const retryButton = errorElement.querySelector('.retry-button');
    if (retryButton && retryFunction) {
        retryButton.addEventListener('click', retryFunction);
    }
}

/**
 * API error handling middleware for fetch requests
 * @param {Response} response - The fetch response object
 * @returns {Promise} - Returns the response if ok, otherwise throws an error
 */
function handleApiResponse(response) {
    if (!response.ok) {
        // Create an error object with the appropriate type
        const error = new Error(`HTTP error ${response.status}: ${response.statusText}`);
        
        // Set error name based on status code
        if (response.status === 401 || response.status === 403) {
            error.name = 'AUTHENTICATION_ERROR';
        } else if (response.status === 404) {
            error.name = 'DATA_NOT_FOUND';
        } else if (response.status >= 500) {
            error.name = 'SERVER_ERROR';
        } else {
            error.name = 'UNKNOWN_ERROR';
        }
        
        throw error;
    }
    
    return response;
}

/**
 * Enhanced fetch function with standardized error handling
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {string} errorContainerId - Optional ID of container to show errors in
 * @param {Function} retryFunction - Optional function to call when retry is clicked
 * @returns {Promise} - The fetch promise
 */
function fetchWithErrorHandling(url, options = {}, errorContainerId = null, retryFunction = null) {
    // Show loading state if a container ID is provided
    if (errorContainerId) {
        const container = document.getElementById(errorContainerId);
        if (container) {
            // You might want to add a loading indicator here
            container.innerHTML = '<div class="loading-container"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        }
    }
    
    return fetch(url, options)
        .then(handleApiResponse)
        .then(response => response.json())
        .catch(error => {
            console.error('API Error:', error);
            
            // Determine the type of error
            if (!navigator.onLine) {
                error.name = 'NETWORK_ERROR';
            } else if (error.message && error.message.includes('Zillow')) {
                error.name = 'ZILLOW_API_ERROR';
            } else if (error.message && error.message.includes('NARRPR')) {
                error.name = 'NARRPR_API_ERROR';
            }
            
            // Show error message if a container ID is provided
            if (errorContainerId) {
                showErrorMessage(errorContainerId, error, retryFunction);
            }
            
            throw error;
        });
}

/**
 * Global error handler for uncaught exceptions
 */
window.addEventListener('error', function(event) {
    console.error('Uncaught error:', event.error);
    
    // You could log this to your server or show a notification
    const errorToast = document.createElement('div');
    errorToast.className = 'toast align-items-center text-white bg-danger border-0 position-fixed bottom-0 end-0 m-3';
    errorToast.setAttribute('role', 'alert');
    errorToast.setAttribute('aria-live', 'assertive');
    errorToast.setAttribute('aria-atomic', 'true');
    
    errorToast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                An unexpected error occurred. Please reload the page.
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    document.body.appendChild(errorToast);
    
    // Initialize and show the toast
    const toast = new bootstrap.Toast(errorToast);
    toast.show();
});

// Export the error handling utilities
window.ErrorHandler = {
    ErrorTypes,
    showErrorMessage,
    handleApiResponse,
    fetchWithErrorHandling
};