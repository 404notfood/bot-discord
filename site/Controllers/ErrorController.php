<?php
namespace Controllers;

use Core\Controller;

/**
 * Contrôleur pour la gestion des erreurs
 */
class ErrorController extends Controller
{
    /**
     * Page d'erreur 404
     */
    public function notFoundAction()
    {
        header("HTTP/1.0 404 Not Found");
        $this->render('404', [
            'title' => '404 - Page non trouvée',
            'loggedIn' => isset($_SESSION['member_id']),
            'username' => $_SESSION['member_username'] ?? '',
            'role' => $_SESSION['member_role'] ?? ''
        ]);
    }
    
    /**
     * Page d'erreur 403
     */
    public function forbiddenAction()
    {
        header("HTTP/1.0 403 Forbidden");
        $this->render('403', [
            'title' => '403 - Accès interdit',
            'loggedIn' => isset($_SESSION['member_id']),
            'username' => $_SESSION['member_username'] ?? '',
            'role' => $_SESSION['member_role'] ?? ''
        ]);
    }
    
    /**
     * Page d'erreur 500
     */
    public function serverErrorAction()
    {
        header("HTTP/1.0 500 Internal Server Error");
        $this->render('500', [
            'title' => '500 - Erreur serveur',
            'loggedIn' => isset($_SESSION['member_id']),
            'username' => $_SESSION['member_username'] ?? '',
            'role' => $_SESSION['member_role'] ?? ''
        ]);
    }
} 