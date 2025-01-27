![VeriGlyph: Verifiable, On-Chain Registration Certificates](https://github.com/VeriGlyph/media/blob/8ace91d004c913c5b13b4e5aaa45aab125653524/header.png)

# VeriGlyph: Nexus

![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Vuetify](https://img.shields.io/badge/Vuetify-1867C0?style=for-the-badge&logo=vuetify&logoColor=AEDDFF)
![Alpha](https://placehold.co/100x28/6404fb/ffffff?text=ALPHA&font=roboto)
![Version: 0.0.1](https://placehold.co/100x28/170a40/ffffff?text=0.0.1&font=roboto)

Your hub for creating, managing, and publishing CIP-88 Registration Certificates on the Cardano Blockchain.

> TODO: Write better documentation...

**NOTE: THIS SOFTWARE IS CURRENTLY IN AN EARLY POC (PROOF OF CONCEPT) ALPHA STAGE AND SHOULD NOT BE USED IN PRODUCTION.
FOR TESTING AND ITERATING ON THE CARDANO PREPRODUCTION TESTNET ONLY AT THIS POINT.**

## Installation (Docker)

### Prerequisites

- Linux (tested on Ubuntu)
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Make](https://askubuntu.com/questions/161104/how-do-i-install-make)
- Docker ([Part-1](https://docs.docker.com/engine/install/ubuntu/) & [Part-2](https://docs.docker.com/engine/install/linux-postinstall/))

### Steps

1. Clone the repository: `git clone git@github.com:VeriGlyph/Nexus.git`
2. Change directory: `cd Nexus`
3. Build & run the container: `make up`

> The app will be running on http://localhost:8300

### Available Make Commands

_To run the make commands, simple type `make command-name` (e.g. `make up`)_

* `up` Starts the docker container
* `down` Shuts down the docker container
* `status` View the status of running container
* `stats` View the resource usage of running container
* `logs` View the logs out of running container
* `shell` Drop into an interactive shell inside running container

## Installation (Standalone)

### Steps

1. Clone the repository: `git clone git@github.com:VeriGlyph/Nexus.git`
2. Change directory: `cd Nexus`
3. Install npm packages: `npm install`
4. Compiles and hot-reloads for development: `npm run serve`

> The app will be running on http://localhost:8080

### Compiles and minifies for production
> npm run build

### Lints and fixes files
> npm run lint

## Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
