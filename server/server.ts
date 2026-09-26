import 'dotenv/config'
import crypto from 'crypto'
import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'

// ==================================================
// WHATSAPP
// ==================================================

let sendWhatsAppMessage: (
  phone: string,
  message: string
) => Promise<boolean>

const whatsapp = await import('./whatsapp')

sendWhatsAppMessage =
  whatsapp.sendWhatsAppMessage

// ==================================================
// EXPRESS
// ==================================================

const app = express()

app.use(cors())

app.use(
  express.json({
    limit: '15mb'
  })
)

// ==================================================
// PRODUCT IMAGE FOLDER
// ==================================================

const productImagesDir = path.join(
  process.cwd(),
  'public',
  'product-images'
)

fs.mkdirSync(
  productImagesDir,
  {
    recursive: true
  }
)

// ==================================================
// SERVE PRODUCT IMAGES
// ==================================================

app.use(
  '/product-images',
  express.static(productImagesDir)
)

// ==================================================
// SERVE VITE FRONTEND
// ==================================================

const distDir = path.join(
  process.cwd(),
  'dist'
)

app.use(
  express.static(distDir)
)

// ==================================================
// SAVE PRODUCT IMAGE
// ==================================================

function saveProductImage(
  imageData: string,
  imageName: string
): string {

  const match =
    imageData.match(
      /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/
    )

  if (!match) {
    throw new Error(
      'Invalid image format'
    )
  }

  const imageType =
    match[1].toLowerCase()

  const base64Data =
    match[2]

  let extension =
    imageType

  if (
    imageType === 'jpeg' ||
    imageType === 'jpg'
  ) {
    extension = 'jpg'
  }

  const originalName =
    path.basename(
      imageName || 'product'
    )

  const nameWithoutExtension =
    originalName
      .replace(/\.[^/.]+$/, '')
      .replace(
        /[^a-zA-Z0-9_-]/g,
        '-'
      )

  const fileName =
    `${Date.now()}-${nameWithoutExtension}.${extension}`

  const filePath =
    path.join(
      productImagesDir,
      fileName
    )

  fs.writeFileSync(
    filePath,
    Buffer.from(
      base64Data,
      'base64'
    )
  )

  console.log(
    `Product image saved: ${fileName}`
  )

  return `/product-images/${fileName}`
}

// ==================================================
// MYSQL CONNECTION
// ==================================================

const db =
  mysql.createPool({

    host:
      process.env.DB_HOST,

    user:
      process.env.DB_USER,

    password:
      process.env.DB_PASSWORD,

    database:
      process.env.DB_NAME,

    port:
      Number(
        process.env.DB_PORT || 3306
      ),

    ssl: {
      rejectUnauthorized: false
    },

    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0
  })

// ==================================================
// TEST DATABASE CONNECTION
// ==================================================

async function testDatabase() {

  try {

    const connection =
      await db.getConnection()

    console.log(
      'MySQL Database Connected Successfully!'
    )

    // ==================================================
    // ADMIN LICENSE TABLE
    // ==================================================

    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_license (
        id INT AUTO_INCREMENT PRIMARY KEY,
        license_key VARCHAR(100) NOT NULL,
        start_date DATETIME NOT NULL,
        expiry_date DATETIME NOT NULL,
        active BOOLEAN DEFAULT TRUE
      )
    `)

    console.log(
      'Admin license table ready!'
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
// ADMIN SESSION STORAGE
// ==================================================

const adminSessions =
  new Set<string>()

// ==================================================
// ADMIN SESSION VERIFICATION
// ==================================================

function requireAdminSession(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {

  const authorization =
    req.headers.authorization

  if (
    !authorization ||
    !authorization.startsWith(
      'Bearer '
    )
  ) {

    return res.status(401).json({

      success: false,

      message:
        'Admin session required'

    })

  }

  const token =
    authorization.substring(
      7
    ).trim()

  if (
    !token ||
    !adminSessions.has(token)
  ) {

    return res.status(401).json({

      success: false,

      message:
        'Invalid or expired admin session'

    })

  }

  next()
}

// ==================================================
// CREATE NEW ORDER + UPDATE STOCK
// CUSTOMER PUBLIC ROUTE
// ==================================================

app.post(
  '/api/orders',
  async (req, res) => {

    const connection =
      await db.getConnection()

    try {

      const order =
        req.body

      // ==================================================
      // GENERATE ORDER NUMBER
      // ==================================================

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

      if (
        lastOrders.length > 0
      ) {

        const lastOrderNumber =
          String(
            lastOrders[0]
              .order_number
          )

        const lastNumber =
          parseInt(
            lastOrderNumber.replace(
              'N2N-',
              ''
            ),
            10
          )

        if (
          !isNaN(lastNumber)
        ) {

          nextNumber =
            lastNumber + 1
        }
      }

      const orderNumber =
        `N2N-${String(
          nextNumber
        ).padStart(6, '0')}`

      order.orderNumber =
        orderNumber

      // ==================================================
      // VALIDATION
      // ==================================================

      if (
        !order.name ||
        !order.phone ||
        !order.address ||
        !order.city ||
        !order.items ||
        !Array.isArray(
          order.items
        )
      ) {

        connection.release()

        return res.status(400).json({
          success: false,
          message:
            'Required order information missing'
        })
      }

      // ==================================================
      // START TRANSACTION
      // ==================================================

      await connection.beginTransaction()

      // ==================================================
      // CHECK STOCK
      // ==================================================

      for (
        const item of order.items
      ) {

        const productCode =
          item.id

        const quantity =
          Number(
            item.quantity
          )

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

        if (
          products.length === 0
        ) {

          throw new Error(
            `Product not found: ${productCode}`
          )
        }

        const product =
          products[0]

        if (
          Number(
            product.stock
          ) < quantity
        ) {

          throw new Error(
            `${product.name} has only ${product.stock} item(s) available.`
          )
        }
      }

      // ==================================================
      // SAVE ORDER
      // ==================================================

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

      // ==================================================
      // REDUCE STOCK
      // ==================================================

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
            Number(
              item.quantity
            ),
            item.id
          ]
        )
      }

      // ==================================================
      // COMPLETE TRANSACTION
      // ==================================================

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

            if (
              whatsappSent
            ) {

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
      // ADMIN WHATSAPP
      // ==================================================

      const adminWhatsAppNumber =
        '923206453229'

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

            if (
              adminWhatsAppSent
            ) {

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

      // ==================================================
      // IMMEDIATE RESPONSE
      // ==================================================

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

// ==================================================
// ACTIVATE ADMIN LICENSE
// PUBLIC LICENSE ROUTE
// ==================================================

app.post(
  '/api/admin/activate-license',
  async (req, res) => {

    try {

      const {
        licenseKey
      } = req.body

      if (
        licenseKey !==
        'N2N-2026-ADMIN-1YEAR'
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Invalid license key'
        })
      }

      const now = new Date()

      // Check existing active license
      const [existingRows] =
        await db.query(`
          SELECT expiry_date
          FROM admin_license
          WHERE active = TRUE
          ORDER BY id DESC
          LIMIT 1
        `)

      const existingLicenses =
        existingRows as any[]

      let startDate = now

      // Agar current license abhi active hai,
      // renewal current expiry ke baad start hogi.
      if (
        existingLicenses.length > 0
      ) {

        const currentExpiry =
          new Date(
            existingLicenses[0].expiry_date
          )

        if (
          currentExpiry > now
        ) {

          startDate =
            currentExpiry
        }
      }

      const expiryDate =
        new Date(
          startDate
        )

      expiryDate.setFullYear(
        expiryDate.getFullYear() + 1
      )

      // Deactivate old licenses
      await db.query(`
        UPDATE admin_license
        SET active = FALSE
        WHERE active = TRUE
      `)

      // Add new license
      await db.query(
        `
        INSERT INTO admin_license
        (
          license_key,
          start_date,
          expiry_date,
          active
        )
        VALUES (?, ?, ?, TRUE)
        `,
        [
          licenseKey,
          startDate,
          expiryDate
        ]
      )

      return res.json({

        success: true,

        message:
          'License activated successfully',

        expiryDate
      })

    } catch (error) {

      console.error(
        'License activation error:',
        error
      )

      return res.status(500).json({

        success: false,

        message:
          'License activation failed'
      })
    }
  }
)

// ==================================================
// GET ADMIN LICENSE STATUS
// PUBLIC LICENSE STATUS ROUTE
// ==================================================

app.get(
  '/api/admin/license-status',
  async (_req, res) => {

    try {

      const [licenseRows] =
        await db.query(`
          SELECT
            id,
            license_key,
            start_date,
            expiry_date,
            active
          FROM admin_license
          ORDER BY id DESC
          LIMIT 1
        `)

      const licenses =
        licenseRows as any[]

      // No license found
      if (
        licenses.length === 0
      ) {

        return res.json({
          success: false,
          active: false,
          message:
            'Admin license is not activated'
        })

      }

      const license =
        licenses[0]

      const now =
        new Date()

      const expiryDate =
        new Date(
          license.expiry_date
        )

      // Calculate remaining time
      const difference =
        expiryDate.getTime() -
        now.getTime()

      const remainingDays =
        Math.max(
          0,
          Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
          )
        )

      // License expired
      if (
        difference <= 0
      ) {

        await db.query(
          `
          UPDATE admin_license
          SET active = FALSE
          WHERE id = ?
          `,
          [license.id]
        )

        return res.json({

          success: true,

          active: false,

          expired: true,

          remainingDays: 0,

          expiryDate:
            license.expiry_date,

          message:
            'Admin license has expired'

        })

      }

      // License active
      return res.json({

        success: true,

        active:
          license.active === 1 ||
          license.active === true,

        expired: false,

        remainingDays,

        startDate:
          license.start_date,

        expiryDate:
          license.expiry_date

      })

    } catch (error) {

      console.error(
        'License status error:',
        error
      )

      return res.status(500).json({

        success: false,

        message:
          'Could not check license status'

      })

    }

  }
)

// ==================================================
// ADMIN LOGIN
// PUBLIC LOGIN ROUTE
// ==================================================

app.post(
  '/api/admin/login',
  async (req, res) => {

    try {

      const {
        username,
        password
      } = req.body

      // ==================================================
      // CHECK USERNAME + PASSWORD
      // ==================================================

      if (
        username !== 'admin' ||
        password !== 'N2N@Admin123'
      ) {

        return res.status(401).json({

          success: false,

          message:
            'Invalid username or password'
        })
      }

      // ==================================================
      // GET ACTIVE LICENSE
      // ==================================================

      const [licenseRows] =
        await db.query(`
          SELECT
            id,
            license_key,
            start_date,
            expiry_date,
            active
          FROM admin_license
          WHERE active = TRUE
          ORDER BY id DESC
          LIMIT 1
        `)

      const licenses =
        licenseRows as any[]

      // ==================================================
      // NO LICENSE
      // ==================================================

      if (
        licenses.length === 0
      ) {

        return res.status(403).json({

          success: false,

          message:
            'Admin license is not activated'
        })
      }

      const license =
        licenses[0]

      // ==================================================
      // CHECK EXPIRY
      // ==================================================

      const now =
        new Date()

      const expiryDate =
        new Date(
          license.expiry_date
        )

      if (
        now >= expiryDate
      ) {

        // Automatically deactivate expired license
        await db.query(
          `
          UPDATE admin_license
          SET active = FALSE
          WHERE id = ?
          `,
          [license.id]
        )

        return res.status(403).json({

          success: false,

          message:
            'Admin license has expired'
        })
      }

      // ==================================================
      // CREATE SECURE SESSION TOKEN
      // ==================================================

      const sessionToken =
        crypto
          .randomBytes(32)
          .toString('hex')

      adminSessions.add(
        sessionToken
      )

      // ==================================================
      // LOGIN SUCCESS
      // ==================================================

      return res.json({

        success: true,

        message:
          'Admin login successful',

        expiryDate:
          license.expiry_date,

        sessionToken
      })

    } catch (error) {

      console.error(
        'Admin login error:',
        error
      )

      return res.status(500).json({

        success: false,

        message:
          'Admin login failed'
      })
    }
  }
)

// ==================================================
// GET PRODUCTS
// CUSTOMER + ADMIN PUBLIC READ ROUTE
// ==================================================

app.get(
  '/api/products',
  async (_req, res) => {

    try {

      const [rows] =
        await db.query(
          `
          SELECT *
          FROM products
          ORDER BY id ASC
          `
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

// ==================================================
// ADD PRODUCT
// ADMIN ONLY
// ==================================================

app.post(
  '/api/products',
  requireAdminSession,
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
            String(
              imageName ||
              'product'
            )
          )

      } else {

        savedImage =
          image || ''
      }

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

// ==================================================
// UPDATE PRODUCT
// ADMIN ONLY
// ==================================================

app.put(
  '/api/products/:id',
  requireAdminSession,
  async (req, res) => {

    try {

      const {
        id
      } = req.params

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
        existingProducts[0].image ||
        ''

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
            String(
              imageName ||
              'product'
            )
          )
      }

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

// ==================================================
// DELETE PRODUCT
// ADMIN ONLY
// ==================================================

app.delete(
  '/api/products/:id',
  requireAdminSession,
  async (req, res) => {

    try {

      const {
        id
      } = req.params

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

// ==================================================
// GET ALL ORDERS
// ADMIN ONLY
// ==================================================

app.get(
  '/api/orders',
  requireAdminSession,
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
        (rows as any[]).map(
          (order) => {

            let parsedItems: any[] =
              []

            try {

              if (
                typeof order.items ===
                'string'
              ) {

                parsedItems =
                  JSON.parse(
                    order.items
                  )

              } else if (
                Array.isArray(
                  order.items
                )
              ) {

                parsedItems =
                  order.items

              } else if (
                order.items
              ) {

                parsedItems =
                  JSON.parse(
                    String(
                      order.items
                    )
                  )
              }

            } catch (parseError) {

              console.error(
                `Order items JSON error for ${order.orderNumber}:`,
                parseError
              )

              parsedItems = []
            }

            return {

              orderNumber:
                order.orderNumber,

              createdAt:
                order.createdAt,

              lastUpdated:
                order.lastUpdated,

              name:
                order.name,

              phone:
                order.phone,

              address:
                order.address,

              city:
                order.city,

              paymentMethod:
                order.paymentMethod,

              items:
                parsedItems,

              total:
                Number(
                  order.total || 0
                ),

              status:
                order.status ||
                'Pending',

              locked:
                order.locked === 1 ||
                order.locked === true
            }
          }
        )

      console.log(
        `Orders fetched successfully: ${orders.length}`
      )

      return res.json(orders)

    } catch (error) {

      console.error(
        'Error fetching orders:',
        error
      )

      return res.status(500).json({

        success: false,

        message:
          'Failed to fetch orders'
      })
    }
  }
)

// ==================================================
// GET SINGLE ORDER
// CUSTOMER TRACKING + ADMIN DETAIL
// PUBLIC ROUTE
// ==================================================

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
          typeof result[0].items ===
          'string'
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

// ==================================================
// UPDATE ORDER / LOCK / UNLOCK
// ADMIN ONLY
// ==================================================

app.patch(
  '/api/orders/:orderNumber',
  requireAdminSession,
  async (req, res) => {

    try {

      const orderNumber =
        req.params.orderNumber

      const status =
        req.body.status

      const locked =
        req.body.locked

      // ==================================================
      // GET CURRENT ORDER
      // ==================================================

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

      // ==================================================
      // UNLOCK
      // ==================================================

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

      // ==================================================
      // BLOCK LOCKED ORDER
      // ==================================================

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

      // ==================================================
      // CHECK STATUS CHANGE
      // ==================================================

      const statusChanged =
        status !== undefined &&
        status !== currentOrder.status

      // ==================================================
      // UPDATE STATUS / LOCK
      // ==================================================

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

      // ==================================================
      // WHATSAPP STATUS MESSAGE
      // ==================================================

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

        // ==================================================
        // SEND CUSTOMER STATUS MESSAGE
        // ==================================================

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

      // ==================================================
      // GET UPDATED ORDER
      // ==================================================

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
          typeof updatedResult[0].items ===
          'string'
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

// ==================================================
// START SERVER
// ==================================================

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

// ==================================================
// WHATSAPP QR PAGE
// ==================================================

app.get(
  '/whatsapp-qr',
  async (_req, res) => {

    console.log(
      'WhatsApp QR page opened.'
    )

    // WhatsApp manually start karein
    whatsapp.startWhatsApp()

    // QR generate hone ka wait
    for (
      let i = 0;
      i < 20;
      i++
    ) {

      const qr =
        whatsapp.getWhatsAppQR()

      if (qr) {

        return res.send(`
          <!DOCTYPE html>

          <html>

          <head>

            <title>
              N2N WhatsApp QR
            </title>

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            >

            <style>

              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 30px;
                background: #f5f5f5;
              }

              .box {
                background: white;
                max-width: 500px;
                margin: auto;
                padding: 30px;
                border-radius: 15px;
                box-shadow:
                  0 2px 10px
                  rgba(0,0,0,0.1);
              }

              img {
                width: 350px;
                max-width: 90%;
                margin: 20px 0;
              }

              h1 {
                margin-bottom: 10px;
              }

              p {
                color: #555;
              }

            </style>

          </head>

          <body>

            <div class="box">

              <h1>
                N2N Grocery Store
              </h1>

              <p>
                WhatsApp QR Code
              </p>

              <img
                src="${qr}"
                alt="WhatsApp QR Code"
              >

              <p>
                WhatsApp →
                Linked Devices →
                Link a Device
              </p>

            </div>

          </body>

          </html>
        `)
      }

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1000
          )
      )
    }

    return res.status(202).send(`
      <!DOCTYPE html>

      <html>

      <head>

        <title>
          N2N WhatsApp
        </title>

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

      </head>

      <body
        style="
          font-family: Arial;
          text-align: center;
          padding: 40px;
        "
      >

        <h2>
          WhatsApp is starting...
        </h2>

        <p>
          Please refresh this page in a few seconds.
        </p>

      </body>

      </html>
    `)
  }
)