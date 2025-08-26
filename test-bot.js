// Test simple de démarrage du bot
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le .env
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('=== Test Bot Startup ===');
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? 'EXISTS' : 'MISSING');
console.log('CLIENT_ID:', process.env.CLIENT_ID ? 'EXISTS' : 'MISSING');
console.log('Working Directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Node version:', process.version);

// Test d'importation des modules principaux
try {
    const { Client } = await import('discord.js');
    console.log('✅ discord.js imported successfully');
    
    const client = new Client({ intents: [] });
    console.log('✅ Client created successfully');
    
    console.log('✅ Bot test completed successfully');
} catch (error) {
    console.error('❌ Error during bot test:', error.message);
    console.error('Stack:', error.stack);
}

process.exit(0);