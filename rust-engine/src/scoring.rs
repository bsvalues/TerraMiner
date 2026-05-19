use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

/// Property input for scoring -- mirrors the PostgreSQL properties table
#[derive(Deserialize)]
pub struct PropertyInput {
    pub price: f64,
    pub sqft: Option<f64>,
    pub beds: Option<i32>,
    pub baths: Option<f64>,
    pub year_built: Option<i32>,
    pub lot_size: Option<f64>,
    pub city: String,
    pub status: String,
}

/// Scored property output with component breakdowns
#[derive(Serialize)]
pub struct PropertyScore {
    pub total_score: f64,
    pub value_score: f64,
    pub location_score: f64,
    pub condition_score: f64,
    pub market_score: f64,
    pub investment_grade: String,
    pub recommendation: String,
}

/// Score a single property on a 0-100 scale with component breakdowns
/// Uses weighted multi-factor analysis: value (30%), location (25%), condition (25%), market (20%)
#[wasm_bindgen]
pub fn score_property(input: JsValue) -> JsValue {
    let prop: PropertyInput = serde_wasm_bindgen::from_value(input).unwrap();

    // Value score: price per sqft relative to market median ($180/sqft Tri-Cities)
    let market_median_ppsf = 180.0;
    let ppsf = if let Some(sqft) = prop.sqft {
        if sqft > 0.0 { prop.price / sqft } else { market_median_ppsf }
    } else {
        market_median_ppsf
    };
    let value_ratio = market_median_ppsf / ppsf;
    let value_score = (value_ratio * 50.0).min(100.0).max(0.0);

    // Location score: city-based with Richland premium
    let location_score = match prop.city.as_str() {
        "Richland" => 85.0,
        "Kennewick" => 75.0,
        "Pasco" => 65.0,
        _ => 50.0,
    };

    // Condition score: year built with age decay
    let current_year = 2026;
    let age = prop.year_built.map(|y| current_year - y).unwrap_or(30) as f64;
    let condition_score = (100.0 - age * 1.2).max(20.0).min(100.0);

    // Market score: active listings score higher
    let market_score = match prop.status.as_str() {
        "active" => 80.0,
        "pending" => 90.0,
        "sold" => 60.0,
        _ => 50.0,
    };

    // Weighted total
    let total = value_score * 0.30 + location_score * 0.25 + condition_score * 0.25 + market_score * 0.20;

    let grade = if total >= 85.0 { "A" }
        else if total >= 70.0 { "B" }
        else if total >= 55.0 { "C" }
        else if total >= 40.0 { "D" }
        else { "F" };

    let recommendation = if total >= 80.0 { "Strong Buy" }
        else if total >= 65.0 { "Buy" }
        else if total >= 50.0 { "Hold" }
        else { "Pass" };

    let result = PropertyScore {
        total_score: (total * 10.0).round() / 10.0,
        value_score: (value_score * 10.0).round() / 10.0,
        location_score,
        condition_score: (condition_score * 10.0).round() / 10.0,
        market_score,
        investment_grade: grade.to_string(),
        recommendation: recommendation.to_string(),
    };

    serde_wasm_bindgen::to_value(&result).unwrap()
}

/// Batch score multiple properties -- returns sorted by total_score descending
#[wasm_bindgen]
pub fn batch_score(properties: JsValue) -> JsValue {
    let props: Vec<PropertyInput> = serde_wasm_bindgen::from_value(properties).unwrap();
    let mut scores: Vec<PropertyScore> = props.into_iter().map(|p| {
        let input = serde_wasm_bindgen::to_value(&serde_json::json!({
            "price": p.price,
            "sqft": p.sqft,
            "beds": p.beds,
            "baths": p.baths,
            "year_built": p.year_built,
            "lot_size": p.lot_size,
            "city": p.city,
            "status": p.status
        })).unwrap();
        let result: PropertyScore = serde_wasm_bindgen::from_value(score_property(input)).unwrap();
        result
    }).collect();

    scores.sort_by(|a, b| b.total_score.partial_cmp(&a.total_score).unwrap());
    serde_wasm_bindgen::to_value(&scores).unwrap()
}
