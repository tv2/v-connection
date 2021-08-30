# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.0.1](https://github.com/olzzon/v-connection/compare/v3.0.0...v3.0.1) (2021-08-30)

## 3.0.0 (2021-08-30)

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

## 2.0.0 (2021-08-30)

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
