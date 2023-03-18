import topLevelAwait from 'vite-plugin-top-level-await';


export default {
    plugins: [
        topLevelAwait(),
    ],
    base: "./",
    server: {
        host: '0.0.0.0',
    },
};
