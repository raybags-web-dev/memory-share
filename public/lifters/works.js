import { LOGIN_HTML } from '../pages/login.js'
import { SIGNUP_HTML } from '../pages/signup.js'
import { userGuideModel, addCardWithDelay } from '../components/card.js'

// api client
export const API_CLIENT = axios.create({
  baseURL: '/raybags/v1/',
  timeout: 150000
})
API_CLIENT.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401 && data.error === 'Invalid token') {
        // Redirect to login page
        sessionStorage.removeItem('token')
        LOGIN_HTML()
      }
    }
    return Promise.reject(error)
  }
)
// Notifications
export async function Notify (message = '...') {
  // Check if a notification already exists and remove it
  const existingNotification = document.getElementById('notifications')
  if (existingNotification) {
    existingNotification.remove()
  }
  // Create the new notification element
  const notification = document.createElement('div')
  notification.id = 'notifications'
  notification.className =
    'alert alert-transparent p-1 rounded showNotification'
  notification.setAttribute('role', 'alert')
  notification.style.cssText =
    'min-width:fit-content;font-size:0.7rem;font-style:italic;'
  // Create the message element and add it to the notification
  const messageElement = document.createElement('p')
  messageElement.style.color = 'white'
  messageElement.innerText = message || ''
  notification.appendChild(messageElement && messageElement)
  // Append the notification to the body
  document.body.appendChild(notification)
  // Wait 5 seconds and remove the showNotification class
  setTimeout(() => {
    notification.classList.remove('showNotification')
    // Wait for the animation to finish and remove the notification from the DOM
    setTimeout(() => {
      notification.remove()
    }, 500)
  }, 5000)
}
export async function showSearchBar (isData) {
  let searchBar = document.querySelector('.search_db_form')
  if (!isData) return searchBar?.classList.add('hide')
  searchBar?.classList.remove('hide')
}
// Main page loader
export async function runSpinner (isDone, message = '') {
  const loader = document.querySelector('#main-page-loader')
  if (!isDone) {
    if (!loader) {
      const loaderHTML = `
          <div id="main-page-loader" class="d-flex align-items-center text-white justify-content-center"
            style="position:fixed; top:0; left:0; right:0; bottom:0;z-index:3000">
            <div class="d-flex">
              <p class="fs-4" id="my_text" style="position:absolute;top:50%;opacity:.7;left:50%;transform:translate(-50%, -50%);">
                ${message}
              </p>
              <span class="loader text-white" style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);"></span>
            </div>
          </div>
        `
      const wrapper = document.querySelector('body')
      wrapper.insertAdjacentHTML('beforeend', loaderHTML)
    }
  } else {
    if (loader) {
      loader.remove()
    }
  }
}
export async function emptyMainContainer () {
  const offContainer = document.querySelectorAll('.col')
  const contBTN = document.querySelector('.del_btn_cont .lead')

  offContainer.forEach(card => {
    card?.parentNode.removeChild(card)
  })
  contBTN?.click()
}
export function formatDate (timestamp) {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
export function formatEmail (email) {
  const atIndex = email.indexOf('@')
  if (atIndex !== -1) {
    const username = email.slice(0, atIndex)
    const domain = email.slice(atIndex + 1)
    return `@${username}`
  }
  return ''
}
export async function fetchData (page = 1) {
  try {
    runSpinner(false, 'loading...')

    const { token } = JSON.parse(sessionStorage.getItem('token'))
    const baseUrl = '/uploader/paginated-user-documents'
    const perPage = 10

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const url = `${baseUrl}?page=${page}&perPage=${perPage}`
    const res = await API_CLIENT.post(url, {}, { headers })

    if (res.statusText === 'OK') {
      setTimeout(() => runSpinner(true), 500)

      const data = res.data.data || []

      if (data.length < perPage) {
        return data
      } else {
        showSearchBar(true)
        return data
      }
    }
  } catch (error) {
    handleFetchDataError(error)
  } finally {
    runSpinner(true)
  }
}
function notifyAndDisplayLabel (message, alertClass) {
  Notify(message)
  displayLabel(['main__wrapper', alertClass, message])
}
function handleFetchDataError (error) {
  const offCards = document.querySelectorAll('.col')

  switch (error?.response?.status) {
    case 404:
      if (!offCards?.length) {
        runSpinner(true)
        showSearchBar(false)
        userGuideModel()
        displayLabel([
          'main__wrapper',
          'alert-secondary',
          `You don't seem to have any documents saved.`
        ])
      }
      break
    case 401:
      displayLabel([
        'main__wrapper',
        'alert-danger',
        `Session expired. Please login again.`
      ])
      document.getElementById('log___out').style.display = 'none'
      LOGIN_HTML()
      break
    case 404:
      notifyAndDisplayLabel(
        'Account not found. Please sign up!',
        'alert-warning'
      )
      SIGNUP_HTML()
      break
    default:
      Notify('An error occurred while processing your request. Please login!')
      showSearchBar(false)
      setTimeout(async () => await LOGIN_HTML(), 2000)
      break
  }
}
export async function PaginateData () {
  runSpinner(false)
  let page = 1
  const container = document.getElementById('off__Container')

  if (!container) return
  const sessionToken = sessionStorage.getItem('token')
  if (!sessionToken) return

  try {
    const data = await fetchData(page)
    if (data && data.length) {
      for (const obj of data) {
        try {
          await addCardWithDelay(obj)
        } catch (e) {
          console.log(e)
        }
      }

      setTimeout(async () => {
        let loading = false
        let target = container?.children[container.children.length - 2]
        const observer = new IntersectionObserver(
          async (entries, observer) => {
            const lastEntry = entries[entries.length - 1]
            // Load the next page when the observer is triggered
            if (lastEntry.isIntersecting && !loading) {
              loading = true
              const data = await fetchData(++page)
              if (data && data.length) {
                data.forEach(async obj => {
                  await addCardWithDelay(obj)
                })

                if (data.length < 10) {
                  Notify(`Last page: ${page}`)
                  observer.unobserve(target)
                } else {
                  loading = false
                  // Remove the observer from the current target
                  observer.unobserve(target)
                  // Get the new target to observe
                  target = container.children[container.children.length - 2]
                  observer.observe(target)
                }
              }
            }
          },
          { rootMargin: '0px 0px 100% 0px' }
        )

        const responses = document.querySelectorAll('.card')
        if (responses && responses.length >= 10) {
          // Only start observing when there are at least 10 items on the first page
          observer.observe(target)
        }
      }, 1000)
    }
  } catch (error) {
    if (error instanceof TypeError) {
      displayLabel([
        'main__wrapper',
        'alert-danger',
        `Sorry, an error occurred while processing your request.`
      ])

      showSearchBar(false)
      return await LOGIN_HTML()
    }
    console.warn(error.message)
  } finally {
    runSpinner(true)
  }
}
// search db
export async function searchDatabase () {
  const searchingInput = document.querySelector('#search____input')
  let inputValue = searchingInput?.value.trim().toLowerCase()

  try {
    runSpinner(false, 'Searching...')
    const { token } = JSON.parse(sessionStorage.getItem('token'))
    let url = '/uploader/user-docs'

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    const res = await API_CLIENT.post(url, {}, { headers })

    if (res.statusText === 'OK') {
      runSpinner(true)
      const { documents: response } = await res.data
      let hasResults = false
      let matchingDocs = [] // array to store the matching search results

      response.forEach((obj, index) => {
        const { originalname, filename, createdAt } = obj
        const document_name = originalname.toLowerCase()

        if (inputValue === '' || document_name.includes(inputValue)) {
          if (originalname && filename && createdAt) {
            matchingDocs.push(obj) // add the matching result to the array
            hasResults = true
          } else {
            console.warn(
              `Document with ID ${obj._id} is missing one or more required properties.`
            )
          }
        } else {
          const card = document.querySelector(`[data-id="${obj._id}"]`)
          if (card) {
            card.classList.add('hide') // hide cards that don't match the search query
          }
        }
      })

      if (!inputValue) {
        // Make all the cards visible again if inputValue is empty
        const cards = document.querySelectorAll('.card.hide')
        cards.forEach(card => card.classList.remove('hide'))
      }
    }
  } catch (error) {
    if (error.response.data.error == 'Documents not found') {
      displayLabel(['main__wrapper', 'alert-warning', `No matches were found!`])
      console.log(error.message)
    }
  } finally {
    runSpinner(true)
  }
}
// get user profiles
export async function fetchUserProfile () {
  runSpinner(false)
  try {
    const { token, email } = JSON.parse(sessionStorage.getItem('token'))

    const baseUrl = '/uploader/get-user'
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const url = `${baseUrl}?email=${email}`
    const res = await API_CLIENT.post(url, {}, { headers })
    if (res.statusText == 'OK') {
      setTimeout(() => runSpinner(true), 500)
      const data = res.data || {}
      if (data) return data
      showSearchBar(true)
      return data
    }
  } catch (error) {
    if (error instanceof TypeError) {
      Notify('An error occurred while processing your request.')
      showSearchBar(false)
      setTimeout(async () => {
        return await LOGIN_HTML()
      }, 2000)
    }
    if (
      error?.response.data == 'User not found!' ||
      error?.response.status == 404
    ) {
      runSpinner(true)
      showSearchBar(false)
      return
    }
    if (error?.response.status == 401) {
      displayLabel([
        'main__wrapper',
        'alert-danger',
        `Session expired. Please login!`
      ])
      return LOGIN_HTML()
    }
    if (error?.response.status == 404) {
      Notify('Account not found. Please sign up!')
      displayLabel([
        'main__wrapper',
        'alert-warning',
        `Sorry. To use this application, you must signup!`
      ])

      SIGNUP_HTML()
      return
    }
    console.log(error.message)
  } finally {
    runSpinner(true)
  }
}
// delete user documents
export async function deleteUserDocuments () {
  try {
    const sysMessage = await confirmAction()
    if (sysMessage !== 'confirmed!') return

    const { token } = JSON.parse(sessionStorage.getItem('token'))
    const { _id: userId } = await fetchUserProfile()
    runSpinner(false, 'deleting')

    const baseUrl = '/delete-user-docs'
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const url = `${baseUrl}/${userId}`
    const res = await API_CLIENT.delete(url, { headers })

    if (res.statusText === 'OK') {
      handleDocDeleteSuccess(res.data.message)
      setTimeout(() => runSpinner(true, 'done'), 4000)
    }
  } catch (error) {
    runSpinner(true)
    handleDocDeleteError(error)
  }
}
function handleDocDeleteSuccess (message) {
  if (message === 'User has no documents to delete') {
    displayLabel([
      'main__wrapper',
      'alert-warning',
      'There is nothing to delete!'
    ])
  } else {
    emptyMainContainer()
    displayLabel([
      'main__wrapper',
      'alert-success',
      'All documents have been deleted'
    ])
  }
}
function handleDocDeleteError (error) {
  if (error instanceof TypeError) {
    displayLabel([
      'main__wrapper',
      'alert-danger',
      'An error occurred while processing your request.'
    ])
  } else if (error?.response?.status === 404) {
    displayLabel([
      'main__wrapper',
      'alert-warning',
      'User not found or has no documents.'
    ])
  } else {
    console.log(error.message)
    displayLabel([
      'main__wrapper',
      'alert-danger',
      'Request could not be processed. Try again later!'
    ])
  }
}
export async function deleteUserProf () {
  try {
    const sysMessage = await confirmAction()

    if (sysMessage !== 'confirmed!') {
      return
    }

    runSpinner(false, 'Deleting account...')

    const { token } = JSON.parse(sessionStorage.getItem('token'))
    const { _id: userId } = await fetchUserProfile()

    const baseUrl = '/delete-user-and-docs'
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const url = `${baseUrl}/${userId}`
    const res = await API_CLIENT.delete(url, { headers })

    if (res.statusText === 'OK') {
      handleProfileDeleteSuccess()
    }
  } catch (error) {
    handleProfileDeleteError(error)
  } finally {
    runSpinner(true)
  }
}
async function handleProfileDeleteSuccess () {
  localStorage.clear()
  sessionStorage.clear()
  SIGNUP_HTML().then(() => {
    Notify('Account deleted!')
    displayLabel(['main__wrapper', 'alert-success', 'Account deleted!'])
  })
}
async function handleProfileDeleteError (error) {
  if (
    error?.response?.data.error === 'FORBIDDEN: You cannot delete this account!'
  ) {
    displayLabel([
      'main__wrapper',
      'alert-danger',
      'Account cannot be deleted!'
    ])
  } else if (error?.message === 'Request failed with status code 403') {
    displayLabel([
      'main__wrapper',
      'alert-danger',
      'Contents of this account cannot be deleted!'
    ])
  } else if (error?.response?.status === 401) {
    displayLabel([
      'main__wrapper',
      'alert-danger',
      'Session expired. Please login!'
    ])
  } else {
    console.log(error.message)
    displayLabel([
      'main__wrapper',
      'alert-danger',
      'Request could not be processed. Try again later!'
    ])
  }
}
export async function downloadImageById (imageId) {
  try {
    const { token } = JSON.parse(sessionStorage.getItem('token'))

    const baseUrl = '/raybags/v1/wizard/uploader/download'
    const headers = {
      Authorization: `Bearer ${token}`
    }
    const endpoint = `${baseUrl}/${imageId}`

    Notify('Download in progress...')
    runSpinner(false)

    const response = await axios.post(
      endpoint,
      {},
      { headers, responseType: 'blob' }
    )
    const blob = new Blob([response.data], { type: 'image/png' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${imageId}.png`
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    displayLabel([
      'main__wrapper',
      'alert-success',
      'File downloaded successfully'
    ])
    runSpinner(true)
  } catch (error) {
    console.error('Error downloading image:', error)
  }
}
export function confirmAction () {
  return new Promise(resolve => {
    const modalHTML = `
      <div class="modal fade" style="backdrop-filter: blur(7px) !important;" id="exampleModalToggle" aria-hidden="true" aria-labelledby="exampleModalToggleLabel" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content bg-dark text-light">
            <div class="modal-header">
              <h1 class="modal-title fs-5 text-danger" id="exampleModalToggleLabel">Danger zone</h1>
              <button type="button" class="btn-close btn-primary" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-muted">
            By clicking 'Proceed', you will permanently delete your data. This action cannot be reversed.
            Are you sure you want to proceed and delete your account ? 
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-lg bg-transparent btn-outline-danger proceed_delete" data-bs-dismiss="modal">Proceed</button>
              <button type="button" class="btn-lg bg-transparent btn-outline-success cancel_delete" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <a class="btn btn-transparent" id="modalToggleButton" data-bs-toggle="modal" href="#exampleModalToggle" role="button" style="display:none;"></a>`
    const offContainer = document.getElementById('off__Container')
    offContainer?.insertAdjacentHTML('beforeend', modalHTML)

    const big_caro_img = document.getElementById('carocel_big')
    // Click the button to show the modal after it's appended
    const modalButton = document?.getElementById('modalToggleButton')
    modalButton.click()

    document
      .querySelector('.proceed_delete')
      .addEventListener('click', async () => {
        if (big_caro_img) big_caro_img.remove()
        resolve('confirmed!')
      })

    document
      .querySelector('.cancel_delete')
      .addEventListener('click', async () => {
        if (big_caro_img) big_caro_img.remove()
        Notify('Process aborted.')
        displayLabel([
          'main__wrapper',
          'alert-secondary',
          `This process has been aborted.`
        ])
        resolve('Aborted.')
      })
  })
}
export async function displayLabel ([anchorId, labelClass, labelText]) {
  const existingAlert = document.querySelector('.main___alert')
  if (existingAlert) {
    existingAlert.remove()
  }
  const label = document.createElement('div')
  label.classList.add('alert', labelClass, 'text-center', 'main___alert')
  label.textContent = labelText

  const anchor = document.getElementById(anchorId)
  if (anchor) {
    anchor.appendChild(label)

    // Automatically remove the label after 5000 milliseconds (5 seconds)
    setTimeout(() => {
      // Check if the label is still a child of the anchor before trying to remove it
      if (anchor.contains(label)) {
        anchor.removeChild(label)
      }
    }, 5000)
  } else {
    console.log(`Anchor with ID '${anchorId}' could not be found`)
  }
}
export async function saveToLocalStorage (key, data) {
  try {
    const serializedData = JSON.stringify(data)
    localStorage.setItem(key, serializedData)
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}
export async function fetchFromLocalStorage (key) {
  try {
    const serializedData = localStorage.getItem(key)
    return serializedData ? JSON.parse(serializedData) : null
  } catch (error) {
    console.error('Error fetching from localStorage:', error)
    return null
  }
}
