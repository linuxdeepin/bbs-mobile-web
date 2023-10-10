import { createApp } from "vue";
import { createPinia } from "pinia";

import "./app.scss";

const App = createApp({});

App.use(createPinia());
export default App;
