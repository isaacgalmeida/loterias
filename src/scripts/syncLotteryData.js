/**
 * Script de Sincronização de Dados das Loterias
 * Executa sincronização diária dos dados das loterias
 * Pode ser executado via cron job ou task scheduler
 */

import dataManager from '../services/dataManager.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Configurações do script
 */
const CONFIG = {
    // Diretório onde os dados são salvos
    dataDir: './public/data',
    
    // Log de execuções
    logFile: './logs/sync.log',
    
    // Configurações de retry
    maxRetries: 3,
    retryDelay: 5000, // 5 segundos
    
    // Configurações de backup
    keepBackups: 7, // Manter 7 backups
    backupDir: './backups'
};

/**
 * Logger simples
 */
class Logger {
    static async log(level, message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        console.log(logMessage);
        
        try {
            // Garante que o diretório de logs existe
            await fs.mkdir(path.dirname(CONFIG.logFile), { recursive: true });
            
            // Adiciona ao arquivo de log
            await fs.appendFile(CONFIG.logFile, logMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    
    static async info(message) { await this.log('info', message); }
    static async warn(message) { await this.log('warn', message); }
    static async error(message) { await this.log('error', message); }
    static async success(message) { await this.log('success', message); }
}

/**
 * Utilitários para backup
 */
class BackupManager {
    /**
     * Cria backup dos dados atuais
     */
    static async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(CONFIG.backupDir, timestamp);
            
            // Cria diretório de backup
            await fs.mkdir(backupPath, { recursive: true });
            
            // Copia arquivos de dados
            const dataFiles = await fs.readdir(CONFIG.dataDir);
            
            for (const file of dataFiles) {
                if (file.endsWith('.json')) {
                    const sourcePath = path.join(CONFIG.dataDir, file);
                    const destPath = path.join(backupPath, file);
                    await fs.copyFile(sourcePath, destPath);
                }
            }
            
            await Logger.info(`Backup created: ${backupPath}`);
            
            // Remove backups antigos
            await this.cleanOldBackups();
            
            return backupPath;
        } catch (error) {
            await Logger.error(`Backup failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Remove backups antigos
     */
    static async cleanOldBackups() {
        try {
            const backups = await fs.readdir(CONFIG.backupDir);
            const sortedBackups = backups
                .filter(name => name.match(/^\d{4}-\d{2}-\d{2}T/))
                .sort()
                .reverse();
            
            if (sortedBackups.length > CONFIG.keepBackups) {
                const toDelete = sortedBackups.slice(CONFIG.keepBackups);
                
                for (const backup of toDelete) {
                    const backupPath = path.join(CONFIG.backupDir, backup);
                    await fs.rm(backupPath, { recursive: true, force: true });
                    await Logger.info(`Removed old backup: ${backup}`);
                }
            }
        } catch (error) {
            await Logger.warn(`Failed to clean old backups: ${error.message}`);
        }
    }
}

/**
 * Salva dados no sistema de arquivos
 */
async function saveDataToFile(lotteryId, data) {
    try {
        const filePath = path.join(CONFIG.dataDir, `${lotteryId}.json`);
        
        // Garante que o diretório existe
        await fs.mkdir(CONFIG.dataDir, { recursive: true });
        
        // Prepara dados para salvar
        const fileData = {
            metadata: {
                lastUpdate: new Date().toISOString(),
                totalDraws: data.length,
                lotteryType: lotteryId,
                version: '1.0'
            },
            draws: data.sort((a, b) => a.concurso - b.concurso)
        };
        
        // Salva arquivo
        await fs.writeFile(filePath, JSON.stringify(fileData, null, 2), 'utf8');
        
        await Logger.success(`Saved ${data.length} draws for ${lotteryId} to ${filePath}`);
        
        return filePath;
    } catch (error) {
        await Logger.error(`Failed to save ${lotteryId} data: ${error.message}`);
        throw error;
    }
}

/**
 * Executa sincronização com retry
 */
async function syncWithRetry(forceFullSync = false) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
        try {
            await Logger.info(`Sync attempt ${attempt}/${CONFIG.maxRetries}`);
            
            // Executa sincronização
            const { results, errors } = await dataManager.syncAllLotteries(forceFullSync);
            
            // Salva dados sincronizados
            for (const [lotteryId, draws] of Object.entries(results)) {
                if (draws.length > 0) {
                    await saveDataToFile(lotteryId, draws);
                }
            }
            
            // Verifica se houve erros
            if (Object.keys(errors).length > 0) {
                await Logger.warn(`Sync completed with errors: ${JSON.stringify(errors)}`);
            } else {
                await Logger.success('Sync completed successfully for all lotteries');
            }
            
            return { results, errors };
            
        } catch (error) {
            lastError = error;
            await Logger.error(`Sync attempt ${attempt} failed: ${error.message}`);
            
            if (attempt < CONFIG.maxRetries) {
                await Logger.info(`Waiting ${CONFIG.retryDelay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
            }
        }
    }
    
    throw lastError;
}

/**
 * Função principal de sincronização
 */
async function main() {
    const startTime = Date.now();
    
    try {
        await Logger.info('='.repeat(50));
        await Logger.info('Starting lottery data synchronization');
        await Logger.info('='.repeat(50));
        
        // Verifica argumentos da linha de comando
        const args = process.argv.slice(2);
        const forceFullSync = args.includes('--full') || args.includes('-f');
        
        if (forceFullSync) {
            await Logger.info('Full synchronization requested');
        }
        
        // Cria backup antes da sincronização
        await Logger.info('Creating backup...');
        await BackupManager.createBackup();
        
        // Executa sincronização
        await Logger.info('Starting data synchronization...');
        const result = await syncWithRetry(forceFullSync);
        
        // Estatísticas finais
        const stats = dataManager.getAllStats();
        await Logger.info('Final statistics:');
        
        Object.entries(stats).forEach(async ([lotteryId, stat]) => {
            if (stat) {
                await Logger.info(`  ${lotteryId}: ${stat.totalDraws} draws (${stat.firstContest} - ${stat.lastContest})`);
            }
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        await Logger.success(`Synchronization completed in ${duration}s`);
        
        return result;
        
    } catch (error) {
        await Logger.error(`Synchronization failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Função para agendar execução diária
 */
function scheduleDailySync() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0); // 6:00 AM
    
    const msUntilTomorrow = tomorrow.getTime() - now.getTime();
    
    console.log(`Next sync scheduled for: ${tomorrow.toISOString()}`);
    
    setTimeout(() => {
        main().then(() => {
            // Agenda próxima execução
            scheduleDailySync();
        }).catch(error => {
            console.error('Scheduled sync failed:', error);
            // Tenta novamente em 1 hora
            setTimeout(scheduleDailySync, 60 * 60 * 1000);
        });
    }, msUntilTomorrow);
}

// Exporta funções para uso em outros módulos
export { main as syncLotteryData, scheduleDailySync, Logger, BackupManager };

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}