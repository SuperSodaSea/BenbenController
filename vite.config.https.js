import basicSSL from '@vitejs/plugin-basic-ssl';

import baseConfig from './vite.config.js';


export default () => {
    const config = { ...baseConfig };
    config.plugins.push(basicSSL());
    config.server.https = true;
    return config;
};
