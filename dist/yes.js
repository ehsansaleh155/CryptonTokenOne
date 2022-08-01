"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bs58 = __importStar(require("bs58"));
(() => __awaiter(void 0, void 0, void 0, function* () {
    // connection
    const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
    // 5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CmPEwKgVWr8
    const feePayer = web3_js_1.Keypair.fromSecretKey(bs58.decode("588FU4PktJWfGfxtzpAAXywSNt74AvtroVzGfKkVN1LwRuvHwKGr851uH8czM5qm4iqLbs1kKoMKtMJG4ATR7Ld2"));
    // G2FAbFQPFa5qKXCetoFZQEvF9BVvCKbvUZvodpVidnoY
    const alice = web3_js_1.Keypair.fromSecretKey(bs58.decode("4NMwxzmYj2uvHuq8xoqhY8RXg63KSVJM1DXkpbmkUY7YQWuoyQgFnnzn6yo3CMnqZasnNPNuAT2TLwQsCaKkUddp"));
    const mintPubkey = new web3_js_1.PublicKey("8mAKLjGGmjKTnmcXeyr3pr7iX13xXVjJJiL6RujDbSPV");
    const tokenAccountPubkey = new web3_js_1.PublicKey("2XYiFjmU1pCXmC2QfEAghk6S7UADseupkNQdnRBXszD5");
    // 1) use build-in function
    {
        let txhash = yield (0, spl_token_1.mintToChecked)(connection, // connection
        feePayer, // fee payer
        mintPubkey, // mint
        tokenAccountPubkey, // receiver (sholud be a token account)
        alice, // mint authority
        1e8, // amount. if your decimals is 8, you mint 10^8 for 1 token.
        8 // decimals
        );
        console.log(`txhash: ${txhash}`);
        // if alice is a multisig account
        // let txhash = await mintToChecked(
        //   connection, // connection
        //   feePayer, // fee payer
        //   mintPubkey, // mint
        //   tokenAccountPubkey, // receiver (sholud be a token account)
        //   alice.publicKey, // !! mint authority pubkey !!
        //   1e8, // amount. if your decimals is 8, you mint 10^8 for 1 token.
        //   8, // decimals
        //   [signer1, signer2 ...],
        // );
    }
    // or
    // 2) compose by yourself
    {
        let tx = new web3_js_1.Transaction().add((0, spl_token_1.createMintToCheckedInstruction)(mintPubkey, // mint
        tokenAccountPubkey, // receiver (sholud be a token account)
        alice.publicKey, // mint authority
        1e8, // amount. if your decimals is 8, you mint 10^8 for 1 token.
        8 // decimals
        // [signer1, signer2 ...], // only multisig account will use
        ));
        console.log(`txhash: ${yield connection.sendTransaction(tx, [
            feePayer,
            alice /* fee payer + mint authority */,
        ])}`);
    }
}))();
//# sourceMappingURL=yes.js.map