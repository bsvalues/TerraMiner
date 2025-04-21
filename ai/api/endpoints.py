import logging
from typing import Dict, Any, Optional, List
from flask import Blueprint, request, jsonify

from ai.agents.text_summarizer import TextSummarizerAgent
from ai.agents.market_analyzer import MarketAnalyzerAgent
from ai.agents.recommendation_agent import RecommendationAgent
from ai.agents.nl_search_agent import NaturalLanguageSearchAgent

logger = logging.getLogger(__name__)

# Create Blueprint for AI API endpoints
ai_api = Blueprint('ai_api', __name__, url_prefix='/api/ai')

# Initialize agents
summarizer = TextSummarizerAgent()
market_analyzer = MarketAnalyzerAgent()
recommender = RecommendationAgent()
nl_search = NaturalLanguageSearchAgent()

@ai_api.route('/health', methods=['GET'])
def health_check():
    """Check health of AI services"""
    return jsonify({
        "status": "online",
        "agents": {
            "summarizer": "available",
            "market_analyzer": "available",
            "recommender": "available",
            "nl_search": "available"
        }
    })

@ai_api.route('/summarize', methods=['POST'])
def summarize_text():
    """Summarize property description text"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required parameter: text"
            }), 400
        
        text = data['text']
        max_length = data.get('max_length', 200)
        
        summary = summarizer.summarize_property_description(text, max_length)
        
        return jsonify({
            "status": "success",
            "original_length": len(text),
            "summary_length": len(summary),
            "summary": summary
        })
        
    except Exception as e:
        logger.error(f"Error in summarize endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to summarize text: {str(e)}"
        }), 500

@ai_api.route('/analyze/property', methods=['POST'])
def analyze_property():
    """Analyze a property and generate enhanced details"""
    try:
        data = request.get_json()
        
        if not data or not isinstance(data, dict):
            return jsonify({
                "status": "error",
                "message": "Invalid property data"
            }), 400
        
        # Analyze the property
        result = summarizer.summarize_property_details(data)
        
        # Add categories
        if result:
            categorized = summarizer.categorize_property(result)
            return jsonify({
                "status": "success",
                "property_id": data.get('id'),
                "analysis": categorized
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to analyze property"
            }), 500
        
    except Exception as e:
        logger.error(f"Error in analyze_property endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to analyze property: {str(e)}"
        }), 500

@ai_api.route('/analyze/market', methods=['POST'])
def analyze_market():
    """Analyze market trends for a location"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Missing request data"
            }), 400
        
        location = data.get('location')
        days_back = data.get('days_back', 90)
        limit = data.get('limit', 100)
        
        analysis = market_analyzer.analyze_price_trends(location, days_back, limit)
        
        return jsonify({
            "status": "success",
            "location": location,
            "analysis": analysis
        })
        
    except Exception as e:
        logger.error(f"Error in analyze_market endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to analyze market: {str(e)}"
        }), 500

@ai_api.route('/analyze/investment', methods=['POST'])
def analyze_investment():
    """Analyze a property as an investment opportunity"""
    try:
        property_data = request.get_json()
        
        if not property_data or not isinstance(property_data, dict):
            return jsonify({
                "status": "error",
                "message": "Invalid property data"
            }), 400
        
        analysis = market_analyzer.analyze_property_investment(property_data)
        
        return jsonify({
            "status": "success",
            "property_id": property_data.get('id'),
            "analysis": analysis
        })
        
    except Exception as e:
        logger.error(f"Error in analyze_investment endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to analyze investment: {str(e)}"
        }), 500

@ai_api.route('/recommend', methods=['POST'])
def get_recommendations():
    """Get property recommendations based on preferences"""
    try:
        data = request.get_json()
        
        if not data or not isinstance(data, dict):
            return jsonify({
                "status": "error",
                "message": "Invalid preferences data"
            }), 400
        
        preferences = data.get('preferences', {})
        limit = data.get('limit', 5)
        
        recommendations = recommender.get_recommendations(preferences, limit)
        
        return jsonify({
            "status": "success",
            "recommendations": recommendations
        })
        
    except Exception as e:
        logger.error(f"Error in recommend endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to generate recommendations: {str(e)}"
        }), 500

@ai_api.route('/recommend/parse', methods=['POST'])
def parse_preferences():
    """Parse natural language preferences into structured data"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required parameter: query"
            }), 400
        
        query = data['query']
        preferences = recommender.parse_natural_language_preferences(query)
        
        return jsonify({
            "status": "success",
            "query": query,
            "preferences": preferences
        })
        
    except Exception as e:
        logger.error(f"Error in parse_preferences endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to parse preferences: {str(e)}"
        }), 500

@ai_api.route('/search', methods=['POST'])
def search_properties():
    """Search for properties using natural language"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required parameter: query"
            }), 400
        
        query = data['query']
        limit = data.get('limit', 10)
        
        results = nl_search.search(query, limit)
        
        return jsonify({
            "status": "success",
            "query": query,
            "results": results
        })
        
    except Exception as e:
        logger.error(f"Error in search endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to search properties: {str(e)}"
        }), 500

@ai_api.route('/answer', methods=['POST'])
def answer_question():
    """Answer a question about a specific property"""
    try:
        data = request.get_json()
        
        if not data or 'property_id' not in data or 'question' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing required parameters: property_id and/or question"
            }), 400
        
        property_id = data['property_id']
        question = data['question']
        
        answer = nl_search.answer_property_question(property_id, question)
        
        return jsonify({
            "status": "success",
            "property_id": property_id,
            "question": question,
            "answer": answer
        })
        
    except Exception as e:
        logger.error(f"Error in answer endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to answer question: {str(e)}"
        }), 500