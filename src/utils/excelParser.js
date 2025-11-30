import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract lottery draw data
 * @param {string} filePath - Path to the Excel file
 * @returns {Promise<Array>} Array of draw objects
 */
export async function parseExcelFile(filePath) {
  try {
    console.log(`Fetching file: ${filePath}`);
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`File loaded, size: ${arrayBuffer.byteLength} bytes`);

    // Read with different options to handle various Excel formats
    const workbook = XLSX.read(arrayBuffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    console.log(`Workbook sheets: ${workbook.SheetNames.join(', ')}`);

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Check if worksheet has range
    if (!worksheet['!ref']) {
      console.error('No range found in worksheet');
      return [];
    }

    let range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`Initial sheet range: ${worksheet['!ref']} (${range.e.r + 1} rows, ${range.e.c + 1} cols)`);

    // Always scan column A (Concurso) to find the last filled row
    console.log('Scanning column A (Concurso) to find last filled row...');

    let lastFilledRow = 0;
    let maxCol = range.e.c;
    let consecutiveEmpty = 0;

    // Scan up to 10000 rows in column A to find the last concurso number
    for (let R = 0; R < 10000; R++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: 0 }); // Column A
      const cell = worksheet[cellAddress];

      if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
        lastFilledRow = R;
        consecutiveEmpty = 0;

        // Log every 1000 rows to track progress
        if (R % 1000 === 0 && R > 0) {
          console.log(`Scanning... row ${R}, concurso: ${cell.v}`);
        }
      } else {
        consecutiveEmpty++;
      }

      // If we find 50 consecutive empty cells in column A after finding data, stop
      if (consecutiveEmpty > 50 && lastFilledRow > 0) {
        console.log(`Stopped at row ${R} after ${consecutiveEmpty} empty rows`);
        break;
      }
    }

    console.log(`Last filled row in column A: ${lastFilledRow + 1} (row index: ${lastFilledRow})`);

    // Check the last cell value
    if (lastFilledRow > 0) {
      const lastCell = worksheet[XLSX.utils.encode_cell({ r: lastFilledRow, c: 0 })];
      console.log(`Last concurso number found: ${lastCell ? lastCell.v : 'N/A'}`);
    }

    // Also check the actual number of columns with data
    if (lastFilledRow > 0) {
      for (let C = 0; C < 50; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 1, c: C }); // Check row 1 (first data row)
        if (worksheet[cellAddress] && worksheet[cellAddress].v !== undefined) {
          maxCol = Math.max(maxCol, C);
        }
      }
    }

    // Update range to include all data
    range = { s: { r: 0, c: 0 }, e: { r: lastFilledRow, c: maxCol } };
    console.log(`Final range: ${range.e.r + 1} rows, ${range.e.c + 1} columns`);

    // Force manual cell reading for all rows
    console.log(`Reading ${range.e.r + 1} rows manually...`);
    const jsonData = [];

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const row = [];
      let hasData = false;

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];

        if (cell && cell.v !== undefined) {
          row.push(cell.v);
          hasData = true;
        } else {
          row.push(null);
        }
      }

      // Only add rows that have at least some data
      if (hasData) {
        jsonData.push(row);
      }
    }

    console.log(`Manually parsed ${jsonData.length} rows`);

    // Debug: show first few rows
    if (jsonData.length > 0) {
      console.log('First row (header):', jsonData[0].slice(0, 10));
      if (jsonData.length > 1) {
        console.log('Second row (sample):', jsonData[1].slice(0, 10));
      }
      if (jsonData.length > 2) {
        console.log('Third row (sample):', jsonData[2].slice(0, 10));
      }
    }

    return jsonData;
  } catch (error) {
    console.error(`Error parsing Excel file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Parse Lotofácil Excel data
 * @param {string} filePath - Path to Lotofácil Excel file
 * @returns {Promise<Array>} Array of draw objects
 */
export async function parseLotofacilData(filePath = '/Lotofacil.xlsx') {
  const rawData = await parseExcelFile(filePath);

  console.log(`Total rows in Lotofácil file: ${rawData.length} (including header)`);

  if (rawData.length <= 1) {
    console.error('⚠️ Arquivo Lotofácil vazio ou só contém cabeçalho!');
    console.error('📥 Baixe os dados históricos em: https://loterias.caixa.gov.br/');
    return [];
  }

  // Log first and last concurso numbers for verification
  if (rawData.length > 1) {
    console.log(`First concurso: ${rawData[1][0]}`);
    console.log(`Last concurso: ${rawData[rawData.length - 1][0]}`);
  }

  // Skip header row and parse data
  // Assuming format: Concurso, Data, Bola1, Bola2, ..., Bola15
  const draws = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue; // Skip empty rows

    // Debug first few rows
    if (i <= 3) {
      console.log(`Row ${i} length: ${row.length}, content:`, row.slice(0, 5));
    }

    const draw = {
      concurso: row[0],
      data: row[1],
      numeros: []
    };

    // Extract numbers from columns 2-16 (exactly 15 numbers for Lotofácil)
    for (let j = 2; j <= 16; j++) {
      if (row[j] !== undefined && row[j] !== null && row[j] !== '') {
        const num = parseInt(row[j]);
        if (!isNaN(num) && num >= 1 && num <= 25) {
          draw.numeros.push(num);
        }
      }
    }

    // Only add if we have exactly 15 numbers
    if (draw.numeros.length === 15) {
      draws.push(draw);
    } else if (i <= 3) {
      console.log(`Row ${i} has ${draw.numeros.length} numbers (expected 15), numbers:`, draw.numeros);
    }
  }

  console.log(`Loaded ${draws.length} Lotofácil draws`);
  return draws;
}

/**
 * Parse Mega-Sena Excel data
 * @param {string} filePath - Path to Mega-Sena Excel file
 * @returns {Promise<Array>} Array of draw objects
 */
export async function parseMegaSenaData(filePath = '/Mega-Sena.xlsx') {
  const rawData = await parseExcelFile(filePath);

  console.log(`Total rows in Mega-Sena file: ${rawData.length} (including header)`);

  if (rawData.length <= 1) {
    console.error('⚠️ Arquivo Mega-Sena vazio ou só contém cabeçalho!');
    console.error('📥 Baixe os dados históricos em: https://loterias.caixa.gov.br/');
    return [];
  }

  // Log first and last concurso numbers for verification
  if (rawData.length > 1) {
    console.log(`First concurso: ${rawData[1][0]}`);
    console.log(`Last concurso: ${rawData[rawData.length - 1][0]}`);
  }

  // Skip header row and parse data
  // Assuming format: Concurso, Data, Bola1, Bola2, ..., Bola6
  const draws = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue; // Skip empty rows

    // Debug first few rows
    if (i <= 3) {
      console.log(`Row ${i} length: ${row.length}, content:`, row.slice(0, 5));
    }

    const draw = {
      concurso: row[0],
      data: row[1],
      numeros: []
    };

    // Extract numbers from columns 2-7 (exactly 6 numbers for Mega-Sena)
    for (let j = 2; j <= 7; j++) {
      if (row[j] !== undefined && row[j] !== null && row[j] !== '') {
        const num = parseInt(row[j]);
        if (!isNaN(num) && num >= 1 && num <= 60) {
          draw.numeros.push(num);
        }
      }
    }

    // Only add if we have exactly 6 numbers
    if (draw.numeros.length === 6) {
      draws.push(draw);
    } else if (i <= 3) {
      console.log(`Row ${i} has ${draw.numeros.length} numbers (expected 6), numbers:`, draw.numeros);
    }
  }

  console.log(`Loaded ${draws.length} Mega-Sena draws`);
  return draws;
}

/**
 * Get all unique numbers from draws
 * @param {Array} draws - Array of draw objects
 * @returns {Set} Set of unique numbers
 */
export function getUniqueNumbers(draws) {
  const uniqueNumbers = new Set();
  draws.forEach(draw => {
    draw.numeros.forEach(num => uniqueNumbers.add(num));
  });
  return uniqueNumbers;
}
