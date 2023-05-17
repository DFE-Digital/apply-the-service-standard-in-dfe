module.exports = {

  // Base URL
  baseURL: process.env.BASE_URL || 'https://apply-the-service-standard.education.gov.uk/',

  // Environment
  env: process.env.NODE_ENV || 'development',

  // Port to run local development server on
  port: process.env.PORT || 3052,
  githubrepo: 'https://github.com/DFE-Digital/apply-the-service-standard-in-dfe',
  
  assetPath: process.env.assetPath
};


