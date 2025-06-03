import { NextResponse } from "next/server";
import User from "@/app/models/User";
import { connectToDatabase } from "@/app/lib/mongodb";

export async function POST(request) {
  try {
    await connectToDatabase();

    const { userId, tableNumber, items, total, paymentMethod } = await request.json();

    if (!userId || !tableNumber || !items || !total || !paymentMethod) {
      return new Response(JSON.stringify({ message: "Champs manquants" }), { status: 400 });
    }

    // Trouve l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return new Response(JSON.stringify({ message: "Utilisateur non trouvé" }), { status: 404 });
    }

    // Cherche une commande existante pour la même table
    const existingOrder = user.orders.find(order => order.tableNumber === tableNumber && order.status === "en cours");

    if (existingOrder) {
      // Pour chaque item, on ajoute la quantité si item existe déjà, sinon on le pousse
      items.forEach(newItem => {
        const existingItem = existingOrder.items.find(i => i.name === newItem.name);
        if (existingItem) {
          existingItem.quantity += newItem.quantity;
        } else {
          existingOrder.items.push(newItem);
        }
      });

      // Met à jour le total
      existingOrder.total += total;

      await user.save();

      return new Response(JSON.stringify({ message: "Commande mise à jour", order: existingOrder }), { status: 200 });
    } else {
      // Crée une nouvelle commande
      const newOrder = {
        tableNumber,
        items,
        total,
        paymentMethod,
        status: "en cours",
        createdAt: new Date(),
      };

      user.orders.push(newOrder);

      await user.save();

      return new Response(JSON.stringify({ message: "Commande ajoutée", order: newOrder }), { status: 201 });
    }
  } catch (error) {
    console.error("Erreur API orders POST:", error);
    return new Response(JSON.stringify({ message: "Erreur serveur" }), { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ message: "userId manquant" }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findById(userId);

  if (!user) {
    return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
  }

  // Par exemple, on extrait toutes les tables actives depuis les commandes
  const activeTableNumbers = user.orders.map(o => o.tableNumber);
  const uniqueTables = [...new Set(activeTableNumbers)];

  return NextResponse.json({ tables: uniqueTables }, { status: 200 });
}
