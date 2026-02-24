import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function importContractors() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('Starting contractor import from projects...');
    
    // Get unique contractors from projects
    const [contractors] = await connection.execute(`
      SELECT 
        contractor as name,
        contractorTin as tin,
        COUNT(*) as projectCount,
        SUM(CAST(COALESCE(contractCost, 0) AS DECIMAL(18,2))) as totalValue,
        SUM(CASE WHEN LOWER(status) LIKE '%completed%' THEN 1 ELSE 0 END) as completedCount,
        SUM(CASE WHEN LOWER(status) LIKE '%ongoing%' OR LOWER(status) LIKE '%on going%' THEN 1 ELSE 0 END) as ongoingCount
      FROM projects 
      WHERE contractor IS NOT NULL 
        AND contractor != '' 
        AND TRIM(contractor) != ''
      GROUP BY contractor, contractorTin
      ORDER BY projectCount DESC
    `);
    
    console.log(`Found ${contractors.length} unique contractors in projects`);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const contractor of contractors) {
      // Check if contractor already exists (by name or TIN)
      const [existing] = await connection.execute(
        'SELECT id FROM contractors WHERE name = ? OR (tin IS NOT NULL AND tin != "" AND tin = ?)',
        [contractor.name, contractor.tin || '']
      );
      
      if (existing.length > 0) {
        // Update existing contractor stats
        await connection.execute(`
          UPDATE contractors SET
            totalContracts = ?,
            totalContractValue = ?,
            completedContracts = ?,
            ongoingContracts = ?,
            updatedAt = NOW()
          WHERE id = ?
        `, [
          contractor.projectCount,
          contractor.totalValue || 0,
          contractor.completedCount || 0,
          contractor.ongoingCount || 0,
          existing[0].id
        ]);
        skipped++;
        console.log(`Updated existing contractor: ${contractor.name}`);
      } else {
        // Insert new contractor
        await connection.execute(`
          INSERT INTO contractors (
            name, tin, status, totalContracts, totalContractValue, 
            completedContracts, ongoingContracts, createdAt, updatedAt
          ) VALUES (?, ?, 'Active', ?, ?, ?, ?, NOW(), NOW())
        `, [
          contractor.name,
          contractor.tin || null,
          contractor.projectCount,
          contractor.totalValue || 0,
          contractor.completedCount || 0,
          contractor.ongoingCount || 0
        ]);
        inserted++;
        console.log(`Inserted new contractor: ${contractor.name}`);
      }
    }
    
    console.log(`\nImport complete!`);
    console.log(`- Inserted: ${inserted} new contractors`);
    console.log(`- Updated: ${skipped} existing contractors`);
    
    // Now create contract history entries for each project
    console.log('\nCreating contract history entries...');
    
    const [projects] = await connection.execute(`
      SELECT 
        p.id as projectId,
        p.projectName,
        p.contractor,
        p.contractCost,
        p.ntpDate,
        p.dateCompleted,
        p.status,
        c.id as contractorId
      FROM projects p
      JOIN contractors c ON p.contractor = c.name
      WHERE p.contractor IS NOT NULL AND p.contractor != ''
    `);
    
    let historyInserted = 0;
    
    for (const project of projects) {
      // Check if history entry already exists
      const [existingHistory] = await connection.execute(
        'SELECT id FROM contract_history WHERE contractorId = ? AND projectId = ?',
        [project.contractorId, project.projectId]
      );
      
      if (existingHistory.length === 0) {
        // Determine status based on project status
        let contractStatus = 'Ongoing';
        if (project.status) {
          const statusLower = project.status.toLowerCase();
          if (statusLower.includes('completed')) contractStatus = 'Completed';
          else if (statusLower.includes('terminated')) contractStatus = 'Terminated';
          else if (statusLower.includes('suspended')) contractStatus = 'Suspended';
        }
        
        await connection.execute(`
          INSERT INTO contract_history (
            contractorId, projectId, projectTitle, contractAmount,
            startDate, endDate, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          project.contractorId,
          project.projectId,
          project.projectName,
          project.contractCost || 0,
          project.ntpDate || null,
          project.dateCompleted || null,
          contractStatus
        ]);
        historyInserted++;
      }
    }
    
    console.log(`Created ${historyInserted} contract history entries`);
    
    // Get final counts
    const [[{ totalContractors }]] = await connection.execute('SELECT COUNT(*) as totalContractors FROM contractors');
    const [[{ totalHistory }]] = await connection.execute('SELECT COUNT(*) as totalHistory FROM contract_history');
    
    console.log(`\nFinal database state:`);
    console.log(`- Total contractors: ${totalContractors}`);
    console.log(`- Total contract history entries: ${totalHistory}`);
    
  } catch (error) {
    console.error('Error importing contractors:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

importContractors().catch(console.error);
