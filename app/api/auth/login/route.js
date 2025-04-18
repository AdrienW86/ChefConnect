// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/mongodb";
import User from "../../../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export async function POST(req) {
  try {
    // Connexion à la base de données MongoDB
    await connectToDatabase();

    const { email, password } = await req.json();

    // Recherche l'utilisateur par email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 400 });
    }

    // Vérifie le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Mot de passe incorrect" }, { status: 400 });
    }

    // Génération du JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Crée un cookie HttpOnly pour le token
    const cookie = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400,
      path: "/", 
    });

    // Répond avec le cookie et les données de l'utilisateur
    const response = NextResponse.json({
      message: "Connexion réussie",
      user: {
        email: user.email,
        username: user.username,
      }
    });
    
    response.headers.set("Set-Cookie", cookie);

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erreur lors de la connexion" }, { status: 500 });
  }
}
