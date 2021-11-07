'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class CoinTransfer extends Contract {
    async InitLedger(ctx) {
        const wallets = [
            {
                Address: 'Address01',
                Balance: 1000
            },
            {
                Address: 'Address02',
                Balance: 1000
            }
        ];

        for (const wallet of wallets) {
            await ctx.stub.putState(wallet.Address, Buffer.from(stringify(sortKeysRecursive(wallet))));
        }
    }

    async WalletExists(ctx, address) {
        const assetJSON = await ctx.stub.getState(address);
        return assetJSON && assetJSON.length > 0;
    }

    async CreateWallet(ctx, address) {
        const exists = await this.WalletExists(ctx, address);
        if (exists) {
            throw new Error(`The wallet ${address} already exists`);
        }

        const wallet = {
            Address: address,
            Balance: 0
        };
    
        //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(wallet.Address, Buffer.from(stringify(sortKeysRecursive(wallet))));
        return JSON.stringify(wallet);
    }

    async ReadWallet(ctx, address) {
        const assetJSON = await ctx.stub.getState(address); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${address} does not exist`);
        }
        return assetJSON.toString();
    }

    async AddFunds(ctx, address, value) {
        // TODO: ensure value is Number
        const walletString = await this.ReadWallet(ctx, address);
        const wallet = JSON.parse(walletString);
        wallet.Balance = wallet.Balance + parseFloat(value);

        await ctx.stub.putState(address, Buffer.from(stringify(sortKeysRecursive(wallet))));
        return `success adding ${value} to funds to wallet with address ${address}` 
    }

    ValidateTranfer(wallet, value) {
        const erros = [];
        const haveEnoughBalance = wallet.Balance >= parseFloat(value);
        if (!haveEnoughBalance) {
            erros.push({ 'insufficient-balance': `The wallet with address ${wallet.Address} does not have enough balance to transfer ${value}` })
        }

        return erros;
    }

    async TransferCoin(ctx, senderAddress, receiverAddress, value) {
        // TODO: ensure value is Number
        const senderWalletString = await this.ReadWallet(ctx, senderAddress);
        const receiverWalletString = await this.ReadWallet(ctx, receiverAddress);
        
        const senderWallet = JSON.parse(senderWalletString);
        const receiverWallet = JSON.parse(receiverWalletString);

        const errors = this.ValidateTranfer(senderWallet, value);
        if (errors.length && errors.length > 0) {
            throw new Error(`The following errors were found: ${JSON.stringify(errors)}`);
        }

        receiverWallet.Balance = receiverWallet.Balance + parseFloat(value);
        senderWallet.Balance = senderWallet.Balance - parseFloat(value);

        await ctx.stub.putState(receiverWallet.Address, Buffer.from(stringify(sortKeysRecursive(receiverWallet))));
        await ctx.stub.putState(senderWallet.Address, Buffer.from(stringify(sortKeysRecursive(senderWallet))));

        return `successful transferring ${value} of the funds from the wallet with address ${senderAddress} to the wallet with address ${receiverAddress}`
    }

    async GetAllWallets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = CoinTransfer;
