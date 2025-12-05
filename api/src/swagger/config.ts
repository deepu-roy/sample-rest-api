import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import config from '../config';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ReqRes API',
            version: '1.0.0',
            description:
                'A simple implementation of the ReqRes API using Node.js, Express, and SQLite',
        },
        servers: [
            {
                url: config.api.baseUrl,
                description: 'API Server',
            },
        ],
    },
    apis: [path.join(__dirname, '../routes/*.ts'), path.join(__dirname, '../routes/*.js')],
};

export default swaggerJsdoc(options);
