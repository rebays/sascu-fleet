const fs = require('fs');
const path = require('path');

const BRAND_BLUE = '#063587';
const COMPANY_NAME = process.env.COMPANY_NAME || 'SASCU Rentals';
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || '';

let logoDataUri;
const getLogoDataUri = () => {
  if (!logoDataUri) {
    const buf = fs.readFileSync(path.join(__dirname, '..', 'assets', 'sascu-logo-email.png'));
    logoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  }
  return logoDataUri;
};

// Wraps inner content HTML in a branded header/footer shell used by every
// outgoing email (table-based layout for broad email-client compatibility).
const renderEmail = (innerHtml) => `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; max-width:600px; width:100%;">
            <tr>
              <td style="background-color:${BRAND_BLUE}; padding:24px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${getLogoDataUri()}" width="32" alt="${COMPANY_NAME}" style="display:block;" />
                    </td>
                    <td style="vertical-align:middle; padding-left:12px;">
                      <span style="color:#ffffff; font-size:20px; font-weight:bold; letter-spacing:0.5px; font-family: Arial, Helvetica, sans-serif;">SASCU</span><br/>
                      <span style="color:#c3d0ec; font-size:12px; font-family: Arial, Helvetica, sans-serif;">Vehicle Hire</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px; color:#1f2937; font-size:14px; line-height:1.6;">
                ${innerHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:#f4f5f7; padding:20px 32px; border-top:1px solid #e5e7eb;">
                <p style="margin:0; color:#6b7280; font-size:12px; line-height:1.5;">
                  ${COMPANY_NAME}${COMPANY_ADDRESS ? ` &middot; ${COMPANY_ADDRESS}` : ''}<br/>
                  This is an automated message, please do not reply directly to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

// Reusable call-to-action button used by e.g. the password reset email.
const renderButton = (label, url) => `
  <a href="${url}"
     style="display:inline-block; padding:12px 28px; background-color:${BRAND_BLUE}; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">
    ${label}
  </a>
`;

// Small colored status pill (green for confirmed/paid, red for cancelled/rejected, amber otherwise).
const renderStatusBadge = (label) => {
  const lower = label.toLowerCase();
  const isPositive = ['approved', 'confirmed', 'paid'].includes(lower);
  const isNegative = ['cancelled', 'rejected', 'failed'].includes(lower);
  const bg = isPositive ? '#dcfce7' : isNegative ? '#fee2e2' : '#fef3c7';
  const fg = isPositive ? '#166534' : isNegative ? '#991b1b' : '#92400e';
  return `<span style="display:inline-block; padding:4px 12px; border-radius:999px; background-color:${bg}; color:${fg}; font-size:12px; font-weight:bold; text-transform:uppercase;">${label}</span>`;
};

module.exports = { renderEmail, renderButton, renderStatusBadge, BRAND_BLUE, COMPANY_NAME };
