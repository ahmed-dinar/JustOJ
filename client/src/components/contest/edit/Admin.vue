<template>
  <div>
    <div class="col-md-12" v-if="!!error">
      <b-alert variant="danger" :show="!!error">
        {{ error }}
      </b-alert>
    </div>
    <div class="row" v-else>

      <h6 class="p-0 mb-3 btn-iconic">
        <i class="material-icons mr-1">settings_applications</i> Contest Admin
      </h6>

      <loading-data :loading="loading">
        <b-table
        :items="contests"
        :fields="fields"
        class="table-gray"
        >
          <template slot="index" scope="contest">{{ contest.index + 1 }}</template>
          <template slot="title" scope="contest">
            <div class="list-group-item flex-column align-items-start list-group-cell">
              <h6 class="m-0">{{ contest.value }}</h6>
              <p class="text-muted small-text m-0">{{ timeFormat(contest.item) }}</p>
            </div>
          </template>

          <template slot="status" scope="contest">
            <span :class="['badge', 'badge-bold', contest.value === 0 ? 'badge-secondary' : 'badge-success' ]">
              {{ getVisibility(contest.value) }}
            </span>
          </template>

          <template slot="action" scope="contest">
            <div class="d-flex">
              <a v-tooltip="'Edit'" :href="`/contests/${contest.item.id}/edit`" class="btn btn-sm btn-iconic btn-outline-primary mr-1" target="_blank">
                <i class="material-icons">mode_edit</i>
              </a>
              <button v-tooltip="'Remove'" class="btn btn-sm btn-iconic btn-outline-danger" @click="removeIt(contest.item)">
                <i class="material-icons">delete</i>
              </button>
            </div>
          </template>
        </b-table>
      </loading-data>

    </div>
  </div>
</template>

<script type="text/javascript">

  import moment from 'moment';
  import { ConfimRestrict } from '@/lib/ConfirmSwal';

  export default {
    name: 'ContestAdmin',

    data(){
      return {
        contests: null,
        fields: {
          index: {
            label: '#',
            thStyle: { width: '2%' }
          },
          title: {
            label: 'Title'
          },
          status: {
            label: 'Visibility',
            thStyle: { width: '10%' }
          },
          action: {
            label: 'Action',
            thStyle: { width: '10%' }
          }
        },
        error: null,
        loading: true
      };
    },

    methods: {
      fetchContest(){
        progressbar.start();
        this.loading = true;
        this.error = null;

        this.$http
          .get('/api/contest/admin')
          .then(response => {
            this.loading = false;
            progressbar.done();
            progressbar.remove();
            this.contests = response.data;
          })
          .catch(err => {
            this.loading = false;
            progressbar.done();
            progressbar.remove();
            this.error = this.getApiError(err);
          });
      },
      removeIt(contest){


        ConfimRestrict(
          'DELETE CONTEST',
          'This will delete everything related to this contest and CANNOT be undone.',
          'Contest Title'
          )
          .then(confirmText => {

            if( confirmText !== contest.title ){
              this.$noty.error('Title Doesn\'t Match');
              return;
            }

            progressbar.start();
            this.error = null;

            this.$http
              .delete(`/api/contest/admin?contest=${contest.id}`)
              .then(response => {
                progressbar.done();
                progressbar.remove();
                this.$noty.success('contest successfully removed');
                this.fetchContest();
              })
              .catch(err => {
                progressbar.done();
                progressbar.remove();
                this.error = this.getApiError(err);
              });
          })
          .catch(()=>{});
      },
      timeFormat(contest){
        if( moment().isBefore(contest.begin) ){
          return `Starts ${moment().to(contest.begin)}`;
        }
        return `Started ${moment().from(contest.begin)}, Ends ${moment().to(contest.end)}`;
      },
      getVisibility(code){
        switch(code){
          case 0:
            return 'Incomplete';
          case 1:
            return 'Hidden';
          case 2:
            return 'Public';
          default:
            return 'Unknown';
        }
      }
    },

    mounted(){
      this.fetchContest();
    }
  };
</script>