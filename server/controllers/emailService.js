import nodemailer from "nodemailer";

/**
 * Nodemailer transporter configured for Gmail SMTP
 * @type {Object}
 */
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "livedocsmeta@gmail.com",
    pass: "twzo ybka qogt vwxd",
  },
});

/**
 * Sends a document sharing notification email
 * @param {string} params.to - Recipient email address
 * @param {string} params.fromUser - Email of user sharing the document
 * @param {string} params.docTitle - Title of the shared document
 * @param {string} params._shareUrl - Share URL (currently unused parameter)
 * @returns {Promise<Object>} Promise resolving to email send result
 */

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
