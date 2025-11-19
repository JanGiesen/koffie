const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static('public'));

// In-memory storage for orders
let orders = [];
let colleagues = [];

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Send current state to newly connected client
    socket.emit('initialState', { orders, colleagues });
    
    // Handle new order
    socket.on('addOrder', (order) => {
        orders.push(order);
        io.emit('orderAdded', order);
    });
    
    // Handle order deletion
    socket.on('deleteOrder', (orderId) => {
        orders = orders.filter(order => order.id !== orderId);
        io.emit('orderDeleted', orderId);
    });
    
    // Handle clear all orders
    socket.on('clearAllOrders', () => {
        orders = [];
        io.emit('allOrdersCleared');
    });
    
    // Handle colleague updates
    socket.on('updateColleagues', (updatedColleagues) => {
        colleagues = [...new Set(updatedColleagues)]; // Remove duplicates
        io.emit('colleaguesUpdated', colleagues);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
