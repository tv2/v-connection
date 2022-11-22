# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [7.1.0](https://github.com/tv2/v-connection/compare/v7.0.2...v7.1.0) (2022-11-18)

### Features

- add method to list shows in the MSE's directory ([76b253f](https://github.com/tv2/v-connection/commit/76b253fffc6b57b17f36d79d2452281a4f01d258))

### [7.0.2](https://github.com/tv2/v-connection/compare/v7.0.1...v7.0.2) (2022-11-11)

### [7.0.1](https://github.com/tv2/v-connection/compare/v7.0.0...v7.0.1) (2022-11-11)

## [7.0.0](https://github.com/tv2/v-connection/compare/v6.1.0...v7.0.0) (2022-11-11)

### ⚠ BREAKING CHANGES

- SOF-1081 Only clean Shows that belongs to Sofie

### Features

- SOF-1081 Only clean Shows that belongs to Sofie ([b5889e3](https://github.com/tv2/v-connection/commit/b5889e34d776e36a064820b3ae66ced62c8aa126))

### Bug Fixes

- SOF-1081 Refactor duplicated logic away ([b6737fb](https://github.com/tv2/v-connection/commit/b6737fb64237313692453d0120d08299a44f9fc7))
- SOF-1081 Refactor for more precise naming ([d50e174](https://github.com/tv2/v-connection/commit/d50e174bf5452a80467255f9ed9f602c825869f5))

## [6.1.0](https://github.com/tv2/v-connection/compare/v6.0.3...v6.1.0) (2022-10-27)

### Features

- SOF-1140 allow creating elements that have more fields than mastertemplate supports ([466c722](https://github.com/tv2/v-connection/commit/466c7228efdda63e8229931dc4e507f4c85c5c51))

### [6.0.3](https://github.com/tv2/v-connection/compare/v6.0.1...v6.0.3) (2022-10-14)

### Bug Fixes

- convert peptalk error message explicit into a string ([b43513b](https://github.com/tv2/v-connection/commit/b43513b7ad4e5f1ea4bd2d449905504b3d80fa50))
- Functions that return promises must be async ([f737e12](https://github.com/tv2/v-connection/commit/f737e123aa5de2b3426258574d0203b04e75009b))
- SOF-941 add missing awaits ([7fb1106](https://github.com/tv2/v-connection/commit/7fb110683f9f5f570e97a446752b69ea3d41abc7))
- solved errors from eslint/prettier VS Code extension. ([489c0ea](https://github.com/tv2/v-connection/commit/489c0eaee84ed37524d33792e062208c326950a8))

### [6.0.2](https://github.com/tv2/v-connection/compare/v6.0.1...v6.0.2) (2022-06-22)

### Bug Fixes

- convert peptalk error message explicit into a string ([b43513b](https://github.com/tv2/v-connection/commit/b43513b7ad4e5f1ea4bd2d449905504b3d80fa50))
- Functions that return promises must be async ([f737e12](https://github.com/tv2/v-connection/commit/f737e123aa5de2b3426258574d0203b04e75009b))
- SOF-941 add missing awaits ([7fb1106](https://github.com/tv2/v-connection/commit/7fb110683f9f5f570e97a446752b69ea3d41abc7))
- solved errors from eslint/prettier VS Code extension. ([489c0ea](https://github.com/tv2/v-connection/commit/489c0eaee84ed37524d33792e062208c326950a8))

### [6.0.1](https://github.com/tv2/v-connection/compare/v6.0.0...v6.0.1) (2022-05-19)

## [6.0.0](https://github.com/tv2/v-connection/compare/v5.1.2...v6.0.0) (2022-03-16)

### ⚠ BREAKING CHANGES

- support internal elements in multiple shows

### Features

- SOF-752 purge internal elements ([2317f79](https://github.com/tv2/v-connection/commit/2317f79dd532aff28fc790ca093d6eeae90ad79c))
- support internal elements in multiple shows ([fd0e4de](https://github.com/tv2/v-connection/commit/fd0e4de9fd8d2c4255c4afd5eb8d59fa09534df1))

### [5.1.1](https://github.com/tv2/v-connection/compare/v5.1.0...v5.1.1) (2021-10-19)

### Bug Fixes

- don't throw away middle chunks ([62215f1](https://github.com/tv2/v-connection/commit/62215f1ea8733c0e00e65e146cae96a54528074b))

## [5.1.0](https://github.com/tv2/v-connection/compare/v5.0.1...v5.1.0) (2021-09-20)

### Features

- keep some elements on purge ([37cacf3](https://github.com/tv2/v-connection/commit/37cacf39348f2785b5aea6ed3468e99d5b2fa5b3))

### Bug Fixes

- handle both possible scheduler top level node names ([5fbf986](https://github.com/tv2/v-connection/commit/5fbf986c06aa7d34ca3fd7b212a5b2bac55359df))
- prevent a race condition on reconnect attempt ([77936cd](https://github.com/tv2/v-connection/commit/77936cdeac5dfb87218508bbc56f9800f5aac242))
- reinitialize PepTalk client to reconnect ([fa19cdc](https://github.com/tv2/v-connection/commit/fa19cdc3baab83a51525332d83c67e05dd805183))
- treat error same as close ([0d05dd0](https://github.com/tv2/v-connection/commit/0d05dd0bd3b874384fac49bcaf7dc7a89f6c4d4f))

### [5.0.1](https://github.com/tv2/v-connection/compare/v5.0.0...v5.0.1) (2021-09-19)

### Bug Fixes

- rundown.deleteElement() didn't work ([645e486](https://github.com/tv2/v-connection/commit/645e4868c1f84c7c423bf18b70f1979b7fdde967))

### [4.0.3](https://github.com/tv2/v-connection/compare/v4.0.2...v4.0.3) (2021-08-30)

### [4.0.2](https://github.com/tv2/v-connection/compare/v4.0.1...v4.0.2) (2021-08-30)

### Bug Fixes

- donwload dist artifacts before publish ([7d1c645](https://github.com/tv2/v-connection/commit/7d1c6452e1670e7e5c35278a849b19f3e6f0b063))

### [4.0.1](https://github.com/tv2/v-connection/compare/v4.0.0...v4.0.1) (2021-08-30)

### Bug Fixes

- package json olzzon->tv2 ([f82095c](https://github.com/tv2/v-connection/commit/f82095cef496811aec8813503d4aa91ba3565481))

## 4.0.0 (2021-08-30)

### ⚠ BREAKING CHANGES

- drop node 8

### Features

- Add execution groups to VProfile ([bd581da](https://github.com/olzzon/v-connection/commit/bd581da01ce80623dbfb3e46fb3176aca0f4267d))
- Added capability to initialize a show, with flags to control on rundown activation. ([7e1b59d](https://github.com/olzzon/v-connection/commit/7e1b59d681703641e1c4703d7dcbd974cfa519ca))
- communicating with the MSE via HTTP ([1832936](https://github.com/olzzon/v-connection/commit/1832936950a8cd7cfd92b3073a3fbe7afa389135))
- complete draft typescript interface design ([bd41dc9](https://github.com/olzzon/v-connection/commit/bd41dc9e668c19a644af0822de39c00f8c9f46d4))
- fully configurable activation of playlists and shows ([f09541f](https://github.com/olzzon/v-connection/commit/f09541f5a14c027f0b26725c3375dba29fd782c5))
- keep some elements on purge ([0132c32](https://github.com/olzzon/v-connection/commit/0132c328bbcaafadb71e057214481c497b466a3f))
- pep talk communication and example scripts ([5493c21](https://github.com/olzzon/v-connection/commit/5493c21ab1cc000b20fb5363034624dc289055ec))

### Bug Fixes

- ability to create element for templates with no fields ([b10f7b0](https://github.com/olzzon/v-connection/commit/b10f7b0d2bf281b3abd671eddd90e2248d5477a8))
- ability to parse messages split into more than 2 parts ([bef09b5](https://github.com/olzzon/v-connection/commit/bef09b58b1e579aaa62a792d23deed0db3b5207b))
- ability to parse off-piste data found (so far) in playlists and shows ([a0eccee](https://github.com/olzzon/v-connection/commit/a0ecceec41c62457b4c95d43008be4048933c9f0))
- buildChannelMap overlap and refs ([b3b9436](https://github.com/olzzon/v-connection/commit/b3b9436d720d4ef3b082836db7b62086885869ad))
- Channel for internal elements ([77bb132](https://github.com/olzzon/v-connection/commit/77bb132d7a6cea965426d947cf31679da3805e26))
- consequences of upgrade ... request API changes ([922e9b8](https://github.com/olzzon/v-connection/commit/922e9b89f7ea5cc447e3e26d6e85d1269083350c))
- Correct signature of activate method. ([fa46d33](https://github.com/olzzon/v-connection/commit/fa46d3324d129b4cd7bdbd19014dd8fd9d1e6682))
- defend against certain peptalk messages ([e5e6f3b](https://github.com/olzzon/v-connection/commit/e5e6f3b0971ad7ad1b484735585dc1480fa5801a))
- Engines entry name ([232e338](https://github.com/olzzon/v-connection/commit/232e33856787cf84caa768d280ad8a29a263f8e2))
- error in typeof command ([990b677](https://github.com/olzzon/v-connection/commit/990b677e20b5d0eb7756badcc714eb581c167bd2))
- error in typeof command ([2a3a457](https://github.com/olzzon/v-connection/commit/2a3a457c06d13c25e01c01bc67b9d94684c71d09))
- error in typeof command ([438efff](https://github.com/olzzon/v-connection/commit/438efff748121a8feb7583b2959f597d6a2278db))
- fix test now that initialize of an element is supported for playlist elemenets ([af6d07c](https://github.com/olzzon/v-connection/commit/af6d07c1d09d13bb34c8851a2caea4e5371c7e7b))
- Handle case when entry nas no name ([7c3d2be](https://github.com/olzzon/v-connection/commit/7c3d2bec0d2ac5eab1d143fa37b40559d7b26ddf))
- Handle entries in Execution Groups better ([074be52](https://github.com/olzzon/v-connection/commit/074be5252a8aa234eedefb6486f08005fafd255e))
- improve missing show and playlist error handling ([a1e3e17](https://github.com/olzzon/v-connection/commit/a1e3e1729505589178e846c271de2e72d4113230))
- improve missing show and playlist error handling take 2 ([50476e1](https://github.com/olzzon/v-connection/commit/50476e1a609fda86a0b59a21149c207cc1d5df03))
- include message with peptalk fail timer ([bf2113d](https://github.com/olzzon/v-connection/commit/bf2113dab9b860c60c6f9ecfac583184446da7b5))
- incorrect port numbers ([a6d4a47](https://github.com/olzzon/v-connection/commit/a6d4a47415035804909b0869d9b26f8cc183c574))
- length calculation should be based on bytes and not characters ([ab00ffc](https://github.com/olzzon/v-connection/commit/ab00ffcde5afb3a07b74f89449c3b44b2dc238ad))
- missing responses ([d86e571](https://github.com/olzzon/v-connection/commit/d86e57199298db61e86e869a8ac17d4fc58e4e36))
- more missing responses ([330a327](https://github.com/olzzon/v-connection/commit/330a3273213816f17a5d670cfd082a48d6cfcb79))
- only except nameOrID that is a string or a number, no other types ([fd15aea](https://github.com/olzzon/v-connection/commit/fd15aea65dc4f6cf3e7c6323b1d3412ca0f2b781))
- pep close handler ([578d55e](https://github.com/olzzon/v-connection/commit/578d55eeef8388c5e736db8de279f1e345adfba0))
- prevent duplicate external elements ([ec1f85e](https://github.com/olzzon/v-connection/commit/ec1f85e66673f5871748c785ed04c67efb30a373))
- promise rejection if sent command undefined ([4a4ddf3](https://github.com/olzzon/v-connection/commit/4a4ddf34b77046b2ac619c9fec2c5126087cccc4))
- Reconnecting the PepTalk WebSocket ([136b3f4](https://github.com/olzzon/v-connection/commit/136b3f477391697767ebe5d134fdd5506383661e))
- remove test for active status from purge operation ([242a31f](https://github.com/olzzon/v-connection/commit/242a31fb70746742ac6dc7a330e1e71d8979bfc2))
- resolving reading MSE data that go off-piste from Viz's nested atom structure ([069b01c](https://github.com/olzzon/v-connection/commit/069b01c46a479ecd58e069db538cc71276facb22))
- Scripts ([de46e30](https://github.com/olzzon/v-connection/commit/de46e30293445ed0713b4c7772f3ddd0a553e0b0))
- throw a more useful error when template does not contain a model ([1753029](https://github.com/olzzon/v-connection/commit/175302940f6ea6496d17567e83f419947c0289be))
- unmatched pending requests ([7c5f747](https://github.com/olzzon/v-connection/commit/7c5f747b98a52916d4de30414d1afffc367804f7))
- use Buffer.byteLength rather than new Buffer().length ([903cc23](https://github.com/olzzon/v-connection/commit/903cc236f493ed5608492ea609871cba80ce4e71))
- use hasOwnProperty in place of typeof ([08fc874](https://github.com/olzzon/v-connection/commit/08fc8748f084b2ee3a14058c44cf6dc591dd637a))
- workaround typescript compiler bug ([749748f](https://github.com/olzzon/v-connection/commit/749748f3364bf3e6ce81478ba7f739b2c9256922))

- drop node 8 ([106ccfb](https://github.com/olzzon/v-connection/commit/106ccfba428059766a50b74d06c1315b7c64e6d0))
