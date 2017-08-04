
export default {

  flashTemplate:`
      <transition
      :name="transitionName"
      :enter-active-class="transitionIn"
      :leave-active-class="transitionOut"
      >
        <div v-if="show"
        :class="cssClasses"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        >
          <button v-if="!important"
            type="button"
            class="close"
            data-dismiss="alert"
            aria-label="alertClose"
            @click.stop.prevent="closeFlash"
            >&times;</button>
          <div class="text-center" v-html="message"></div>
        </div>
      </transition>
    `
};