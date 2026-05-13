use wasm_bindgen::prelude::*;
use serde::Serialize;

/// Parsed intent from natural language input
#[derive(Serialize)]
pub struct ParsedIntent {
    pub intent: String,
    pub confidence: f64,
    pub entities: IntentEntities,
    pub suggested_action: String,
}

#[derive(Serialize)]
pub struct IntentEntities {
    pub city: Option<String>,
    pub min_beds: Option<i32>,
    pub max_price: Option<f64>,
    pub property_type: Option<String>,
    pub keywords: Vec<String>,
}

/// Parse a natural language query into structured intent + entities
/// Uses keyword matching with confidence scoring (Rust is 10-50x faster than JS regex)
#[wasm_bindgen]
pub fn parse_intent(query: &str) -> JsValue {
    let lower = query.to_lowercase();
    let words: Vec<&str> = lower.split_whitespace().collect();

    // Intent classification via keyword scoring
    let search_score = count_matches(&words, &["search", "find", "show", "list", "looking", "want", "need", "get"]);
    let market_score = count_matches(&words, &["market", "trend", "analysis", "price", "value", "worth", "appreciation"]);
    let recommend_score = count_matches(&words, &["recommend", "suggest", "best", "top", "good", "investment", "roi"]);
    let compare_score = count_matches(&words, &["compare", "versus", "vs", "difference", "better"]);

    let (intent, confidence) = if search_score >= market_score && search_score >= recommend_score && search_score >= compare_score {
        ("property_search", 0.5 + (search_score as f64 * 0.12))
    } else if market_score >= recommend_score && market_score >= compare_score {
        ("market_analysis", 0.5 + (market_score as f64 * 0.12))
    } else if recommend_score >= compare_score {
        ("recommendation", 0.5 + (recommend_score as f64 * 0.12))
    } else {
        ("comparison", 0.5 + (compare_score as f64 * 0.12))
    };

    // Entity extraction
    let city = if lower.contains("richland") { Some("Richland".to_string()) }
        else if lower.contains("kennewick") { Some("Kennewick".to_string()) }
        else if lower.contains("pasco") { Some("Pasco".to_string()) }
        else if lower.contains("tri-cities") || lower.contains("tri cities") { None }
        else { None };

    // Bed extraction: "3 bed", "3br", "3 bedroom"
    let min_beds = extract_number_before(&lower, &["bed", "br", "bedroom"]);

    // Price extraction: "under 500k", "below $400,000"
    let max_price = extract_price(&lower);

    // Property type extraction
    let property_type = if lower.contains("condo") { Some("condo".to_string()) }
        else if lower.contains("townhouse") || lower.contains("town house") { Some("townhouse".to_string()) }
        else if lower.contains("multi") || lower.contains("duplex") { Some("multi_family".to_string()) }
        else if lower.contains("land") || lower.contains("lot") { Some("land".to_string()) }
        else { None };

    let keywords: Vec<String> = words.iter()
        .filter(|w| w.len() > 3 && !["that", "this", "with", "from", "have", "been", "will", "them", "they", "what", "when", "your"].contains(w))
        .map(|w| w.to_string())
        .collect();

    let suggested_action = match intent {
        "property_search" => "search_properties",
        "market_analysis" => "analyze_market",
        "recommendation" => "get_recommendations",
        "comparison" => "compare_properties",
        _ => "search_properties",
    };

    let result = ParsedIntent {
        intent: intent.to_string(),
        confidence: confidence.min(0.98),
        entities: IntentEntities {
            city,
            min_beds,
            max_price,
            property_type,
            keywords,
        },
        suggested_action: suggested_action.to_string(),
    };

    serde_wasm_bindgen::to_value(&result).unwrap()
}

fn count_matches(words: &[&str], patterns: &[&str]) -> usize {
    words.iter().filter(|w| patterns.contains(w)).count()
}

fn extract_number_before(text: &str, suffixes: &[&str]) -> Option<i32> {
    for suffix in suffixes {
        if let Some(pos) = text.find(suffix) {
            let before = &text[..pos].trim_end();
            let num_str: String = before.chars().rev().take_while(|c| c.is_ascii_digit()).collect::<String>().chars().rev().collect();
            if let Ok(n) = num_str.parse::<i32>() {
                return Some(n);
            }
        }
    }
    None
}

fn extract_price(text: &str) -> Option<f64> {
    // Match patterns like "500k", "$400,000", "under 300000"
    let price_patterns = ["under ", "below ", "max ", "budget "];
    for pattern in &price_patterns {
        if let Some(pos) = text.find(pattern) {
            let after = &text[pos + pattern.len()..];
            let cleaned: String = after.chars().take_while(|c| c.is_ascii_digit() || *c == 'k' || *c == 'K' || *c == ',' || *c == '$' || *c == '.').collect();
            let cleaned = cleaned.replace(['$', ','], "");
            if cleaned.ends_with('k') || cleaned.ends_with('K') {
                if let Ok(n) = cleaned[..cleaned.len()-1].parse::<f64>() {
                    return Some(n * 1000.0);
                }
            } else if let Ok(n) = cleaned.parse::<f64>() {
                return Some(n);
            }
        }
    }
    None
}
