<script lang="ts">
import type { PropType } from 'vue'
import { defineComponent } from 'vue'

import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

export default defineComponent({
  name: 'VuePlyr',
  props: {
    /** Options object for plyr config. **/
    options: {
      type: Object as PropType<Plyr.Options>,
      required: false,
    },
  },
  data() {
    return {
      player: {} as Plyr,
    }
  },
  computed: {
    opts(): any {
      const options = this.options
      if (
        options && !Object.prototype.hasOwnProperty.call(this.options, 'hideYouTubeDOMError')
      )
        (options as any).hideYouTubeDOMError = true

      return options
    },
  },
  mounted() {
    this.player = new Plyr(this.$el, this.opts) as any
  },
  beforeUnmount() {
    try {
      this.player.destroy()
    }
    catch (e: any) {
      if (!(this.opts.hideYouTubeDOMError && e.message === 'The YouTube player is not attached to the DOM.'))

        console.error(e)
    }
  },
  render() {
    const slots = this.$slots.default
    return typeof slots === 'function' ? slots()[0] : slots
  },
})
</script>
