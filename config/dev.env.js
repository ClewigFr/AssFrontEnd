'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  // Run the backend locally with PORT=8099 (the dev server already uses 8080)
  BACKEND_URL: JSON.stringify(process.env.BACKEND_URL || 'http://localhost:8099')
})
