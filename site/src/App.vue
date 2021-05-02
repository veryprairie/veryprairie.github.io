<template>
  <v-app :style="{background: $vuetify.theme.themes[theme].background}">
    <v-app-bar
      app
      color="primary"
    >
      <!-- <div class="d-flex align-center">
        <v-img
          alt="MPI Logo"
          contain
          class="pa-10 brightness"
          src="./assets/logo.png"
          transition="scale-transition"
          max-width="500"
        />
      </div> -->
      <v-spacer></v-spacer>

    <div>
      <v-tooltip v-if="!$vuetify.theme.dark" bottom>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" color="info" small fab @click="darkMode">
            <v-icon class="mr-1">mdi-moon-waxing-crescent</v-icon>
          </v-btn>
        </template>
        <span>Dark Mode On</span>
      </v-tooltip>

      <v-tooltip v-else bottom>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" color="info" small fab @click="darkMode">
            <v-icon color="yellow">mdi-white-balance-sunny</v-icon>
          </v-btn>
        </template>
        <span>Dark Mode Off</span>
      </v-tooltip>
    </div>
    </v-app-bar>

    <v-main>
      <v-container>
          <v-col>
              <v-row justify="center">
              <v-date-picker
                  v-model="picker"
                  :events="arrayEvents"
                  event-color="green lighten-1"
                  @click:date="chosenOne"
                  :disabled="loading"
                  show-adjacent-months
                  year-icon="mdi-calendar-blank"
                  prev-icon="mdi-skip-previous"
                  next-icon="mdi-skip-next"
              >
              <v-overlay
                :value="loading"
              >
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
              </v-overlay>
              </v-date-picker>
              </v-row>
          </v-col>
          <v-col>
            <v-card-title>
              Results
              <v-spacer></v-spacer>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
              ></v-text-field>
            </v-card-title>
            <v-data-table
              :headers="headers"
              :items="items"
              :search="search"
              class="elevation-1"
            >
              <template #item.file="{ value }">
                <v-btn target="_blank" :href="value.url">
                  {{ value.name }}
                </v-btn>
        </template>
            </v-data-table>
          </v-col>
          <v-alert
            border="bottom"
            colored-border
            type="error"
            elevation="2"
            dismissible
            transition="scale-transition"
            v-model="noHearings"
          >
            No hearings available!
          </v-alert>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>

const { request } = require("gaxios");

export default {
  name: 'Courtsearch',

  methods: {
    darkMode() {
      return this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    },
    async chosenOne() {
      // clear any results from a previous run
      // this.items.length = 0;
      // set loading state so that we can't issue further requests
      this.loading=true;
      // pass the datepicker value to our API and return the data property
      const searching = (await request({
        // url: "http://localhost:3000/dev/search",
        url: "https://api.courtsearch.website/search",
        method: 'POST',
        data: {
          searchDate: this.picker,
        }
      })).data;
      // push to our results table
      for (const hearing of searching) {
        this.items.push(hearing);
      }
      // alert if no results
      if (!searching.length) this.noHearings = true;
      // reset for another run
      this.loading=false;
    }
  },
  data: () => ({
    // bring in the value from our date picker
    picker: new Date().toISOString().substr(0, 10),
    // pre-set our headers (could also establish them after making our request)
    headers: [
      { text: 'Location', value: 'location' },
      { text: 'Party', value: 'party' },
      { text: 'File No.', value: 'file' },
      { text: 'Date', value: 'date' },
      { text: 'Time', value: 'time' },
      { text: 'Details', value: 'details' },
    ],
    // instantiate array to push items to
    items: [],
    // returning dates already picked
    arrayEvents: [],
    mounted () {
      this.arrayEvents = [...Array(6)].map(() => {
        const day = Math.floor(Math.random() * 30)
        const d = new Date()
        d.setDate(day)
        return d.toISOString().substr(0, 10)
      })
    },
    // boolean to toggle loading state
    loading: false,
    // search field for results table
    search: '',
    // boolean to toggle alert state
    noHearings: false
  }),
  computed:{
    theme(){
      // toggle for our fancy dark mode switch
      return (this.$vuetify.theme.dark) ? 'dark' : 'light'
    },
  },
};
</script>

<style scoped>
  /* colour overlay to recolour our logo */
  .brightness { filter: brightness(100); }
</style>