import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { sendWhatsAppMessage } from './whatsapp'

const app = express()

app.use(cors())

// =========================
// JSON LIMIT
// =========================

app.use(
  express.json({
    limit: '15mb'
  })
)

// =========================
// PRODUCT IMAGE FOLDER
// =========================

const productImagesDir = path.join(
  process.cwd(),
  'public',
  'product-images'
)

fs.mkdirSync(productImagesDir, {
  recursive: true
})

// =========================
// SERVE PRODUCT IMAGES
// =========================

app.use(
  '/product-images',
  express.static(productImagesDir)
)

// =========================
// SERVE VITE FRONTEND
// =========================

const distDir = path.join(
  process.cwd(),
  'dist'
)

app.use(
  express.static(distDir)
)

// =========================
// SAVE PRODUCT IMAGE
// =========================

function saveProductImage(
  imageData: string,
  imageName: string
): string {

  const match = imageData.match(
    /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/
  )

  if (!match) {
    throw new Error('Invalid image format')
  }

  const imageType = match[1].toLowerCase()

  const base64Data = match[2]

  let extension = imageType

  if (
    imageType === 'jpeg' ||
    imageType === 'jpg'
  ) {
    extension = 'jpg'
  }

  const originalName = path.basename(
    imageName || 'product'
  )

  const nameWithoutExtension =
    originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')

  const fileName =
    `${Date.now()}-${nameWithoutExtension}.${extension}`

  const filePath = path.join(
    productImagesDir,
    fileName
  )

  fs.writeFileSync(
    filePath,
    Buffer.from(base64Data, 'base64')
  )

  console.log(
    `Product image saved: ${fileName}`
  )

  return `/product-images/${fileName}`
}

// =========================
// MYSQL CONNECTION
// =========================

const db = mysql.createPool({

  host: process.env.DB_HOST,

  user: process.env.DB_USER,

  password: process.env.DB_PASSWORD,

  database: process.env.DB_NAME,

  port: Number(
    process.env.DB_PORT || 3306
  ),

  ssl: {
    rejectUnauthorized: true
  },

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0

})

// =========================
// TEST DATABASE CONNECTION
// =========================

async function testDatabase() {

  try {

    const connection =
      await db.getConnection()

    console.log(
      'MySQL Database Connected Successfully!'
    )

    connection.release()

  } catch (error) {

    console.error(
      'MySQL Connection Failed:',
      error
    )

  }

}

testDatabase()

// ==================================================
// CREATE NEW ORDER + UPDATE STOCK
// ==================================================

app.post(
  '/api/orders',
  async (req, res) => {

    const connection =
      await db.getConnection()

    try {

      const order = req.body

      // =========================
      // GENERATE ORDER NUMBER
      // =========================

      const [lastOrderRows] =
        await db.execute(`
          SELECT order_number
          FROM orders
          WHERE order_number LIKE 'N2N-%'
          ORDER BY CAST(
            SUBSTRING(order_number, 5)
            AS UNSIGNED
          ) DESC
          LIMIT 1
        `)

      const lastOrders =
        lastOrderRows as any[]

      let nextNumber = 1

      if (lastOrders.length > 0) {

        const lastOrderNumber =
          String(
            lastOrders[0].order_number
          )

        const lastNumber =
          parseInt(
            lastOrderNumber.replace(
              'N2N-',
              ''
            ),
            10
          )

        if (!isNaN(lastNumber)) {
          nextNumber =
            lastNumber + 1
        }

      }

      const orderNumber =
        `N2N-${String(nextNumber).padStart(6, '0')}`

      order.orderNumber =
        orderNumber

      // =========================
      // VALIDATION
      // =========================

      if (
        !order.name ||
        !order.phone ||
        !order.address ||
        !order.city ||
        !order.items ||
        !Array.isArray(order.items)
      ) {

        connection.release()

        return res.status(400).json({
          success: false,
          message:
            'Required order information missing'
        })

      }

      // =========================
      // START TRANSACTION
      // =========================

      await connection.beginTransaction()

      // =========================
      // CHECK STOCK
      // =========================

      for (
        const item of order.items
      ) {

        const productCode =
          item.id

        const quantity =
          Number(item.quantity)

        if (
          !productCode ||
          quantity <= 0
        ) {

          throw new Error(
            'Invalid product or quantity'
          )

        }

        const [productRows] =
          await connection.execute(
            `
            SELECT
              id,
              name,
              stock
            FROM products
            WHERE product_code = ?
            FOR UPDATE
            `,
            [productCode]
          )

        const products =
          productRows as any[]

        if (products.length === 0) {

          throw new Error(
            `Product not found: ${productCode}`
          )

        }

        const product =
          products[0]

        if (
          Number(product.stock) <
          quantity
        ) {

          throw new Error(
            `${product.name} has only ${product.stock} item(s) available.`
          )

        }

      }

      // =========================
      // SAVE ORDER
      // =========================

      const sql = `
        INSERT INTO orders
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
          locked
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      await connection.execute(
        sql,
        [
          order.orderNumber,
          order.name,
          order.phone,
          order.address,
          order.city,
          order.paymentMethod,
          JSON.stringify(
            order.items
          ),
          order.total,
          'Pending',
          false
        ]
      )

      // =========================
      // REDUCE STOCK
      // =========================

      for (
        const item of order.items
      ) {

        await connection.execute(
          `
          UPDATE products
          SET stock = stock - ?
          WHERE product_code = ?
          `,
          [
            Number(item.quantity),
            item.id
          ]
        )

      }

      // =========================
      // COMPLETE TRANSACTION
      // =========================

      await connection.commit()

      connection.release()

      console.log(
        'New Order Received:',
        order.orderNumber
      )

      console.log(
        'Product stock updated successfully.'
      )

      // ==================================================
      // CUSTOMER WHATSAPP MESSAGE
      // ==================================================

      const pendingMessage =
        `🛒 New Order Received\n\n` +
        `Hello ${order.name},\n\n` +
        `Your order #${order.orderNumber} has been received successfully and is currently Pending.\n\n` +
        `Total Amount: Rs. ${order.total}\n\n` +
        `We will update you when your order is being processed.\n\n` +
        `Thank you for shopping with us!`

      console.log(
        `Preparing WhatsApp CUSTOMER message for ${order.phone}...`
      )

      sendWhatsAppMessage(
        order.phone,
        pendingMessage
      )
        .then(
          (whatsappSent) => {

            if (whatsappSent) {

              console.log(
                `WhatsApp CUSTOMER message sent for ${order.orderNumber} ✅`
              )

            } else {

              console.log(
                `WhatsApp CUSTOMER message failed for ${order.orderNumber} ❌`
              )

            }

          }
        )
        .catch(
          (error) => {

            console.error(
              `Customer WhatsApp error for ${order.orderNumber}:`,
              error
            )

          }
        )

      // ==================================================
      // ADMIN WHATSAPP NOTIFICATION
      // ==================================================

      const adminWhatsAppNumber =
        '923206453229'

      console.log(
        `Preparing WhatsApp ADMIN message for ${adminWhatsAppNumber}...`
      )

      const orderItems =
        order.items
          .map(
            (item: any) => {

              const itemName =
                item.name ||
                item.id ||
                'Product'

              return (
                `• ${itemName} × ${item.quantity}`
              )

            }
          )
          .join('\n')

      const adminMessage =
        `🔔 NEW ORDER RECEIVED\n\n` +
        `📦 Order Number: #${order.orderNumber}\n\n` +
        `👤 Customer: ${order.name}\n` +
        `📞 Phone: ${order.phone}\n` +
        `📍 Address: ${order.address}\n` +
        `🏙️ City: ${order.city}\n\n` +
        `🛍️ Items:\n${orderItems}\n\n` +
        `💰 Total: Rs. ${order.total}\n` +
        `💳 Payment: ${order.paymentMethod || 'Cash on Delivery'}\n` +
        `📌 Status: Pending\n\n` +
        `Please check the Admin Orders panel.`

      console.log(
        'Sending ADMIN WhatsApp notification...'
      )

      sendWhatsAppMessage(
        adminWhatsAppNumber,
        adminMessage
      )
        .then(
          (adminWhatsAppSent) => {

            if (adminWhatsAppSent) {

              console.log(
                `WhatsApp ADMIN notification sent for ${order.orderNumber} ✅`
              )

            } else {

              console.log(
                `WhatsApp ADMIN notification failed for ${order.orderNumber} ❌`
              )

            }

          }
        )
        .catch(
          (error) => {

            console.error(
              `ADMIN WhatsApp error for ${order.orderNumber}:`,
              error
            )

          }
        )

      // =========================
      // IMMEDIATE RESPONSE
      // =========================

      return res.status(201).json({

        success: true,

        message:
          'Order placed successfully!',

        orderNumber:
          order.orderNumber

      })

    } catch (error) {

      try {

        await connection.rollback()

      } catch {

        // Ignore rollback error

      }

      connection.release()

      console.error(
        'Order creation error:',
        error
      )

      return res.status(400).json({

        success: false,

        message:
          error instanceof Error
            ? error.message
            : 'Failed to place order'

      })

    }

  }
)

// =========================
// GET ALL PRODUCTS
// =========================

app.get(
  '/api/products',
  async (_req, res) => {

    try {

      const [rows] =
        await db.query(
          'SELECT * FROM products ORDER BY id ASC'
        )

      res.json(rows)

    } catch (error) {

      console.error(
        'Products fetch error:',
        error
      )

      res.status(500).json({
        message:
          'Products fetch failed'
      })

    }

  }
)

// =========================
// ADD NEW PRODUCT
// =========================

app.post(
  '/api/products',
  async (req, res) => {

    try {

      const {
        name,
        price,
        category,
        image,
        imageName,
        stock,
        product_code,
        unit
      } = req.body

      // =========================
      // VALIDATION
      // =========================

      if (
        !name ||
        price === undefined ||
        !category ||
        !product_code
      ) {

        return res.status(400).json({
          message:
            'Required product fields missing'
        })

      }

      // =========================
      // SAVE IMAGE
      // =========================

      let savedImage = ''

      if (
        image &&
        String(image).startsWith(
          'data:image/'
        )
      ) {

        savedImage =
          saveProductImage(
            String(image),
            String(imageName || 'product')
          )

      } else {

        savedImage =
          image || ''

      }

      console.log(
        'Product image path:',
        savedImage
      )

      // =========================
      // INSERT PRODUCT
      // =========================

      const [result] =
        await db.query(
          `
          INSERT INTO products
          (
            name,
            price,
            category,
            image,
            stock,
            product_code,
            unit
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            name,
            Number(price),
            category,
            savedImage,
            Number(stock || 0),
            product_code,
            unit || ''
          ]
        )

      // =========================
      // SUCCESS RESPONSE
      // =========================

      return res.status(201).json({

        message:
          'Product added successfully',

        product: {

          id:
            (result as any).insertId,

          name,

          price:
            Number(price),

          category,

          image:
            savedImage,

          stock:
            Number(stock || 0),

          product_code,

          unit:
            unit || ''

        }

      })

    } catch (error) {

      console.error(
        'Product add error:',
        error
      )

      return res.status(500).json({

        message:
          error instanceof Error
            ? error.message
            : 'Product add failed'

      })

    }

  }
)

// =========================
// UPDATE PRODUCT
// =========================

app.put(
  '/api/products/:id',
  async (req, res) => {

    try {

      const { id } =
        req.params

      const {
        name,
        price,
        category,
        image,
        imageName,
        stock,
        unit
      } = req.body

      if (
        !name ||
        price === undefined ||
        !category
      ) {

        return res.status(400).json({
          message:
            'Required product fields missing'
        })

      }

      // =========================
      // GET CURRENT PRODUCT
      // =========================

      const [existingRows] =
        await db.query(
          `
          SELECT image
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [id]
        )

      const existingProducts =
        existingRows as any[]

      if (
        existingProducts.length === 0
      ) {

        return res.status(404).json({
          message:
            'Product not found'
        })

      }

      const oldImage =
        existingProducts[0].image || ''

      // =========================
      // IMAGE DECISION
      // =========================

      let savedImage =
        oldImage

      if (
        image &&
        String(image).startsWith(
          'data:image/'
        )
      ) {

        savedImage =
          saveProductImage(
            String(image),
            String(imageName || 'product')
          )

      }

      // =========================
      // UPDATE PRODUCT
      // =========================

      await db.query(
        `
        UPDATE products
        SET
          name = ?,
          price = ?,
          category = ?,
          image = ?,
          stock = ?,
          unit = ?
        WHERE id = ?
        `,
        [
          name,
          Number(price),
          category,
          savedImage,
          Number(stock || 0),
          unit || '',
          id
        ]
      )

      return res.json({

        message:
          'Product updated successfully',

        image:
          savedImage

      })

    } catch (error) {

      console.error(
        'Product update error:',
        error
      )

      return res.status(500).json({

        message:
          error instanceof Error
            ? error.message
            : 'Product update failed'

      })

    }

  }
)

// =========================
// DELETE PRODUCT
// =========================

app.delete(
  '/api/products/:id',
  async (req, res) => {

    try {

      const { id } =
        req.params

      await db.query(
        'DELETE FROM products WHERE id = ?',
        [id]
      )

      res.json({

        message:
          'Product deleted successfully'

      })

    } catch (error) {

      console.error(
        'Product delete error:',
        error
      )

      res.status(500).json({

        message:
          'Product delete failed'

      })

    }

  }
)

// =========================
// GET ALL ORDERS
// =========================

app.get(
  '/api/orders',
  async (_req, res) => {

    try {

      const [rows] =
        await db.execute(`
          SELECT
            order_number AS orderNumber,
            UNIX_TIMESTAMP(created_at) * 1000 AS createdAt,
            UNIX_TIMESTAMP(last_updated) * 1000 AS lastUpdated,
            name,
            phone,
            address,
            city,
            payment_method AS paymentMethod,
            items,
            total,
            status,
            locked
          FROM orders
          ORDER BY created_at DESC
        `)

      const orders =
        (rows as any[])
          .map(
            order => ({

              ...order,

              items:
                typeof order.items === 'string'
                  ? JSON.parse(order.items)
                  : order.items

            })
          )

      res.json(orders)

    } catch (error) {

      console.error(
        'Error fetching orders:',
        error
      )

      res.status(500).json({

        success: false,

        message:
          'Failed to fetch orders'

      })

    }

  }
)

// =========================
// GET SINGLE ORDER
// =========================

app.get(
  '/api/orders/:orderNumber',
  async (req, res) => {

    try {

      const orderNumber =
        req.params.orderNumber.trim()

      const [rows] =
        await db.execute(
          `
          SELECT
            order_number AS orderNumber,
            UNIX_TIMESTAMP(created_at) * 1000 AS createdAt,
            UNIX_TIMESTAMP(last_updated) * 1000 AS lastUpdated,
            name,
            phone,
            address,
            city,
            payment_method AS paymentMethod,
            items,
            total,
            status,
            locked
          FROM orders
          WHERE LOWER(order_number) = LOWER(?)
          LIMIT 1
          `,
          [orderNumber]
        )

      const result =
        rows as any[]

      if (
        result.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Order not found'

        })

      }

      const order = {

        ...result[0],

        items:
          typeof result[0].items === 'string'
            ? JSON.parse(
                result[0].items
              )
            : result[0].items

      }

      res.json({

        success: true,

        order

      })

    } catch (error) {

      console.error(
        'Error fetching order:',
        error
      )

      res.status(500).json({

        success: false,

        message:
          'Failed to fetch order'

      })

    }

  }
)

// =========================
// UPDATE ORDER / LOCK / UNLOCK
// =========================

app.patch(
  '/api/orders/:orderNumber',
  async (req, res) => {

    try {

      const orderNumber =
        req.params.orderNumber

      const status =
        req.body.status

      const locked =
        req.body.locked

      // =========================
      // GET CURRENT ORDER
      // =========================

      const [rows] =
        await db.execute(
          `
          SELECT *
          FROM orders
          WHERE order_number = ?
          LIMIT 1
          `,
          [orderNumber]
        )

      const result =
        rows as any[]

      if (
        result.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            'Order not found'

        })

      }

      const currentOrder =
        result[0]

      // =========================
      // UNLOCK
      // =========================

      if (
        locked === false
      ) {

        await db.execute(
          `
          UPDATE orders
          SET locked = FALSE
          WHERE order_number = ?
          `,
          [orderNumber]
        )

        console.log(
          `Order ${orderNumber} unlocked`
        )

        return res.json({

          success: true,

          message:
            'Order unlocked successfully'

        })

      }

      // =========================
      // BLOCK LOCKED ORDER
      // =========================

      if (
        currentOrder.locked === 1 ||
        currentOrder.locked === true
      ) {

        return res.status(403).json({

          success: false,

          message:
            'This order is locked and cannot be changed.'

        })

      }

      // =========================
      // CHECK STATUS CHANGE
      // =========================

      const statusChanged =
        status !== undefined &&
        status !== currentOrder.status

      // =========================
      // UPDATE STATUS / LOCK
      // =========================

      if (
        status !== undefined &&
        locked !== undefined
      ) {

        await db.execute(
          `
          UPDATE orders
          SET status = ?, locked = ?
          WHERE order_number = ?
          `,
          [
            status,
            locked,
            orderNumber
          ]
        )

      } else if (
        status !== undefined
      ) {

        await db.execute(
          `
          UPDATE orders
          SET status = ?
          WHERE order_number = ?
          `,
          [
            status,
            orderNumber
          ]
        )

      } else if (
        locked !== undefined
      ) {

        await db.execute(
          `
          UPDATE orders
          SET locked = ?
          WHERE order_number = ?
          `,
          [
            locked,
            orderNumber
          ]
        )

      }

      // =========================
      // WHATSAPP STATUS MESSAGE
      // =========================

      if (
        statusChanged
      ) {

        console.log(
          'STATUS CHANGED - WhatsApp function starting...',
          {
            orderNumber,
            status,
            phone:
              currentOrder.phone
          }
        )

        let message = ''

        if (
          status === 'Pending'
        ) {

          message =
            `🛒 Order Update\n\n` +
            `Hello ${currentOrder.name},\n\n` +
            `Your order #${orderNumber} has been received and is currently Pending.\n\n` +
            `We will update you when your order is being processed.\n\n` +
            `Thank you for shopping with us!`

        } else if (
          status === 'Processing'
        ) {

          message =
            `✅ Order Update\n\n` +
            `Hello ${currentOrder.name},\n\n` +
            `Your order #${orderNumber} is now being Processed.\n\n` +
            `We are preparing your order for delivery.\n\n` +
            `Thank you for shopping with us!`

        } else if (
          status === 'Shipped'
        ) {

          message =
            `🚚 Order Update\n\n` +
            `Hello ${currentOrder.name},\n\n` +
            `Your order #${orderNumber} has been Shipped.\n\n` +
            `Your order is now on its way.\n\n` +
            `Thank you for shopping with us!`

        } else if (
          status === 'Out for Delivery'
        ) {

          message =
            `🛵 Order Update\n\n` +
            `Hello ${currentOrder.name},\n\n` +
            `Your order #${orderNumber} is Out for Delivery.\n\n` +
            `Please keep your phone available for the delivery rider.\n\n` +
            `Thank you for shopping with us!`

        } else if (
          status === 'Delivered'
        ) {

          message =
            `🎉 Order Delivered\n\n` +
            `Hello ${currentOrder.name},\n\n` +
            `Your order #${orderNumber} has been Delivered successfully.\n\n` +
            `Thank you for shopping with us! ❤️`

        } else if (
          status === 'Cancelled'
        ) {

          message =
            `❌ Order Update\n\n` +
            `Hello ${currentOrder.name},\n\n` +
            `Your order #${orderNumber} has been Cancelled.\n\n` +
            `If you have any questions, please contact us.\n\n` +
            `Thank you.`

        }

        // =========================
        // SEND CUSTOMER STATUS MESSAGE
        // =========================

        if (
          message
        ) {

          console.log(
            `Preparing WhatsApp status message for ${currentOrder.phone}...`
          )

          sendWhatsAppMessage(
            currentOrder.phone,
            message
          )
            .then(
              (whatsappSent) => {

                if (
                  whatsappSent
                ) {

                  console.log(
                    `WhatsApp status message sent for ${orderNumber} ✅`
                  )

                } else {

                  console.log(
                    `WhatsApp status message failed for ${orderNumber} ❌`
                  )

                }

              }
            )
            .catch(
              (error) => {

                console.error(
                  `WhatsApp status error for ${orderNumber}:`,
                  error
                )

              }
            )

        }

      }

      // =========================
      // GET UPDATED ORDER
      // =========================

      const [updatedRows] =
        await db.execute(
          `
          SELECT
            order_number AS orderNumber,
            UNIX_TIMESTAMP(created_at) * 1000 AS createdAt,
            UNIX_TIMESTAMP(last_updated) * 1000 AS lastUpdated,
            name,
            phone,
            address,
            city,
            payment_method AS paymentMethod,
            items,
            total,
            status,
            locked
          FROM orders
          WHERE order_number = ?
          LIMIT 1
          `,
          [orderNumber]
        )

      const updatedResult =
        updatedRows as any[]

      const updatedOrder = {

        ...updatedResult[0],

        items:
          typeof updatedResult[0].items === 'string'
            ? JSON.parse(
                updatedResult[0].items
              )
            : updatedResult[0].items

      }

      console.log(
        `Order ${orderNumber} updated:`,
        updatedOrder
      )

      res.json({

        success: true,

        message:
          'Order updated successfully',

        order:
          updatedOrder

      })

    } catch (error) {

      console.error(
        'Error updating order:',
        error
      )

      res.status(500).json({

        success: false,

        message:
          'Failed to update order'

      })

    }

  }
)

// =========================
// START SERVER
// =========================

const PORT =
  Number(
    process.env.PORT || 5000
  )

app.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      `Backend running on port ${PORT}`
    )

  }
)