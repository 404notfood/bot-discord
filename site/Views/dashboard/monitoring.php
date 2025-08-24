<?php
$title = 'Monitoring Temps Réel - Dashboard Bot Discord';
$pageTitle = 'Monitoring Temps Réel';
$currentPage = 'monitoring';
$loggedIn = true;
ob_start();
?>

<div class="row mb-4">
    <div class="col-12">
        <div class="d-flex justify-content-between align-items-center">
            <h4 class="border-bottom pb-2 mb-3">🔴 Monitoring Temps Réel</h4>
            <div>
                <span class="badge bg-success" id="connection-status">🟢 Connecté</span>
                <small class="text-muted ms-2">Dernière mise à jour: <span id="last-update">--</span></small>
            </div>
        </div>
    </div>
</div>

<!-- Status Cards -->
<div class="row mb-4">
    <div class="col-md-3">
        <div class="card border-left-primary">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            Status Bot Discord
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                            <span id="bot-status-text">🟡 Vérification...</span>
                        </div>
                        <div class="text-xs text-muted">
                            Uptime: <span id="bot-uptime">--</span>
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-robot fa-2x text-gray-300"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-3">
        <div class="card border-left-success">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                            Base de Données
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                            <span id="db-status-text">🟡 Vérification...</span>
                        </div>
                        <div class="text-xs text-muted">
                            Ping: <span id="db-ping">-- ms</span>
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-database fa-2x text-gray-300"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-3">
        <div class="card border-left-info">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                            Utilisateurs Actifs
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                            <span id="active-users">--</span>
                        </div>
                        <div class="text-xs text-muted">
                            Dernière heure
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-users fa-2x text-gray-300"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-3">
        <div class="card border-left-warning">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                            Mémoire Utilisée
                        </div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                            <span id="memory-usage">--%</span>
                        </div>
                        <div class="progress progress-sm mr-2">
                            <div class="progress-bar bg-warning" id="memory-progress" role="progressbar" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-memory fa-2x text-gray-300"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Charts Row -->
<div class="row mb-4">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-chart-line"></i> Activité en Temps Réel
                </h6>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="chartDropdown" data-bs-toggle="dropdown">
                        <i class="fas fa-cog"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="toggleChart('commands')">Commandes</a></li>
                        <li><a class="dropdown-item" href="#" onclick="toggleChart('users')">Utilisateurs</a></li>
                        <li><a class="dropdown-item" href="#" onclick="toggleChart('errors')">Erreurs</a></li>
                    </ul>
                </div>
            </div>
            <div class="card-body">
                <canvas id="realtimeChart" width="400" height="200"></canvas>
            </div>
        </div>
    </div>
    
    <div class="col-md-4">
        <div class="card">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-tachometer-alt"></i> Métriques Système
                </h6>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <small class="text-muted">CPU Load Average</small>
                    <div class="progress progress-sm">
                        <div class="progress-bar bg-info" id="cpu-progress" role="progressbar" style="width: 0%"></div>
                    </div>
                    <small id="cpu-text">-- / -- / --</small>
                </div>
                
                <div class="mb-3">
                    <small class="text-muted">Disque Utilisé</small>
                    <div class="progress progress-sm">
                        <div class="progress-bar bg-warning" id="disk-progress" role="progressbar" style="width: 0%"></div>
                    </div>
                    <small id="disk-text">-- GB / -- GB</small>
                </div>
                
                <div class="mb-3">
                    <small class="text-muted">Temps de Réponse Moyen</small>
                    <div class="h4" id="response-time">-- ms</div>
                </div>
                
                <div>
                    <small class="text-muted">Taux d'Erreur</small>
                    <div class="h4" id="error-rate">--%</div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Services Status -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-server"></i> État des Services
                </h6>
            </div>
            <div class="card-body">
                <div class="row" id="services-status">
                    <div class="col-md-3 text-center">
                        <div class="service-indicator">
                            <div class="service-dot bg-secondary" id="scheduler-dot"></div>
                            <div class="service-name">Scheduler</div>
                            <small class="service-status" id="scheduler-status">Vérification...</small>
                        </div>
                    </div>
                    <div class="col-md-3 text-center">
                        <div class="service-indicator">
                            <div class="service-dot bg-secondary" id="api-dot"></div>
                            <div class="service-name">API Server</div>
                            <small class="service-status" id="api-status">Vérification...</small>
                        </div>
                    </div>
                    <div class="col-md-3 text-center">
                        <div class="service-indicator">
                            <div class="service-dot bg-secondary" id="monitoring-dot"></div>
                            <div class="service-name">Monitoring</div>
                            <small class="service-status" id="monitoring-status">Vérification...</small>
                        </div>
                    </div>
                    <div class="col-md-3 text-center">
                        <div class="service-indicator">
                            <div class="service-dot bg-secondary" id="cache-dot"></div>
                            <div class="service-name">Cache</div>
                            <small class="service-status" id="cache-status">Vérification...</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Recent Activities -->
<div class="row">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-history"></i> Activités Récentes
                </h6>
                <button class="btn btn-sm btn-outline-secondary" onclick="refreshActivities()">
                    <i class="fas fa-sync-alt"></i> Actualiser
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-sm" id="activities-table">
                        <thead>
                            <tr>
                                <th>Heure</th>
                                <th>Commande</th>
                                <th>Utilisateur</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="4" class="text-center text-muted">
                                    <i class="fas fa-spinner fa-spin"></i> Chargement...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-4">
        <div class="card">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-exclamation-triangle"></i> Alertes & Logs
                </h6>
            </div>
            <div class="card-body">
                <div id="alert-container">
                    <div class="text-center text-muted">
                        <i class="fas fa-shield-alt fa-2x mb-2"></i>
                        <p>Aucune alerte active</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.border-left-primary { border-left: 4px solid #4e73df !important; }
.border-left-success { border-left: 4px solid #1cc88a !important; }
.border-left-info { border-left: 4px solid #36b9cc !important; }
.border-left-warning { border-left: 4px solid #f6c23e !important; }

.progress-sm { height: 0.5rem; }

.service-indicator {
    padding: 15px 0;
}

.service-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin: 0 auto 10px;
    transition: all 0.3s ease;
}

.service-dot.bg-success { background-color: #28a745 !important; }
.service-dot.bg-danger { background-color: #dc3545 !important; }
.service-dot.bg-warning { background-color: #ffc107 !important; }
.service-dot.bg-secondary { background-color: #6c757d !important; }

.service-name {
    font-weight: 600;
    margin-bottom: 5px;
}

.service-status {
    color: #6c757d;
}

.bg-purple { background-color: #6f42c1 !important; }

#connection-status {
    font-size: 0.85em;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
}

.card {
    box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
    border: 1px solid #e3e6f0;
}

.alert-item {
    border-left: 4px solid #dc3545;
    background-color: #f8f9fa;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 4px;
}

.alert-item.warning {
    border-left-color: #ffc107;
}

.alert-item.info {
    border-left-color: #17a2b8;
}
</style>

<script>
// Variables globales pour le monitoring
let realtimeChart;
let updateInterval;
let isConnected = false;

// Initialiser le monitoring
document.addEventListener('DOMContentLoaded', function() {
    initializeMonitoring();
});

function initializeMonitoring() {
    // Initialiser le graphique en temps réel
    initRealtimeChart();
    
    // Commencer les mises à jour
    startRealTimeUpdates();
    
    // Première récupération des données
    updateAllData();
}

function initRealtimeChart() {
    const ctx = document.getElementById('realtimeChart').getContext('2d');
    
    realtimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Commandes/minute',
                data: [],
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute',
                        displayFormats: {
                            minute: 'HH:mm'
                        }
                    },
                    max: new Date(),
                    min: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes
                },
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function startRealTimeUpdates() {
    // Mettre à jour toutes les 5 secondes
    updateInterval = setInterval(() => {
        updateAllData();
    }, 5000);
}

async function updateAllData() {
    try {
        // Mettre à jour le statut de connexion
        updateConnectionStatus(true);
        
        // Récupérer le statut du bot
        await updateBotStatus();
        
        // Récupérer les statistiques temps réel
        await updateLiveStats();
        
        // Récupérer les métriques
        await updateMetrics();
        
        // Récupérer les activités récentes
        await updateRecentActivities();
        
        // Mettre à jour l'heure de dernière mise à jour
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        updateConnectionStatus(false);
    }
}

async function updateBotStatus() {
    try {
        const response = await fetch('/api/bot-status');
        const data = await response.json();
        
        // Mettre à jour le statut du bot
        const botStatusEl = document.getElementById('bot-status-text');
        const botUptimeEl = document.getElementById('bot-uptime');
        
        if (data.bot && data.bot.status === 'online') {
            botStatusEl.innerHTML = '🟢 En ligne';
            botStatusEl.className = 'text-success font-weight-bold';
        } else {
            botStatusEl.innerHTML = '🔴 Hors ligne';
            botStatusEl.className = 'text-danger font-weight-bold';
        }
        
        if (data.uptime && data.uptime.formatted) {
            botUptimeEl.textContent = data.uptime.formatted;
        }
        
        // Mettre à jour le statut de la base de données
        const dbStatusEl = document.getElementById('db-status-text');
        const dbPingEl = document.getElementById('db-ping');
        
        if (data.database && data.database.status === 'connected') {
            dbStatusEl.innerHTML = '🟢 Connectée';
            dbStatusEl.className = 'text-success font-weight-bold';
            dbPingEl.textContent = data.database.ping + ' ms';
        } else {
            dbStatusEl.innerHTML = '🔴 Déconnectée';
            dbStatusEl.className = 'text-danger font-weight-bold';
            dbPingEl.textContent = '-- ms';
        }
        
        // Mettre à jour les services
        if (data.services) {
            updateServicesStatus(data.services);
        }
        
    } catch (error) {
        console.error('Erreur récupération statut bot:', error);
    }
}

async function updateLiveStats() {
    try {
        const response = await fetch('/api/live-stats');
        const data = await response.json();
        
        // Utilisateurs actifs
        document.getElementById('active-users').textContent = data.active_users || 0;
        
        // Utilisation mémoire
        if (data.memory_usage) {
            const memoryPercent = data.memory_usage.percentage || 0;
            document.getElementById('memory-usage').textContent = memoryPercent + '%';
            document.getElementById('memory-progress').style.width = memoryPercent + '%';
        }
        
        // Mettre à jour le graphique temps réel
        if (data.commands_today) {
            updateRealtimeChart(data.commands_today);
        }
        
    } catch (error) {
        console.error('Erreur récupération stats temps réel:', error);
    }
}

async function updateMetrics() {
    try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        
        // Temps de réponse
        if (data.response_times && data.response_times.length > 0) {
            const avgResponseTime = Math.round(data.response_times[0].avg_time);
            document.getElementById('response-time').textContent = avgResponseTime + ' ms';
        }
        
        // Taux d'erreur
        if (data.error_rates && data.error_rates.length > 0) {
            const errorRate = data.error_rates[0].error_rate || 0;
            document.getElementById('error-rate').textContent = errorRate + '%';
        }
        
        // Santé du système
        if (data.system_health) {
            updateSystemHealth(data.system_health);
        }
        
    } catch (error) {
        console.error('Erreur récupération métriques:', error);
    }
}

async function updateRecentActivities() {
    try {
        const response = await fetch('/api/live-stats');
        const data = await response.json();
        
        if (data.recent_activities) {
            updateActivitiesTable(data.recent_activities);
        }
        
    } catch (error) {
        console.error('Erreur récupération activités:', error);
    }
}

function updateRealtimeChart(commandsData) {
    const now = new Date();
    const chart = realtimeChart;
    
    // Calculer le total de commandes pour cette minute
    const totalCommands = commandsData.reduce((sum, cmd) => sum + parseInt(cmd.count), 0);
    
    // Ajouter le nouveau point de données
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(totalCommands);
    
    // Limiter à 30 points de données (30 minutes)
    if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    
    // Mettre à jour les limites de temps
    chart.options.scales.x.max = now;
    chart.options.scales.x.min = new Date(now.getTime() - 30 * 60 * 1000);
    
    chart.update('none'); // Animation rapide
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    if (connected) {
        statusEl.innerHTML = '🟢 Connecté';
        statusEl.className = 'badge bg-success';
        isConnected = true;
    } else {
        statusEl.innerHTML = '🔴 Déconnecté';
        statusEl.className = 'badge bg-danger';
        isConnected = false;
    }
}

function updateServicesStatus(services) {
    const serviceTypes = ['scheduler', 'api', 'monitoring', 'cache'];
    
    serviceTypes.forEach(service => {
        const dot = document.getElementById(service + '-dot');
        const status = document.getElementById(service + '-status');
        
        if (services[service]) {
            const serviceStatus = services[service].status;
            
            dot.className = 'service-dot ';
            
            switch (serviceStatus) {
                case 'online':
                case 'connected':
                case 'active':
                    dot.classList.add('bg-success');
                    status.textContent = 'En ligne';
                    break;
                case 'offline':
                case 'disconnected':
                case 'inactive':
                    dot.classList.add('bg-danger');
                    status.textContent = 'Hors ligne';
                    break;
                default:
                    dot.classList.add('bg-warning');
                    status.textContent = 'Inconnu';
            }
        }
    });
}

function updateSystemHealth(health) {
    // Load Average
    if (health.load_average) {
        const loadAvg = health.load_average;
        const load1min = loadAvg['1min'] || 0;
        document.getElementById('cpu-text').textContent = 
            `${load1min.toFixed(2)} / ${(loadAvg['5min'] || 0).toFixed(2)} / ${(loadAvg['15min'] || 0).toFixed(2)}`;
        
        // Mettre à jour la barre de progression (approximation)
        const cpuPercent = Math.min(load1min * 25, 100); // Approximation
        document.getElementById('cpu-progress').style.width = cpuPercent + '%';
    }
    
    // Utilisation disque
    if (health.disk_usage) {
        const disk = health.disk_usage;
        const usedGB = Math.round(disk.used / (1024 * 1024 * 1024));
        const totalGB = Math.round(disk.total / (1024 * 1024 * 1024));
        
        document.getElementById('disk-text').textContent = `${usedGB} GB / ${totalGB} GB`;
        document.getElementById('disk-progress').style.width = disk.percentage + '%';
    }
}

function updateActivitiesTable(activities) {
    const tbody = document.querySelector('#activities-table tbody');
    tbody.innerHTML = '';
    
    if (activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Aucune activité récente</td></tr>';
        return;
    }
    
    activities.slice(0, 10).forEach(activity => {
        const row = document.createElement('tr');
        
        const time = new Date(activity.used_at).toLocaleTimeString();
        const status = activity.success ? 
            '<span class="badge badge-success">✅</span>' : 
            '<span class="badge badge-danger">❌</span>';
        
        row.innerHTML = `
            <td><small>${time}</small></td>
            <td><code>${activity.command_name || 'N/A'}</code></td>
            <td>${activity.username || 'Anonyme'}</td>
            <td>${status}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function toggleChart(type) {
    // Basculer entre différents types de graphiques
    console.log('Toggle chart type:', type);
    // Implémentation à ajouter selon les besoins
}

function refreshActivities() {
    updateRecentActivities();
}

// Nettoyage lors de la fermeture de la page
window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
</script>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?>