import { connectToDatabase } from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function DELETE(req, context) {
  console.log("🔥 DELETE API hit");

  const { params } = context;
  const tableNumber = Number(params.tableNumber);
  const itemName = decodeURIComponent(params.itemName);
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  console.log("params:", params);
  console.log("tableNumber:", tableNumber);
  console.log("item:", itemName);
  console.log("userId:", userId);

  if (!userId || !tableNumber || !itemName) {
    return new Response(JSON.stringify({ message: "Paramètres manquants" }), { status: 400 });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return new Response(JSON.stringify({ message: "Utilisateur non trouvé" }), { status: 404 });
    }

    const orderIndex = user.orders.findIndex((o) => o.tableNumber === tableNumber);
    if (orderIndex === -1) {
      return new Response(JSON.stringify({ message: "Commande non trouvée" }), { status: 404 });
    }

    const order = user.orders[orderIndex];
    const itemIndex = order.items.findIndex((i) => i.name === itemName);
    if (itemIndex === -1) {
      return new Response(JSON.stringify({ message: "Produit non trouvé" }), { status: 404 });
    }

    if (order.items[itemIndex].quantity > 1) {
      order.items[itemIndex].quantity -= 1;
    } else {
      order.items.splice(itemIndex, 1);
    }

    order.total = order.items.reduce((acc, i) => acc + i.price * i.quantity, 0);

    if (order.items.length === 0) {
      user.orders.splice(orderIndex, 1);
    }

    await user.save();

    return new Response(JSON.stringify({ success: true, order: order.items.length ? order : null }), { status: 200 });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return new Response(JSON.stringify({ message: "Erreur serveur" }), { status: 500 });
  }
}
