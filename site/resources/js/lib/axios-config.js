import axios from 'axios';

// Configuration globale d'axios
const apiClient = axios.create({
    baseURL: '/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Intercepteur pour ajouter le token API automatiquement
apiClient.interceptors.request.use(
    (config) => {
        // Récupérer le token API depuis les meta tags ou localStorage
        const apiToken = document.querySelector('meta[name="api-token"]')?.getAttribute('content') 
            || localStorage.getItem('api_token')
            || process.env.MIX_API_TOKEN;

        if (apiToken) {
            config.headers['X-API-Token'] = apiToken;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Erreur d\'authentification API:', error.response.data);
            // Optionnel : rediriger vers une page d'erreur ou afficher un message
        }
        return Promise.reject(error);
    }
);

export default apiClient;
