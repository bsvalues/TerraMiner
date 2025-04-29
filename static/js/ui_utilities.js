/**
 * TerraMiner UI Utilities
 * Standardized functions for UI components, data loading, and visualizations
 */

// ===== Loading State Management =====

/**
 * Show loading state for a container
 * @param {string} containerId - The ID of the container to show loading state
 */
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Hide container content
    container.style.display = 'none';
    
    // Show loading spinner
    const loadingId = containerId + '-loading';
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
        loadingEl.style.display = 'flex';
    }
    
    // Hide any error messages
    const errorId = containerId + '-error';
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.classList.add('d-none');
    }
}

/**
 * Hide loading state and show content
 * @param {string} containerId - The ID of the container to hide loading state
 */
function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Show container content
    container.style.display = 'block';
    
    // Hide loading spinner
    const loadingId = containerId + '-loading';
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

/**
 * Show error state for a container
 * @param {string} containerId - The ID of the container to show error state
 * @param {string} errorMessage - Optional custom error message
 */
function showError(containerId, errorMessage = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Hide container content
    container.style.display = 'none';
    
    // Hide loading spinner
    const loadingId = containerId + '-loading';
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    // Show error message
    const errorId = containerId + '-error';
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        if (errorMessage) {
            errorEl.textContent = errorMessage;
        }
        errorEl.classList.remove('d-none');
    }
}

// ===== Chart Utilities =====

/**
 * Create and configure a Chart.js chart with standardized options
 * @param {string} chartId - The ID of the canvas element
 * @param {string} type - Chart type (line, bar, pie, etc.)
 * @param {Object} data - Chart data object
 * @param {Object} customOptions - Custom chart options to merge with defaults
 * @returns {Chart} The created chart instance
 */
function createChart(chartId, type, data, customOptions = {}) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return null;
    
    // Default options with TerraMiner styling
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'rgba(209, 213, 219, 0.9)',
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(21, 50, 73, 0.8)',
                titleColor: '#f9fafc',
                bodyColor: '#d1d5db',
                borderColor: 'rgba(0, 191, 179, 0.3)',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: 'rgba(209, 213, 219, 0.7)'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: 'rgba(209, 213, 219, 0.7)'
                }
            }
        }
    };
    
    // Merge custom options with defaults
    const options = deepMerge(defaultOptions, customOptions);
    
    // Create and return chart
    return new Chart(canvas, {
        type: type,
        data: data,
        options: options
    });
}

/**
 * Helper function to deep merge objects for chart options
 */
function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

// ===== Data Formatting =====

/**
 * Format a number with thousand separators
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number
 */
function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Format a date to a human-readable string
 * @param {string|Date} date - The date to format
 * @param {string} format - Format style (default: 'medium')
 * @returns {string} Formatted date
 */
function formatDate(date, format = 'medium') {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options = {
        short: { month: 'numeric', day: 'numeric', year: '2-digit' },
        medium: { month: 'short', day: 'numeric', year: 'numeric' },
        long: { month: 'long', day: 'numeric', year: 'numeric' },
        time: { hour: 'numeric', minute: 'numeric' },
        datetime: { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' }
    };
    
    return dateObj.toLocaleDateString('en-US', options[format] || options.medium);
}

/**
 * Format a timestamp to relative time (e.g., "5 minutes ago")
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Relative time string
 */
function formatRelativeTime(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) return diffSec + ' seconds ago';
    if (diffMin < 60) return diffMin + ' minute' + (diffMin > 1 ? 's' : '') + ' ago';
    if (diffHour < 24) return diffHour + ' hour' + (diffHour > 1 ? 's' : '') + ' ago';
    if (diffDay < 30) return diffDay + ' day' + (diffDay > 1 ? 's' : '') + ' ago';
    
    return formatDate(date);
}

// ===== API Data Fetching =====

/**
 * Fetch data from API with standardized error handling
 * @param {string} url - API endpoint URL
 * @param {string} containerId - Optional container ID to show loading state
 * @param {Object} options - Fetch options
 * @returns {Promise} Promise resolving to API data
 */
function fetchData(url, containerId = null, options = {}) {
    // Show loading state if container ID provided
    if (containerId) {
        showLoading(containerId);
    }
    
    // Set default options
    const fetchOptions = {
        headers: {
            'Accept': 'application/json'
        },
        ...options
    };
    
    // Return fetch promise with standardized error handling
    return fetch(url, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // Hide loading state if container ID provided
            if (containerId) {
                hideLoading(containerId);
            }
            return data;
        })
        .catch(error => {
            console.error('Fetch error:', error);
            
            // Show error state if container ID provided
            if (containerId) {
                showError(containerId, error.message);
            }
            
            throw error;
        });
}

// ===== Table Utilities =====

/**
 * Initialize a searchable table
 * @param {string} tableId - Table ID
 * @param {string} searchId - Search input ID
 */
function initSearchableTable(tableId, searchId) {
    const searchInput = document.getElementById(searchId);
    if (!searchInput) return;
    
    searchInput.addEventListener('keyup', function() {
        const searchValue = this.value.toLowerCase();
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchValue) ? '' : 'none';
        });
    });
}

// ===== Ready Event Handler =====

/**
 * Document ready handler with TerraMiner UI initialization
 * @param {Function} callback - Function to execute when document is ready
 */
function onReady(callback) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(callback, 1);
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}

// Initialize tooltips and popovers when document is ready
onReady(function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.forEach(popoverTriggerEl => {
        new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Initialize searchable tables
    document.querySelectorAll('.table-search').forEach(input => {
        const tableId = input.getAttribute('data-table');
        if (tableId) {
            initSearchableTable(tableId, input.id);
        }
    });
});