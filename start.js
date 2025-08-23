/**
 * Script de démarrage du bot Discord
 * Permet de lancer le bot en arrière-plan même sur un hébergement simple
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Création du dossier de logs s'il n'existe pas
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
    fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
}

// Fichiers de log
const outLog = fs.openSync(path.join(__dirname, 'logs', 'bot-out.log'), 'a');
const errLog = fs.openSync(path.join(__dirname, 'logs', 'bot-error.log'), 'a');

// Horodatage pour les logs
const timestamp = new Date().toISOString();
fs.writeSync(outLog, `\n\n[${timestamp}] Démarrage du bot\n`);

// Chemin vers le fichier principal du bot
const botPath = path.join(__dirname, 'src', 'index.js');

// Vérification que le fichier existe
if (!fs.existsSync(botPath)) {
    const errorMsg = `Erreur: Le fichier principal du bot n'existe pas à l'emplacement: ${botPath}\n`;
    fs.writeSync(errLog, `[${timestamp}] ${errorMsg}`);
    console.error(errorMsg);
    process.exit(1);
}

// Lancement du bot
console.log('Démarrage du bot Discord...');
fs.writeSync(outLog, `[${timestamp}] Lancement du processus: node ${botPath}\n`);

// Utilisation de spawn pour lancer le bot en arrière-plan
const bot = spawn('node', [botPath], {
    detached: true,
    stdio: ['ignore', outLog, errLog]
});

// Détacher le processus pour qu'il continue à s'exécuter en arrière-plan
bot.unref();

// Écriture du PID dans un fichier pour pouvoir arrêter le bot plus tard
fs.writeFileSync(path.join(__dirname, 'bot.pid'), `${bot.pid}`);

console.log(`Bot démarré en arrière-plan avec PID: ${bot.pid}`);
console.log('Les logs sont disponibles dans le dossier "logs"');
console.log('Pour arrêter le bot, exécutez: node stop.js'); 