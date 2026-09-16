import pkg from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'

const { Client, LocalAuth } = pkg

let isReady = false
let isInitializing = false
let reconnecting = false

const authPath = path.resolve('./server/.wwebjs_auth')
const sessionPath = path.join(authPath, 'session')

/*
 * Remove stale Chromium lock files.
 */
function removeStaleChromeLocks() {

  const lockFiles = [
    'SingletonLock',
    'SingletonCookie',
    'SingletonSocket'
  ]

  for (const file of lockFiles) {

    const filePath = path.join(
      sessionPath,
      file
    )

    try {

      if (fs.existsSync(filePath)) {

        fs.unlinkSync(filePath)

        console.log(
          `Removed old WhatsApp browser lock: ${file}`
        )
      }

    } catch (error) {

      console.log(
        `Could not remove ${file}:`,
        error
      )
    }
  }
}

const client = new Client({

  authStrategy: new LocalAuth({
    dataPath: authPath
  }),

  puppeteer: {

    headless: true,

    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',

      '--disable-features=Translate,BackForwardCache,UseDnsHttpsSvcb,UseDnsHttpsSvcbAlpn',

      '--host-resolver-rules=MAP web.whatsapp.com 57.144.149.32'
    ]
  }
})

/*
 * QR
 */
client.on('qr', (qr) => {

  console.log(
    '\nScan this QR code with your WhatsApp:\n'
  )

  qrcode.generate(
    qr,
    { small: true }
  )
})

/*
 * Authentication
 */
client.on('authenticated', () => {

  console.log(
    'WhatsApp authenticated ✅'
  )
})

client.on('auth_failure', (message) => {

  isReady = false

  console.log(
    'WhatsApp authentication failed:',
    message
  )
})

/*
 * Ready
 */
client.on('ready', () => {

  isReady = true
  isInitializing = false
  reconnecting = false

  console.log(
    '\nWhatsApp Web connected successfully! ✅'
  )
})

/*
 * Disconnected
 */
client.on('disconnected', async (reason) => {

  isReady = false

  console.log(
    'WhatsApp disconnected:',
    reason
  )

  if (!reconnecting) {

    console.log(
      'WhatsApp will attempt automatic reconnection... 🔄'
    )

    setTimeout(() => {

      reconnectWhatsApp()

    }, 5000)
  }
})

/*
 * WhatsApp state
 */
client.on('change_state', (state) => {

  console.log(
    `WhatsApp state changed: ${state}`
  )
})

/*
 * Sleep helper
 */
async function sleep(ms: number) {

  return new Promise(resolve => {

    setTimeout(resolve, ms)

  })
}

/*
 * Wait until WhatsApp is ready.
 */
async function waitUntilReady(
  timeout = 30000
): Promise<boolean> {

  const start = Date.now()

  while (
    Date.now() - start < timeout
  ) {

    if (isReady) {

      return true
    }

    await sleep(500)
  }

  return false
}

/*
 * Initialize WhatsApp safely.
 */
async function initializeWhatsApp(
  attempt = 1
) {

  if (isInitializing) {

    console.log(
      'WhatsApp initialization already running.'
    )

    return
  }

  isInitializing = true

  try {

    console.log(
      `Starting WhatsApp Web... (attempt ${attempt})`
    )

    /*
     * Clean stale Chromium locks before startup.
     */
    removeStaleChromeLocks()

    await client.initialize()

  } catch (error) {

    isInitializing = false
    isReady = false

    console.error(
      'WhatsApp initialization failed:',
      error
    )

    /*
     * Retry automatically.
     */
    if (attempt < 5) {

      const delay =
        Math.min(
          attempt * 5000,
          20000
        )

      console.log(
        `WhatsApp will retry in ${delay / 1000} seconds... 🔄`
      )

      setTimeout(() => {

        initializeWhatsApp(
          attempt + 1
        )

      }, delay)

    } else {

      console.log(
        'WhatsApp could not initialize after multiple attempts ❌'
      )

      console.log(
        'The backend will continue running. WhatsApp will be retried when needed.'
      )
    }
  }
}

/*
 * Reconnect WhatsApp.
 */
async function reconnectWhatsApp(): Promise<boolean> {

  if (reconnecting) {

    console.log(
      'WhatsApp reconnect already running.'
    )

    return false
  }

  reconnecting = true
  isReady = false

  console.log(
    '\nRefreshing WhatsApp connection... 🔄'
  )

  try {

    try {

      await client.destroy()

      console.log(
        'Old WhatsApp connection closed.'
      )

    } catch {

      console.log(
        'Old WhatsApp connection was already closed.'
      )
    }

    await sleep(3000)

    removeStaleChromeLocks()

    isInitializing = false

    await initializeWhatsApp()

    const ready =
      await waitUntilReady(30000)

    if (ready) {

      console.log(
        'WhatsApp connection restored! ✅'
      )

      reconnecting = false

      return true
    }

    console.log(
      'WhatsApp connection could not be restored ❌'
    )

    reconnecting = false

    return false

  } catch (error) {

    console.error(
      'WhatsApp reconnect error:',
      error
    )

    reconnecting = false

    return false
  }
}

/*
 * Start WhatsApp automatically.
 */
initializeWhatsApp()

/*
 * Send WhatsApp message.
 *
 * Important:
 * ACK / delivery-status checking intentionally removed.
 * WhatsApp LID chats mein sendMessage() ke baad
 * message ID reliable nahi hoti.
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<boolean> {

  let cleanPhone = phone.replace(/\D/g, '')

  if (cleanPhone.startsWith('0')) {

    cleanPhone =
      '92' + cleanPhone.substring(1)
  }

  console.log(
    `Preparing WhatsApp message for ${cleanPhone}...`
  )

  let ready =
    await waitUntilReady(30000)

  if (!ready) {

    console.log(
      'WhatsApp is not ready. Attempting automatic reconnect... 🔄'
    )

    ready =
      await reconnectWhatsApp()
  }

  if (!ready) {

    console.log(
      'WhatsApp is not ready. Message not sent ❌'
    )

    return false
  }

  try {

    /*
     * Check whether number is registered.
     */
    const numberId =
      await client.getNumberId(cleanPhone)

    if (!numberId) {

      console.log(
        `Number ${cleanPhone} is NOT registered on WhatsApp ❌`
      )

      return false
    }

    console.log(
      `Number ${cleanPhone} is registered on WhatsApp ✅`
    )

    /*
     * WhatsApp ka actual returned chat ID.
     *
     * Ye normal @c.us aur LID dono cases
     * mein WhatsApp ke returned ID ko use karta hai.
     */
    const actualChatId =
      numberId._serialized

    console.log(
      `Using WhatsApp chat ID: ${actualChatId}`
    )

    /*
     * Small delay before sending.
     */
    await sleep(1000)

    /*
     * Send message.
     *
     * Agar ye successfully resolve ho jaye,
     * WhatsApp ne message accept kar liya.
     */
    await client.sendMessage(
      actualChatId,
      message
    )

    console.log(
      `WhatsApp message sent successfully to ${cleanPhone} ✅`
    )

    return true

  } catch (error) {

    console.error(
      `WhatsApp send failed for ${cleanPhone}:`,
      error
    )

    const errorText =
      String(error)

    /*
     * Browser/session problems ke case mein
     * automatic reconnect.
     */
    if (
      errorText.includes('detached Frame') ||
      errorText.includes('Target closed') ||
      errorText.includes('Execution context was destroyed') ||
      errorText.includes('Protocol error') ||
      errorText.includes('Session closed')
    ) {

      console.log(
        'WhatsApp browser problem detected. Reconnecting... 🔄'
      )

      const reconnected =
        await reconnectWhatsApp()

      if (!reconnected) {

        console.log(
          'WhatsApp reconnect failed ❌'
        )

        return false
      }

      await sleep(3000)

      try {

        /*
         * Reconnect ke baad number ID dobara obtain karein.
         */
        const retryNumberId =
          await client.getNumberId(cleanPhone)

        if (!retryNumberId) {

          console.log(
            `Number ${cleanPhone} is NOT registered on WhatsApp after reconnect ❌`
          )

          return false
        }

        /*
         * Retry message using actual WhatsApp chat ID.
         */
        await client.sendMessage(
          retryNumberId._serialized,
          message
        )

        console.log(
          `WhatsApp retry sent successfully to ${cleanPhone} ✅`
        )

        return true

      } catch (retryError) {

        console.error(
          `WhatsApp retry failed for ${cleanPhone}:`,
          retryError
        )

        return false
      }
    }

    return false
  }
}