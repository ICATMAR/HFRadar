// https://github.com/FranckFreiburger/vue3-sfc-loader
// https://github.com/FranckFreiburger/vue3-sfc-loader/blob/main/docs/examples.md#use-sfc-custom-blocks-for-i18n
import ca from './lang/ca.js';
import en from './lang/en.js';
import es from './lang/es.js';
// Load classes
// SceneManager
// import SceneManager from "/OBSEA/Components/SceneManager.js"
// window.SceneManager = SceneManager;
// // DataManager
// import DataManager from "/OBSEA/data/DataManager.js"
// window.DataManager = DataManager;
// Declare event emitter
// https://github.com/developit/mitt
window.eventBus = window.mitt();


// Load scripts
import {loadRawHFData, readFile} from './Assets/loadRawHFData.js';
import CreateImage from './Assets/createImage.js';
import DataManager from './Assets/DataManager.js';
import AnimationEngine from './Assets/AnimationEngine.js'
window.loadData = loadRawHFData;
window.readFile = readFile;
window.createImage = CreateImage;
window.DataManager = new DataManager();
window.AnimationEngine = AnimationEngine;


// Declare translations
const i18n = VueI18n.createI18n({
  // https://vue-i18n.intlify.dev/guide/essentials/fallback.html#explicit-fallback-with-one-locale
  silentTranslationWarn: true, 
  silentFallbackWarn: true,
  missingWarn: false,
  fallbackWarn: false,
});


const options = {
  moduleCache: { vue: Vue },
  async getFile(url) {
    const res = await fetch(url);
    if (!res.ok)
      throw Object.assign(new Error(res.statusText + ' ' + url), { res });
    return {
      getContentData: asBinary => asBinary ? res.arrayBuffer() : res.text(),
    }
  },
  addStyle: (textContent) => {
    const style = Object.assign(document.createElement('style'), { textContent });
    const ref = document.head.getElementsByTagName('style')[0] || null;
    document.head.insertBefore(style, ref);
  },
  customBlockHandler(block, filename, options) {

    if (block.type !== 'i18n')
      return

    const messages = JSON.parse(block.content);
    for (let locale in messages)
      i18n.global.mergeLocaleMessage(locale, messages[locale]);
  }
}


const { loadModule } = window['vue3-sfc-loader'];

const app = Vue.createApp({
  components: {
    'app-manager': Vue.defineAsyncComponent(() => loadModule('./Components/AppManager.vue', options)),
  },
  template: '<app-manager></app-manager>'
});

// Translations
i18n.global.mergeLocaleMessage('ca', ca);
i18n.global.mergeLocaleMessage('en', en);
i18n.global.mergeLocaleMessage('es', es);
app.use(i18n);
app.mount(document.body);