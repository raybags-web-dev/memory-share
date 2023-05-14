import {
  formatEmail,
  formatDate,
  runSpinner,
  API_CLIENT,
  Notify
} from '../lifters/works.js'
import { hideUploadForm } from '../pages/main_container.js'
import { LogoutBtnIsVisible, LOGIN_HTML } from '../pages/login.js'
export async function CARD (data, isNew = false) {
  const {
    url,
    signature,
    size,
    updatedAt,
    createdAt,
    user,
    _id,
    contentType,
    encoding,
    filename,
    originalname
  } = await data
  const { email } = JSON.parse(sessionStorage.getItem('token'))
  let fall_back = '../images/_404_.webp'
  let cardContent = `
  <div class="col bg-transparent" style="padding:.2rem;" data-id="${_id}">
  <div class="card  bg-transparent rounded" style="object-fit:contain !important;">
    <div class="skeleton"><span class="image_loader"></span></div>
    <div class="img-container" style="width:100% !important;object-fit:cover !important;">
        <img src="${
          `${url}?${signature}` || ''
        }"  class="card-img-top border-dark img-fluid hide_2 img_card ${_id}"  alt="..." onload="this.classList.remove('hide_2')" onerror="this.onerror=null;this.src='${fall_back}'">
  </div>
  <div class="card-footer bg-transparent card-img-overlay text-danger m-1 rounded" style="width:fit-content;height:fit-content;padding:.3rem; font-style:italic">${formatDate(
    createdAt
  )}</div>
    <div class="card-body text-white">
      <ul class="list-group rounded">
        <li class="list-group-item bg-transparent">${formatEmail(email)}</li>
        <li class="list-group-item bg-transparent text-white">${user}</li>
        <li class="list-group-item bg-transparent text-white">${originalname}</li>
        <li class="list-group-item bg-transparent text-white">${filename}</li>
        <li class="list-group-item bg-transparent text-white">${size}</li>
        <li class="list-group-item bg-transparent text-white">${encoding}</li>
        <li class="list-group-item bg-transparent text-white">${createdAt}</li>
        <li class="list-group-item bg-transparent text-white">${updatedAt}</li>
        <li class="list-group-item bg-transparent text-white">${contentType}</li>
        <li class="list-group-item bg-transparent text-white">${_id}</li>
      </ul>
    </div>
  </div>
</div>
  `

  const offContainer = document.querySelector('#off__Container')
  if (isNew) {
    offContainer?.insertAdjacentHTML('afterbegin', cardContent)
  } else {
    offContainer?.insertAdjacentHTML('beforeend', cardContent)
  }
  // remove skeleton after image is loaded
  runSkeleto(document.querySelector('.card .img-container img') !== null)
}
export async function runSkeleto (isDone) {
  if (isDone) {
    let cards = document.querySelectorAll('.col')
    cards.forEach((card, index) => {
      let image = card.querySelector('img')
      if (image.complete) {
        let skeleton = card.querySelector('.skeleton')
        setTimeout(() => skeleton.classList.add('hide'), 1500)
      } else {
        image.addEventListener('load', () => {
          let skeleton = card.querySelector('.skeleton')
          setTimeout(() => skeleton.classList.add('hide_2'), 1500)
        })
      }
    })
  }
}
// big Carucel
export async function DisplayeBigImage (
  imgurl,
  email,
  userId,
  originalname,
  filename,
  size,
  encoding,
  createdAt,
  updaedAt,
  contenttype,
  _id
) {
  runSpinner(false, 'Fetching...')
  let fallback_img = '../images/_404_.webp'
  const innerBodyBig = `
    <div id="carocel_big" class="container control_big_cont" data-carucel="${
      _id && _id
    }" style="z-index:100">
    <div class="container __bigOne__">
    <div class="del_btn_cont">
    <span class="lead">X</span>
    </div>
      <div class="main-del-cont" style="cursor:pointer !important;z-index:230000 !important;">
      <i id="de__btn_1" class="fa-regular fa-trash-can"></i>
      </div>
        <div class="card big_box bg-transparent" data-user="${
          userId && userId
        }"  style="width:60%;height:70% !important">
        <div class="details_btn"><span>&#9737;</span></div>

          <img  src="${
            imgurl || ''
          }" class="card-img-top img-fluid" alt="..." style="border-radius:.2rem;"  onerror="this.onerror=null;this.src='${fallback_img}'">
          <div id="description" class="card-body hide" style="z-index: 100;">
            <h5 class="card-title">${email && email}</h5>
            <hr>
            <p class="">User: ${userId && userId}</p>
            <p class="">Original file: ${originalname && originalname}</p>
            <p class="">New file: ${filename && filename}</p>
            <p class=""> File size: ${size && size}</p>
            <p class="">Encoding type: ${encoding && encoding}</p>
            <p class="">Content type: ${contenttype && contenttype}</p>
            <p class="card-text"><small>Created: ${
              createdAt && createdAt
            }</small></p>
            <p class="card-text"><small>Updated: ${
              updaedAt && updaedAt
            }</small></p>
          </div>
        </div>
      </div>
    </div>`

  const container = document.getElementById('innerBody')
  container?.insertAdjacentHTML('afterbegin', innerBodyBig)
  // finished appending remove spinner
  setTimeout(() => runSpinner(true), 100)

  const closeButton = document.querySelector('#carocel_big .lead')
  closeButton?.addEventListener('click', async () => {
    container?.removeChild(document.getElementById('carocel_big'))
    await hideUploadForm(true)
  })

  let IMGCONT = document.querySelector('#carocel_big')
  IMGCONT.addEventListener('click', function (event) {
    if (!IMGCONT.contains(event.target)) {
      removeElementFromDOM(IMGCONT)
    }
  })

  // delete document
  let btn = document.querySelector('.main-del-cont')
  btn?.addEventListener('click', async () => {
    runSpinner(false)
    await deleteDocument(_id)
    await hideUploadForm(true)
  })

  document.querySelector('.details_btn')?.addEventListener('click', () => {
    document.querySelector('#description')?.classList.toggle('hide')
  })
  // remove big carucel
  document.addEventListener('click', async event => {
    const carocelBig = document.getElementById('carocel_big')
    const clickIsOutside = event.target.classList.contains('control_big_cont')
    if (carocelBig && clickIsOutside) {
      carocelBig?.remove()
      await hideUploadForm(true)
    }
  })
}
function removeElementFromDOM (elementAnchor) {
  if (document.contains(elementAnchor)) {
    elementAnchor.remove()
  }
}
export async function deleteDocument (documentId = '') {
  try {
    const { token } = JSON.parse(sessionStorage.getItem('token'))
    if (!token) {
      return Notify('Session terminated. Login required!')
    }
    let colElem = [...document.querySelectorAll('.col')].find(
      card => card.dataset.id === documentId
    )
    let docId = colElem?.dataset.id

    // remove big carocel
    let carocelll = document.querySelector('#carocel_big')
    removeElementFromDOM(carocelll)

    setTimeout(async () => {
      let url = `delete-doc/${docId}`
      const response = await API_CLIENT.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.status === 200) {
        colElem.classList.add('del_effect')
        // remove the card from the DOM
        setTimeout(() => colElem.remove(), 500)
        // runSpinner(true)
        return Notify('Success: Document deleted!')
      }
    }, 500)
  } catch (error) {
    if (error instanceof TypeError) {
      Notify('Sorry, an error occurred while processing your request.')
      LogoutBtnIsVisible(false)
      return await LOGIN_HTML()
    }
  } finally {
    runSpinner(true)
  }
}
