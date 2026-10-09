// Utilitário de registro e gerenciamento do Service Worker para o FluenciEdu PWA

export function registerServiceWorker(onUpdate?: () => void) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Detectar nova versão disponível
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Novo conteúdo disponível após atualização
                  if (onUpdate) onUpdate();
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('Erro ao registrar Service Worker do FluenciEdu:', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
