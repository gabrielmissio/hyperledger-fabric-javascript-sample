/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const coinTransfer = require('./lib/coinTransfer');

module.exports.CoinTransfer = coinTransfer;
module.exports.contracts = [coinTransfer];
