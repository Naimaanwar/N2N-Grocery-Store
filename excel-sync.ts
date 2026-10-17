
import dotenv from 'dotenv';
import XLSX from 'xlsx';
import fs from 'node:fs';

dotenv.config({ path: 'D:/excel folder/.env.sync' });

const API_URL = process.env.RENDER_API_URL;
const SYNC_KEY = process.env.EXCEL_SYNC_KEY;
const EXCEL_FILE = 'D:\\excel folder\\N2N-Grocery-Products-Template (1).xlsx';
const INTERVAL_MS = 5000;

if (!API_URL || !SYNC_KEY) {
  throw new Error(
    'D:/excel/.env.sync mein RENDER_API_URL ya EXCEL_SYNC_KEY missing hai.'
  );
}

async function syncExcel(): Promise<void> {
  try {
    if (!fs.existsSync(EXCEL_FILE)) {
      throw new Error(`Excel file nahi mili: ${EXCEL_FILE}`);
    }

    const response: Response = await fetch(`${API_URL}/api/excel-sync`, {
     headers: { 'x-excel-sync-key': SYNC_KEY! }
    });

    console.log('API status:', response.status);

    if (!response.ok) {
      throw new Error(
        `API error: ${response.status} ${await response.text()}`
      );
    }

    const data = await response.json() as {
      products: Record<string, unknown>[];
      orders: Record<string, unknown>[];
    };

    const workbook = XLSX.readFile(EXCEL_FILE);

    const productRows = data.products.map((p) => ({
  id: p.id ?? '',
  name: p.name ?? '',
  price: p.price ?? '',
  category: p.category ?? '',
  unit: p.unit ?? '',
  stock: p.stock ?? '',
  image: p.image ?? ''
}));

   
    const orderRows = data.orders.map((o) => ({
      orderNumber: o.orderNumber ?? '',
      date: o.createdAt
        ? new Date(Number(o.createdAt)).toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : '',
      customerName: o.customerName ?? '',
      phone: o.phone ?? '',
      address: o.address ?? '',
      city: o.city ?? '',
      paymentMethod: o.paymentMethod ?? '',
      total: o.total ?? '',
      status: o.status ?? '',
      locked: o.locked ?? false
    }));

    const orderDetailRows = data.orders.flatMap((o) => {
      const items = Array.isArray(o.items) ? o.items as Record<string, unknown>[] : [];

      return items.map((item) => ({
        orderNumber: o.orderNumber ?? '',
        customerName: o.customerName ?? '',
        productName: item.name ?? item.id ?? '',
        quantity: item.quantity ?? '',
        unit: item.unit ?? '',
        price: item.price ?? ''
      }));
    });

   workbook.Sheets['Products'] = XLSX.utils.json_to_sheet(productRows, {
  header: ['id', 'name', 'price', 'category', 'unit', 'stock', 'image']
});

    if (!workbook.SheetNames.includes('Products')) {
      workbook.SheetNames.push('Products');
    }

    workbook.Sheets['Orders'] = XLSX.utils.json_to_sheet(orderRows, {
      header: [
        'orderNumber', 'date', 'customerName', 'phone', 'address',
        'city', 'paymentMethod', 'total', 'status', 'locked'
      ]
    });

    if (!workbook.SheetNames.includes('Orders')) {
      workbook.SheetNames.push('Orders');
    }

    workbook.Sheets['Order Details'] = XLSX.utils.json_to_sheet(orderDetailRows, {
      header: ['orderNumber', 'customerName', 'productName', 'quantity', 'unit', 'price']
    });

    if (!workbook.SheetNames.includes('Order Details')) {
      workbook.SheetNames.push('Order Details');
    }

    XLSX.writeFile(workbook, EXCEL_FILE);

    console.log(
      `${new Date().toLocaleTimeString()} — Products: ${productRows.length}, Orders: ${orderRows.length}`
    );
  } catch (error) {
    console.error(
      `${new Date().toLocaleTimeString()} — Sync failed:`,
      error instanceof Error ? error.message : error
    );
  }
}

console.log('N2N Excel sync start ho raha hai.');
console.log('Excel file:', EXCEL_FILE);

await syncExcel();
setInterval(() => {
  void syncExcel();
}, INTERVAL_MS);