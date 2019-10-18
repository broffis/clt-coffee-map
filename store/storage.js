export const actions = {
  findLocal (context, key) {
    return JSON.parse(window.localStorage.getItem(key))
  },

  setLocal (context, data) {
    if (!data.key || !data.value) {
      return false
    }

    window.localStorage.setItem(data.key, JSON.stringify(data.value))
  },

  findCookie (context, name) {
    const nameEQ = `${name}=`
    const ca = document.cookie.split(';')

    for (let i = 0; i < ca.length; i += 1) {
      let c = ca[i]
      while (c.charAt(0) === ' ') { c = c.substring(1, c.length) }
      if (c.indexOf(nameEQ) === 0) { return c.substring(nameEQ.length, c.length) }
    }

    return null
  },

  setCookie (context, data) {
    let cookie = `${data.key}=${data.value};path=/`

    if (data.expiration) {
      // set expiration as a number of days (eg: expiraton: 2)
      const expiration = new Date().getTime() + (1000 * 60 * 60 * 24 * data.expiration)
      cookie += `;expires=${new Date(expiration)}`
    }

    if (data.extra) {
      cookie += `;${data.extra}`
    }

    document.cookie = cookie
  }
}

export default {
  actions
}
