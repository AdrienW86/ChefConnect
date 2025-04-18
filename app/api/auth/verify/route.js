import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    // Récupère le cookie "token" de la requête
    const token = req.cookies.get("token")?.value;

    // Vérifie si le token est présent
    if (!token) {
      return NextResponse.json({ message: "Token manquant" }, { status: 401 });
    }

    // Vérification du token
    const user = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Utilisateur vérifié :", user);  // Pour voir l'utilisateur décodé

    if (!user) {
      return NextResponse.json({ message: "Token invalide" }, { status: 401 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error("Erreur lors de la vérification du token", error);
    return NextResponse.json({ message: "Erreur lors de la vérification du token" }, { status: 500 });
  }
}
