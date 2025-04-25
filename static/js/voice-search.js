/**
 * Voice-activated property search and market queries
 * This module handles voice recognition and natural language processing for property search
 */

class VoiceSearch {
    constructor(options = {}) {
        this.options = {
            language: 'en-US',
            continuous: false,
            interimResults: false,
            maxAlternatives: 1,
            ...options
        };
        
        this.recognition = null;
        this.isListening = false;
        this.resultCallback = null;
        this.errorCallback = null;
        this.commandProcessor = null;
        
        this.initSpeechRecognition();
    }
    
    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported in this browser');
            return;
        }
        
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Set recognition options
        this.recognition.lang = this.options.language;
        this.recognition.continuous = this.options.continuous;
        this.recognition.interimResults = this.options.interimResults;
        this.recognition.maxAlternatives = this.options.maxAlternatives;
        
        // Set up event handlers
        this.recognition.onresult = (event) => this.handleResult(event);
        this.recognition.onerror = (event) => this.handleError(event);
        this.recognition.onend = () => this.handleEnd();
    }
    
    start(resultCallback, errorCallback) {
        if (!this.recognition) {
            if (errorCallback) {
                errorCallback('Speech recognition not supported');
            }
            return false;
        }
        
        this.resultCallback = resultCallback;
        this.errorCallback = errorCallback;
        
        try {
            this.recognition.start();
            this.isListening = true;
            return true;
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            if (errorCallback) {
                errorCallback(error.message || 'Failed to start speech recognition');
            }
            return false;
        }
    }
    
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }
    
    handleResult(event) {
        if (event.results.length > 0) {
            const result = event.results[event.results.length - 1];
            if (result.isFinal) {
                const transcript = result[0].transcript.trim();
                console.log('Voice recognition result:', transcript);
                
                if (this.resultCallback) {
                    this.resultCallback(transcript);
                }
                
                if (this.commandProcessor) {
                    this.commandProcessor.processCommand(transcript);
                }
            }
        }
    }
    
    handleError(event) {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        
        if (this.errorCallback) {
            this.errorCallback(event.error);
        }
    }
    
    handleEnd() {
        this.isListening = false;
    }
    
    setCommandProcessor(processor) {
        this.commandProcessor = processor;
    }
}

class PropertyVoiceCommandProcessor {
    constructor(options = {}) {
        this.options = {
            apiEndpoint: '/api/voice/process',
            searchCallback: null,
            statusCallback: null,
            ...options
        };
        
        // Common property search command patterns
        this.commandPatterns = {
            search: [
                /find (?:properties|homes|houses) in (.+)/i,
                /search (?:for )?(?:properties|homes|houses) in (.+)/i,
                /show (?:me )?(?:properties|homes|houses) in (.+)/i,
                /properties in (.+)/i
            ],
            bedrooms: [
                /with (\d+) bedrooms/i,
                /(\d+) (?:bed|bedroom|bedrooms)/i
            ],
            bathrooms: [
                /with (\d+(?:\.\d+)?) bathrooms/i,
                /(\d+(?:\.\d+)?) (?:bath|bathroom|bathrooms)/i
            ],
            price: [
                /under \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?/i,
                /less than \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?/i,
                /max(?:imum)? price (?:of )?\$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?/i,
                /price under \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?/i
            ],
            propertyType: [
                /(?:type|property type|home type)(?: of| is)? (house|condo|townhouse|apartment|single family|multi family)/i
            ],
            marketTrends: [
                /(?:show|get|what are) (?:the )?market trends (?:for|in) (.+)/i,
                /market (?:data|analysis|info|information) (?:for|in) (.+)/i
            ],
            propertyDetails: [
                /(?:show|get|tell me about) (?:property|home) (?:at|on) (.+)/i,
                /details (?:for|about) (?:property|home) (?:at|on) (.+)/i
            ]
        };
    }
    
    processCommand(command) {
        // First, update status
        this.updateStatus('Processing command: ' + command);
        
        // Analyze the command to determine intent
        const intent = this.determineIntent(command);
        
        if (intent) {
            this.updateStatus('Detected intent: ' + intent.type);
            
            // Handle the intent based on its type
            if (intent.type === 'search') {
                this.handleSearchIntent(intent, command);
            } else if (intent.type === 'marketTrends') {
                this.handleMarketTrendsIntent(intent, command);
            } else if (intent.type === 'propertyDetails') {
                this.handlePropertyDetailsIntent(intent, command);
            }
        } else {
            // If we couldn't determine the intent, send to server for processing
            this.sendToServer(command);
        }
    }
    
    determineIntent(command) {
        // Check each intent pattern
        for (const [intentType, patterns] of Object.entries(this.commandPatterns)) {
            for (const pattern of patterns) {
                const match = command.match(pattern);
                if (match) {
                    return {
                        type: intentType,
                        value: match[1],
                        match: match
                    };
                }
            }
        }
        
        return null;
    }
    
    handleSearchIntent(intent, command) {
        const searchParams = this.extractSearchParameters(command);
        
        this.updateStatus('Searching for properties with parameters: ' + 
                        JSON.stringify(searchParams));
        
        if (this.options.searchCallback) {
            this.options.searchCallback(searchParams);
        } else {
            // Default behavior: redirect to search page with parameters
            const queryParams = new URLSearchParams();
            
            for (const [key, value] of Object.entries(searchParams)) {
                if (value !== null && value !== undefined) {
                    queryParams.append(key, value);
                }
            }
            
            window.location.href = `/property/search?${queryParams.toString()}`;
        }
    }
    
    handleMarketTrendsIntent(intent, command) {
        const location = intent.value;
        this.updateStatus('Getting market trends for: ' + location);
        
        // Redirect to market trends page
        window.location.href = `/market/trends?location=${encodeURIComponent(location)}`;
    }
    
    handlePropertyDetailsIntent(intent, command) {
        const address = intent.value;
        this.updateStatus('Getting property details for: ' + address);
        
        // Extract address and search
        window.location.href = `/property/details?address=${encodeURIComponent(address)}`;
    }
    
    extractSearchParameters(command) {
        const params = {
            location: null,
            beds: null,
            baths: null,
            maxPrice: null,
            propertyType: null
        };
        
        // Extract location
        for (const pattern of this.commandPatterns.search) {
            const match = command.match(pattern);
            if (match) {
                params.location = match[1];
                break;
            }
        }
        
        // Extract bedrooms
        for (const pattern of this.commandPatterns.bedrooms) {
            const match = command.match(pattern);
            if (match) {
                params.beds = parseInt(match[1], 10);
                break;
            }
        }
        
        // Extract bathrooms
        for (const pattern of this.commandPatterns.bathrooms) {
            const match = command.match(pattern);
            if (match) {
                params.baths = parseFloat(match[1]);
                break;
            }
        }
        
        // Extract price
        for (const pattern of this.commandPatterns.price) {
            const match = command.match(pattern);
            if (match) {
                let price = match[1].replace(/[,.]/g, '');
                if (match[0].includes('million') || match[0].includes('m')) {
                    price = parseInt(price, 10) * 1000000;
                } else if (match[0].includes('k') || match[0].includes('thousand')) {
                    price = parseInt(price, 10) * 1000;
                } else {
                    price = parseInt(price, 10);
                }
                params.maxPrice = price;
                break;
            }
        }
        
        // Extract property type
        for (const pattern of this.commandPatterns.propertyType) {
            const match = command.match(pattern);
            if (match) {
                params.propertyType = match[1].toLowerCase();
                // Normalize property type
                if (params.propertyType === 'house' || params.propertyType === 'single family') {
                    params.propertyType = 'Single Family';
                } else if (params.propertyType === 'condo' || params.propertyType === 'apartment') {
                    params.propertyType = 'Condo';
                } else if (params.propertyType === 'townhouse') {
                    params.propertyType = 'Townhouse';
                } else if (params.propertyType === 'multi family') {
                    params.propertyType = 'Multi-Family';
                }
                break;
            }
        }
        
        return params;
    }
    
    sendToServer(command) {
        this.updateStatus('Sending command to server for processing...');
        
        fetch(this.options.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command })
        })
        .then(response => response.json())
        .then(data => {
            this.updateStatus('Server response: ' + JSON.stringify(data));
            
            if (data.action === 'search' && data.params) {
                if (this.options.searchCallback) {
                    this.options.searchCallback(data.params);
                } else {
                    // Redirect to search page with parameters
                    const queryParams = new URLSearchParams();
                    
                    for (const [key, value] of Object.entries(data.params)) {
                        if (value !== null && value !== undefined) {
                            queryParams.append(key, value);
                        }
                    }
                    
                    window.location.href = `/property/search?${queryParams.toString()}`;
                }
            } else if (data.action === 'redirect' && data.url) {
                window.location.href = data.url;
            }
        })
        .catch(error => {
            console.error('Error sending command to server:', error);
            this.updateStatus('Error processing command: ' + error.message);
        });
    }
    
    updateStatus(status) {
        console.log(status);
        if (this.options.statusCallback) {
            this.options.statusCallback(status);
        }
    }
}

// Make classes available globally
window.VoiceSearch = VoiceSearch;
window.PropertyVoiceCommandProcessor = PropertyVoiceCommandProcessor;