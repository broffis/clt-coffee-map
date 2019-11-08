<template>
  <div class="single-shop-page">
    <div class="single-shop-page__upper">
      <div class="single-shop-page__upper--header">
        <img
          v-if="hasLogo"
          class="single-shop-page__upper--logo"
          :src="logo"
        >
      </div><!-- /.single-shop-page__upper--header -->
      <div
          class="single-shop-page__upper--title"
        >
          {{ name }}
        </div><!-- /.single-shop-page__upper--title -->
      <div class="single-shop-page__upper--text">
        <div
          v-if="roaster !== ''"
          class="roaster"
        >
          <span class="roaster--label">Roaster:&nbsp;</span>
          <span class="roaster--value">{{ roaster }}</span>
        </div><!-- /.roaster -->
      </div><!-- /.single-shop-page__upper--text -->
    </div><!-- /.single-shop-page__upper -->

    <div class="single-shop-page__lower">
      <div class="single-shop-page__lower--location">
        <!-- <span class="street">{{ streetAddress }}</span>
        <span class="city">{{ city }}, {{ state }} {{ zipCode }}</span> -->
      </div><!--/.single-shop-page__lower--location -->

      <div class="single-shop-page__lower--text">
        <map-image
         v-for="(location, index) in locationData"
         :key="index"
         :location="location"
        />
        <div
          class="about"
        >
          <div
            v-if="currentFavoriteDrink !== ''"
            class="about__drink"
          >
            <span class="about__drink--label">Favorite Offering:</span>
            <span clas="about__drink--text">{{ currentFavoriteDrink }}</span>
          </div><!-- /.about__drink -->
          <div
            v-if="about !== ''"
            class="about__info"
          >
            <span class="about__info--label">About:&nbsp;</span>
            <span class="about__info--text">{{ about }}</span>
          </div><!-- /.about__info -->
          <div
            v-if="shopInfo !== ''"
            class="about__special-info"
          >
            <span class="about__special-info--label">Shop Info:&nbsp;</span>
            <span class="about__special-info--text">{{ shopInfo }}</span>
          </div><!-- /.about__special-info -->
        </div><!-- /.about -->
      </div><!-- /.single-shop-page__lower--text -->
    </div><!-- /.single-shop-page__lower -->
    <div class="single-shop-page__contact-info">
      <a
        v-if="hasWebsite"
        class="website"
        :href="websiteUrl"
      >website</a>

      <a
        v-if="hasTwitter"
        class="twitter"
        :href="twitterLink"
      >
        <img src="/images/icons/twitter-icon.png">
      </a>

      <a
        v-if="hasFacebook"
        class="facebook"
        :href="facebookLink"
      >
        <img src="/images/icons/facebook-icon.png">
      </a>

      <a
        v-if="hasInstagram"
        class="instagram"
        :href="instagramLink"
      >
        <img src="/images/icons/instagram-icon.png">
      </a>
    </div><!-- /.single-shop-page__contact-info -->
  </div><!-- /.single-shop-page -->
</template>
<script>
import MapImage from './MapImage'

export default {
  name: 'ShopPage',

  components: {
    MapImage
  },

  props: {
    shop: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  data () {
    return {
      name: this.shop.name,
      logo: this.shop.logo,
      roaster: this.shop.roaster,
      currentFavoriteDrink: this.shop.currentFavoriteDrink,
      about: this.shop.about,
      shopInfo: this.shop.shopInfo,
      websiteUrl: this.shop.websiteUrl,
      twitterLink: this.shop.twitterLink,
      facebookLink: this.shop.facebookLink,
      instagramLink: this.shop.instagramLink,
      locationData: this.shop.locations
    }
  },

  computed: {
    hasWebsite () {
      return this.websiteUrl && this.websiteUrl !== undefined
    },
    hasFacebook () {
      return this.facebookLink && this.facebookLink !== undefined
    },
    hasTwitter () {
      return this.twitterLink && this.twitterLink !== undefined
    },
    hasInstagram () {
      return this.instagramLink && this.instagramLink !== undefined
    },
    hasLogo () {
      return this.logo && this.logo.length > 14
    }
  }
}
</script>
