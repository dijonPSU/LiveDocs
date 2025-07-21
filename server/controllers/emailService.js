import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "livedocsmeta@gmail.com",
    pass: "twzo ybka qogt vwxd",
  },
});

export const sendEmail = async ({ to, fromUser, docTitle, _shareUrl }) => {
  return transporter.sendMail({
    from: `"${fromUser}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Document Shared With You: ${docTitle}`,
    html: `
      <h2>${fromUser} shared a document with you</h2>
      <p><strong>Document:</strong> ${docTitle}</p>
      <p>
        <a>Login to livedocs to view your new document</a>
      </p>
    `,
  });
};
