export const environment = {
  production: false,
  apiUrl: import.meta.env['NG_APP_API_URL'] || 'http://localhost:3000',
  googleMapsApiKey: import.meta.env['NG_APP_GOOGLE_MAPS_API_KEY'] || ''
};
