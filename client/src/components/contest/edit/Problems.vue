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

      <div class="d-flex mb-2">
        <a class="btn-iconic btn btn-outline-primary btn-xs" :href="addLink" target="_blank">
          <i class="material-icons mr-1">add</i> Add Problem
        </a>
      </div>

      <loading-data :loading="loading">
        <m-table
        show-empty
        empty-text="No Problem Added"
        :items="problems"
        :fields="fields"
        class="table-gray"
        >
        <template slot="index" scope="prob">
          {{ prob.index + 1 }}
        </template>
        <template slot="title" scope="prob">
          {{ prob.value }}
        </template>
        <template slot="status" scope="prob">
          <span :class="['badge', 'badge-bold', prob.value === 'incomplete' ? 'badge-secondary' : 'badge-success' ]">
          {{ prob.value | capitalize }}
          </span>
        </template>
        <template slot="actions" scope="prob">
          <div class="d-flex">
            <a v-tooltip="'Edit'" :href="`/problems/${prob.item.id}/edit/statement`" class="btn btn-sm btn-iconic btn-outline-primary mr-1" target="_blank">
              <i class="material-icons">mode_edit</i>
            </a>
            <button v-tooltip="'Remove'" class="btn btn-sm btn-iconic btn-outline-danger" @click="removeIt(prob.item.id)">
              <i class="material-icons">delete</i>
            </button>
          </div>
        </template>
      </m-table>
    </loading-data>
    </template>
  </div>
</template>

<script type="text/javascript">

  import Confirm from '@/lib/ConfirmSwal';

  export default {
    name: 'EditContestProblems',

    data(){
      return {
        problems: null,
        fields: {
          index: {
            label: '#',
            thStyle: { width: '5%' }
          },
          title: {
            label: 'Title'
          },
          status: {
            label: 'Status',
            thStyle: { width: '10%' }
          },
          actions: {
            label: 'Action',
            thStyle: { width: '10%' }
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
        progressbar.start();
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
      },
      removeIt(pid){

        Confirm(
        'DLETE PROBLEM'
        ).then(() => {

          progressbar.start();
          this.error = null;

          this.$http
            .delete(`/api/contest/edit/${this.$store.state.route.params.cid}/problems?problem=${pid}`)
            .then(response => {
              progressbar.done();
              progressbar.remove();
              this.$noty.success('problem successfully removed');
              this.fetchProblems();
            })
            .catch(this.handleError);
        }).catch(()=>{});
      }
    },

    filters: {
      capitalize(val){
        return val.charAt(0).toUpperCase() + val.slice(1);
      }
    },

    mounted(){
      this.fetchProblems();
    }
  };
</script>