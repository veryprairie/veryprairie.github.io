# courtsearch

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

### Deployment

in cd site:
aws s3 cp ./dist s3://courtsearch.website --recursive

offline:
serverless offline
serverless deploy
