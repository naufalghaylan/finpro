import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { Prisma } from '../src/generated/prisma/client';

async function exportToCSV() {
  const models = Object.values(Prisma.ModelName);
  const exportDir = path.join(__dirname, '../exports');

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  console.log(`Found ${models.length} tables to export...`);

  for (const modelName of models) {
    // Prisma client model names are usually lowercase on the first letter
    const propertyName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    
    try {
      // @ts-ignore
      const data = await prisma[propertyName].findMany();
      
      if (!data || data.length === 0) {
        console.log(`No data found for table: ${modelName}`);
        continue;
      }

      // Extract headers from the first row
      const headers = Object.keys(data[0]);
      
      const csvRows = [];
      // Push the header row
      csvRows.push(headers.join(','));

      // Format data rows
      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header];
          
          if (val === null || val === undefined) {
            return '';
          }
          if (val instanceof Date) {
            return `"${val.toISOString()}"`;
          }
          if (typeof val === 'object') {
             // Stringify objects/arrays and escape double quotes
             return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          }
          
          const str = String(val);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          
          return str;
        });
        csvRows.push(values.join(','));
      }

      const csvContent = csvRows.join('\n');
      const filePath = path.join(exportDir, `${modelName}.csv`);
      fs.writeFileSync(filePath, csvContent, 'utf-8');
      
      console.log(`Exported ${data.length} rows for ${modelName} to ${filePath}`);
      
    } catch (error) {
      console.error(`Error exporting model ${modelName}:`, error);
    }
  }
  
  console.log('Export process completed.');
}

exportToCSV()
  .catch((e) => {
    console.error('Failed to export DB to CSV:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
