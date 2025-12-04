export function getPublicBaseUrl(): string {
  const envUrl = import.meta.env.VITE_PUBLIC_URL;

  if (envUrl) {
    return envUrl;
  }

  const currentUrl = window.location.origin;

  if (currentUrl.includes('webcontainer') || currentUrl.includes('local-credentialless')) {
    console.warn('⚠️ Development URL detected. Verification links may not work for external users.');
  }

  return currentUrl;
}
