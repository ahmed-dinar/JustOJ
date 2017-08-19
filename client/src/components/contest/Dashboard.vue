<template>
  <div>
    <contest-navbar></contest-navbar>
  </div>
</template>

<script>

  import ContestNavbar from '@/components/custom/ContestNavbar';

  export default {
    name: 'Dashboard',
    components: {
      ContestNavbar
    },
    data () {
      return {
      };
    },

    computed: {
      contestId(){
        return this.$store.state.route.paramas.cid;
      }
    },

    mathods: {
      fetchContest(){
        this.$http
          .get(`/api/contest/${contestId}`)
          .then(response => {

          })
          .catch(err=>{

          });
      }
    }
  };
</script>
