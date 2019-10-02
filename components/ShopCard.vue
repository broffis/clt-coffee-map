<template>
  <div class="shop-card">
    <div class="shop-card__upper">
      <div class="shop-card__upper--header">
        <img
          v-if="hasLogo"
          class="shop-card__upper--logo"
          :src="shop.logo"
        >

        <div
          v-else
          class="title"
        >
          {{ shop.name }}
        </div><!-- /.title -->
      </div>
      <div class="shop-card__upper--text">
        <div
          v-if="shop.roaster !== ''"
          class="roaster"
        >
          <span class="roaster--label">Roaster:&nbsp;</span>
          <span class="roaster--value">{{ shop.roaster }}</span>
        </div><!-- /.roaster -->
      </div><!-- /.shop-card__upper--text -->
    </div><!-- /.shop-card__upper -->

    <div class="shop-card__lower">
      <div class="shop-card__lower--location">
        <!-- <span class="street">{{ streetAddress }}</span>
        <span class="city">{{ city }}, {{ state }} {{ zipCode }}</span> -->
      </div><!--/.shop-card__lower--location -->

      <div class="shop-card__lower--text">
        <div
          v-if="shop.currentFavoriteDrink != ''"
          class="about"
        >
          <div class="about__drink">
            <span class="about__drink--label">Favorite Offering:</span>
            <span clas="about__drink--value">{{ shop.currentFavoriteDrink }}</span>
          </div><!-- /.about__drink -->
        </div><!-- /.about -->
      </div><!-- /.shop-card__lower--text -->
    </div><!-- /.shop-card__lower -->
    <div class="shop-card__contact-info">
      <span
        v-if="hasWebsite"
        class="website"
      >
        <a :href="shop.websiteUrl">website</a>
      </span><!-- /.website -->

      <a
        v-if="hasTwitter"
        class="twitter"
        :href="shop.twitterLink"
      >
        <img src="/images/icons/twitter-icon.png">
      </a>

      <a
        v-if="hasFacebook"
        class="facebook"
        :href="shop.facebookLink"
      >
        <img src="/images/icons/facebook-icon.png">
      </a>

      <a
        v-if="hasInstagram"
        class="instagram"
        :href="shop.instagramLink"
      >
        <img src="/images/icons/instagram-icon.png">
      </a>
    </div><!-- /.shop-card__contact-info -->
    <div class="shop-card__more-info">
      <a
        :href="shopUrl"
        :shopId="shop.id"
      >
        Learn More
      </a>
    </div>
  </div><!-- /.shop-card -->
</template>
<script>

export default {
  name: 'ShopCard',

  props: {
    shop: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },

  computed: {
    hasWebsite () {
      return this.shop.websiteUrl && this.shop.websiteUrl !== undefined
    },
    hasFacebook () {
      return this.shop.facebookLink && this.shop.facebookLink !== undefined
    },
    hasTwitter () {
      return this.shop.twitterLink && this.shop.twitterLink !== undefined
    },
    hasInstagram () {
      return this.shop.instagramLink && this.shop.instagramLink !== undefined
    },
    hasLogo () {
      const logoTitle = this.shop.logo.replace('/images/logos/', '')
      return this.shop.logo && logoTitle.length > 0
    },
    shopUrl () {
      return `/shops/${this.shop.id}/`
    }
  }
}
</script>
