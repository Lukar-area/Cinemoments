#!/usr/bin/env node

/**
 * ============================================================================
 * CineMoments - TMDB Movie Data Importer
 * ============================================================================
 * 
 * One-time / scheduled script to fetch popular movies from The Movie Database (TMDB) API,
 * download poster images locally into public/images/movies/, and upsert records into
 * a MongoDB collection named "movies".
 * 
 * TMDB Attribution:
 * "This product uses the TMDB API but is not endorsed or certified by TMDB."
 * Learn more at: https://www.themoviedb.org/documentation/api/terms-of-use
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables from .env
dotenv.config();

// Determine directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const POSTERS_DIR = path.join(PUBLIC_DIR, 'images', 'movies');

// TMDB Genre lookup map (for friendly genre names)
export const TMDB_GENRES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Configuration
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500';
const DEFAULT_PAGES = 5;

/**
 * Parse CLI arguments or environment variable for target page count
 */
function getTargetPages() {
  const cliArg = process.argv.find((arg) => arg.startsWith('--pages='));
  if (cliArg) {
    const parsed = parseInt(cliArg.split('=')[1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  const envPages = parseInt(process.env.TMDB_PAGES || '', 10);
  if (!isNaN(envPages) && envPages > 0) return envPages;
  return DEFAULT_PAGES;
}

/**
 * Mask sensitive credentials for safe logging
 */
function maskSecret(str) {
  if (!str) return '(none)';
  if (str.length <= 8) return '********';
  return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
}

function maskMongoUri(uri) {
  if (!uri) return '(none)';
  return uri.replace(/:([^:@]+)@/, ':****@');
}

/**
 * Sleep helper for rate-limiting and backoff retries
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a page of popular movies from TMDB with rate-limit and error handling
 */
async function fetchPopularMoviesPage(page, token, maxRetries = 3) {
  const isBearer = token.length > 40; // v4 Access Token is typically 150+ chars JWT
  const url = new URL('https://api.themoviedb.org/3/movie/popular');
  url.searchParams.set('page', String(page));
  url.searchParams.set('language', 'en-US');

  if (!isBearer) {
    // Legacy v3 API Key format
    url.searchParams.set('api_key', token);
  }

  const headers = {
    Accept: 'application/json',
  };

  if (isBearer) {
    const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    headers['Authorization'] = cleanToken;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url.toString(), { method: 'GET', headers });

      // Handle TMDB Rate Limit (HTTP 429)
      if (response.status === 429) {
        const retryAfterSec = parseInt(response.headers.get('Retry-After') || '2', 10);
        console.warn(`⏳ [Rate Limit] TMDB 429 on page ${page}. Waiting ${retryAfterSec}s before retry...`);
        await sleep(retryAfterSec * 1000);
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid or unauthorized TMDB_ACCESS_TOKEN. Please verify your token in .env');
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`TMDB HTTP ${response.status}: ${errText.substring(0, 150)}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      const backoffMs = attempt * 1000;
      console.warn(`⚠️ Attempt ${attempt} failed for page ${page} (${err.message}). Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }
}

/**
 * Download a movie poster and save locally into public/images/movies/<tmdbId>.ext
 */
async function downloadPosterImage(posterPath, tmdbId, maxRetries = 3) {
  if (!posterPath) {
    return null;
  }

  // Derive file extension from posterPath (e.g. .jpg)
  const ext = path.extname(posterPath) || '.jpg';
  const fileName = `${tmdbId}${ext}`;
  const localDiskPath = path.join(POSTERS_DIR, fileName);
  const localWebPath = `/images/movies/${fileName}`;

  // If already downloaded and not empty, skip downloading to save bandwidth
  if (fs.existsSync(localDiskPath)) {
    try {
      const stats = fs.statSync(localDiskPath);
      if (stats.size > 1024) {
        return localWebPath;
      }
    } catch {
      // Re-download if file corrupted
    }
  }

  const imageUrl = `${TMDB_IMAGE_BASE_URL}${posterPath}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(imageUrl);

      if (res.status === 404) {
        console.warn(`⚠️ Poster not found (404) on TMDB CDN: ${imageUrl}`);
        return null;
      }

      if (res.status === 429) {
        await sleep(1500 * attempt);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFileSync(localDiskPath, buffer);
      return localWebPath;
    } catch (err) {
      if (attempt === maxRetries) {
        console.warn(`❌ Failed to download poster for movie ID ${tmdbId} after ${maxRetries} tries: ${err.message}`);
        return null;
      }
      await sleep(500 * attempt);
    }
  }

  return null;
}

/**
 * Main Importer Execution
 */
export async function runImporter() {
  console.log('='.repeat(65));
  console.log('🎬 CineMoments - TMDB Movie Data Importer');
  console.log('='.repeat(65));

  const tmdbToken = process.env.TMDB_ACCESS_TOKEN?.trim();
  const mongoUri = process.env.MONGODB_URI?.trim();
  const targetPages = getTargetPages();

  // Validate required credentials
  if (!tmdbToken) {
    console.error('❌ Error: TMDB_ACCESS_TOKEN is missing in your .env file.');
    console.error('   Please generate a Read Access Token at https://www.themoviedb.org/settings/api');
    process.exit(1);
  }

  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI is missing in your .env file.');
    console.error('   Please set MONGODB_URI in .env (e.g. mongodb://localhost:27017/cinemoments or Atlas URI).');
    process.exit(1);
  }

  console.log(`ℹ️  TMDB Access Token:    ${maskSecret(tmdbToken)}`);
  console.log(`ℹ️  MongoDB Target URI:   ${maskMongoUri(mongoUri)}`);
  console.log(`ℹ️  Pages to Fetch:       ${targetPages} (~${targetPages * 20} movies)`);
  console.log(`ℹ️  Local Poster Storage: ${POSTERS_DIR}`);

  // Ensure public/images/movies exists
  if (!fs.existsSync(POSTERS_DIR)) {
    fs.mkdirSync(POSTERS_DIR, { recursive: true });
    console.log(`📁 Created local image directory: ${POSTERS_DIR}`);
  }

  // Connect to MongoDB
  console.log('\n🔌 Connecting to MongoDB...');
  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 10000 });

  let db;
  try {
    await client.connect();
    // Use database specified in URI or fallback to cinemoments
    const dbName = process.env.MONGODB_DB_NAME || client.options.dbName || 'cinemoments';
    db = client.db(dbName);
    console.log(`✅ Connected successfully to MongoDB (database: "${db.databaseName}")`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    console.error('   Ensure your MongoDB server is running and accessible (or check IP whitelist in Atlas).');
    process.exit(1);
  }

  const moviesCollection = db.collection('movies');

  // Ensure unique index on tmdbId
  try {
    await moviesCollection.createIndex({ tmdbId: 1 }, { unique: true });
    console.log('✅ Verified unique index on { tmdbId: 1 } in "movies" collection.');
  } catch (err) {
    console.warn(`⚠️ Warning setting unique index: ${err.message}`);
  }

  const stats = {
    totalPages: targetPages,
    moviesFetched: 0,
    insertedCount: 0,
    updatedCount: 0,
    postersDownloaded: 0,
    postersSkippedOrFailed: 0,
    startTime: Date.now(),
  };

  console.log('\n🚀 Starting TMDB movie extraction...\n');

  try {
    for (let page = 1; page <= targetPages; page++) {
      process.stdout.write(`📥 Fetching TMDB Popular Movies Page ${page}/${targetPages}... `);
      const data = await fetchPopularMoviesPage(page, tmdbToken);
      const movies = data.results || [];
      console.log(`Done (${movies.length} movies retrieved)`);

      stats.moviesFetched += movies.length;

      for (const item of movies) {
        // Download poster locally
        const posterLocalPath = await downloadPosterImage(item.poster_path, item.id);

        if (posterLocalPath) {
          stats.postersDownloaded++;
        } else {
          stats.postersSkippedOrFailed++;
        }

        // Construct clean movie document matching project requirements
        const movieDoc = {
          tmdbId: item.id,
          title: item.title || item.original_title || 'Untitled',
          originalTitle: item.original_title || item.title || 'Untitled',
          overview: item.overview || '',
          releaseDate: item.release_date || null,
          language: item.original_language || 'en',
          genreIds: item.genre_ids || [],
          rating: typeof item.vote_average === 'number' ? Math.round(item.vote_average * 10) / 10 : 0,
          posterPath: item.poster_path || null,
          posterLocalPath: posterLocalPath,
          popularity: item.popularity || 0,
          voteCount: item.vote_count || 0,
          updatedAt: new Date(),
        };

        // Upsert by tmdbId (unique identifier)
        const result = await moviesCollection.updateOne(
          { tmdbId: item.id },
          {
            $set: movieDoc,
            $setOnInsert: { importedAt: new Date() },
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          stats.insertedCount++;
        } else if (result.modifiedCount > 0) {
          stats.updatedCount++;
        }
      }

      // Small throttle between pages to respect TMDB API guidelines
      if (page < targetPages) {
        await sleep(250);
      }
    }

    const durationSec = ((Date.now() - stats.startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(65));
    console.log('🎉 TMDB IMPORT COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(65));
    console.log(`⏱️  Duration:             ${durationSec}s`);
    console.log(`📄 Pages Processed:      ${stats.totalPages}`);
    console.log(`🎬 Total Movies Fetched: ${stats.moviesFetched}`);
    console.log(`✨ New Records Inserted: ${stats.insertedCount}`);
    console.log(`🔄 Records Updated:      ${stats.updatedCount}`);
    console.log(`🖼️  Posters Stored:       ${stats.postersDownloaded} saved to /public/images/movies/`);
    console.log(`⚠️  Posters Missing:      ${stats.postersSkippedOrFailed}`);
    console.log('='.repeat(65));

    console.log('\n📜 TMDB Attribution & Notice:');
    console.log('   "This product uses the TMDB API but is not endorsed or certified by TMDB."');
    console.log('   Website: https://www.themoviedb.org');
    console.log('   Terms:   https://www.themoviedb.org/documentation/api/terms-of-use\n');

  } catch (err) {
    console.error(`\n❌ Error during import execution: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed cleanly.\n');
  }
}

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('importMovies.js')) {
  runImporter().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}
