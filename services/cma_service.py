"""
Service for Comparative Market Analysis (CMA).

This module provides methods for generating and retrieving CMA reports.
"""

import logging
import json
import os
import math
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from services.zillow_service import ZillowService
from services.narrpr_service import NarrprService
from ai.analyzer import ModelFactory

logger = logging.getLogger(__name__)

class CMAService:
    """Service for generating and retrieving CMA reports."""
    
    def __init__(self):
        """Initialize the CMA service."""
        self.zillow_service = ZillowService()
        self.narrpr_service = NarrprService()
        
        # In a production environment, this would be stored in a database
        # For development, we'll store reports in memory
        self.reports = {}
        self.next_id = 1
        
        # AI analyzer for generating insights
        try:
            self.ai_analyzer = ModelFactory.get_model('openai')
        except Exception as e:
            logger.warning(f"Failed to initialize AI analyzer: {str(e)}")
            self.ai_analyzer = None
    
    def create_report(self, data: Dict[str, Any]) -> int:
        """
        Create a new CMA report.
        
        Args:
            data (Dict[str, Any]): Report data
            
        Returns:
            int: Report ID
        """
        report_id = self.next_id
        self.next_id += 1
        
        # Create report
        report = {
            'id': report_id,
            'title': data.get('title', f"CMA Report - {data.get('subject_address', 'New Property')}"),
            'subject_address': data.get('subject_address'),
            'subject_city': data.get('subject_city'),
            'subject_state': data.get('subject_state'),
            'subject_zip': data.get('subject_zip'),
            'subject_beds': data.get('subject_beds', 3),
            'subject_baths': data.get('subject_baths', 2),
            'subject_sqft': data.get('subject_sqft', 1800),
            'subject_lot_size': data.get('subject_lot_size', 5000),
            'subject_year_built': data.get('subject_year_built', 2000),
            'subject_property_type': data.get('subject_property_type', 'Single Family'),
            'subject_price': data.get('subject_price'),
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'comparables': [],
            'insights': {}
        }
        
        # Store report
        self.reports[report_id] = report
        
        logger.info(f"Created CMA report with ID: {report_id}")
        
        return report_id
    
    def generate_report(self, report_id: int) -> Dict[str, Any]:
        """
        Generate a CMA report.
        
        Args:
            report_id (int): Report ID
            
        Returns:
            Dict[str, Any]: Generated report
        """
        # Get report
        report = self.get_report(report_id)
        
        # Update status
        report['status'] = 'processing'
        report['updated_at'] = datetime.now().isoformat()
        
        try:
            # Find comparable properties using both services
            zillow_comps = self.find_zillow_comparables(report)
            narrpr_comps = self.find_narrpr_comparables(report)
            
            # Combine and deduplicate comparable properties
            # In a real implementation, we would deduplicate by address
            all_comps = zillow_comps + narrpr_comps
            
            # Calculate similarity scores and adjustments
            for comp in all_comps:
                # Calculate similarity score (0-100)
                comp['similarity_score'] = self._calculate_similarity_score(report, comp)
                
                # Calculate adjustments
                self._calculate_adjustments(report, comp)
            
            # Sort by similarity score (descending)
            sorted_comps = sorted(all_comps, key=lambda x: x.get('similarity_score', 0), reverse=True)
            
            # Take top 6 most similar properties
            report['comparables'] = sorted_comps[:6]
            
            # Calculate recommended price
            recommended_price, confidence_score = self._calculate_recommended_price(report)
            report['recommended_price'] = recommended_price
            report['confidence_score'] = confidence_score
            
            # Calculate price range
            report['price_range_low'] = int(recommended_price * 0.95)
            report['price_range_high'] = int(recommended_price * 1.05)
            
            # Calculate price per square foot
            report['price_per_sqft'] = recommended_price / report['subject_sqft'] if report['subject_sqft'] else 0
            
            # Calculate average days on market
            active_comps = [comp for comp in report['comparables'] if comp.get('status') == 'active']
            report['avg_days_on_market'] = sum(comp.get('days_on_market', 0) for comp in active_comps) / len(active_comps) if active_comps else 0
            
            # Determine market trend
            report['market_trend'] = self._determine_market_trend(report)
            
            # Generate summary
            report['summary'] = self._generate_summary(report)
            
            # Generate AI insights
            report['insights'] = self._generate_insights(report)
            
            # Update status
            report['status'] = 'completed'
            report['updated_at'] = datetime.now().isoformat()
            
            logger.info(f"Generated CMA report with ID: {report_id}")
            
        except Exception as e:
            # Update status to error
            report['status'] = 'error'
            report['error_message'] = str(e)
            report['updated_at'] = datetime.now().isoformat()
            
            logger.exception(f"Error generating CMA report with ID {report_id}: {str(e)}")
            
        return report
    
    def get_report(self, report_id: int) -> Dict[str, Any]:
        """
        Get a CMA report by ID.
        
        Args:
            report_id (int): Report ID
            
        Returns:
            Dict[str, Any]: Report
            
        Raises:
            ValueError: If report not found
        """
        if report_id not in self.reports:
            raise ValueError(f"Report with ID {report_id} not found")
        
        return self.reports[report_id]
    
    def get_reports(self, user_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get a list of CMA reports.
        
        Args:
            user_id (str, optional): User ID to filter reports by
            limit (int, optional): Maximum number of reports to return
            
        Returns:
            List[Dict[str, Any]]: List of reports
        """
        # In a real implementation, we would filter by user_id
        reports = list(self.reports.values())
        
        # Sort by created_at (descending)
        sorted_reports = sorted(reports, key=lambda x: x.get('created_at', ''), reverse=True)
        
        # Limit results
        limited_reports = sorted_reports[:limit]
        
        return limited_reports
    
    def delete_report(self, report_id: int) -> bool:
        """
        Delete a CMA report.
        
        Args:
            report_id (int): Report ID
            
        Returns:
            bool: True if report was deleted, False otherwise
        """
        if report_id in self.reports:
            del self.reports[report_id]
            logger.info(f"Deleted CMA report with ID: {report_id}")
            return True
        
        return False
    
    def find_zillow_comparables(self, report: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find comparable properties from Zillow.
        
        Args:
            report (Dict[str, Any]): Report data
            
        Returns:
            List[Dict[str, Any]]: List of comparable properties
        """
        # Build search parameters for Zillow API
        params = {
            'location': f"{report['subject_city']}, {report['subject_state']} {report['subject_zip']}",
            'property_types': [report['subject_property_type']],
            'min_beds': max(1, report['subject_beds'] - 1),
            'max_beds': report['subject_beds'] + 1,
            'min_baths': max(1, report['subject_baths'] - 1),
            'max_baths': report['subject_baths'] + 1,
            'min_sqft': int(report['subject_sqft'] * 0.8),
            'max_sqft': int(report['subject_sqft'] * 1.2),
            'min_price': int(report['subject_price'] * 0.8) if report.get('subject_price') else None,
            'max_price': int(report['subject_price'] * 1.2) if report.get('subject_price') else None,
            # Add subject property information for use in mock responses
            'subject_address': report.get('subject_address'),
            'subject_city': report.get('subject_city'),
            'subject_state': report.get('subject_state'),
            'subject_zip': report.get('subject_zip'),
            'subject_beds': report.get('subject_beds'),
            'subject_baths': report.get('subject_baths'),
            'subject_sqft': report.get('subject_sqft'),
            'subject_lot_size': report.get('subject_lot_size'),
            'subject_year_built': report.get('subject_year_built'),
            'subject_property_type': report.get('subject_property_type'),
            'subject_price': report.get('subject_price')
        }
        
        # Find properties
        properties = self.zillow_service.find_properties(params)
        
        # Add source field
        for prop in properties:
            prop['source'] = 'Zillow'
            
            # Calculate distance (mock)
            prop['distance_miles'] = round(random.uniform(0.1, 2.0), 1)
        
        return properties
    
    def find_narrpr_comparables(self, report: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find comparable properties from NARRPR.
        
        Args:
            report (Dict[str, Any]): Report data
            
        Returns:
            List[Dict[str, Any]]: List of comparable properties
        """
        # Build search parameters for NARRPR
        params = {
            'location': f"{report['subject_city']}, {report['subject_state']} {report['subject_zip']}",
            'property_type': report['subject_property_type'],
            'min_beds': max(1, report['subject_beds'] - 1),
            'max_beds': report['subject_beds'] + 1,
            'min_baths': max(1, report['subject_baths'] - 1),
            'max_baths': report['subject_baths'] + 1,
            'min_sqft': int(report['subject_sqft'] * 0.8),
            'max_sqft': int(report['subject_sqft'] * 1.2),
            'min_price': int(report['subject_price'] * 0.8) if report.get('subject_price') else None,
            'max_price': int(report['subject_price'] * 1.2) if report.get('subject_price') else None,
            # Add subject property information for use in mock responses
            'subject_address': report.get('subject_address'),
            'subject_city': report.get('subject_city'),
            'subject_state': report.get('subject_state'),
            'subject_zip': report.get('subject_zip'),
            'subject_beds': report.get('subject_beds'),
            'subject_baths': report.get('subject_baths'),
            'subject_sqft': report.get('subject_sqft'),
            'subject_lot_size': report.get('subject_lot_size'),
            'subject_year_built': report.get('subject_year_built'),
            'subject_property_type': report.get('subject_property_type'),
            'subject_price': report.get('subject_price')
        }
        
        # Find comparable properties
        properties = self.narrpr_service.find_comparable_properties(params)
        
        # Add source field
        for prop in properties:
            prop['source'] = 'NARRPR'
            
            # Calculate distance (mock)
            prop['distance_miles'] = round(random.uniform(0.1, 2.0), 1)
        
        return properties
    
    def _calculate_similarity_score(self, report: Dict[str, Any], comp: Dict[str, Any]) -> int:
        """
        Calculate similarity score between subject property and comparable property.
        
        Args:
            report (Dict[str, Any]): Report data
            comp (Dict[str, Any]): Comparable property data
            
        Returns:
            int: Similarity score (0-100)
        """
        # Base score
        score = 100
        
        # Adjust for differences
        
        # Location
        distance_miles = comp.get('distance_miles', 0)
        if distance_miles > 0:
            # Reduce score by distance (up to 15 points)
            score -= min(15, distance_miles * 7.5)
        
        # Size (square footage)
        subject_sqft = report.get('subject_sqft', 0)
        comp_sqft = comp.get('sqft', 0)
        if subject_sqft > 0 and comp_sqft > 0:
            # Calculate percentage difference
            sqft_diff_pct = abs(subject_sqft - comp_sqft) / subject_sqft
            # Reduce score by percentage difference (up to 15 points)
            score -= min(15, sqft_diff_pct * 100)
        
        # Bedrooms
        subject_beds = report.get('subject_beds', 0)
        comp_beds = comp.get('beds', 0)
        if subject_beds > 0 and comp_beds > 0:
            # Reduce score by absolute difference (5 points per bedroom)
            score -= min(10, abs(subject_beds - comp_beds) * 5)
        
        # Bathrooms
        subject_baths = report.get('subject_baths', 0)
        comp_baths = comp.get('baths', 0)
        if subject_baths > 0 and comp_baths > 0:
            # Reduce score by absolute difference (5 points per bathroom)
            score -= min(10, abs(subject_baths - comp_baths) * 5)
        
        # Year built
        subject_year = report.get('subject_year_built', 0)
        comp_year = comp.get('year_built', 0)
        if subject_year > 0 and comp_year > 0:
            # Reduce score by age difference (1 point per 2 years, up to 10 points)
            score -= min(10, abs(subject_year - comp_year) / 2)
        
        # Property type
        if report.get('subject_property_type') != comp.get('property_type'):
            # Reduce score for different property type
            score -= 10
        
        # Lot size
        subject_lot = report.get('subject_lot_size', 0)
        comp_lot = comp.get('lot_size', 0)
        if subject_lot > 0 and comp_lot > 0:
            # Calculate percentage difference
            lot_diff_pct = abs(subject_lot - comp_lot) / subject_lot
            # Reduce score by percentage difference (up to 10 points)
            score -= min(10, lot_diff_pct * 50)
        
        # Status (prefer active listings)
        if comp.get('status') != 'active':
            # Reduce score for non-active listings
            score -= 5
        
        # Ensure score is between 0 and 100
        return max(0, min(100, int(score)))
    
    def _calculate_adjustments(self, report: Dict[str, Any], comp: Dict[str, Any]) -> None:
        """
        Calculate price adjustments for a comparable property.
        
        Args:
            report (Dict[str, Any]): Report data
            comp (Dict[str, Any]): Comparable property data
        """
        # Size adjustment
        subject_sqft = report.get('subject_sqft', 0)
        comp_sqft = comp.get('sqft', 0)
        price_per_sqft = comp.get('price', 0) / comp_sqft if comp_sqft > 0 else 0
        size_diff = subject_sqft - comp_sqft
        size_adjustment = size_diff * price_per_sqft
        comp['size_adjustment'] = int(size_adjustment)
        
        # Location adjustment (based on distance)
        # For far properties, adjust price up; for close properties, no adjustment
        distance_miles = comp.get('distance_miles', 0)
        location_adjustment = distance_miles * 5000 if distance_miles > 1 else 0
        comp['location_adjustment'] = int(location_adjustment)
        
        # Features adjustment (beds, baths)
        bed_diff = report.get('subject_beds', 0) - comp.get('beds', 0)
        bath_diff = report.get('subject_baths', 0) - comp.get('baths', 0)
        # Value per bed is approximately 5% of property value
        bed_value = comp.get('price', 0) * 0.05
        # Value per bath is approximately 4% of property value
        bath_value = comp.get('price', 0) * 0.04
        features_adjustment = (bed_diff * bed_value) + (bath_diff * bath_value)
        comp['features_adjustment'] = int(features_adjustment)
        
        # Condition/age adjustment
        subject_year = report.get('subject_year_built', 0)
        comp_year = comp.get('year_built', 0)
        year_diff = subject_year - comp_year
        # Value per year is approximately 0.5% of property value (if newer)
        year_value = comp.get('price', 0) * 0.005
        condition_adjustment = year_diff * year_value if year_diff > 0 else 0
        comp['condition_adjustment'] = int(condition_adjustment)
        
        # Calculate total adjustment
        total_adjustment = (
            comp.get('size_adjustment', 0) + 
            comp.get('location_adjustment', 0) + 
            comp.get('features_adjustment', 0) + 
            comp.get('condition_adjustment', 0)
        )
        comp['total_adjustment'] = int(total_adjustment)
        
        # Calculate adjusted price
        adjusted_price = comp.get('price', 0) + total_adjustment
        comp['adjusted_price'] = int(adjusted_price)
        
        # Calculate price per square foot
        comp['price_per_sqft'] = comp.get('price', 0) / comp_sqft if comp_sqft > 0 else 0
    
    def _calculate_recommended_price(self, report: Dict[str, Any]) -> tuple:
        """
        Calculate recommended price for the subject property.
        
        Args:
            report (Dict[str, Any]): Report data
            
        Returns:
            tuple: (recommended_price, confidence_score)
        """
        comparables = report.get('comparables', [])
        if not comparables:
            # Default price if no comparables
            return report.get('subject_price', 500000), 50
        
        # Calculate average of adjusted prices
        adjusted_prices = [comp.get('adjusted_price', 0) for comp in comparables]
        avg_price = sum(adjusted_prices) / len(adjusted_prices)
        
        # Calculate median of adjusted prices
        sorted_prices = sorted(adjusted_prices)
        mid = len(sorted_prices) // 2
        median_price = sorted_prices[mid] if len(sorted_prices) % 2 == 1 else (sorted_prices[mid-1] + sorted_prices[mid]) / 2
        
        # Calculate weighted average based on similarity score
        total_weight = sum(comp.get('similarity_score', 0) for comp in comparables)
        weighted_avg = sum(comp.get('adjusted_price', 0) * comp.get('similarity_score', 0) for comp in comparables) / total_weight if total_weight > 0 else avg_price
        
        # Calculate recommended price (weighted combination of median and weighted average)
        recommended_price = (median_price * 0.4) + (weighted_avg * 0.6)
        
        # Round to nearest $1,000
        rounded_price = math.ceil(recommended_price / 1000) * 1000
        
        # Calculate confidence score (0-100)
        # Higher if comparables are more similar and have less variance
        avg_similarity = sum(comp.get('similarity_score', 0) for comp in comparables) / len(comparables)
        
        # Calculate price variance (coefficient of variation)
        mean_price = sum(adjusted_prices) / len(adjusted_prices)
        variance = sum((price - mean_price) ** 2 for price in adjusted_prices) / len(adjusted_prices)
        std_dev = math.sqrt(variance)
        cv = (std_dev / mean_price) if mean_price > 0 else 1
        
        # Calculate confidence score
        # Higher similarity and lower variance = higher confidence
        confidence_score = int(avg_similarity * (1 - min(cv, 0.5) / 0.5))
        
        return rounded_price, confidence_score
    
    def _determine_market_trend(self, report: Dict[str, Any]) -> str:
        """
        Determine market trend based on comparable properties.
        
        Args:
            report (Dict[str, Any]): Report data
            
        Returns:
            str: Market trend ('up', 'down', or 'stable')
        """
        # In a real implementation, we would look at historical data
        # For now, we'll use a simple heuristic based on days on market
        
        comparables = report.get('comparables', [])
        if not comparables:
            return 'stable'
        
        # Calculate average days on market for active listings
        active_comps = [comp for comp in comparables if comp.get('status') == 'active']
        avg_dom = sum(comp.get('days_on_market', 0) for comp in active_comps) / len(active_comps) if active_comps else 0
        
        # Check for price reductions
        price_reductions = sum(1 for comp in comparables if comp.get('original_price', 0) > comp.get('price', 0))
        
        # Determine trend
        if avg_dom < 20 and price_reductions <= 1:
            return 'up'  # Hot market
        elif avg_dom > 45 or price_reductions >= len(comparables) // 2:
            return 'down'  # Slow market
        else:
            return 'stable'  # Stable market
    
    def _generate_summary(self, report: Dict[str, Any]) -> str:
        """
        Generate a summary of the CMA report.
        
        Args:
            report (Dict[str, Any]): Report data
            
        Returns:
            str: Summary text
        """
        market_trend = report.get('market_trend', 'stable')
        trend_text = "rising" if market_trend == 'up' else "declining" if market_trend == 'down' else "stable"
        
        summary = f"Based on {len(report.get('comparables', []))} comparable properties in {report.get('subject_city')}, "
        summary += f"the recommended price is ${report.get('recommended_price', 0):,}. "
        summary += f"This reflects a {trend_text} market with an average of {int(report.get('avg_days_on_market', 0))} days on market."
        
        return summary
    
    def _generate_insights(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate AI-powered insights for the report.
        
        Args:
            report (Dict[str, Any]): Report data
            
        Returns:
            Dict[str, Any]: Insights
        """
        # Default insights
        insights = {
            'pricing_strategy': "Price the property at market value to attract qualified buyers while maximizing your return.",
            'property_strengths': [
                "Located in a desirable neighborhood",
                "Good condition with updated features",
                "Competitive price per square foot"
            ],
            'property_weaknesses': [
                "Similar to many other properties in the area",
                "May need some updates to stand out from competition",
                "Limited outdoor space compared to nearby properties"
            ],
            'marketing_recommendations': [
                "Highlight unique features in listing description",
                "Professional photography to showcase the property's best attributes",
                "Virtual tour to attract out-of-area buyers",
                "Open house during peak weekend hours"
            ],
            'negotiation_tips': [
                "Be prepared to highlight recent improvements",
                "Have inspection reports ready to share",
                "Consider offering closing cost assistance rather than reducing price",
                "Set a clear bottom-line price before negotiations begin"
            ],
            'improvement_recommendations': [
                "Minor kitchen updates could increase value significantly",
                "Fresh paint in neutral colors throughout",
                "Improve curb appeal with landscaping updates",
                "Ensure all maintenance items are addressed before listing"
            ]
        }
        
        # Try to generate AI insights if available
        if self.ai_analyzer:
            try:
                # Prepare prompt for AI
                prompt = self._prepare_ai_prompt(report)
                
                # Get AI response
                response = self.ai_analyzer.generate_text(prompt)
                
                # Parse AI response
                ai_insights = self._parse_ai_insights(response)
                
                # Update insights with AI-generated content
                insights.update(ai_insights)
                
            except Exception as e:
                logger.warning(f"Failed to generate AI insights: {str(e)}")
        
        return insights
    
    def _prepare_ai_prompt(self, report: Dict[str, Any]) -> str:
        """
        Prepare prompt for AI insight generation.
        
        Args:
            report (Dict[str, Any]): Report data
            
        Returns:
            str: Prompt for AI
        """
        comparables = report.get('comparables', [])
        
        prompt = f"""
        Analyze this Comparative Market Analysis (CMA) report and provide specific insights.
        
        Subject Property:
        - Address: {report.get('subject_address')}, {report.get('subject_city')}, {report.get('subject_state')} {report.get('subject_zip')}
        - Details: {report.get('subject_beds')} bed, {report.get('subject_baths')} bath, {report.get('subject_sqft')} sq ft
        - Year Built: {report.get('subject_year_built')}
        - Property Type: {report.get('subject_property_type')}
        - Recommended Price: ${report.get('recommended_price', 0):,}
        - Price Per Sq Ft: ${report.get('price_per_sqft', 0):.2f}
        
        Market Details:
        - Market Trend: {report.get('market_trend', 'stable')}
        - Average Days on Market: {int(report.get('avg_days_on_market', 0))}
        
        Comparable Properties:
        """
        
        for i, comp in enumerate(comparables[:3], 1):
            prompt += f"""
            Comp {i}:
            - Price: ${comp.get('price', 0):,} (Adjusted: ${comp.get('adjusted_price', 0):,})
            - Address: {comp.get('address')}, {comp.get('city')}, {comp.get('state')} {comp.get('zip_code')}
            - Details: {comp.get('beds')} bed, {comp.get('baths')} bath, {comp.get('sqft')} sq ft
            - Year Built: {comp.get('year_built')}
            - Days on Market: {comp.get('days_on_market')}
            - Similarity Score: {comp.get('similarity_score')}%
            """
        
        prompt += """
        Based on this data, provide the following insights in JSON format:
        1. "pricing_strategy": A paragraph on the optimal pricing strategy
        2. "property_strengths": An array of 3-4 strengths of the subject property compared to its competition
        3. "property_weaknesses": An array of 3-4 potential weaknesses or challenges
        4. "marketing_recommendations": An array of 4-5 specific marketing recommendations
        5. "negotiation_tips": An array of 4-5 negotiation recommendations for the seller
        6. "improvement_recommendations": An array of 4-5 suggested improvements that could increase value
        
        Make the insights specific to the property and local market conditions. Format response as valid JSON.
        """
        
        return prompt
    
    def _parse_ai_insights(self, response: str) -> Dict[str, Any]:
        """
        Parse AI response into structured insights.
        
        Args:
            response (str): AI response
            
        Returns:
            Dict[str, Any]: Structured insights
        """
        try:
            # Try to parse as JSON
            insights = json.loads(response)
            
            # Validate that we have the expected keys
            expected_keys = [
                'pricing_strategy', 
                'property_strengths', 
                'property_weaknesses',
                'marketing_recommendations', 
                'negotiation_tips', 
                'improvement_recommendations'
            ]
            
            for key in expected_keys:
                if key not in insights:
                    logger.warning(f"Missing key in AI insights: {key}")
                    insights[key] = []
            
            return insights
            
        except json.JSONDecodeError:
            logger.warning("Failed to parse AI response as JSON")
            
            # Try to extract sections from text
            insights = {}
            
            # Parse pricing strategy
            pricing_match = response.split("pricing_strategy")[1].split("\n")[0] if "pricing_strategy" in response else ""
            if pricing_match:
                insights['pricing_strategy'] = pricing_match.strip('": ,')
            
            # Function to extract list items
            def extract_list(section_name):
                if section_name not in response:
                    return []
                
                section_text = response.split(section_name)[1].split("\n\n")[0]
                items = []
                
                for line in section_text.split("\n"):
                    if line.strip().startswith("-") or line.strip().startswith("*"):
                        items.append(line.strip("- *").strip())
                
                return items
            
            # Extract lists
            insights['property_strengths'] = extract_list("property_strengths")
            insights['property_weaknesses'] = extract_list("property_weaknesses")
            insights['marketing_recommendations'] = extract_list("marketing_recommendations")
            insights['negotiation_tips'] = extract_list("negotiation_tips")
            insights['improvement_recommendations'] = extract_list("improvement_recommendations")
            
            return insights