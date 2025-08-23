<?php
ob_start();
?>

<div class="container-fluid px-4">
    <h1 class="mt-4"><?= htmlspecialchars($title) ?></h1>
    <ol class="breadcrumb mb-4">
        <li class="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
        <li class="breadcrumb-item"><a href="/reminders">Rappels</a></li>
        <li class="breadcrumb-item active"><?= $isNew ? 'Créer' : 'Modifier' ?></li>
    </ol>
    
    <div class="row">
        <div class="col-lg-8">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="fas fa-bell me-1"></i>
                    <?= $isNew ? 'Nouveau rappel' : 'Modifier le rappel' ?>
                </div>
                <div class="card-body">
                    <?php if (!empty($errors)): ?>
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <strong>Erreurs:</strong>
                        <ul class="mb-0">
                            <?php foreach ($errors as $error): ?>
                            <li><?= htmlspecialchars($error) ?></li>
                            <?php endforeach; ?>
                        </ul>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
                    </div>
                    <?php endif; ?>
                    
                    <form method="post" action="<?= $isNew ? '/reminders/store' : '/reminders/update/' . $reminder['id'] ?>" class="needs-validation" novalidate>
                        <!-- Informations de base -->
                        <div class="mb-3">
                            <label for="message" class="form-label">Message <span class="text-danger">*</span></label>
                            <textarea class="form-control" id="message" name="message" rows="5" required><?= htmlspecialchars($reminder['message'] ?? '') ?></textarea>
                            <div class="form-text">Le contenu du message qui sera envoyé. Vous pouvez utiliser du Markdown pour le formatage.</div>
                        </div>
                        
                        <!-- Canal Discord -->
                        <div class="mb-3">
                            <label for="channel_id" class="form-label">Canal Discord <span class="text-danger">*</span></label>
                            <select class="form-select" id="channel_id" name="channel_id" required>
                                <option value="">Sélectionnez un canal</option>
                                <?php foreach ($discordChannels as $channel): ?>
                                <option value="<?= $channel['id'] ?>" <?= ($channel['id'] === ($reminder['channel_id'] ?? '')) ? 'selected' : '' ?>>
                                    #<?= htmlspecialchars($channel['name']) ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                            <div class="form-text">Le canal où le message sera envoyé.</div>
                        </div>
                        
                        <!-- Date et heure de rappel -->
                        <div class="card mb-3">
                            <div class="card-header bg-light">Date et heure</div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="remind_at_date" class="form-label">Date <span class="text-danger">*</span></label>
                                    <input type="date" class="form-control" id="remind_at_date" name="remind_at_date" 
                                           value="<?= !empty($reminder['remind_at']) ? date('Y-m-d', strtotime($reminder['remind_at'])) : date('Y-m-d') ?>" required>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="remind_at_hour" class="form-label">Heure</label>
                                        <select class="form-select" id="remind_at_hour" name="remind_at_hour">
                                            <?php 
                                            $selectedHour = !empty($reminder['remind_at']) ? (int)date('H', strtotime($reminder['remind_at'])) : 8;
                                            for ($i = 0; $i < 24; $i++): 
                                            ?>
                                            <option value="<?= $i ?>" <?= ($i === $selectedHour) ? 'selected' : '' ?>>
                                                <?= str_pad($i, 2, '0', STR_PAD_LEFT) ?>h
                                            </option>
                                            <?php endfor; ?>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="remind_at_minute" class="form-label">Minute</label>
                                        <select class="form-select" id="remind_at_minute" name="remind_at_minute">
                                            <?php 
                                            $selectedMinute = !empty($reminder['remind_at']) ? (int)date('i', strtotime($reminder['remind_at'])) : 0;
                                            // Arrondir à la minute multiple de 5 la plus proche
                                            $selectedMinute = round($selectedMinute / 5) * 5;
                                            if ($selectedMinute >= 60) $selectedMinute = 55;
                                            
                                            for ($i = 0; $i < 60; $i += 5): 
                                            ?>
                                            <option value="<?= $i ?>" <?= ($i === $selectedMinute) ? 'selected' : '' ?>>
                                                <?= str_pad($i, 2, '0', STR_PAD_LEFT) ?>
                                            </option>
                                            <?php endfor; ?>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Champ caché pour guild_id -->
                        <input type="hidden" name="guild_id" value="<?= htmlspecialchars($reminder['guild_id'] ?? $guildId) ?>">
                        <!-- Champ caché pour user_id -->
                        <input type="hidden" name="user_id" value="<?= htmlspecialchars($reminder['user_id'] ?? (isset($_SESSION['member_id']) ? $_SESSION['member_id'] : 1)) ?>">
                        
                        <div class="d-flex justify-content-between">
                            <a href="/reminders" class="btn btn-outline-secondary">Annuler</a>
                            <button type="submit" class="btn btn-primary">
                                <?= $isNew ? 'Créer le rappel' : 'Enregistrer les modifications' ?>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
        <div class="col-lg-4">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="fas fa-info-circle me-1"></i>
                    Guide
                </div>
                <div class="card-body">
                    <h5>Comment configurer un rappel</h5>
                    <p>Un rappel est un message automatique envoyé par le bot à la date et l'heure spécifiées.</p>
                    
                    <div class="alert alert-info">
                        <strong>Conseil</strong>: Utilisez un message clair et concis pour que tous les membres comprennent facilement le rappel.
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation du formulaire
    console.log('Formulaire de rappel initialisé');
});
</script>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 