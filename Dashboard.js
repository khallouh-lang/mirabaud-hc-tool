import React, { useState, useMemo } from "react";

// -- [DATA SECTION] --
const DEFAULT_HC = [
  { name:"Deutsche Telekom AG", sector:"Communication Services", region:"EU", mktCap:"€161bn", type:"Core", prc:4, initDate:"12.01.2023", lastPrice:32.82, pt:38.0, upside:15.8, growth:12.8, fwdPE:13.2, ytd:18.7, ytdRel:15.4, divYield:3.1, esg:true },
  { name:"Alphabet Inc", sector:"Communication Services", region:"US", mktCap:"$3,714bn", type:"Core", prc:3, initDate:"01.10.2021", lastPrice:307.04, pt:361, upside:17.6, growth:14.8, fwdPE:21.7, ytd:-1.8, ytdRel:-3.0, divYield:0.3, esg:false },
  { name:"Meta Platforms Inc", sector:"Communication Services", region:"US", mktCap:"$1,655bn", type:"Core", prc:3, initDate:"25.04.2024", lastPrice:654.07, pt:880, upside:34.5, growth:16.2, fwdPE:17.6, ytd:-0.9, ytdRel:-2.1, divYield:0.3, esg:false },
  { name:"Netflix Inc", sector:"Communication Services", region:"US", mktCap:"$409bn", type:"Core", prc:4, initDate:"07.11.2025", lastPrice:96.94, pt:117, upside:20.7, growth:21.1, fwdPE:25.4, ytd:3.4, ytdRel:2.2, divYield:null, esg:false },
  { name:"Amazon.com Inc", sector:"Consumer Discretionary", region:"US", mktCap:"$2,301bn", type:"Core", prc:3, initDate:"01.10.2021", lastPrice:214.33, pt:280, upside:30.6, growth:18.2, fwdPE:19.8, ytd:-7.1, ytdRel:-8.3, divYield:null, esg:false },
  { name:"Microsoft Corp", sector:"Information Technology", region:"US", mktCap:"$2,836bn", type:"Core", prc:3, initDate:"01.10.2021", lastPrice:381.87, pt:599, upside:56.9, growth:12.5, fwdPE:20.1, ytd:-20.9, ytdRel:-17.9, divYield:1.0, esg:true },
  { name:"NVIDIA Corp", sector:"Information Technology", region:"US", mktCap:"$4,197bn", type:"Core", prc:4, initDate:"03.12.2025", lastPrice:172.70, pt:240, upside:39.0, growth:33.1, fwdPE:15.5, ytd:-7.4, ytdRel:-4.4, divYield:0.0, esg:true },
];

const SECTOR_COLORS = { 
  "Communication Services":"#4A90D9", "Consumer Discretionary":"#E88C3C", 
  "Information Technology":"#3E7ACC", "Financials":"#7B68EE", "Health Care":"#E05A5A" 
};

// -- [LOGIC HELPERS] --
function getRisk(s) {
  const flags = [];
  if (s.upside < 10) flags.push("Low Upside");
  if (s.ytdRel < -15) flags.push("Underperforming");
  if (s.fwdPE > 30) flags.push("Premium Valuation");
  return { level: flags.length > 1 ? "high" : flags.length === 1 ? "medium" : "low", flags };
}

// -- [PDF ENGINE] --
const buildPDFPages = (enriched, aiResults) => {
  const page1 = `
    <svg viewBox="0 0 792 1122" xmlns="http://www.w3.org/2000/svg">
      <rect width="792" height="1122" fill="white"/>
      <rect width="792" height="80" fill="#0f2d5e"/>
      <text x="40" y="50" font-family="Arial" font-size="24" fill="white" font-weight="bold">MIRABAUD | High Conviction Review</text>
      <text x="40" y="130" font-family="Arial" font-size="20" fill="#0f2d5e" font-weight="bold">Portfolio Status Summary</text>
      <rect x="40" y="150" width="220" height="80" fill="#fdecea" rx="10"/>
      <text x="150" y="185" font-family="Arial" font-size="14" fill="#c62828" text-anchor="middle">Review Required</text>
      <text x="150" y="215" font-family="Arial" font-size="28" fill="#c62828" font-weight="bold" text-anchor="middle">${enriched.filter(s=>s.riskLevel==='high').length}</text>
    </svg>`;

  const stockPages = enriched.filter(s => s.riskLevel !== 'low').map(s => `
    <svg viewBox="0 0 792 1122" xmlns="http://www.w3.org/2000/svg">
      <rect width="792" height="1122" fill="white"/>
      <rect width="792" height="5" fill="${s.riskLevel === 'high' ? '#c62828' : '#f57f17'}"/>
      <text x="40" y="60" font-family="Arial" font-size="22" fill="#0f2d5e" font-weight="bold">${s.name.toUpperCase()}</text>
      <text x="40" y="85" font-family="Arial" font-size="12" fill="#666">${s.sector} | PRC: ${s.prc}</text>
      <rect x="40" y="110" width="712" height="1" fill="#eee"/>
      <text x="40" y="140" font-family="Arial" font-size="14" font-weight="bold">AI Analysis</text>
      <foreignObject x="40" y="160" width="712" height="800">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial; font-size:12px; line-height:1.6; color:#333;">
          ${aiResults[s.name] || "Manual review pending."}
        </div>
      </foreignObject>
    </svg>`);

  return { page1, stockPages };
};

// -- [MAIN COMPONENT] --
export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("All");
  const [aiResults, setAiResults] = useState({});

  const enriched = useMemo(() => DEFAULT_HC.map(s => {
    const riskData = getRisk(s);
    return { ...s, riskLevel: riskData.level, flags: riskData.flags };
  }), []);

  const filtered = enriched.filter(s => 
    (filterSector === "All" || s.sector === filterSector) &&
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePrint = () => {
    const { page1, stockPages } = buildPDFPages(enriched, aiResults);
    const win = window.open("", "_blank");
    win.document.write(`<html><head><style>@page{size:A4;margin:0;}body{margin:0;}.page{width:210mm;height:297mm;page-break-after:always;}svg{width:100%;height:100%;}</style></head><body><div class="page">${page1}</div>${stockPages.map(p=>`<div class="page">${p}</div>`).join("")}<script>setTimeout(()=>{window.print();window.close();},500)</script></body></html>`);
    win.document.close();
  };

  return (
    <div style={{ padding: "30px", background: "#f8f9fc", minHeight: "100vh", fontFamily: "Segoe UI, sans-serif" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f2d5e", padding: "20px 40px", borderRadius: "12px", color: "white", marginBottom: "30px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", letterSpacing: "1px" }}>MIRABAUD <span style={{fontWeight:200}}>| HC TOOL</span></h1>
        <button onClick={handlePrint} style={{ background: "#e65100", color: "white", border: "none", padding: "10px 25px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>⎙ EXPORT PDF REPORT</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
        <input 
          placeholder="Search company..." 
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd", width: "250px" }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
          onChange={(e) => setFilterSector(e.target.value)}
        >
          <option value="All">All Sectors</option>
          {Object.keys(SECTOR_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "
