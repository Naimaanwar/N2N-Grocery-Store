const isLoggedIn =
  localStorage.getItem('groceryLoggedIn')

if (isLoggedIn !== 'true') {
  window.location.href = '/login.html'
}
const orderNumberElement =
document.querySelector<HTMLElement>('#order-number')!

const orderStatusElement =
document.querySelector<HTMLElement>('#order-status')!

const customerNameElement =
document.querySelector<HTMLElement>('#customer-name')!

const customerPhoneElement =
document.querySelector<HTMLElement>('#customer-phone')!

const customerAddressElement =
document.querySelector<HTMLElement>('#customer-address')!

const customerCityElement =
document.querySelector<HTMLElement>('#customer-city')!

const paymentMethodElement =
document.querySelector<HTMLElement>('#payment-method')!

const orderTotalElement =
document.querySelector<HTMLElement>('#order-total')!

// Order Number
const orderNumber =
localStorage.getItem('order-number')

orderNumberElement.textContent =
orderNumber
? `#${orderNumber}`
: 'Order number not found'

// Order Status
orderStatusElement.textContent =
'📦 Processing'

// Customer Details
customerNameElement.textContent =
localStorage.getItem('customer-name') || 'Not available'

customerPhoneElement.textContent =
localStorage.getItem('customer-phone') || 'Not available'

customerAddressElement.textContent =
localStorage.getItem('customer-address') || 'Not available'

customerCityElement.textContent =
localStorage.getItem('customer-city') || 'Not available'

// Payment Method
const paymentMethod =
localStorage.getItem('payment-method')

if (paymentMethod === 'cod') {

paymentMethodElement.textContent =
'💵 Cash on Delivery'

} else if (paymentMethod === 'online') {

paymentMethodElement.textContent =
'💳 Online Payment'

} else {

paymentMethodElement.textContent =
'Not available'

}

// Order Total
const orderTotal =
localStorage.getItem('order-total')

if (orderTotal) {

orderTotalElement.textContent =
`Rs. ${orderTotal}`

} else {

orderTotalElement.textContent =
'Rs. 0'

}
