import { format } from "date-fns";
import logo from "@/assets/royal-logo.png"

/* ================= BILL RECEIPT TEMPLATE ================= */

// Helper function to format date
const formatDate = (date?: string | null) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const money = (n: number | null) => `₹${(n || 0).toFixed(2)}`;

export const billReceiptHTML = (order: any) => {
  // outlet details must be passed explicitly
  const outlet = order.outlet || {};   // EXPECT: outlet object sent from parent

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bill Receipt</title>
  <style>
    body {
      font-family: monospace;
      font-size: 30px;   /* 🔥 INCREASED 3x */
      margin: 0;
      padding: 20px;
      width: 380px;
    }

    .center { text-align: center; }
    .bold { font-weight: bold; }
    .small { font-size: 32px; }

    .divider {
      border-top: 2px dashed #000;
      margin: 12px 0;
    }

    .row {
      display: flex;
      justify-content: space-between;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 34px;
    }

    th, td {
      padding: 6px 0;
    }

    th {
      border-bottom: 2px dashed #000;
    }

    img.logo {
      max-width: 200px;
      margin-bottom: 10px;
    }
  </style>
</head>

<body>

 

  <div class="center bold">${"ROYAL LIVE BAKERY"}</div>
  <div class="center small">ROYALLIVEFOODS PVT. LTD.</div>

  <div class="center small">
    ${outlet.address || "Outlet Address"}<br/>
    GST IN: ${outlet.gst_no || "-"}<br/>
    Ph: ${outlet.phone_no || "-"}
  </div>

  <div class="divider"></div>

  <div class="row"><span>Bill No:</span><span>${order.order_number}</span></div>
  <div class="row"><span>Date:</span><span>${formatDate(order.created_at)}</span></div>

  <div class="divider"></div>

  <div class="bold center">ITEMS</div>

  <table>
    <tbody>
      ${
        order.items
          ?.map(
            (item: any) => `
        <tr>
          <td>${item.name}</td>
          <td class="right">${item.qty}</td>
          <td class="right">${money(item.price)}</td>
          <td class="right">${money(item.qty * item.price)}</td>
        </tr>`
          )
          .join("") || ""
      }
    </tbody>
  </table>

  <div class="divider"></div>

  <div class="row bold"><span>Grand Total:</span><span>${money(order.grand_total)}</span></div>
  <div class="row bold"><span>Balance:</span><span>${money(order.balance)}</span></div>

  <div class="divider"></div>

  <div class="center small">
    GST included<br/>
    Thanks for visiting us 🙏
  </div>

</body>
</html>
`;
};



/* ================= DETAIL SLIP TEMPLATE ================= */

export const detailSlipHTML = (order: any) => {
  const outlet = order.outlet || {};

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Order Detail Slip</title>
  <style>
    body {
      font-family: monospace;
      font-size: 30px;   /* 🔥 MUCH LARGER */
      padding: 20px;
      width: 380px;
    }

    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 2px dashed #000; margin: 12px 0; }
    .row { display: flex; justify-content: space-between; }
    .small { font-size: 34px; }

    img.logo { max-width: 200px; margin-bottom: 10px; }
  </style>
</head>

<body>

  

  <div class="center bold">${"ROYAL LIVE BAKERY"}</div>
  <div class="center small">ROYALLIVEFOODS PVT. LTD.</div>

  <div class="small center">
    ${outlet.address || "-"}<br/>
    GST: ${outlet.gst_no || "-"}<br/>
    Ph: ${outlet.phone_no || "-"}
  </div>

  <div class="divider"></div>

  <div class="row"><span>Cake Size:</span><span>${order.cake_size || "-"}</span></div>
  <div class="row"><span>Flavour:</span><span>${order.flavour || "-"}</span></div>
  <div class="row"><span>Delivery:</span><span>${formatDate(order.delivery_date)}</span></div>

  <div class="divider"></div>

  <div class="row"><span>Order No:</span><span>${order.order_number}</span></div>
  <div class="row"><span>Order Date:</span><span>${formatDate(order.created_at)}</span></div>

  <div class="divider"></div>

  <!-- CUSTOMER -->
  <div class="row"><span>Name:</span><span>${order.customers?.name || "-"}</span></div>
  <div class="row"><span>Phone:</span><span>${order.customers?.phone_no || "-"}</span></div>

  ${
    order.message_on_cake
      ? `
    <div class="divider"></div>
    <div class="small">Message on Cake:</div>
    <div class="bold">${order.message_on_cake}</div>
  `
      : ""
  }

  ${
    order.delivery_address
      ? `
    <div class="divider"></div>
    <div class="small">Delivery Address:</div>
    <div>${order.delivery_address}</div>
  `
      : ""
  }

  <div class="divider"></div>

  <div class="row bold"><span>Total Pay:</span><span>${money(order.grand_total)}</span></div>
  <div class="row bold"><span>Balance:</span><span>${money(order.balance)}</span></div>

  <div class="divider"></div>

  <div class="center small">Thank you 🙏</div>

</body>
</html>
`;
};
