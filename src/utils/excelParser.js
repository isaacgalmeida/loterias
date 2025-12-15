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
 * Parse lottery data from JSON files (primary database)
 * Os arquivos JSON servem como banco de dados principal, atualizados pelo sync-lottery.js
 * @param {string} lotteryType - 'lotofacil' or 'megasena'
 * @returns {Promise<Array>} Array of draw objects
 */
async function parseLotteryData(lotteryType) {
  try {
    console.log(`📂 Carregando dados de ${lotteryType} do banco JSON...`);

    // PRIORIDADE 1: Carregar do arquivo JSON local (banco de dados principal)
    const jsonData = await parseLotteryDataFromFile(lotteryType);

    if (jsonData && jsonData.length > 0) {
      console.log(`✅ Carregados ${jsonData.length} concursos de ${lotteryType} do banco JSON`);
      return jsonData;
    }

    // PRIORIDADE 2: Se JSON estiver vazio, tenta a API como fallback
    console.log(`⚠️ Arquivo JSON vazio, tentando API como fallback...`);
    return await parseLotteryDataFromAPI(lotteryType);

  } catch (error) {
    console.error(`Erro ao carregar dados de ${lotteryType}:`, error);
    // PRIORIDADE 3: Último recurso - tenta a API
    return await parseLotteryDataFromAPI(lotteryType);
  }
}

/**
 * Parse lottery data from API (fallback only)
 * @param {string} lotteryType - 'lotofacil' or 'megasena'
 * @returns {Promise<Array>} Array of draw objects
 */
async function parseLotteryDataFromAPI(lotteryType) {
  try {
    console.log(`📡 Tentando carregar ${lotteryType} da API...`);

    const apiResponse = await fetch(`/api/get-updated-data?lottery=${lotteryType}`);

    if (apiResponse.ok) {
      const apiData = await apiResponse.json();

      if (apiData.success && apiData.data && apiData.data.draws) {
        console.log(`✅ Carregados ${apiData.data.draws.length} concursos de ${lotteryType} da API`);
        return apiData.data.draws;
      }
    }

    console.warn(`⚠️ API falhou para ${lotteryType}`);
    return [];

  } catch (error) {
    console.error(`Erro na API para ${lotteryType}:`, error);
    return [];
  }
}

/**
 * Parse lottery data from local JSON file (fallback)
 * @param {string} lotteryType - 'lotofacil' or 'megasena'
 * @returns {Promise<Array>} Array of draw objects
 */
async function parseLotteryDataFromFile(lotteryType) {
  try {
    const response = await fetch(`/data/${lotteryType}.json`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const draws = data.draws || [];

    console.log(`📁 Loaded ${draws.length} ${lotteryType} draws from local file`);
    return draws;

  } catch (error) {
    console.error(`Error loading ${lotteryType} from file:`, error);
    return [];
  }
}

/**
 * Parse Lotofácil Excel data
 * @param {string} filePath - Path to Lotofácil Excel file (deprecated, now uses API)
 * @returns {Promise<Array>} Array of draw objects
 */
export async function parseLotofacilData() {
  return parseLotteryData('lotofacil');
}

/**
 * Parse Mega-Sena Excel data
 * @param {string} filePath - Path to Mega-Sena Excel file (deprecated, now uses API)
 * @returns {Promise<Array>} Array of draw objects
 */
export async function parseMegaSenaData(filePath = '/Mega-Sena.xlsx') {
  return parseLotteryData('megasena');
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
