#!/usr/bin/env node
/**
 * Script para configurar execução automática diária
 * Execute: node scripts/setup-cron.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupWindowsTask() {
  console.log('🪟 Configurando tarefa agendada no Windows...');

  const projectPath = path.join(__dirname, '..');
  const scriptPath = path.join(projectPath, 'scripts', 'sync-local.js');

  // Comando para criar tarefa no Windows
  const taskName = 'LoteriasSync';
  const taskCommand = `schtasks /create /tn "${taskName}" /tr "node \\"${scriptPath}\\"" /sc daily /st 06:00 /f`;

  try {
    execSync(taskCommand, { stdio: 'inherit' });
    console.log('✅ Tarefa agendada criada com sucesso!');
    console.log(`📅 A sincronização será executada diariamente às 06:00`);
    console.log(`📂 Projeto: ${projectPath}`);

    // Testa a execução
    console.log('\n🧪 Testando execução...');
    execSync(`node "${scriptPath}"`, { stdio: 'inherit', cwd: projectPath });

  } catch (error) {
    console.error('❌ Erro ao criar tarefa agendada:', error.message);
    console.log('\n📝 Configuração manual:');
    console.log('1. Abra o Agendador de Tarefas do Windows');
    console.log('2. Crie uma nova tarefa básica');
    console.log('3. Configure para executar diariamente às 06:00');
    console.log(`4. Ação: node "${scriptPath}"`);
    console.log(`5. Diretório inicial: ${projectPath}`);
  }
}

async function setupLinuxCron() {
  console.log('🐧 Configurando cron job no Linux...');

  const projectPath = path.join(__dirname, '..');
  const scriptPath = path.join(projectPath, 'scripts', 'sync-local.js');

  const cronJob = `0 6 * * * cd "${projectPath}" && node "${scriptPath}" >> /tmp/loterias-sync.log 2>&1`;

  console.log('📝 Adicione esta linha ao seu crontab:');
  console.log(`   ${cronJob}`);
  console.log('\n💡 Para editar o crontab:');
  console.log('   crontab -e');
  console.log('\n📋 Para ver logs:');
  console.log('   tail -f /tmp/loterias-sync.log');
}

async function main() {
  console.log('⚙️ Configurando sincronização automática...\n');

  const platform = process.platform;

  if (platform === 'win32') {
    await setupWindowsTask();
  } else if (platform === 'linux' || platform === 'darwin') {
    await setupLinuxCron();
  } else {
    console.log(`❓ Sistema operacional não suportado: ${platform}`);
    console.log('Configure manualmente a execução diária do script:');
    console.log(`   node scripts/sync-local.js`);
  }

  console.log('\n📚 Comandos úteis:');
  console.log('   npm run sync        - Executa sincronização manual');
  console.log('   npm run sync:help   - Mostra ajuda do sistema de sync');
}

main().catch(console.error);