const isLoggedIn =
localStorage.getItem('groceryLoggedIn')

if (isLoggedIn !== 'true') {
localStorage.setItem(
'loginReturnUrl',
window.location.pathname + window.location.search
)

window.location.href = '/login.html'
}

const productNames: Record<string, string> = {
apple: 'Fresh Apples',
banana: 'Fresh Banana',
mango: 'Fresh Mango',
guava: 'Fresh Guava',
strawberry: 'Fresh Strawberry',
milk: 'Fresh Milk',
bread: 'Brown Bread'
}

const productPrices: Record<string, number> = {
apple: 250,
banana: 180,
mango: 300,
guava: 220,
strawberry: 450,
milk: 220,
bread: 180
}

const orderInput =
document.querySelector(
'#tracking-order-number'
) as HTMLInputElement

const trackButton =
document.querySelector(
'#track-order-button'
) as HTMLButtonElement

const trackingResult =
document.querySelector(
'#tracking-result'
) as HTMLDivElement

let trackedOrderNumber = ''
let lastTrackedStatus = ''
let lastTrackedUpdated: string | number = ''

trackButton.addEventListener(
'click',
async function () {

const orderNumber =
  orderInput.value.trim()

if (orderNumber === '') {
  alert(
    'Please enter your order number.'
  )
  return
}

trackingResult.innerHTML =
  '<p>🔄 Checking your order...</p>'

try {

  const url =
  `http://localhost:5000/api/orders/` +
  encodeURIComponent(orderNumber)

  const response =
    await fetch(url)

  const result =
    await response.json()

  if (
    !response.ok ||
    !result.success
  ) {

    trackingResult.innerHTML =
      '<div class="empty-cart">' +
      '<h3>❌ Order Not Found</h3>' +
      '<p>Please check your order number and try again.</p>' +
      '</div>'

    return
  }

  const order =
    result.order

  trackedOrderNumber =
    order.orderNumber || orderNumber

  lastTrackedStatus =
    order.status || 'Pending'

  lastTrackedUpdated =
    order.lastUpdated || ''

  const orderNumberText =
    order.orderNumber ||
    orderNumber

  const customerName =
    order.name ||
    'Not available'

  const phone =
    order.phone ||
    'Not available'

  const address =
    order.address ||
    'Not available'

  const city =
    order.city ||
    'Not available'

  const payment =
    order.paymentMethod ||
    'Not available'

  const total =
    order.total || 0

  const status =
    order.status ||
    'Pending'

  let statusMessage = ''

  if (status === 'Pending') {
    statusMessage =
      '🟡 Your order has been received and is waiting for processing.'
  } else if (status === 'Processing') {
    statusMessage =
      '🔵 Your order is currently being prepared.'
  } else if (status === 'Shipped') {
    statusMessage =
      '🚚 Your order has been shipped and is on the way.'
  } else if (status === 'Out for Delivery') {
    statusMessage =
      '🏠 Your order is out for delivery and will arrive soon.'
  } else if (status === 'Delivered') {
    statusMessage =
      '✅ Your order has been successfully delivered.'
  } else if (status === 'Cancelled') {
    statusMessage =
      '❌ This order has been cancelled.'
  }

  let pendingClass = ''
  let processingClass = ''
  let shippedClass = ''
  let deliveryClass = ''
  let deliveredClass = ''

  if (status === 'Pending') {

    pendingClass = 'active'

  } else if (status === 'Processing') {

    pendingClass = 'completed'
    processingClass = 'active'

  } else if (status === 'Shipped') {

    pendingClass = 'completed'
    processingClass = 'completed'
    shippedClass = 'active'

  } else if (status === 'Out for Delivery') {

    pendingClass = 'completed'
    processingClass = 'completed'
    shippedClass = 'completed'
    deliveryClass = 'active'

  } else if (status === 'Delivered') {

    pendingClass = 'completed'
    processingClass = 'completed'
    shippedClass = 'completed'
    deliveryClass = 'completed'
    deliveredClass = 'active'
  }

  let paymentText =
    payment

  if (payment === 'cod') {

    paymentText =
      '💵 Cash on Delivery'

  } else if (payment === 'online') {

    paymentText =
      '💳 Online Payment'
  }

  let productsHTML =
    '<p>No product details available.</p>'

  if (
    Array.isArray(order.items) &&
    order.items.length > 0
  ) {

    productsHTML =
      '<div class="tracking-products">'

    order.items.forEach(
      function (item: any) {

        const productName =
          productNames[item.id] ||
          item.id

        const productPrice =
          productPrices[item.id] ||
          0

        const quantity =
          Number(item.quantity) || 0

        const itemTotal =
          productPrice * quantity

        productsHTML +=
          '<div class="tracking-product">' +

          '<strong>' +
          productName +
          '</strong>' +

          '<span>' +
          'Price: Rs. ' +
          productPrice +
          '</span>' +

          '<span>' +
          'Quantity: ' +
          quantity +
          '</span>' +

          '<span>' +
          'Item Total: Rs. ' +
          itemTotal +
          '</span>' +

          '</div>'
      }
    )

    productsHTML +=
      '</div>'
  }

  if (status === 'Cancelled') {

    trackingResult.innerHTML =
      '<div class="order-tracking-result">' +

      '<h2>Order Found ✅</h2>' +

      '<p>' +
      '<strong>Order Number:</strong> #' +
      orderNumberText +
      '</p>' +

      '<p>' +
      '<strong>Customer:</strong> ' +
      customerName +
      '</p>' +

      '<p>' +
      '<strong>Phone:</strong> ' +
      phone +
      '</p>' +

      '<p>' +
      '<strong>Address:</strong> ' +
      address +
      '</p>' +

      '<p>' +
      '<strong>City:</strong> ' +
      city +
      '</p>' +

      '<p>' +
      '<strong>Payment:</strong> ' +
      paymentText +
      '</p>' +

      '<p>' +
      '<strong>Total:</strong> Rs. ' +
      total +
      '</p>' +

      '<p>' +
      '<strong>Delivery:</strong> Rs. 100' +
      '</p>' +

      '<p>' +
      '<strong>Last Updated:</strong> ' +
      '<span id="tracking-last-updated">' +
      (
        order.lastUpdated
          ? new Date(
              order.lastUpdated
            ).toLocaleString()
          : 'Not available'
      ) +
      '</span>' +
      '</p>' +

      '<p>' +
      '<strong>Current Status:</strong> ' +
      '<span id="tracking-current-status">' +
      '❌ ' +
      status +
      '</span>' +
      '</p>' +

      '<p id="tracking-status-message" class="tracking-status-message">' +
      statusMessage +
      '</p>' +

      '</div>'

    return
  }

  trackingResult.innerHTML =
    '<div class="order-tracking-result">' +

    '<h2>Order Found ✅</h2>' +

    '<p>' +
    '<strong>Order Number:</strong> #' +
    orderNumberText +
    '</p>' +

    '<p>' +
    '<strong>Customer:</strong> ' +
    customerName +
    '</p>' +

    '<p>' +
    '<strong>Phone:</strong> ' +
    phone +
    '</p>' +

    '<p>' +
    '<strong>Address:</strong> ' +
    address +
    '</p>' +

    '<p>' +
    '<strong>City:</strong> ' +
    city +
    '</p>' +

    '<p>' +
    '<strong>Payment:</strong> ' +
    paymentText +
    '</p>' +

    '<p>' +
    '<strong>Total:</strong> Rs. ' +
    total +
    '</p>' +

    '<p>' +
    '<strong>Delivery:</strong> Rs. 100' +
    '</p>' +

    '<p>' +
    '<strong>Last Updated:</strong> ' +
    '<span id="tracking-last-updated">' +
    (
      order.lastUpdated
        ? new Date(
            order.lastUpdated
          ).toLocaleString()
        : 'Not available'
    ) +
    '</span>' +
    '</p>' +

    '<p>' +
    '<strong>Current Status:</strong> ' +
    '<span id="tracking-current-status">' +
    '📦 ' +
    status +
    '</span>' +
    '</p>' +

    '<p id="tracking-status-message" class="tracking-status-message">' +
    statusMessage +
    '</p>' +

    '<h3>🛒 Order Products</h3>' +

    productsHTML +

    '<div class="tracking-timeline">' +

    '<div class="tracking-step ' +
    pendingClass +
    '">' +
    '<span>✓</span>' +
    '<strong>Pending</strong>' +
    '<small>Order Received</small>' +
    '</div>' +

    '<div class="tracking-line"></div>' +

    '<div class="tracking-step ' +
    processingClass +
    '">' +
    '<span>📦</span>' +
    '<strong>Processing</strong>' +
    '<small>Preparing Order</small>' +
    '</div>' +

    '<div class="tracking-line"></div>' +

    '<div class="tracking-step ' +
    shippedClass +
    '">' +
    '<span>🚚</span>' +
    '<strong>Shipped</strong>' +
    '<small>On the Way</small>' +
    '</div>' +

    '<div class="tracking-line"></div>' +

    '<div class="tracking-step ' +
    deliveryClass +
    '">' +
    '<span>🏠</span>' +
    '<strong>Out for Delivery</strong>' +
    '<small>Arriving Soon</small>' +
    '</div>' +

    '<div class="tracking-line"></div>' +

    '<div class="tracking-step ' +
    deliveredClass +
    '">' +
    '<span>✅</span>' +
    '<strong>Delivered</strong>' +
    '<small>Order Delivered</small>' +
    '</div>' +

    '</div>' +

    '</div>'

} catch (error) {

  console.error(
    'Order tracking failed:',
    error
  )

  trackingResult.innerHTML =
    '<div class="empty-cart">' +

    '<h3>⚠️ Server Connection Error</h3>' +

    '<p>' +
    'Please make sure the backend server is running.' +
    '</p>' +

    '</div>'
}

}
)

async function silentlyRefreshTracking(): Promise<void> {

if (trackedOrderNumber === '') {
return
}

try {


const response =
  await fetch(
    `http://localhost:5000/api/orders/` +
    encodeURIComponent(
      trackedOrderNumber
    )
  )
const result =
  await response.json()

if (
  !response.ok ||
  !result.success
) {
  return
}

const order =
  result.order

const newStatus =
  order.status || 'Pending'

const newUpdated =
  order.lastUpdated || ''

if (
  newStatus === lastTrackedStatus &&
  newUpdated === lastTrackedUpdated
) {
  return
}

lastTrackedStatus =
  newStatus

lastTrackedUpdated =
  newUpdated

const statusElement =
  document.querySelector(
    '#tracking-current-status'
  )

const timelineSteps =
  document.querySelectorAll(
    '.tracking-step'
  )

const updatedElement =
  document.querySelector(
    '#tracking-last-updated'
  )

const messageElement =
  document.querySelector(
    '#tracking-status-message'
  )

if (statusElement) {

  statusElement.textContent =
    newStatus === 'Cancelled'
      ? '❌ ' + newStatus
      : '📦 ' + newStatus
}

if (updatedElement) {

  updatedElement.textContent =
    newUpdated
      ? new Date(
          newUpdated
        ).toLocaleString()
      : 'Not available'
}

if (messageElement) {

  const messages:
    Record<string, string> = {

    Pending:
      '🟡 Your order has been received and is waiting for processing.',

    Processing:
      '🔵 Your order is currently being prepared.',

    Shipped:
      '🚚 Your order has been shipped and is on the way.',

    'Out for Delivery':
      '🏠 Your order is out for delivery and will arrive soon.',

    Delivered:
      '✅ Your order has been successfully delivered.',

    Cancelled:
      '❌ This order has been cancelled.'
  }

  messageElement.textContent =
    messages[newStatus] || ''
}

timelineSteps.forEach(
  (step) => {

    step.classList.remove(
      'active',
      'completed'
    )
  }
)

const statusOrder = [
  'Pending',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered'
]

const currentIndex =
  statusOrder.indexOf(
    newStatus
  )

timelineSteps.forEach(
  (step, index) => {

    if (
      newStatus ===
      'Cancelled'
    ) {
      return
    }

    if (
      index < currentIndex
    ) {
      step.classList.add(
        'completed'
      )
    }

    if (
      index === currentIndex
    ) {
      step.classList.add(
        'active'
      )
    }
  }
)

console.log(
  'Order status updated:',
  newStatus
)


} catch (error) {

console.error(
  'Silent tracking refresh failed:',
  error
)


}
}

setInterval(
silentlyRefreshTracking,
10000
)
