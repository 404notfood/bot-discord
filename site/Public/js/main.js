/**
 * JavaScript principal pour le dashboard
 */
document.addEventListener('DOMContentLoaded', function() {
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