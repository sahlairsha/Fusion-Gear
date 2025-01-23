const socketIo = require('socket.io');

let io; // Declare a variable to hold the socket.io instance
let userSockets = {}; // Store user socket ids

const setupSocket = (server) => {
    io = socketIo(server); // Initialize socket.io with the provided server

    io.on('connection', (socket) => {
        console.log('User connected');
        const userId = socket.handshake.auth.userId; // Retrieve userId from the handshake

        // Track the user's socket id
        userSockets[userId] = socket.id;
        console.log(`User ${userId} connected with socket ID: ${socket.id}`);

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected`);
            delete userSockets[userId]; // Remove user socket on disconnect
        });
    });

    return io;
};

// Utility to access socket.io instance from elsewhere
const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Emit to a specific user by userId
const emitToUser = (userId, event, data) => {
    const socketId = userSockets[userId];
    if (socketId) {
        io.to(socketId).emit(event, data);
    }
};

module.exports = { setupSocket, getIo, emitToUser };
