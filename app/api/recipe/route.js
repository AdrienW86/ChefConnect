import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req) {
  try {
    await connectToDatabase();

    const body = await req.json();
     const { userId, ticketData } = body;

    // Vérification simple
    if (!ticketData.ticketNumber || !ticketData.date || !ticketData.items?.length) {
      return NextResponse.json(
        { success: false, error: "Données du ticket manquantes" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Ajouter le ticket dans le tableau 'recipe' de l'utilisateur
    if (!user.recipe) user.recipe = []; // création si le tableau n'existe pas
    user.recipe.push(ticketData);

    await user.save(); // sauvegarde dans la base

    return NextResponse.json({ success: true, recipe: ticketData });
  } catch (error) {
    console.error("Erreur API /recipe :", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectToDatabase();

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId manquant" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true, recipes: user.recipe || [] });
  } catch (error) {
    console.error("Erreur API GET /recipe :", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectToDatabase();

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId manquant" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vider le tableau des recettes
    user.recipe = [];
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Toutes les recettes archivées ont été supprimées.",
    });
  } catch (error) {
    console.error("Erreur API DELETE /recipe :", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
