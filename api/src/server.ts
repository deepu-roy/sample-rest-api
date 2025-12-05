import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';

// Import configuration
import config from './config';
import { initializeDatabase } from './db/init';

// Import routes
import usersRouter from './routes/users';
import rolesRouter from './routes/roles';
import healthRouter from './routes/health';
import swaggerDocs from './swagger/config';

const app = express();

// Middleware
app.use(
    cors({
        origin: config.cors.origins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);
app.use(bodyParser.json());

// Serve raw Swagger JSON
app.get('/api-docs/swagger.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocs);
});

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocs));

// Initialize database
initializeDatabase();

// Routes
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/health', healthRouter);

// Only start the server if this file is run directly
if (require.main === module) {
    app.listen(config.api.port, () => {
        console.log(`Server is running on ${config.api.baseUrl}`);
        console.log(`Swagger documentation available at ${config.api.baseUrl}/api-docs`);
        console.log(`Allowing CORS for origins:`, config.cors.origins);
    });
}

// Export the app for testing
export default app;
