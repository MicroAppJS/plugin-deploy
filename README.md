# Micro APP Plugin - Deploy

[Plugin] auto deploy plugin.

集成自动部署配置. 用于 `@micro-app/cli` 的插件.

[![Github Actions Coveralls][Github-Actions-Coveralls]][Github-Actions-Coveralls-url]
[![Coverage Status][Coverage-img]][Coverage-url]
[![NPM Version][npm-img]][npm-url]
[![NPM Download][download-img]][download-url]

[Github-Actions-Coveralls]: https://github.com/MicroAppJS/plugin-deploy/workflows/Coveralls/badge.svg
[Github-Actions-Coveralls-url]: https://github.com/MicroAppJS/plugin-deploy
[Coverage-img]: https://coveralls.io/repos/github/MicroAppJS/plugin-deploy/badge.svg?branch=master
[Coverage-url]: https://coveralls.io/github/MicroAppJS/plugin-deploy?branch=master
[npm-img]: https://img.shields.io/npm/v/@micro-app/plugin-deploy.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@micro-app/plugin-deploy
[download-img]: https://img.shields.io/npm/dm/@micro-app/plugin-deploy.svg?style=flat-square
[download-url]: https://npmjs.org/package/@micro-app/plugin-deploy

## Install

```sh
yarn add @micro-app/plugin-deploy
```

or

```sh
npm install -S @micro-app/plugin-deploy
```

## Usage

### 在项目 `根目录` 的 `micro-app.config.js` 文件中配置

```js
module.exports = {
    // ...

    plugins: [ // 自定义插件
        [ '@micro-app/plugin-deploy', {
            // default config
            git: '',
            branch: {
                name: '',
                extends: true,
            },
            message: '',
            user: {
                name: '',
                email: '',
            },
        } ],
    ],
};
```

### 创建 `micro-app.deploy.config.js` 文件, 并如下配置

```js
{
    // disabled: false, // 是否禁用该功能
    git: '',
    branch: {
        name: '',
        extends: true,
    },
    message: '', // 可选
    user: { // 可选
        name: '',
        email: '',
    },
    dist: '', // 可选原数据
    cname: '', // 可选
}
```
