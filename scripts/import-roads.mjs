import { drizzle } from "drizzle-orm/mysql2";
import XLSX from "xlsx";
import { readFileSync } from "fs";

// Read the Excel file
const workbook = XLSX.readFile("./LISTOFPROVINCIALROAD.xlsx");

// Use the "road inventory 2024" sheet as it has the cleanest data
const sheetName = " road inventory 2024";
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Connect to database
const db = drizzle(process.env.DATABASE_URL);

// Parse and insert roads
const roads = [];
let currentMunicipality = "";

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  
  // Skip empty rows and header rows
  if (!row || row.length === 0) continue;
  
  // Check if this is a municipality header
  const firstCell = String(row[1] || "").trim();
  if (firstCell.startsWith("MUNICIPALITY OF")) {
    currentMunicipality = firstCell.replace("MUNICIPALITY OF ", "").trim();
    continue;
  }
  
  // Skip if no road ID or road name
  const roadId = row[1];
  const roadName = row[2];
  if (!roadId || !roadName || typeof roadName !== "string") continue;
  if (roadName.includes("SUB-TOTAL") || roadName.includes("LENGTH")) continue;
  
  // Parse numeric values
  const parseNum = (val) => {
    if (val === undefined || val === null || val === "") return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };
  
  const road = {
    roadId: String(roadId),
    roadName: roadName.trim(),
    municipality: currentMunicipality,
    lengthKm: parseNum(row[3]),
    concreteLengthKm: parseNum(row[5]),
    asphaltLengthKm: parseNum(row[6]),
    earthLengthKm: parseNum(row[7]),
    gravelLengthKm: parseNum(row[8]),
    roadCondition: row[9] ? String(row[9]).trim() : null,
  };
  
  // Validate road condition
  if (road.roadCondition && !["Good", "Fair", "Poor", "Bad"].includes(road.roadCondition)) {
    road.roadCondition = null;
  }
  
  roads.push(road);
}

console.log(`Found ${roads.length} roads to import`);

// Insert roads in batches
const batchSize = 50;
let inserted = 0;

for (let i = 0; i < roads.length; i += batchSize) {
  const batch = roads.slice(i, i + batchSize);
  
  const values = batch.map(r => `(
    ${r.roadId ? `'${r.roadId.replace(/'/g, "''")}'` : "NULL"},
    '${r.roadName.replace(/'/g, "''")}',
    ${r.municipality ? `'${r.municipality.replace(/'/g, "''")}'` : "NULL"},
    ${r.lengthKm !== null ? r.lengthKm : "NULL"},
    ${r.concreteLengthKm !== null ? r.concreteLengthKm : "NULL"},
    ${r.asphaltLengthKm !== null ? r.asphaltLengthKm : "NULL"},
    ${r.earthLengthKm !== null ? r.earthLengthKm : "NULL"},
    ${r.gravelLengthKm !== null ? r.gravelLengthKm : "NULL"},
    ${r.roadCondition ? `'${r.roadCondition}'` : "NULL"},
    NOW(),
    NOW()
  )`).join(",\n");
  
  const sql = `INSERT INTO provincial_roads 
    (roadId, roadName, municipality, lengthKm, concreteLengthKm, asphaltLengthKm, earthLengthKm, gravelLengthKm, roadCondition, createdAt, updatedAt)
    VALUES ${values}`;
  
  try {
    await db.execute(sql);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${roads.length} roads`);
  } catch (err) {
    console.error(`Error inserting batch:`, err.message);
  }
}

console.log(`\nImport complete! ${inserted} roads imported.`);

// Show summary by municipality
const summary = {};
roads.forEach(r => {
  if (!summary[r.municipality]) {
    summary[r.municipality] = { count: 0, totalKm: 0 };
  }
  summary[r.municipality].count++;
  summary[r.municipality].totalKm += r.lengthKm || 0;
});

console.log("\nRoads by Municipality:");
Object.entries(summary).sort((a, b) => b[1].count - a[1].count).forEach(([mun, data]) => {
  console.log(`  ${mun}: ${data.count} roads, ${data.totalKm.toFixed(2)} km`);
});

process.exit(0);
