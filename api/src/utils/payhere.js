const axios = require('axios');
const querystring = require('querystring');
const NodeCache = require('node-cache');
const { to } = require('./helpers');
const logger = require('./logger');

const cache = new NodeCache();

const payhereApi = axios.create({
  baseURL: process.env.PAYHERE_URL,
  timeout: 500
});

const authApi = axios.create({
  baseURL: process.env.PAYHERE_URL,
  timeout: 500,
  headers: { 'Authorization': `Basic ${process.env.PAYHERE_AUTH}` }
});

payhereApi.interceptors.request.use(async (config) => {
  accessToken = cache.get('payhere-access-token');
  if (accessToken == undefined || !accessToken) {
    let err, res;
    [err, res] = await to(authApi.post('/oauth/token', querystring.stringify({
      grant_type: 'client_credentials'
    })));

    if (err) {
      logger.error(err);
      throw err;
    }
    
    cache.set('payhere-access-token', res.data.access_token, res.data.expires_in - 10);
    accessToken = res.data.access_token;
  }

  config.headers = {
    'Authorization': `Bearer ${accessToken}`
  };

  return config;
}, function (error) {
  return Promise.reject(error);
});

module.exports = {
  payhereApi
};
