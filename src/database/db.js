const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.path = path.join(__dirname, '../../database.json');
        if (!fs.existsSync(this.path)) {
            fs.writeFileSync(this.path, JSON.stringify({}));
        }
    }

    get(key) {
        const data = JSON.parse(fs.readFileSync(this.path));
        return data[key];
    }

    set(key, value) {
        const data = JSON.parse(fs.readFileSync(this.path));
        data[key] = value;
        fs.writeFileSync(this.path, JSON.stringify(data, null, 2));
    }

    delete(key) {
        const data = JSON.parse(fs.readFileSync(this.path));
        delete data[key];
        fs.writeFileSync(this.path, JSON.stringify(data, null, 2));
    }

    all() {
        return JSON.parse(fs.readFileSync(this.path));
    }
}

module.exports = new Database();
