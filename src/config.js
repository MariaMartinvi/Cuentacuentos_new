const config = {
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.micuentacuentos.com'
    : 'http://localhost:5001'
};

export default config; 