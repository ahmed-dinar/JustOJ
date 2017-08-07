<template>
  <div class="row">
    <div class="col-md-9">

      <h5 class="mb-4 btn-iconic pl-0">
          <i class="material-icons mr-1">date_range</i> Create Contest
      </h5>

      <form @submit.prevent="submit('contest-form')" name="contest-form" data-vv-scope="contest-form">

        <div class="mb-4 row">
          <div class="col-md-6 form-bundle">
            <label class="row pl-3 mb-1">Type</label>
            <toggle-button
            data-toggle="tooltip" data-placement="bottom" title="Public"
            @change="public = $event.value"
            :value="true"
            :width="78"
            :height="25"
            :color="toggleColor"
            :labels="{ checked: 'Public', unchecked: 'Private' }"
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
            <label>Date and Time</label>
            <div class="date-input-icon input-icon-md">
              <i class="material-icons">event</i>
              <div :class="{ 'has-danger': formError.has('contest-form.when')} ">
                <Flatpickr placeholder="YYYY:MM:DD HH:MM:SS" class="form-control" v-model="when" :options="whenOptions"
                name="when"
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
              <input type="number" v-model="days" class="form-control" placeholder="0" >
              <span v-show="formError.has('contest-form.days')" class="help form-control-feedback">
                {{ formError.first('contest-form.days') }}
              </span>
            </div>
          </div>
          <div class="col-md-6 form-bundle">
            <label>Duration (hh:mm:ss)</label>
            <div class="date-input-icon input-icon-md">
              <i class="material-icons">schedule</i>
              <div :class="{ 'has-danger': formError.has('contest-form.duration')} ">
                <Flatpickr class="form-control" v-model="duration" :options="timeOptions" />
                <span v-show="formError.has('contest-form.duration')" class="help form-control-feedback">
                  {{ formError.first('contest-form.duration') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <button type="submit" class="btn btn-md btn-primary">Submit</button>
        </div>

      </form>

    </div>
  </div>
</template>

<script>

  import moment from 'moment';
  import Flatpickr from '@/components/custom/Flatpickr';

  export default {
    name: 'CreateContest',

    components: {
      Flatpickr
    },

    data () {
      return {
        days: '',
        title: '',
        public: true,
        when: '',
        duration: '3:00:00',
        whenOptions: {
          minDate: 'today',
          enableTime: true,
          enableSeconds: true
        },
        timeOptions: {
          enableTime: true,
          noCalendar: true,
          enableSeconds: true,
          time_24hr: true,
          defaultDate: '3:00:00',
          minuteIncrement: 1
        },
        toggleColor: {
          checked: '#2196F3',
          unchecked: '#1D1F20'
        }
      };
    },

    mounted(){
      console.log(moment().format('DD:MM:YYYY'));
    }
  };
</script>

