/**
 * ============================================================================
 * CineMoments - Standalone Movie Showcase Website
 * ============================================================================
 * 
 * Demonstrates reading imported movie records directly from MongoDB and
 * serving their locally stored posters from public/images/movies/.
 * 
 * STRICT PRIVACY & RATE COMPLIANCE:
 * - ZERO calls to the TMDB API when users browse this website.
 * - All images are served locally from disk via Express static middleware.
 * 
 * TMDB Attribution:
 * "This product uses the TMDB API but is not endorsed or certified by TMDB."
 * ============================================================================
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinemoments';
const DB_NAME = process.env.MONGODB_DB_NAME || 'cinemoments';

// Connect to MongoDB
let db = null;
let client = null;

async function initDb() {
  if (db) return db;
  client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`✅ [Website Server] Connected to MongoDB database: "${db.databaseName}"`);
  return db;
}

// Serve static assets from public/ directory
// This allows <img src="/images/movies/12345.jpg"> to resolve directly to public/images/movies/12345.jpg
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API Endpoint to fetch imported movies from MongoDB
app.get('/api/movies', async (req, res) => {
  try {
    const database = await initDb();
    const collection = database.collection('movies');

    const { genre, search, minRating, limit = 100 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { originalTitle: { $regex: String(search), $options: 'i' } },
      ];
    }

    if (genre) {
      query.genreIds = parseInt(String(genre), 10);
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(String(minRating)) };
    }

    const movies = await collection
      .find(query)
      .sort({ rating: -1, releaseDate: -1 })
      .limit(parseInt(String(limit), 10))
      .toArray();

    const count = await collection.countDocuments();

    res.json({
      success: true,
      totalInDatabase: count,
      returnedCount: movies.length,
      movies,
    });
  } catch (error) {
    console.error('Failed to fetch movies from MongoDB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve movies from local database.',
      error: error.message,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CineMoments Movie Showcase Website',
    mongoConnected: !!db,
  });
});

// Fallback to index.html for single page application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
async function start() {
  try {
    await initDb();
  } catch (err) {
    console.warn(`⚠️ [Warning] MongoDB connection issue on startup (${err.message}). Database operations will retry upon requests.`);
  }

  app.listen(PORT, () => {
    console.log('='.repeat(65));
    console.log(`🎬 CineMoments Movie Showcase Website is running!`);
    console.log(`🌐 Local URL:  http://localhost:${PORT}`);
    console.log(`📁 Static Dir: ${path.join(__dirname, 'public')}`);
    console.log(`🛡️  External TMDB API calls during browsing: 0 (All offline/local)`);
    console.log('='.repeat(65));
  });
}

start();
