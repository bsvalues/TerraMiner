"""
AI-powered voice command analyzer module
"""
import logging
import re
import os
import json
from ai.model_factory import ModelFactory

# Set up logging
logger = logging.getLogger(__name__)

class VoiceCommandAnalyzer:
    """
    Analyzes voice commands using natural language processing
    to determine user intent and extract key parameters
    """
    
    def __init__(self):
        logger.info("Initializing VoiceCommandAnalyzer")
        self.model_factory = ModelFactory()
        self.model = self.model_factory.get_model('property-voice-analyzer')
        
        # Command patterns for regex-based matching
        self.command_patterns = {
            'search': [
                r'find (?:properties|homes|houses) in (.+)',
                r'search (?:for )?(?:properties|homes|houses) in (.+)',
                r'show (?:me )?(?:properties|homes|houses) in (.+)',
                r'properties in (.+)'
            ],
            'bedrooms': [
                r'with (\d+) bedrooms',
                r'(\d+) (?:bed|bedroom|bedrooms)'
            ],
            'bathrooms': [
                r'with (\d+(?:\.\d+)?) bathrooms',
                r'(\d+(?:\.\d+)?) (?:bath|bathroom|bathrooms)'
            ],
            'price': [
                r'under \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?',
                r'less than \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?',
                r'max(?:imum)? price (?:of )?\$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?',
                r'price under \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?'
            ],
            'propertyType': [
                r'(?:type|property type|home type)(?: of| is)? (house|condo|townhouse|apartment|single family|multi family)'
            ],
            'marketTrends': [
                r'(?:show|get|what are) (?:the )?market trends (?:for|in) (.+)',
                r'market (?:data|analysis|info|information) (?:for|in) (.+)'
            ],
            'propertyDetails': [
                r'(?:show|get|tell me about) (?:property|home) (?:at|on) (.+)',
                r'details (?:for|about) (?:property|home) (?:at|on) (.+)'
            ]
        }
        
    def analyze(self, command):
        """
        Analyze a voice command to determine intent and extract parameters.
        
        Args:
            command (str): The voice command to analyze
            
        Returns:
            dict: Analysis result containing intent and extracted parameters
        """
        logger.info(f"Analyzing voice command: {command}")
        
        # Try regex-based matching first
        result = self._analyze_with_regex(command)
        
        # If regex doesn't find a match, use OpenAI or other LLM models
        if not result.get('intent'):
            result = self._analyze_with_llm(command)
        
        logger.info(f"Analysis result: {result}")
        return result
        
    def _analyze_with_regex(self, command):
        """
        Analyze the command using regex pattern matching.
        
        Args:
            command (str): The voice command to analyze
            
        Returns:
            dict: Analysis result containing intent and extracted parameters
        """
        result = {
            'success': True,
            'command': command,
            'intent': None,
            'action': None,
            'params': {}
        }
        
        # Determine intent based on command patterns
        intent = self._determine_intent(command)
        
        if intent:
            result['intent'] = intent['type']
            
            # Handle different intents
            if intent['type'] == 'search':
                result['action'] = 'search'
                result['params'] = self._extract_search_parameters(command)
                
                # Add route for redirect
                result['url'] = f"/property/search?location={result['params'].get('location', '')}"
                
                # Add additional parameters to URL if available
                if result['params'].get('beds'):
                    result['url'] += f"&min_beds={result['params']['beds']}"
                if result['params'].get('baths'):
                    result['url'] += f"&min_baths={result['params']['baths']}"
                if result['params'].get('maxPrice'):
                    result['url'] += f"&max_price={result['params']['maxPrice']}"
                if result['params'].get('propertyType'):
                    result['url'] += f"&property_type={result['params']['propertyType']}"
                
            elif intent['type'] == 'marketTrends':
                result['action'] = 'redirect'
                result['url'] = f"/market/trends?location={intent['value']}"
                
            elif intent['type'] == 'propertyDetails':
                result['action'] = 'redirect'
                result['url'] = f"/property/details?address={intent['value']}"
        
        return result
    
    def _determine_intent(self, command):
        """
        Determine the intent of a command using regex pattern matching.
        
        Args:
            command (str): The command to analyze
            
        Returns:
            dict or None: Intent information if detected, None otherwise
        """
        command = command.lower()
        
        for intent_type, patterns in self.command_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, command, re.IGNORECASE)
                if match:
                    return {
                        'type': intent_type,
                        'value': match.group(1),
                        'match': match.group(0)
                    }
        
        return None
    
    def _extract_search_parameters(self, command):
        """
        Extract search parameters from a property search command.
        
        Args:
            command (str): The search command
            
        Returns:
            dict: Extracted search parameters
        """
        params = {
            'location': None,
            'beds': None,
            'baths': None,
            'maxPrice': None,
            'propertyType': None
        }
        
        # Extract location
        for pattern in self.command_patterns['search']:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                params['location'] = match.group(1)
                break
        
        # Extract bedrooms
        for pattern in self.command_patterns['bedrooms']:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                params['beds'] = int(match.group(1))
                break
        
        # Extract bathrooms
        for pattern in self.command_patterns['bathrooms']:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                params['baths'] = float(match.group(1))
                break
        
        # Extract price
        for pattern in self.command_patterns['price']:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                price_str = match.group(1).replace(',', '')
                price = float(price_str)
                
                # Handle price multipliers (k, million, etc.)
                if 'million' in match.group(0).lower() or 'm' in match.group(0).lower():
                    price *= 1000000
                elif 'k' in match.group(0).lower() or 'thousand' in match.group(0).lower():
                    price *= 1000
                
                params['maxPrice'] = int(price)
                break
        
        # Extract property type
        for pattern in self.command_patterns['propertyType']:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                prop_type = match.group(1).lower()
                
                # Normalize property type
                if prop_type in ['house', 'single family']:
                    params['propertyType'] = 'Single Family'
                elif prop_type in ['condo', 'apartment']:
                    params['propertyType'] = 'Condo'
                elif prop_type == 'townhouse':
                    params['propertyType'] = 'Townhouse'
                elif prop_type == 'multi family':
                    params['propertyType'] = 'Multi-Family'
                else:
                    params['propertyType'] = prop_type.title()
                
                break
        
        return params
    
    def _analyze_with_llm(self, command):
        """
        Analyze the command using a language model for more complex queries.
        
        Args:
            command (str): The voice command to analyze
            
        Returns:
            dict: Analysis result containing intent and extracted parameters
        """
        # Check if we have an OpenAI API key
        if not os.environ.get('OPENAI_API_KEY'):
            logger.warning("OpenAI API key not found, skipping LLM analysis")
            return {
                'success': True,
                'command': command,
                'intent': 'unknown',
                'action': None,
                'message': 'Could not understand the command. Please try again with a more specific property search or market query.'
            }
        
        try:
            # Prepare prompt for the LLM
            system_prompt = """
            You are an AI assistant that analyzes real estate voice commands.
            Extract the user's intent and all relevant parameters from their voice command.
            Respond in JSON format with these fields:
            {
                "intent": "search" | "marketTrends" | "propertyDetails" | "unknown",
                "action": "search" | "redirect" | null,
                "params": {
                    "location": string or null,
                    "beds": number or null,
                    "baths": number or null,
                    "maxPrice": number or null,
                    "propertyType": string or null
                },
                "url": string or null
            }
            """
            
            user_prompt = f"Analyze this real estate voice command: '{command}'"
            
            # Get response from the model
            response = self.model.analyze(
                system_prompt=system_prompt,
                user_prompt=user_prompt
            )
            
            # Parse the response
            try:
                result = json.loads(response)
                # Add success and original command to result
                result['success'] = True
                result['command'] = command
                return result
            except json.JSONDecodeError:
                logger.error(f"Failed to parse LLM response as JSON: {response}")
                # Try to extract JSON from the response if it's embedded in text
                import re
                json_match = re.search(r'({.*})', response.replace('\n', ' '))
                if json_match:
                    try:
                        result = json.loads(json_match.group(1))
                        result['success'] = True
                        result['command'] = command
                        return result
                    except:
                        pass
                        
                # Return a fallback result
                return {
                    'success': True,
                    'command': command,
                    'intent': 'unknown',
                    'action': None,
                    'message': 'Could not understand the command. Please try again with a more specific property search or market query.'
                }
        
        except Exception as e:
            logger.exception(f"Error in LLM analysis: {str(e)}")
            return {
                'success': False,
                'command': command,
                'error': str(e),
                'message': 'Error analyzing voice command. Please try again.'
            }