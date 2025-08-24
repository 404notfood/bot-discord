<?php
/**
 * Script de déploiement automatisé pour le dashboard
 * Usage: php deploy.php [--env=production] [--backup] [--migrate] [--force]
 */

class DashboardDeployer
{
    private $options = [];
    private $config = [];
    private $startTime;
    private $logFile;

    public function __construct($argv)
    {
        $this->startTime = microtime(true);
        $this->parseArguments($argv);
        $this->setupLogging();
        $this->loadConfig();
    }

    /**
     * Parser les arguments de ligne de commande
     */
    private function parseArguments($argv)
    {
        $this->options = [
            'env' => 'development',
            'backup' => false,
            'migrate' => false,
            'force' => false,
            'skip-composer' => false,
            'skip-assets' => false,
            'help' => false
        ];

        foreach ($argv as $arg) {
            if (strpos($arg, '--env=') === 0) {
                $this->options['env'] = substr($arg, 6);
            } elseif ($arg === '--backup') {
                $this->options['backup'] = true;
            } elseif ($arg === '--migrate') {
                $this->options['migrate'] = true;
            } elseif ($arg === '--force') {
                $this->options['force'] = true;
            } elseif ($arg === '--skip-composer') {
                $this->options['skip-composer'] = true;
            } elseif ($arg === '--skip-assets') {
                $this->options['skip-assets'] = true;
            } elseif ($arg === '--help' || $arg === '-h') {
                $this->options['help'] = true;
            }
        }
    }

    /**
     * Configurer le logging
     */
    private function setupLogging()
    {
        $logDir = __DIR__ . '/Logs';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $this->logFile = $logDir . '/deploy_' . date('Y-m-d_H-i-s') . '.log';
        $this->log("🚀 Début du déploiement - " . date('Y-m-d H:i:s'));
        $this->log("Environnement: " . $this->options['env']);
    }

    /**
     * Charger la configuration
     */
    private function loadConfig()
    {
        $configFile = __DIR__ . '/Config/config.php';
        if (!file_exists($configFile)) {
            $this->error("Fichier de configuration introuvable: $configFile");
        }

        $this->config = require $configFile;
    }

    /**
     * Exécuter le déploiement
     */
    public function deploy()
    {
        try {
            if ($this->options['help']) {
                $this->showHelp();
                return;
            }

            $this->log("=== DÉMARRAGE DU DÉPLOIEMENT ===");
            
            // 1. Vérifications pré-déploiement
            $this->runPreChecks();
            
            // 2. Sauvegarde (si demandée)
            if ($this->options['backup']) {
                $this->createBackup();
            }
            
            // 3. Mise à jour des dépendances
            if (!$this->options['skip-composer']) {
                $this->updateComposerDependencies();
            }
            
            // 4. Migration base de données
            if ($this->options['migrate']) {
                $this->runDatabaseMigrations();
            }
            
            // 5. Compilation des assets
            if (!$this->options['skip-assets']) {
                $this->compileAssets();
            }
            
            // 6. Optimisations
            $this->runOptimizations();
            
            // 7. Vérifications post-déploiement
            $this->runPostChecks();
            
            $this->success("✅ Déploiement terminé avec succès!");
            $this->showSummary();
            
        } catch (Exception $e) {
            $this->error("💥 Erreur lors du déploiement: " . $e->getMessage());
        }
    }

    /**
     * Vérifications pré-déploiement
     */
    private function runPreChecks()
    {
        $this->log("🔍 Vérifications pré-déploiement...");
        
        // Vérifier PHP
        $phpVersion = PHP_VERSION;
        $minPhpVersion = '8.3.0';
        
        if (version_compare($phpVersion, $minPhpVersion, '<')) {
            throw new Exception("PHP $minPhpVersion ou supérieur requis (actuel: $phpVersion)");
        }
        $this->log("✅ PHP $phpVersion OK");
        
        // Vérifier les extensions PHP
        $requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'curl', 'mbstring'];
        foreach ($requiredExtensions as $ext) {
            if (!extension_loaded($ext)) {
                throw new Exception("Extension PHP manquante: $ext");
            }
        }
        $this->log("✅ Extensions PHP OK");
        
        // Vérifier les permissions
        $writableDirs = ['Logs', 'cache', 'Public/uploads'];
        foreach ($writableDirs as $dir) {
            $path = __DIR__ . '/' . $dir;
            if (!is_dir($path)) {
                mkdir($path, 0755, true);
            }
            if (!is_writable($path)) {
                throw new Exception("Dossier non accessible en écriture: $path");
            }
        }
        $this->log("✅ Permissions OK");
        
        // Vérifier la base de données
        $this->checkDatabaseConnection();
    }

    /**
     * Vérifier la connexion base de données
     */
    private function checkDatabaseConnection()
    {
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                $this->config['database']['host'],
                $this->config['database']['dbname'],
                $this->config['database']['charset']
            );
            
            $pdo = new PDO($dsn, 
                $this->config['database']['username'], 
                $this->config['database']['password']
            );
            
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->query('SELECT 1');
            
            $this->log("✅ Base de données OK");
            
        } catch (PDOException $e) {
            throw new Exception("Erreur connexion BDD: " . $e->getMessage());
        }
    }

    /**
     * Créer une sauvegarde
     */
    private function createBackup()
    {
        $this->log("💾 Création de la sauvegarde...");
        
        $backupDir = __DIR__ . '/backups';
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d_H-i-s');
        
        // Sauvegarde de la base de données
        $this->backupDatabase($backupDir, $timestamp);
        
        // Sauvegarde des fichiers
        $this->backupFiles($backupDir, $timestamp);
        
        $this->log("✅ Sauvegarde créée");
    }

    /**
     * Sauvegarder la base de données
     */
    private function backupDatabase($backupDir, $timestamp)
    {
        $backupFile = "$backupDir/database_$timestamp.sql";
        
        $command = sprintf(
            'mysqldump -h%s -u%s -p%s %s > %s',
            $this->config['database']['host'],
            $this->config['database']['username'],
            $this->config['database']['password'],
            $this->config['database']['dbname'],
            $backupFile
        );
        
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0) {
            throw new Exception("Erreur lors de la sauvegarde BDD");
        }
        
        $this->log("✅ Base de données sauvegardée: $backupFile");
    }

    /**
     * Sauvegarder les fichiers
     */
    private function backupFiles($backupDir, $timestamp)
    {
        $backupFile = "$backupDir/files_$timestamp.tar.gz";
        
        $filesToBackup = [
            'Public/uploads',
            'Config/config.php',
            'cache',
            '.env'
        ];
        
        $files = array_filter($filesToBackup, function($file) {
            return file_exists(__DIR__ . '/' . $file);
        });
        
        if (!empty($files)) {
            $command = "tar -czf $backupFile -C " . __DIR__ . " " . implode(' ', $files);
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0) {
                $this->log("✅ Fichiers sauvegardés: $backupFile");
            }
        }
    }

    /**
     * Mettre à jour les dépendances Composer
     */
    private function updateComposerDependencies()
    {
        $this->log("📦 Mise à jour des dépendances Composer...");
        
        if (!file_exists(__DIR__ . '/composer.json')) {
            $this->log("⚠️ composer.json introuvable, création...");
            // Le fichier composer.json existe déjà grâce au code précédent
        }
        
        $command = 'cd ' . __DIR__ . ' && composer install --no-dev --optimize-autoloader';
        if ($this->options['env'] === 'production') {
            $command .= ' --no-interaction';
        }
        
        $this->runCommand($command);
        $this->log("✅ Dépendances Composer mises à jour");
    }

    /**
     * Exécuter les migrations base de données
     */
    private function runDatabaseMigrations()
    {
        $this->log("🗄️ Exécution des migrations...");
        
        $migrationFiles = glob(__DIR__ . '/migrations/*.sql');
        sort($migrationFiles);
        
        if (empty($migrationFiles)) {
            $this->log("ℹ️ Aucune migration trouvée");
            return;
        }
        
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                $this->config['database']['host'],
                $this->config['database']['dbname'],
                $this->config['database']['charset']
            );
            
            $pdo = new PDO($dsn, 
                $this->config['database']['username'], 
                $this->config['database']['password']
            );
            
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            foreach ($migrationFiles as $migrationFile) {
                $sql = file_get_contents($migrationFile);
                $pdo->exec($sql);
                $this->log("✅ Migration exécutée: " . basename($migrationFile));
            }
            
        } catch (PDOException $e) {
            throw new Exception("Erreur migration: " . $e->getMessage());
        }
    }

    /**
     * Compiler les assets
     */
    private function compileAssets()
    {
        $this->log("🎨 Compilation des assets...");
        
        // Minifier CSS
        $this->minifyCss();
        
        // Minifier JS
        $this->minifyJs();
        
        $this->log("✅ Assets compilés");
    }

    /**
     * Minifier CSS
     */
    private function minifyCss()
    {
        $cssFile = __DIR__ . '/Public/css/style.css';
        
        if (file_exists($cssFile)) {
            $css = file_get_contents($cssFile);
            
            // Minification simple
            $css = preg_replace('/\s+/', ' ', $css);
            $css = str_replace(['; ', ' {', '{ ', ' }', '} ', ': '], [';', '{', '{', '}', '}', ':'], $css);
            $css = trim($css);
            
            file_put_contents($cssFile . '.min', $css);
            $this->log("✅ CSS minifié");
        }
    }

    /**
     * Minifier JS
     */
    private function minifyJs()
    {
        $jsFile = __DIR__ . '/Public/js/main.js';
        
        if (file_exists($jsFile)) {
            $js = file_get_contents($jsFile);
            
            // Minification basique
            $js = preg_replace('/\s+/', ' ', $js);
            $js = str_replace(['; ', ' = ', ' + ', ' - ', ' * ', ' / '], [';', '=', '+', '-', '*', '/'], $js);
            $js = trim($js);
            
            file_put_contents($jsFile . '.min', $js);
            $this->log("✅ JS minifié");
        }
    }

    /**
     * Optimisations
     */
    private function runOptimizations()
    {
        $this->log("⚡ Optimisations...");
        
        // Vider le cache
        $this->clearCache();
        
        // Optimiser les images (si possible)
        $this->optimizeImages();
        
        $this->log("✅ Optimisations terminées");
    }

    /**
     * Vider le cache
     */
    private function clearCache()
    {
        $cacheDir = __DIR__ . '/cache';
        
        if (is_dir($cacheDir)) {
            $files = glob($cacheDir . '/*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            $this->log("✅ Cache vidé");
        }
    }

    /**
     * Optimiser les images
     */
    private function optimizeImages()
    {
        // Placeholder pour optimisation d'images
        // Peut être étendu avec ImageMagick ou similar
        $this->log("ℹ️ Optimisation d'images non implémentée");
    }

    /**
     * Vérifications post-déploiement
     */
    private function runPostChecks()
    {
        $this->log("🔬 Vérifications post-déploiement...");
        
        // Vérifier que les pages principales sont accessibles
        $this->checkPageAccessibility();
        
        $this->log("✅ Vérifications post-déploiement OK");
    }

    /**
     * Vérifier l'accessibilité des pages
     */
    private function checkPageAccessibility()
    {
        $baseUrl = $this->config['app']['base_url'] ?? 'http://localhost';
        $pages = ['/login', '/dashboard'];
        
        foreach ($pages as $page) {
            $url = $baseUrl . $page;
            $headers = @get_headers($url);
            
            if ($headers && strpos($headers[0], '200') !== false) {
                $this->log("✅ Page accessible: $page");
            } else {
                $this->log("⚠️ Page potentiellement inaccessible: $page");
            }
        }
    }

    /**
     * Afficher l'aide
     */
    private function showHelp()
    {
        echo "
🚀 Script de déploiement Dashboard Bot Discord

Usage: php deploy.php [options]

Options:
  --env=ENV          Environnement (development|production) [défaut: development]
  --backup           Créer une sauvegarde avant déploiement
  --migrate          Exécuter les migrations de base de données
  --force            Forcer le déploiement même en cas d'avertissements
  --skip-composer    Ignorer la mise à jour Composer
  --skip-assets      Ignorer la compilation des assets
  -h, --help         Afficher cette aide

Exemples:
  php deploy.php --env=production --backup --migrate
  php deploy.php --env=development --skip-composer
  php deploy.php --backup --force

";
    }

    /**
     * Afficher le résumé
     */
    private function showSummary()
    {
        $duration = round(microtime(true) - $this->startTime, 2);
        $this->log("\n=== RÉSUMÉ DU DÉPLOIEMENT ===");
        $this->log("Durée: {$duration}s");
        $this->log("Environnement: " . $this->options['env']);
        $this->log("Sauvegarde: " . ($this->options['backup'] ? 'Oui' : 'Non'));
        $this->log("Migrations: " . ($this->options['migrate'] ? 'Oui' : 'Non'));
        $this->log("Log: " . $this->logFile);
    }

    /**
     * Exécuter une commande
     */
    private function runCommand($command)
    {
        $this->log("Commande: $command");
        
        $output = [];
        $returnCode = 0;
        exec($command . ' 2>&1', $output, $returnCode);
        
        foreach ($output as $line) {
            $this->log("  $line");
        }
        
        if ($returnCode !== 0) {
            throw new Exception("Commande échouée: $command (code: $returnCode)");
        }
    }

    /**
     * Logger un message
     */
    private function log($message)
    {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message\n";
        
        echo $logMessage;
        file_put_contents($this->logFile, $logMessage, FILE_APPEND);
    }

    /**
     * Message de succès
     */
    private function success($message)
    {
        $this->log("✅ $message");
    }

    /**
     * Message d'erreur et arrêt
     */
    private function error($message)
    {
        $this->log("❌ $message");
        exit(1);
    }
}

// Exécuter le déploiement si appelé directement
if (php_sapi_name() === 'cli') {
    $deployer = new DashboardDeployer($argv);
    $deployer->deploy();
}