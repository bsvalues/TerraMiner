/**
 * Voice-activated property search JavaScript module
 * 
 * This module handles voice recognition, command processing,
 * and UI interactions for the voice search feature.
 */

// State variables
let isListening = false;
let recognition = null;
let commandsList = [];
let animationTimeout = null;

// Elements
let micButton = null;
let statusElement = null;
let resultsElement = null;
let examplesElement = null;
let processingIndicator = null;

// Constants
const API_ENDPOINT = '/api/voice/process';
const LANG = 'en-US';
const LISTENING_TIMEOUT = 10000; // 10 seconds

/**
 * Initialize the voice search feature
 */
function initVoiceSearch() {
    // Get UI elements
    micButton = document.getElementById('voice-search-mic');
    statusElement = document.getElementById('voice-status');
    resultsElement = document.getElementById('voice-results');
    examplesElement = document.getElementById('voice-examples');
    processingIndicator = document.getElementById('processing-indicator');
    
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showBrowserNotSupported();
        return;
    }
    
    // Set up speech recognition
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = LANG;
    
    // Set up event listeners
    recognition.onstart = handleRecognitionStart;
    recognition.onresult = handleRecognitionResult;
    recognition.onerror = handleRecognitionError;
    recognition.onend = handleRecognitionEnd;
    
    // Set up UI elements
    if (micButton) {
        micButton.addEventListener('click', toggleListening);
        micButton.disabled = false;
    }
    
    // Load example commands
    loadExampleCommands();
    
    console.log('Voice search initialized');
}

/**
 * Toggle listening state
 */
function toggleListening() {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

/**
 * Start listening for voice commands
 */
function startListening() {
    if (isListening) return;
    
    try {
        recognition.start();
    } catch (e) {
        console.error('Error starting speech recognition:', e);
        updateStatus('Error starting speech recognition. Please try again.');
    }
}

/**
 * Stop listening for voice commands
 */
function stopListening() {
    if (!isListening) return;
    
    try {
        recognition.stop();
    } catch (e) {
        console.error('Error stopping speech recognition:', e);
    }
}

/**
 * Handle recognition start event
 */
function handleRecognitionStart() {
    isListening = true;
    updateStatus('Listening...');
    updateMicButton(true);
    
    // Set timeout to stop listening after a period
    if (animationTimeout) {
        clearTimeout(animationTimeout);
    }
    
    animationTimeout = setTimeout(() => {
        if (isListening) {
            stopListening();
        }
    }, LISTENING_TIMEOUT);
}

/**
 * Handle recognition result event
 * @param {SpeechRecognitionEvent} event - The speech recognition event
 */
function handleRecognitionResult(event) {
    const command = event.results[0][0].transcript;
    console.log('Voice command recognized:', command);
    
    updateStatus('Processing command...');
    
    // Process command
    processCommand(command);
}

/**
 * Handle recognition error event
 * @param {SpeechRecognitionError} event - The speech recognition error event
 */
function handleRecognitionError(event) {
    console.error('Speech recognition error:', event.error);
    
    let errorMessage = 'Speech recognition error';
    
    switch (event.error) {
        case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
        case 'aborted':
            errorMessage = 'Speech recognition aborted.';
            break;
        case 'audio-capture':
            errorMessage = 'Could not capture audio. Please check your microphone.';
            break;
        case 'network':
            errorMessage = 'Network error. Please try again.';
            break;
        case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
        case 'service-not-allowed':
            errorMessage = 'Speech recognition service not allowed.';
            break;
        case 'bad-grammar':
            errorMessage = 'Bad grammar configuration.';
            break;
        case 'language-not-supported':
            errorMessage = 'Language not supported.';
            break;
    }
    
    updateStatus(errorMessage);
    updateMicButton(false);
    isListening = false;
}

/**
 * Handle recognition end event
 */
function handleRecognitionEnd() {
    isListening = false;
    updateMicButton(false);
    
    if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
    }
}

/**
 * Process a voice command
 * @param {string} command - The voice command to process
 */
function processCommand(command) {
    // Show processing indicator
    if (processingIndicator) {
        processingIndicator.style.display = 'block';
    }
    
    // Add command to history
    commandsList.unshift(command);
    if (commandsList.length > 5) {
        commandsList.pop();
    }
    
    // Make API request to process the command
    fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: command })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Command processing result:', data);
        
        // Hide processing indicator
        if (processingIndicator) {
            processingIndicator.style.display = 'none';
        }
        
        // Handle the response
        handleCommandResponse(data, command);
    })
    .catch(error => {
        console.error('Error processing command:', error);
        
        // Hide processing indicator
        if (processingIndicator) {
            processingIndicator.style.display = 'none';
        }
        
        updateStatus('Error processing command. Please try again.');
    });
}

/**
 * Handle the command response from the API
 * @param {Object} data - The response data
 * @param {string} command - The original command
 */
function handleCommandResponse(data, command) {
    if (!data || !data.success) {
        updateStatus('Could not understand the command. Please try again.');
        showCommandResult(command, 'Error processing command');
        return;
    }
    
    let responseText = '';
    
    switch (data.intent) {
        case 'search':
            responseText = `Searching for properties in ${data.params.location || 'the selected area'}`;
            
            if (data.params.beds) {
                responseText += ` with ${data.params.beds} bedrooms`;
            }
            
            if (data.params.baths) {
                responseText += `, ${data.params.baths} bathrooms`;
            }
            
            if (data.params.maxPrice) {
                responseText += `, under $${formatPrice(data.params.maxPrice)}`;
            }
            
            if (data.params.propertyType) {
                responseText += `, type: ${data.params.propertyType}`;
            }
            
            updateStatus('Search command recognized');
            break;
            
        case 'marketTrends':
            responseText = `Showing market trends for ${data.params.location || 'the selected area'}`;
            updateStatus('Market trends command recognized');
            break;
            
        case 'propertyDetails':
            responseText = `Showing property details for ${data.params.address || 'the selected property'}`;
            updateStatus('Property details command recognized');
            break;
            
        default:
            responseText = 'Command recognized but the intent is unknown';
            updateStatus('Unknown command type');
            break;
    }
    
    // Show the result
    showCommandResult(command, responseText);
    
    // Redirect if needed
    if (data.action === 'redirect' && data.url) {
        setTimeout(() => {
            window.location.href = data.url;
        }, 1500);
    }
}

/**
 * Show command result in the UI
 * @param {string} command - The original command
 * @param {string} response - The response text
 */
function showCommandResult(command, response) {
    if (!resultsElement) return;
    
    const resultItem = document.createElement('div');
    resultItem.className = 'voice-result-item';
    
    const commandEl = document.createElement('div');
    commandEl.className = 'voice-command';
    commandEl.innerHTML = `<strong>You said:</strong> "${command}"`;
    
    const responseEl = document.createElement('div');
    responseEl.className = 'voice-response';
    responseEl.innerHTML = `<strong>Response:</strong> ${response}`;
    
    resultItem.appendChild(commandEl);
    resultItem.appendChild(responseEl);
    
    // Add to results container
    resultsElement.insertBefore(resultItem, resultsElement.firstChild);
    
    // Limit the number of results shown
    if (resultsElement.children.length > 5) {
        resultsElement.removeChild(resultsElement.lastChild);
    }
}

/**
 * Format price for display
 * @param {number} price - The price to format
 * @returns {string} - The formatted price
 */
function formatPrice(price) {
    if (!price) return '0';
    
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
        return (price / 1000).toFixed(0) + 'K';
    }
    
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Update microphone button state
 * @param {boolean} isActive - Whether the microphone is active
 */
function updateMicButton(isActive) {
    if (!micButton) return;
    
    if (isActive) {
        micButton.classList.add('active');
        micButton.setAttribute('aria-label', 'Stop listening');
    } else {
        micButton.classList.remove('active');
        micButton.setAttribute('aria-label', 'Start voice search');
    }
}

/**
 * Update status message
 * @param {string} message - The status message
 */
function updateStatus(message) {
    if (!statusElement) return;
    
    statusElement.textContent = message;
}

/**
 * Show browser not supported message
 */
function showBrowserNotSupported() {
    if (!statusElement) return;
    
    statusElement.textContent = 'Voice search is not supported in your browser. Please try Chrome or Edge.';
    
    if (micButton) {
        micButton.disabled = true;
        micButton.title = 'Voice search not supported in this browser';
    }
}

/**
 * Load example commands
 */
function loadExampleCommands() {
    if (!examplesElement) return;
    
    const examples = [
        'Find homes in Seattle with 3 bedrooms',
        'Show properties in San Francisco under 750k',
        'Search for houses in Austin with 2 bathrooms',
        'Find condos in Chicago with 2 beds under 500k',
        'Show market trends for Boston',
        'Get property details at 123 Main Street'
    ];
    
    const examplesList = document.createElement('ul');
    examplesList.className = 'examples-list';
    
    examples.forEach(example => {
        const item = document.createElement('li');
        item.textContent = example;
        item.addEventListener('click', () => {
            processCommand(example);
        });
        examplesList.appendChild(item);
    });
    
    examplesElement.appendChild(examplesList);
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', initVoiceSearch);