<template>
  <div id="app">

    <b-navbar toggleable type="inverse"  v-if="showNavBar">
      <div class="container">

        <b-nav-toggle target="nav_collapse"></b-nav-toggle>

        <b-link class="navbar-brand" :to="{ path: '/' }">
          <img src="img/brand-logo.png"  width="35" height="32" />
        </b-link>

        <b-collapse is-nav id="nav_collapse">

          <b-nav is-nav-bar>
            <b-nav-item :to="{ path: '/' }" exact>Home</b-nav-item>
            <b-nav-item :to="{ path: '/problems' }" exact>Problems</b-nav-item>
            <b-nav-item :to="{ path: '/ranks' }" exact>Ranks</b-nav-item>
            <b-nav-item :to="{ path: '/status' }" exact>Status</b-nav-item>
            <b-nav-item :to="{ path: '/contests' }" exact>Contests</b-nav-item>
          </b-nav>

          <b-nav is-nav-bar class="ml-auto">

            <template v-if="isLoggedIn">
              <b-nav-item exact><i class="fa fa-envelope-o"></i></b-nav-item>
              <b-nav-item-dropdown right>

                <!-- Using text slot -->
                <template slot="text">
                  <span style="font-weight: bold;">{{ getUser.username  }}</span>
                </template>

                <b-dropdown-item :to="{ path: userLinks.profile }"><i class="fa fa-user" aria-hidden="true"></i> Profile</b-dropdown-item>
                <b-dropdown-item :to="{ path: userLinks.settings }"><i class="fa fa-cog" aria-hidden="true"></i> Settings</b-dropdown-item>
                <b-dropdown-item :to="{ path: userLinks.submissions }"><i class="fa fa-paper-plane" aria-hidden="true"></i> My Submissions</b-dropdown-item>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item @click="logOut"><i class="fa fa-sign-out" aria-hidden="true"></i> Signout</b-dropdown-item>
              </b-nav-item-dropdown>
            </template>

            <template v-else>
              <b-nav-item class="nav-login-btn" :to="{ path: '/login' }" exact>Login</b-nav-item>
              <b-nav-item :to="{ path: '/signup' }" exact>Register</b-nav-item>
            </template>

          </b-nav>
        </b-collapse>
      </div>
    </b-navbar>

    <div class="main-wraper" v-if="showNavBar">
      <div class="content container main-height" >
        <router-view></router-view>
      </div>
      <div class="main-footer">
        <footer class="container" >
          <div>
            &copy; 2016 CSE, JUST
            <div class="pull-right"><a href="mailto:madinar.cse@gmail.com">Developer: Ahmed Dinar</a></div>
          </div>
        </footer>
      </div>

    </div>
    <template v-else>
      <router-view></router-view>
    </template>

  </div>
</template>

<script>

  import { mapGetters } from 'vuex';

  export default {

    name: 'app',

    mounted(){
      // console.log(this.$store.state.route.path);
      // console.log(this.showNavBar);
    },

    computed: {

      showNavBar(){
        let page = this.$store.state.route.name;
        return (page !== 'Login' && page !== 'SignUp');
      },

      userLinks(){
        return {
          profile: '/user/' + this.getUser.username,
          settings: '/user/settings/profile/',
          submissions: '/status/u/' + this.getUser.username
        };
      },

      ...mapGetters([
        'isLoggedIn',
        'getUser'
      ])

    }

  };
</script>

<style scoped>

  .nav-login-btn{
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

</style>
