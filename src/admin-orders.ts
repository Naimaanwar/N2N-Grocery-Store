// ========================================
// API URL
// ========================================

const API_URL = import.meta.env.VITE_API_URL


const productNames: Record<string, string> = {
  apple: 'Fresh Apples',
  banana: 'Fresh Banana',
  mango: 'Fresh Mango',
  guava: 'Fresh Guava',
  strawberry: 'Fresh Strawberry',
  milk: 'Fresh Milk',
  bread: 'Brown Bread'
}


interface OrderItem {
  id: string
  name?: string
  quantity: number
}


interface Order {
  orderNumber: string
  createdAt: number
  lastUpdated: number
  name: string
  phone: string
  address: string
  city: string
  paymentMethod: string
  items: OrderItem[]
  total: number
  status: string
  locked: boolean
}


const ordersList = document.querySelector(
  '#admin-orders-list'
) as HTMLDivElement


const refreshButton = document.querySelector(
  '#refresh-orders-button'
) as HTMLButtonElement


const searchInput = document.querySelector(
  '#order-search'
) as HTMLInputElement


const statusFilter = document.querySelector(
  '#status-filter'
) as HTMLSelectElement


const clearFiltersButton = document.querySelector(
  '#clear-filters-button'
) as HTMLButtonElement


const totalOrders = document.querySelector(
  '#total-orders'
) as HTMLElement


const pendingOrders = document.querySelector(
  '#pending-orders'
) as HTMLElement


const processingOrders = document.querySelector(
  '#processing-orders'
) as HTMLElement


const shippedOrders = document.querySelector(
  '#shipped-orders'
) as HTMLElement


const outForDeliveryOrders = document.querySelector(
  '#out-for-delivery-orders'
) as HTMLElement


const deliveredOrders = document.querySelector(
  '#delivered-orders'
) as HTMLElement


const cancelledOrders = document.querySelector(
  '#cancelled-orders'
) as HTMLElement


const totalSales = document.querySelector(
  '#total-sales'
) as HTMLElement


const orderDetailsModal = document.querySelector(
  '#order-details-modal'
) as HTMLDivElement


const orderDetailsContent = document.querySelector(
  '#order-details-content'
) as HTMLDivElement


const closeOrderModal = document.querySelector(
  '#close-order-modal'
) as HTMLButtonElement


let allOrders: Order[] = []


// ========================================
// GET PRODUCT NAME
// ========================================

function getProductName(
  item: OrderItem
): string {

  return (
    item.name ||
    productNames[item.id] ||
    item.id ||
    'Product'
  )
}


// ========================================
// LOAD ALL ORDERS
// ========================================

async function loadOrders(): Promise<void> {

  try {

    ordersList.innerHTML = `
      <p>Loading orders...</p>
    `


    const response = await fetch(
      `${API_URL}/api/orders`
    )


    if (!response.ok) {

      throw new Error(
        'Failed to load orders'
      )

    }


    const data = await response.json()


    allOrders =
      Array.isArray(data)
        ? data
        : data.orders || []


    updateSummary()

    renderOrders()

  } catch (error) {

    console.error(
      'Error loading orders:',
      error
    )


    ordersList.innerHTML = `
      <div class="admin-error">

        <h3>
          ❌ Orders Load Nahi Ho Sake
        </h3>

        <p>
          Backend server check karein.
        </p>

        <p>
          Backend:
          <strong>
            ${API_URL}
          </strong>
        </p>

      </div>
    `
  }
}


// ========================================
// UPDATE SUMMARY
// ========================================

function updateSummary(): void {

  totalOrders.textContent =
    allOrders.length.toString()


  pendingOrders.textContent =
    countStatus('Pending').toString()


  processingOrders.textContent =
    countStatus('Processing').toString()


  shippedOrders.textContent =
    countStatus('Shipped').toString()


  outForDeliveryOrders.textContent =
    countStatus(
      'Out for Delivery'
    ).toString()


  deliveredOrders.textContent =
    countStatus('Delivered').toString()


  cancelledOrders.textContent =
    countStatus('Cancelled').toString()


  const sales =
    allOrders
      .filter(
        order =>
          order.status !== 'Cancelled'
      )
      .reduce(
        (
          sum,
          order
        ) =>
          sum +
          Number(
            order.total || 0
          ),
        0
      )


  totalSales.textContent =
    `Rs. ${sales.toLocaleString()}`
}


// ========================================
// COUNT STATUS
// ========================================

function countStatus(
  status: string
): number {

  return allOrders.filter(
    order =>
      order.status === status
  ).length
}


// ========================================
// RENDER ORDERS
// ========================================

function renderOrders(): void {

  const searchText =
    searchInput.value
      .trim()
      .toLowerCase()


  const selectedStatus =
    statusFilter.value


  const filteredOrders =
    allOrders.filter(
      order => {

        const matchesSearch =
          !searchText ||

          order.orderNumber
            ?.toLowerCase()
            .includes(
              searchText
            ) ||

          order.name
            ?.toLowerCase()
            .includes(
              searchText
            ) ||

          order.phone
            ?.toLowerCase()
            .includes(
              searchText
            )


        const matchesStatus =
          selectedStatus === 'all' ||
          order.status ===
            selectedStatus


        return (
          matchesSearch &&
          matchesStatus
        )
      }
    )


  if (
    filteredOrders.length === 0
  ) {

    ordersList.innerHTML = `
      <div class="no-orders">

        <h3>
          📦 No Orders Found
        </h3>

        <p>
          Is search/filter ke mutabiq
          koi order nahi mila.
        </p>

      </div>
    `

    return
  }


  ordersList.innerHTML =
    filteredOrders
      .map(
        order =>
          createOrderCard(order)
      )
      .join('')


  // ======================================
  // VIEW DETAILS BUTTON
  // ======================================

  document
    .querySelectorAll(
      '.view-order-button'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const orderNumber =
              (
                button as HTMLElement
              )
                .dataset
                .orderNumber


            const order =
              allOrders.find(
                item =>
                  item.orderNumber ===
                  orderNumber
              )


            if (order) {

              showOrderDetails(
                order
              )

            }

          }
        )

      }
    )


  // ======================================
  // STATUS DROPDOWN
  // ======================================

  document
    .querySelectorAll(
      '.status-select'
    )
    .forEach(
      select => {

        select.addEventListener(
          'change',
          async () => {

            const element =
              select as HTMLSelectElement


            const orderNumber =
              element.dataset
                .orderNumber


            const newStatus =
              element.value


            if (
              orderNumber
            ) {

              await updateOrderStatus(
                orderNumber,
                newStatus
              )

            }

          }
        )

      }
    )


  // ======================================
  // LOCK / UNLOCK BUTTON
  // ======================================

  document
    .querySelectorAll(
      '.lock-order-button'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const element =
              button as HTMLButtonElement


            const orderNumber =
              element.dataset
                .orderNumber


            const isLocked =
              element.dataset
                .locked === 'true'


            if (
              orderNumber
            ) {

              await updateOrderLock(
                orderNumber,
                !isLocked
              )

            }

          }
        )

      }
    )
}


// ========================================
// CREATE ORDER CARD
// ========================================

function createOrderCard(
  order: Order
): string {

  const date =
    order.createdAt
      ? new Date(
          order.createdAt
        ).toLocaleString()
      : 'Date not available'


  const itemsText =
    order.items
      ?.map(
        item =>
          `${getProductName(
            item
          )} × ${
            item.quantity || 1
          }`
      )
      .join(', ') ||
    'No items'


  const isLocked =
    order.locked === true


  return `
    <div class="admin-order-card">

      <div class="admin-order-header">

        <div>

          <h3>
            📦 #${order.orderNumber}
          </h3>

          <small>
            ${date}
          </small>

        </div>


        <strong>
          Rs.
          ${
            Number(
              order.total || 0
            ).toLocaleString()
          }
        </strong>

      </div>


      <div class="admin-order-info">

        <p>

          👤
          <strong>
            Customer:
          </strong>

          ${
            order.name ||
            'N/A'
          }

        </p>


        <p>

          📱
          <strong>
            Phone:
          </strong>

          ${
            order.phone ||
            'N/A'
          }

        </p>


        <p>

          📦
          <strong>
            Items:
          </strong>

          ${itemsText}

        </p>

      </div>


      ${
        isLocked
          ? `
            <p class="order-locked-message">
              🔒 This order is locked
            </p>
          `
          : ''
      }


      <div
        class="admin-order-actions"
      >

        <select
          class="status-select"
          data-order-number="${
            order.orderNumber
          }"
          ${
            isLocked
              ? 'disabled'
              : ''
          }
        >

          ${
            createStatusOption(
              'Pending',
              order.status
            )
          }

          ${
            createStatusOption(
              'Processing',
              order.status
            )
          }

          ${
            createStatusOption(
              'Shipped',
              order.status
            )
          }

          ${
            createStatusOption(
              'Out for Delivery',
              order.status
            )
          }

          ${
            createStatusOption(
              'Delivered',
              order.status
            )
          }

          ${
            createStatusOption(
              'Cancelled',
              order.status
            )
          }

        </select>


        <button
          class="view-order-button"
          data-order-number="${
            order.orderNumber
          }"
        >
          👁️ View Details
        </button>


        <button
          class="lock-order-button"
          data-order-number="${
            order.orderNumber
          }"
          data-locked="${
            isLocked
          }"
        >
          ${
            isLocked
              ? '🔓 Unlock Order'
              : '🔒 Lock Order'
          }
        </button>

      </div>

    </div>
  `
}


// ========================================
// STATUS OPTION
// ========================================

function createStatusOption(
  status: string,
  currentStatus: string
): string {

  return `
    <option
      value="${status}"
      ${
        status ===
        currentStatus
          ? 'selected'
          : ''
      }
    >
      ${status}
    </option>
  `
}


// ========================================
// UPDATE ORDER STATUS
// ========================================

async function updateOrderStatus(
  orderNumber: string,
  newStatus: string
): Promise<void> {

  try {

    const response =
      await fetch(
        `${API_URL}/api/orders/${orderNumber}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            status: newStatus
          })
        }
      )


    if (!response.ok) {

      const errorData =
        await response
          .json()
          .catch(
            () => null
          )


      throw new Error(
        errorData?.message ||
        'Status update failed'
      )

    }


    const updatedData =
      await response.json()


    const order =
      allOrders.find(
        item =>
          item.orderNumber ===
          orderNumber
      )


    if (order) {

      order.status =
        updatedData.order?.status ||
        newStatus


      order.lastUpdated =
        updatedData.order?.lastUpdated ||
        Date.now()

    }


    updateSummary()

    renderOrders()

  } catch (error) {

    console.error(
      'Status update error:',
      error
    )


    renderOrders()
  }
}


// ========================================
// UPDATE ORDER LOCK
// ========================================

async function updateOrderLock(
  orderNumber: string,
  shouldLock: boolean
): Promise<void> {

  try {

    const response =
      await fetch(
        `${API_URL}/api/orders/${orderNumber}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            locked: shouldLock
          })
        }
      )


    if (!response.ok) {

      const errorData =
        await response
          .json()
          .catch(
            () => null
          )


      throw new Error(
        errorData?.message ||
        'Lock update failed'
      )

    }


    const updatedData =
      await response.json()


    const order =
      allOrders.find(
        item =>
          item.orderNumber ===
          orderNumber
      )


    if (order) {

      order.locked =
        updatedData.order?.locked ??
        shouldLock

      order.lastUpdated =
        updatedData.order?.lastUpdated ||
        Date.now()
    }


    renderOrders()

  } catch (error) {

    console.error(
      'Lock update error:',
      error
    )


    renderOrders()
  }
}


// ========================================
// SHOW ORDER DETAILS
// ========================================

function showOrderDetails(
  order: Order
): void {

  const itemsHTML =
    order.items
      ?.map(
        item => {

          const productName =
            getProductName(
              item
            )


          return `
            <div class="modal-item">

              <span>
                ${productName}
                ×
                ${
                  item.quantity ||
                  1
                }
              </span>

              <strong>
                Qty:
                ${
                  item.quantity ||
                  1
                }
              </strong>

            </div>
          `
        }
      )
      .join('') ||

    '<p>No items found.</p>'


  orderDetailsContent.innerHTML = `

    <div class="modal-order-info">

      <p>

        <strong>
          Order Date:
        </strong>

        ${
          order.createdAt
            ? new Date(
                order.createdAt
              ).toLocaleString()
            : 'N/A'
        }

      </p>


      <p>

        <strong>
          Last Updated:
        </strong>

        ${
          order.lastUpdated
            ? new Date(
                order.lastUpdated
              ).toLocaleString()
            : 'N/A'
        }

      </p>


      <p>

        <strong>
          Order Number:
        </strong>

        #${order.orderNumber}

      </p>


      <p>

        <strong>
          Customer:
        </strong>

        ${
          order.name ||
          'N/A'
        }

      </p>


      <p>

        <strong>
          Phone:
        </strong>

        ${
          order.phone ||
          'N/A'
        }

      </p>


      <p>

        <strong>
          Address:
        </strong>

        ${
          order.address ||
          'N/A'
        }

      </p>


      <p>

        <strong>
          City:
        </strong>

        ${
          order.city ||
          'N/A'
        }

      </p>


      <p>

        <strong>
          Payment:
        </strong>

        ${
          order.paymentMethod ||
          'N/A'
        }

      </p>


      <p>

        <strong>
          Status:
        </strong>

        ${
          order.status ||
          'Pending'
        }

      </p>


      <p>

        <strong>
          Lock:
        </strong>

        ${
          order.locked
            ? '🔒 Locked'
            : '🔓 Unlocked'
        }

      </p>

    </div>


    <h3>
      🛒 Products
    </h3>


    <div class="modal-items">

      ${itemsHTML}

    </div>


    <div class="modal-total">

      <strong>
        Total:
      </strong>


      <strong>

        Rs.
        ${
          Number(
            order.total || 0
          ).toLocaleString()
        }

      </strong>

    </div>

  `


  orderDetailsModal.classList.add(
    'show'
  )
}


// ========================================
// CLOSE MODAL
// ========================================

closeOrderModal.addEventListener(
  'click',
  () => {

    orderDetailsModal.classList.remove(
      'show'
    )

  }
)


orderDetailsModal.addEventListener(
  'click',
  event => {

    if (
      event.target ===
      orderDetailsModal
    ) {

      orderDetailsModal.classList.remove(
        'show'
      )

    }

  }
)


// ========================================
// REFRESH BUTTON
// ========================================

refreshButton.addEventListener(
  'click',
  loadOrders
)


// ========================================
// SEARCH
// ========================================

searchInput.addEventListener(
  'input',
  renderOrders
)


// ========================================
// STATUS FILTER
// ========================================

statusFilter.addEventListener(
  'change',
  renderOrders
)


// ========================================
// CLEAR FILTERS
// ========================================

clearFiltersButton.addEventListener(
  'click',
  () => {

    searchInput.value = ''

    statusFilter.value =
      'all'

    renderOrders()

  }
)


// ========================================
// INITIAL LOAD
// ========================================

loadOrders()