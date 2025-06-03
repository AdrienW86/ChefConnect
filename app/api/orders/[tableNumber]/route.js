import { NextResponse } from "next/server";
import User from "@/app/models/User";
import { connectToDatabase } from "@/app/lib/mongodb";

export async function GET(req, context) {
  await connectToDatabase();

  const params = await context.params; 
  const tableNumber = parseInt(params.tableNumber, 10);
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId || isNaN(tableNumber)) {
    return new Response(
      JSON.stringify({ message: "userId ou tableNumber manquant" }),
      { status: 400 }
    );
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return new Response(
        JSON.stringify({ message: "Utilisateur introuvable" }),
        { status: 404 }
      );
    }

    const tableOrders = user.orders.filter(
      (order) => order.tableNumber === tableNumber
    );

    return new Response(JSON.stringify({ orders: tableOrders }), {
      status: 200,
    });
  } catch (error) {
    console.error("Erreur récupération commandes:", error);
    return new Response(JSON.stringify({ message: "Erreur serveur" }), {
      status: 500,
    });
  }
}

export async function POST(req, context) {
      await connectToDatabase();
  const params = await context.params; 
  const tableNumber = Number(params.tableNumber);
  const { item, userId } = await req.json();

  if (!item || !userId || !tableNumber) {
    return new Response(JSON.stringify({ message: 'Paramètres manquants' }), { status: 400 });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return new Response(JSON.stringify({ message: 'Utilisateur non trouvé' }), { status: 404 });
    }

    let order = user.orders.find(o => o.tableNumber === tableNumber && o.status === "en cours");

    if (!order) {
      order = {
        tableNumber,
        items: [{ ...item, quantity: item.quantity || 1 }],
        total: 0,
        paymentMethod: "espèces",
        status: "en cours",
        createdAt: new Date(),
      };
      user.orders.push(order);
    } else {
      const existingItem = order.items.find(i => i.name === item.name);
      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
      } else {
        order.items.push({ ...item, quantity: item.quantity || 1 });
      }
    }

    order.total = order.items.reduce((acc, i) => acc + i.price * i.quantity, 0);

    await user.save();

    return new Response(JSON.stringify({ success: true, order }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Erreur serveur' }), { status: 500 });
  }
}