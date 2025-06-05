import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req) {
  console.log(req)
   await connectToDatabase();
  const body = await req.json();

  const {
    userId,
   tableNumber,
    items,
    total,
    paymentMethods
  } = body;

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth()); // 0-11
  const day = now.getDate();

  // Calcul des TVA totales
  const tvaTotals = { tva5_5: 0, tva10: 0, tva20: 0 };
  for (const item of items) {
    const totalItem = item.price * item.quantity;
    if (item.tva === 5.5) tvaTotals.tva5_5 += totalItem;
    else if (item.tva === 10) tvaTotals.tva10 += totalItem;
    else if (item.tva === 20) tvaTotals.tva20 += totalItem;
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ success: false, message: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Trouver ou créer le rapport annuel
    let report = user.reports.find(r => r.year === year);
    if (!report) {
      report = { year, months: {} };
      user.reports.push(report);
    }

    // Accès au mois
    if (!report.months[month]) {
      report.months[month] = [];
    }

    // Vérifie s'il y a déjà un rapport pour ce jour
    let dayReport = report.months[month].find(r => r.day === day);

    if (!dayReport) {
      // Nouveau rapport journalier
      report.months[month].push({
        day,
        totalRevenue: total,
        tva: tvaTotals,
        payments: {
          cash: paymentMethods.Espèces || 0,
          card: paymentMethods.CB || 0,
          check: paymentMethods.Chèque || 0,
          ticket: paymentMethods.Ticket || 0
        },
        createdAt: new Date()
      });
    } else {
      // Mise à jour d’un rapport existant
      dayReport.totalRevenue += total;
      dayReport.tva.tva5_5 += tvaTotals.tva5_5;
      dayReport.tva.tva10 += tvaTotals.tva10;
      dayReport.tva.tva20 += tvaTotals.tva20;
      dayReport.payments.cash += paymentMethods.Espèces || 0;
      dayReport.payments.card += paymentMethods.CB || 0;
      dayReport.payments.check += paymentMethods.Chèque || 0;
      dayReport.payments.ticket += paymentMethods.Ticket || 0;
    }

    await user.save();

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Erreur rapport :', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
