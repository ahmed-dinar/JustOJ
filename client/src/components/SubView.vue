<template>
  <div>

    <div v-if="!!error">
      <smooth-alert variant="danger">
        {{ error }}
      </smooth-alert>
    </div>

    <div class="row" v-else>
      <div class="col-md-12">
        <div class="card mb-5">
          <loading-data :loading="loading">
            <m-table
              :items="submission"
              :fields="fields"
              keyIdentifier="submittime"
              class="submission-table"
            >
              <template slot="id" scope="sub">
                <router-link :to="`/submissions/${sub.value}`" >
                  {{ sub.value }}
                </router-link>
              </template>
              <template slot="submittime" scope="sub">
                <div v-tooltip="sub.value">
                  {{ fromWhen(sub.value) }}
                </div>
              </template>
              <template slot="username" scope="sub">
                <router-link :to="`/user/${sub.value}`" >
                  {{ sub.value }}
                </router-link>
              </template>
              <template slot="title" scope="sub">
                <router-link v-tooltip="sub.value" :to="`/problems/${sub.item.pid}/${sub.item.slug}`" >
                  {{ sub.value }}
                </router-link>
              </template>
              <template slot="language" scope="sub">
                {{ getRunLang(sub.value) }}
              </template>
              <template slot="cpu" scope="sub">
                {{ roundTo(sub.value) }}s
              </template>
              <template slot="memory" scope="sub">
                {{ toMB(sub.value) }}
              </template>
              <template slot="status" scope="sub">
                <b-badge :variant="statusVariant(sub.value)">
                  {{  getRunStatus(sub.value) }}
                </b-badge>
              </template>
            </m-table>
          </loading-data>
        </div>
      </div>
    </div>
  </div>
</template>

<script type="text/javascript">

  import submissionMixin from '@/mixins/submission';

  export default {
    name: 'SubmissionView',
    mixins: [ submissionMixin ],

    data(){
      return {
        submission: null,
        loading: true,
        error: null,
        fields: {
          id: {
            label: '#',
            tdClass: ['ellipsis','subs-index-cell']
          },
          submittime: {
            label: 'When'
          },
          username: {
            label: 'Who',
            tdClass: ['ellipsis','subs-title-cell']
          },
          title: {
            label: 'Problem',
            tdClass: ['ellipsis','subs-title-cell']
          },
          language: {
            label: 'Lang'
          },
          cpu: {
            label: 'CPU'
          },
          memory: {
            label: 'Memory'
          },
          status: {
            label: 'Verdict'
          }
        }

      };
    },
    methods: {
      fetchSubmission(){
        this.loading = true;
        progressbar.start();

        this.$http
          .get(`/api/submission/${this.$store.state.route.params.sid}`)
          .then(response => {
            console.log(response);
            this.submission = response.data;
            this.loading = false;
            progressbar.done();
            progressbar.remove();
          })
          .catch(err => {
            console.log(err);
            this.loading = false;
            progressbar.done();
            progressbar.remove(); 
          });
      }
    },


    mounted(){
      this.fetchSubmission();

    }
  };
</script>