import { createApp } from 'vue';
import {createRouter, createWebHashHistory} from 'vue-router';

import App from './App.vue';
import ocrPage from './components/ocr-page.vue';
import translatePage from './components/translate-page.vue';
import optionsPage from './components/options-page.vue';
import historicalOverview from './components/historical-overview-page.vue';
import userPage from './components/user-page.vue';
import aboutPage from './components/about-page.vue';
import exportAndImportDataPage from './components/export-and-import-data-page.vue';
import ocrHistoryPage from './components/ocr-history-page.vue';
import translationHistoryPage from './components/translation-history-page.vue';

import {Button as TButton,
  TabBar,
  TabBarItem,
  Navbar,
  Picker,
  Popup,
  Textarea,
  Cell,
  CellGroup,
  Slider,
  Switch,
  Empty,
  TypographyText,
  TypographyTitle,
  TypographyParagraph,
  Link,
  Table
} from 'tdesign-mobile-vue';
import 'tdesign-mobile-vue/es/style/index.css';

// 路由
const router = createRouter({
  routes: [
    {path: '/', component: ocrPage, name: 'ocrPage'},
    {path: '/translate', component: translatePage, name: 'translatePage'},
    {path: '/options', component: optionsPage, name: 'optionsPage'},
    {path: '/historical-overview', component: historicalOverview, name: 'historicalOverview'},
    {path: '/user', component: userPage, name: 'userPage'},
    {path: '/about', component: aboutPage, name: 'aboutPage'},
    {path: '/export-and-import-data', component: exportAndImportDataPage, name: 'exportAndImportDataPage'},
    {path: '/ocr-history', component: ocrHistoryPage, name: 'ocrHistoryPage'},
    {path: '/translation-history', component: translationHistoryPage, name: 'translationHistoryPage'}
  ],
  history: createWebHashHistory()
});

const app = createApp(App);
app.use(router);
app.use(TButton);
app.use(TabBar);
app.use(TabBarItem);
app.use(Navbar);
app.use(Picker);
app.use(Popup);
app.use(Textarea);
app.use(Cell);
app.use(CellGroup);
app.use(Slider);
app.use(Switch);
app.use(Empty);
app.use(TypographyText);
app.use(TypographyTitle);
app.use(TypographyParagraph);
app.use(Link);
app.use(Table);
app.mount('#app');