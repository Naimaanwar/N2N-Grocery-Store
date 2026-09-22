import './style.css'

import appleImg from './assets/apple.png'
import bananaImg from './assets/banana.png'
import mangoImg from './assets/mango.png'
import guavaImg from './assets/guava.png'
import strawberryImg from './assets/strawberry.png'
import milkImg from './assets/milk.png'
import breadImg from './assets/bread.png'

const isLoggedIn =
  localStorage.getItem('groceryLoggedIn')

if (isLoggedIn !== 'true') {
  window.location.href = '/login.html'
}

type Product = {
  id: string
  name: string
  price: number
  unit: string
  category: string
  image: string
  stock: number
}

const imageMap: Record<string, string> = {
  'apple.png': appleImg,
  'banana.png': bananaImg,
  'mango.png': mangoImg,
  'guava.png': guavaImg,
  'strawberry.png': strawberryImg,
  'milk.png': milkImg,
  'bread.png': breadImg
}

let productsData: Product[] = []

const savedCart =
  localStorage.getItem('grocery-cart')

const cart: Record<string, number> =
  savedCart
    ? JSON.parse(savedCart)
    : {}

/* =========================
   LOAD PRODUCTS FROM MYSQL
========================= */

async function loadProducts() {

  try {

   const API_URL = import.meta.env.VITE_API_URL
const response =
  await fetch(
    `${API_URL}/api/products`
  )

    if (!response.ok) {
      throw new Error(
        'Products fetch failed'
      )
    }

    const products =
      await response.json()

    productsData =
      products.map(
        (product: any) => ({
          id: product.product_code,
          name: product.name,
          price: Number(product.price),
          unit: product.unit || '',
          category:
            product.category.toLowerCase(),
          image:
            imageMap[product.image] ||
            product.image,
          stock: Number(product.stock)
        })
      )

    renderProducts()

  } catch (error) {

    console.error(
      'Products load error:',
      error
    )

    const productsArea =
      document.querySelector<HTMLElement>(
        '.products'
      )

    if (productsArea) {

      productsArea.innerHTML = `
        <p style="
          width: 100%;
          text-align: center;
          padding: 30px;
        ">
          Products load nahi ho rahe.
          Please check backend.
        </p>
      `

    }

  }

}

/* =========================
   PAGE HTML
========================= */

document.querySelector<HTMLDivElement>(
  '#app'
)!.innerHTML = `
  <div class="app">

    <header class="header">

      <h1>🛒 Grocery Store</h1>

      <p>
        Fresh groceries delivered to your door
      </p>

      <div id="account-area"></div>

      <button
        id="cart-button"
        class="cart"
      >
        🛍️ Cart:
        <span id="cart-count">0</span>
      </button>
      <div id="floating-cart" class="floating-cart">

  <div class="floating-cart-info">
    <span class="floating-cart-icon">🛒</span>

    <div>
      <strong>
        <span id="floating-cart-count">0</span> Items
      </strong>

      <small>
        Added to cart
      </small>
    </div>
  </div>

  <button
    id="floating-cart-button"
    class="floating-cart-button"
  >
    View Cart →
  </button>

</div>
    </header>

    <div class="shop-controls">

      <input
        type="text"
        id="search"
        placeholder="🔍 Search groceries..."
      />

      <div class="categories">

        <button
          class="category active"
          data-category="all"
        >
          All
        </button>

        <button
          class="category"
          data-category="fruits"
        >
          🍎 Fruits
        </button>

        <button
          class="category"
          data-category="vegetables"
        >
          🥦 Vegetables
        </button>

        <button
          class="category"
          data-category="dairy"
        >
          🥛 Dairy
        </button>

        <button
          class="category"
          data-category="bakery"
        >
          🍞 Bakery
        </button>

      </div>

    </div>

    <main class="products">
      <p style="
        width: 100%;
        text-align: center;
        padding: 30px;
      ">
        Loading products...
      </p>
    </main>

  </div>
`

/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {

  const productsArea =
    document.querySelector<HTMLElement>(
      '.products'
    )

  if (!productsArea) return

  productsArea.innerHTML =
    productsData
      .map(product => {

        const outOfStock =
          Number(product.stock) <= 0

        return `
          <div
            class="product"
            data-category="${product.category}"
          >

            <img
              src="${product.image}"
              class="product-image"
              alt="${product.name}"
            >

            <h2>
              ${product.name}
            </h2>

            <p>
              Rs. ${product.price} ${product.unit}
            </p>

            <p>
              ${
                outOfStock
                  ? '❌ Out of Stock'
                  : `Stock: ${product.stock}`
              }
            </p>

            <button
              class="add-cart"
              data-id="${product.id}"
              ${outOfStock ? 'disabled' : ''}
            >
              ${
                outOfStock
                  ? 'Out of Stock'
                  : 'Add to Cart'
              }
            </button>

          </div>
        `
      })
      .join('')


  document
    .querySelectorAll<HTMLButtonElement>(
      '.add-cart'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const id =
            button.dataset.id

          if (!id) return

          const product =
            productsData.find(
              product =>
                product.id === id
            )

          if (!product) return

          // =========================
          // CHECK STOCK
          // =========================

          const currentQuantity =
            cart[id] || 0

          if (
            currentQuantity >=
            Number(product.stock)
          ) {

            alert(
              `Sorry! Only ${product.stock} item(s) available.`
            )

            return
          }


          // =========================
          // ADD TO CART
          // =========================

          cart[id] =
            currentQuantity + 1

          updateCartCount()

        }
      )

    })

}
/* =========================
   ACCOUNT LOGIN / LOGOUT
========================= */

const accountArea =
  document.querySelector<HTMLDivElement>(
    '#account-area'
  )!

const savedUser =
  localStorage.getItem('groceryUser')

const loggedIn =
  localStorage.getItem('groceryLoggedIn')

if (
  savedUser &&
  loggedIn === 'true'
) {

  const user =
    JSON.parse(savedUser)

  accountArea.innerHTML = `
    <div class="account-box">

      <span>
        👤 Welcome, ${user.name}
      </span>

      <a href="/my-orders.html">
        📦 My Orders
      </a>

      <button id="logout-button">
        Logout
      </button>

    </div>
  `

  document
    .querySelector<HTMLButtonElement>(
      '#logout-button'
    )!
    .addEventListener(
      'click',
      () => {

        localStorage.removeItem(
          'groceryLoggedIn'
        )

        window.location.href =
          '/login.html'

      }
    )

} else {

  accountArea.innerHTML = ''

}

/* =========================
   CART
========================= */

const cartCount =
  document.querySelector<HTMLSpanElement>(
    '#cart-count'
  )!
const floatingCart =
  document.querySelector<HTMLDivElement>(
    '#floating-cart'
  )!

const floatingCartCount =
  document.querySelector<HTMLSpanElement>(
    '#floating-cart-count'
  )!

const floatingCartButton =
  document.querySelector<HTMLButtonElement>(
    '#floating-cart-button'
  )!
function updateCartCount() {

  let totalItems = 0

  Object.values(cart).forEach(
    quantity => {

      totalItems += quantity

    }
  )

  cartCount.textContent =
    totalItems.toString()

  floatingCartCount.textContent =
    totalItems.toString()

  if (totalItems > 0) {

    floatingCart.classList.add(
      'show'
    )

  } else {

    floatingCart.classList.remove(
      'show'
    )

  }

  localStorage.setItem(
    'grocery-cart',
    JSON.stringify(cart)
  )
}

document
  .querySelector<HTMLButtonElement>(
    '#cart-button'
  )!
  .addEventListener(
    'click',
    () => {

      window.location.href =
        '/cart.html'

    }
  )
floatingCartButton.addEventListener(
  'click',
  () => {

    window.location.href =
      '/cart.html'

  }
)
/* =========================
   SEARCH
========================= */

const searchInput =
  document.querySelector<HTMLInputElement>(
    '#search'
  )!

const categoryButtons =
  document.querySelectorAll<HTMLButtonElement>(
    '.category'
  )

function filterProducts() {

  const searchText =
    searchInput.value
      .toLowerCase()
      .trim()

  const activeButton =
    document.querySelector<HTMLButtonElement>(
      '.category.active'
    )

  const activeCategory =
    activeButton?.dataset.category ||
    'all'

  const productCards =
    document.querySelectorAll<HTMLDivElement>(
      '.product'
    )

  productCards.forEach(
    product => {

      const productName =
        product.textContent
          ?.toLowerCase() || ''

      const productCategory =
        product.dataset.category || ''

      const matchesSearch =
        productName.includes(
          searchText
        )

      const matchesCategory =
        activeCategory === 'all' ||
        productCategory ===
          activeCategory

      product.style.display =
        matchesSearch &&
        matchesCategory
          ? 'flex'
          : 'none'

    }
  )
}

searchInput.addEventListener(
  'input',
  filterProducts
)

categoryButtons.forEach(
  button => {

    button.addEventListener(
      'click',
      () => {

        categoryButtons.forEach(
          btn => {
            btn.classList.remove(
              'active'
            )
          }
        )

        button.classList.add(
          'active'
        )

        filterProducts()

      }
    )

  }
)

/* =========================
   START
========================= */

updateCartCount()

loadProducts()