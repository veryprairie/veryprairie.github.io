import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify);

export default new Vuetify({ 
    theme: {
        themes: {
            light: {
                primary: colors.blue,
                secondary: colors.grey.darken1,
                accent: colors.blue.darken3,
                error: colors.red.accent3,
                background: colors.shades.white
              },
              dark: {
                primary: colors.grey.darken4,
                background: colors.grey.darken5
              },
        }
    }
});
