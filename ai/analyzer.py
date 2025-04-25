"""
AI model factory and analyzer classes.

This module provides a factory for AI models and analyzer classes.
"""

import logging
import os
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod

# Attempt to import OpenAI and Anthropic clients
try:
    from openai import OpenAI
    openai_available = True
except ImportError:
    openai_available = False

try:
    import anthropic
    anthropic_available = True
except ImportError:
    anthropic_available = False

logger = logging.getLogger(__name__)

class AIModel(ABC):
    """Abstract base class for AI models."""
    
    @abstractmethod
    def generate_text(self, prompt: str) -> str:
        """Generate text from a prompt."""
        pass
    
    @abstractmethod
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of text."""
        pass
    
    @abstractmethod
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract entities from text."""
        pass

class OpenAIModel(AIModel):
    """OpenAI model implementation."""
    
    def __init__(self):
        """Initialize the OpenAI model."""
        if not openai_available:
            raise ImportError("OpenAI package not available. Install with 'pip install openai'.")
        
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set.")
        
        self.client = OpenAI(api_key=api_key)
        logger.info("OpenAI client initialized successfully")
    
    def generate_text(self, prompt: str) -> str:
        """
        Generate text from a prompt using OpenAI.
        
        Args:
            prompt (str): Prompt text
            
        Returns:
            str: Generated text
        """
        try:
            # The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.exception(f"Error generating text with OpenAI: {str(e)}")
            return f"Error generating text: {str(e)}"
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text using OpenAI.
        
        Args:
            text (str): Text to analyze
            
        Returns:
            Dict[str, Any]: Sentiment analysis results
        """
        try:
            prompt = f"""
            Analyze the sentiment of the following text. Provide a rating from 1 to 5 stars, 
            with 1 being very negative and 5 being very positive. Also provide a confidence 
            score between 0 and 1, and a brief explanation.
            
            Text: {text}
            
            Respond in JSON format with the following keys:
            - rating (float): The sentiment rating from 1 to 5
            - confidence (float): Your confidence in the rating from 0 to 1
            - explanation (string): A brief explanation of the sentiment
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            return result
        
        except Exception as e:
            logger.exception(f"Error analyzing sentiment with OpenAI: {str(e)}")
            return {
                "rating": 3.0,
                "confidence": 0.0,
                "explanation": f"Error analyzing sentiment: {str(e)}"
            }
    
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract entities from text using OpenAI.
        
        Args:
            text (str): Text to analyze
            
        Returns:
            List[Dict[str, Any]]: Extracted entities
        """
        try:
            prompt = f"""
            Extract named entities from the following text. For each entity, identify its type 
            (e.g., person, organization, location, date, etc.) and provide any additional 
            relevant information.
            
            Text: {text}
            
            Respond in JSON format with an array of entities. Each entity should have:
            - text (string): The entity text
            - type (string): The entity type
            - start (int): The start position in the text
            - end (int): The end position in the text
            - confidence (float): Confidence score from 0 to 1
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            return result.get("entities", [])
        
        except Exception as e:
            logger.exception(f"Error extracting entities with OpenAI: {str(e)}")
            return []

class AnthropicModel(AIModel):
    """Anthropic model implementation."""
    
    def __init__(self):
        """Initialize the Anthropic model."""
        if not anthropic_available:
            raise ImportError("Anthropic package not available. Install with 'pip install anthropic'.")
        
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set.")
        
        self.client = anthropic.Anthropic(api_key=api_key)
        logger.info("Anthropic client initialized successfully")
    
    def generate_text(self, prompt: str) -> str:
        """
        Generate text from a prompt using Anthropic.
        
        Args:
            prompt (str): Prompt text
            
        Returns:
            str: Generated text
        """
        try:
            response = self.client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=1500,
                system="You are a helpful assistant.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return response.content[0].text
        except Exception as e:
            logger.exception(f"Error generating text with Anthropic: {str(e)}")
            return f"Error generating text: {str(e)}"
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text using Anthropic.
        
        Args:
            text (str): Text to analyze
            
        Returns:
            Dict[str, Any]: Sentiment analysis results
        """
        try:
            prompt = f"""
            Analyze the sentiment of the following text. Provide a rating from 1 to 5 stars, 
            with 1 being very negative and 5 being very positive. Also provide a confidence 
            score between 0 and 1, and a brief explanation.
            
            Text: {text}
            
            Respond in JSON format with the following keys:
            - rating (float): The sentiment rating from 1 to 5
            - confidence (float): Your confidence in the rating from 0 to 1
            - explanation (string): A brief explanation of the sentiment
            """
            
            response = self.client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=500,
                system="You are a sentiment analysis expert. Respond only with valid JSON.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            import json
            result = json.loads(response.content[0].text)
            return result
        
        except Exception as e:
            logger.exception(f"Error analyzing sentiment with Anthropic: {str(e)}")
            return {
                "rating": 3.0,
                "confidence": 0.0,
                "explanation": f"Error analyzing sentiment: {str(e)}"
            }
    
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract entities from text using Anthropic.
        
        Args:
            text (str): Text to analyze
            
        Returns:
            List[Dict[str, Any]]: Extracted entities
        """
        try:
            prompt = f"""
            Extract named entities from the following text. For each entity, identify its type 
            (e.g., person, organization, location, date, etc.) and provide any additional 
            relevant information.
            
            Text: {text}
            
            Respond in JSON format with an array of entities. Each entity should have:
            - text (string): The entity text
            - type (string): The entity type
            - start (int): The start position in the text
            - end (int): The end position in the text
            - confidence (float): Confidence score from 0 to 1
            """
            
            response = self.client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=1000,
                system="You are an entity extraction expert. Respond only with valid JSON.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            import json
            result = json.loads(response.content[0].text)
            return result.get("entities", [])
        
        except Exception as e:
            logger.exception(f"Error extracting entities with Anthropic: {str(e)}")
            return []

class MockModel(AIModel):
    """Mock AI model for testing."""
    
    def __init__(self):
        """Initialize the mock model."""
        logger.info("Mock AI model initialized")
    
    def generate_text(self, prompt: str) -> str:
        """
        Generate text from a prompt (mock implementation).
        
        Args:
            prompt (str): Prompt text
            
        Returns:
            str: Generated text
        """
        if "pricing strategy" in prompt.lower():
            return """{
                "pricing_strategy": "Price the property slightly above market value to allow room for negotiation while still attracting qualified buyers. The property's updated features and desirable location justify a premium compared to similar properties in the area.",
                "property_strengths": [
                    "Located in a highly desirable neighborhood with excellent school districts",
                    "Recently updated kitchen and bathrooms add significant value",
                    "Larger than average lot size provides more outdoor space",
                    "Energy-efficient upgrades reduce monthly utility costs"
                ],
                "property_weaknesses": [
                    "Older HVAC system may need replacement in the next few years",
                    "Limited storage space compared to comparable properties",
                    "Single-car garage in an area where two-car garages are common",
                    "Bathroom fixtures are dated and may need updating"
                ],
                "marketing_recommendations": [
                    "Highlight the recent kitchen and bathroom upgrades in listing photos",
                    "Emphasize the larger lot size and outdoor living potential",
                    "Create a virtual tour to showcase the open floor plan",
                    "Target marketing to families looking for good school districts",
                    "Stage the home to maximize perception of storage space"
                ],
                "negotiation_tips": [
                    "Prepare a list of recent upgrades and improvements with costs",
                    "Have inspection reports ready to share with serious buyers",
                    "Consider offering a home warranty to alleviate concerns about the HVAC system",
                    "Be prepared to highlight neighborhood amenities and school ratings",
                    "Set a clear bottom-line price before negotiations begin"
                ],
                "improvement_recommendations": [
                    "Update bathroom fixtures to modern styles for better appeal",
                    "Add built-in storage solutions to address the storage concerns",
                    "Service the HVAC system and provide maintenance records",
                    "Improve curb appeal with fresh landscaping and exterior paint",
                    "Consider converting part of the garage to create more storage space"
                ]
            }"""
        
        return "This is a mock response for testing purposes."
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text (mock implementation).
        
        Args:
            text (str): Text to analyze
            
        Returns:
            Dict[str, Any]: Sentiment analysis results
        """
        return {
            "rating": 4.2,
            "confidence": 0.85,
            "explanation": "The text has a positive tone with minimal negative elements."
        }
    
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract entities from text (mock implementation).
        
        Args:
            text (str): Text to analyze
            
        Returns:
            List[Dict[str, Any]]: Extracted entities
        """
        return [
            {
                "text": "Example Organization",
                "type": "organization",
                "start": 10,
                "end": 30,
                "confidence": 0.95
            },
            {
                "text": "John Doe",
                "type": "person",
                "start": 45,
                "end": 53,
                "confidence": 0.98
            }
        ]

class ModelFactory:
    """Factory for AI models."""
    
    @staticmethod
    def get_model(model_type: str) -> AIModel:
        """
        Get an AI model instance.
        
        Args:
            model_type (str): Model type ('openai', 'anthropic', or 'mock')
            
        Returns:
            AIModel: AI model instance
            
        Raises:
            ValueError: If model type is not supported
        """
        if model_type.lower() == 'openai':
            return OpenAIModel()
        elif model_type.lower() == 'anthropic':
            return AnthropicModel()
        elif model_type.lower() == 'mock':
            return MockModel()
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
    
    @staticmethod
    def available_models() -> List[str]:
        """
        Get a list of available model types.
        
        Returns:
            List[str]: Available model types
        """
        models = ['mock']
        
        if openai_available:
            models.append('openai')
        
        if anthropic_available:
            models.append('anthropic')
        
        return models