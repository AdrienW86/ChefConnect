import dbConnect from "../../utils/dbConnect";
import OrderSession from "../../models/OrderSession";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    // Démarrer une nouvelle session
    try {
      const newSession = new OrderSession({
        date: new Date(),
        profit: 0,
        payment: { especes: 0, cb: 0, check: 0, ticket: 0 },
        tables: [],
      });
      await newSession.save();
      res.status(201).json(newSession);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création de la session" });
    }
  }

  if (req.method === "GET") {
    // Récupérer la dernière session active
    try {
      const session = await OrderSession.findOne().sort({ date: -1 });
      res.status(200).json(session || null);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de la session" });
    }
  }

  if (req.method === "PUT") {
    // Mettre à jour une session (ajout table, commande, paiement)
    try {
      const { sessionId, update } = req.body;
      const updatedSession = await OrderSession.findByIdAndUpdate(sessionId, update, { new: true });
      res.status(200).json(updatedSession);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
  }
}
