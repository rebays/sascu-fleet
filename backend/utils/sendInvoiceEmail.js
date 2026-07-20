const generateInvoicePDF = require('./generateInvoicePDF');
const { sendMail } = require('./mailer');
const { renderEmail } = require('./emailTemplate');

const sendInvoiceEmail = async (invoice) => {
  const pdf = await generateInvoicePDF(invoice);

  await sendMail({
    to: invoice.booking.user.email,
    subject: `Invoice ${invoice.invoiceNumber} - ${process.env.COMPANY_NAME}`,
    html: renderEmail(`<h2 style="margin-top:0;">Dear ${invoice.booking.user.name},</h2><p>Please find your invoice attached.</p>`),
    attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdf }]
  });
};

module.exports = sendInvoiceEmail;