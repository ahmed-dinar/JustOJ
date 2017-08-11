<template>
  <div class="mt-4">

    <div v-if="!!error || !!success">
      <smooth-alert variant="danger">
        {{ error }}
      </smooth-alert>
      <smooth-alert variant="success">
        {{ success }}
      </smooth-alert>
    </div>

    <template v-else>

      <router-link :to="addLink">Add Problem</router-link>

      <loading-data :loading="loading">
        <m-table
        :items="problems"
        :fields="fields"
        keyIdentifier="id"
        >
        <template slot="id" scope="prob">
          {{ prob.value }}
        </template>
        <template slot="title" scope="prob">
          {{ prob.value }}
        </template>
        <template slot="status" scope="prob">
          {{ prob.value }}
        </template>
        <template slot="preview" scope="prob">
          <button class="btn btn-iconic-sm btn-primary">
            <i class="material-icons">remove_red_eye</i>
          </button>
        </template>
        <template slot="edit" scope="prob">
          <button class="btn btn-iconic-sm btn-primary">
            <i class="material-icons">mode_edit</i>
          </button>
        </template>
        <template slot="delete" scope="prob">
          <button class="btn btn-iconic-sm btn-primary">
            <i class="material-icons">delete_forever</i>
          </button>
        </template>
      </m-table>
    </loading-data>
    </template>
  </div>
</template>

<script type="text/javascript">
  export default {
    name: 'EditContestProblems',

    data(){
      return {
        problems: null,
        fields: {
          id: {
            label: '#',
            tdClass: ['ellipsis','subs-index-cell']
          },
          title: {
            label: 'Title'
          },
          status: {
            label: 'Status'
          },
          preview: {
            label: 'Preview'
          },
          edit: {
            label: 'Edit'
          },
          delete: {
            label: 'Delete'
          }
        },
        loading: true,
        error: null,
        success: null
      };
    },

    computed: {
      addLink(){
        return `/problems/create?contest=${this.$store.state.route.params.cid}`;
      }
    },

    methods: {
      fetchProblems(){
        progressbar.done();
        progressbar.remove();
        this.loading = true;

        this.$http
          .get(`/api/contest/edit/${this.$store.state.route.params.cid}/problems`)
          .then(response => {
            progressbar.done();
            progressbar.remove();
            this.loading = false;
            this.problems = response.data;
          })
          .catch(this.handleError);
      },
      handleError(err){
        progressbar.done();
        progressbar.remove();
        this.loading = false;

        let errors = this.getApiError(err);
        switch (err.response.status) {
          case 401:
            this.$store.commit(LOG_OUT);
            this.$router.replace({ path: '/login' });
            break;
          case 400:
            this.submitError = errors;
            break;
          default:
            this.error = errors;
        };
      }
    },

    mounted(){
      this.fetchProblems();
    }
  };
</script>