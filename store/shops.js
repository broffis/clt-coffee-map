import { coffeeShops } from '@/config/shops'

export const state = () => ({
  shops: coffeeShops
})

export const getters = {
  getShops: state => state.shops
}

export default {
  state,
  getters
}
