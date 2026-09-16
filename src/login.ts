const loginForm =
  document.querySelector(
    '#login-form'
  ) as HTMLFormElement

const emailInput =
  document.querySelector(
    '#login-email'
  ) as HTMLInputElement

const passwordInput =
  document.querySelector(
    '#login-password'
  ) as HTMLInputElement

loginForm.addEventListener(
  'submit',
  function (event) {

    event.preventDefault()

    const email =
  emailInput.value.trim().toLowerCase()

    const password =
      passwordInput.value

    const savedUser =
      localStorage.getItem(
        'groceryUser'
      )

    if (!savedUser) {

      alert(
        'No account found. Please register first.'
      )

      window.location.href =
        '/register.html'

      return
    }

    const user =
      JSON.parse(savedUser)

    if (
      email !== user.email ||
      password !== user.password
    ) {

      alert(
        'Incorrect email or password.'
      )

      return
    }

   localStorage.setItem('groceryLoggedIn', 'true')

const returnUrl =
  localStorage.getItem('loginReturnUrl')

if (returnUrl) {
  localStorage.removeItem('loginReturnUrl')
  window.location.href = returnUrl
} else {
  window.location.href = '/'
}
  }
)
const toggleLoginPassword =
  document.querySelector<HTMLButtonElement>(
    '#toggle-login-password'
  )

toggleLoginPassword?.addEventListener(
  'click',
  () => {
    const passwordInput =
      document.querySelector<HTMLInputElement>(
        '#login-password'
      )

    if (!passwordInput) return

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text'
      toggleLoginPassword.textContent = '🙈'
    } else {
      passwordInput.type = 'password'
      toggleLoginPassword.textContent = '👁️'
    }
  }
)