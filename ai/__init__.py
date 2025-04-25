"""
AI module for TerraMiner.

This module provides AI models and analyzers for the TerraMiner platform.
"""

import logging

logger = logging.getLogger(__name__)

# This will be populated when the AI modules are loaded
AI_MODELS_AVAILABLE = []

def load_ai_modules():
    """Load AI modules and populate AI_MODELS_AVAILABLE."""
    global AI_MODELS_AVAILABLE
    
    from ai.analyzer import ModelFactory
    
    AI_MODELS_AVAILABLE = ModelFactory.available_models()
    
    logger.info(f"AI modules loaded successfully. Available models: {', '.join(AI_MODELS_AVAILABLE)}")
    
    return AI_MODELS_AVAILABLE