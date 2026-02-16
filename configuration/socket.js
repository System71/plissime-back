const { Server } = require("socket.io");
const User = require("../models/User");

const initSocket = (server) => {
  /*POUR LA PROD
const allowedOrigins = ["http://localhost:5173", "https://myapp.com"];
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
*/

  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware d'auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) return next(new Error("Authentication error"));

      // Vérifie le token en base
      const user = await User.findOne({ token: token });

      if (!user) return next(new Error("Authentication error"));

      // Stocke l'id MongoDB pour la room
      socket.userId = user._id.toString();

      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    socket.join(`user_${userId}`);

    console.log(`User ${userId} connected`);

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
};

module.exports = initSocket;
