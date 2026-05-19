import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import {
  runRatioStudy,
  type AssessmentProperty,
} from "@/lib/assessment-engine";

/**
 * GET /api/assessment/export-report
 * Generates a printable HTML ratio study report.
 * Query params: city, neighborhood, format (html|csv)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const neighborhood = searchParams.get("neighborhood");
    const format = searchParams.get("format") || "html";

    const sql = neon(process.env.DATABASE_URL!);

    let query = `SELECT id, address, city, price, assessed_value, land_value, improvement_value,
      sale_price, sale_date, neighborhood_code, neighborhood_name, grade, condition_code,
      parcel_number, zoning, sqft, beds, baths, year_built, tax_year
      FROM properties WHERE assessed_value IS NOT NULL AND sale_price IS NOT NULL`;

    const params: string[] = [];
    if (city) {
      params.push(city);
      query += ` AND city = $${params.length}`;
    }
    if (neighborhood) {
      params.push(neighborhood);
      query += ` AND neighborhood_code = $${params.length}`;
    }

    query += " ORDER BY city, neighborhood_code";

    const rows = await sql.query(query, params);

    const properties: AssessmentProperty[] = rows.map((r) => ({
      id: String(r.id),
      address: String(r.address || ""),
      city: String(r.city || ""),
      price: Number(r.price || 0),
      assessed_value: Number(r.assessed_value || 0),
      land_value: Number(r.land_value || 0),
      improvement_value: Number(r.improvement_value || 0),
      sale_price: Number(r.sale_price || 0),
      sale_date: String(r.sale_date || ""),
      neighborhood_code: String(r.neighborhood_code || ""),
      neighborhood_name: String(r.neighborhood_name || ""),
      grade: String(r.grade || ""),
      condition_code: String(r.condition_code || ""),
      parcel_number: String(r.parcel_number || ""),
      zoning: String(r.zoning || ""),
      sqft: Number(r.sqft || 0),
      beds: Number(r.beds || 0),
      baths: Number(r.baths || 0),
      year_built: Number(r.year_built || 0),
      tax_year: Number(r.tax_year || 2025),
    }));

    const study = runRatioStudy(properties);
    const areaLabel = city || neighborhood || "Benton County";
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // CSV format
    if (format === "csv") {
      const csvRows = [
        ["Benton County Assessment Ratio Study Report"],
        [`Area: ${areaLabel}`],
        [`Generated: ${dateStr}`],
        [`Tax Year: 2025`],
        [],
        ["IAAO Summary Metrics"],
        ["Metric", "Value", "Standard", "Status"],
        ["Sample Size", study.sample_size.toString(), "-", "-"],
        ["Median Ratio", study.median_ratio.toFixed(4), "0.90-1.10", study.median_ratio >= 0.9 && study.median_ratio <= 1.1 ? "PASS" : "FAIL"],
        ["Mean Ratio", study.mean_ratio.toFixed(4), "-", "-"],
        ["Weighted Mean", study.weighted_mean_ratio.toFixed(4), "-", "-"],
        ["COD", `${study.cod.toFixed(2)}%`, "<=15%", study.cod_pass ? "PASS" : "FAIL"],
        ["PRD", study.prd.toFixed(4), "0.98-1.03", study.prd_pass ? "PASS" : "FAIL"],
        ["PRB", study.prb.toFixed(4), "-0.05-0.05", study.prb_pass ? "PASS" : "FAIL"],
        [],
        ["Overall Compliance", study.overall_pass ? "COMPLIANT" : "NONCOMPLIANT"],
      ];

      const csvContent = csvRows.map((row) => row.join(",")).join("\n");
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="ratio-study-${areaLabel.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // HTML format (printable report)
    const passColor = "#16a34a";
    const failColor = "#dc2626";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ratio Study Report - ${areaLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.5; color: #1a1a1a; padding: 0.5in; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; font-weight: 700; }
    .header .subtitle { font-size: 14px; color: #555; margin-top: 4px; }
    .header .meta { text-align: right; font-size: 11px; color: #666; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #ddd; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .metric-card { border: 1px solid #ddd; border-radius: 6px; padding: 12px; }
    .metric-card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; }
    .metric-card .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    .metric-card .standard { font-size: 10px; color: #888; margin-top: 2px; }
    .pass { color: ${passColor}; }
    .fail { color: ${failColor}; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-pass { background: #dcfce7; color: ${passColor}; }
    .badge-fail { background: #fee2e2; color: ${failColor}; }
    .summary-box { background: #f5f5f5; border-radius: 8px; padding: 16px; margin-top: 16px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
    .summary-row:last-child { border-bottom: none; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 8px 10px; border: 1px solid #ddd; font-size: 11px; }
    th { background: #f5f5f5; font-weight: 600; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 10px; color: #888; text-align: center; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Benton County Assessment Ratio Study</h1>
      <p class="subtitle">IAAO Compliance Report - ${areaLabel}</p>
    </div>
    <div class="meta">
      <p>Tax Year: 2025</p>
      <p>Generated: ${dateStr}</p>
      <p>Source: TerraFusion Analytics</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Overall Compliance Status</div>
    <div style="display: flex; align-items: center; gap: 16px;">
      <span class="badge ${study.overall_pass ? "badge-pass" : "badge-fail"}">
        ${study.overall_pass ? "IAAO COMPLIANT" : "NONCOMPLIANT"}
      </span>
      <span style="font-size: 13px; color: #555;">
        ${study.overall_pass ? "All metrics within IAAO standards" : "One or more metrics outside IAAO standards"}
      </span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">IAAO Summary Metrics</div>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="label">Median Ratio</div>
        <div class="value ${study.median_ratio >= 0.9 && study.median_ratio <= 1.1 ? "pass" : "fail"}">${study.median_ratio.toFixed(4)}</div>
        <div class="standard">Standard: 0.90 - 1.10</div>
      </div>
      <div class="metric-card">
        <div class="label">COD</div>
        <div class="value ${study.cod_pass ? "pass" : "fail"}">${study.cod.toFixed(2)}%</div>
        <div class="standard">Standard: &le;15%</div>
      </div>
      <div class="metric-card">
        <div class="label">PRD</div>
        <div class="value ${study.prd_pass ? "pass" : "fail"}">${study.prd.toFixed(4)}</div>
        <div class="standard">Standard: 0.98 - 1.03</div>
      </div>
      <div class="metric-card">
        <div class="label">PRB</div>
        <div class="value ${study.prb_pass ? "pass" : "fail"}">${study.prb.toFixed(4)}</div>
        <div class="standard">Standard: -0.05 to 0.05</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Additional Statistics</div>
    <div class="summary-box">
      <div class="summary-row">
        <span>Sample Size</span>
        <strong>${study.sample_size} properties</strong>
      </div>
      <div class="summary-row">
        <span>Mean Ratio</span>
        <strong>${study.mean_ratio.toFixed(4)}</strong>
      </div>
      <div class="summary-row">
        <span>Weighted Mean Ratio</span>
        <strong>${study.weighted_mean_ratio.toFixed(4)}</strong>
      </div>
      <div class="summary-row">
        <span>Min Ratio</span>
        <strong>${study.ratios.length > 0 ? Math.min(...study.ratios).toFixed(4) : "--"}</strong>
      </div>
      <div class="summary-row">
        <span>Max Ratio</span>
        <strong>${study.ratios.length > 0 ? Math.max(...study.ratios).toFixed(4) : "--"}</strong>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Metric Definitions</div>
    <table>
      <tr>
        <th>Metric</th>
        <th>Definition</th>
        <th>IAAO Standard</th>
      </tr>
      <tr>
        <td><strong>Median Ratio</strong></td>
        <td>Middle value when all assessment ratios are ordered from lowest to highest</td>
        <td>0.90 - 1.10</td>
      </tr>
      <tr>
        <td><strong>COD</strong></td>
        <td>Coefficient of Dispersion - measures uniformity of assessment ratios</td>
        <td>&le;15% (residential)</td>
      </tr>
      <tr>
        <td><strong>PRD</strong></td>
        <td>Price-Related Differential - tests for vertical equity between price ranges</td>
        <td>0.98 - 1.03</td>
      </tr>
      <tr>
        <td><strong>PRB</strong></td>
        <td>Price-Related Bias - regression-based test for systematic over/under assessment</td>
        <td>-0.05 to 0.05</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    <p>This report was generated by TerraFusion Analytics for Benton County, WA</p>
    <p>For questions, contact the Benton County Assessor's Office</p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Export report error:", error);
    return NextResponse.json(
      { error: "Failed to generate report", source: "error" },
      { status: 500 }
    );
  }
}
