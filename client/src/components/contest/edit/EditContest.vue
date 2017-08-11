<template>
  <div class="row mt-4">

    <div class="col-md-12">
      <flash-message variant="success"></flash-message>
    </div>

    <div class="col-md-12" v-if="!!error">
      <smooth-alert :show="!!error" variant="danger">
        {{ error }}
      </smooth-alert>
    </div>

    <template v-if="!error">
      <div class="col-md-9">
        <loading-data :loading="loading" >
          <form @submit.prevent="submit('contest-form')" name="contest-form" data-vv-scope="contest-form">

            <div class="mb-4 row">
              <div class="col-md-6 form-bundle">
                <label class="row pl-3 mb-1">Type</label>
                <toggle-button
                data-toggle="tooltip" data-placement="bottom" title="Public"
                @change="public = $event.value"
                :value="public"
                :width="77"
                :height="23"
                :color="toggleColor"
                :labels="{ checked: 'PUBLIC', unchecked: 'PRIVATE' }"
                />
                <p class="mb-0 ml-1">
                  <small class="text-muted">
                    <template v-if="public">Any One Can Participate</template>
                    <template v-else>Only Invited Participants Can Participate</template>
                  </small>
                </p>
              </div>
            </div>

            <div class="mb-4 row">
              <div class="col-md-12 form-bundle">
                <label>Title</label>
                <div :class="{ 'has-danger': formError.has('contest-form.title')} ">
                  <input
                  type="text" v-model="title" class="form-control" placeholder="Contest Title"
                  name="title"
                  v-validate="'required|max:255'"
                  >
                  <span v-show="formError.has('contest-form.title')" class="help form-control-feedback">
                    {{ formError.first('contest-form.title') }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mb-4 row">
              <div class="col-md-12 form-bundle">
                <label>Begin Date and Time</label>
                <div class="date-input-icon input-icon-md">
                  <i class="material-icons md-20">event</i>
                  <div :class="{ 'has-danger': formError.has('contest-form.when')} ">
                    <Flatpickr placeholder="YYYY:MM:DD HH:MM:SS" class="form-control" v-model="when" :options="whenOptions"
                    :value="when"
                    data-vv-name="when"
                    v-validate="'required'"
                    />
                    <span v-show="formError.has('contest-form.when')" class="help form-control-feedback">
                      {{ formError.first('contest-form.when') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-4 row">
              <div class="col-md-6 form-bundle">
                <label>Duration (days)</label>
                <div :class="{ 'has-danger': formError.has('contest-form.days')} ">
                  <input type="number" v-model="days" name="days" class="form-control" placeholder="0"
                  v-validate="'required|numeric|min_value:0'"
                  >
                  <span v-show="formError.has('contest-form.days')" class="help form-control-feedback">
                    {{ formError.first('contest-form.days') }}
                  </span>
                </div>
              </div>
              <div class="col-md-6 form-bundle">
                <label>Duration (hh:mm:ss)</label>
                <div class="date-input-icon input-icon-md">
                  <i class="material-icons md-20">schedule</i>
                  <Flatpickr class="form-control" v-model="duration" :value="duration" :options="timeOptions" />
                </div>
              </div>
            </div>


            <!-- quill editor -->
            <div class="form-bundle">
              <label for="problemContentEditor">Description</label>
              <quill-editor
              :class="[ isFullscreen ? 'fullScreenEditor' : 'normalEditor' ]"
              id="problemContentEditor"
              ref="problemEditor"
              v-model="description"
              :options="editorOption"
              @ready="onEditorReady($event)"
              >
              <div id="toolbar" slot="toolbar">

                <div class="ql-formats">
                  <button class="ql-bold" data-toggle="tooltip" data-placement="bottom" title="Bold"></button>
                  <button class="ql-italic" data-toggle="tooltip" data-placement="bottom" title="Italic"></button>
                  <button class="ql-underline" data-toggle="tooltip" data-placement="bottom" title="underline"></button>
                  <button class="ql-blockquote" data-toggle="tooltip" data-placement="bottom" title="Block Quote"></button>
                  <button class="ql-code" data-toggle="tooltip" data-placement="bottom" title="Code snippet"></button>
                </div>

                <div class="ql-formats">
                  <select class="ql-align" data-toggle="tooltip" data-placement="bottom" title="alignment"></select>
                  <button class="ql-indent" value="-1" data-toggle="tooltip" data-placement="bottom" title="indent left"></button>
                  <button class="ql-indent" value="+1" data-toggle="tooltip" data-placement="bottom" title="indent right"></button>
                  <button class="ql-list" value="ordered" data-toggle="tooltip" data-placement="bottom" title="ordered list"></button>
                  <button class="ql-list" value="bullet" data-toggle="tooltip" data-placement="bottom" title="bullet list"></button>
                </div>

                <div class="ql-formats">
                  <select class="ql-size" data-toggle="tooltip" data-placement="bottom" title="font size"></select>
                  <button class="ql-header" value="1" data-toggle="tooltip" data-placement="bottom" title="header 1"></button>
                  <button class="ql-header" value="2" data-toggle="tooltip" data-placement="bottom" title="header 2"></button>
                  <select class="ql-header" data-toggle="tooltip" data-placement="bottom" title="header size"></select>
                </div>

                <div class="ql-formats">
                  <button class="ql-image" data-toggle="tooltip" data-placement="bottom" title="image"></button>
                  <button class="ql-video" data-toggle="tooltip" data-placement="bottom" title="video"></button>
                  <button class="ql-link" data-toggle="tooltip" data-placement="bottom" title="link"></button>
                  <button @click="fullScreen" class="ql-toggle-btn" data-toggle="tooltip" data-placement="bottom" :title="isFullscreen ? 'exit fullscreen' : 'fullscreen'">
                    <i class="material-icons" v-if="!isFullscreen">fullscreen</i>
                    <i class="material-icons" v-else>fullscreen_exit</i>
                  </button>
                </div>


                <div class="ql-formats">
                  <toggle-button
                  data-toggle="tooltip" data-placement="bottom" title="live preview"
                  @change="preview = $event.value"
                  :value="false"
                  :width="65"
                  :height="20"
                  :labels="{ checked: 'preview', unchecked: 'preview' }"
                  />
                </div>


              </div>
            </quill-editor>

          </div>

          <div class="mt-4 quill-live-preview" v-if="preview">
            <h4 class="mb-4 mt-2">{{ title }}</h4>
            <div v-html="description"></div>
          </div>


          <div class="mb-4 mt-4">
            <button type="submit" class="btn btn-md btn-primary">UPDATE</button>
          </div>

        </form>
      </loading-data>
    </div>
  </template>
  </div>
</template>

<script>

  import Flatpickr from '@/components/custom/Flatpickr';
  import quillOption from '@/config/quillOption';

  export default {
    name: 'EditContest',

    components: {
      Flatpickr
    },

    data () {
      return {
        days: '',
        title: '',
        public: true,
        when: '',
        duration: '',
        description: '',
        whenOptions: {
          minDate: 'today',
          enableTime: true,
          enableSeconds: true,
          time_24hr: true,
          minuteIncrement: 1
        },
        timeOptions: {
          enableTime: true,
          noCalendar: true,
          enableSeconds: true,
          time_24hr: true,
          defaultDate: '',
          minuteIncrement: 1
        },
        toggleColor: {
          checked: '#447DF7',
          unchecked: '#1D1F20'
        },
        editorOption: quillOption(),
        isFullscreen: false,
        preview: false,
        loading: true,
        error: null,
        submitError: null
      };
    },

    methods: {
      submit(scope){

        this.error = null;
        this.success = null;

        this.$validator
          .validateAll(scope)
          .then(result => {
            if(!result){
              return;
            }

            progressbar.start();

            let data = {
              title: this.title,
              type: this.public,
              when: this.when,
              duration: this.duration,
              days: this.days,
              description: this.description
            };

            this.$http
              .put(`/api/contest/edit/${this.$store.state.route.params.cid}`, data)
              .then(response => {
                progressbar.done();
                progressbar.remove();
                this.flash({ message: 'contest updated', variant: 'success' });
                window.location.reload();
              })
              .catch(this.handleError);
          });
      },
      onEditorReady(editor) {
        console.log('editor ready!', editor);
      },
      fullScreen(){
        if (screenfull.enabled) {
          screenfull.toggle( document.getElementById('problemContentEditor') );
        }
      },
      fullScreenListener(){
        this.isFullscreen = screenfull.isFullscreen;
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
      fetchContest(){
        progressbar.start();
        this.loading = true;

        this.$http
          .get(`/api/contest/edit/${this.$store.state.route.params.cid}`)
          .then(response => {
            this.loading = false;
            progressbar.done();
            progressbar.remove();

            this.public = (parseInt(response.data.type) === 1);
            this.when = response.data.begin;
            this.days = response.data.days;
            this.title = response.data.title;
            this.duration = response.data.duration;
            this.description = response.data.description;
          })
          .catch(this.handleError);
      }
    },

    mounted(){
      this.fetchContest();
    },

    created(){
      if (screenfull.enabled) {
        screenfull.on('change', this.fullScreenListener);
      }
    },

    beforeDestroy(){
      if (screenfull.enabled){
        screenfull.off('change', this.fullScreenListener);
      }
    }
  };
</script>



<style>

  .normalEditor .ql-container,
  .normalEditor .ql-editor{
    min-height: 35em;
    max-height: 30em;
  }

  .fullScreenEditor{
    min-height: 100vh;
    overflow: auto;
  }

  .ql-container, .ql-editor {
    padding-bottom: 1em;
  }
</style>