import fs from 'fs';
import path from 'path';

const param = path.join(process.cwd(), 'debug_auth.log');

export function logDebug(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;

    try {
        fs.appendFileSync(param, logMessage);
    } catch (err) {
        console.error("Failed to write to debug log:", err);
    }
}
