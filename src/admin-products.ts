
import appleImg from './assets/apple.png'
import bananaImg from './assets/banana.png'
import mangoImg from './assets/mango.png'
import guavaImg from './assets/guava.png'
import strawberryImg from './assets/strawberry.png'
import milkImg from './assets/milk.png'
import breadImg from './assets/bread.png'

// =========================
// API URL
// =========================

const API_URL = import.meta.env.VITE_API_URL

// =========================
// PRODUCT IMAGES
// =========================

const imageMap: Record<string, string> = {
  'apple.png': appleImg,
  'banana.png': bananaImg,
  'mango.png': mangoImg,
  'guava.png': guavaImg,
  'strawberry.png': strawberryImg,
  'milk.png': milkImg,
  'bread.png': breadImg
}

// =========================
// ADD PRODUCT ELEMENTS
// =========================

const productNameInput =
  document.querySelector('#product-name') as HTMLInputElement

const productPriceInput =
  document.querySelector('#product-price') as HTMLInputElement

const productCategoryInput =
  document.querySelector('#product-category') as HTMLSelectElement

const productUnitInput =
  document.querySelector('#product-unit') as HTMLSelectElement

const productImageInput =
  document.querySelector('#product-image') as HTMLInputElement

const productStockInput =
  document.querySelector('#product-stock') as HTMLInputElement

const addProductButton =
  document.querySelector('#add-product-button') as HTMLButtonElement

const productsList =
  document.querySelector('#admin-products-list') as HTMLDivElement

// =========================
// EDIT MODAL
// =========================

const editProductModal =
  document.querySelector('#edit-product-modal') as HTMLDivElement

const closeEditProductModal =
  document.querySelector('#close-edit-product-modal') as HTMLSpanElement

const editProductName =
  document.querySelector('#edit-product-name') as HTMLInputElement

const editProductPrice =
  document.querySelector('#edit-product-price') as HTMLInputElement

const editProductCategory =
  document.querySelector('#edit-product-category') as HTMLSelectElement

const editProductUnit =
  document.querySelector('#edit-product-unit') as HTMLSelectElement

const editProductImage =
  document.querySelector('#edit-product-image') as HTMLInputElement

const editProductStock =
  document.querySelector('#edit-product-stock') as HTMLInputElement

const saveEditProductButton =
  document.querySelector('#save-edit-product-button') as HTMLButtonElement

let editingProductId: number | null = null

// =========================
// READ IMAGE FILE
// =========================

function readImageFile(
  file: File
): Promise<string> {

  return new Promise((resolve, reject) => {

    const reader = new FileReader()

    reader.onload = () => {

      resolve(
        String(reader.result)
      )

    }

    reader.onerror = () => {

      reject(
        new Error('Image read failed')
      )

    }

    reader.readAsDataURL(file)

  })
}

// =========================
// LOAD PRODUCTS
// =========================

async function loadProducts() {

  try {

    const response =
      await fetch(
        `${API_URL}/api/products`
      )

    if (!response.ok) {

      throw new Error(
        'Products load failed'
      )

    }

    const products =
      await response.json()

    renderProducts(products)

  } catch (error) {

    console.error(error)

    productsList.innerHTML = `
      <p>
        Products load nahi ho sake.
      </p>
    `
  }
}

// =========================
// GET PRODUCT IMAGE
// =========================

function getProductImage(
  image: string
): string {

  return (
    imageMap[image] ||
    image ||
    ''
  )
}

// =========================
// RENDER PRODUCTS
// =========================

function renderProducts(
  products: any[]
) {

  if (products.length === 0) {

    productsList.innerHTML = `
      <p>
        No products found.
      </p>
    `

    return
  }

  productsList.innerHTML =
    products
      .map(product => {

        const stock =
          Number(product.stock)

        const outOfStock =
          stock <= 0

        const image =
          getProductImage(
            product.image
          )

        return `
          <div class="admin-product-card">

            <img
              src="${image}"
              class="admin-product-image"
              alt="${product.name}"
            >

            <h3>
              ${product.name}
            </h3>

            <div class="admin-product-info">

              <p>
                <strong>Price:</strong>
                Rs. ${Number(product.price).toFixed(2)}
              </p>

              <p>
                <strong>Category:</strong>
                ${product.category}
              </p>

              <p>
                <strong>Unit:</strong>
                ${product.unit || 'No Unit'}
              </p>

              <p class="${
                outOfStock
                  ? 'stock-out'
                  : 'stock-available'
              }">

                <strong>Stock:</strong>

                ${
                  outOfStock
                    ? '❌ Out of Stock'
                    : stock
                }

              </p>

            </div>

            <div class="admin-product-actions">

              <button
                class="edit-product-button"
                data-id="${product.id}"
              >
                ✏️ Edit
              </button>

              <button
                class="delete-product-button"
                data-id="${product.id}"
              >
                🗑️ Delete
              </button>

            </div>

          </div>
        `
      })
      .join('')

  // =========================
  // EDIT BUTTONS
  // =========================

  document
    .querySelectorAll(
      '.edit-product-button'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const id =
            Number(
              (
                button as HTMLButtonElement
              ).dataset.id
            )

          const product =
            products.find(
              item =>
                Number(item.id) === id
            )

          if (product) {

            openEditModal(
              product
            )

          }

        }
      )

    })

  // =========================
  // DELETE BUTTONS
  // =========================

  document
    .querySelectorAll(
      '.delete-product-button'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const id =
            Number(
              (
                button as HTMLButtonElement
              ).dataset.id
            )

          deleteProduct(id)

        }
      )

    })
}

// =========================
// OPEN EDIT MODAL
// =========================

function openEditModal(
  product: any
) {

  editingProductId =
    Number(product.id)

  editProductName.value =
    product.name || ''

  editProductPrice.value =
    String(product.price || 0)

  editProductCategory.value =
    product.category || 'Fruits'

  editProductUnit.value =
    product.unit || ''

  editProductStock.value =
    String(
      product.stock ?? 0
    )

  editProductImage.value = ''

  editProductModal.style.display =
    'block'
}

// =========================
// CLOSE EDIT MODAL
// =========================

closeEditProductModal.addEventListener(
  'click',
  () => {

    editProductModal.style.display =
      'none'

    editingProductId = null

    editProductImage.value = ''

  }
)

// =========================
// CLOSE OUTSIDE MODAL
// =========================

window.addEventListener(
  'click',
  (event) => {

    if (
      event.target ===
      editProductModal
    ) {

      editProductModal.style.display =
        'none'

      editingProductId = null

      editProductImage.value = ''

    }

  }
)

// =========================
// SAVE EDITED PRODUCT
// =========================

saveEditProductButton.addEventListener(
  'click',
  async () => {

    if (
      editingProductId === null
    ) {

      return

    }

    const name =
      editProductName.value.trim()

    const price =
      Number(
        editProductPrice.value
      )

    const category =
      editProductCategory.value

    const unit =
      editProductUnit.value

    const stock =
      Number(
        editProductStock.value
      )

    const selectedFile =
      editProductImage.files?.[0]

    if (
      !name ||
      price < 0 ||
      stock < 0
    ) {

      alert(
        'Please enter valid product information.'
      )

      return
    }

    try {

      let image = ''

      if (selectedFile) {

        if (
          !selectedFile.type.startsWith(
            'image/'
          )
        ) {

          alert(
            'Please select a valid image file.'
          )

          return
        }

        image =
          await readImageFile(
            selectedFile
          )
      }

      const response =
        await fetch(
          `${API_URL}/api/products/${editingProductId}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({

              name,
              price,
              category,
              stock,
              unit,

              image,

              imageName:
                selectedFile
                  ? selectedFile.name
                  : ''

            })
          }
        )

      if (!response.ok) {

        const errorData =
          await response.json()
            .catch(() => null)

        throw new Error(
          errorData?.message ||
          'Product update failed'
        )
      }

      alert(
        'Product updated successfully! ✅'
      )

      editProductModal.style.display =
        'none'

      editingProductId = null

      editProductImage.value = ''

      await loadProducts()

    } catch (error) {

      console.error(error)

      alert(
        'Product update nahi ho saka.'
      )
    }

  }
)

// =========================
// ADD PRODUCT
// =========================

addProductButton.addEventListener(
  'click',
  async () => {

    const name =
      productNameInput.value.trim()

    const price =
      Number(
        productPriceInput.value
      )

    const category =
      productCategoryInput.value

    const unit =
      productUnitInput.value

    const stock =
      Number(
        productStockInput.value
      )

    const selectedFile =
      productImageInput.files?.[0]

    if (
      !name ||
      price < 0 ||
      stock < 0
    ) {

      alert(
        'Please enter valid product information.'
      )

      return
    }

    if (!selectedFile) {

      alert(
        'Please choose a product image.'
      )

      return
    }

    if (
      !selectedFile.type.startsWith(
        'image/'
      )
    ) {

      alert(
        'Please select a valid image file.'
      )

      return
    }

    const productCode =
      name
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          '-'
        )
        .replace(
          /^-|-$/g,
          ''
        )

    try {

      const image =
        await readImageFile(
          selectedFile
        )

      const response =
        await fetch(
          `${API_URL}/api/products`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({

              name,
              price,
              category,

              image,

              imageName:
                selectedFile.name,

              stock,

              product_code:
                productCode,

              unit

            })
          }
        )

      if (!response.ok) {

        const errorData =
          await response.json()
            .catch(() => null)

        throw new Error(
          errorData?.message ||
          'Product add failed'
        )
      }

      alert(
        'Product added successfully! ✅'
      )

      productNameInput.value = ''
      productPriceInput.value = ''
      productStockInput.value = '100'
      productImageInput.value = ''

      await loadProducts()

    } catch (error) {

      console.error(error)

      alert(
        'Product add nahi ho saka.'
      )
    }

  }
)

// =========================
// DELETE PRODUCT
// =========================

async function deleteProduct(
  id: number
) {

  const confirmed =
    confirm(
      'Kya aap is product ko delete karna chahte hain?'
    )

  if (!confirmed) {

    return
  }

  try {

    const response =
      await fetch(
        `${API_URL}/api/products/${id}`,
        {
          method: 'DELETE'
        }
      )

    if (!response.ok) {

      throw new Error(
        'Product delete failed'
      )
    }

    alert(
      'Product deleted successfully! ✅'
    )

    await loadProducts()

  } catch (error) {

    console.error(error)

    alert(
      'Product delete nahi ho saka.'
    )
  }
}

// =========================
// INITIAL LOAD
// =========================

loadProducts()
