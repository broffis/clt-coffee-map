<template>
  <div class="shop-card">
    <div class="shop-card__upper">
      <div class="shop-card__upper--header">
        <img
          v-if="logo"
          class="shop-card__upper--logo"
          :src="logo"
        >

        <div
          v-else
          class="title"
        >
          {{ name }}
        </div><!-- /.title -->
      </div>
      <div class="shop-card__upper--text">
        <div class="roaster">
          <span class="roaster--label">Roaster:&nbsp;</span>
          <span class="roaster--value">{{ roaster }}</span>
        </div><!-- /.roaster -->
      </div><!-- /.shop-card__upper--text -->
    </div><!-- /.shop-card__upper -->

    <div class="shop-card__lower">
      <div class="shop-card__lower--location">
        <span class="street">{{ streetAddress }}</span>
        <span class="city">{{ city }}, {{ state }} {{ zipCode }}</span>
      </div><!-- /.shop-card__lower--location -->

      <div class="shop-card__lower--text">
        <div
          v-if="currentFavoriteDrink != ''"
          class="about"
        >
          <div class="about__drink">
            <span class="about__drink--label">Favorite Offering:</span>
            <span clas="about__drink--value">{{ currentFavoriteDrink }}</span>
          </div><!-- /.about__drink -->
        </div><!-- /.about -->
      </div><!-- /.shop-card__lower--text -->
    </div><!-- /.shop-card__lower -->
    <div class="shop-card__contact-info">
      <span
        v-if="hasWebsite"
        class="website"
      >
        <a :href="socialMediaLinks.websiteUrl">website</a>
      </span><!-- /.website -->

      <a
        v-if="hasTwitter"
        class="twitter"
        :href="socialMediaLinks.twitterLink"
      >
        <img src="/images/icons/twitter-icon.png">
      </a>

      <a
        v-if="hasFacebook"
        class="facebook"
        :href="socialMediaLinks.facebookLink"
      >
        <img src="/images/icons/facebook-icon.png">
      </a>

      <a
        v-if="hasInstagram"
        class="instagram"
        :href="socialMediaLinks.instagramLink"
      >
        <img src="/images/icons/instagram-icon.png">
      </a>
    </div><!-- /.shop-card__contact-info -->
  </div><!-- /.shop-card -->
</template>
<script>

export default {
  name: 'ShopCard',

  props: {
    name: {
      type: String,
      default: ''
    },
    logo: {
      type: String,
      default: 'LOGO'
    },
    roaster: {
      type: String,
      default: ''
    },
    streetAddress: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    zipCode: {
      type: Number,
      default: null
    },
    socialMediaLinks: {
      type: Object,
      default: () => {
        return {}
      }
    },
    currentFavoriteDrink: {
      type: String,
      default: ''
    }
  },

  computed: {
    hasWebsite () {
      return this.socialMediaLinks && this.socialMediaLinks.websiteUrl !== undefined
    },
    hasFacebook () {
      return this.socialMediaLinks && this.socialMediaLinks.facebookLink !== undefined
    },
    hasTwitter () {
      return this.socialMediaLinks && this.socialMediaLinks.twitterLink !== undefined
    },
    hasInstagram () {
      return this.socialMediaLinks && this.socialMediaLinks.instagramLink !== undefined
    }
  }
}
</script>
