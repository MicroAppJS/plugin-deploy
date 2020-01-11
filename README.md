# Micro APP Plugin - Deploy Command

[Plugin] auto deploy command plugin.

基于webpack多入口的多仓库业务模块开发的插件应用框架核心库.

[![Coverage Status][Coverage-img]][Coverage-url]
[![CircleCI][CircleCI-img]][CircleCI-url]
[![NPM Version][npm-img]][npm-url]
[![NPM Download][download-img]][download-url]

[Coverage-img]: https://coveralls.io/repos/github/MicroAppJS/MicroApp-Plugin-Deploy-Command/badge.svg?branch=master
[Coverage-url]: https://coveralls.io/github/MicroAppJS/MicroApp-Plugin-Deploy-Command?branch=master
[CircleCI-img]: https://circleci.com/gh/MicroAppJS/MicroApp-Plugin-Deploy-Command/tree/master.svg?style=svg
[CircleCI-url]: https://circleci.com/gh/MicroAppJS/MicroApp-Plugin-Deploy-Command/tree/master
[npm-img]: https://img.shields.io/npm/v/@micro-app/plugin-deploy-command.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@micro-app/plugin-deploy-command
[download-img]: https://img.shields.io/npm/dm/@micro-app/plugin-deploy-command.svg?style=flat-square
[download-url]: https://npmjs.org/package/@micro-app/plugin-deploy-command

## Install

```sh
yarn add @micro-app/plugin-deploy-command
```

or

```sh
npm install -S @micro-app/plugin-deploy-command
```

## Usage

### 在项目 `根目录` 的 `micro-app.config.js` 文件中配置

```js
module.exports = {
    // ...

    plugins: [ // 自定义插件
        [ '@micro-app/plugin-deploy-command', {
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


### 创建 `micro-app.deploy.config.js` 文件, 并如下配置:

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
