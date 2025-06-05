import { connectToDatabase } from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(request) {
  await connectToDatabase();

  const { userId } = await request.json();
  if (!userId) return new Response("userId missing", { status: 400 });

  try {
    const user = await User.findById(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const now = new Date();
    const yearStr = now.getFullYear().toString();
    const monthStr = (now.getMonth() + 1).toString(); // Ex: "6"
    const dayNum = now.getDate();

    // Cherche ou crée l’année
    let yearlyReport = user.reports.find((r) => r.year === yearStr);
    if (!yearlyReport) {
      yearlyReport = { year: yearStr, months: {} };
      user.reports.push(yearlyReport);
    }

    // Cherche ou crée le mois (objet JS simple)
    if (!yearlyReport.months[monthStr]) {
      yearlyReport.months[monthStr] = [];
    }

    const dailyReports = yearlyReport.months[monthStr];

    // Cherche ou crée la journée
    let dailyReport = dailyReports.find((d) => d.day === dayNum);
    if (!dailyReport) {
      dailyReport = {
        day: dayNum,
        totalRevenue: 0,
        tva: { tva5_5: 0, tva10: 0, tva20: 0 },
        payments: { cash: 0, card: 0, check: 0, ticket: 0 },
        createdAt: now,
      };
      dailyReports.push(dailyReport);
    }

    user.markModified("reports"); // Important pour forcer mongoose à détecter la modif
    await user.save();

    return new Response(JSON.stringify(dailyReport), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
