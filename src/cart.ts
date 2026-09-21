const isLoggedIn =
  localStorage.getItem('groceryLoggedIn')

if (isLoggedIn !== 'true') {

  localStorage.setItem(
    'loginReturnUrl',
    window.location.pathname + window.location.search
  )

  window.location.href = '/login.html'
}

import './style.css'

type Product = {
  id: string
  name: string
  price: number
  unit: string
  image: string
  stock: number
}


// =========================
// PRODUCTS
// =========================

let products: Product[] = []


// =========================
// CART
// =========================

let cart: Record<string, number> = {}


// =========================
// LOAD CART FROM LOCALSTORAGE
// =========================

function loadCartFromStorage() {

  const savedCart =
    localStorage.getItem('grocery-cart')

  if (!savedCart) {

    cart = {}

    return
  }

  try {

    const parsedCart =
      JSON.parse(savedCart)

    if (
      parsedCart &&
      typeof parsedCart === 'object'
    ) {

      cart = parsedCart

    } else {

      cart = {}
    }

  } catch (error) {

    console.error(
      'Cart load error:',
      error
    )

    cart = {}
  }
}


// =========================
// SAVE CART
// =========================

function saveCart() {

  if (
    Object.keys(cart).length === 0
  ) {

    localStorage.removeItem(
      'grocery-cart'
    )

    return
  }

  localStorage.setItem(
    'grocery-cart',
    JSON.stringify(cart)
  )
}


// =========================
// CART ELEMENTS
// =========================

const cartItems =
  document.querySelector<HTMLDivElement>(
    '#cart-items'
  )!

const subtotalElement =
  document.querySelector<HTMLSpanElement>(
    '#subtotal'
  )!

const deliveryElement =
  document.querySelector<HTMLSpanElement>(
    '#delivery'
  )!

const totalElement =
  document.querySelector<HTMLSpanElement>(
    '#total'
  )!


// =========================
// LOAD PRODUCTS FROM DATABASE
// =========================

async function loadProducts() {

  try {

    const response = 
  await fetch( 
    'http://localhost:5000/api/products' 
  )

    if (!response.ok) {

      throw new Error(
        'Products load failed'
      )
    }

    const databaseProducts =
      await response.json()

    products =
      databaseProducts.map(
        (product: any) => ({

          id:
            product.product_code,

          name:
            product.name,

          price:
            Number(product.price),

          unit:
            product.unit || '',

          image:
            `/src/assets/${product.image}`,

          stock:
            Number(product.stock)

        })
      )

    /*
     * Products load hone ke baad
     * latest cart localStorage se read karein.
     */
    loadCartFromStorage()

    renderCart()

  } catch (error) {

    console.error(
      'Products load error:',
      error
    )

    cartItems.innerHTML = `
      <div class="empty-cart">

        <h2>
          Products load nahi ho rahe.
        </h2>

        <p>
          Please check backend.
        </p>

      </div>
    `
  }
}


// =========================
// RENDER CART
// =========================

function renderCart() {

  cartItems.innerHTML = ''

  let subtotal = 0

  const cartIds =
    Object.keys(cart)


  // =========================
  // EMPTY CART
  // =========================

  if (
    cartIds.length === 0
  ) {

    cartItems.innerHTML = `
      <div class="empty-cart">

        <h2>
          🛒 Your cart is empty
        </h2>

        <p>
          Add some fresh groceries first.
        </p>

      </div>
    `

    subtotalElement.textContent =
      'Rs. 0'

    deliveryElement.textContent =
      'Rs. 0'

    totalElement.textContent =
      'Rs. 0'

    /*
     * Empty cart ho to localStorage bhi clear.
     */
    localStorage.removeItem(
      'grocery-cart'
    )

    return
  }


  // =========================
  // CART ITEMS
  // =========================

  cartIds.forEach(id => {

    const product =
      products.find(
        item =>
          item.id === id
      )

    if (!product) {

      delete cart[id]

      return
    }


    let quantity =
      Number(cart[id]) || 0


    // =========================
    // STOCK SAFETY CHECK
    // =========================

    if (
      quantity >
      product.stock
    ) {

      quantity =
        product.stock

      cart[id] =
        product.stock
    }


    // =========================
    // STOCK ZERO
    // =========================

    if (
      product.stock <= 0 ||
      quantity <= 0
    ) {

      delete cart[id]

      return
    }


    const itemTotal =
      product.price *
      quantity


    subtotal +=
      itemTotal


    const item =
      document.createElement(
        'div'
      )

    item.className =
      'cart-page-item'


    item.innerHTML = `

      <img
        src="${product.image}"
        class="cart-page-image"
        alt="${product.name}"
      >

      <div class="cart-page-info">

        <h3>
          ${product.name}
        </h3>

        <p>
          Rs. ${product.price}
          ${product.unit}
        </p>

        <p>
          Stock available:
          ${product.stock}
        </p>

        <div class="cart-page-quantity">

          <button
            class="quantity-btn"
            data-action="decrease"
            data-id="${product.id}"
          >
            −
          </button>

          <span>
            ${quantity}
          </span>

          <button
            class="quantity-btn"
            data-action="increase"
            data-id="${product.id}"
            ${quantity >= product.stock
              ? 'disabled'
              : ''}
          >
            +
          </button>

        </div>

      </div>

      <strong
        class="cart-page-price"
      >
        Rs. ${itemTotal}
      </strong>

      <button
        class="cart-page-remove"
        data-action="remove"
        data-id="${product.id}"
      >
        🗑️
      </button>

    `

    cartItems.appendChild(item)

  })


  // =========================
  // SAVE CORRECTED CART
  // =========================

  saveCart()


  // =========================
  // TOTAL
  // =========================

  const delivery =
    subtotal > 0
      ? 100
      : 0

  const total =
    subtotal +
    delivery


  subtotalElement.textContent =
    `Rs. ${subtotal}`

  deliveryElement.textContent =
    `Rs. ${delivery}`

  totalElement.textContent =
    `Rs. ${total}`
}


// =========================
// CART BUTTON ACTIONS
// =========================

cartItems.addEventListener(
  'click',
  event => {

    const button =
      (
        event.target as HTMLElement
      ).closest<HTMLButtonElement>(
        'button'
      )

    if (!button) {
      return
    }


    const action =
      button.dataset.action

    const id =
      button.dataset.id


    if (
      !action ||
      !id
    ) {

      return
    }


    const product =
      products.find(
        item =>
          item.id === id
      )


    if (!product) {
      return
    }


    // =========================
    // INCREASE
    // =========================

    if (
      action === 'increase'
    ) {

      const currentQuantity =
        cart[id] || 0


      if (
        currentQuantity >=
        product.stock
      ) {

        alert(
          `Sorry! Only ${product.stock} item(s) available.`
        )

        return
      }


      cart[id] =
        currentQuantity + 1
    }


    // =========================
    // DECREASE
    // =========================

    if (
      action === 'decrease'
    ) {

      cart[id] =
        (cart[id] || 0) - 1


      if (
        cart[id] <= 0
      ) {

        delete cart[id]
      }
    }


    // =========================
    // REMOVE
    // =========================

    if (
      action === 'remove'
    ) {

      delete cart[id]
    }


    saveCart()

    renderCart()
  }
)


// =========================
// CHECKOUT
// =========================

const checkoutButton =
  document.querySelector<HTMLButtonElement>(
    '#checkout-button'
  )

if (checkoutButton) {

  checkoutButton.addEventListener(
    'click',
    () => {

      /*
       * Latest localStorage cart load karein
       * before checkout.
       */
      loadCartFromStorage()

      if (
        Object.keys(cart).length === 0
      ) {

        alert(
          'Your cart is empty.'
        )

        return
      }

      window.location.href =
        '/checkout.html'
    }
  )
}


// =========================
// PAGE SHOW
// =========================

/*
 * Jab user checkout/thank-you se
 * back karke cart page par aaye,
 * localStorage se latest cart dobara load hoga.
 */
window.addEventListener(
  'pageshow',
  () => {

    loadCartFromStorage()

    /*
     * Products already loaded hon to
     * immediately fresh cart render karein.
     */
    if (
      products.length > 0
    ) {

      renderCart()
    }
  }
)


// =========================
// STORAGE CHANGE
// =========================

/*
 * Agar kisi doosri browser tab/window
 * se grocery-cart change ho,
 * cart page bhi update ho jayega.
 */
window.addEventListener(
  'storage',
  event => {

    if (
      event.key === 'grocery-cart'
    ) {

      loadCartFromStorage()

      if (
        products.length > 0
      ) {

        renderCart()
      }
    }
  }
)


// =========================
// START
// =========================

loadProducts()