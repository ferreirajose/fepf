export const environment = {
  production: true,
  apiUrl: import.meta.env['NG_APP_API_URL'] || 'https://fepf-api.vercel.app',
  googleMapsApiKey: import.meta.env['NG_APP_GOOGLE_MAPS_API_KEY'] || ''
};
