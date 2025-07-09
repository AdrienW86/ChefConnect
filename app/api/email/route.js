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

  const { name, email, subject, message, pdfBase64, filename } = body;

  if (!name || !email || !subject || !message) {
    return new Response(JSON.stringify({ message: "INVALID_PARAMETER" }), {
      status: 400,
    });
  }

  const pattern =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!pattern.test(email)) {
    return new Response(JSON.stringify({ message: "EMAIL_SYNTAX_INCORRECT" }), {
      status: 400,
    });
  }

  const contenu = message
    .replace(/\n/g, "<br>")
    .replace(/\r/g, "<br>")
    .replace(/\t/g, "<br>")
    .replace(/<(?!br\s*\/?)[^>]+>/g, "");

const sendGridMail = {
  to: process.env.EMAIL_CLIENT,
  from: process.env.EMAIL_MASTER,
  subject: subject,
  text: message,
  html: contenu, 
  attachments: pdfBase64
    ? [
        {
          content: pdfBase64,
          filename: "rapport.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ]
    : undefined,
};

  if (pdfBase64) {
    sendGridMail.attachments = [
      {
        content: pdfBase64,
        filename: filename || "rapport.pdf",
        type: "application/pdf",
        disposition: "attachment",
      },
    ];
  }

  try {
    await sgMail.send(sendGridMail);
    return new Response(JSON.stringify({ message: "EMAIL_SENDED_SUCCESSFULLY" }), {
      status: 200,
    });
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    return new Response(JSON.stringify({ message: "ERROR_WITH_SENDGRID" }), {
      status: 500,
    });
  }
}
