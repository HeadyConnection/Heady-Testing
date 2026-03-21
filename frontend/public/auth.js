window._memoryToken = null;

function getToken() {
  if (!window._memoryToken) {
    window._memoryToken = prompt('Enter Heady API Key / Admin Token:') || 'default_insecure_token';
  }
  return window._memoryToken;
}
