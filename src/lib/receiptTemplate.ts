import { format } from "date-fns";
import logo from "@/assets/royal-logo.png"

/* ================= BILL RECEIPT TEMPLATE ================= */

export const billReceiptHTML = (order: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bill Receipt</title>
  <style>
    body {
      font-family: monospace;
      font-size: 12px;
      margin: 0;
      padding: 8px;
      width: 280px; /* 58mm */
    }

    .center { text-align: center; }
    .bold { font-weight: bold; }
    .small { font-size: 11px; }

    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }

    .row {
      display: flex;
      justify-content: space-between;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    th, td {
      text-align: left;
      padding: 2px 0;
    }

    th {
      border-bottom: 1px dashed #000;
    }

    .right { text-align: right; }

    img.logo {
      max-width: 120px;
      margin-bottom: 4px;
    }
  </style>
</head>

<body>

  <!-- LOGO -->
  <div class="center">
    <img src='/royal-logo.png' class="logo" />
  </div>

  <!-- OUTLET -->
  <div class="center bold">${order.outlets?.name || "ROYAL LIVE BAKERY"}</div>
    <div class="center bold">"ROYALLIVEFOODS PVT. LTD."</div>
  <div class="center small">
    ${order.outlets?.address || "-"}<br/>
    GST IN: ${order.outlets?.gst_no || "-"}<br/>
    Ph: ${order.outlets?.phone || "-"}
  </div>

  <div class="divider"></div>

  <!-- BILL META -->
  <div class="row">
    <span>Bill No:</span>
    <span>${order.order_number}</span>
  </div>
  <div class="row">
    <span>Date:</span>
    <span>${formatDate(order.created_at)}</span>
  </div>
  <div class="row">
    <span>User:</span>
    <span>${order.created_by || "Admin"}</span>
  </div>

  <div class="divider"></div>

  <!-- ITEMS -->
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="right">Qty</th>
        <th class="right">Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items?.map((item: any) => `
        <tr>
          <td>${item.name}</td>
          <td class="right">${item.qty}</td>
          <td class="right">${money(item.price)}</td>
          <td class="right">${money(item.qty * item.price)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="divider"></div>

  <!-- TOTALS -->
  <div class="row">
    <span>Sub Total</span>
    <span>${money(order.total_amount)}</span>
  </div>

  <div class="row">
    <span>Discount</span>
    <span>${money(order.discount_amount || 0)}</span>
  </div>

  <div class="row">
    <span>GST (${order.tax_percentage}%)</span>
    <span>${money(order.tax_value)}</span>
  </div>

  <div class="divider"></div>

  <div class="row bold">
    <span>Grand Total</span>
    <span>${money(order.grand_total)}</span>
  </div>

  <div class="row">
    <span>Paid</span>
    <span>${money(order.grand_total - order.balance)}</span>
  </div>

  <div class="row bold">
    <span>Balance</span>
    <span>${money(order.balance)}</span>
  </div>

  <div class="divider"></div>

  <div class="center small">
    GST ${order.tax_percentage}% included<br/>
    Thanks for visiting us 🙏
  </div>

</body>
</html>
`;



/* ================= DETAIL SLIP TEMPLATE ================= */

export const detailSlipHTML = (order: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Order Detail Slip</title>
  <style>
    body {
      font-family: monospace;
      font-size: 12px;
      margin: 0;
      padding: 8px;
      width: 280px; /* 58mm printer */
    }

    .center {
      text-align: center;
    }

    .bold {
      font-weight: bold;
    }

    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }

    .row {
      display: flex;
      justify-content: space-between;
    }

    .small {
      font-size: 11px;
    }

    img.logo {
      max-width: 120px;
      margin-bottom: 4px;
    }
  </style>
</head>

<body>

  <!-- LOGO -->
  // <div class="center">
  //   <img src="@/assets/royal-logo.png" class="logo" />
  // </div>

  <!-- OUTLET DETAILS -->
  <div class="center bold">ROYAL LIVE FOODS</div>
  <div class="center small">
    ${order.outlets?.address || "Outlet Address"}<br/>
    // GST: ${order.outlets?.gst_no || "-"}<br/>
    Ph: ${order.outlets?.phone_no || "-"}
  </div>

  <div class="divider"></div>

  <!-- ORDER INFO -->
  <div class="row"><span>Cake Size:</span><span>${order.cake_size || "-"}</span></div>
  <div class="row"><span>Flavour:</span><span>${order.flavour || "-"}</span></div>
  <div class="row"><span>Delivery:</span><span>${formatDate(order.delivery_date)}</span></div>

  <div class="divider"></div>

  <div class="row"><span>Order No:</span><span>${order.order_number}</span></div>
  <div class="row"><span>Order Date:</span><span>${formatDate(order.created_at)}</span></div>

  <div class="divider"></div>

  <!-- CUSTOMER -->
  <div class="row"><span>Name:</span><span>${order.customers?.name}</span></div>
  <div class="row"><span>Phone:</span><span>${order.customers?.phone_no}</span></div>

  ${order.message_on_cake ? `
    <div class="divider"></div>
    <div class="small">Message on Cake:</div>
    <div class="bold">${order.message_on_cake}</div>
  ` : ""}

  ${order.delivery_address ? `
    <div class="divider"></div>
    <div class="small">Delivery Address:</div>
    <div>${order.delivery_address}</div>
  ` : ""}

  <div class="divider"></div>

  <!-- AMOUNT -->
  <div class="row"><span>Total:</span><span>${money(order.total_amount)}</span></div>
  <div class="row"><span>Delivery:</span><span>${money(order.delivery_charge)}</span></div>
  <div class="row"><span>Discount:</span><span>${money(order.after_discount - order.total_amount)}</span></div>
  <div class="row"><span>GST (${order.tax_percentage}%):</span><span>${money(order.tax_value)}</span></div>

  <div class="divider"></div>

  <div class="row bold">
    <span>Total Pay:</span>
    <span>${money(order.grand_total)}</span>
  </div>

  <div class="row bold">
    <span>Balance:</span>
    <span>${money(order.balance)}</span>
  </div>

  <div class="divider"></div>

  <div class="center small">Thank you 🙏</div>

</body>
</html>
`;

/* ================= HELPERS ================= */

const money = (n: number | null) => `₹${(n || 0).toFixed(2)}`;

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
