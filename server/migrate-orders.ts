import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'grocery_store',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

const ordersFile = path.join(process.cwd(), 'server', 'orders.json')

async function migrateOrders() {
  try {
    const fileData = fs.readFileSync(ordersFile, 'utf-8')
    const orders = JSON.parse(fileData)

    console.log(`Found ${orders.length} orders in orders.json`)

    for (const order of orders) {
      const createdAt = new Date(order.createdAt)
      const lastUpdated = new Date(order.lastUpdated || order.createdAt)

      await db.execute(
        `
        INSERT IGNORE INTO orders
        (
          order_number,
          name,
          phone,
          address,
          city,
          payment_method,
          items,
          total,
          status,
          locked,
          created_at,
          last_updated
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          order.orderNumber,
          order.name,
          order.phone,
          order.address,
          order.city,
          order.paymentMethod,
          JSON.stringify(order.items),
          order.total,
          order.status || 'Pending',
          order.locked ?? false,
          createdAt,
          lastUpdated
        ]
      )

      console.log(`Migrated: ${order.orderNumber}`)
    }

    console.log('Migration completed successfully!')

    const [rows] = await db.query(
      'SELECT id, order_number, total, status FROM orders ORDER BY id'
    )

    console.table(rows)

    await db.end()
  } catch (error) {
    console.error('Migration failed:', error)
    await db.end()
  }
}

migrateOrders()