const isLoggedIn =
  localStorage.getItem('groceryLoggedIn')

if (isLoggedIn !== 'true') {
  localStorage.setItem(
    'loginReturnUrl',
    window.location.pathname + window.location.search
  )

  window.location.href = '/login.html'
}

type OrderItem = {
  id: string
  name?: string
  quantity: number
}

type Order = {
  orderNumber: string
  createdAt: string
  lastUpdated?: string
  name?: string
  phone?: string
  address?: string
  city?: string
  paymentMethod?: string
  items: OrderItem[]
  total: number
  status: string
  locked?: boolean
}

const ordersList =
  document.querySelector<HTMLDivElement>(
    '#my-orders-list'
  )!

const searchInput =
  document.querySelector<HTMLInputElement>(
    '#my-order-search'
  )!
const statusFilter =
  document.querySelector<HTMLSelectElement>(
    '#my-order-status-filter'
  )!
  const clearFiltersButton =
  document.querySelector<HTMLButtonElement>(
    '#clear-my-order-filters'
  )!
const modal =
  document.querySelector<HTMLDivElement>(
    '#my-order-modal'
  )!

const modalContent =
  document.querySelector<HTMLDivElement>(
    '#my-order-details-content'
  )!

const closeModal =
  document.querySelector<HTMLButtonElement>(
    '#close-my-order-modal'
  )!

const savedUser =
  localStorage.getItem('groceryUser')

if (!savedUser) {
  window.location.href = '/login.html'
}

const user = savedUser
  ? JSON.parse(savedUser)
  : null

const productNames: Record<string, string> = {
  apple: 'Fresh Apples',
  banana: 'Fresh Banana',
  mango: 'Fresh Mango',
  guava: 'Fresh Guava',
  strawberry: 'Fresh Strawberry',
  milk: 'Fresh Milk',
  bread: 'Brown Bread'
}
/* =========================
   PRODUCT PRICES
========================= */

const productPrices: Record<string, number> = {
  apple: 250,
  banana: 180,
  mango: 300,
  guava: 220,
  strawberry: 450,
  milk: 220,
  bread: 180
}

const DELIVERY_CHARGE = 100
function getProductName(
  item: OrderItem
) {
  return (
    item.name ||
    productNames[item.id] ||
    item.id ||
    'Product'
  )
}

/* =========================
   ORDER TIMELINE
========================= */

function getOrderTimeline(
  status: string
) {

  const steps = [
    {
      name: 'Pending',
      icon: '📋'
    },
    {
      name: 'Processing',
      icon: '⚙️'
    },
    {
      name: 'Shipped',
      icon: '🚚'
    },
    {
      name: 'Out for Delivery',
      icon: '🛵'
    },
    {
      name: 'Delivered',
      icon: '✅'
    }
  ]

  const currentIndex =
    steps.findIndex(
      step => step.name === status
    )

  return `
    <div class="my-order-timeline">

      ${steps.map((step, index) => {

        const completed =
          currentIndex >= 0 &&
          index < currentIndex

        const active =
          index === currentIndex

        return `
          <div
            class="my-order-timeline-step
              ${completed ? 'completed' : ''}
              ${active ? 'active' : ''}"
          >

            <span>
              ${step.icon}
            </span>

            <strong>
              ${step.name}
            </strong>

          </div>

          ${
            index < steps.length - 1
              ? `
                <div
                  class="my-order-timeline-line
                    ${
                      currentIndex > index
                        ? 'completed'
                        : ''
                    }"
                ></div>
              `
              : ''
          }

        `

      }).join('')}

    </div>
  `
}

/* =========================
   ORDER DETAILS MODAL
========================= */

function showOrderDetails(
  order: Order
) {

  const orderDate =
    new Date(
      order.createdAt
    ).toLocaleString()

  const lastUpdated =
    order.lastUpdated
      ? new Date(
          order.lastUpdated
        ).toLocaleString()
      : 'Not available'
  const subtotal =
  order.items.reduce(
    (sum, item) =>
      sum +
      (productPrices[item.id] || 0) *
        item.quantity,
    0
  )

const deliveryCharge =
  order.total > subtotal
    ? order.total - subtotal
    : DELIVERY_CHARGE
 const products =
  order.items.map(item => {

    const price =
      productPrices[item.id] || 0

    const itemTotal =
      price * item.quantity

    return `
      <div class="modal-product-item">

        <div>
          <strong>
            ${getProductName(item)}
          </strong>

          <small>
            Rs. ${price} × ${item.quantity}
          </small>
        </div>

        <strong>
          Rs. ${itemTotal}
        </strong>

      </div>
    `

  }).join('')

  modalContent.innerHTML = `

    <div class="modal-order-number">
      #${order.orderNumber}
    </div>

    <div class="modal-order-info">

      <p>
        <strong>👤 Customer:</strong>
        ${order.name || user.name}
      </p>

      <p>
        <strong>📱 Phone:</strong>
        ${order.phone || user.phone}
      </p>

      <p>
        <strong>📍 Address:</strong>
        ${order.address || 'Not available'}
      </p>

      <p>
        <strong>🏙️ City:</strong>
        ${order.city || 'Not available'}
      </p>

      <p>
        <strong>💳 Payment:</strong>
        ${order.paymentMethod || 'Not available'}
      </p>

      <p>
        <strong>📊 Status:</strong>

        <span
          class="order-status-badge status-${order.status
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z-]/g, '')}"
        >
          ${order.status}
        </span>

      </p>

      <p>
        <strong>📅 Order Date:</strong>
        ${orderDate}
      </p>

      <p>
        <strong>🔄 Last Updated:</strong>
        ${lastUpdated}
      </p>

    </div>

    <div class="modal-products">

      <h3>🛒 Products</h3>

      ${products}

    </div>

   <div class="modal-order-total">

  <div class="order-total-row">
    <span>Products Subtotal</span>
    <strong>Rs. ${subtotal}</strong>
  </div>

  <div class="order-total-row">
    <span>Delivery</span>
    <strong>Rs. ${deliveryCharge}</strong>
  </div>

  <div class="order-total-row order-final-total">
    <span>Final Total</span>
    <strong>Rs. ${order.total}</strong>
  </div>

</div>
  ${
  order.status === 'Pending'
    ? `
      <button
        class="modal-cancel-button"
        data-order="${order.orderNumber}"
      >
        ❌ Cancel Order
      </button>
    `
    : ''
}
    <button
      class="modal-track-button"
      data-order="${order.orderNumber}"
    >
      📦 Track This Order
    </button>

  `
   const cancelButton =
  modalContent.querySelector<HTMLButtonElement>(
    '.modal-cancel-button'
  )

cancelButton?.addEventListener(
  'click',
  async () => {

    const orderNumber =
      cancelButton.dataset.order

    if (!orderNumber) return

    const confirmed =
      confirm(
        `Are you sure you want to cancel Order #${orderNumber}?`
      )

    if (!confirmed) return

    try {

      const response =
        await fetch(
          `http://localhost:5000/api/orders/${orderNumber}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'Cancelled'
            })
          }
        )

      if (!response.ok) {

        const errorData =
          await response.json().catch(() => null)

        throw new Error(
          errorData?.message ||
          'Unable to cancel order'
        )

      }

      alert('Order cancelled successfully.')

      modal.classList.remove('show')

      await loadMyOrders()

    } catch (error) {

      console.error(error)

      alert(
        'Unable to cancel order. Please try again.'
      )

    }

  }
)  
  modal.classList.add('show')

  const trackButton =
    modalContent.querySelector<HTMLButtonElement>(
      '.modal-track-button'
    )

  trackButton?.addEventListener(
    'click',
    () => {

      const orderNumber =
        trackButton.dataset.order

      if (!orderNumber) return

      window.location.href =
        `/order-tracking.html?order=${orderNumber}`

    }
  )
}

/* =========================
   CLOSE MODAL
========================= */

closeModal.addEventListener(
  'click',
  () => {

    modal.classList.remove('show')

  }
)

modal.addEventListener(
  'click',
  event => {

    if (
      event.target === modal
    ) {

      modal.classList.remove('show')

    }

  }
)

/* =========================
   LOAD MY ORDERS
========================= */

async function loadMyOrders() {

  try {

    const response =
      await fetch(
        'http://localhost:5000/api/orders'
      )

    if (!response.ok) {

      throw new Error(
        'Failed to load orders'
      )

    }

    const orders: Order[] =
      await response.json()

    /* CUSTOMER ORDERS */

   const myOrders =
  orders.filter(order => {

    const phoneMatch =
      order.phone === user.phone

    const nameMatch =
      order.name &&
      user.name &&
      order.name.toLowerCase() ===
        user.name.toLowerCase()

    return phoneMatch || nameMatch

  })

    /* SEARCH */

   const searchText =
  searchInput.value
    .toLowerCase()
    .trim()

const selectedStatus =
  statusFilter.value

const filteredOrders =
  myOrders.filter(order => {

    const matchesSearch =
      order.orderNumber
        .toLowerCase()
        .includes(searchText)

    const matchesStatus =
      selectedStatus === 'all' ||
      order.status === selectedStatus

    return (
      matchesSearch &&
      matchesStatus
    )

  })

    /* NO ORDERS */

    if (
      filteredOrders.length === 0
    ) {

      ordersList.innerHTML = `

        <div class="empty-cart">

          <h3>
            ${
              searchText
                ? 'No Matching Orders'
                : 'No Orders Found'
            }
          </h3>

          <p>
            ${
              searchText
                ? 'No order found with this order number.'
                : 'You have not placed any orders yet.'
            }
          </p>

        </div>

      `

      return
    }

    /* SORT NEWEST FIRST */

    filteredOrders.sort(
      (a, b) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    )

    /* DISPLAY ORDERS */

    ordersList.innerHTML =
      filteredOrders
        .map(order => {

          const orderDate =
            new Date(
              order.createdAt
            ).toLocaleString()

          const products =
            order.items
              .map(item => `
                <div>
                  ${getProductName(item)}
                  × ${item.quantity}
                </div>
              `)
              .join('')

          return `

            <div class="my-order-card">

              <h2>
                Order #${order.orderNumber}
              </h2>

              <p>
                <strong>Date:</strong>
                ${orderDate}
              </p>

              <p>
                <strong>Total:</strong>
                Rs. ${order.total}
              </p>
              <p>
  <strong>Customer:</strong>
  ${order.name || user.name}
</p>

<p>
  <strong>Phone:</strong>
  ${order.phone || user.phone}
</p>
              <p>

                <strong>Status:</strong>

                <span
                  class="order-status-badge status-${order.status
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z-]/g, '')}"
                >
                  ${order.status}
                </span>

              </p>

              ${getOrderTimeline(
                order.status
              )}
              <div class="my-order-status-message">
  ${
    order.status === 'Pending'
      ? '⏳ Your order is waiting for confirmation.'
      : order.status === 'Processing'
      ? '⚙️ Your order is being prepared.'
      : order.status === 'Shipped'
      ? '🚚 Your order has been shipped.'
      : order.status === 'Out for Delivery'
      ? '🛵 Your order is out for delivery.'
      : order.status === 'Delivered'
      ? '✅ Your order has been delivered successfully.'
      : order.status === 'Cancelled'
      ? '❌ This order has been cancelled.'
      : '📦 Your order status is being updated.'
  }
</div>
              <div>

                <strong>
                  Products:
                </strong>

                ${products}

              </div>

              <div
                class="my-order-buttons"
              >

                <button
                  class="view-my-order"
                  data-order="${order.orderNumber}"
                >
                  👁️ Order Details
                </button>

                <button
                  class="track-my-order"
                  data-order="${order.orderNumber}"
                >
                  📦 Track Order
                </button>

              </div>

            </div>

          `

        })
        .join('')

    /* =========================
       ORDER DETAILS BUTTON
    ========================= */

    document
      .querySelectorAll<HTMLButtonElement>(
        '.view-my-order'
      )
      .forEach(button => {

        button.addEventListener(
          'click',
          () => {

            const orderNumber =
              button.dataset.order

            if (!orderNumber) return

            const order =
              filteredOrders.find(
                item =>
                  item.orderNumber ===
                  orderNumber
              )

            if (!order) return

            showOrderDetails(
              order
            )

          }
        )

      })
    
    /* =========================
       TRACK ORDER BUTTON
    ========================= */

    document
      .querySelectorAll<HTMLButtonElement>(
        '.track-my-order'
      )
      .forEach(button => {

        button.addEventListener(
          'click',
          () => {

            const orderNumber =
              button.dataset.order

            if (!orderNumber) return

            window.location.href =
              `/order-tracking.html?order=${orderNumber}`

          }
        )

      })

  } catch (error) {

    console.error(error)

    ordersList.innerHTML = `

      <div class="empty-cart">

        <h3>
          Unable to Load Orders
        </h3>

        <p>
          Please make sure the backend
          server is running.
        </p>

      </div>

    `

  }

}

/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
  'input',
  () => {

    loadMyOrders()

  }
)
statusFilter.addEventListener(
  'change',
  () => {

    loadMyOrders()

  }
)
/* =========================
   INITIAL LOAD
========================= */

loadMyOrders()

/* =========================
   AUTO REFRESH
========================= */

setInterval(
  () => {

    loadMyOrders()

  },
  10000
)
clearFiltersButton.addEventListener(
  'click',
  () => {

    searchInput.value = ''

    statusFilter.value = 'all'

    loadMyOrders()

  }
)