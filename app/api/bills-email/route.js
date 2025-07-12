import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SEND_GRID_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb', 
    },
  },
};

export async function POST(req) {
  const body = await req.json();
  const { email, ticketNumber, pdfBase64, filename } = body;

  if ( !email || !ticketNumber) {
    return new Response(JSON.stringify({ message: "INVALID_PARAMETER" }), { status: 400 });
  }

  const pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!pattern.test(email)) {
    return new Response(JSON.stringify({ message: "EMAIL_SYNTAX_INCORRECT" }), { status: 400 });
  }


  // Nettoyer le base64 si nécessaire
  let base64Content = pdfBase64;
  if (pdfBase64 && pdfBase64.startsWith("data:")) {
    base64Content = pdfBase64.split(",")[1];
  }

  const sendGridMail = {
  to: email,
  from: process.env.EMAIL_MASTER,
  subject: "Votre facture",
  text: "Veuillez trouver votre facture en pièce jointe.",
  // ou html: "<p>Veuillez trouver votre facture en pièce jointe.</p>",

  attachments: base64Content
    ? [
        {
          content: base64Content,
          filename: typeof filename === "string" && filename.trim() !== "" ? filename : "facture.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ]
    : undefined,
};


  try {
    await sgMail.send(sendGridMail);
    return new Response(JSON.stringify({ message: "EMAIL_SENDED_SUCCESSFULLY" }), { status: 200 });
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    return new Response(JSON.stringify({ message: "ERROR_WITH_SENDGRID" }), { status: 500 });
  }
}
