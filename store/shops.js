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
  companyFilter: null,
  singleShopId: null
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
  },
  getSingleShopId: state => state.singleShopId,
  getSingleShop: (state) => {
    const shopId = state.singleShopId

    const allShops = JSON.parse(JSON.stringify(state.shops))
    const singleShop = allShops.filter(s => s.id === shopId)

    return singleShop[0]
  }
}

export const actions = {
  updateCompanyFilter ({ commit }, companyId) {
    commit('updateCompanyFilter', companyId)
  },
  updateRoasterFilter ({ commit }, roasterId) {
    commit('updateRoasterFilter', roasterId)
  },
  setSingleShopId ({ commit }, shopId) {
    commit('updateSingleShopId', shopId)
  }
}

export const mutations = {
  updateRoasterFilter (state, roasterId) {
    state.roasterFilter = roasterId
  },
  updateCompanyFilter (state, companyId) {
    state.companyFilter = companyId
  },
  updateSingleShopId (state, shopId) {
    state.singleShopId = shopId
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
