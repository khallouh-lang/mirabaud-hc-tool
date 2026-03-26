import React, { useState, useMemo } from "react";

// -- [YOUR FULL STOCK LIST] --
const DEFAULT_HC = [
  { name:"Deutsche Telekom AG", sector:"Communication Services", region:"EU", mktCap:"€161bn", type:"Core", prc:4, initDate:"12.01.2023", lastPrice:32.82, pt:38.0, upside:15.8, growth:12.8, fwdPE:13.2, ytd:18.7, ytdRel:15.4, divYield:3.1, esg:true },
  { name:"Alphabet Inc", sector:"Communication Services", region:"US", mktCap:"$3,714bn", type:"Core", prc:3, initDate:"01.10.2021", lastPrice:307.04, pt:361, upside:17.6, growth:14.8, fwdPE:21.7, ytd:-1.8, ytdRel:-3.0, divYield:0.3, esg:false },
  { name:"Meta Platforms Inc", sector:"Communication Services", region:"US", mktCap:"$1,655bn", type:"Core", prc:3, initDate:"25.04.2024", lastPrice:654.07, pt:880, upside:34.5, growth:16.2, fwdPE:17.6, ytd:-0.9, ytdRel:-2.1, divYield:0.3, esg:false },
  { name:"Netflix Inc", sector:"Communication Services", region:"US", mktCap:"$409bn", type:"Core", prc:4, initDate:"07.11.2025", lastPrice:96.94, pt:117, upside:20.7, growth:21.1, fwdPE:25.4, ytd:3.4, ytdRel:2.2, divYield:null, esg:false },
  // ... [REMAINDER OF YOUR STOCKS] ...
];

// -- [STYLING & HELPERS] --
const SECTOR_COLORS = { "Communication Services":"#4A90D9","Consumer Discretionary":"#E88C3C","Consumer Staples":"#6DBE6D","Energy":"#D4A017","Financials":"#7B68EE","Health Care":"#E05A5A","Industrials":"#4DBBBB","Information Technology":"#3E7ACC","Materials":"#9B7EC8","Utilities":"#64A86E" };

function convictionRisk(s) {
  const f = [];
  if (s.upside < 0) f.push("PT below market");
  else if (s.upside < 10) f.push("Low upside (<10%)");
  if (s.ytdRel < -15) f.push("Strong relative underperformance");
  if (s.growth < 5) f.push("Low earnings growth (<5%)");
  if (s.fwdPE > 35) f.push("Stretched valuation");
  return f;
}

// -- [PDF GENERATOR ENGINE] --
const buildPDFPages = (enriched, aiResults) => {
  // Page 1: Executive Summary
  const page1 = `
    <svg viewBox="0 0 792 1122" xmlns="http://www.w3.org/2000/svg">
      <rect width="792" height="1122" fill="white"/>
      <rect width="792" height="70" fill="#0f2d5e"/>
      <text x="30" y="45" font-family="Arial" font-size="24" fill="white" font-weight="bold">MIRABAUD | High Conviction Report</text>
      <text x="30" y="120" font-family="Arial" font-size="18" fill="#0f2d5e" font-weight="bold">Portfolio Risk Summary</text>
      <line x1="30" y1="130" x2="760" y2="130" stroke="#0f2d5e" stroke-width="2"/>
      <text x="30" y="160" font-family="Arial" font-size="12" fill="#333">Total Stocks: ${enriched.length}</text>
      <text x="30" y="180" font-family="Arial" font-size="12" fill="#c62828">High Risk/Review: ${enriched.filter(s=>s.risk==='high').length}</text>
    </svg>
  `;

  // Page 2: Stock Details
  const stockPages = enriched.filter(s => s.risk !== 'low').map(s => `
    <svg viewBox="0 0 792 1122" xmlns="http://www.w3.org/2000/svg">
      <rect width="792" height="1122" fill="white"/>
      <rect width="792" height="60" fill="#f4f7fa"/>
      <text x="30" y="40" font-family="Arial" font-size="20" fill="#0f2d5e" font-weight="bold">${s.name}</text>
      <text x="30" y="100" font-family="Arial" font-size="14" fill="#333" font-weight="bold">Investment Metrics</text>
      <text x="30" y="130" font-family="Arial" font-size="12">Sector: ${s.sector} | Region: ${s.region}</text>
      <text x="30" y="150" font-family="Arial" font-size="12">Upside: ${s.upside}% | P/E: ${s.fwdPE}x</text>
      <rect x="30" y="200" width="732" height="200" fill="#f9f9f9" rx="8"/>
      <text x="45" y="230" font-family="Arial" font-size="12" font-weight="bold">AI ANALYTICAL ASSESSMENT:</text>
      <foreignObject x="45" y="245" width="700" height="150">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial; font-size:11px; line-height:1.4;">
          ${aiResults[s.name] || "No AI analysis generated for this period."}
        </div>
      </foreignObject>
    </svg>
  `);

  return { page1, stockPages };
};

// -- [MAIN APPLICATION] --
export default function Dashboard() {
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  const enriched = useMemo(() => DEFAULT_HC.map(s => {
    const f = convictionRisk(s);
    return { ...s, flags: f, risk: f.length > 1 ? "high" : f.length === 1 ? "medium" : "low" };
  }), []);

  const runAI = async (stock) => {
    setAiLoading(p => ({ ...p, [stock.name]: true }));
    try {
      // NOTE: For SharePoint, replace this URL with your Power Automate/Proxy URL
      const response = await fetch("YOUR_INTERNAL_PROXY_URL", {
        method: "POST",
        body: JSON.stringify({ stock: stock.name, metrics: stock })
      });
      const data = await response.json();
      setAiResults(p => ({ ...p, [stock.name]: data.text }));
    } catch (e) {
      setAiResults(p => ({ ...p, [stock.name]: "Analysis drafted (Simulated). Connect to API for live data." }));
    } finally {
      setAiLoading(p => ({ ...p, [stock.name]: false }));
    }
  };

  const handlePrint = () => {
    const { page1, stockPages } = buildPDFPages(enriched, aiResults);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><style>
          @page { size: A4; margin: 0; }
          body { margin: 0; background: #ccc; }
          .page { background: white; width: 210mm; height: 297mm; margin: 10mm auto; page-break-after: always; }
          svg { width: 100%; height: 100%; }
          @media print { body { background: none; } .page { margin: 0; } }
        </style></head>
        <body>
          <div class="page">${page1}</div>
          ${stockPages.map(p => `<div class="page">${p}</div>`).join("")}
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial", backgroundColor: "#f4f7fa", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", background: "#0f2d5e", padding: 20, borderRadius: 8, color: "white", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>MIRABAUD | High Conviction</h2>
        <button onClick={handlePrint} style={{ padding: "10px 20px", cursor: "pointer", background: "#e65100", border: "none", color: "white", borderRadius: 4, fontWeight: "bold" }}>
          ⎙ Export PDF
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {enriched.map(s => (
          <div key={s.name} style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0 }}>{s.name}</h3>
            <p style={{ fontSize: 12, color: s.risk === 'high' ? 'red' : 'green', fontWeight: 'bold' }}>
              STATUS: {s.risk.toUpperCase()}
            </p>
            <div style={{ fontSize: 13, marginBottom: 15 }}>
              Upside: {s.upside}% | Growth: {s.growth}%
            </div>
            {aiResults[s.name] ? (
              <div style={{ background: "#f0f0f0", padding: 10, borderRadius: 5, fontSize: 11 }}>{aiResults[s.name]}</div>
            ) : (
              <button onClick={() => runAI(s)} style={{ width: "100%", padding: 8, cursor: "pointer" }}>
                {aiLoading[s.name] ? "Analysing..." : "Run AI Review"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
