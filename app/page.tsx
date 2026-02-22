export default function Page() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1b2a",
        color: "#e0e1dd",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        gap: "24px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "#00b4d8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#0d1b2a",
        }}
      >
        TF
      </div>
      <h1 style={{ fontSize: "32px", fontWeight: 700, margin: 0 }}>
        TerraFusion Cloud Coach
      </h1>
      <p style={{ fontSize: "16px", color: "#778da9", margin: 0 }}>
        Elite Government OS - Multi-Agent Swarm Control
      </p>
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "16px",
        }}
      >
        {["Market Analyzer", "NL Search", "Recommendation", "Summarizer"].map(
          (agent) => (
            <div
              key={agent}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "#1b263b",
                border: "1px solid #415a77",
                fontSize: "13px",
                color: "#00b4d8",
              }}
            >
              {agent}
            </div>
          )
        )}
      </div>
      <p
        style={{
          fontSize: "12px",
          color: "#415a77",
          marginTop: "32px",
        }}
      >
        Ralph Wiggum Mode: ACTIVE
      </p>
    </div>
  );
}
