import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Message } from '../entities/Message.js';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './messages.db',
  synchronize: true, // Creates tables automatically - use only in development
  logging: false, // Set to true for SQL query logging
  entities: [Message],
  migrations: [],
  subscribers: [],
});

export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('Database connection initialized successfully');
    }
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}