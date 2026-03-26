const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../../database.json');
const HASH_KEY = 'bot_db';

class Database {
    constructor() {
        this.cache = {};
        this.redis = null;
        this._useFile = false;
    }

    async connect() {
        const url   = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            console.log('[DB] No Upstash credentials — using local database.json (data lost on redeploy).');
            this._useFile = true;
            if (!fs.existsSync(JSON_PATH)) fs.writeFileSync(JSON_PATH, JSON.stringify({}));
            this.cache = JSON.parse(fs.readFileSync(JSON_PATH));
            return;
        }

        try {
            const { Redis } = require('@upstash/redis');
            this.redis = new Redis({ url, token });

            const raw = await this.redis.hgetall(HASH_KEY);
            if (raw) {
                for (const [k, v] of Object.entries(raw)) {
                    try { this.cache[k] = JSON.parse(v); }
                    catch { this.cache[k] = v; }
                }
            }

            console.log(`[DB] Upstash Redis connected — loaded ${Object.keys(this.cache).length} keys into cache.`);
        } catch (err) {
            console.error('[DB] Upstash connection failed:', err.message);
            console.log('[DB] Falling back to local database.json.');
            this._useFile = true;
            if (!fs.existsSync(JSON_PATH)) fs.writeFileSync(JSON_PATH, JSON.stringify({}));
            this.cache = JSON.parse(fs.readFileSync(JSON_PATH));
        }
    }

    get(key) {
        return this.cache[key];
    }

    set(key, value) {
        this.cache[key] = value;

        if (this._useFile) {
            fs.writeFileSync(JSON_PATH, JSON.stringify(this.cache, null, 2));
            return;
        }

        if (this.redis) {
            this.redis.hset(HASH_KEY, { [key]: JSON.stringify(value) })
                .catch(err => console.error(`[DB] Failed to persist "${key}":`, err.message));
        }
    }

    delete(key) {
        delete this.cache[key];

        if (this._useFile) {
            fs.writeFileSync(JSON_PATH, JSON.stringify(this.cache, null, 2));
            return;
        }

        if (this.redis) {
            this.redis.hdel(HASH_KEY, key)
                .catch(err => console.error(`[DB] Failed to delete "${key}":`, err.message));
        }
    }
}

module.exports = new Database();
