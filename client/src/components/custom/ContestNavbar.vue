<template>
  <div class="contest-navbar">

    <h4 class="conetest-title">{{ contest.title }}</h4>
    <div class="countdown">{{ countdownTime }}</div>

    <nav class="navbar navbar-expand-lg navbar-light mt-3">
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav mr-auto">

          <li class="nav-item">
            <router-link :to="`/contests/${id}/${contest.slug}/dashboard`" class="nav-link">DASHBOARD</router-link>
          </li>

          <li class="nav-item">
            <router-link :to="`/contests/${id}/${contest.slug}/clar`" class="nav-link">CLARIFICATIONS</router-link>
          </li>

          <li class="nav-item">
            <router-link :to="`/contests/${id}/${contest.slug}/standings`" class="nav-link">STANDINGS</router-link>
          </li>

          <li class="nav-item">
            <router-link :to="`/contests/${id}/${contest.slug}/submissions`" class="nav-link">SUBMISSIONS</router-link>
          </li>

        </ul>
      </div>
    </nav>

  </div>
</template>

<script type="text/javascript">
  export default{
    name: 'contest-navbar',

    props: {
      contest: {
        type: Object,
        required: true
      },
      id: {
        type: String,
        required: true
      }
    },

    data(){
      return {
        running: false,
        timer: null,
        end: null,
        countdownTime: ''
      };
    },

    methods: {
      countdown(){
        this.end = new Date(this.contest.end);

        this.showRemaining();
        this.timer = setInterval(this.showRemaining, 1000);
      },
      showRemaining() {
        let distance = this.end - new Date();

        if (distance <= 0) {
          clearInterval(this.timer);
          this.countdownTime = 'Ended';
          if( this.running ) {
            this.$noty.success('Contest Ended');
          }
          return;
        }

        let days = Math.floor(distance / 86400000);
        let hours = Math.floor((distance % 86400000) / 3600000);
        let minutes = Math.floor((distance % 3600000) / 60000);
        let seconds = Math.floor((distance % 60000) / 1000);

        let current = days <= 0 ? '' : days + 'd ';
        current += Math.floor(hours/10) + '' + hours%10 + ':';
        current += Math.floor(minutes/10) + '' + minutes%10 + ':';
        current += Math.floor(seconds/10) + '' + seconds%10;

        this.countdownTime = current;
        this.running = true;
      }
    },

    mounted(){
      this.countdown();
    }
  };
</script>


<style>
  .contest-navbar{
    font-family: 'Open Sans', sans-serif !important;
  }
  .conetest-title, .countdown{
    font-weight: 600;
    color: #4c5a67;
  }
  .countdown{
    font-size: 16px;
  }
</style>