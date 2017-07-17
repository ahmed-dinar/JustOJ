

export default function(){

  return `

  <transition
    name="custom-classes-transition"
    enter-active-class="animated slideInDown"
    leave-active-class="animated slideOutUp">
    <b-alert :variant="variant || defaultVariant" :class="{ 'text-center': center }" :dismissible="!important" :show="show" >
      {{ msg }}
    </b-alert>
  </transition>

  `;
}