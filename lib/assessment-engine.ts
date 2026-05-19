/**
 * Benton County Assessment Engine
 * IAAO-compliant ratio study calculations with neighborhood-level analysis.
 *
 * Metrics implemented:
 *   COD  -- Coefficient of Dispersion (horizontal equity / uniformity)
 *   PRD  -- Price-Related Differential (vertical equity / regressivity)
 *   PRB  -- Price-Related Bias (IAAO regression-based vertical equity)
 *   Median Ratio -- central tendency of assessment-to-sale ratios
 *
 * Standards reference: IAAO Standard on Ratio Studies (2013/2023)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssessmentProperty {
  id: string;
  address: string;
  city: string;
  price: number;
  assessed_value: number;
  land_value: number;
  improvement_value: number;
  sale_price: number;
  sale_date: string;
  neighborhood_code: string;
  neighborhood_name: string;
  grade: string;
  condition_code: string;
  parcel_number: string;
  zoning: string;
  sqft: number;
  beds: number;
  baths: number;
  year_built: number;
  tax_year: number;
}

export interface RatioStudyResult {
  median_ratio: number;
  mean_ratio: number;
  weighted_mean_ratio: number;
  cod: number;
  prd: number;
  prb: number;
  sample_size: number;
  cod_pass: boolean;   // IAAO: COD <= 15 for residential
  prd_pass: boolean;   // IAAO: 0.98 <= PRD <= 1.03
  prb_pass: boolean;   // IAAO: -0.05 <= PRB <= 0.05
  overall_pass: boolean;
  ratios: number[];
}

export interface NeighborhoodAnalysis {
  code: string;
  name: string;
  city: string;
  count: number;
  median_ratio: number;
  cod: number;
  prd: number;
  mean_assessed: number;
  mean_sale: number;
  median_sale: number;
  pass: boolean;
}

export interface QuintileResult {
  quintile: number;
  label: string;
  count: number;
  median_ratio: number;
  mean_ratio: number;
  price_range: [number, number];
}

export interface EquityReport {
  overall: RatioStudyResult;
  by_neighborhood: NeighborhoodAnalysis[];
  by_city: NeighborhoodAnalysis[];
  quintiles: QuintileResult[];
  generated_at: string;
  tax_year: number;
}

// ---------------------------------------------------------------------------
// Core Statistical Functions
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function mad(values: number[], med: number): number {
  // Mean absolute deviation from the median
  if (values.length === 0) return 0;
  return mean(values.map((v) => Math.abs(v - med)));
}

// ---------------------------------------------------------------------------
// IAAO Ratio Study Calculations
// ---------------------------------------------------------------------------

/**
 * Compute assessment-to-sale ratios for a set of properties.
 */
export function computeRatios(properties: AssessmentProperty[]): number[] {
  return properties
    .filter((p) => p.sale_price > 0 && p.assessed_value > 0)
    .map((p) => p.assessed_value / p.sale_price);
}

/**
 * COD -- Coefficient of Dispersion
 * Measures horizontal equity (uniformity of assessment ratios).
 * Formula: (MAD / Median Ratio) * 100
 * IAAO standard for residential: COD <= 15.0
 */
export function computeCOD(ratios: number[]): number {
  if (ratios.length < 2) return 0;
  const med = median(ratios);
  if (med === 0) return 0;
  return (mad(ratios, med) / med) * 100;
}

/**
 * PRD -- Price-Related Differential
 * Measures vertical equity (regressivity/progressivity).
 * Formula: Mean Ratio / Weighted Mean Ratio
 * IAAO standard: 0.98 <= PRD <= 1.03
 * PRD > 1.03 indicates regressive assessments (lower-value overassessed)
 * PRD < 0.98 indicates progressive assessments (higher-value overassessed)
 */
export function computePRD(properties: AssessmentProperty[]): number {
  const valid = properties.filter(
    (p) => p.sale_price > 0 && p.assessed_value > 0
  );
  if (valid.length < 2) return 1;

  const ratios = valid.map((p) => p.assessed_value / p.sale_price);
  const meanRatio = mean(ratios);

  const totalAssessed = valid.reduce((s, p) => s + p.assessed_value, 0);
  const totalSale = valid.reduce((s, p) => s + p.sale_price, 0);
  const weightedMeanRatio = totalSale > 0 ? totalAssessed / totalSale : 1;

  return weightedMeanRatio > 0 ? meanRatio / weightedMeanRatio : 1;
}

/**
 * PRB -- Price-Related Bias (IAAO regression-based)
 * A more robust vertical equity measure than PRD.
 * Uses OLS regression of (ratio - median) on ln(sale_price).
 * IAAO standard: -0.05 <= PRB <= 0.05
 */
export function computePRB(properties: AssessmentProperty[]): number {
  const valid = properties.filter(
    (p) => p.sale_price > 0 && p.assessed_value > 0
  );
  if (valid.length < 5) return 0;

  const ratios = valid.map((p) => p.assessed_value / p.sale_price);
  const med = median(ratios);

  // Dependent: (ratio - median) / median (percentage deviation)
  const y = ratios.map((r) => (r - med) / med);
  // Independent: ln(sale_price)
  const x = valid.map((p) => Math.log(p.sale_price));

  // Simple OLS: slope = Cov(x,y) / Var(x)
  const xMean = mean(x);
  const yMean = mean(y);

  let covXY = 0;
  let varX = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - xMean;
    covXY += dx * (y[i] - yMean);
    varX += dx * dx;
  }

  return varX > 0 ? covXY / varX : 0;
}

// ---------------------------------------------------------------------------
// Full Ratio Study
// ---------------------------------------------------------------------------

export function runRatioStudy(
  properties: AssessmentProperty[]
): RatioStudyResult {
  const ratios = computeRatios(properties);
  const med = median(ratios);
  const mn = mean(ratios);

  const totalAssessed = properties
    .filter((p) => p.sale_price > 0)
    .reduce((s, p) => s + p.assessed_value, 0);
  const totalSale = properties
    .filter((p) => p.sale_price > 0)
    .reduce((s, p) => s + p.sale_price, 0);
  const weightedMean = totalSale > 0 ? totalAssessed / totalSale : 0;

  const cod = computeCOD(ratios);
  const prd = computePRD(properties);
  const prb = computePRB(properties);

  return {
    median_ratio: Number(med.toFixed(4)),
    mean_ratio: Number(mn.toFixed(4)),
    weighted_mean_ratio: Number(weightedMean.toFixed(4)),
    cod: Number(cod.toFixed(2)),
    prd: Number(prd.toFixed(4)),
    prb: Number(prb.toFixed(4)),
    sample_size: ratios.length,
    cod_pass: cod <= 15,
    prd_pass: prd >= 0.98 && prd <= 1.03,
    prb_pass: prb >= -0.05 && prb <= 0.05,
    overall_pass: cod <= 15 && prd >= 0.98 && prd <= 1.03 && prb >= -0.05 && prb <= 0.05,
    ratios,
  };
}

// ---------------------------------------------------------------------------
// Neighborhood Analysis
// ---------------------------------------------------------------------------

export function analyzeNeighborhoods(
  properties: AssessmentProperty[]
): NeighborhoodAnalysis[] {
  const groups = new Map<string, AssessmentProperty[]>();
  for (const p of properties) {
    const key = p.neighborhood_code || "UNKNOWN";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const results: NeighborhoodAnalysis[] = [];
  for (const [code, props] of groups) {
    const ratios = computeRatios(props);
    const cod = computeCOD(ratios);
    const prd = computePRD(props);
    const salePrices = props.map((p) => p.sale_price).filter((p) => p > 0);

    results.push({
      code,
      name: props[0]?.neighborhood_name || code,
      city: props[0]?.city || "",
      count: props.length,
      median_ratio: Number(median(ratios).toFixed(4)),
      cod: Number(cod.toFixed(2)),
      prd: Number(prd.toFixed(4)),
      mean_assessed: Number(mean(props.map((p) => p.assessed_value)).toFixed(0)),
      mean_sale: Number(mean(salePrices).toFixed(0)),
      median_sale: Number(median(salePrices).toFixed(0)),
      pass: cod <= 15 && prd >= 0.98 && prd <= 1.03,
    });
  }

  return results.sort((a, b) => a.code.localeCompare(b.code));
}

// ---------------------------------------------------------------------------
// City-Level Analysis
// ---------------------------------------------------------------------------

export function analyzeCities(
  properties: AssessmentProperty[]
): NeighborhoodAnalysis[] {
  const groups = new Map<string, AssessmentProperty[]>();
  for (const p of properties) {
    const key = p.city || "Unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const results: NeighborhoodAnalysis[] = [];
  for (const [city, props] of groups) {
    const ratios = computeRatios(props);
    const cod = computeCOD(ratios);
    const prd = computePRD(props);
    const salePrices = props.map((p) => p.sale_price).filter((p) => p > 0);

    results.push({
      code: city.substring(0, 3).toUpperCase(),
      name: city,
      city,
      count: props.length,
      median_ratio: Number(median(ratios).toFixed(4)),
      cod: Number(cod.toFixed(2)),
      prd: Number(prd.toFixed(4)),
      mean_assessed: Number(mean(props.map((p) => p.assessed_value)).toFixed(0)),
      mean_sale: Number(mean(salePrices).toFixed(0)),
      median_sale: Number(median(salePrices).toFixed(0)),
      pass: cod <= 15 && prd >= 0.98 && prd <= 1.03,
    });
  }

  return results.sort((a, b) => a.code.localeCompare(b.code));
}

// ---------------------------------------------------------------------------
// Quintile (Value Segment) Analysis
// ---------------------------------------------------------------------------

export function analyzeQuintiles(
  properties: AssessmentProperty[]
): QuintileResult[] {
  const valid = properties
    .filter((p) => p.sale_price > 0 && p.assessed_value > 0)
    .sort((a, b) => a.sale_price - b.sale_price);

  if (valid.length < 5) return [];

  const quintileSize = Math.ceil(valid.length / 5);
  const results: QuintileResult[] = [];
  const labels = [
    "Lowest 20%",
    "Lower-Mid 20%",
    "Middle 20%",
    "Upper-Mid 20%",
    "Highest 20%",
  ];

  for (let q = 0; q < 5; q++) {
    const start = q * quintileSize;
    const end = Math.min(start + quintileSize, valid.length);
    const slice = valid.slice(start, end);
    if (slice.length === 0) continue;

    const ratios = slice.map((p) => p.assessed_value / p.sale_price);

    results.push({
      quintile: q + 1,
      label: labels[q],
      count: slice.length,
      median_ratio: Number(median(ratios).toFixed(4)),
      mean_ratio: Number(mean(ratios).toFixed(4)),
      price_range: [slice[0].sale_price, slice[slice.length - 1].sale_price],
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Full Equity Report
// ---------------------------------------------------------------------------

export function generateEquityReport(
  properties: AssessmentProperty[],
  taxYear = 2025
): EquityReport {
  return {
    overall: runRatioStudy(properties),
    by_neighborhood: analyzeNeighborhoods(properties),
    by_city: analyzeCities(properties),
    quintiles: analyzeQuintiles(properties),
    generated_at: new Date().toISOString(),
    tax_year: taxYear,
  };
}
