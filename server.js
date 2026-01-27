const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Store active rooms
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Create a new room
    socket.on('create-room', (data) => {
        const roomId = data.roomId;
        rooms.set(roomId, {
            creator: socket.id,
            peers: [socket.id]
        });
        socket.join(roomId);
        socket.emit('room-created', { roomId });
    });

    // Join existing room
    socket.on('join-room', (data) => {
        const roomId = data.roomId;
        const room = rooms.get(roomId);
        
        if (room) {
            room.peers.push(socket.id);
            socket.join(roomId);
            socket.to(roomId).emit('peer-joined', { peerId: socket.id });
        }
    });

    // Handle WebRTC signaling
    socket.on('offer', (data) => {
        socket.to(data.roomId).emit('offer', {
            offer: data.offer,
            senderId: socket.id
        });
    });

    socket.on('answer', (data) => {
        socket.to(data.roomId).emit('answer', {
            answer: data.answer,
            senderId: socket.id
        });
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.roomId).emit('ice-candidate', {
            candidate: data.candidate,
            senderId: socket.id
        });
    });

    // Handle file metadata
    socket.on('file-metadata', (data) => {
        socket.to(data.roomId).emit('file-metadata', data);
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        rooms.forEach((room, roomId) => {
            const index = room.peers.indexOf(socket.id);
            if (index > -1) {
                room.peers.splice(index, 1);
                if (room.peers.length === 0) {
                    rooms.delete(roomId);
                } else {
                    socket.to(roomId).emit('peer-disconnected', { peerId: socket.id });
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});