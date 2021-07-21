(function (exports, web3, ethers) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () {
                            return e[k];
                        }
                    });
                }
            });
        }
        n['default'] = e;
        return Object.freeze(n);
    }

    var web3__default = /*#__PURE__*/_interopDefaultLegacy(web3);
    var ethers__namespace = /*#__PURE__*/_interopNamespace(ethers);

    class Decoder {

        constructor(parent) {
            this.parent = parent;
        }

        decode(svar, svarType, slotData, _storageAtCurrentAddress) {
            let bytes = web3__default['default'].utils.hexToBytes(slotData);
            let selBytes = bytes.slice(bytes.length - svar.offset - svarType.numberOfBytes, bytes.length - svar.offset); // MSB first
            let result = this.decodeType(selBytes, svar, svarType, _storageAtCurrentAddress);
            result.slotDataSelection = web3__default['default'].utils.bytesToHex(selBytes);
            return result;
        }

        decodeType(selBytes, svar, svarType, _storageAtCurrentAddress) {
            switch (svarType.encoding) {
                case "inplace":
                case "bytes":
                    if (/^(u?int\d+)/.test(svarType.label)) {
                        return {
                            type: svarType.label,
                            value: web3__default['default'].utils.hexToNumberString(web3__default['default'].utils.bytesToHex(selBytes))
                        }
                    } else if (/^(bytes\d+)/.test(svarType.label)) {
                        return {
                            type: svarType.label,
                            value: web3__default['default'].utils.bytesToHex(selBytes)
                        }
                    } else if (/^(contract\s|enum\s|function\s)/.test(svarType.label)) {
                        return {
                            type: svarType.label,
                            value: web3__default['default'].utils.bytesToHex(selBytes)
                        }
                    } else if (/^(struct\s)/.test(svarType.label)) {
                        let result = [];

                        for (let m of svarType.members) {
                            let idxslot = web3__default['default'].utils.toHex(web3__default['default'].utils.toBN(svar.slot).add(web3__default['default'].utils.toBN(m.slot)));
                            let p = new Promise((resolve, reject) => {
                                _storageAtCurrentAddress(idxslot).then(data => {
                                    m.slot = idxslot;
                                    let decoded = this.decode(m, this.parent.storageLayout.types[m.type], data, _storageAtCurrentAddress);
                                    return resolve(decoded)
                                });
                            });
                            result.push(p);
                            this.parent.tasks.push(p);
                        }

                        return {
                            type: svarType.label,
                            value: result
                        }
                    }

                    switch (svarType.label) {
                        case "address":
                            return {
                                type: svarType.label,
                                value: web3__default['default'].utils.bytesToHex(selBytes)
                            }
                        case "string":
                            let len = selBytes[selBytes.length - 1] / 2;
                            return {
                                type: svarType.label,
                                value: web3__default['default'].utils.hexToUtf8(web3__default['default'].utils.bytesToHex(selBytes.slice(0, len)))
                            }
                        case "bool":
                            return {
                                type: svarType.label,
                                value: selBytes[0] ? true : false
                            }
                    }
                    break;
                case "dynamic_array":
                    // data at keccak(slot)+*length
                    let length = web3__default['default'].utils.hexToNumber(web3__default['default'].utils.bytesToHex(selBytes));
                    let nextSlot = web3__default['default'].utils.soliditySha3(svar.slot);
                    let result = [];

                    for (let i = 0; i < length; i++) {
                        let idxslot = web3__default['default'].utils.toHex(web3__default['default'].utils.toBN(nextSlot).add(web3__default['default'].utils.toBN(i)));
                        let p = new Promise((resolve, reject) => {
                            _storageAtCurrentAddress(idxslot).then(data => {
                                let decoded = this.decode({ offset: 0, slot: idxslot, index: i, type: svarType.base }, this.parent.storageLayout.types[svarType.base], data, _storageAtCurrentAddress);
                                return resolve(decoded)
                            });
                        });
                        result.push(p);
                        this.parent.tasks.push(p);
                    }

                    return {
                        type: svarType.label,
                        length: length,
                        value: result
                    }
                case "mapping":
                    //let length = web3.utils.hexToNumber(web3.utils.bytesToHex(selBytes));


                    function getMappingValue(key) {
                        /*
                        let key = {
                            type: 'address',
                            value: '0x437f27592ddbf363bb1a30ee535c7f5cd431a8c9'
                            }
                        */
                        let valueslot = web3__default['default'].utils.soliditySha3(svar.slot, key);
                        let p = new Promise((resolve, reject) => {
                            _storageAtCurrentAddress(valueslot).then(data => {
                                let decoded = this.decode({ offset: 0, slot: valueslot, type: svarType.value }, this.parent.storageLayout.types[svarType.value], data, _storageAtCurrentAddress);
                                return resolve(decoded)
                            });
                        });
                        this.parent.tasks.push(p);
                        return p;

                    }


                    return {
                        type: svarType.label,
                        value: getMappingValue
                    }

            }

            return {};
        }
    }

    //autogenerated with # npm run updateCompilerList
    const solcVersions = ["v0.8.5-nightly.2021.4.21+commit.85274304","v0.8.4+commit.c7e474f2","v0.8.4-nightly.2021.4.20+commit.cf7f814a","v0.8.4-nightly.2021.4.19+commit.159d6f9e","v0.8.4-nightly.2021.4.16+commit.f9b23ca8","v0.8.4-nightly.2021.4.14+commit.69411436","v0.8.4-nightly.2021.4.13+commit.f188f3d9","v0.8.4-nightly.2021.4.12+commit.0289994d","v0.8.4-nightly.2021.4.8+commit.124db22f","v0.8.4-nightly.2021.4.6+commit.a5cae64a","v0.8.4-nightly.2021.4.1+commit.5433a640","v0.8.4-nightly.2021.3.31+commit.b2555eac","v0.8.4-nightly.2021.3.30+commit.851051c6","v0.8.4-nightly.2021.3.29+commit.2346ec1c","v0.8.4-nightly.2021.3.26+commit.c37bf893","v0.8.4-nightly.2021.3.25+commit.d75a132f","v0.8.4-nightly.2021.3.24+commit.6eac77ae","v0.8.3+commit.8d00100c","v0.8.3-nightly.2021.3.22+commit.54cea090","v0.8.3-nightly.2021.3.17+commit.e179d0aa","v0.8.3-nightly.2021.3.16+commit.35da404c","v0.8.3-nightly.2021.3.15+commit.ae1b321a","v0.8.3-nightly.2021.3.12+commit.ccd9de13","v0.8.3-nightly.2021.3.11+commit.0e22d0bd","v0.8.3-nightly.2021.3.10+commit.23f03e1b","v0.8.3-nightly.2021.3.9+commit.ad5d34df","v0.8.3-nightly.2021.3.5+commit.093ea461","v0.8.3-nightly.2021.3.4+commit.08df163a","v0.8.3-nightly.2021.3.3+commit.be564773","v0.8.2+commit.661d1103","v0.8.2-nightly.2021.3.2+commit.661d1103","v0.8.2-nightly.2021.3.1+commit.ad48b713","v0.8.2-nightly.2021.2.25+commit.44493ad4","v0.8.2-nightly.2021.2.24+commit.eacf7c1c","v0.8.2-nightly.2021.2.23+commit.1220d8df","v0.8.2-nightly.2021.2.22+commit.e75e3fc2","v0.8.2-nightly.2021.2.19+commit.6fd5ea01","v0.8.2-nightly.2021.2.18+commit.5c6633f9","v0.8.2-nightly.2021.2.12+commit.b385b41f","v0.8.2-nightly.2021.2.11+commit.003701f6","v0.8.2-nightly.2021.2.10+commit.215233d5","v0.8.2-nightly.2021.2.9+commit.9b20c984","v0.8.2-nightly.2021.2.8+commit.ec62d123","v0.8.2-nightly.2021.2.4+commit.2fb27884","v0.8.2-nightly.2021.2.3+commit.1a949e53","v0.8.2-nightly.2021.2.2+commit.358324ed","v0.8.2-nightly.2021.2.1+commit.dde6353c","v0.8.2-nightly.2021.1.28+commit.70882cc4","v0.8.2-nightly.2021.1.27+commit.49dbcba3","v0.8.1+commit.df193b15","v0.8.1-nightly.2021.1.27+commit.34fa756f","v0.8.1-nightly.2021.1.25+commit.ccdf57c9","v0.8.1-nightly.2021.1.22+commit.8a844237","v0.8.1-nightly.2021.1.21+commit.3045770a","v0.8.1-nightly.2021.1.20+commit.a75b87c8","v0.8.1-nightly.2021.1.19+commit.1df28473","v0.8.1-nightly.2021.1.18+commit.957e9995","v0.8.1-nightly.2021.1.15+commit.055c4b4d","v0.8.1-nightly.2021.1.14+commit.eaf7d7da","v0.8.1-nightly.2021.1.13+commit.50146114","v0.8.1-nightly.2021.1.12+commit.e9dcd4f8","v0.8.1-nightly.2021.1.11+commit.67d21a87","v0.8.1-nightly.2021.1.8+commit.f03245d4","v0.8.1-nightly.2021.1.7+commit.d11cf15d","v0.8.1-nightly.2021.1.6+commit.5241b7b7","v0.8.1-nightly.2021.1.4+commit.fce6d999","v0.8.1-nightly.2020.12.30+commit.0e32fa82","v0.8.1-nightly.2020.12.29+commit.86c30b4c","v0.8.1-nightly.2020.12.28+commit.8e9a5a02","v0.8.1-nightly.2020.12.22+commit.e299d8ba","v0.8.1-nightly.2020.12.21+commit.b78443ac","v0.8.1-nightly.2020.12.20+commit.67712d50","v0.8.1-nightly.2020.12.18+commit.158154ba","v0.8.1-nightly.2020.12.17+commit.8194cbb4","v0.8.1-nightly.2020.12.16+commit.2be078b4","v0.8.0+commit.c7dfd78e","v0.7.6+commit.7338295f","v0.7.6-nightly.2020.12.15+commit.17293858","v0.7.6-nightly.2020.12.14+commit.d83ce0bc","v0.7.6-nightly.2020.12.11+commit.db9aa36d","v0.7.6-nightly.2020.12.10+commit.9e4f3bad","v0.7.6-nightly.2020.12.9+commit.7e930f7b","v0.7.6-nightly.2020.12.8+commit.0d7f9ae1","v0.7.6-nightly.2020.12.7+commit.b23d9230","v0.7.6-nightly.2020.12.4+commit.3619a0a0","v0.7.6-nightly.2020.12.3+commit.a27d7707","v0.7.6-nightly.2020.12.2+commit.3cd0b252","v0.7.6-nightly.2020.12.1+commit.e10712c1","v0.7.6-nightly.2020.11.30+commit.91e67472","v0.7.6-nightly.2020.11.27+commit.887569ef","v0.7.6-nightly.2020.11.26+commit.e8843fe1","v0.7.6-nightly.2020.11.25+commit.7eb5fc31","v0.7.6-nightly.2020.11.24+commit.ae34fba4","v0.7.6-nightly.2020.11.23+commit.61425e35","v0.7.6-nightly.2020.11.21+commit.8bf455bb","v0.7.6-nightly.2020.11.20+commit.3a3303f2","v0.7.6-nightly.2020.11.19+commit.8d315ee1","v0.7.6-nightly.2020.11.18+commit.bfe87378","v0.7.5+commit.eb77ed08","v0.7.5-nightly.2020.11.17+commit.e1292380","v0.7.5-nightly.2020.11.16+commit.a97521bf","v0.7.5-nightly.2020.11.13+commit.f1846b57","v0.7.5-nightly.2020.11.12+commit.c69c7f32","v0.7.5-nightly.2020.11.11+commit.44eb63fa","v0.7.5-nightly.2020.11.10+commit.d3a016b5","v0.7.5-nightly.2020.11.9+commit.41f50365","v0.7.5-nightly.2020.11.6+commit.6fa42b5e","v0.7.5-nightly.2020.11.5+commit.f55f5c24","v0.7.5-nightly.2020.11.4+commit.5b412544","v0.7.5-nightly.2020.11.3+commit.a8045ba5","v0.7.5-nightly.2020.11.2+commit.c83d8fae","v0.7.5-nightly.2020.10.29+commit.be02db49","v0.7.5-nightly.2020.10.28+commit.f42280f5","v0.7.5-nightly.2020.10.27+commit.f1ed5100","v0.7.5-nightly.2020.10.26+commit.96c188be","v0.7.5-nightly.2020.10.23+commit.08a27b9c","v0.7.5-nightly.2020.10.22+commit.95c521a3","v0.7.5-nightly.2020.10.21+commit.38d58a45","v0.7.5-nightly.2020.10.20+commit.06394672","v0.7.5-nightly.2020.10.19+commit.58579332","v0.7.4+commit.3f05b770","v0.7.4-nightly.2020.10.18+commit.6aae7cae","v0.7.4-nightly.2020.10.16+commit.eedd12ad","v0.7.4-nightly.2020.10.15+commit.9aafb62e","v0.7.4-nightly.2020.10.14+commit.36a36caf","v0.7.4-nightly.2020.10.13+commit.8d241fec","v0.7.4-nightly.2020.10.12+commit.abfa136a","v0.7.4-nightly.2020.10.9+commit.d9215cf9","v0.7.4-nightly.2020.10.8+commit.3739b03a","v0.7.3+commit.9bfce1f6","v0.7.3-nightly.2020.10.6+commit.25d40805","v0.7.3-nightly.2020.10.2+commit.756e21a8","v0.7.3-nightly.2020.9.30+commit.3af21c92","v0.7.3-nightly.2020.9.29+commit.343c13f9","v0.7.3-nightly.2020.9.28+commit.dd5b0a71","v0.7.2+commit.51b20bc0","v0.7.2-nightly.2020.9.25+commit.b34465c5","v0.7.2-nightly.2020.9.24+commit.5711d664","v0.7.2-nightly.2020.9.23+commit.35a7d5d3","v0.7.2-nightly.2020.9.22+commit.700cc4c9","v0.7.2-nightly.2020.9.21+commit.d80a81b0","v0.7.2-nightly.2020.9.17+commit.b571fd05","v0.7.2-nightly.2020.9.16+commit.90506528","v0.7.2-nightly.2020.9.15+commit.3399570d","v0.7.2-nightly.2020.9.12+commit.38175150","v0.7.2-nightly.2020.9.11+commit.31b5102a","v0.7.2-nightly.2020.9.10+commit.0db79dbc","v0.7.2-nightly.2020.9.9+commit.95a284e5","v0.7.2-nightly.2020.9.8+commit.20233240","v0.7.2-nightly.2020.9.7+commit.38e6f272","v0.7.2-nightly.2020.9.3+commit.f9649660","v0.7.2-nightly.2020.9.2+commit.cde65224","v0.7.1+commit.f4a555be","v0.7.1-nightly.2020.9.1+commit.0d83977d","v0.7.1-nightly.2020.8.31+commit.34543e5e","v0.7.1-nightly.2020.8.28+commit.98cc1d99","v0.7.1-nightly.2020.8.27+commit.e872b1b5","v0.7.1-nightly.2020.8.26+commit.fdc4142b","v0.7.1-nightly.2020.8.25+commit.29b6c172","v0.7.1-nightly.2020.8.24+commit.21489d81","v0.7.1-nightly.2020.8.22+commit.bff0f9bd","v0.7.1-nightly.2020.8.21+commit.4dd25f73","v0.7.1-nightly.2020.8.20+commit.4a720a65","v0.7.1-nightly.2020.8.19+commit.9e488f12","v0.7.1-nightly.2020.8.18+commit.3c27d36e","v0.7.1-nightly.2020.8.17+commit.660ef792","v0.7.1-nightly.2020.8.13+commit.b1fb9da6","v0.7.1-nightly.2020.8.12+commit.acdaff63","v0.7.1-nightly.2020.8.11+commit.e68d16d8","v0.7.1-nightly.2020.8.10+commit.05901f5b","v0.7.1-nightly.2020.8.6+commit.241a564f","v0.7.1-nightly.2020.8.5+commit.3a409c39","v0.7.1-nightly.2020.8.4+commit.b8fd409f","v0.7.1-nightly.2020.8.3+commit.d31f05fc","v0.7.1-nightly.2020.7.31+commit.08791ab0","v0.7.1-nightly.2020.7.29+commit.f2fa5b5f","v0.7.1-nightly.2020.7.28+commit.cd2ce283","v0.7.0+commit.9e61f92b","v0.7.0-nightly.2020.7.27+commit.4e4b3ee6","v0.7.0-nightly.2020.7.23+commit.7ad27188","v0.6.12+commit.27d51765","v0.6.11+commit.5ef660b1","v0.6.11-nightly.2020.6.25+commit.48dd3634","v0.6.10+commit.00c0fcaf","v0.6.10-nightly.2020.6.10+commit.0a5d9927","v0.6.10-nightly.2020.6.9+commit.1e8e0ebd","v0.6.10-nightly.2020.6.8+commit.3d241eed","v0.6.10-nightly.2020.6.5+commit.d4552678","v0.6.10-nightly.2020.6.4+commit.0ec96337","v0.6.9+commit.3e3065ac","v0.6.9-nightly.2020.6.4+commit.70e62524","v0.6.9-nightly.2020.6.3+commit.de5e2835","v0.6.9-nightly.2020.6.2+commit.22f7a9f0","v0.6.9-nightly.2020.5.29+commit.b01a1a36","v0.6.9-nightly.2020.5.28+commit.ee8307ce","v0.6.9-nightly.2020.5.27+commit.57ac8628","v0.6.9-nightly.2020.5.14+commit.33d8d838","v0.6.8+commit.0bbfe453","v0.6.8-nightly.2020.5.14+commit.a6d0067b","v0.6.8-nightly.2020.5.13+commit.aca70049","v0.6.8-nightly.2020.5.12+commit.b014b89e","v0.6.8-nightly.2020.5.11+commit.39249bc6","v0.6.8-nightly.2020.5.8+commit.4e58c672","v0.6.8-nightly.2020.5.7+commit.741c41a1","v0.6.8-nightly.2020.5.6+commit.3a93080c","v0.6.8-nightly.2020.5.5+commit.1de73a16","v0.6.8-nightly.2020.5.4+commit.1bb07e26","v0.6.7+commit.b8d736ae","v0.6.7-nightly.2020.5.4+commit.94f7ffcf","v0.6.7-nightly.2020.5.1+commit.5163c09e","v0.6.7-nightly.2020.4.29+commit.602b29cb","v0.6.7-nightly.2020.4.28+commit.75a25d53","v0.6.7-nightly.2020.4.27+commit.61b1369f","v0.6.7-nightly.2020.4.25+commit.ed6c6b31","v0.6.7-nightly.2020.4.24+commit.2b39f3b9","v0.6.7-nightly.2020.4.23+commit.aaa434da","v0.6.7-nightly.2020.4.22+commit.d0fcd468","v0.6.7-nightly.2020.4.20+commit.7eff836a","v0.6.7-nightly.2020.4.17+commit.ccc06c49","v0.6.7-nightly.2020.4.16+commit.0f7a5e80","v0.6.7-nightly.2020.4.15+commit.cbd90f8d","v0.6.7-nightly.2020.4.14+commit.accd8d76","v0.6.7-nightly.2020.4.9+commit.f8aaa83e","v0.6.6+commit.6c089d02","v0.6.6-nightly.2020.4.9+commit.605e176f","v0.6.6-nightly.2020.4.8+commit.9fab9df1","v0.6.6-nightly.2020.4.7+commit.582c7545","v0.6.6-nightly.2020.4.6+commit.e349f4b7","v0.6.5+commit.f956cc89","v0.6.5-nightly.2020.4.6+commit.8451639f","v0.6.5-nightly.2020.4.3+commit.00acaadd","v0.6.5-nightly.2020.4.2+commit.c8f0629e","v0.6.5-nightly.2020.4.1+commit.c11d5b8d","v0.6.5-nightly.2020.3.31+commit.b83d82ab","v0.6.5-nightly.2020.3.30+commit.469316f8","v0.6.5-nightly.2020.3.26+commit.994591b8","v0.6.5-nightly.2020.3.25+commit.18971389","v0.6.5-nightly.2020.3.24+commit.d584b2d1","v0.6.5-nightly.2020.3.23+commit.848f405f","v0.6.5-nightly.2020.3.19+commit.8834b1ac","v0.6.5-nightly.2020.3.18+commit.cfd315e1","v0.6.5-nightly.2020.3.17+commit.435c9dae","v0.6.5-nightly.2020.3.16+commit.e21567c1","v0.6.5-nightly.2020.3.13+commit.362c2175","v0.6.5-nightly.2020.3.12+commit.bdd8045d","v0.6.5-nightly.2020.3.11+commit.1167af1d","v0.6.5-nightly.2020.3.10+commit.59071f60","v0.6.4+commit.1dca32f3","v0.6.4-nightly.2020.3.10+commit.683ebc8e","v0.6.4-nightly.2020.3.9+commit.dbe2a5f4","v0.6.4-nightly.2020.3.8+commit.a328e940","v0.6.4-nightly.2020.3.6+commit.78ce4b96","v0.6.4-nightly.2020.3.4+commit.27a4670a","v0.6.4-nightly.2020.3.3+commit.20679d63","v0.6.4-nightly.2020.2.27+commit.b65a165d","v0.6.4-nightly.2020.2.26+commit.6930e0c2","v0.6.4-nightly.2020.2.25+commit.af81d4b6","v0.6.4-nightly.2020.2.24+commit.aa6a2b47","v0.6.4-nightly.2020.2.20+commit.525fe384","v0.6.4-nightly.2020.2.19+commit.8f2c5fc0","v0.6.4-nightly.2020.2.18+commit.ba9f740a","v0.6.3+commit.8dda9521","v0.6.3-nightly.2020.2.18+commit.64f9dc35","v0.6.3-nightly.2020.2.17+commit.50421e8b","v0.6.3-nightly.2020.2.14+commit.96709b32","v0.6.3-nightly.2020.2.13+commit.7af581df","v0.6.3-nightly.2020.2.12+commit.0e100e7e","v0.6.3-nightly.2020.2.11+commit.5214cb0e","v0.6.3-nightly.2020.2.10+commit.64bb0d55","v0.6.3-nightly.2020.2.7+commit.462cd432","v0.6.3-nightly.2020.2.6+commit.93191ceb","v0.6.3-nightly.2020.2.5+commit.913d5f32","v0.6.3-nightly.2020.2.4+commit.836938c1","v0.6.3-nightly.2020.2.3+commit.93a41f7a","v0.6.3-nightly.2020.1.31+commit.b6190e06","v0.6.3-nightly.2020.1.30+commit.ad98bf0f","v0.6.3-nightly.2020.1.29+commit.01eb9a5b","v0.6.3-nightly.2020.1.28+commit.2d3bd91d","v0.6.3-nightly.2020.1.27+commit.8809d4bb","v0.6.2+commit.bacdbe57","v0.6.2-nightly.2020.1.27+commit.1bdb409b","v0.6.2-nightly.2020.1.23+commit.3add37a2","v0.6.2-nightly.2020.1.22+commit.641bb815","v0.6.2-nightly.2020.1.20+commit.470c19eb","v0.6.2-nightly.2020.1.17+commit.92908f52","v0.6.2-nightly.2020.1.16+commit.3d4a2219","v0.6.2-nightly.2020.1.15+commit.9d9a7ebe","v0.6.2-nightly.2020.1.14+commit.6dbadf69","v0.6.2-nightly.2020.1.13+commit.408458b7","v0.6.2-nightly.2020.1.10+commit.d577a768","v0.6.2-nightly.2020.1.9+commit.17158995","v0.6.2-nightly.2020.1.8+commit.12b52ae6","v0.6.1+commit.e6f7d5a4","v0.6.1-nightly.2020.1.7+commit.8385256b","v0.6.1-nightly.2020.1.6+commit.20cf9d9f","v0.6.1-nightly.2020.1.3+commit.943af71d","v0.6.1-nightly.2020.1.2+commit.d082b9b8","v0.6.1-nightly.2019.12.20+commit.ece6463f","v0.6.1-nightly.2019.12.19+commit.d420fe37","v0.6.1-nightly.2019.12.18+commit.9a1cc027","v0.6.0+commit.26b70077","v0.6.0-nightly.2019.12.17+commit.d13438ee","v0.6.0-nightly.2019.12.16+commit.7390b5b5","v0.6.0-nightly.2019.12.14+commit.1c01c69e","v0.6.0-nightly.2019.12.13+commit.9ddd5042","v0.6.0-nightly.2019.12.12+commit.104a8c59","v0.6.0-nightly.2019.12.11+commit.7247e72d","v0.6.0-nightly.2019.12.10+commit.7244aa01","v0.5.17+commit.d19bba13","v0.5.16+commit.9c3226ce","v0.5.15+commit.6a57276f","v0.5.14+commit.01f1aaa4","v0.5.14-nightly.2019.12.10+commit.45aa7a88","v0.5.14-nightly.2019.12.9+commit.d6667560","v0.5.14-nightly.2019.12.5+commit.d2e3933d","v0.5.14-nightly.2019.12.4+commit.2a1b6f55","v0.5.14-nightly.2019.11.30+commit.4775af73","v0.5.14-nightly.2019.11.29+commit.7b038dbd","v0.5.14-nightly.2019.11.28+commit.40d9744b","v0.5.14-nightly.2019.11.27+commit.87943bf4","v0.5.14-nightly.2019.11.26+commit.200a92b4","v0.5.14-nightly.2019.11.25+commit.c4622774","v0.5.14-nightly.2019.11.21+commit.9eac460c","v0.5.14-nightly.2019.11.20+commit.7535039f","v0.5.14-nightly.2019.11.19+commit.e383b2bb","v0.5.14-nightly.2019.11.18+commit.79af19db","v0.5.14-nightly.2019.11.15+commit.6a993152","v0.5.14-nightly.2019.11.14+commit.3e04fd6e","v0.5.13+commit.5b0b510c","v0.5.13-nightly.2019.11.14+commit.d1c6ab8a","v0.5.13-nightly.2019.11.13+commit.6bef3071","v0.5.13-nightly.2019.11.12+commit.52a9de83","v0.5.13-nightly.2019.11.11+commit.7c7cca5f","v0.5.13-nightly.2019.11.10+commit.a5f0422d","v0.5.13-nightly.2019.11.8+commit.78be9385","v0.5.13-nightly.2019.11.7+commit.37c6ab4c","v0.5.13-nightly.2019.11.6+commit.56a3abcd","v0.5.13-nightly.2019.11.5+commit.9bec5334","v0.5.13-nightly.2019.11.4+commit.26c6a1fc","v0.5.13-nightly.2019.11.1+commit.73954f16","v0.5.13-nightly.2019.10.31+commit.d932f2d0","v0.5.13-nightly.2019.10.29+commit.5d906cd5","v0.5.13-nightly.2019.10.28+commit.9eb08c0c","v0.5.13-nightly.2019.10.25+commit.302a51a5","v0.5.13-nightly.2019.10.24+commit.15e39f7d","v0.5.13-nightly.2019.10.23+commit.e56d1aa5","v0.5.13-nightly.2019.10.22+commit.eca2b9bd","v0.5.13-nightly.2019.10.18+commit.d5b2f347","v0.5.13-nightly.2019.10.17+commit.5ea1d90f","v0.5.13-nightly.2019.10.16+commit.9ec8bcda","v0.5.13-nightly.2019.10.15+commit.83bb1515","v0.5.13-nightly.2019.10.4+commit.6cbcc379","v0.5.13-nightly.2019.10.2+commit.2d150b65","v0.5.13-nightly.2019.10.1+commit.74d2b228","v0.5.12+commit.7709ece9","v0.5.12-nightly.2019.10.1+commit.cbdc3bc1","v0.5.12-nightly.2019.9.30+commit.88476475","v0.5.12-nightly.2019.9.24+commit.973e4ca9","v0.5.12-nightly.2019.9.23+commit.c4208a6a","v0.5.12-nightly.2019.9.19+commit.0478eb1e","v0.5.12-nightly.2019.9.17+commit.58f0f9db","v0.5.12-nightly.2019.9.16+commit.34a84f3a","v0.5.12-nightly.2019.9.13+commit.5d58c43a","v0.5.12-nightly.2019.9.12+commit.b747c267","v0.5.12-nightly.2019.9.11+commit.5063e537","v0.5.12-nightly.2019.9.10+commit.4452a9b6","v0.5.12-nightly.2019.9.9+commit.f5e976ce","v0.5.12-nightly.2019.9.6+commit.7e80fceb","v0.5.12-nightly.2019.9.5+commit.96980d0b","v0.5.12-nightly.2019.9.4+commit.c5fbf23f","v0.5.12-nightly.2019.9.3+commit.d1831b15","v0.5.12-nightly.2019.9.2+commit.3c963eb0","v0.5.12-nightly.2019.8.29+commit.459aed90","v0.5.12-nightly.2019.8.28+commit.e74b63b6","v0.5.12-nightly.2019.8.26+commit.e1bb4b9f","v0.5.12-nightly.2019.8.24+commit.bb104546","v0.5.12-nightly.2019.8.23+commit.b5048bd6","v0.5.12-nightly.2019.8.19+commit.a39d26f3","v0.5.12-nightly.2019.8.16+commit.058bbd39","v0.5.12-nightly.2019.8.15+commit.2508cbc1","v0.5.12-nightly.2019.8.14+commit.fb8137df","v0.5.12-nightly.2019.8.13+commit.a6cbc3b8","v0.5.11+commit.22be8592","v0.5.11+commit.c082d0b4","v0.5.11-nightly.2019.8.12+commit.b285e086","v0.5.11-nightly.2019.8.10+commit.f5f2bbb2","v0.5.11-nightly.2019.8.9+commit.682a3ece","v0.5.11-nightly.2019.8.8+commit.16efcfdb","v0.5.11-nightly.2019.8.7+commit.6166dc8e","v0.5.11-nightly.2019.8.6+commit.cd563e52","v0.5.11-nightly.2019.8.5+commit.29d47d5c","v0.5.11-nightly.2019.8.2+commit.967ee944","v0.5.11-nightly.2019.8.1+commit.aa87a607","v0.5.11-nightly.2019.7.31+commit.32e6e356","v0.5.11-nightly.2019.7.30+commit.092e62f1","v0.5.11-nightly.2019.7.29+commit.2fdc07c5","v0.5.11-nightly.2019.7.25+commit.4f7fec69","v0.5.11-nightly.2019.7.23+commit.14699340","v0.5.11-nightly.2019.7.22+commit.535553b5","v0.5.11-nightly.2019.7.19+commit.508cf66d","v0.5.11-nightly.2019.7.18+commit.1d673a3b","v0.5.11-nightly.2019.7.17+commit.4fa78004","v0.5.11-nightly.2019.7.16+commit.a5a7983a","v0.5.11-nightly.2019.7.11+commit.88477bdb","v0.5.11-nightly.2019.7.10+commit.ba922e76","v0.5.11-nightly.2019.7.9+commit.8d006d20","v0.5.11-nightly.2019.7.8+commit.25928767","v0.5.11-nightly.2019.7.4+commit.3b2ebba4","v0.5.11-nightly.2019.7.3+commit.c3c8bc09","v0.5.11-nightly.2019.7.2+commit.06d01d15","v0.5.11-nightly.2019.7.1+commit.b8dbf7d2","v0.5.11-nightly.2019.6.27+commit.3597de35","v0.5.11-nightly.2019.6.26+commit.b4a0a793","v0.5.11-nightly.2019.6.25+commit.1cc84753","v0.5.10+commit.5a6ea5b1","v0.5.10-nightly.2019.6.25+commit.92529068","v0.5.10-nightly.2019.6.24+commit.eb5b8298","v0.5.10-nightly.2019.6.20+commit.096e3fcd","v0.5.10-nightly.2019.6.19+commit.53f26d97","v0.5.10-nightly.2019.6.18+commit.b6695071","v0.5.10-nightly.2019.6.17+commit.9c5dc63e","v0.5.10-nightly.2019.6.14+commit.4aa0c9e0","v0.5.10-nightly.2019.6.13+commit.62bd7032","v0.5.10-nightly.2019.6.12+commit.502d22a2","v0.5.10-nightly.2019.6.11+commit.bd1f65d6","v0.5.10-nightly.2019.6.7+commit.dc085bb8","v0.5.10-nightly.2019.6.6+commit.fc35c139","v0.5.10-nightly.2019.6.5+commit.3a331639","v0.5.10-nightly.2019.6.4+commit.95e6b2e4","v0.5.10-nightly.2019.5.30+commit.dd04a35c","v0.5.10-nightly.2019.5.29+commit.c9e2d388","v0.5.10-nightly.2019.5.28+commit.ff8898b8","v0.5.9+commit.c68bc34e","v0.5.9+commit.e560f70d","v0.5.9-nightly.2019.5.28+commit.01b6b680","v0.5.9-nightly.2019.5.27+commit.c14279fc","v0.5.9-nightly.2019.5.24+commit.2a2cea08","v0.5.9-nightly.2019.5.23+commit.7cf51876","v0.5.9-nightly.2019.5.22+commit.f06582f9","v0.5.9-nightly.2019.5.21+commit.0e132d07","v0.5.9-nightly.2019.5.20+commit.0731abd3","v0.5.9-nightly.2019.5.17+commit.88e9fbe6","v0.5.9-nightly.2019.5.16+commit.46d6f395","v0.5.9-nightly.2019.5.15+commit.a10501bb","v0.5.9-nightly.2019.5.14+commit.563aec1d","v0.5.9-nightly.2019.5.13+commit.a28b6224","v0.5.9-nightly.2019.5.10+commit.661b08e1","v0.5.9-nightly.2019.5.9+commit.8f2c8daf","v0.5.9-nightly.2019.5.8+commit.97f16421","v0.5.9-nightly.2019.5.7+commit.a21f8a0b","v0.5.9-nightly.2019.5.6+commit.dee1c110","v0.5.9-nightly.2019.5.2+commit.90f2fe6f","v0.5.9-nightly.2019.4.30+commit.b6bcd8a1","v0.5.8+commit.23d335f2","v0.5.8-nightly.2019.4.30+commit.0dc461b9","v0.5.8-nightly.2019.4.29+commit.578d6180","v0.5.8-nightly.2019.4.25+commit.eea425a3","v0.5.8-nightly.2019.4.24+commit.f124bace","v0.5.8-nightly.2019.4.23+commit.13518820","v0.5.8-nightly.2019.4.18+commit.fce19bde","v0.5.8-nightly.2019.4.17+commit.1feefa1c","v0.5.8-nightly.2019.4.16+commit.a61931c5","v0.5.8-nightly.2019.4.15+commit.e4e786a9","v0.5.8-nightly.2019.4.14+commit.6c68904f","v0.5.8-nightly.2019.4.12+commit.31abeb99","v0.5.8-nightly.2019.4.11+commit.e97d4b4a","v0.5.8-nightly.2019.4.10+commit.9eaaf42c","v0.5.8-nightly.2019.4.5+commit.9ef84df4","v0.5.8-nightly.2019.4.4+commit.ee2f5662","v0.5.8-nightly.2019.4.3+commit.1b7878cf","v0.5.8-nightly.2019.4.2+commit.7b0f7eb1","v0.5.8-nightly.2019.4.1+commit.a3a60b8e","v0.5.8-nightly.2019.3.29+commit.91a54f9b","v0.5.8-nightly.2019.3.28+commit.2bbc41ad","v0.5.8-nightly.2019.3.27+commit.97818f65","v0.5.8-nightly.2019.3.26+commit.b85fc1a6","v0.5.7+commit.6da8b019","v0.5.7-nightly.2019.3.26+commit.d079cdbf","v0.5.7-nightly.2019.3.25+commit.99ed3a64","v0.5.7-nightly.2019.3.22+commit.0af47da1","v0.5.7-nightly.2019.3.21+commit.ebb8c175","v0.5.7-nightly.2019.3.20+commit.5245a66d","v0.5.7-nightly.2019.3.19+commit.c7824932","v0.5.7-nightly.2019.3.18+commit.5b5c9aa2","v0.5.7-nightly.2019.3.14+commit.d1d6d59c","v0.5.7-nightly.2019.3.13+commit.2da906d9","v0.5.6+commit.b259423e","v0.5.6-nightly.2019.3.13+commit.9ccd5dfe","v0.5.6-nightly.2019.3.12+commit.2f37cd09","v0.5.6-nightly.2019.3.11+commit.189983a1","v0.5.5+commit.47a71e8f","v0.5.5-nightly.2019.3.5+commit.c283f6d8","v0.5.5-nightly.2019.3.4+commit.5490a5cd","v0.5.5-nightly.2019.2.28+commit.e9543d83","v0.5.5-nightly.2019.2.27+commit.a0dcb36f","v0.5.5-nightly.2019.2.26+commit.472a6445","v0.5.5-nightly.2019.2.25+commit.52ee955f","v0.5.5-nightly.2019.2.21+commit.e7a8fed0","v0.5.5-nightly.2019.2.20+commit.c8fb2c1b","v0.5.5-nightly.2019.2.19+commit.d9e4a10d","v0.5.5-nightly.2019.2.18+commit.db7b38e3","v0.5.5-nightly.2019.2.16+commit.2f0926c3","v0.5.5-nightly.2019.2.15+commit.04081303","v0.5.5-nightly.2019.2.14+commit.33318249","v0.5.5-nightly.2019.2.13+commit.b1a5ffb9","v0.5.5-nightly.2019.2.12+commit.828255fa","v0.5.4+commit.9549d8ff","v0.5.4-nightly.2019.2.12+commit.f0f34984","v0.5.4-nightly.2019.2.11+commit.49cd55d3","v0.5.4-nightly.2019.2.7+commit.caecdfab","v0.5.4-nightly.2019.2.6+commit.e5bf1f1d","v0.5.4-nightly.2019.2.5+commit.f3c9b41f","v0.5.4-nightly.2019.2.4+commit.82b69963","v0.5.4-nightly.2019.1.31+commit.ddab3f06","v0.5.4-nightly.2019.1.30+commit.bf3968d6","v0.5.4-nightly.2019.1.29+commit.ebf503a6","v0.5.4-nightly.2019.1.28+commit.e6d102f2","v0.5.4-nightly.2019.1.26+commit.0ef45b28","v0.5.4-nightly.2019.1.24+commit.2e7274b4","v0.5.4-nightly.2019.1.23+commit.ea292393","v0.5.4-nightly.2019.1.22+commit.26c06550","v0.5.3+commit.10d17f24","v0.5.3-nightly.2019.1.22+commit.d87d9a26","v0.5.3-nightly.2019.1.21+commit.606c2b99","v0.5.3-nightly.2019.1.19+commit.d3270bc3","v0.5.3-nightly.2019.1.18+commit.7b759866","v0.5.3-nightly.2019.1.17+commit.49f74a7b","v0.5.3-nightly.2019.1.16+commit.82453a76","v0.5.3-nightly.2019.1.15+commit.6146c59a","v0.5.3-nightly.2019.1.14+commit.051df319","v0.5.3-nightly.2019.1.11+commit.94688d2f","v0.5.3-nightly.2019.1.10+commit.31033fb4","v0.5.3-nightly.2019.1.9+commit.63319cfd","v0.5.3-nightly.2019.1.8+commit.a0ca746c","v0.5.3-nightly.2019.1.7+commit.f3799034","v0.5.3-nightly.2019.1.3+commit.d597b1db","v0.5.3-nightly.2018.12.20+commit.245ec29c","v0.5.2+commit.1df8f40c","v0.5.2-nightly.2018.12.19+commit.88750920","v0.5.2-nightly.2018.12.18+commit.4b43aeca","v0.5.2-nightly.2018.12.17+commit.12874029","v0.5.2-nightly.2018.12.13+commit.b3e2ba15","v0.5.2-nightly.2018.12.12+commit.85291bcb","v0.5.2-nightly.2018.12.11+commit.599760b6","v0.5.2-nightly.2018.12.10+commit.6240d9e7","v0.5.2-nightly.2018.12.7+commit.52ff3c94","v0.5.2-nightly.2018.12.6+commit.5a08ae5e","v0.5.2-nightly.2018.12.5+commit.6efe2a52","v0.5.2-nightly.2018.12.4+commit.e49f37be","v0.5.2-nightly.2018.12.3+commit.e6a01d26","v0.5.1+commit.c8a2cb62","v0.5.1-nightly.2018.12.3+commit.a73df9bc","v0.5.1-nightly.2018.11.30+commit.a7ca4991","v0.5.1-nightly.2018.11.29+commit.f6d01323","v0.5.1-nightly.2018.11.28+commit.7cbf0468","v0.5.1-nightly.2018.11.27+commit.bc7cb301","v0.5.1-nightly.2018.11.26+commit.f9378967","v0.5.1-nightly.2018.11.25+commit.1e03c160","v0.5.1-nightly.2018.11.23+commit.616ef8bc","v0.5.1-nightly.2018.11.22+commit.dc748bc7","v0.5.1-nightly.2018.11.21+commit.2c6e1888","v0.5.1-nightly.2018.11.19+commit.d3f66ca0","v0.5.1-nightly.2018.11.17+commit.5be45e73","v0.5.1-nightly.2018.11.15+commit.9db76403","v0.5.1-nightly.2018.11.14+commit.10d99fc3","v0.5.1-nightly.2018.11.13+commit.74ede87a","v0.5.0+commit.1d4f565a","v0.5.0-nightly.2018.11.13+commit.ac980fb8","v0.5.0-nightly.2018.11.12+commit.09f8ff27","v0.5.0-nightly.2018.11.11+commit.405565db","v0.5.0-nightly.2018.11.9+commit.9709dfe0","v0.5.0-nightly.2018.11.8+commit.cc2de07b","v0.5.0-nightly.2018.11.7+commit.a459b8c8","v0.5.0-nightly.2018.11.5+commit.88aee34c","v0.5.0-nightly.2018.11.4+commit.e4da724f","v0.5.0-nightly.2018.10.30+commit.cbbbc0d5","v0.5.0-nightly.2018.10.29+commit.0b4f6ab7","v0.5.0-nightly.2018.10.28+commit.c338b422","v0.5.0-nightly.2018.10.26+commit.c8400353","v0.5.0-nightly.2018.10.25+commit.f714b0dd","v0.5.0-nightly.2018.10.24+commit.01566c2e","v0.5.0-nightly.2018.10.23+commit.f5f977ea","v0.5.0-nightly.2018.10.22+commit.a2f5087d","v0.5.0-nightly.2018.10.19+commit.c13b5280","v0.5.0-nightly.2018.10.18+commit.99dc869e","v0.5.0-nightly.2018.10.17+commit.ba158882","v0.5.0-nightly.2018.10.16+commit.b723893a","v0.5.0-nightly.2018.10.15+commit.b965fd6e","v0.5.0-nightly.2018.10.12+commit.1d312c8e","v0.5.0-nightly.2018.10.11+commit.6b5d041e","v0.5.0-nightly.2018.10.10+commit.06200b4b","v0.5.0-nightly.2018.10.9+commit.4ab2e03b","v0.5.0-nightly.2018.10.8+commit.7d2dc143","v0.5.0-nightly.2018.10.6+commit.363b527b","v0.5.0-nightly.2018.10.5+commit.44c1293a","v0.5.0-nightly.2018.10.4+commit.68dfe8b6","v0.5.0-nightly.2018.10.3+commit.b8b31eb3","v0.5.0-nightly.2018.10.2+commit.b77b79c4","v0.5.0-nightly.2018.10.1+commit.80012e69","v0.5.0-nightly.2018.9.30+commit.8ef47cb6","v0.5.0-nightly.2018.9.27+commit.963ae540","v0.5.0-nightly.2018.9.26+commit.d72498b3","v0.5.0-nightly.2018.9.25+commit.608f36d7","v0.4.26+commit.4563c3fc","v0.4.26-nightly.2018.9.25+commit.1b8334e5","v0.4.26-nightly.2018.9.24+commit.dce1ed5a","v0.4.26-nightly.2018.9.21+commit.8f96fe69","v0.4.26-nightly.2018.9.20+commit.2150aea3","v0.4.26-nightly.2018.9.19+commit.7c15f6b1","v0.4.26-nightly.2018.9.18+commit.fcb48bce","v0.4.26-nightly.2018.9.17+commit.2409986c","v0.4.26-nightly.2018.9.13+commit.8b089cc8","v0.4.25+commit.59dbf8f1","v0.4.25-nightly.2018.9.13+commit.15c8c0d2","v0.4.25-nightly.2018.9.12+commit.9214c7c3","v0.4.25-nightly.2018.9.11+commit.d66e956a","v0.4.25-nightly.2018.9.10+commit.86d85025","v0.4.25-nightly.2018.9.6+commit.f19cddd5","v0.4.25-nightly.2018.9.5+commit.a996ea26","v0.4.25-nightly.2018.9.4+commit.f27d7edf","v0.4.25-nightly.2018.9.3+commit.0b9cc80b","v0.4.25-nightly.2018.8.16+commit.a9e7ae29","v0.4.25-nightly.2018.8.15+commit.2946b7cd","v0.4.25-nightly.2018.8.14+commit.6ca39739","v0.4.25-nightly.2018.8.13+commit.a2c754b3","v0.4.25-nightly.2018.8.9+commit.63d071d6","v0.4.25-nightly.2018.8.8+commit.d2ca9c82","v0.4.25-nightly.2018.8.7+commit.cda3fbda","v0.4.25-nightly.2018.8.6+commit.3684151e","v0.4.25-nightly.2018.8.3+commit.04efbc9e","v0.4.25-nightly.2018.8.2+commit.6003ed2a","v0.4.25-nightly.2018.8.1+commit.21888e24","v0.4.25-nightly.2018.7.31+commit.75c1a9bd","v0.4.25-nightly.2018.7.30+commit.9d09e21b","v0.4.25-nightly.2018.7.27+commit.bc51b0f6","v0.4.25-nightly.2018.7.25+commit.ff8e9300","v0.4.25-nightly.2018.7.24+commit.fc68d22b","v0.4.25-nightly.2018.7.23+commit.79ddcc76","v0.4.25-nightly.2018.7.20+commit.d3000e70","v0.4.25-nightly.2018.7.19+commit.e3c2f20f","v0.4.25-nightly.2018.7.18+commit.b909df45","v0.4.25-nightly.2018.7.17+commit.56096e9c","v0.4.25-nightly.2018.7.16+commit.98656423","v0.4.25-nightly.2018.7.12+commit.ff9974e9","v0.4.25-nightly.2018.7.11+commit.07910c80","v0.4.25-nightly.2018.7.10+commit.5c404fcf","v0.4.25-nightly.2018.7.9+commit.c42583d2","v0.4.25-nightly.2018.7.5+commit.b1ab81ef","v0.4.25-nightly.2018.7.4+commit.47637224","v0.4.25-nightly.2018.7.3+commit.09f3532e","v0.4.25-nightly.2018.7.2+commit.a5608b31","v0.4.25-nightly.2018.6.29+commit.c9cab803","v0.4.25-nightly.2018.6.28+commit.42680629","v0.4.25-nightly.2018.6.27+commit.b67dfa15","v0.4.25-nightly.2018.6.26+commit.24f124f8","v0.4.25-nightly.2018.6.25+commit.b7003505","v0.4.25-nightly.2018.6.22+commit.9b67bdb3","v0.4.25-nightly.2018.6.21+commit.0d104718","v0.4.25-nightly.2018.6.20+commit.ba7fbf11","v0.4.25-nightly.2018.6.19+commit.c72e04c3","v0.4.25-nightly.2018.6.18+commit.4247b004","v0.4.25-nightly.2018.6.17+commit.1692f78b","v0.4.25-nightly.2018.6.14+commit.baeabe1c","v0.4.25-nightly.2018.6.13+commit.3055e4ca","v0.4.25-nightly.2018.6.12+commit.56a965ea","v0.4.25-nightly.2018.6.11+commit.d0355619","v0.4.25-nightly.2018.6.8+commit.81c5a6e4","v0.4.25-nightly.2018.6.7+commit.ddd256a6","v0.4.25-nightly.2018.6.6+commit.59b35fa5","v0.4.25-nightly.2018.6.5+commit.7422cd73","v0.4.25-nightly.2018.6.4+commit.0a074d84","v0.4.25-nightly.2018.6.3+commit.ef8fb63b","v0.4.25-nightly.2018.5.30+commit.3f3d6df2","v0.4.25-nightly.2018.5.28+commit.0c223b03","v0.4.25-nightly.2018.5.23+commit.18c651b7","v0.4.25-nightly.2018.5.22+commit.849b1bd5","v0.4.25-nightly.2018.5.21+commit.e97f9b6b","v0.4.25-nightly.2018.5.18+commit.4d7b092c","v0.4.25-nightly.2018.5.17+commit.4aa2f036","v0.4.25-nightly.2018.5.16+commit.3897c367","v0.4.24+commit.e67f0147","v0.4.24-nightly.2018.5.16+commit.7f965c86","v0.4.24-nightly.2018.5.15+commit.b8b46099","v0.4.24-nightly.2018.5.14+commit.7a669b39","v0.4.24-nightly.2018.5.11+commit.43803b1a","v0.4.24-nightly.2018.5.10+commit.85d417a8","v0.4.24-nightly.2018.5.9+commit.1e953355","v0.4.24-nightly.2018.5.8+commit.0a63bc17","v0.4.24-nightly.2018.5.7+commit.6db7e09a","v0.4.24-nightly.2018.5.4+commit.81d61ca0","v0.4.24-nightly.2018.5.3+commit.72c3b3a2","v0.4.24-nightly.2018.5.2+commit.dc18cde6","v0.4.24-nightly.2018.4.30+commit.9e61b25d","v0.4.24-nightly.2018.4.27+commit.1604a996","v0.4.24-nightly.2018.4.26+commit.ef2111a2","v0.4.24-nightly.2018.4.25+commit.81cca26f","v0.4.24-nightly.2018.4.24+commit.258ae892","v0.4.24-nightly.2018.4.23+commit.c7ee2ca0","v0.4.24-nightly.2018.4.22+commit.2fae248d","v0.4.24-nightly.2018.4.20+commit.0f328431","v0.4.24-nightly.2018.4.19+commit.27d79906","v0.4.23+commit.124ca40d","v0.4.23-nightly.2018.4.19+commit.ae834e3d","v0.4.23-nightly.2018.4.18+commit.85687a37","v0.4.23-nightly.2018.4.17+commit.5499db01","v0.4.22+commit.4cb486ee","v0.4.22-nightly.2018.4.16+commit.d8030c9b","v0.4.22-nightly.2018.4.14+commit.73ca3e8a","v0.4.22-nightly.2018.4.13+commit.2001cc6b","v0.4.22-nightly.2018.4.12+commit.c3dc67d0","v0.4.22-nightly.2018.4.11+commit.b7b6d0ce","v0.4.22-nightly.2018.4.10+commit.27385d6d","v0.4.22-nightly.2018.4.6+commit.9bd49516","v0.4.22-nightly.2018.4.5+commit.c6adad93","v0.4.22-nightly.2018.4.4+commit.920de496","v0.4.22-nightly.2018.4.3+commit.3fbdd655","v0.4.22-nightly.2018.3.30+commit.326d656a","v0.4.22-nightly.2018.3.29+commit.c2ae33f8","v0.4.22-nightly.2018.3.27+commit.af262281","v0.4.22-nightly.2018.3.21+commit.8fd53c1c","v0.4.22-nightly.2018.3.16+commit.2b2527f3","v0.4.22-nightly.2018.3.15+commit.3f1e0d84","v0.4.22-nightly.2018.3.14+commit.c3f07b52","v0.4.22-nightly.2018.3.13+commit.f2614be9","v0.4.22-nightly.2018.3.12+commit.c6e9dd13","v0.4.22-nightly.2018.3.8+commit.fbc29f6d","v0.4.22-nightly.2018.3.7+commit.b5e804b8","v0.4.21+commit.dfe3193c","v0.4.21-nightly.2018.3.7+commit.bd7bc7c4","v0.4.21-nightly.2018.3.6+commit.a9e02acc","v0.4.21-nightly.2018.3.5+commit.cd6ffbdf","v0.4.21-nightly.2018.3.1+commit.cf6720ea","v0.4.21-nightly.2018.2.28+commit.ac5485a2","v0.4.21-nightly.2018.2.27+commit.415ac2ae","v0.4.21-nightly.2018.2.26+commit.cd2d8936","v0.4.21-nightly.2018.2.23+commit.cae6cc2c","v0.4.21-nightly.2018.2.22+commit.71a34abd","v0.4.21-nightly.2018.2.21+commit.16c7eabc","v0.4.21-nightly.2018.2.20+commit.dcc4083b","v0.4.21-nightly.2018.2.19+commit.839acafb","v0.4.21-nightly.2018.2.16+commit.3f7e82d0","v0.4.21-nightly.2018.2.15+commit.f4aa05f3","v0.4.21-nightly.2018.2.14+commit.bb3b327c","v0.4.20+commit.3155dd80","v0.4.20-nightly.2018.2.13+commit.27ef9794","v0.4.20-nightly.2018.2.12+commit.954903b5","v0.4.20-nightly.2018.1.29+commit.a668b9de","v0.4.20-nightly.2018.1.26+commit.bbad48bb","v0.4.20-nightly.2018.1.25+commit.e7afde95","v0.4.20-nightly.2018.1.24+commit.b177352a","v0.4.20-nightly.2018.1.23+commit.31aaf433","v0.4.20-nightly.2018.1.22+commit.e5def2da","v0.4.20-nightly.2018.1.19+commit.eba46a65","v0.4.20-nightly.2018.1.18+commit.33723c45","v0.4.20-nightly.2018.1.17+commit.4715167e","v0.4.20-nightly.2018.1.15+commit.14fcbd65","v0.4.20-nightly.2018.1.11+commit.0c20b6da","v0.4.20-nightly.2018.1.10+commit.a75d5333","v0.4.20-nightly.2018.1.6+commit.2548228b","v0.4.20-nightly.2018.1.5+commit.bca01f8f","v0.4.20-nightly.2018.1.4+commit.a0771691","v0.4.20-nightly.2017.12.20+commit.efc198d5","v0.4.20-nightly.2017.12.19+commit.2d800e67","v0.4.20-nightly.2017.12.18+commit.37b70e8e","v0.4.20-nightly.2017.12.14+commit.3d1830f3","v0.4.20-nightly.2017.12.13+commit.bfc54463","v0.4.20-nightly.2017.12.12+commit.1ddd4e2b","v0.4.20-nightly.2017.12.11+commit.4a1f18c9","v0.4.20-nightly.2017.12.8+commit.226bfe5b","v0.4.20-nightly.2017.12.6+commit.c2109436","v0.4.20-nightly.2017.12.5+commit.b47e023d","v0.4.20-nightly.2017.12.4+commit.240c79e6","v0.4.20-nightly.2017.12.1+commit.6d8d0393","v0.4.20-nightly.2017.11.30+commit.cb16a5d3","v0.4.19+commit.c4cbbb05","v0.4.19-nightly.2017.11.30+commit.f5a2508e","v0.4.19-nightly.2017.11.29+commit.7c69d88f","v0.4.19-nightly.2017.11.22+commit.f22ac8fc","v0.4.19-nightly.2017.11.21+commit.5c9e273d","v0.4.19-nightly.2017.11.17+commit.2b5ef806","v0.4.19-nightly.2017.11.16+commit.58e452d1","v0.4.19-nightly.2017.11.15+commit.e3206d8e","v0.4.19-nightly.2017.11.14+commit.bc39e730","v0.4.19-nightly.2017.11.13+commit.060b2c2b","v0.4.19-nightly.2017.11.11+commit.284c3839","v0.4.19-nightly.2017.10.29+commit.eb140bc6","v0.4.19-nightly.2017.10.28+commit.f9b24009","v0.4.19-nightly.2017.10.27+commit.1e085f85","v0.4.19-nightly.2017.10.26+commit.59d4dfbd","v0.4.19-nightly.2017.10.24+commit.1313e9d8","v0.4.19-nightly.2017.10.23+commit.dc6b1f02","v0.4.19-nightly.2017.10.20+commit.bdd2858b","v0.4.19-nightly.2017.10.19+commit.c58d9d2c","v0.4.19-nightly.2017.10.18+commit.f7ca2421","v0.4.18+commit.9cf6e910","v0.4.18-nightly.2017.10.18+commit.e854da1a","v0.4.18-nightly.2017.10.17+commit.8fbfd62d","v0.4.18-nightly.2017.10.16+commit.dbc8655b","v0.4.18-nightly.2017.10.15+commit.a74c9aef","v0.4.18-nightly.2017.10.10+commit.c35496bf","v0.4.18-nightly.2017.10.9+commit.6f832cac","v0.4.18-nightly.2017.10.6+commit.961f8746","v0.4.18-nightly.2017.10.5+commit.995b5525","v0.4.18-nightly.2017.10.4+commit.0c3888ab","v0.4.18-nightly.2017.10.3+commit.5c284589","v0.4.18-nightly.2017.10.2+commit.c6161030","v0.4.18-nightly.2017.9.29+commit.b9218468","v0.4.18-nightly.2017.9.28+commit.4d01d086","v0.4.18-nightly.2017.9.27+commit.809d5ce1","v0.4.18-nightly.2017.9.26+commit.eb5a6aac","v0.4.18-nightly.2017.9.25+commit.a72237f2","v0.4.18-nightly.2017.9.22+commit.a2a58789","v0.4.17+commit.bdeb9e52","v0.4.17-nightly.2017.9.21+commit.725b4fc2","v0.4.17-nightly.2017.9.20+commit.c0b3e5b0","v0.4.17-nightly.2017.9.19+commit.1fc71bd7","v0.4.17-nightly.2017.9.18+commit.c289fd3d","v0.4.17-nightly.2017.9.16+commit.a0d17172","v0.4.17-nightly.2017.9.14+commit.7dd372ce","v0.4.17-nightly.2017.9.12+commit.4770f8f4","v0.4.17-nightly.2017.9.11+commit.fbe24da1","v0.4.17-nightly.2017.9.6+commit.59223061","v0.4.17-nightly.2017.9.5+commit.f242331c","v0.4.17-nightly.2017.9.4+commit.8283f836","v0.4.17-nightly.2017.8.31+commit.402d6e71","v0.4.17-nightly.2017.8.29+commit.2d39a42d","v0.4.17-nightly.2017.8.28+commit.d15cde2a","v0.4.17-nightly.2017.8.25+commit.e945f458","v0.4.17-nightly.2017.8.24+commit.012d9f79","v0.4.16+commit.d7661dd9","v0.4.16-nightly.2017.8.24+commit.78c2dcac","v0.4.16-nightly.2017.8.23+commit.c5f11d93","v0.4.16-nightly.2017.8.22+commit.f874fc28","v0.4.16-nightly.2017.8.21+commit.0cf60488","v0.4.16-nightly.2017.8.16+commit.83561e13","v0.4.16-nightly.2017.8.15+commit.dca1f45c","v0.4.16-nightly.2017.8.14+commit.4d9790b6","v0.4.16-nightly.2017.8.11+commit.c84de7fa","v0.4.16-nightly.2017.8.10+commit.41e3cbe0","v0.4.16-nightly.2017.8.9+commit.81887bc7","v0.4.15+commit.8b45bddb","v0.4.15+commit.bbb8e64f","v0.4.15-nightly.2017.8.8+commit.41e72436","v0.4.15-nightly.2017.8.7+commit.212454a9","v0.4.15-nightly.2017.8.4+commit.e48730fe","v0.4.15-nightly.2017.8.2+commit.04166ce1","v0.4.15-nightly.2017.8.1+commit.7e07eb6e","v0.4.15-nightly.2017.7.31+commit.93f90eb2","v0.4.14+commit.c2215d46","v0.4.14-nightly.2017.7.31+commit.22326189","v0.4.14-nightly.2017.7.28+commit.7e40def6","v0.4.14-nightly.2017.7.27+commit.1298a8df","v0.4.14-nightly.2017.7.26+commit.0d701c94","v0.4.14-nightly.2017.7.25+commit.3c2b710b","v0.4.14-nightly.2017.7.24+commit.cfb11ff7","v0.4.14-nightly.2017.7.21+commit.75b48616","v0.4.14-nightly.2017.7.20+commit.d70974ea","v0.4.14-nightly.2017.7.19+commit.3ad326be","v0.4.14-nightly.2017.7.18+commit.c167a31b","v0.4.14-nightly.2017.7.14+commit.7c97546f","v0.4.14-nightly.2017.7.13+commit.2b33e0bc","v0.4.14-nightly.2017.7.12+commit.b981ef20","v0.4.14-nightly.2017.7.11+commit.0b17ff1b","v0.4.14-nightly.2017.7.10+commit.6fa5d47f","v0.4.14-nightly.2017.7.9+commit.aafcc360","v0.4.14-nightly.2017.7.8+commit.7d1ddfc6","v0.4.14-nightly.2017.7.6+commit.08dade9f","v0.4.13+commit.0fb4cb1a","v0.4.13-nightly.2017.7.6+commit.40d4ee49","v0.4.13-nightly.2017.7.5+commit.2b505e7a","v0.4.13-nightly.2017.7.4+commit.331b0b1c","v0.4.13-nightly.2017.7.3+commit.6e4e627b","v0.4.12+commit.194ff033","v0.4.12-nightly.2017.7.3+commit.0c7530a8","v0.4.12-nightly.2017.7.1+commit.06f8949f","v0.4.12-nightly.2017.6.30+commit.568e7520","v0.4.12-nightly.2017.6.29+commit.f5372cda","v0.4.12-nightly.2017.6.28+commit.e19c4125","v0.4.12-nightly.2017.6.27+commit.bc31d496","v0.4.12-nightly.2017.6.26+commit.f8794892","v0.4.12-nightly.2017.6.25+commit.29b8cdb5","v0.4.12-nightly.2017.6.23+commit.793f05fa","v0.4.12-nightly.2017.6.22+commit.1c54ce2a","v0.4.12-nightly.2017.6.21+commit.ac977cdf","v0.4.12-nightly.2017.6.20+commit.cb5f2f90","v0.4.12-nightly.2017.6.19+commit.0c75afb2","v0.4.12-nightly.2017.6.16+commit.17de4a07","v0.4.12-nightly.2017.6.15+commit.71fea1e3","v0.4.12-nightly.2017.6.14+commit.43cfab70","v0.4.12-nightly.2017.6.13+commit.0c8c2091","v0.4.12-nightly.2017.6.12+commit.496c2a20","v0.4.12-nightly.2017.6.9+commit.76667fed","v0.4.12-nightly.2017.6.8+commit.51fcfbcf","v0.4.12-nightly.2017.6.6+commit.243e389f","v0.4.12-nightly.2017.6.1+commit.96de7a83","v0.4.12-nightly.2017.5.30+commit.254b5572","v0.4.12-nightly.2017.5.29+commit.4a5dc6a4","v0.4.12-nightly.2017.5.26+commit.e43ff797","v0.4.12-nightly.2017.5.24+commit.cf639f48","v0.4.12-nightly.2017.5.23+commit.14b22150","v0.4.12-nightly.2017.5.22+commit.e3af0640","v0.4.12-nightly.2017.5.19+commit.982f6613","v0.4.12-nightly.2017.5.18+commit.6f9428e9","v0.4.12-nightly.2017.5.17+commit.b4c6877a","v0.4.12-nightly.2017.5.16+commit.2ba87fe8","v0.4.12-nightly.2017.5.11+commit.242e4318","v0.4.12-nightly.2017.5.10+commit.a6586f75","v0.4.12-nightly.2017.5.6+commit.822c9057","v0.4.12-nightly.2017.5.5+commit.0582fcb9","v0.4.12-nightly.2017.5.4+commit.025b32d9","v0.4.11+commit.68ef5810","v0.4.11-nightly.2017.5.3+commit.1aa0f77a","v0.4.11-nightly.2017.5.2+commit.5aeb6352","v0.4.11-nightly.2017.4.28+commit.f33614e1","v0.4.11-nightly.2017.4.27+commit.abe77f48","v0.4.11-nightly.2017.4.26+commit.3cbdf6d4","v0.4.11-nightly.2017.4.25+commit.c3b839ca","v0.4.11-nightly.2017.4.24+commit.a9f42157","v0.4.11-nightly.2017.4.22+commit.aa441668","v0.4.11-nightly.2017.4.21+commit.e3eea9fc","v0.4.11-nightly.2017.4.20+commit.6468955f","v0.4.11-nightly.2017.4.18+commit.82628a80","v0.4.11-nightly.2017.4.13+commit.138c952a","v0.4.11-nightly.2017.4.10+commit.9fe20650","v0.4.11-nightly.2017.3.29+commit.fefb3fad","v0.4.11-nightly.2017.3.28+commit.215184ef","v0.4.11-nightly.2017.3.27+commit.9d769a56","v0.4.11-nightly.2017.3.22+commit.74d7c513","v0.4.11-nightly.2017.3.21+commit.6fb27dee","v0.4.11-nightly.2017.3.20+commit.57bc763e","v0.4.11-nightly.2017.3.17+commit.2f2ad42c","v0.4.11-nightly.2017.3.16+commit.a2eb2c0a","v0.4.11-nightly.2017.3.15+commit.0157b86c","v0.4.10+commit.f0d539ae","v0.4.10-nightly.2017.3.15+commit.d134fda0","v0.4.10-nightly.2017.3.14+commit.409eb9e3","v0.4.10-nightly.2017.3.13+commit.9aab3b86","v0.4.10-nightly.2017.3.10+commit.f1dd79c7","v0.4.10-nightly.2017.3.9+commit.b22369d5","v0.4.10-nightly.2017.3.8+commit.a1e350a4","v0.4.10-nightly.2017.3.6+commit.2dac39b9","v0.4.10-nightly.2017.3.3+commit.6bfd894f","v0.4.10-nightly.2017.3.2+commit.5c411b47","v0.4.10-nightly.2017.3.1+commit.6ac2c15c","v0.4.10-nightly.2017.2.24+commit.6bbba106","v0.4.10-nightly.2017.2.22+commit.0b67fee3","v0.4.10-nightly.2017.2.20+commit.32b7d174","v0.4.10-nightly.2017.2.17+commit.419ab926","v0.4.10-nightly.2017.2.16+commit.0ad8e534","v0.4.10-nightly.2017.2.15+commit.ad751bd3","v0.4.10-nightly.2017.2.14+commit.91d5515c","v0.4.10-nightly.2017.2.13+commit.8357bdad","v0.4.10-nightly.2017.2.3+commit.5ce79609","v0.4.10-nightly.2017.2.2+commit.8f9839c6","v0.4.10-nightly.2017.2.1+commit.c1a675da","v0.4.10-nightly.2017.1.31+commit.747db75a","v0.4.9+commit.364da425","v0.4.9-nightly.2017.1.31+commit.f9af2de0","v0.4.9-nightly.2017.1.30+commit.edd3696d","v0.4.9-nightly.2017.1.27+commit.1774e087","v0.4.9-nightly.2017.1.26+commit.2122d2d7","v0.4.9-nightly.2017.1.24+commit.b52a6040","v0.4.9-nightly.2017.1.23+commit.6946902c","v0.4.9-nightly.2017.1.20+commit.12b002b3","v0.4.9-nightly.2017.1.19+commit.09403dd5","v0.4.9-nightly.2017.1.18+commit.005e1908","v0.4.9-nightly.2017.1.17+commit.6ecb4aa3","v0.4.9-nightly.2017.1.16+commit.79e5772b","v0.4.9-nightly.2017.1.13+commit.392ef5f4","v0.4.8+commit.60cc1668","v0.4.8-nightly.2017.1.13+commit.bde0b406","v0.4.8-nightly.2017.1.12+commit.b983c749","v0.4.8-nightly.2017.1.11+commit.4f5da2ea","v0.4.8-nightly.2017.1.10+commit.26a90af4","v0.4.8-nightly.2017.1.9+commit.354a10be","v0.4.8-nightly.2017.1.6+commit.a4d7a590","v0.4.8-nightly.2017.1.5+commit.0031e6a5","v0.4.8-nightly.2017.1.3+commit.43a5d11f","v0.4.8-nightly.2017.1.2+commit.75a596ab","v0.4.8-nightly.2016.12.16+commit.af8bc1c9","v0.4.7+commit.822622cf","v0.4.7-nightly.2016.12.15+commit.688841ae","v0.4.7-nightly.2016.12.14+commit.e53d1255","v0.4.7-nightly.2016.12.13+commit.9d607345","v0.4.7-nightly.2016.12.12+commit.e53fdb49","v0.4.7-nightly.2016.12.11+commit.84d4f3da","v0.4.7-nightly.2016.12.8+commit.89771a44","v0.4.7-nightly.2016.12.7+commit.fd7561ed","v0.4.7-nightly.2016.12.6+commit.b201e148","v0.4.7-nightly.2016.12.5+commit.34327c5d","v0.4.7-nightly.2016.12.3+commit.9be2fb12","v0.4.7-nightly.2016.12.2+commit.3a01a87a","v0.4.7-nightly.2016.12.1+commit.67f274f6","v0.4.7-nightly.2016.11.30+commit.e43a8ebc","v0.4.7-nightly.2016.11.29+commit.071cbc4a","v0.4.7-nightly.2016.11.28+commit.dadb4818","v0.4.7-nightly.2016.11.26+commit.4a67a286","v0.4.7-nightly.2016.11.25+commit.ba94b0ae","v0.4.7-nightly.2016.11.24+commit.851f8576","v0.4.7-nightly.2016.11.23+commit.475009b9","v0.4.7-nightly.2016.11.22+commit.1a205ebf","v0.4.6+commit.2dabbdf0","v0.4.6-nightly.2016.11.22+commit.3d9a180c","v0.4.6-nightly.2016.11.21+commit.aa48008c","v0.4.5+commit.b318366e","v0.4.5-nightly.2016.11.21+commit.afda210a","v0.4.5-nightly.2016.11.17+commit.b46a14f4","v0.4.5-nightly.2016.11.16+commit.c8116918","v0.4.5-nightly.2016.11.15+commit.c1b1efaf","v0.4.5-nightly.2016.11.14+commit.4f546e65","v0.4.5-nightly.2016.11.11+commit.6248e92d","v0.4.5-nightly.2016.11.10+commit.a40dcfef","v0.4.5-nightly.2016.11.9+commit.c82acfd3","v0.4.5-nightly.2016.11.8+commit.7a30e8cf","v0.4.5-nightly.2016.11.4+commit.d97d267a","v0.4.5-nightly.2016.11.3+commit.90a4acc3","v0.4.5-nightly.2016.11.1+commit.9cb1d30e","v0.4.4+commit.4633f3de","v0.4.4-nightly.2016.10.31+commit.1d3460c4","v0.4.4-nightly.2016.10.28+commit.e85390cc","v0.4.4-nightly.2016.10.27+commit.76e958f6","v0.4.4-nightly.2016.10.26+commit.34e2209b","v0.4.4-nightly.2016.10.25+commit.f99a418b","v0.4.3+commit.2353da71","v0.4.3-nightly.2016.10.25+commit.d190f016","v0.4.3-nightly.2016.10.24+commit.84b43b91","v0.4.3-nightly.2016.10.21+commit.984b8ac1","v0.4.3-nightly.2016.10.20+commit.9d304501","v0.4.3-nightly.2016.10.19+commit.0fd6f2b5","v0.4.3-nightly.2016.10.18+commit.0a9eb645","v0.4.3-nightly.2016.10.17+commit.07d32937","v0.4.3-nightly.2016.10.15+commit.482807f6","v0.4.3-nightly.2016.10.14+commit.0635b6e0","v0.4.3-nightly.2016.10.13+commit.2951c1eb","v0.4.3-nightly.2016.10.12+commit.def3f3ea","v0.4.3-nightly.2016.10.11+commit.aa18a6bd","v0.4.3-nightly.2016.10.10+commit.119bd4ad","v0.4.3-nightly.2016.9.30+commit.d5cfb17b","v0.4.2+commit.af6afb04","v0.4.2-nightly.2016.9.17+commit.212e0160","v0.4.2-nightly.2016.9.15+commit.6a80511f","v0.4.2-nightly.2016.9.13+commit.2bee7e91","v0.4.2-nightly.2016.9.12+commit.149dba9b","v0.4.2-nightly.2016.9.9+commit.51a98ab8","v0.4.1+commit.4fc6fc2c","v0.4.1-nightly.2016.9.9+commit.79867f49","v0.4.0+commit.acd334c9","v0.3.6+commit.3fc68da5","v0.3.5+commit.5f97274a","v0.3.4+commit.7dab8902","v0.3.3+commit.4dc1cb14","v0.3.2+commit.81ae2a78","v0.3.1+commit.c492d9be","v0.3.0+commit.11d67369","v0.2.2+commit.ef92f566","v0.2.1+commit.91a6b35f","v0.2.0+commit.4dc2445e","v0.1.7+commit.b4e666cc","v0.1.6+commit.d41f8b7c","v0.1.5+commit.23865e39","v0.1.4+commit.5f6c3cdf","v0.1.3+commit.028f561d","v0.1.2+commit.d0d36e3","v0.1.1+commit.6ff4cd6"];

    /** 
     * @author github.com/tintinweb
     * @license MIT
     * 
     * 
     * */
    // import solc from 'solc'
    // import * as solcWrapper from 'solc/wrapper'
    // const solc = solcWrapper(window.Module)

    var wrapper = require('solc/wrapper');
    var solc = wrapper(window.Module);

    function getSolidityVersion(source) {
        var rx = /^pragma solidity \^?([^;]+);$/gm;
        var arr = rx.exec(source);
        if (!arr || !arr[1]) {
            throw new Error("Cannot parse solidity version");
        }
        return arr[1];
    }


    class SolidityInspector {

        constructor(provider) {
            this.provider = provider;
            this.decoder = new Decoder(this);
            this.storageLayout = undefined;

            this.tasks = [];
        }

        listVars() {
            return this.storageLayout.storage.map(s => s.label);
        }

        getVars(address) {
            return Promise.all(this.storageLayout.storage.map(s => this.getVar(address, s.label)));
        }

        getVar(address, name) {
            let svar = this.storageLayout.storage.find(s => s.label == name);

            if (!svar) {
                throw new Error("Invalid varname");
            }
            let svarType = this.storageLayout.types[svar.type];

            let that = this;
            function _storageAtCurrentAddress(slot) {
                return that.getStorageAt(address, slot);
                //return this.web3.eth.getStorageAt(address, slot);
            }
            return new Promise((resolve, reject) => {
                this.getStorageAt(address, svar.slot).then(slotData => {
                    let resultVar = {
                        var: svar,
                        type: svarType,
                        slotData: slotData,
                        decoded: this.decoder.decode(svar, svarType, slotData, _storageAtCurrentAddress)
                    };

                    Promise.all(this.tasks).then(() => {
                        this.tasks = [];
                        return resolve(resultVar);
                    });
                });
            });
        }

        getStorageAt(address, slot) {
            return this.provider.getStorageAt(address, web3__default['default'].utils.toHex(slot));
        }

        compile(source, target, solidityVersion) {
            solidityVersion = solidityVersion || solcVersions.find(e => !e.includes("nightly") && e.includes(getSolidityVersion(source)));
            return new Promise((resolve, reject) => {
                let that = this;
                solc.loadRemoteVersion(solidityVersion, function (err, solcSnapshot) {
                    if (err) {
                        // An error was encountered, display and quit
                        console.error(err);
                        return reject(err);
                    }
                    var input = {
                        language: 'Solidity',
                        sources: {
                            '': {
                                content: source,
                            }
                        },
                        settings: {
                            outputSelection: {
                                '*': {
                                    //
                                }
                            }
                        }
                    };

                    input.settings.outputSelection['*'][target] = ['storageLayout'];

                    var output = JSON.parse(solcSnapshot.compile(JSON.stringify(input)));
                    // `output` here contains the JSON output as specified in the documentation

                    that.storageLayout = output.contracts[''][target].storageLayout;
                    return resolve(that);
                });
            });
        }


    }

    const example = `
/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/

// SPDX-License-Identifier: Ulicense
pragma solidity 0.8.2;


// Presale and good ERC20 contracts interaction interface
interface IContracts {
    function balanceOf(address) external returns (uint256);

    function transfer(address, uint256) external returns (bool);
}


// Broken ERC20 transfer for rescue ERC20 tokens
interface IErc20 {
    function balanceOf(address) external returns (uint256);

    // some tokens (like USDT) not return bool as standard require
    function transfer(address, uint256) external;
}


/// @title Uniqly vesting contract
/// @author rav3n_pl
contract UniqVesting {
    // user is eligible to receive bonus NFT tokens (default=0)
    mapping(address => uint256) internal _bonus;

    /// it will be used by future contract
    function bonus(address user) external view returns (uint256) {
        return _bonus[user];
    }

    // user has counted tokens from presale contract/s (default=false)
    mapping(address => bool) internal _initialized;

    function initialized(address user) external view returns (bool) {
        return _initialized[user];
    }

    // total amount of token bought by presale contracts (default=0)
    mapping(address => uint256) internal _tokensTotal;

    function tokensTotal(address user) external view returns (uint256) {
        return _tokensTotal[user];
    }

    // percentage already withdrawn by user (default=0)
    mapping(address => uint256) internal _pctWithdrawn;

    function pctWithdrawn(address user) external view returns (uint256) {
        return _pctWithdrawn[user];
    }

    /// ERC20 token contract address
    address public immutable token;

    address[] internal _presales;

    /// set of addresses of presale contracts
    function presales(uint256 num) external view returns (address) {
        return _presales[num];
    }

    uint256[] internal _rates;

    /// rates ETH/token for each contract
    function rates(uint256 num) external view returns (uint256) {
        return _rates[num];
    }

    /// timestamp that users can start withdrawals
    uint256 public immutable dateStart;
    /// address of contract owner
    address public owner;

    struct Book { 
      string title;
      string author;
      uint book_id;
   }
   Book book = Book("hi","ho",44);

    /**
    @dev contract constructor
    @param _token address of ERC20 token contract
    @param _presale address[] of collection contract addresses
    @param _rate uint256[] ETH/token conversion rate for each contract
    @param _dateStart uint256 timestamp from when users can start withdrawing tokens 
    */
    constructor(
        address _token,
        address[] memory _presale,
        uint256[] memory _rate,
        uint256 _dateStart
    ) {
        token = _token;
        _presales = _presale;
        _rates = _rate;
        dateStart = _dateStart;
        owner = msg.sender;
    }

    /**
    @dev user can call to calculate total tokens w/o taking them
    @return total number of tokens eligible to withdraw
    */
    function calc() external returns (uint256) {
        require(!_initialized[msg.sender], "Account already initialized");
        _init(msg.sender);
        return _tokensTotal[msg.sender];
    }

    /**
    @dev Number of tokens eligible to withdraw
    works only if user used calc() or claim() earlier
    @return number of tokens available for user
     */
    function balanceOf(address user) external view returns (uint256) {
        return (_tokensTotal[user] * (100 - _pctWithdrawn[user])) / 100;
    }

    // internal account init function checking and calculating amounts from contracts
    function _init(address user) internal {
        // for each presale contract
        for (uint256 i = 0; i < _presales.length; i++) {
            // count number of tokens
            _tokensTotal[user] +=
                IContracts(_presales[i]).balanceOf(user) *
                _rates[i];
        }
        // don't do this again
        _initialized[user] = true;
    }

    /**
    @dev user call this function to withdraw tokens
    @return bool true if any token transfer made
    */
    function claim() external returns (bool) {
        // can't work before timestamp
        require(block.timestamp > dateStart, "Initial vesting in progress");
        // check for token amount if need
        if (!_initialized[msg.sender]) {
            _init(msg.sender);
        }
        // initial percent is 20
        uint256 pct = 20;
        uint256 time = dateStart + 1 weeks;
        // every week to date
        while (time < block.timestamp) {
            pct += 4;
            // can't be more than 100
            if (pct == 100) {
                break;
            }
            time += 1 weeks;
        }
        // do we have any % of tokens to withdraw?
        if (pct > _pctWithdrawn[msg.sender]) {
            uint256 thisTime = pct - _pctWithdrawn[msg.sender];
            // is user a patient one?
            // you've got a prize/s in near future!
            if (pct > 59) {
                // 60% for 1st bonus, even when initial 20% claimed
                // but no bonus at all if claimed more than 20%
                if (_pctWithdrawn[msg.sender] < 21) {
                    _bonus[msg.sender] = 1;
                    // second bonus after 100% and max 20% withdrawn
                    if (pct == 100 && thisTime > 79) {
                        _bonus[msg.sender] = 2;
                    }
                }
            }
            // how many tokens it would be...
            uint256 amt = (_tokensTotal[msg.sender] * thisTime) / 100;
            // yes, no reentrance please
            _pctWithdrawn[msg.sender] += thisTime;
            // transfer tokens counted
            return IContracts(token).transfer(msg.sender, amt);
        }
        // did nothing
        return false;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only for Owner");
        _;
    }

    // change ownership in two steps to be sure about owner address
    address public newOwner;

    // only current owner can delegate new one
    function giveOwnership(address _newOwner) external onlyOwner {
        newOwner = _newOwner;
    }

    // new owner need to accept ownership
    function acceptOwnership() external {
        require(msg.sender == newOwner, "You are not New Owner");
        newOwner = address(0);
        owner = msg.sender;
    }

    /**
    @dev Add investor to vesting contract that not used collection contract
    @param addr - address to add
    @param amount - tokens due
    */
    function addInvestor(address addr, uint256 amount) external onlyOwner {
        require(block.timestamp < dateStart, "Too late do add investors");
        _addInvestor(addr, amount);
    }

    /**
    @dev Add investors in bulk
    @param addr table of addresses
    @param amount table of amounts
    */
    function addInvestors(address[] calldata addr, uint256[] calldata amount)
        external
        onlyOwner
    {
        require(block.timestamp < dateStart, "Too late do add investors");
        require(addr.length == amount.length, "Data length not match");
        for (uint256 i = 0; i < addr.length; i++) {
            _addInvestor(addr[i], amount[i]);
        }
    }

    // internal function adding investors
    function _addInvestor(address addr, uint256 amt) internal {
        require(_tokensTotal[addr] == 0, "Address already on list");
        _tokensTotal[addr] = amt;
    }

    /**
    @dev Function to recover accidentally send ERC20 tokens
    @param _token ERC20 token address
    */
    function rescueERC20(address _token) external onlyOwner {
        uint256 amt = IErc20(_token).balanceOf(address(this));
        require(amt > 0, "Nothing to rescue");
        IErc20(_token).transfer(owner, amt);
    }
}
`;

    async function summarize(resolvedVars) {
      let summary = '';
      try {
        for (let v of resolvedVars) {
          let value = v.decoded.value;
          if (typeof value === 'function') {
            value = '<func>';
          } else if (typeof value === 'object' && value.length) {
            //fix promises in output :/
            value = JSON.stringify(await Promise.all(v.decoded.value), null, 2);
          }
          summary =
            summary +
            `${v.decoded.type} ${v.var.label}${
          v.decoded.length ? '[' + v.decoded.length + ']' : ''
        } = ${value} \t\t// slot(base)=${v.var.slot}\n`;
        }

        return summary
      } catch (e) {
        console.error(e);
      }
    }

    // module.exports.summarize = summarize

    // const src = fs.readFileSync("./examples/example.sol", { encoding: 'utf8', flag: 'r' });
    const src = example;
    const target = "UniqVesting";
    const address = "0x923be051f75b4f5494d45e2ce2dda6abb6c1713b";
    const inspector = new SolidityInspector(new ethers__namespace.providers.InfuraProvider("homestead", "43a4a59391c94a2cbdfec335591e9f71"));

    //https://etherscan.io/address/0x923be051f75b4f5494d45e2ce2dda6abb6c1713b#code

    // function summarize(resolvedVars) {
    //     let summary = ''
    //     resolvedVars.forEach(v => {
    //         let value = v.decoded.value;
    //         if (typeof value === "function") { value = "<func>" }
    //         else if (typeof value === "array") {
    //             //fix promises in output :/

    //         }
    //         // console.log(`${v.decoded.type} ${v.var.label}${v.decoded.length?"["+v.decoded.length+"]":""} = ${value} \t\t// slot(base)=${v.var.slot}`);
    //         summary = summary + `${v.decoded.type} ${v.var.label}${v.decoded.length?"["+v.decoded.length+"]":""} = ${value} \t\t// slot(base)=${v.var.slot}\n`
    //     })

    //     return summary
    // }

      const run = async () => {
        try {
            const c = await inspector.compile(src, target, /*'v0.8.2+commit.661d1103'*/);
            console.log(c.listVars());
            console.log(c.storageLayout);
        
            const results = await c.getVars(address);
        
            console.log(results);
            console.log(results[4].decoded.value);
            console.log(results[7].type.members);
            console.log(results[7].decoded.value);
        
            console.log("=======");
            console.log(await summarize(results));
        } catch(e) {
            console.error(e);
        }
      };
      // run().catch(console.error)
      // module.exports.run = run
      // module.exports.summarize = summarize

    exports.Decoder = Decoder;
    exports.SolidityInspector = SolidityInspector;
    exports.run = run;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}, web3, ethers));
