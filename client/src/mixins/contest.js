
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
    },
    contestLink(){
      return `/contests/${this.params.cid}/${this.params.slug}`;
    }
  }
};

export default contestMixins;