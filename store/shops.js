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
  getFilteredShops: (state) => {
    const roasterFilter = state.roasterFilter
    const companyFilter = state.companyFilter

    const filteredShops = JSON.parse(JSON.stringify(state.shops))

    if (roasterFilter !== null) {
      filteredShops.filter(s => s.roasterId === roasterFilter)
    }

    if (companyFilter !== null) {
      filteredShops.filter(s => s.companyId === companyFilter)
    }

    return filteredShops
  }
}

export const actions = {
  updateCompanyFilter ({ commit }, companyId) {
    commit('updateCompanyFilter', companyId)
  },
  updateRoasterFilter ({ commit }, roasterId) {
    commit('updateRoasterFilter', roasterId)
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
