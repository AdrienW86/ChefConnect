// app/api/auth/reset-password/route.js
import { connectToDatabase } from "../../../lib/mongodb";
import User from "../../../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";  

export async function POST(req) {
  const { token, password } = await req.json();

  try {
    if (!token || !password) {
      return NextResponse.json({ message: "Données manquantes" }, { status: 400 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await connectToDatabase();

    // Trouver l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Nouveau mot de passe haché :", hashedPassword); // Log du mot de passe haché
    
    user.password = hashedPassword;
    await user.save();

    console.log("Mot de passe mis à jour pour l'utilisateur :", user.email);
    return NextResponse.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation :", error);
    return NextResponse.json({ message: "Lien invalide ou expiré" }, { status: 400 });
  }
}
