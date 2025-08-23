/**
 * Script d'arrêt du bot Discord
 * Permet d'arrêter proprement le bot lancé avec start.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Horodatage pour les logs
const timestamp = new Date().toISOString();

// Chemin vers le fichier PID
const pidFile = path.join(__dirname, 'bot.pid');

// Vérification que le fichier PID existe
if (!fs.existsSync(pidFile)) {
    console.error("Le fichier PID n'existe pas. Le bot n'est peut-être pas en cours d'exécution.");
    process.exit(1);
}

// Lecture du PID
const pid = fs.readFileSync(pidFile, 'utf8').trim();

console.log(`Tentative d'arrêt du bot avec PID: ${pid}`);

try {
    // Tente d'envoyer le signal SIGTERM au processus
    process.kill(parseInt(pid), 'SIGTERM');
    
    console.log(`Signal d'arrêt envoyé au bot.`);
    
    // Suppression du fichier PID
    fs.unlinkSync(pidFile);
    
    // Ajout d'une entrée dans les logs
    const outLog = fs.openSync(path.join(__dirname, 'logs', 'bot-out.log'), 'a');
    fs.writeSync(outLog, `\n[${timestamp}] Arrêt du bot (PID: ${pid})\n`);
    fs.closeSync(outLog);
    
    console.log('Bot arrêté avec succès.');
} catch (error) {
    if (error.code === 'ESRCH') {
        console.log(`Le processus avec PID ${pid} n'existe plus. Suppression du fichier PID.`);
        fs.unlinkSync(pidFile);
    } else {
        console.error(`Erreur lors de l'arrêt du bot:`, error);
        
        // Ajout de l'erreur dans les logs
        const errLog = fs.openSync(path.join(__dirname, 'logs', 'bot-error.log'), 'a');
        fs.writeSync(errLog, `\n[${timestamp}] Erreur lors de l'arrêt du bot (PID: ${pid}): ${error.message}\n`);
        fs.closeSync(errLog);
    }
} 