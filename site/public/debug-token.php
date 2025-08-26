<?php
// Debug API token
echo "<h1>Debug API Token</h1>";

// Vérifier la configuration
echo "<h2>Configuration</h2>";
echo "API Secret depuis config: " . config('discord.api_secret') . "<br>";
echo "API Secret depuis env: " . env('API_SECRET_KEY') . "<br>";

// Vérifier les headers de la requête
echo "<h2>Headers reçus</h2>";
$headers = getallheaders();
foreach ($headers as $name => $value) {
    if (stripos($name, 'token') !== false || stripos($name, 'auth') !== false || $name === 'X-API-Token') {
        echo "$name: $value<br>";
    }
}

// Simuler une requête API
echo "<h2>Test avec token</h2>";
$token = config('discord.api_secret');
if ($token) {
    echo "Token disponible: " . substr($token, 0, 10) . "...<br>";
} else {
    echo "❌ Aucun token trouvé<br>";
}
?>