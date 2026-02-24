import { drizzle } from 'drizzle-orm/mysql2';
import { readFileSync } from 'fs';
import 'dotenv/config';

// Read seed data
const seedData = JSON.parse(readFileSync('./seed-data.json', 'utf-8'));
console.log(`Loaded ${seedData.length} projects from seed-data.json`);

// Connect to database
const db = drizzle(process.env.DATABASE_URL);

// Create projects table insert statement
async function seedProjects() {
  console.log('Starting database seeding...');
  
  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < seedData.length; i += batchSize) {
    const batch = seedData.slice(i, i + batchSize);
    
    // Build insert values
    const values = batch.map(p => `(
      ${p.rowNumber ?? 'NULL'},
      ${p.category ? `'${p.category.replace(/'/g, "''")}'` : 'NULL'},
      '${p.projectName.replace(/'/g, "''")}',
      ${p.projectId ? `'${p.projectId.replace(/'/g, "''")}'` : 'NULL'},
      ${p.ppdoCategory ? `'${p.ppdoCategory.replace(/'/g, "''")}'` : 'NULL'},
      ${p.description ? `'${p.description.replace(/'/g, "''")}'` : 'NULL'},
      ${p.location ? `'${p.location.replace(/'/g, "''")}'` : 'NULL'},
      ${p.municipality ? `'${p.municipality.replace(/'/g, "''")}'` : 'NULL'},
      ${p.implementingOffice ? `'${p.implementingOffice.replace(/'/g, "''")}'` : 'NULL'},
      ${p.fiscalYear ?? 'NULL'},
      ${p.sourceOfFund ? `'${p.sourceOfFund.replace(/'/g, "''")}'` : 'NULL'},
      ${p.fundCategory ? `'${p.fundCategory.replace(/'/g, "''")}'` : 'NULL'},
      ${p.projectCost ?? 'NULL'},
      ${p.contractCost ?? 'NULL'},
      ${p.calendarDays ?? 'NULL'},
      ${p.ntpDate ? `'${p.ntpDate}'` : 'NULL'},
      ${p.extensionCount ?? 'NULL'},
      ${p.targetCompletionDate ? `'${p.targetCompletionDate}'` : 'NULL'},
      ${p.revisedCompletionDate ? `'${p.revisedCompletionDate}'` : 'NULL'},
      ${p.dateCompleted ? `'${p.dateCompleted}'` : 'NULL'},
      ${p.progressPercent ?? 'NULL'},
      ${p.procurementMode ? `'${p.procurementMode.replace(/'/g, "''")}'` : 'NULL'},
      ${p.status ? `'${p.status.replace(/'/g, "''")}'` : 'NULL'},
      ${p.contractor ? `'${p.contractor.replace(/'/g, "''")}'` : 'NULL'},
      ${p.contractorTin ? `'${p.contractorTin.replace(/'/g, "''")}'` : 'NULL'},
      ${p.statusReason ? `'${p.statusReason.replace(/'/g, "''")}'` : 'NULL'}
    )`).join(',\n');
    
    const sql = `INSERT INTO projects (
      rowNumber, category, projectName, projectId, ppdoCategory,
      description, location, municipality, implementingOffice, fiscalYear,
      sourceOfFund, fundCategory, projectCost, contractCost, calendarDays,
      ntpDate, extensionCount, targetCompletionDate, revisedCompletionDate, dateCompleted,
      progressPercent, procurementMode, status, contractor, contractorTin, statusReason
    ) VALUES ${values}`;
    
    try {
      await db.execute(sql);
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${seedData.length} projects...`);
    } catch (err) {
      console.error(`Error inserting batch starting at ${i}:`, err.message);
      // Try inserting one by one to find problematic records
      for (const p of batch) {
        try {
          const singleSql = `INSERT INTO projects (
            rowNumber, category, projectName, projectId, ppdoCategory,
            description, location, municipality, implementingOffice, fiscalYear,
            sourceOfFund, fundCategory, projectCost, contractCost, calendarDays,
            ntpDate, extensionCount, targetCompletionDate, revisedCompletionDate, dateCompleted,
            progressPercent, procurementMode, status, contractor, contractorTin, statusReason
          ) VALUES (
            ${p.rowNumber ?? 'NULL'},
            ${p.category ? `'${p.category.replace(/'/g, "''")}'` : 'NULL'},
            '${p.projectName.replace(/'/g, "''")}',
            ${p.projectId ? `'${p.projectId.replace(/'/g, "''")}'` : 'NULL'},
            ${p.ppdoCategory ? `'${p.ppdoCategory.replace(/'/g, "''")}'` : 'NULL'},
            ${p.description ? `'${p.description.replace(/'/g, "''")}'` : 'NULL'},
            ${p.location ? `'${p.location.replace(/'/g, "''")}'` : 'NULL'},
            ${p.municipality ? `'${p.municipality.replace(/'/g, "''")}'` : 'NULL'},
            ${p.implementingOffice ? `'${p.implementingOffice.replace(/'/g, "''")}'` : 'NULL'},
            ${p.fiscalYear ?? 'NULL'},
            ${p.sourceOfFund ? `'${p.sourceOfFund.replace(/'/g, "''")}'` : 'NULL'},
            ${p.fundCategory ? `'${p.fundCategory.replace(/'/g, "''")}'` : 'NULL'},
            ${p.projectCost ?? 'NULL'},
            ${p.contractCost ?? 'NULL'},
            ${p.calendarDays ?? 'NULL'},
            ${p.ntpDate ? `'${p.ntpDate}'` : 'NULL'},
            ${p.extensionCount ?? 'NULL'},
            ${p.targetCompletionDate ? `'${p.targetCompletionDate}'` : 'NULL'},
            ${p.revisedCompletionDate ? `'${p.revisedCompletionDate}'` : 'NULL'},
            ${p.dateCompleted ? `'${p.dateCompleted}'` : 'NULL'},
            ${p.progressPercent ?? 'NULL'},
            ${p.procurementMode ? `'${p.procurementMode.replace(/'/g, "''")}'` : 'NULL'},
            ${p.status ? `'${p.status.replace(/'/g, "''")}'` : 'NULL'},
            ${p.contractor ? `'${p.contractor.replace(/'/g, "''")}'` : 'NULL'},
            ${p.contractorTin ? `'${p.contractorTin.replace(/'/g, "''")}'` : 'NULL'},
            ${p.statusReason ? `'${p.statusReason.replace(/'/g, "''")}'` : 'NULL'}
          )`;
          await db.execute(singleSql);
          inserted++;
        } catch (singleErr) {
          console.error(`Failed to insert project: ${p.projectName.substring(0, 50)}...`, singleErr.message);
        }
      }
    }
  }
  
  console.log(`\nSeeding complete! Inserted ${inserted} projects.`);
  
  // Verify count
  const [result] = await db.execute('SELECT COUNT(*) as count FROM projects');
  console.log(`Total projects in database: ${result[0].count}`);
  
  process.exit(0);
}

seedProjects().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
