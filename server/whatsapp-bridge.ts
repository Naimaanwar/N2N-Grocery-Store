import express from 'express'
import cors from 'cors'

const whatsapp = await import('./whatsapp')

const app = express()

app.use(cors())

app.use(
  express.json({
    limit: '1mb'
  })
)

const BRIDGE_PORT = 5050

// ==================================================
// HEALTH CHECK
// ==================================================

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'N2N WhatsApp Bridge is Running!'
  })
})

// ==================================================
// WHATSAPP STATUS
// ==================================================

app.get('/status', (_req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Bridge is running.'
  })
})

// ==================================================
// SEND WHATSAPP MESSAGE
// ==================================================

app.post('/send', async (req, res) => {

  try {

    const { phone, message } = req.body

    if (!phone || !message) {

      return res.status(400).json({
        success: false,
        message: 'Phone and message are required.'
      })

    }

    console.log(
      `Bridge: Sending WhatsApp message to ${phone}...`
    )

    const result =
      await whatsapp.sendWhatsAppMessage(
        String(phone),
        String(message)
      )

    if (!result) {

      return res.status(500).json({
        success: false,
        message: 'WhatsApp message was not sent.'
      })

    }

    console.log(
      `Bridge: WhatsApp message sent to ${phone} ✅`
    )

    return res.json({
      success: true,
      message: 'WhatsApp message sent successfully.'
    })

  } catch (error) {

    console.error(
      'Bridge WhatsApp error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'WhatsApp bridge error.'
    })

  }

})

// ==================================================
// START BRIDGE
// ==================================================

app.listen(BRIDGE_PORT, () => {

  console.log('')
  console.log('======================================')
  console.log('N2N WhatsApp Bridge')
  console.log('======================================')
  console.log(
    `Bridge running on http://localhost:${BRIDGE_PORT}`
  )
  console.log('======================================')
  console.log('')

})