
const isLoggedIn =
  localStorage.getItem('groceryLoggedIn')

if (isLoggedIn !== 'true') {

  localStorage.setItem(
    'loginReturnUrl',
    window.location.pathname +
    window.location.search
  )

  window.location.href =
    '/login.html'
}


// =========================
// PRODUCT TYPE
// =========================

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

const savedCart =
  localStorage.getItem('grocery-cart')

const cart: Record<string, number> =
  savedCart
    ? JSON.parse(savedCart)
    : {}


// =========================
// CHECKOUT ELEMENTS
// =========================

const checkoutItems =
  document.querySelector<HTMLDivElement>(
    '#checkout-items'
  )!

const subtotalElement =
  document.querySelector<HTMLElement>(
    '#checkout-subtotal'
  )!

const deliveryElement =
  document.querySelector<HTMLElement>(
    '#checkout-delivery'
  )!

const totalElement =
  document.querySelector<HTMLElement>(
    '#checkout-total'
  )!


// =========================
// LOAD PRODUCTS
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

    renderCheckout()

  } catch (error) {

    console.error(
      'Products load error:',
      error
    )

    checkoutItems.innerHTML = `
      <div class="empty-cart">

        <h3>
          Products load nahi ho rahe.
        </h3>

        <p>
          Please check backend.
        </p>

      </div>
    `
  }
}


// =========================
// RENDER CHECKOUT
// =========================

function renderCheckout() {

  checkoutItems.innerHTML = ''

  let subtotal = 0

  const cartIds =
    Object.keys(cart)


  if (cartIds.length === 0) {

    checkoutItems.innerHTML = `
      <div class="empty-cart">

        <h3>
          Your cart is empty
        </h3>

        <p>
          Please add products before checkout.
        </p>

      </div>
    `

    subtotalElement.textContent =
      'Rs. 0'

    deliveryElement.textContent =
      'Rs. 0'

    totalElement.textContent =
      'Rs. 0'

    return
  }


  cartIds.forEach(id => {

    const product =
      products.find(
        item =>
          item.id === id
      )

    if (!product) return

    const quantity =
      cart[id]

    const itemTotal =
      product.price * quantity

    subtotal +=
      itemTotal

    const item =
      document.createElement(
        'div'
      )

    item.className =
      'checkout-product'

    item.innerHTML = `

      <img
        src="${product.image}"
        class="checkout-product-image"
        alt="${product.name}"
      >

      <div class="checkout-product-info">

        <h3>
          ${product.name}
        </h3>

        <p>
          Rs. ${product.price}
          ${product.unit}
        </p>

        <span>
          Quantity: ${quantity}
        </span>

        <small>
          Stock available:
          ${product.stock}
        </small>

      </div>

      <strong>
        Rs. ${itemTotal}
      </strong>

    `

    checkoutItems.appendChild(
      item
    )

  })


  const delivery =
    100

  const total =
    subtotal + delivery


  subtotalElement.textContent =
    `Rs. ${subtotal}`

  deliveryElement.textContent =
    `Rs. ${delivery}`

  totalElement.textContent =
    `Rs. ${total}`
}


// =========================
// CUSTOMER ACCOUNT DETAILS
// =========================

const savedUser =
  localStorage.getItem(
    'groceryUser'
  )

const loggedIn =
  localStorage.getItem(
    'groceryLoggedIn'
  )


if (
  savedUser &&
  loggedIn === 'true'
) {

  const user =
    JSON.parse(savedUser)


  const nameInput =
    document.querySelector<HTMLInputElement>(
      '#customer-name'
    )


  const phoneInput =
    document.querySelector<HTMLInputElement>(
      '#customer-phone'
    )


  const addressInput =
    document.querySelector<HTMLTextAreaElement>(
      '#customer-address'
    )


  const cityInput =
    document.querySelector<HTMLInputElement>(
      '#customer-city'
    )


  if (
    nameInput &&
    user.name
  ) {

    nameInput.value =
      user.name
  }


  if (
    phoneInput &&
    user.phone
  ) {

    phoneInput.value =
      user.phone
  }


  const savedAddress =
    localStorage.getItem(
      'customer-address'
    )


  const savedCity =
    localStorage.getItem(
      'customer-city'
    )


  if (
    addressInput &&
    savedAddress
  ) {

    addressInput.value =
      savedAddress
  }


  if (
    cityInput &&
    savedCity
  ) {

    cityInput.value =
      savedCity
  }

}


// =========================
// PLACE ORDER
// =========================

const placeOrderButton =
  document.querySelector<HTMLButtonElement>(
    '#place-order-button'
  )!


placeOrderButton.addEventListener(
  'click',
  async () => {

    const name =
      document
        .querySelector<HTMLInputElement>(
          '#customer-name'
        )!
        .value
        .trim()


    const phone =
      document
        .querySelector<HTMLInputElement>(
          '#customer-phone'
        )!
        .value
        .trim()


    const address =
      document
        .querySelector<HTMLTextAreaElement>(
          '#customer-address'
        )!
        .value
        .trim()


    const city =
      document
        .querySelector<HTMLInputElement>(
          '#customer-city'
        )!
        .value
        .trim()


    // =========================
    // CUSTOMER VALIDATION
    // =========================

    if (!name) {

      alert(
        'Please enter your full name.'
      )

      return
    }


    if (!phone) {

      alert(
        'Please enter your mobile number.'
      )

      return
    }


    if (!address) {

      alert(
        'Please enter your delivery address.'
      )

      return
    }


    if (!city) {

      alert(
        'Please enter your city.'
      )

      return
    }


    if (
      Object.keys(cart).length === 0
    ) {

      alert(
        'Your cart is empty.'
      )

      return
    }


    // =========================
    // FINAL STOCK CHECK
    // =========================

    for (
      const [id, quantity]
      of Object.entries(cart)
    ) {

      const product =
        products.find(
          item =>
            item.id === id
        )


      if (!product) {

        alert(
          'A product in your cart is no longer available.'
        )

        return
      }


      if (
        Number(quantity) >
        Number(product.stock)
      ) {

        alert(
          `${product.name} has only ${product.stock} item(s) available. Please update your cart.`
        )

        return
      }


      if (
        Number(product.stock) <= 0
      ) {

        alert(
          `${product.name} is currently out of stock.`
        )

        return
      }

    }


    // =========================
    // PAYMENT
    // =========================

    const payment =
      document.querySelector<HTMLInputElement>(
        'input[name="payment"]:checked'
      )?.value || 'cod'


    // =========================
    // ORDER NUMBER
    // =========================

    // Backend N2N order number generate karega
    const orderNumber = ''


    // =========================
    // TOTAL
    // =========================

    const subtotal =
      Object.entries(cart)
        .reduce(
          (
            sum,
            [id, quantity]
          ) => {

            const product =
              products.find(
                item =>
                  item.id === id
              )


            if (!product) {
              return sum
            }


            return (
              sum +
              product.price *
              quantity
            )

          },
          0
        )


    const delivery =
      100

    const total =
      subtotal + delivery


    // =========================
    // SAVE CUSTOMER INFORMATION
    // =========================

    localStorage.setItem(
      'customer-name',
      name
    )

    localStorage.setItem(
      'customer-phone',
      phone
    )

    localStorage.setItem(
      'customer-address',
      address
    )

    localStorage.setItem(
      'customer-city',
      city
    )

    localStorage.setItem(
      'payment-method',
      payment
    )

    localStorage.setItem(
      'order-total',
      total.toString()
    )


    // =========================
    // DISABLE BUTTON
    // =========================

    placeOrderButton.disabled =
      true

    placeOrderButton.textContent =
      'Placing Order...'


    try {

      const response =
        await fetch(
          'http://localhost:5000/api/orders',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({

              orderNumber,

              name,

              phone,

              address,

              city,

              paymentMethod:
                payment,

              items:
                Object.entries(
                  cart
                ).map(
                  (
                    [id, quantity]
                  ) => {

                    const product =
                      products.find(
                        item =>
                          item.id === id
                      )

                    return {

                      id,

                      name:
                        product?.name ||
                        id,

                      quantity

                    }

                  }
                ),

              total

            })

          }
        )


      const result =
        await response.json()


      // =========================
      // SERVER STOCK ERROR
      // =========================

      if (
        !response.ok ||
        !result.success
      ) {

        alert(
          result.message ||
          'Order could not be placed. Please try again.'
        )


        placeOrderButton.disabled =
          false

        placeOrderButton.textContent =
          'Place Order'

        return
      }


      // =========================
      // SAVE ACTUAL N2N ORDER NUMBER
      // =========================

      localStorage.setItem(
        'order-number',
        result.orderNumber
      )


      // =========================
      // ORDER SUCCESS
      // =========================

      localStorage.removeItem(
        'grocery-cart'
      )


      window.location.href =
        '/thank-you.html'


    } catch (error) {

      console.error(
        'Order submission failed:',
        error
      )


      alert(
        'Could not connect to the server. Please make sure the backend is running.'
      )


      placeOrderButton.disabled =
        false

      placeOrderButton.textContent =
        'Place Order'

    }

  }
)


// =========================
// START
// =========================

loadProducts()