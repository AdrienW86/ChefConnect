import { connectToDatabase } from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
    await connectToDatabase();
  try {
    const { userId, comptabilityEmail } = await req.json();

    if (!userId || !comptabilityEmail) {
      return NextResponse.json({ success: false, message: "Champs manquants" });
    }

  

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { comptabilityEmail },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: "Utilisateur non trouvé" });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Erreur de mise à jour:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" });
  }
}
