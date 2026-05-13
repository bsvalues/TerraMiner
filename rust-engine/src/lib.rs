use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

mod scoring;
mod intent;
mod market;

pub use scoring::*;
pub use intent::*;
pub use market::*;

/// Initialize the WASM module -- called once on load
/// Agent Bravo says "waking up the crab is like booting a submarine made of math"
#[wasm_bindgen]
pub fn init() -> String {
    "TerraFusion Rust Engine v0.1.0 initialized".to_string()
}

/// Health check -- returns engine version and capabilities
#[wasm_bindgen]
pub fn health_check() -> JsValue {
    let info = serde_json::json!({
        "engine": "terraminer-engine",
        "version": "0.1.0",
        "capabilities": ["property_scoring", "intent_parsing", "market_analysis"],
        "runtime": "wasm32"
    });
    serde_wasm_bindgen::to_value(&info).unwrap()
}
