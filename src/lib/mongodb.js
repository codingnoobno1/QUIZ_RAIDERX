import { MongoClient } from 'mongodb'
import dns from 'dns'

if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI" or "MONGO_URI"')
}

// Prefer reliable public DNS for the SRV lookup so an intermittently
// unavailable local DNS proxy (e.g. Cloudflare WARP at 127.0.2.x) doesn't
// cause `querySrv ECONNREFUSED`. Existing resolvers are kept as fallback.
try {
    const preferred = ['1.1.1.1', '1.0.0.1', '8.8.8.8']
    const existing = dns.getServers().filter((s) => !preferred.includes(s))
    dns.setServers([...preferred, ...existing])
} catch {
    // Non-fatal.
}

const uri = process.env.MONGODB_URI || process.env.MONGO_URI
const options = {
    serverSelectionTimeoutMS: 8000,
}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options)
        global._mongoClientPromise = client.connect().catch((err) => {
            // Clear so the next import/use retries once DNS/network recovers.
            global._mongoClientPromise = undefined
            throw err
        })
    }
    clientPromise = global._mongoClientPromise
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
