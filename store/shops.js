/* eslint-disable curly */
import { roasters } from '@/config/roasters'
import { companies } from '@/config/companies'
import { coffeeShops } from '@/config/shops'

export const state = () => ({
  shops: coffeeShops,
  roasters,
  companies,
  filteredShops: [],
  roasterFilter: null,
  companyFilter: null
})

export const getters = {
  getShops: state => state.shops,
  getRoasters: state => state.roasters,
  getCompanies: state => state.companies,
  getFilteredShops: (state, getters) => {
    const roasterFilter = state.roasterFilter
    const companyFilter = state.companyFilter

    let filteredShops = JSON.parse(JSON.stringify(getters.getSortedShops))

    if (roasterFilter !== null) {
      filteredShops = filteredShops.filter(s => s.roasterId === roasterFilter)
    }

    if (companyFilter !== null) {
      filteredShops = filteredShops.filter(s => s.companyId === companyFilter)
    }

    return filteredShops
  },
  getSortedShops: (state) => {
    const sortedShops = JSON.parse(JSON.stringify(state.shops))

    sortedShops.sort((a, b) => {
      if (a.name > b.name) return 1
      if (a.name < b.name) return -1
      return 0
    })

    sortedShops.sort((a, b) => {
      if (a.infoFromShop < b.infoFromShop) return 1
      if (a.infoFromShop > b.infoFromShop) return -1
      return 0
    })

    return sortedShops
  }
}

export const actions = {
  updateCompanyFilter ({ commit }, companyId) {
    commit('updateCompanyFilter', companyId)
  },
  updateRoasterFilter ({ commit }, roasterId) {
    commit('updateRoasterFilter', roasterId)
  },
  getSingleShop: ({ state }, id) => {
    let singleShop = JSON.parse(JSON.stringify(state.shops))

    console.log('Pre', singleShop)

    console.log('State id: ', id)

    singleShop = singleShop.filter(f => f.id === id)

    console.log('Post: ', singleShop)

    return singleShop
  }
}

export const mutations = {
  updateRoasterFilter (state, roasterId) {
    state.roasterFilter = roasterId
  },
  updateCompanyFilter (state, companyId) {
    state.companyFilter = companyId
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
