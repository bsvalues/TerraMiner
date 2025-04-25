"""
Service for Comparative Market Analysis (CMA) functionality.

This module provides services for generating CMA reports, finding
comparable properties, and analyzing market data.
"""

import logging
import json
import math
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app import db
from models.cma import CMAReport, Comparable
from services.zillow_service import ZillowService
from services.narrpr_service import NarrprService
from ai.models.model_factory import ModelFactory

logger = logging.getLogger(__name__)

class CMAService:
    """Service for generating Comparative Market Analysis reports."""
    
    def __init__(self):
        """Initialize the CMA service."""
        self.zillow_service = ZillowService()
        self.narrpr_service = NarrprService()
        self.model_factory = ModelFactory()
    
    def create_report(self, data: Dict[str, Any]) -> int:
        """
        Create a new CMA report.
        
        Args:
            data (Dict[str, Any]): The report data with subject property details
            
        Returns:
            int: The ID of the created report
        """
        try:
            # Create a new report
            report = CMAReport(
                title=data.get('title', f"CMA Report - {data.get('subject_address')}"),
                subject_property_id=data.get('subject_property_id', ''),
                subject_address=data.get('subject_address', ''),
                subject_city=data.get('subject_city', ''),
                subject_state=data.get('subject_state', ''),
                subject_zip=data.get('subject_zip', ''),
                subject_price=data.get('subject_price'),
                subject_sqft=data.get('subject_sqft'),
                subject_beds=data.get('subject_beds'),
                subject_baths=data.get('subject_baths'),
                subject_year_built=data.get('subject_year_built'),
                subject_lot_size=data.get('subject_lot_size'),
                subject_property_type=data.get('subject_property_type'),
                search_radius_miles=data.get('search_radius_miles', 1.0),
                min_price=data.get('min_price'),
                max_price=data.get('max_price'),
                min_sqft=data.get('min_sqft'),
                max_sqft=data.get('max_sqft'),
                min_beds=data.get('min_beds'),
                max_beds=data.get('max_beds'),
                min_baths=data.get('min_baths'),
                max_baths=data.get('max_baths'),
                property_types=data.get('property_types'),
                max_days_on_market=data.get('max_days_on_market'),
                created_by=data.get('created_by'),
                status='pending'
            )
            
            db.session.add(report)
            db.session.commit()
            
            # Return the report ID
            return report.id
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error creating CMA report: {str(e)}")
            raise
    
    def generate_report(self, report_id: int) -> Dict[str, Any]:
        """
        Generate a CMA report by finding comparable properties and analyzing them.
        
        Args:
            report_id (int): The ID of the report to generate
            
        Returns:
            Dict[str, Any]: The updated report data
        """
        try:
            # Get the report
            report = CMAReport.query.get(report_id)
            if not report:
                raise ValueError(f"Report with ID {report_id} not found")
            
            # Update status
            report.status = 'processing'
            db.session.commit()
            
            try:
                # Find comparable properties
                comps = self.find_comparable_properties(report)
                
                # Save the comparables
                self.save_comparables(report, comps)
                
                # Analyze the data
                analysis_results = self.analyze_comparables(report, comps)
                
                # Generate AI insights
                insights = self.generate_insights(report, comps)
                
                # Update the report with analysis results
                for key, value in analysis_results.items():
                    if hasattr(report, key):
                        setattr(report, key, value)
                
                report.insights = insights
                report.status = 'completed'
                report.updated_at = datetime.utcnow()
                
                db.session.commit()
                
                return report.to_dict()
                
            except Exception as e:
                logger.exception(f"Error generating CMA report: {str(e)}")
                report.status = 'error'
                report.error_message = str(e)
                db.session.commit()
                raise
                
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error generating CMA report: {str(e)}")
            raise
    
    def find_comparable_properties(self, report: CMAReport) -> List[Dict[str, Any]]:
        """
        Find comparable properties for the given report.
        
        Args:
            report (CMAReport): The CMA report
            
        Returns:
            List[Dict[str, Any]]: List of comparable properties
        """
        logger.info(f"Finding comparable properties for report {report.id}")
        
        # Determine price range (±20% if not specified)
        min_price = report.min_price
        max_price = report.max_price
        
        if report.subject_price and not min_price:
            min_price = report.subject_price * 0.8
        if report.subject_price and not max_price:
            max_price = report.subject_price * 1.2
            
        # Determine square footage range (±20% if not specified)
        min_sqft = report.min_sqft
        max_sqft = report.max_sqft
        
        if report.subject_sqft and not min_sqft:
            min_sqft = report.subject_sqft * 0.8
        if report.subject_sqft and not max_sqft:
            max_sqft = report.subject_sqft * 1.2
            
        # Create search parameters
        params = {
            'location': f"{report.subject_city}, {report.subject_state}",
            'zip_code': report.subject_zip,
            'radius_miles': report.search_radius_miles,
            'min_price': min_price,
            'max_price': max_price,
            'min_sqft': min_sqft,
            'max_sqft': max_sqft,
            'min_beds': report.min_beds or max(1, report.subject_beds - 1) if report.subject_beds else None,
            'max_beds': report.max_beds or (report.subject_beds + 1) if report.subject_beds else None,
            'min_baths': report.min_baths or max(1, report.subject_baths - 1) if report.subject_baths else None,
            'max_baths': report.max_baths or (report.subject_baths + 1) if report.subject_baths else None,
            'property_types': report.property_types.split(',') if report.property_types else None,
            'max_days_on_market': report.max_days_on_market or 180,
            'limit': 10  # Limit results to 10 properties
        }
        
        # Try Zillow service first
        try:
            comps = self.zillow_service.find_properties(params)
            if comps and len(comps) >= 3:
                # Calculate distance and additional metrics
                for comp in comps:
                    self._calculate_additional_metrics(report, comp)
                return comps
        except Exception as e:
            logger.warning(f"Error using Zillow service: {str(e)}")
        
        # Fallback to NARRPR service
        try:
            comps = self.narrpr_service.find_comparable_properties(params)
            if comps and len(comps) >= 3:
                # Calculate distance and additional metrics
                for comp in comps:
                    self._calculate_additional_metrics(report, comp)
                return comps
        except Exception as e:
            logger.warning(f"Error using NARRPR service: {str(e)}")
        
        # If we reach here, we couldn't find enough comps
        if not comps or len(comps) < 3:
            # Expand search criteria and try again with Zillow
            expanded_params = params.copy()
            expanded_params['radius_miles'] = params['radius_miles'] * 2
            expanded_params['min_price'] = params['min_price'] * 0.7 if params['min_price'] else None
            expanded_params['max_price'] = params['max_price'] * 1.3 if params['max_price'] else None
            
            try:
                comps = self.zillow_service.find_properties(expanded_params)
                if comps and len(comps) >= 3:
                    # Calculate distance and additional metrics
                    for comp in comps:
                        self._calculate_additional_metrics(report, comp)
                    return comps
            except Exception as e:
                logger.warning(f"Error using expanded Zillow search: {str(e)}")
        
        # If we still don't have enough comps, raise an error
        if not comps or len(comps) < 3:
            raise ValueError("Could not find enough comparable properties. Please adjust search criteria.")
        
        return comps
    
    def _calculate_additional_metrics(self, report: CMAReport, comp: Dict[str, Any]) -> None:
        """
        Calculate additional metrics for a comparable property.
        
        Args:
            report (CMAReport): The CMA report
            comp (Dict[str, Any]): The comparable property data
        """
        # Calculate price per square foot
        if comp.get('sqft') and comp.get('sqft') > 0:
            comp['price_per_sqft'] = comp.get('price', 0) / comp.get('sqft')
        
        # Calculate distance from subject property (if coordinates available)
        if comp.get('latitude') and comp.get('longitude') and report.additional_data and report.additional_data.get('latitude') and report.additional_data.get('longitude'):
            comp['distance_miles'] = self._calculate_distance(
                float(report.additional_data.get('latitude')),
                float(report.additional_data.get('longitude')),
                float(comp.get('latitude')),
                float(comp.get('longitude'))
            )
        
        # Calculate adjustments
        self._calculate_adjustments(report, comp)
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the distance between two points using the Haversine formula.
        
        Args:
            lat1 (float): Latitude of point 1
            lon1 (float): Longitude of point 1
            lat2 (float): Latitude of point 2
            lon2 (float): Longitude of point 2
            
        Returns:
            float: Distance in miles
        """
        # Convert latitude and longitude from degrees to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlon = lon2_rad - lon1_rad
        dlat = lat2_rad - lat1_rad
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 3956  # Radius of Earth in miles
        
        return c * r
    
    def _calculate_adjustments(self, report: CMAReport, comp: Dict[str, Any]) -> None:
        """
        Calculate price adjustments for a comparable property.
        
        Args:
            report (CMAReport): The CMA report
            comp (Dict[str, Any]): The comparable property data
        """
        adjustments = {
            'location_adjustment': 0.0,
            'condition_adjustment': 0.0,
            'size_adjustment': 0.0,
            'features_adjustment': 0.0,
            'time_adjustment': 0.0
        }
        
        # Size adjustment (based on price per square foot)
        if report.subject_sqft and comp.get('sqft') and comp.get('price_per_sqft'):
            sqft_difference = report.subject_sqft - comp.get('sqft', 0)
            adjustments['size_adjustment'] = sqft_difference * comp.get('price_per_sqft', 0)
        
        # Bed/bath adjustments
        if report.subject_beds and comp.get('beds'):
            bed_difference = report.subject_beds - comp.get('beds', 0)
            adjustments['features_adjustment'] += bed_difference * 5000  # $5k per bedroom
            
        if report.subject_baths and comp.get('baths'):
            bath_difference = report.subject_baths - comp.get('baths', 0)
            adjustments['features_adjustment'] += bath_difference * 7500  # $7.5k per bathroom
        
        # Location adjustment (based on distance if available)
        if comp.get('distance_miles'):
            adjustments['location_adjustment'] = comp.get('distance_miles', 0) * 2000  # $2k per mile
        
        # Age/condition adjustment
        if report.subject_year_built and comp.get('year_built'):
            year_difference = report.subject_year_built - comp.get('year_built', 0)
            if year_difference > 0:
                # Subject property is newer
                adjustments['condition_adjustment'] = year_difference * 1000  # $1k per year newer
            else:
                # Subject property is older
                adjustments['condition_adjustment'] = year_difference * 500  # $500 per year older
        
        # Time adjustment (for sales more than 3 months old)
        if comp.get('sale_date'):
            sale_date = datetime.fromisoformat(comp.get('sale_date')) if isinstance(comp.get('sale_date'), str) else comp.get('sale_date')
            days_since_sale = (datetime.utcnow() - sale_date).days if sale_date else 0
            
            if days_since_sale > 90:  # More than 3 months old
                months_old = days_since_sale / 30
                adjustments['time_adjustment'] = months_old * 1000  # $1k per month
        
        # Calculate total adjustment
        total_adjustment = sum(adjustments.values())
        
        # Calculate adjusted price
        adjusted_price = comp.get('price', 0) + total_adjustment
        
        # Add adjustments to comp
        comp.update(adjustments)
        comp['total_adjustment'] = total_adjustment
        comp['adjusted_price'] = adjusted_price
        
        # Calculate similarity score (0-100)
        similarity_score = 100
        
        # Reduce score based on differences
        if report.subject_sqft and comp.get('sqft'):
            sqft_diff_pct = abs(report.subject_sqft - comp.get('sqft', 0)) / report.subject_sqft
            similarity_score -= min(20, sqft_diff_pct * 100)  # Up to 20 points for size difference
            
        if report.subject_beds and comp.get('beds'):
            bed_diff = abs(report.subject_beds - comp.get('beds', 0))
            similarity_score -= min(15, bed_diff * 7.5)  # Up to 15 points for bedroom difference
            
        if report.subject_baths and comp.get('baths'):
            bath_diff = abs(report.subject_baths - comp.get('baths', 0))
            similarity_score -= min(10, bath_diff * 5)  # Up to 10 points for bathroom difference
            
        if comp.get('distance_miles'):
            similarity_score -= min(20, comp.get('distance_miles', 0) * 5)  # Up to 20 points for distance
            
        if report.subject_year_built and comp.get('year_built'):
            year_diff = abs(report.subject_year_built - comp.get('year_built', 0))
            similarity_score -= min(15, year_diff * 0.5)  # Up to 15 points for age difference
        
        # Ensure score is between 0 and 100
        similarity_score = max(0, min(100, similarity_score))
        comp['similarity_score'] = similarity_score
    
    def save_comparables(self, report: CMAReport, comps: List[Dict[str, Any]]) -> None:
        """
        Save comparable properties to the database.
        
        Args:
            report (CMAReport): The CMA report
            comps (List[Dict[str, Any]]): List of comparable properties
        """
        # Delete existing comparables for this report
        Comparable.query.filter_by(report_id=report.id).delete()
        
        # Add new comparables
        for comp_data in comps:
            comp = Comparable(
                report_id=report.id,
                property_id=comp_data.get('property_id', ''),
                address=comp_data.get('address', ''),
                city=comp_data.get('city', ''),
                state=comp_data.get('state', ''),
                zip_code=comp_data.get('zip_code', ''),
                price=comp_data.get('price', 0),
                original_price=comp_data.get('original_price'),
                sqft=comp_data.get('sqft'),
                beds=comp_data.get('beds'),
                baths=comp_data.get('baths'),
                year_built=comp_data.get('year_built'),
                lot_size=comp_data.get('lot_size'),
                property_type=comp_data.get('property_type'),
                days_on_market=comp_data.get('days_on_market'),
                status=comp_data.get('status'),
                sale_date=comp_data.get('sale_date'),
                distance_miles=comp_data.get('distance_miles'),
                price_per_sqft=comp_data.get('price_per_sqft'),
                location_adjustment=comp_data.get('location_adjustment', 0),
                condition_adjustment=comp_data.get('condition_adjustment', 0),
                size_adjustment=comp_data.get('size_adjustment', 0),
                features_adjustment=comp_data.get('features_adjustment', 0),
                time_adjustment=comp_data.get('time_adjustment', 0),
                total_adjustment=comp_data.get('total_adjustment', 0),
                adjusted_price=comp_data.get('adjusted_price'),
                similarity_score=comp_data.get('similarity_score'),
                photos_url=comp_data.get('photos_url'),
                details_url=comp_data.get('details_url'),
                additional_data=comp_data.get('additional_data')
            )
            db.session.add(comp)
        
        db.session.commit()
    
    def analyze_comparables(self, report: CMAReport, comps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze comparable properties to derive insights.
        
        Args:
            report (CMAReport): The CMA report
            comps (List[Dict[str, Any]]): List of comparable properties
            
        Returns:
            Dict[str, Any]: Analysis results
        """
        # Initialize results
        results = {
            'recommended_price': None,
            'price_per_sqft': None,
            'avg_days_on_market': None,
            'market_trend': None,
            'confidence_score': None,
            'price_range_low': None,
            'price_range_high': None,
            'summary': None
        }
        
        # Filter comps to exclude outliers (optional)
        filtered_comps = comps
        
        # Calculate price metrics
        if filtered_comps:
            # Get adjusted prices
            adjusted_prices = [comp.get('adjusted_price', comp.get('price', 0)) for comp in filtered_comps if comp.get('adjusted_price') or comp.get('price')]
            
            if adjusted_prices:
                # Calculate average and median
                avg_price = sum(adjusted_prices) / len(adjusted_prices)
                median_price = sorted(adjusted_prices)[len(adjusted_prices) // 2]
                
                # Calculate weighted average based on similarity scores
                total_weight = sum(comp.get('similarity_score', 50) for comp in filtered_comps)
                if total_weight > 0:
                    weighted_avg = sum(comp.get('adjusted_price', comp.get('price', 0)) * comp.get('similarity_score', 50) for comp in filtered_comps) / total_weight
                else:
                    weighted_avg = avg_price
                
                # Set recommended price (favor weighted average)
                results['recommended_price'] = round(weighted_avg)
                
                # Calculate price range
                std_dev = math.sqrt(sum((p - avg_price) ** 2 for p in adjusted_prices) / len(adjusted_prices))
                results['price_range_low'] = max(0, round(weighted_avg - std_dev))
                results['price_range_high'] = round(weighted_avg + std_dev)
        
        # Calculate price per square foot
        if filtered_comps:
            price_per_sqft_values = [comp.get('price_per_sqft', 0) for comp in filtered_comps if comp.get('price_per_sqft')]
            if price_per_sqft_values:
                results['price_per_sqft'] = sum(price_per_sqft_values) / len(price_per_sqft_values)
        
        # Calculate average days on market
        if filtered_comps:
            dom_values = [comp.get('days_on_market', 0) for comp in filtered_comps if comp.get('days_on_market') is not None]
            if dom_values:
                results['avg_days_on_market'] = sum(dom_values) / len(dom_values)
        
        # Determine market trend
        # This is simplified; real implementation would use historical data
        if filtered_comps:
            # Sort by sale date (if available)
            dated_comps = [comp for comp in filtered_comps if comp.get('sale_date')]
            if dated_comps and len(dated_comps) >= 3:
                dated_comps.sort(key=lambda x: x.get('sale_date'))
                oldest_third = dated_comps[:len(dated_comps)//3]
                newest_third = dated_comps[-len(dated_comps)//3:]
                
                oldest_avg_price = sum(comp.get('price', 0) for comp in oldest_third) / len(oldest_third)
                newest_avg_price = sum(comp.get('price', 0) for comp in newest_third) / len(newest_third)
                
                price_change = (newest_avg_price - oldest_avg_price) / oldest_avg_price
                
                if price_change > 0.05:
                    results['market_trend'] = 'up'
                elif price_change < -0.05:
                    results['market_trend'] = 'down'
                else:
                    results['market_trend'] = 'stable'
        
        # Calculate confidence score
        # Based on number of comps, similarity, and data completeness
        confidence = 50  # Base score
        
        # More comps = higher confidence
        comp_count = len(filtered_comps)
        confidence += min(25, comp_count * 5)  # Up to +25 for comps
        
        # Higher similarity = higher confidence
        if filtered_comps:
            avg_similarity = sum(comp.get('similarity_score', 0) for comp in filtered_comps) / len(filtered_comps)
            confidence += min(15, avg_similarity * 0.15)  # Up to +15 for similarity
        
        # Recent sales = higher confidence
        if dated_comps:
            recent_sales = [comp for comp in dated_comps if comp.get('sale_date') and (datetime.utcnow() - comp.get('sale_date')).days < 90]
            confidence += min(10, len(recent_sales) * 2)  # Up to +10 for recent sales
        
        results['confidence_score'] = min(100, max(0, confidence))
        
        # Generate summary
        summary_parts = []
        
        if results['recommended_price']:
            summary_parts.append(f"Based on {comp_count} comparable properties, the recommended price is ${results['recommended_price']:,}.")
            
        if results['price_range_low'] and results['price_range_high']:
            summary_parts.append(f"The suggested price range is ${results['price_range_low']:,} to ${results['price_range_high']:,}.")
            
        if results['price_per_sqft']:
            summary_parts.append(f"The average price per square foot is ${results['price_per_sqft']:.2f}.")
            
        if results['avg_days_on_market']:
            summary_parts.append(f"Properties in this area typically sell in {int(results['avg_days_on_market'])} days.")
            
        if results['market_trend']:
            trend_text = {
                'up': 'rising',
                'down': 'declining',
                'stable': 'stable'
            }.get(results['market_trend'], 'stable')
            summary_parts.append(f"The market in this area is currently {trend_text}.")
            
        if results['confidence_score']:
            confidence_level = 'high' if results['confidence_score'] >= 80 else 'moderate' if results['confidence_score'] >= 50 else 'low'
            summary_parts.append(f"Confidence in this analysis is {confidence_level} ({results['confidence_score']}%).")
        
        results['summary'] = ' '.join(summary_parts)
        
        return results
    
    def generate_insights(self, report: CMAReport, comps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate AI-powered insights from the CMA data.
        
        Args:
            report (CMAReport): The CMA report
            comps (List[Dict[str, Any]]): List of comparable properties
            
        Returns:
            Dict[str, Any]: Insights and recommendations
        """
        try:
            # Initialize insights
            insights = {
                'pricing_strategy': '',
                'property_strengths': [],
                'property_weaknesses': [],
                'marketing_recommendations': [],
                'negotiation_tips': [],
                'improvement_recommendations': []
            }
            
            # Prepare data for AI analysis
            analysis_data = {
                'subject_property': {
                    'address': report.subject_address,
                    'city': report.subject_city,
                    'state': report.subject_state,
                    'zip': report.subject_zip,
                    'price': report.subject_price,
                    'sqft': report.subject_sqft,
                    'beds': report.subject_beds,
                    'baths': report.subject_baths,
                    'year_built': report.subject_year_built,
                    'lot_size': report.subject_lot_size,
                    'property_type': report.subject_property_type
                },
                'comparable_properties': comps[:5],  # Use top 5 comparables,
                'market_metrics': {
                    'avg_price': sum(comp.get('price', 0) for comp in comps) / len(comps) if comps else 0,
                    'avg_price_per_sqft': sum(comp.get('price_per_sqft', 0) for comp in comps if comp.get('price_per_sqft')) / sum(1 for comp in comps if comp.get('price_per_sqft')) if any(comp.get('price_per_sqft') for comp in comps) else 0,
                    'avg_days_on_market': sum(comp.get('days_on_market', 0) for comp in comps if comp.get('days_on_market') is not None) / sum(1 for comp in comps if comp.get('days_on_market') is not None) if any(comp.get('days_on_market') is not None for comp in comps) else 0,
                    'recommended_price': report.recommended_price,
                    'price_range_low': report.price_range_low,
                    'price_range_high': report.price_range_high,
                    'market_trend': report.market_trend
                }
            }
            
            # Format data as JSON string
            data_str = json.dumps(analysis_data, indent=2)
            
            # Generate insights using OpenAI
            ai_client = self.model_factory.get_client('openai')
            system_prompt = "You are a real estate market analysis expert. Analyze the data provided and generate insights and recommendations."
            
            user_prompt = f"""Analyze this Comparative Market Analysis data and provide strategic insights:

{data_str}

Generate the following insights in JSON format:
1. pricing_strategy: A concise paragraph on recommended pricing strategy based on the comps and market conditions.
2. property_strengths: List of 3-5 potential strengths of the subject property compared to comps.
3. property_weaknesses: List of 3-5 potential weaknesses of the subject property compared to comps.
4. marketing_recommendations: List of 3-5 marketing recommendations.
5. negotiation_tips: List of 3-5 negotiation tips for the seller.
6. improvement_recommendations: List of 3-5 improvements that could increase property value.

Respond with JSON only in this format:
{{
  "pricing_strategy": "string",
  "property_strengths": ["string", "string", ...],
  "property_weaknesses": ["string", "string", ...],
  "marketing_recommendations": ["string", "string", ...],
  "negotiation_tips": ["string", "string", ...],
  "improvement_recommendations": ["string", "string", ...]
}}
"""
            
            # Get response from OpenAI
            response_text = ai_client.generate_structured_completion(system_prompt, user_prompt)
            
            # Parse the JSON response
            try:
                ai_insights = json.loads(response_text)
                
                # Update insights with AI response
                for key in insights.keys():
                    if key in ai_insights:
                        insights[key] = ai_insights[key]
                        
            except json.JSONDecodeError:
                logger.error("Failed to parse AI insights as JSON")
                # Extract what looks like JSON content using a simplified approach
                try:
                    json_start = response_text.find('{')
                    json_end = response_text.rfind('}') + 1
                    if json_start >= 0 and json_end > json_start:
                        json_str = response_text[json_start:json_end]
                        ai_insights = json.loads(json_str)
                        
                        # Update insights with AI response
                        for key in insights.keys():
                            if key in ai_insights:
                                insights[key] = ai_insights[key]
                except:
                    # Fallback to basic insights if all else fails
                    insights['pricing_strategy'] = "Based on market analysis, a competitive pricing strategy is recommended."
            
            return insights
            
        except Exception as e:
            logger.exception(f"Error generating AI insights: {str(e)}")
            # Return basic insights as fallback
            return {
                'pricing_strategy': "Based on the comparable properties, a competitive pricing strategy is recommended.",
                'property_strengths': ["Location", "Property features", "Market conditions"],
                'property_weaknesses': ["Competition in the area", "Potential market challenges"],
                'marketing_recommendations': ["Highlight key features", "Consider professional photography", "Focus on digital marketing"],
                'negotiation_tips': ["Know your bottom line", "Be prepared with comp data", "Consider timing in negotiations"],
                'improvement_recommendations': ["Consider cosmetic updates", "Focus on curb appeal", "Address any maintenance issues"]
            }
    
    def get_report(self, report_id: int) -> Dict[str, Any]:
        """
        Get a CMA report by ID.
        
        Args:
            report_id (int): The ID of the report
            
        Returns:
            Dict[str, Any]: The report data including comparables
        """
        report = CMAReport.query.get(report_id)
        if not report:
            raise ValueError(f"Report with ID {report_id} not found")
        
        report_dict = report.to_dict()
        
        # Add comparables
        comps = Comparable.query.filter_by(report_id=report_id).all()
        report_dict['comparables'] = [comp.to_dict() for comp in comps]
        
        return report_dict
    
    def get_reports(self, user_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get a list of CMA reports.
        
        Args:
            user_id (str, optional): Filter by user ID
            limit (int): Maximum number of reports to return
            
        Returns:
            List[Dict[str, Any]]: List of reports
        """
        query = CMAReport.query
        
        if user_id:
            query = query.filter_by(created_by=user_id)
            
        reports = query.order_by(CMAReport.created_at.desc()).limit(limit).all()
        
        return [report.to_dict() for report in reports]
    
    def delete_report(self, report_id: int) -> bool:
        """
        Delete a CMA report.
        
        Args:
            report_id (int): The ID of the report to delete
            
        Returns:
            bool: True if deleted, False if not found
        """
        report = CMAReport.query.get(report_id)
        if not report:
            return False
        
        try:
            # Delete comparables
            Comparable.query.filter_by(report_id=report_id).delete()
            
            # Delete report
            db.session.delete(report)
            db.session.commit()
            
            return True
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error deleting CMA report: {str(e)}")
            raise