(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{178:function(t,e,r){var content=r(183);"string"==typeof content&&(content=[[t.i,content,""]]),content.locals&&(t.exports=content.locals);(0,r(39).default)("cd8d2d6a",content,!0,{sourceMap:!1})},179:function(t,e,r){"use strict";var n=r(3),o=r(15),c=r(21),l=r(108),f=r(56),d=r(10),h=r(37).f,v=r(57).f,_=r(9).f,m=r(180).trim,k=n.Number,w=k,y=k.prototype,C="Number"==c(r(74)(y)),L="trim"in String.prototype,O=function(t){var e=f(t,!1);if("string"==typeof e&&e.length>2){var r,n,o,c=(e=L?e.trim():m(e,3)).charCodeAt(0);if(43===c||45===c){if(88===(r=e.charCodeAt(2))||120===r)return NaN}else if(48===c){switch(e.charCodeAt(1)){case 66:case 98:n=2,o=49;break;case 79:case 111:n=8,o=55;break;default:return+e}for(var code,l=e.slice(2),i=0,d=l.length;i<d;i++)if((code=l.charCodeAt(i))<48||code>o)return NaN;return parseInt(l,n)}}return+e};if(!k(" 0o1")||!k("0b1")||k("+0x1")){k=function(t){var e=arguments.length<1?0:t,r=this;return r instanceof k&&(C?d((function(){y.valueOf.call(r)})):"Number"!=c(r))?l(new w(O(e)),r,k):O(e)};for(var N,S=r(8)?h(w):"MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger".split(","),I=0;S.length>I;I++)o(w,N=S[I])&&!o(k,N)&&_(k,N,v(w,N));k.prototype=y,y.constructor=k,r(11)(n,"Number",k)}},180:function(t,e,r){var n=r(7),o=r(20),c=r(10),l=r(181),f="["+l+"]",d=RegExp("^"+f+f+"*"),h=RegExp(f+f+"*$"),v=function(t,e,r){var o={},f=c((function(){return!!l[t]()||"​"!="​"[t]()})),d=o[t]=f?e(_):l[t];r&&(o[r]=d),n(n.P+n.F*f,"String",o)},_=v.trim=function(t,e){return t=String(o(t)),1&e&&(t=t.replace(d,"")),2&e&&(t=t.replace(h,"")),t};t.exports=v},181:function(t,e){t.exports="\t\n\v\f\r   ᠎             　\u2028\u2029\ufeff"},182:function(t,e,r){"use strict";var n=r(178);r.n(n).a},183:function(t,e,r){(t.exports=r(38)(!1)).push([t.i,".container{margin:0 auto;min-height:100vh;display:flex;justify-content:center;align-items:center;text-align:center}.title{font-family:Quicksand,Source Sans Pro,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;display:block;font-weight:300;font-size:4rem;color:#35495e;letter-spacing:1px}.subtitle{font-weight:300;font-size:42px;color:#526488;word-spacing:5px;padding-bottom:15px}.links{padding-top:15px}",""])},185:function(t,e,r){"use strict";r.r(e);r(75),r(22),r(16),r(17),r(58);var n=r(51),o=r(70),c=(r(179),{name:"ShopCard",props:{name:{type:String,default:""},logo:{type:String,default:"LOGO"},roaster:{type:String,default:""},streetAddress:{type:String,default:""},city:{type:String,default:""},state:{type:String,default:""},zipCode:{type:Number,default:null},review:{type:String,default:""},socialMediaLinks:{type:Object,default:function(){return{}}}},computed:{hasWebsite:function(){return this.socialMediaLinks&&void 0!==this.socialMediaLinks.websiteUrl},hasFacebook:function(){return this.socialMediaLinks&&void 0!==this.socialMediaLinks.facebookLink},hasTwitter:function(){return this.socialMediaLinks&&void 0!==this.socialMediaLinks.twitterLink},hasInstagram:function(){return this.socialMediaLinks&&void 0!==this.socialMediaLinks.instagramLink}}}),l=r(23);function f(object,t){var e=Object.keys(object);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(object);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(object,t).enumerable}))),e.push.apply(e,r)}return e}var d={components:{ShopCard:Object(l.a)(c,(function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",{staticClass:"shop-card"},[r("div",{staticClass:"shop-card__upper"},[r("div",{staticClass:"shop-card__upper--text"},[t.logo?r("img",{staticClass:"logo",attrs:{src:t.logo}}):t._e(),t._v(" "),r("div",{staticClass:"title"},[t._v("\n        "+t._s(t.name)+"\n      ")]),t._v(" "),r("div",{staticClass:"roaster"},[t._v("\n        Roaster: "+t._s(t.roaster)+"\n      ")])])]),t._v(" "),r("div",{staticClass:"shop-card__lower"},[r("div",{staticClass:"shop-card__lower--location"},[r("span",{staticClass:"street"},[t._v(t._s(t.streetAddress))]),t._v(" "),r("span",{staticClass:"city"},[t._v(t._s(t.city)+", "+t._s(t.state)+" "+t._s(t.zipCode))])]),t._v(" "),r("div",{staticClass:"shop-card__lower--text"},[r("div",{staticClass:"blurb"},[t._v("\n        "+t._s(t.review)+"\n      ")]),t._v(" "),r("div",{staticClass:"contact-info"},[t.hasWebsite?r("span",{staticClass:"website"},[r("a",{attrs:{href:t.socialMediaLinks.websiteUrl}},[t._v("website")])]):t._e(),t._v(" "),t.hasTwitter?r("a",{staticClass:"twitter",attrs:{href:t.socialMediaLinks.twitterLink}},[r("img",{attrs:{src:"/images/icons/twitter-icon.png"}})]):t._e(),t._v(" "),t.hasFacebook?r("a",{staticClass:"facebook",attrs:{href:t.socialMediaLinks.facebookLink}},[r("img",{attrs:{src:"/images/icons/facebook-icon.png"}})]):t._e(),t._v(" "),t.hasInstagram?r("a",{staticClass:"instagram",attrs:{href:t.socialMediaLinks.instagramLink}},[r("img",{attrs:{src:"/images/icons/instagram-icon.png"}})]):t._e()])])])])}),[],!1,null,null,null).exports},computed:function(t){for(var i=1;i<arguments.length;i++){var source=null!=arguments[i]?arguments[i]:{};i%2?f(source,!0).forEach((function(e){Object(n.a)(t,e,source[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(source)):f(source).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(source,e))}))}return t}({},Object(o.b)({shops:"shops/getShops"}))},h=(r(182),Object(l.a)(d,(function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"container"},[e("div",[e("h1",{staticClass:"title"},[this._v("\n      Charlotte Coffee Map\n    ")]),this._v(" "),this._l(this.shops,(function(t){return e("shop-card",{key:t.id,attrs:{name:t.name,roaster:t.roaster,logo:t.logo,"street-address":t.address,city:t.city,state:t.state,"zip-code":t.zipCode,review:t.review,"social-media-links":{websiteUrl:t.websiteUrl,facebookLink:t.facebookLink,twitterLink:t.twitterLink,instagramLink:t.instagramLink}}})}))],2)])}),[],!1,null,null,null));e.default=h.exports}}]);