# Admin User Guide — SASCU Fleet Dashboard

This guide is for SASCU staff who use the **Admin Dashboard** (`admin-dashboard/`) to manage the vehicle fleet, bookings, payments, invoices, customers, and reports. It reflects the app as it stands today — where something is limited or not yet built, that's called out explicitly rather than glossed over.

## 1. Roles

There are two staff roles. Everything in this guide applies to both unless a step says otherwise.

| Role | Can do |
|---|---|
| **admin** | Everything in this guide except the items marked *superadmin only* |
| **superadmin** | Everything an admin can do, **plus**: edit/delete bookings that are already confirmed or completed, manage other admin accounts, and change user roles |

## 2. Logging In

1. Go to the dashboard's `/login` page and sign in with your staff email and password.
2. Only accounts with the `admin` or `superadmin` role can log in here — customer accounts are rejected.
3. **Forgot your password?** Use the "Forgot password" link on the login page. You'll receive a reset-link email; follow it to set a new password.
4. Session note: your login session is stored in the browser (not a server session cookie with expiry logic beyond a 7‑day token), so use "Log out" from the sidebar's profile menu when you're done on a shared computer.

## 3. Dashboard (Overview)

The dashboard home page (`/`) is your daily snapshot:

- **KPI tiles** — total revenue, today's revenue, total bookings, active vehicles, and pending/paid counts for the selected date range.
- **Revenue chart** and **bookings-by-status chart** for the selected range.
- **Date range filter** — narrow the whole page to a specific period.
- **Export Excel** — downloads a multi-sheet workbook (Summary, Daily Revenue, Bookings, Payments) for the selected range, handy for offline reporting or handing off to finance.

## 4. Managing Vehicles

Go to **Vehicles** in the sidebar.

- Switch between **card** and **list** view, and search by make, model, or license plate.
- **Add Vehicle**: fill in make, model, year, license plate, type (car / SUV / bike / scooter / truck / bus), and location, then set pricing (see below). Upload one or more photos — customers will see them as a swipeable photo carousel on the public site.
- **Pricing fields** — each vehicle has 8 rate fields, organized as **Day vs Half-day** × **In-town vs Out-of-town** × **Regular vs SASCU Member**:
  - In-town: day rate, half-day rate, member day rate, member half-day rate
  - Out-of-town: day rate, half-day rate, member day rate, member half-day rate
  - The **half-day rate** applies to rentals of 12 hours or less; anything longer is billed at the full day rate.
  - The **member rate** applies when the customer supplies a valid SASCU Member ID on their booking.
- New vehicles are created **Inactive** by default — a vehicle must be explicitly **Activated** before it's visible to customers on the public site.
- **Deactivate/Activate**: toggling a vehicle off hides it from customers; if it has active or upcoming bookings, you'll see a warning with the booking count before you confirm.
- **Delete**: blocked if the vehicle has any active/upcoming bookings, so you can't accidentally orphan a customer's reservation. Deleting a vehicle also removes its uploaded photos from storage.

## 5. Managing Bookings

Go to **Bookings** in the sidebar.

- Switch between **card** and **list** view; **search**, and **filter by status**: All / Awaiting Approval / Confirmed / Cancelled / Paid; results are paginated.
- **Create Booking**: use this to book on behalf of a customer (phone/walk-in bookings). Pick the vehicle and customer from searchable pickers — you can create a new customer record inline if they don't exist yet. Pricing (regular vs member, in-town vs out-of-town, half-day vs full-day) is calculated automatically based on the vehicle, dates, and customer's member status. The system checks live for date conflicts with existing bookings before letting you save.
- **Edit Booking**: same form, reused for changes to an existing booking.
  - **Confirmed or completed bookings cannot be edited or deleted by a regular admin** — only a **superadmin** can override this. This is intentional, to protect bookings once they're locked in.

### Booking detail page

Click into any booking to see the full picture: rental period, payment summary and balance due, status history timeline, a table of recorded payments, the customer's profile, and the vehicle's full rate card. From here you can:

- **Approve** or **Reject** a pending booking.
- **Cancel** a confirmed booking (you'll be prompted for a note; if the booking already had a payment recorded, you'll see a refund reminder, and if the pickup date has already passed you'll get an extra warning).
- **Record Payment** — log a payment against the booking (amount + method: card, cash, EFT, or other). This updates the booking's deposit/balance and payment status automatically, and emails the customer a payment confirmation.
- **Preview Invoice** / **Preview Receipt** — opens a print-ready invoice or receipt in your browser (use your browser's print/save-as-PDF to produce a document for the customer). This is a print view, not an emailed PDF — if you need to email an invoice document rather than print it, that currently has to be handled outside this page (see note below).

> **Note on invoices:** there is a separate, simpler **Invoices** list that supports downloading a PDF and emailing it directly to the customer, but it isn't currently linked in the sidebar navigation. Ask your engineering team whether this should be added to the menu — until then, the booking detail page's Preview Invoice/Receipt is the supported day-to-day workflow.

## 6. Managing Users

Go to **Users** in the sidebar. This list covers both customers and staff.

- **Search**, and **filter** by All / Super Admin / Admin / Member / Non‑member; results are paginated.
- **Add/Edit User**: name, email, phone, and SASCU Member ID. The **role** field is only visible if you're logged in as a **superadmin**. A password field only appears when creating a new admin account.
- **Make Member / Remove Membership**: toggles a customer's SASCU membership flag (with a confirmation prompt) — this is what makes the member pricing tier apply to their future bookings.
- **Delete**: available for customer records; staff accounts can't be removed from this screen.

## 7. Settings

Go to **Settings** in the sidebar.

- **Update Password** — change your own password (requires your current password).
- **Admin Management** *(superadmin only)* — an additional panel where you can:
  - View all admin/superadmin accounts.
  - **Add Admin** — create a new staff account with a temporary password.
  - **Reset Password** for another admin (you can't reset your own from here — use Update Password above).

## 8. Automatic Customer Emails

The system emails customers automatically at these points, so you don't need to notify them manually:

| Trigger | Email sent |
|---|---|
| New booking created (by customer or by you) | "Booking received" confirmation to the customer, plus an internal notification to staff |
| Booking edited | "Booking updated" |
| Booking approved / rejected / cancelled | Status-change email, including any note you added |
| Booking deleted | "Booking cancelled/deleted" |
| Payment recorded | "Payment received" confirmation |
| Password reset requested | Reset link |

If a customer says they didn't get an email, check spam first — outbound email currently sends through a sandbox sender address, which can occasionally affect deliverability. Flag repeated issues to engineering.

## 9. Good to Know / Current Limitations

- **Pending bookings don't block a vehicle's dates** — only **confirmed** bookings show up as a conflict for other customers. This is deliberate, so one unconfirmed request doesn't lock out everyone else, but it means two pending requests for the same dates can both come in — resolve these by approving one and rejecting the other.
- **Payment isn't collected online** — customers book first, then staff arrange payment separately (cash, bank transfer, etc.) and record it manually via Record Payment. There's no card-payment integration today.
- **Pickup location** is currently just "Henderson" — there's no multi-location support yet.
- If something looks wrong with a report or export, or a page you'd expect to see isn't in the sidebar, check with engineering before assuming it's intentional — a couple of admin-facing pages (like the standalone Invoices list mentioned above) exist but aren't wired into navigation yet.
