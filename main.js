// https://github.com/FranckFreiburger/vue3-sfc-loader
// https://github.com/FranckFreiburger/vue3-sfc-loader/blob/main/docs/examples.md#use-sfc-custom-blocks-for-i18n
import ca from './lang/ca.js';
import en from './lang/en.js';
import es from './lang/es.js';

// Declare event emitter
// https://github.com/developit/mitt
window.eventBus = window.mitt();

// Utils for hash and routing
import {setHashValue, getHashValue, removeHash} from './Assets/Scripts/utils.js';
window.location.setHashValue = setHashValue;
window.location.getHashValue = getHashValue;
window.location.removeHash = removeHash;


// Load scripts
import CreateImage from './Assets/Scripts/createImage.js';
import FileManager from './Assets/Scripts/FileManager.js';
import DataManager from './Assets/Scripts/DataManager.js';
import GUIManager from './Assets/Scripts/GUIManager.js';
import GAnalyticsManager from './Assets/Scripts/GAnalyticsManager.js';
import AnimationEngine from './Assets/Scripts/AnimationEngine.js';


// Web worker
if (window.Worker)
  window.DataWorker = new Worker('./Assets/Scripts/worker.js'); // undefined for testing without web worker
else {
  console.warn('Workers not supported.');
  alert('Web Workers not supported. Loading experience might be slower than usual.');
}

window.createImage = CreateImage;

window.FileManager = new FileManager();
window.DataManager = new DataManager();
window.GUIManager = new GUIManager();
window.GAnalyticsManager = new GAnalyticsManager();
window.AnimationEngine = AnimationEngine;

// Import WMTSDataRetriever
import WMTSDataRetrieverClass from './Assets/Scripts/WMTS/WMTSDataRetriever.js';
window.WMTSDataRetriever = new WMTSDataRetrieverClass();
// Import tile manager
import WMTSTileManagerClass from './Assets/Scripts/WMTS/WMTSTileManager.js'
window.WMTSTileManager = new WMTSTileManagerClass();




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