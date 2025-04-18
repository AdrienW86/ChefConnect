import { NextResponse } from "next/server";
import User from "../../models/User"; // Assure-toi que le chemin est bon
import dbConnect from "../../lib/mongodb"; // Fichier pour connecter MongoDB

export async function POST(req) {
  try {
    await dbConnect(); // Connexion à la BDD
    const { userId, session } = await req.json();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { session } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: "Session ajoutée", session: updatedUser.session });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de l'ajout de la session" }, { status: 500 });
  }
}
