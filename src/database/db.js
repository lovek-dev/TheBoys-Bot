const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../../database.json');

class Database {
    constructor() {
        this.cache = {};
        this.collection = null;
        this._useFile = false;
    }

    async connect() {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            console.log('[DB] No MONGODB_URI set — using local database.json (data will be lost on redeploy).');
            this._useFile = true;
            if (!fs.existsSync(JSON_PATH)) fs.writeFileSync(JSON_PATH, JSON.stringify({}));
            this.cache = JSON.parse(fs.readFileSync(JSON_PATH));
            return;
        }

        try {
            const { MongoClient } = require('mongodb');
            const client = new MongoClient(uri);
            await client.connect();
            const db = client.db('theboysbot');
            this.collection = db.collection('store');

            const docs = await this.collection.find({}).toArray();
            for (const doc of docs) {
                this.cache[doc.key] = doc.value;
            }

            console.log(`[DB] MongoDB connected — loaded ${docs.length} keys into cache.`);
        } catch (err) {
            console.error('[DB] MongoDB connection failed:', err.message);
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

        if (this.collection) {
            this.collection.updateOne(
                { key },
                { $set: { key, value } },
                { upsert: true }
            ).catch(err => console.error(`[DB] Failed to persist key "${key}":`, err.message));
        }
    }

    delete(key) {
        delete this.cache[key];

        if (this._useFile) {
            fs.writeFileSync(JSON_PATH, JSON.stringify(this.cache, null, 2));
            return;
        }

        if (this.collection) {
            this.collection.deleteOne({ key })
                .catch(err => console.error(`[DB] Failed to delete key "${key}":`, err.message));
        }
    }
}

module.exports = new Database();
