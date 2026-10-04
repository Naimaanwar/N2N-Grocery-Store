import * as XLSX from 'xlsx'

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

const API_URL =
  import.meta.env.VITE_API_URL ||
  (
    window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : window.location.origin
  )

// =========================
// ADMIN SESSION
// =========================

const adminSessionToken =
  localStorage.getItem('adminSessionToken')

const adminLoggedIn =
  localStorage.getItem('adminLoggedIn')

if (
  adminLoggedIn !== 'true' ||
  !adminSessionToken
) {
  localStorage.setItem(
    'loginReturnUrl',
    window.location.pathname +
      window.location.search
  )

  window.location.href =
    '/admin/admin-login.html'

  throw new Error(
    'Admin session required'
  )
}

// =========================
// SECURE ADMIN FETCH
// =========================

async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {

  const token =
    localStorage.getItem(
      'adminSessionToken'
    )

  if (!token) {

    localStorage.removeItem(
      'adminLoggedIn'
    )

    window.location.href =
      '/admin/admin-login.html'

    throw new Error(
      'Admin session expired'
    )
  }

  const headers =
    new Headers(
      options.headers || {}
    )

  headers.set(
    'Authorization',
    `Bearer ${token}`
  )

  const response =
    await fetch(
      url,
      {
        ...options,
        headers
      }
    )

  if (
    response.status === 401 ||
    response.status === 403
  ) {

    localStorage.removeItem(
      'adminLoggedIn'
    )

    localStorage.removeItem(
      'adminSessionToken'
    )

    alert(
      'Admin session expired. Please login again.'
    )

    window.location.href =
      '/admin/admin-login.html'

    throw new Error(
      'Unauthorized admin request'
    )
  }

  return response
}

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
  document.querySelector(
    '#product-name'
  ) as HTMLInputElement

const productPriceInput =
  document.querySelector(
    '#product-price'
  ) as HTMLInputElement

const productCategoryInput =
  document.querySelector(
    '#product-category'
  ) as HTMLSelectElement

const productUnitInput =
  document.querySelector(
    '#product-unit'
  ) as HTMLSelectElement

const productImageInput =
  document.querySelector(
    '#product-image'
  ) as HTMLInputElement

const productStockInput =
  document.querySelector(
    '#product-stock'
  ) as HTMLInputElement

const addProductButton =
  document.querySelector(
    '#add-product-button'
  ) as HTMLButtonElement

const productsList =
  document.querySelector(
    '#admin-products-list'
  ) as HTMLDivElement

// =========================
// EDIT MODAL
// =========================

const editProductModal =
  document.querySelector(
    '#edit-product-modal'
  ) as HTMLDivElement

const closeEditProductModal =
  document.querySelector(
    '#close-edit-product-modal'
  ) as HTMLSpanElement

const editProductName =
  document.querySelector(
    '#edit-product-name'
  ) as HTMLInputElement

const editProductPrice =
  document.querySelector(
    '#edit-product-price'
  ) as HTMLInputElement

const editProductCategory =
  document.querySelector(
    '#edit-product-category'
  ) as HTMLSelectElement

const editProductUnit =
  document.querySelector(
    '#edit-product-unit'
  ) as HTMLSelectElement

const editProductImage =
  document.querySelector(
    '#edit-product-image'
  ) as HTMLInputElement

const editProductStock =
  document.querySelector(
    '#edit-product-stock'
  ) as HTMLInputElement

const saveEditProductButton =
  document.querySelector(
    '#save-edit-product-button'
  ) as HTMLButtonElement

let editingProductId:
  number | null = null

// =========================
// READ IMAGE FILE
// =========================

function readImageFile(
  file: File
): Promise<string> {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader()

      reader.onload = () => {

        resolve(
          String(
            reader.result
          )
        )
      }

      reader.onerror = () => {

        reject(
          new Error(
            'Image read failed'
          )
        )
      }

      reader.readAsDataURL(file)
    }
  )
}

// =========================
// IMAGE URL TO BASE64
// =========================

async function imageUrlToBase64(
  url: string
): Promise<string> {

  const response =
    await fetch(url)

  if (!response.ok) {

    throw new Error(
      'Image could not be loaded'
    )
  }

  const blob =
    await response.blob()

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader()

      reader.onloadend = () => {

        resolve(
          String(
            reader.result
          )
        )
      }

      reader.onerror = () => {

        reject(
          new Error(
            'Image conversion failed'
          )
        )
      }

      reader.readAsDataURL(blob)
    }
  )
}

// =========================
// PRODUCT CODE
// =========================

function createProductCode(
  name: string
): string {

  return name
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-|-$/g,
      ''
    )
}

// =========================
// GET PRODUCT IMAGE
// =========================

function getProductImage(
  image: string
): string {

  if (!image) {
    return ''
  }

  const normalized =
    String(image)
      .split('\\')
      .pop()
      ?.split('/')
      .pop()
      ?.toLowerCase() || ''

  return (
    imageMap[normalized] ||
    image ||
    ''
  )
}

// =========================
// NORMALIZE EXCEL VALUE
// =========================

function getExcelValue(
  row: Record<string, any>,
  field: string
): any {

  const keys =
    Object.keys(row)

  const foundKey =
    keys.find(
      key =>
        key
          .trim()
          .toLowerCase() ===
        field.toLowerCase()
    )

  if (!foundKey) {
    return ''
  }

  return row[foundKey]
}

// =========================
// EXCEL IMPORT UI
// =========================

function createExcelImportUI() {

  const existingContainer =
    document.querySelector(
      '#excel-import-container'
    )

  if (existingContainer) {
    return
  }

  const container =
    document.createElement('div')

  container.id =
    'excel-import-container'

  container.style.cssText = `
    margin: 20px 0;
    padding: 18px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background: #f8f8f8;
  `

  container.innerHTML = `

    <div
      style="
        display:flex;
        align-items:center;
        gap:12px;
        flex-wrap:wrap;
      "
    >

      <button
        type="button"
        id="import-excel-button"
        style="
          padding:10px 18px;
          border:none;
          border-radius:7px;
          cursor:pointer;
          font-size:15px;
          font-weight:600;
        "
      >
        📥 Import Excel
      </button>

      <button
        type="button"
        id="download-excel-template-button"
        style="
          padding:10px 18px;
          border:none;
          border-radius:7px;
          cursor:pointer;
          font-size:15px;
          font-weight:600;
        "
      >
        📄 Download Excel Template
      </button>

      <input
        type="file"
        id="excel-file-input"
        accept=".xlsx,.xls"
        style="display:none;"
      >

    </div>

    <p
      style="
        margin:12px 0 0 0;
        font-size:13px;
        color:#666;
      "
    >
      Excel columns:
      <strong>
        Name, Price, Category, Unit, Stock, Image
      </strong>
    </p>

    <p
      style="
        margin:6px 0 0 0;
        font-size:13px;
        color:#555;
      "
    >
      Same product name = Update existing product.
      New product name = Add new product.
    </p>

  `

  if (productsList) {

    productsList.parentElement?.insertBefore(
      container,
      productsList
    )
  }

  const importButton =
    document.querySelector(
      '#import-excel-button'
    ) as HTMLButtonElement

  const excelFileInput =
    document.querySelector(
      '#excel-file-input'
    ) as HTMLInputElement

  const templateButton =
    document.querySelector(
      '#download-excel-template-button'
    ) as HTMLButtonElement

  importButton.addEventListener(
    'click',
    () => {

      excelFileInput.click()
    }
  )

  excelFileInput.addEventListener(
    'change',
    async () => {

      const file =
        excelFileInput.files?.[0]

      if (!file) {
        return
      }

      await importExcelFile(
        file
      )

      excelFileInput.value = ''
    }
  )

  templateButton.addEventListener(
    'click',
    downloadExcelTemplate
  )
}

// =========================
// DOWNLOAD EXCEL TEMPLATE
// =========================

function downloadExcelTemplate() {

  const rows = [

    {
      Name: 'Apple',
      Price: 250,
      Category: 'Fruits',
      Unit: 'kg',
      Stock: 100,
      Image: 'apple.png'
    },

    {
      Name: 'Banana',
      Price: 180,
      Category: 'Fruits',
      Unit: 'dozen',
      Stock: 100,
      Image: 'banana.png'
    },

    {
      Name: 'Mango',
      Price: 300,
      Category: 'Fruits',
      Unit: 'kg',
      Stock: 100,
      Image: 'mango.png'
    },

    {
      Name: 'Guava',
      Price: 220,
      Category: 'Fruits',
      Unit: 'kg',
      Stock: 100,
      Image: 'guava.png'
    },

    {
      Name: 'Strawberry',
      Price: 450,
      Category: 'Fruits',
      Unit: 'box',
      Stock: 100,
      Image: 'strawberry.png'
    },

    {
      Name: 'Milk',
      Price: 220,
      Category: 'Dairy',
      Unit: 'litre',
      Stock: 100,
      Image: 'milk.png'
    },

    {
      Name: 'Brown Bread',
      Price: 180,
      Category: 'Bakery',
      Unit: 'piece',
      Stock: 100,
      Image: 'bread.png'
    }

  ]

  const worksheet =
    XLSX.utils.json_to_sheet(
      rows
    )

  const workbook =
    XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Products'
  )

  XLSX.writeFile(
    workbook,
    'N2N-Grocery-Products-Template.xlsx'
  )
}

// =========================
// IMPORT EXCEL FILE
// =========================

async function importExcelFile(
  file: File
) {

  let loadingMessage:
    HTMLDivElement | null = null

  try {

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase()

    if (
      extension !== 'xlsx' &&
      extension !== 'xls'
    ) {

      alert(
        'Please select an Excel file (.xlsx or .xls).'
      )

      return
    }

    // =========================
    // LOADING
    // =========================

    loadingMessage =
      document.createElement('div')

    loadingMessage.id =
      'excel-import-loading'

    loadingMessage.style.cssText = `
      position:fixed;
      top:20px;
      right:20px;
      z-index:99999;
      padding:15px 20px;
      border-radius:8px;
      background:#222;
      color:white;
      font-size:14px;
      box-shadow:0 4px 15px rgba(0,0,0,0.2);
    `

    loadingMessage.textContent =
      '📥 Excel read ho rahi hai...'

    document.body.appendChild(
      loadingMessage
    )

    // =========================
    // READ EXCEL
    // =========================

    const arrayBuffer =
      await file.arrayBuffer()

    const workbook =
      XLSX.read(
        arrayBuffer,
        {
          type: 'array'
        }
      )

    const firstSheetName =
      workbook.SheetNames[0]

    if (!firstSheetName) {

      throw new Error(
        'Excel sheet not found.'
      )
    }

    const worksheet =
      workbook.Sheets[
        firstSheetName
      ]

    const rows =
      XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: ''
        }
      ) as Record<string, any>[]

    if (
      rows.length === 0
    ) {

      throw new Error(
        'Excel file mein koi product data nahi mila.'
      )
    }

    // =========================
    // LOAD EXISTING PRODUCTS
    // =========================

    const productsResponse =
      await adminFetch(
        `${API_URL}/api/products`
      )

    if (!productsResponse.ok) {

      throw new Error(
        'Existing products load nahi ho sake.'
      )
    }

    const existingProducts =
      await productsResponse.json()

    // =========================
    // COUNTERS
    // =========================

    let addedCount = 0

    let updatedCount = 0

    let skippedCount = 0

    const errors: string[] = []

    // =========================
    // PROCESS ROWS
    // =========================

    for (
      let index = 0;
      index < rows.length;
      index++
    ) {

      const row =
        rows[index]

      const excelRowNumber =
        index + 2

      // =========================
      // GET VALUES
      // =========================

      const name =
        String(
          getExcelValue(
            row,
            'Name'
          ) ?? ''
        ).trim()

      const price =
        Number(
          getExcelValue(
            row,
            'Price'
          )
        )

      const category =
        String(
          getExcelValue(
            row,
            'Category'
          ) ?? ''
        ).trim()

      const unit =
        String(
          getExcelValue(
            row,
            'Unit'
          ) ?? ''
        ).trim()

      const stock =
        Number(
          getExcelValue(
            row,
            'Stock'
          )
        )

      const imageName =
        String(
          getExcelValue(
            row,
            'Image'
          ) ?? ''
        ).trim()

      // =========================
      // VALIDATION
      // =========================

      if (!name) {

        errors.push(
          `Row ${excelRowNumber}: Name missing`
        )

        skippedCount++

        continue
      }

      if (
        Number.isNaN(price) ||
        price < 0
      ) {

        errors.push(
          `Row ${excelRowNumber}: Invalid price`
        )

        skippedCount++

        continue
      }

      if (!category) {

        errors.push(
          `Row ${excelRowNumber}: Category missing`
        )

        skippedCount++

        continue
      }

      if (!unit) {

        errors.push(
          `Row ${excelRowNumber}: Unit missing`
        )

        skippedCount++

        continue
      }

      if (
        Number.isNaN(stock) ||
        stock < 0
      ) {

        errors.push(
          `Row ${excelRowNumber}: Invalid stock`
        )

        skippedCount++

        continue
      }

      // =========================
      // PRODUCT CODE
      // =========================

      const productCode =
        createProductCode(
          name
        )

      if (!productCode) {

        errors.push(
          `Row ${excelRowNumber}: Product name se valid product code nahi ban saka`
        )

        skippedCount++

        continue
      }

      // =========================
      // FIND EXISTING PRODUCT
      // =========================

      const normalizedName =
        name
          .trim()
          .toLowerCase()

      const normalizedCode =
        productCode
          .trim()
          .toLowerCase()

      const existingProduct =
        existingProducts.find(
          (product: any) => {

            const existingName =
              String(
                product.name || ''
              )
                .trim()
                .toLowerCase()

            const existingCode =
              String(
                product.product_code || ''
              )
                .trim()
                .toLowerCase()

            return (
              existingName ===
                normalizedName ||
              existingCode ===
                normalizedCode
            )
          }
        )

      // =========================
      // IMAGE FOR NEW PRODUCT
      // =========================

      let image = ''

      if (
        imageName &&
        !existingProduct
      ) {

        const normalizedImage =
          imageName
            .split('\\')
            .pop()
            ?.split('/')
            .pop()
            ?.toLowerCase() || ''

        const mappedImage =
          imageMap[
            normalizedImage
          ]

        if (mappedImage) {

          try {

            image =
              await imageUrlToBase64(
                mappedImage
              )

          } catch (imageError) {

            console.warn(
              'Image conversion failed:',
              imageError
            )

            image = ''
          }

        } else {

          errors.push(
            `Row ${excelRowNumber}: Image "${imageName}" not found. Product image will be empty.`
          )
        }
      }

      // =========================
      // UPDATE EXISTING PRODUCT
      // =========================

      if (existingProduct) {

        try {

          if (loadingMessage) {

            loadingMessage.textContent =
              `🔄 Updating ${name}... ${index + 1}/${rows.length}`
          }

          const response =
            await adminFetch(
              `${API_URL}/api/products/${existingProduct.id}`,
              {
                method: 'PUT',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body:
                  JSON.stringify({

                    name,

                    price,

                    category,

                    unit,

                    stock

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
              'Product update failed'
            )
          }

          updatedCount++

          // Update local copy
          existingProduct.name =
            name

          existingProduct.price =
            price

          existingProduct.category =
            category

          existingProduct.unit =
            unit

          existingProduct.stock =
            stock

        } catch (error) {

          console.error(
            error
          )

          skippedCount++

          errors.push(
            `Row ${excelRowNumber}: ${name} update nahi ho saka`
          )
        }

        continue
      }

      // =========================
      // ADD NEW PRODUCT
      // =========================

      try {

        if (loadingMessage) {

          loadingMessage.textContent =
            `➕ Adding ${name}... ${index + 1}/${rows.length}`
        }

        const response =
          await adminFetch(
            `${API_URL}/api/products`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  name,

                  price,

                  category,

                  unit,

                  stock,

                  image,

                  imageName,

                  product_code:
                    productCode

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
            'Product add failed'
          )
        }

        const result =
          await response
            .json()
            .catch(
              () => null
            )

        addedCount++

        // Add to local list
        // so duplicate rows in same Excel
        // are detected as existing
        existingProducts.push({

          id:
            result?.product?.id ||
            result?.id ||
            `excel-${index}`,

          name,

          price,

          category,

          unit,

          stock,

          product_code:
            productCode,

          image:
            result?.product?.image ||
            ''

        })

      } catch (error) {

        console.error(
          error
        )

        skippedCount++

        errors.push(
          `Row ${excelRowNumber}: ${name} add nahi ho saka`
        )
      }
    }

    // =========================
    // REMOVE LOADING
    // =========================

    if (loadingMessage) {
      loadingMessage.remove()
      loadingMessage = null
    }

    // =========================
    // REFRESH PRODUCTS
    // =========================

    await loadProducts()

    // =========================
    // RESULT
    // =========================

    let message =
      `Excel import complete! ✅\n\n` +
      `Added: ${addedCount}\n` +
      `Updated: ${updatedCount}\n` +
      `Skipped: ${skippedCount}`

    if (
      errors.length > 0
    ) {

      message +=
        `\n\nDetails:\n` +
        errors
          .slice(0, 15)
          .join('\n')

      if (
        errors.length > 15
      ) {

        message +=
          `\n...and ${
            errors.length - 15
          } more`
      }
    }

    alert(
      message
    )

  } catch (error) {

    console.error(
      'Excel import error:',
      error
    )

    if (loadingMessage) {
      loadingMessage.remove()
    }

    alert(
      error instanceof Error
        ? error.message
        : 'Excel import nahi ho saka.'
    )
  }
}

// =========================
// LOAD PRODUCTS
// =========================

async function loadProducts() {

  try {

    const response =
      await adminFetch(
        `${API_URL}/api/products`
      )

    if (!response.ok) {

      throw new Error(
        'Products load failed'
      )
    }

    const products =
      await response.json()

    renderProducts(
      products
    )

  } catch (error) {

    console.error(
      error
    )

    productsList.innerHTML = `
      <p>
        Products load nahi ho sake.
      </p>
    `
  }
}

// =========================
// RENDER PRODUCTS
// =========================

function renderProducts(
  products: any[]
) {

  if (
    products.length === 0
  ) {

    productsList.innerHTML = `
      <p>
        No products found.
      </p>
    `

    return
  }

  productsList.innerHTML =
    products
      .map(
        product => {

          const stock =
            Number(
              product.stock
            )

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
                width="120"
                height="120"
                style="
                  width:120px !important;
                  height:120px !important;
                  min-width:120px !important;
                  min-height:120px !important;
                  max-width:120px !important;
                  max-height:120px !important;
                  object-fit:contain !important;
                  object-position:center !important;
                  display:block !important;
                  margin:0 auto 12px auto !important;
                "
              >

              <input
                type="file"
                accept="image/*"
                class="product-image-file-input"
                data-id="${product.id}"
                id="product-image-file-${product.id}"
                style="display:none;"
              >

              <button
                type="button"
                class="choose-product-image-button"
                data-id="${product.id}"
                style="
                  display:block;
                  margin:0 auto 12px auto;
                  padding:7px 12px;
                  border:none;
                  border-radius:6px;
                  cursor:pointer;
                  font-size:13px;
                "
              >
                📷 Choose Image
              </button>

              <h3>
                ${product.name}
              </h3>

              <div class="admin-product-info">

                <p>
                  <strong>Price:</strong>
                  Rs.
                  ${
                    Number(
                      product.price
                    ).toFixed(2)
                  }
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
        }
      )
      .join('')

  // =========================
  // EDIT BUTTONS
  // =========================

  document
    .querySelectorAll(
      '.edit-product-button'
    )
    .forEach(
      button => {

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
                  Number(
                    item.id
                  ) === id
              )

            if (product) {

              openEditModal(
                product
              )
            }
          }
        )
      }
    )

  // =========================
  // DELETE BUTTONS
  // =========================

  document
    .querySelectorAll(
      '.delete-product-button'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const id =
              Number(
                (
                  button as HTMLButtonElement
                ).dataset.id
              )

            deleteProduct(
              id
            )
          }
        )
      }
    )

  // =========================
  // CHOOSE IMAGE BUTTONS
  // =========================

  document
    .querySelectorAll(
      '.choose-product-image-button'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const id =
              (
                button as HTMLButtonElement
              ).dataset.id

            if (!id) {
              return
            }

            const input =
              document.querySelector(
                `#product-image-file-${id}`
              ) as HTMLInputElement

            input?.click()
          }
        )
      }
    )

  // =========================
  // IMAGE FILE INPUTS
  // =========================

  document
    .querySelectorAll(
      '.product-image-file-input'
    )
    .forEach(
      input => {

        input.addEventListener(
          'change',
          async () => {

            const fileInput =
              input as HTMLInputElement

            const file =
              fileInput.files?.[0]

            if (!file) {
              return
            }

            const id =
              Number(
                fileInput.dataset.id
              )

            await uploadProductImage(
              id,
              file
            )

            fileInput.value =
              ''
          }
        )
      }
    )
}

// =========================
// OPEN EDIT MODAL
// =========================

function openEditModal(
  product: any
) {

  editingProductId =
    Number(
      product.id
    )

  editProductName.value =
    product.name || ''

  editProductPrice.value =
    String(
      product.price || 0
    )

  editProductCategory.value =
    product.category || 'Fruits'

  editProductUnit.value =
    product.unit || ''

  editProductStock.value =
    String(
      product.stock ?? 0
    )

  editProductImage.value =
    ''

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

    editingProductId =
      null

    editProductImage.value =
      ''
  }
)

// =========================
// CLOSE OUTSIDE MODAL
// =========================

window.addEventListener(
  'click',
  event => {

    if (
      event.target ===
      editProductModal
    ) {

      editProductModal.style.display =
        'none'

      editingProductId =
        null

      editProductImage.value =
        ''
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
      Number.isNaN(price) ||
      price < 0 ||
      Number.isNaN(stock) ||
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

      const body: any = {

        name,

        price,

        category,

        stock,

        unit

      }

      // Only send image if
      // user selected a new image.
      // Otherwise backend preserves old image.

      if (selectedFile) {

        body.image =
          image

        body.imageName =
          selectedFile.name
      }

      const response =
        await adminFetch(
          `${API_URL}/api/products/${editingProductId}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(
                body
              )
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
          'Product update failed'
        )
      }

      alert(
        'Product updated successfully! ✅'
      )

      editProductModal.style.display =
        'none'

      editingProductId =
        null

      editProductImage.value =
        ''

      await loadProducts()

    } catch (error) {

      console.error(
        error
      )

      alert(
        error instanceof Error
          ? error.message
          : 'Product update nahi ho saka.'
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
      Number.isNaN(price) ||
      price < 0 ||
      Number.isNaN(stock) ||
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
      createProductCode(
        name
      )

    if (!productCode) {

      alert(
        'Product name valid nahi hai.'
      )

      return
    }

    try {

      const image =
        await readImageFile(
          selectedFile
        )

      const response =
        await adminFetch(
          `${API_URL}/api/products`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({

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
          await response
            .json()
            .catch(
              () => null
            )

        throw new Error(
          errorData?.message ||
          'Product add failed'
        )
      }

      alert(
        'Product added successfully! ✅'
      )

      productNameInput.value =
        ''

      productPriceInput.value =
        ''

      productStockInput.value =
        '100'

      productImageInput.value =
        ''

      await loadProducts()

    } catch (error) {

      console.error(
        error
      )

      alert(
        error instanceof Error
          ? error.message
          : 'Product add nahi ho saka.'
      )
    }
  }
)

// =========================
// UPLOAD PRODUCT IMAGE
// =========================

async function uploadProductImage(
  productId: number,
  file: File
) {

  if (
    !file.type.startsWith(
      'image/'
    )
  ) {

    alert(
      'Please select a valid image file.'
    )

    return
  }

  try {

    const image =
      await readImageFile(
        file
      )

    const response =
      await adminFetch(
        `${API_URL}/api/products/${productId}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({

              image,

              imageName:
                file.name

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
        'Image upload failed'
      )
    }

    alert(
      'Product image updated successfully! ✅'
    )

    await loadProducts()

  } catch (error) {

    console.error(
      'Product image upload error:',
      error
    )

    alert(
      error instanceof Error
        ? error.message
        : 'Product image update nahi ho saki.'
    )
  }
}

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
      await adminFetch(
        `${API_URL}/api/products/${id}`,
        {
          method: 'DELETE'
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
        'Product delete failed'
      )
    }

    alert(
      'Product deleted successfully! ✅'
    )

    await loadProducts()

  } catch (error) {

    console.error(
      error
    )

    alert(
      error instanceof Error
        ? error.message
        : 'Product delete nahi ho saka.'
    )
  }
}

// =========================
// INITIAL LOAD
// =========================

createExcelImportUI()

loadProducts()