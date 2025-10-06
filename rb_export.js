// ==================== rb_export.js ====================
// CAE / RB Logbook Export Generator
// roster.json → rb_logbook_flights.xlsx, rb_logbook_people.xlsx, rb_logbook_aircrafts.xlsx

import fs from "fs";
import path from "path";
import xlsx from "xlsx";

// ------------------- 경로 설정 -------------------
const rosterPath = path.join(process.cwd(), "public", "roster.json");
const outputDir = path.join(process.cwd(), "public", "rb_export");

// ------------------- 파일 존재 확인 -------------------
if (!fs.existsSync(rosterPath)) {
  console.error("❌ roster.json 파일이 없습니다. 먼저 roster.js를 실행하세요.");
  process.exit(1);
}
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

console.log("🚀 roster.json 불러오는 중...");
const rosterData = JSON.parse(fs.readFileSync(rosterPath, "utf-8")).values;
const headers = rosterData[0];
const rows = rosterData.slice(1);

// ------------------- Flights 변환 -------------------
console.log("✈️ Flights 데이터 변환 중...");
const flights = rows
  .filter(r => r[headers.indexOf("From")] && r[headers.indexOf("To")])
  .map(r => {
    const date = r[headers.indexOf("Date")] || "";
    const from = r[headers.indexOf("From")];
    const to = r[headers.indexOf("To")];
    const acReg = r[headers.indexOf("AcReg")];
    const flightNum = r[headers.indexOf("F")];
    const stdZ = r[headers.indexOf("STD(Z)")];
    const staZ = r[headers.indexOf("STA(Z)")];
    const blh = r[headers.indexOf("BLH")];
    const activity = r[headers.indexOf("Activity")];
    const dc = r[headers.indexOf("DC")];

    return {
      FlightDate: date,
      STD_UTC: stdZ,
      STA_UTC: staZ,
      From: from,
      To: to,
      AircraftRegistration: acReg,
      FlightNumber: flightNum,
      BlockTime: blh,
      NightTime: "",
      Remarks: `${activity} | DC:${dc}`
    };
  });

// ------------------- Crew 변환 -------------------
console.log("👨‍✈️ Crew 데이터 변환 중...");
const crewSet = new Set();
rows.forEach(r => {
  const crewStr = r[headers.indexOf("Crew")];
  if (!crewStr) return;
  crewStr.split(",").forEach(name => {
    const clean = name.trim();
    if (clean) crewSet.add(clean);
  });
});
const people = Array.from(crewSet).map(name => {
  const parts = name.split(" ");
  return {
    FirstName: parts.slice(1).join(" ") || parts[0],
    LastName: parts[0],
    Role: "Crew"
  };
});

// ------------------- Aircraft 변환 -------------------
console.log("🛩️ Aircraft 데이터 변환 중...");
const aircraftSet = new Set();
rows.forEach(r => {
  const reg = r[headers.indexOf("AcReg")];
  if (reg) aircraftSet.add(reg);
});
const aircrafts = Array.from(aircraftSet).map(reg => ({
  Registration: reg,
  Type: "",
  Operator: "Korean Air"
}));

// ------------------- XLSX 저장 함수 -------------------
function saveToXlsx(data, filename) {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
  const outPath = path.join(outputDir, filename);
  xlsx.writeFile(wb, outPath);
  console.log(`✅ ${filename} 저장 완료 (${data.length}행)`);
}

// ------------------- 파일 생성 -------------------
saveToXlsx(flights, "rb_logbook_flights.xlsx");
saveToXlsx(people, "rb_logbook_people.xlsx");
saveToXlsx(aircrafts, "rb_logbook_aircrafts.xlsx");

console.log("🎉 모든 RB Logbook 변환 완료!");
