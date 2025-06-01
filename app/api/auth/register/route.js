import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/mongodb";
import User from "../../../models/User";

export async function POST(req) {
  try {
    // Connecte-toi à la base de données MongoDB
    await connectToDatabase();

    const { email, username, password } = await req.json();

    // Vérifie si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Utilisateur déjà existant" }, { status: 400 });
    }

    // Crée un nouvel utilisateur
    const newUser = new User({
      email,
      username,
      password,
    });

    // Sauvegarde l'utilisateur
    await newUser.save();

    return NextResponse.json({ message: "Utilisateur créé avec succès" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erreur lors de l'inscription" }, { status: 500 });
  }
}