const registerForm =
  document.querySelector(
    '#register-form'
  ) as HTMLFormElement

const nameInput =
  document.querySelector(
    '#register-name'
  ) as HTMLInputElement

const emailInput =
  document.querySelector(
    '#register-email'
  ) as HTMLInputElement

const phoneInput =
  document.querySelector(
    '#register-phone'
  ) as HTMLInputElement

const passwordInput =
  document.querySelector(
    '#register-password'
  ) as HTMLInputElement

const confirmPasswordInput =
  document.querySelector(
    '#register-confirm-password'
  ) as HTMLInputElement

registerForm.addEventListener(
  'submit',
  function (event) {

    event.preventDefault()

    const name =
      nameInput.value.trim()

    const email =
      emailInput.value.trim().toLowerCase()

    const phone =
      phoneInput.value.trim()

    const password =
      passwordInput.value

    const confirmPassword =
      confirmPasswordInput.value

    if (
      password !==
      confirmPassword
    ) {

      alert(
        'Passwords do not match.'
      )

      return
    }

    if (password.length < 6) {

      alert(
        'Password must be at least 6 characters.'
      )

      return
    }
    const savedUser =
  localStorage.getItem('groceryUser')

if (savedUser) {
  const existingUser = JSON.parse(savedUser)

  if (email === existingUser.email) {
    alert(
      'An account with this email already exists. Please login instead.'
    )
    return
  }
  if (phone === existingUser.phone) {
  alert(
    'An account with this phone number already exists. Please login instead.'
  )
  return
}
}
    const user = {
      name: name,
      email: email,
      phone: phone,
      password: password
    }

    localStorage.setItem(
      'groceryUser',
      JSON.stringify(user)
    )

    alert(
      'Account created successfully! 🎉'
    )

    window.location.href =
      '/login.html'
  }
)
const toggleRegisterPassword =
  document.querySelector<HTMLButtonElement>(
    '#toggle-register-password'
  )

toggleRegisterPassword?.addEventListener(
  'click',
  () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text'
      toggleRegisterPassword.textContent = '🙈'
    } else {
      passwordInput.type = 'password'
      toggleRegisterPassword.textContent = '👁️'
    }
  }
)

const toggleRegisterConfirmPassword =
  document.querySelector<HTMLButtonElement>(
    '#toggle-register-confirm-password'
  )

toggleRegisterConfirmPassword?.addEventListener(
  'click',
  () => {
    if (confirmPasswordInput.type === 'password') {
      confirmPasswordInput.type = 'text'
      toggleRegisterConfirmPassword.textContent = '🙈'
    } else {
      confirmPasswordInput.type = 'password'
      toggleRegisterConfirmPassword.textContent = '👁️'
    }
  }
)