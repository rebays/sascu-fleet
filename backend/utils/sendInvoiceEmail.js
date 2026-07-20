const generateInvoicePDF = require('./generateInvoicePDF');
const { sendMail } = require('./mailer');

const sendInvoiceEmail = async (invoice) => {
  const pdf = await generateInvoicePDF(invoice);

  await sendMail({
    to: invoice.booking.user.email,
    subject: `Invoice ${invoice.invoiceNumber} - ${process.env.COMPANY_NAME}`,
    html: `<p>Dear ${invoice.booking.user.name},</p><p>Please find your invoice attached.</p>`,
    attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdf }]
  });
};

module.exports = sendInvoiceEmail;