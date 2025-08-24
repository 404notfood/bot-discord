/**
 * JavaScript principal pour le dashboard
 */

// Gestionnaire de thème
class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        // Récupérer le thème depuis localStorage ou détecter automatiquement
        this.currentTheme = localStorage.getItem('dashboard-theme') || 'auto';
        this.applyTheme(this.currentTheme);
        
        // Configurer le toggle
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.checked = this.currentTheme === 'dark' || 
                (this.currentTheme === 'auto' && this.prefersDark());
            toggle.addEventListener('change', () => this.toggleTheme());
        }

        // Écouter les changements de préférence système
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }

    prefersDark() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('dashboard-theme', theme);
        this.applyTheme(theme);
        
        // Mettre à jour le toggle
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.checked = theme === 'dark' || (theme === 'auto' && this.prefersDark());
        }
    }

    applyTheme(theme) {
        const html = document.documentElement;
        
        // Supprimer les anciens attributs
        html.removeAttribute('data-theme');
        
        let actualTheme = theme;
        if (theme === 'auto') {
            actualTheme = this.prefersDark() ? 'dark' : 'light';
        }
        
        if (actualTheme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        }
        
        // Animation de transition
        html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            html.style.transition = '';
        }, 300);
    }

    getTheme() {
        return this.currentTheme;
    }
}

// Gestionnaire de notifications
class NotificationManager {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        this.container.appendChild(notification);

        // Auto-suppression
        if (duration > 0) {
            setTimeout(() => {
                notification.remove();
            }, duration);
        }

        return notification;
    }

    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 8000) {
        return this.show(message, 'danger', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

// Initialisation globale
let themeManager;
let notificationManager;

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les gestionnaires
    themeManager = new ThemeManager();
    notificationManager = new NotificationManager();
    // Fermeture des alertes
    document.querySelectorAll('.alert .btn-close').forEach(function(button) {
        button.addEventListener('click', function() {
            this.closest('.alert').remove();
        });
    });
    
    // Confirmation de suppression
    document.querySelectorAll('form[action*="delete"]').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
                e.preventDefault();
                return false;
            }
        });
    });
    
    // Activer les tooltips Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Activer les popovers Bootstrap
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Ajouter une classe active au lien de menu correspondant à la page courante
    var path = window.location.pathname;
    var navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(function(link) {
        var href = link.getAttribute('href');
        
        if (path === href || (href !== '/' && path.startsWith(href))) {
            link.classList.add('active');
        }
    });
    
    // Formulaire de recherche - soumission en appuyant sur Entrée
    document.querySelectorAll('input[name="search"]').forEach(function(input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                this.closest('form').submit();
            }
        });
    });
}); 