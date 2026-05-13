use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct MarketDataPoint {
    pub price: f64,
    pub sqft: Option<f64>,
    pub year_built: Option<i32>,
    pub city: String,
}

#[derive(Serialize)]
pub struct MarketAnalysis {
    pub median_price: f64,
    pub mean_price: f64,
    pub price_std_dev: f64,
    pub median_ppsf: f64,
    pub price_range: PriceRange,
    pub city_breakdown: Vec<CityStats>,
    pub market_health: String,
    pub market_score: f64,
}

#[derive(Serialize)]
pub struct PriceRange {
    pub min: f64,
    pub max: f64,
    pub q1: f64,
    pub q3: f64,
}

#[derive(Serialize)]
pub struct CityStats {
    pub city: String,
    pub count: usize,
    pub median_price: f64,
    pub avg_ppsf: f64,
}

/// Perform market analysis on a set of properties
/// Returns statistical breakdown, city comparisons, and market health score
#[wasm_bindgen]
pub fn analyze_market(data: JsValue) -> JsValue {
    let points: Vec<MarketDataPoint> = serde_wasm_bindgen::from_value(data).unwrap();

    if points.is_empty() {
        let empty = serde_json::json!({
            "median_price": 0, "mean_price": 0, "price_std_dev": 0,
            "median_ppsf": 0, "price_range": {"min": 0, "max": 0, "q1": 0, "q3": 0},
            "city_breakdown": [], "market_health": "insufficient_data", "market_score": 0
        });
        return serde_wasm_bindgen::to_value(&empty).unwrap();
    }

    let mut prices: Vec<f64> = points.iter().map(|p| p.price).collect();
    prices.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let n = prices.len();
    let median_price = if n % 2 == 0 { (prices[n/2 - 1] + prices[n/2]) / 2.0 } else { prices[n/2] };
    let mean_price = prices.iter().sum::<f64>() / n as f64;
    let variance = prices.iter().map(|p| (p - mean_price).powi(2)).sum::<f64>() / n as f64;
    let std_dev = variance.sqrt();

    let q1 = prices[n / 4];
    let q3 = prices[3 * n / 4];

    // Price per sqft calculations
    let ppsf_values: Vec<f64> = points.iter()
        .filter_map(|p| p.sqft.map(|s| if s > 0.0 { p.price / s } else { 0.0 }))
        .filter(|v| *v > 0.0)
        .collect();
    let median_ppsf = if !ppsf_values.is_empty() {
        let mut sorted = ppsf_values.clone();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        sorted[sorted.len() / 2]
    } else { 0.0 };

    // City breakdown
    let cities: Vec<String> = {
        let mut c: Vec<String> = points.iter().map(|p| p.city.clone()).collect();
        c.sort();
        c.dedup();
        c
    };

    let city_breakdown: Vec<CityStats> = cities.iter().map(|city| {
        let city_points: Vec<&MarketDataPoint> = points.iter().filter(|p| &p.city == city).collect();
        let mut city_prices: Vec<f64> = city_points.iter().map(|p| p.price).collect();
        city_prices.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let cn = city_prices.len();
        let city_median = if cn % 2 == 0 { (city_prices[cn/2-1] + city_prices[cn/2]) / 2.0 } else { city_prices[cn/2] };

        let city_ppsf: Vec<f64> = city_points.iter()
            .filter_map(|p| p.sqft.map(|s| if s > 0.0 { p.price / s } else { 0.0 }))
            .filter(|v| *v > 0.0)
            .collect();
        let avg_ppsf = if !city_ppsf.is_empty() { city_ppsf.iter().sum::<f64>() / city_ppsf.len() as f64 } else { 0.0 };

        CityStats {
            city: city.clone(),
            count: cn,
            median_price: (city_median * 100.0).round() / 100.0,
            avg_ppsf: (avg_ppsf * 100.0).round() / 100.0,
        }
    }).collect();

    // Market health: based on coefficient of variation and inventory
    let cv = std_dev / mean_price;
    let (health, score) = if n >= 20 && cv < 0.3 { ("healthy", 85.0) }
        else if n >= 10 && cv < 0.5 { ("stable", 70.0) }
        else if n >= 5 { ("moderate", 55.0) }
        else { ("thin", 35.0) };

    let result = MarketAnalysis {
        median_price: (median_price * 100.0).round() / 100.0,
        mean_price: (mean_price * 100.0).round() / 100.0,
        price_std_dev: (std_dev * 100.0).round() / 100.0,
        median_ppsf: (median_ppsf * 100.0).round() / 100.0,
        price_range: PriceRange {
            min: prices[0],
            max: prices[n-1],
            q1,
            q3,
        },
        city_breakdown,
        market_health: health.to_string(),
        market_score: score,
    };

    serde_wasm_bindgen::to_value(&result).unwrap()
}
