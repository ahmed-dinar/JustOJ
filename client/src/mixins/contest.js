
import ContestNavbar from '@/components/custom/ContestNavbar';
import has from 'has';

const contestMixins = {
  components: {
    ContestNavbar
  },
  computed: {
    params(){
      return this.$store.state.route.params;
    },
    joined(){
      return !this.contest
        ? false
        : has(this.contest,'joined') && parseInt(this.contest.joined) === 1;
    }
  }
};

export default contestMixins;