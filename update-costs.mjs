import { drizzle } from "drizzle-orm/mysql2";
import fs from "fs";

const db = drizzle(process.env.DATABASE_URL);

// Read the SQL file
const sqlContent = fs.readFileSync('/home/ubuntu/update_costs.sql', 'utf-8');
const updates = sqlContent.split('\n').filter(line => line.trim());

console.log(`Found ${updates.length} update statements`);

// Execute updates in batches
const batchSize = 50;
let updated = 0;

for (let i = 0; i < updates.length; i += batchSize) {
  const batch = updates.slice(i, i + batchSize);
  
  for (const sql of batch) {
    try {
      await db.execute(sql);
      updated++;
    } catch (err) {
      console.error(`Error executing: ${sql.substring(0, 100)}...`);
      console.error(err.message);
    }
  }
  
  console.log(`Updated ${updated}/${updates.length} projects...`);
}

console.log(`\nDone! Updated ${updated} projects with cost data.`);

// Verify the update
const [result] = await db.execute("SELECT SUM(projectCost) as totalCost FROM projects");
console.log(`Total project cost in database: ${result[0]?.totalCost}`);

process.exit(0);
