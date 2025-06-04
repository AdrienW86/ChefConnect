import { connectToDatabase } from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req, context) {
  try {
     await connectToDatabase();
   const params = await context.params; 
    const tableNumber = parseInt(params.tableNumber, 10);
    const body = await req.json();
    const { userId, items } = body;

    if (!userId || !tableNumber || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ message: "Paramètres manquants ou invalides" }),
        { status: 400 }
      );
    }

   
    const user = await User.findById(userId);
    if (!user)
      return new Response(
        JSON.stringify({ message: "Utilisateur non trouvé" }),
        { status: 404 }
      );

    const orderIndex = user.orders.findIndex((o) => o.tableNumber === tableNumber);
    if (orderIndex === -1)
      return new Response(
        JSON.stringify({ message: "Commande non trouvée" }),
        { status: 404 }
      );

    const order = user.orders[orderIndex];

    items.forEach(({ name, quantity }) => {
      if (typeof quantity !== "number" || quantity <= 0) return;

      const itemIndex = order.items.findIndex((i) => i.name === name);
      if (itemIndex !== -1) {
        if (order.items[itemIndex].quantity > quantity) {
          order.items[itemIndex].quantity -= quantity;
        } else {
          order.items.splice(itemIndex, 1);
        }
      }
    });

    order.total = order.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    if (order.items.length === 0) user.orders.splice(orderIndex, 1);

    await user.save();

    return new Response(
      JSON.stringify({ success: true, order: order.items.length ? order : null }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur bulk delete:", err);
    return new Response(
      JSON.stringify({ message: "Erreur serveur interne" }),
      { status: 500 }
    );
  }
}
