import { NextResponse } from "next/server";
import User from "../../models/User";
import dbConnect from "../../lib/mongodb";

// Fonction pour mettre à jour la session
const updateSession = async (userId, updatedSessionData) => {
  try {
    console.log("Données reçues pour mise à jour :", updatedSessionData);
    
    // Connexion à la base de données
    await dbConnect();

    // Vérifier si les données sont valides
    if (!updatedSessionData) {
      throw new Error("Les données de la session sont manquantes");
    }

    // Trouver l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier si la session existe
    if (!user.session) {
      throw new Error("Aucune session trouvée");
    }

    // Mettre à jour la session
    user.session.tables = updatedSessionData
    

    // Sauvegarder en base de données
    await user.save();

    return { message: "Session mise à jour avec succès" };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la session:", error);
    throw new Error("Erreur lors de la mise à jour de la session: " + error.message);
  }
};

// Handler pour la route Next.js
export const PATCH = async (req) => {
  try {
    const { userId, session } = await req.json(); // Correction ici : session au lieu de updatedSessionData

    if (!userId || !session) {
      return NextResponse.json(
        { message: "Données manquantes ou invalides" },
        { status: 400 }
      );
    }

    // Met à jour la session de l'utilisateur
    const response = await updateSession(userId, session);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json(
      { message: error.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
};
