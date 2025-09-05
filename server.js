// TextLinker Server with Chunked Upload Support - FIXED
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CRITICAL: Proper Socket.IO configuration with CORS
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    // Add these for better connectivity
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

// CORS middleware - MUST be before routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true
}));

// Body parser with increased limit for chunked uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files AFTER CORS
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage
const textCache = {};
const chunkAssemblies = new Map();
const CHUNK_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Utility function to mask tokens for logging
function maskToken(token) {
    return token && token.length > 6 ? token.slice(0, 3) + '***' + token.slice(-3) : '***';
}

// Generate random token
function generateToken() {
    return Math.random().toString(36).substring(2, 8);
}

// Process uploaded text (shared logic for both /upload and /upload-chunk)
function processUploadedText(token, text) {
    const masked = maskToken(token);
    console.log(`[processUpload] token=${masked} len=${text.length}`);
    
    // Store text in cache
    textCache[token] = text;
    
    // Set expiration (10 minutes)
    setTimeout(() => {
        delete textCache[token];
        console.log(`[cleanup] Removed expired text for token=${masked}`);
    }, 10 * 60 * 1000);
    
    // Broadcast to all clients in the room
    io.to(token).emit('textUpdate', { text });
    console.log(`[broadcast] Sent textUpdate to room=${masked} connected sockets=${io.sockets.adapter.rooms.get(token)?.size || 0}`);
}

// Cleanup expired chunk assemblies every minute
setInterval(() => {
    const now = Date.now();
    for (const [token, assembly] of chunkAssemblies) {
        if (now - assembly.createdAt > CHUNK_TTL_MS) {
            console.log(`[cleanup] Removing expired chunks for token=${maskToken(token)}`);
            chunkAssemblies.delete(token);
        }
    }
}, 60 * 1000);

// EXPLICIT HTML ROUTES - IMPORTANT!
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/titles', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'titles.html'));
});

app.get('/text', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'text.html'));
});

// API Routes
app.get('/generate-token', (req, res) => {
    const token = generateToken();
    console.log(`[generate-token] Generated token=${maskToken(token)}`);
    res.json({ token });
});

app.get('/text/:token', (req, res) => {
    const { token } = req.params;
    const masked = maskToken(token);
    
    if (textCache[token]) {
        console.log(`[get-text] Found text for token=${masked} len=${textCache[token].length}`);
        res.json({ text: textCache[token] });
    } else {
        console.log(`[get-text] No text found for token=${masked}`);
        res.status(404).json({ error: 'No text found' });
    }
});

// Original upload endpoint
app.post('/upload', (req, res) => {
    const { token, text } = req.body;
    const masked = maskToken(token);
    
    if (!token || !text) {
        console.log(`[upload] Bad request: token=${masked} textLen=${text?.length || 0}`);
        return res.status(400).json({ error: 'Token and text are required' });
    }
    
    console.log(`[upload] token=${masked} len=${text.length} at=${new Date().toISOString()}`);
    processUploadedText(token, text);
    res.json({ message: 'Text received', success: true });
});

// Chunked upload endpoint
app.post('/upload-chunk', (req, res) => {
    const { token, chunkIndex, totalChunks, textChunk } = req.body || {};
    
    // Validate inputs
    if (!token || typeof token !== 'string' || 
        typeof chunkIndex !== 'number' || chunkIndex < 0 ||
        typeof totalChunks !== 'number' || totalChunks <= 0 ||
        typeof textChunk !== 'string') {
        console.log(`[upload-chunk] Bad request: token=${maskToken(token)} idx=${chunkIndex} total=${totalChunks}`);
        return res.status(400).json({ ok: false, error: 'Invalid request parameters' });
    }

    if (chunkIndex >= totalChunks) {
        return res.status(400).json({ ok: false, error: 'chunkIndex must be < totalChunks' });
    }

    const masked = maskToken(token);
    console.log(`[upload-chunk] token=${masked} idx=${chunkIndex}/${totalChunks} len=${textChunk.length}`);

    // Get or create assembly for this token
    let assembly = chunkAssemblies.get(token);
    if (!assembly) {
        assembly = { 
            total: totalChunks, 
            parts: new Map(), 
            createdAt: Date.now() 
        };
        chunkAssemblies.set(token, assembly);
    }

    // Validate totalChunks consistency
    if (assembly.total !== totalChunks) {
        return res.status(409).json({ ok: false, error: 'totalChunks mismatch with existing assembly' });
    }

    // Store the chunk
    assembly.parts.set(chunkIndex, textChunk);
    console.log(`[upload-chunk] Stored chunk ${chunkIndex}, assembly now has ${assembly.parts.size}/${assembly.total} parts`);

    // Check if we have all chunks
    if (assembly.parts.size === assembly.total) {
        // Assemble chunks in order
        let fullText = '';
        for (let i = 0; i < assembly.total; i++) {
            if (!assembly.parts.has(i)) {
                return res.status(409).json({ ok: false, error: `Missing chunk ${i}` });
            }
            fullText += assembly.parts.get(i);
        }

        // Clean up stored chunks
        chunkAssemblies.delete(token);
        
        console.log(`[upload-chunk] ASSEMBLED token=${masked} totalLen=${fullText.length} at=${new Date().toISOString()}`);

        // Process exactly like existing /upload does
        processUploadedText(token, fullText);

        return res.status(200).json({ 
            ok: true, 
            receivedIndex: chunkIndex, 
            assembled: true 
        });
    }

    // Partial assembly - just acknowledge this chunk
    res.status(200).json({ 
        ok: true, 
        receivedIndex: chunkIndex 
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        server: 'TextLinker',
        timestamp: new Date().toISOString(),
        connections: io.sockets.sockets.size
    });
});

// Socket.IO connection handling with better error handling
io.on('connection', (socket) => {
    console.log(`[socket] Client connected: ${socket.id} from ${socket.handshake.address}`);
    
    // Send connection confirmation
    socket.emit('connected', { id: socket.id });

    socket.on('joinRoom', (token) => {
        if (!token) {
            console.log(`[socket] Invalid token from ${socket.id}`);
            socket.emit('error', { message: 'Invalid token' });
            return;
        }
        
        const masked = maskToken(token);
        socket.join(token);
        console.log(`[socket] Client ${socket.id} joined room=${masked}`);
        
        // Immediately send existing text if available
        if (textCache[token]) {
            console.log(`[socket] Sending cached text to ${socket.id} for token=${masked}`);
            socket.emit('textUpdate', { text: textCache[token] });
        }
    });

    socket.on('sendText', (data) => {
        const { token, text } = data;
        const masked = maskToken(token);
        console.log(`[socket] sendText from ${socket.id} token=${masked} len=${text?.length || 0}`);
        
        if (token && text) {
            processUploadedText(token, text);
            socket.emit('sendSuccess', { message: 'Text sent successfully' });
        } else {
            socket.emit('error', { message: 'Token and text are required' });
        }
    });

    socket.on('textUpdate', (data) => {
        const { text } = data;
        console.log(`[socket] textUpdate from ${socket.id} len=${text?.length || 0}`);
        // Broadcast to all clients
        socket.broadcast.emit('textUpdate', data);
    });

    socket.on('ping', () => {
        socket.emit('pong');
    });

    socket.on('error', (error) => {
        console.error(`[socket] Error from ${socket.id}:`, error);
    });

    socket.on('disconnect', (reason) => {
        console.log(`[socket] Client disconnected: ${socket.id} - Reason: ${reason}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[error]', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    console.log(`[404] Not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Not found' });
});

// Start server with better error handling
const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
========================================
TextLinker Server Started Successfully!
========================================
Server URL: http://0.0.0.0:${PORT}
External URL: http://129.153.161.57:${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Time: ${new Date().toISOString()}
========================================
    `);
});

// Handle server errors
server.on('error', (error) => {
    console.error('[server] Error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[shutdown] SIGTERM received, closing server...');
    server.close(() => {
        console.log('[shutdown] Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('[shutdown] SIGINT received, closing server...');
    server.close(() => {
        console.log('[shutdown] Server closed');
        process.exit(0);
    });
});
