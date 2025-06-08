// app/api/reports/route.js
import { connectToDatabase } from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectToDatabase();
  const { userId } = await req.json();

  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true, reports: user.reports }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des rapports :", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
