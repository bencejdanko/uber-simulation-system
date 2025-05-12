/**
 * WebSocket Service
 * 
 * Handles real-time connections and updates for the admin dashboard
 */

let io;

/**
 * Initialize WebSocket with Socket.io instance
 * @param {Object} socketIo - Socket.io server instance
 */
const initializeWebSocket = (socketIo) => {
  io = socketIo;
  
  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log('New admin client connected:', socket.id);
    
    // Join admin room for broadcast updates
    socket.join('admin-dashboard');
    
    socket.on('disconnect', () => {
      console.log('Admin client disconnected:', socket.id);
    });
  });
  
  console.log('WebSocket service initialized');
};

/**
 * Send a dashboard update to all connected admin clients
 * @param {string} type - Type of update (overview, rides, drivers, customers, billing)
 * @param {Object} data - Data to send
 */
const sendDashboardUpdate = async (type, data) => {
  if (!io) {
    console.error('WebSocket not initialized');
    return;
  }
  
  io.to('admin-dashboard').emit(`dashboard-update:${type}`, data);
  console.log(`Emitted dashboard update: ${type}`);
};

/**
 * Schedule regular updates to keep dashboard data fresh
 * @param {Function} dataProvider - Function that returns the data to send
 * @param {string} type - Type of update
 * @param {number} interval - Update interval in milliseconds
 */
const scheduleRegularUpdates = (dataProvider, type, interval = 60000) => {
  if (!io) {
    console.error('WebSocket not initialized');
    return;
  }
  
  console.log(`Scheduling regular updates for ${type} every ${interval}ms`);
  
  const sendUpdate = async () => {
    try {
      const data = await dataProvider();
      sendDashboardUpdate(type, data);
    } catch (error) {
      console.error(`Error sending scheduled update for ${type}:`, error);
    }
  };
  
  // Initial update
  sendUpdate();
  
  // Schedule regular updates
  return setInterval(sendUpdate, interval);
};

module.exports = {
  initializeWebSocket,
  sendDashboardUpdate,
  scheduleRegularUpdates
}; 