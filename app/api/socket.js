import { Server } from "socket.io";

let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("Socket.IO server is being set up...");
    io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Nouvelle connexion :", socket.id);

      // Exemples d’événements
      socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} a rejoint la salle ${roomId}`);
      });

      socket.on("newOrder", (order) => {
        console.log("Nouvelle commande reçue", order);
        io.emit("orderUpdate", order); // Broadcast à tous les clients
      });
    });
  }

  res.end();
}
