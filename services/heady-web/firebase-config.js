// Heady Firebase Configuration
// Loaded at runtime — never inline API keys in HTML
(function() {
  window.__HEADY_FIREBASE_CONFIG = {
    apiKey: window.__FIREBASE_API_KEY || '',
    authDomain: 'heady-ai.firebaseapp.com',
    projectId: 'heady-ai',
    storageBucket: 'heady-ai.appspot.com',
    messagingSenderId: '',
    appId: ''
  };
})();
