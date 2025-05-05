"""
AI-powered contextual suggestions module for TerraMiner.
Provides real-time suggestions and insights based on user context.
"""

import os
import json
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

# Initialize OpenAI client
try:
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    logger.info("OpenAI client initialized for contextual suggestions")
except Exception as e:
    logger.error(f"Error initializing OpenAI client: {str(e)}")
    client = None

# Define suggestion types
SUGGESTION_TYPES = {
    "dashboard": {
        "system_prompt": "You are an AI assistant helping real estate professionals analyze market data. "
                        "Provide 3-4 short, actionable insights based on the dashboard metrics they're viewing. "
                        "Focus on trends, anomalies, and potential opportunities. Keep each insight to 1-2 sentences max. "
                        "Format as a JSON array of objects with 'title' and 'description' fields."
    },
    "property_detail": {
        "system_prompt": "You are an AI assistant helping real estate professionals evaluate properties. "
                        "Provide 3-4 short, actionable insights about this specific property. "
                        "Focus on its competitive position, value factors, and potential selling points. "
                        "Keep each insight to 1-2 sentences max. Format as a JSON array of objects with 'title' and 'description' fields."
    },
    "market_trends": {
        "system_prompt": "You are an AI assistant analyzing real estate market trends. "
                        "Provide 3-4 short, actionable insights based on the market data being viewed. "
                        "Focus on price movements, inventory changes, and market velocity. "
                        "Keep each insight to 1-2 sentences max. Format as a JSON array of objects with 'title' and 'description' fields."
    },
    "agent_performance": {
        "system_prompt": "You are an AI assistant analyzing real estate agent performance metrics. "
                        "Provide 3-4 short, actionable insights based on the performance data being viewed. "
                        "Focus on closing rates, time-to-sale, and comparative performance. "
                        "Keep each insight to 1-2 sentences max. Format as a JSON array of objects with 'title' and 'description' fields."
    },
    "default": {
        "system_prompt": "You are an AI assistant for real estate professionals. "
                        "Provide 3-4 general insights and tips relevant to real estate practices. "
                        "Keep each insight to 1-2 sentences max. Format as a JSON array of objects with 'title' and 'description' fields."
    }
}

def get_contextual_suggestions(context_type, context_data=None, max_suggestions=4):
    """
    Generate contextual AI suggestions based on the user's current view/context.
    
    Args:
        context_type (str): Type of context (dashboard, property_detail, market_trends, etc.)
        context_data (dict, optional): Contextual data to inform suggestions
        max_suggestions (int, optional): Maximum number of suggestions to return
        
    Returns:
        list: List of suggestion objects with title and description
    """
    if not client:
        logger.warning("OpenAI client not available for contextual suggestions")
        return get_fallback_suggestions(context_type)
    
    # Get the appropriate system prompt for this context
    prompt_config = SUGGESTION_TYPES.get(context_type, SUGGESTION_TYPES["default"])
    system_prompt = prompt_config["system_prompt"]
    
    # Prepare contextual data as a string
    context_string = ""
    if context_data:
        try:
            # Format the context data for the prompt
            context_string = "Current view data:\n"
            for key, value in context_data.items():
                context_string += f"{key}: {value}\n"
        except Exception as e:
            logger.error(f"Error formatting context data: {str(e)}")
    
    try:
        # Make OpenAI API call
        response = client.chat.completions.create(
            model="gpt-4o", # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context_string if context_string else "Please provide general real estate insights"}
            ],
            response_format={"type": "json_object"},
            max_tokens=500,
            temperature=0.5
        )
        
        # Parse response
        content = response.choices[0].message.content
        suggestions = json.loads(content)
        
        # Ensure we have a list of suggestions
        if isinstance(suggestions, dict) and 'suggestions' in suggestions:
            suggestions = suggestions['suggestions']
        elif isinstance(suggestions, list):
            pass  # Already in the correct format
        else:
            # Convert to list if it's in an unexpected format
            suggestions = [suggestions]
        
        # Limit to max_suggestions
        if len(suggestions) > max_suggestions:
            suggestions = suggestions[:max_suggestions]
            
        return suggestions
        
    except Exception as e:
        logger.error(f"Error generating contextual suggestions: {str(e)}")
        return get_fallback_suggestions(context_type)

def get_fallback_suggestions(context_type):
    """
    Provide fallback suggestions when the AI service is unavailable.
    
    Args:
        context_type (str): Type of context
    
    Returns:
        list: List of fallback suggestion objects
    """
    fallbacks = {
        "dashboard": [
            {"title": "Market Trends", "description": "Track month-over-month changes to identify emerging patterns in your local market."},
            {"title": "Inventory Analysis", "description": "Low inventory typically signals a seller's market. Consider adjusting your pricing strategy accordingly."},
            {"title": "Seasonal Patterns", "description": "Consider how current metrics compare to typical seasonal patterns in your region."}
        ],
        "property_detail": [
            {"title": "Comparative Analysis", "description": "Compare this property against similar recently sold properties in the same neighborhood."},
            {"title": "Value Factors", "description": "Identify unique features that could justify a premium price in this market."},
            {"title": "Improvement ROI", "description": "Calculate potential return on specific improvements for this property type and location."}
        ],
        "market_trends": [
            {"title": "Price Momentum", "description": "Note the acceleration or deceleration of price changes, not just the direction."},
            {"title": "Days on Market", "description": "Decreasing DOM typically precedes price increases. Track this leading indicator closely."},
            {"title": "Supply-Demand Balance", "description": "The months-of-inventory figure provides the clearest picture of market conditions."}
        ],
        "agent_performance": [
            {"title": "Closing Ratio", "description": "Focus on improving your listing-to-closing ratio rather than just increasing listings."},
            {"title": "Time Efficiency", "description": "Analyze time spent per transaction to identify workflow improvements."},
            {"title": "Client Satisfaction", "description": "Higher satisfaction scores correlate strongly with referral business growth."}
        ],
        "default": [
            {"title": "Data-Driven Decisions", "description": "Base pricing recommendations on current data rather than historical assumptions."},
            {"title": "Local Focus", "description": "National trends may not reflect your specific market conditions."},
            {"title": "Client Education", "description": "Well-informed clients make faster decisions and have higher satisfaction rates."}
        ]
    }
    
    return fallbacks.get(context_type, fallbacks["default"])