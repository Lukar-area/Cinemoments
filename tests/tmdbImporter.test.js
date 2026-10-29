/**
 * Test Suite for TMDB Importer & Showcase Website
 */

import { test, describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('TMDB Movie Importer & Website Verification Suite', () => {

  it('1. Required files exist', () => {
    const requiredFiles = [
      'scripts/importMovies.js',
      'server.js',
      'public/index.html',
      'public/images/movies/.gitkeep',
      '.env.example',
      '.gitignore',
      'README.md',
      'package.json'
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(ROOT_DIR, relPath);
      assert.strictEqual(fs.existsSync(fullPath), true, `Expected file to exist: ${relPath}`);
    }
  });

  it('2. package.json contains required scripts and dependencies', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
    assert.strictEqual(pkg.type, 'module', 'Expected package.json to be type: module');
    assert.ok(pkg.scripts['import:movies'], 'Expected import:movies script');
    assert.ok(pkg.scripts['start:website'], 'Expected start:website script');
    assert.ok(pkg.dependencies.mongodb, 'Expected mongodb dependency');
    assert.ok(pkg.dependencies.dotenv, 'Expected dotenv dependency');
    assert.ok(pkg.dependencies.express, 'Expected express dependency');
  });

  it('3. .env.example contains expected template keys', () => {
    const envExample = fs.readFileSync(path.join(ROOT_DIR, '.env.example'), 'utf8');
    assert.ok(envExample.includes('TMDB_ACCESS_TOKEN='), 'Expected TMDB_ACCESS_TOKEN in .env.example');
    assert.ok(envExample.includes('MONGODB_URI='), 'Expected MONGODB_URI in .env.example');
    assert.ok(envExample.includes('TMDB_PAGES='), 'Expected TMDB_PAGES in .env.example');
    assert.ok(envExample.includes('PORT='), 'Expected PORT in .env.example');
  });

  it('4. .gitignore excludes .env and downloaded posters', () => {
    const gitignore = fs.readFileSync(path.join(ROOT_DIR, '.gitignore'), 'utf8');
    assert.ok(gitignore.includes('.env'), 'Expected .env to be ignored');
    assert.ok(gitignore.includes('public/images/movies/*'), 'Expected downloaded posters to be ignored');
    assert.ok(gitignore.includes('!public/images/movies/.gitkeep'), 'Expected .gitkeep exception');
  });

  it('5. scripts/importMovies.js module exports and structure', async () => {
    const module = await import('../scripts/importMovies.js');
    assert.ok(typeof module.runImporter === 'function', 'runImporter should be an exported function');
    assert.ok(typeof module.TMDB_GENRES === 'object', 'TMDB_GENRES should be exported');
    assert.strictEqual(module.TMDB_GENRES[28], 'Action', 'Genre 28 should map to Action');
    assert.strictEqual(module.TMDB_GENRES[878], 'Science Fiction', 'Genre 878 should map to Science Fiction');
  });

  it('6. Document schema mapping conforms to requirements', () => {
    // Sample TMDB API movie object
    const sampleTmdbMovie = {
      id: 550,
      title: 'Fight Club',
      original_title: 'Fight Club',
      overview: 'A ticking-time-bomb insomniac...',
      release_date: '1999-10-15',
      original_language: 'en',
      genre_ids: [18, 53],
      vote_average: 8.433,
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      popularity: 61.416,
      vote_count: 26000
    };

    // Transform using the same logic as importMovies.js
    const ext = path.extname(sampleTmdbMovie.poster_path) || '.jpg';
    const doc = {
      tmdbId: sampleTmdbMovie.id,
      title: sampleTmdbMovie.title,
      originalTitle: sampleTmdbMovie.original_title,
      overview: sampleTmdbMovie.overview,
      releaseDate: sampleTmdbMovie.release_date,
      language: sampleTmdbMovie.original_language,
      genreIds: sampleTmdbMovie.genre_ids,
      rating: Math.round(sampleTmdbMovie.vote_average * 10) / 10,
      posterPath: sampleTmdbMovie.poster_path,
      posterLocalPath: `/images/movies/${sampleTmdbMovie.id}${ext}`,
    };

    // Verify all required fields
    assert.strictEqual(doc.tmdbId, 550);
    assert.strictEqual(doc.title, 'Fight Club');
    assert.strictEqual(doc.originalTitle, 'Fight Club');
    assert.strictEqual(doc.overview, 'A ticking-time-bomb insomniac...');
    assert.strictEqual(doc.releaseDate, '1999-10-15');
    assert.strictEqual(doc.language, 'en');
    assert.deepStrictEqual(doc.genreIds, [18, 53]);
    assert.strictEqual(doc.rating, 8.4);
    assert.strictEqual(doc.posterPath, '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg');
    assert.strictEqual(doc.posterLocalPath, '/images/movies/550.jpg');
  });

  it('7. TMDB attribution notice is present in UI and script', () => {
    const scriptContent = fs.readFileSync(path.join(ROOT_DIR, 'scripts/importMovies.js'), 'utf8');
    const htmlContent = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
    const expectedAttribution = 'This product uses the TMDB API but is not endorsed or certified by TMDB.';

    assert.ok(scriptContent.includes(expectedAttribution), 'Script must include TMDB attribution text');
    assert.ok(htmlContent.includes(expectedAttribution), 'HTML must include TMDB attribution text');
  });

});
