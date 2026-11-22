'use strict'
module.exports = {
  NODE_ENV: '"production"',
  // Backend base URL, overridable at build time: BACKEND_URL=https://api.example.com npm run build
  BACKEND_URL: JSON.stringify(process.env.BACKEND_URL || 'https://gentle-inlet-02091.herokuapp.com')
}
