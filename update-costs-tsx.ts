import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import * as fs from "fs";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  // Read the SQL file
  const sqlContent = fs.readFileSync('/home/ubuntu/update_costs.sql', 'utf-8');
  const updates = sqlContent.split('\n').filter(line => line.trim());

  console.log(`Found ${updates.length} update statements`);

  // Execute updates in batches
  const batchSize = 50;
  let updated = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    for (const sqlStr of batch) {
      try {
        await db.execute(sql.raw(sqlStr));
        updated++;
      } catch (err: any) {
        console.error(`Error executing: ${sqlStr.substring(0, 100)}...`);
        console.error(err.message);
      }
    }
    
    console.log(`Updated ${updated}/${updates.length} projects...`);
  }

  console.log(`\nDone! Updated ${updated} projects with cost data.`);

  // Verify the update
  const result = await db.execute(sql.raw("SELECT SUM(projectCost) as totalCost, SUM(contractCost) as totalContract FROM projects"));
  console.log(`Total project cost in database:`, result);

  process.exit(0);
}

main().catch(console.error);
