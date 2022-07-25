"use strict";
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
/*
We need to create below accoutns:

- empty pool state account      : poolState
- pool authority(PDA)           : poolAuthority  #FreezeAuth
- token A account               : tokenA
- token B account               : tokenBPubkey
////- pool token mint               : poolMint
- pool token fee account        : poolFee   #payer
- pool token recipient account  : tokenRecipient
- token program                 : tokenProgramId
*/
(() => __awaiter(void 0, void 0, void 0, function* () {
    // connection
    const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
    // accoutns
    const tokenProgramId = new web3_js_1.PublicKey('SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8');
    const tokenA = web3_js_1.Keypair.generate();
    const tokenB = web3_js_1.Keypair.generate();
    const tokenRecipient = web3_js_1.Keypair.generate();
    const poolAuthority = web3_js_1.Keypair.generate();
    ////const poolMint = Keypair.generate();
    const poolFee = web3_js_1.Keypair.generate();
    const poolState = web3_js_1.Keypair.generate();
    //airdrop in poolState and poolFee accounts
    const airdropSignature = yield connection.requestAirdrop(poolState.publicKey, 6 * web3_js_1.LAMPORTS_PER_SOL);
    yield connection.confirmTransaction(airdropSignature);
    const airdropSignature1 = yield connection.requestAirdrop(poolFee.publicKey, 5 * web3_js_1.LAMPORTS_PER_SOL);
    yield connection.confirmTransaction(airdropSignature1);
    //creat PDA for poolAuthority
    const instruction = web3_js_1.SystemProgram.createAccount({
        fromPubkey: poolState.publicKey,
        newAccountPubkey: poolAuthority.publicKey,
        space: 82,
        lamports: web3_js_1.LAMPORTS_PER_SOL,
        programId: tokenProgramId,
    });
    let transaction = new web3_js_1.Transaction({
        feePayer: poolState.publicKey
    });
    transaction.add(instruction);
    var pdaSignature = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [poolState, poolAuthority]);
    console.log(pdaSignature);
    //mint token A
    const mintA = yield (0, spl_token_1.createMint)(connection, poolFee, tokenA.publicKey, poolAuthority.publicKey, 5 // We are using 5 for decimal
    );
    const mintAInfo = yield (0, spl_token_1.getMint)(connection, mintA);
    const tokenAAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintA, poolFee.publicKey);
    const tokenAAccountInfo = yield (0, spl_token_1.getAccount)(connection, tokenAAccount.address);
    yield (0, spl_token_1.mintTo)(connection, poolFee, mintA, tokenAAccount.address, poolAuthority, 4000000000 // because decimals for the mint are set to 5 => 40000
    );
    console.log("Mint A balance: ", mintAInfo.supply);
    console.log("Token A account balance: ", tokenAAccountInfo.amount);
    //mint token B
    const mintB = yield (0, spl_token_1.createMint)(connection, poolFee, tokenB.publicKey, poolAuthority.publicKey, 6 // different token decimal
    );
    const mintBInfo = yield (0, spl_token_1.getMint)(connection, mintB);
    const tokenBAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintB, poolFee.publicKey);
    const tokenBAccountInfo = yield (0, spl_token_1.getAccount)(connection, tokenBAccount.address);
    yield (0, spl_token_1.mintTo)(connection, poolFee, mintB, tokenBAccount.address, poolAuthority, 700000000000 // because decimals for the mint are set to 6 => 700000
    );
    console.log("Mint B balance: ", mintBInfo.supply);
    console.log("Token B account balance: ", tokenBAccountInfo.amount);
    //Now the pool is created and A_total * B_total = 40000 * 700000 = 28e9 = invarient
    // Get the token accounts of the tokenRecipient address, and if they do not exist, create thtem
    const recipientTokenAAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintA, tokenRecipient.publicKey);
    const recipientTokenBAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintB, tokenRecipient.publicKey);
    // Transfer num number of token A or B from tokenRecipient to the pool and get back the numprime number of the other token
    let num = 2000000; //an example amount with consideration of decimals (5 for A and 6 for B)
    let tknA = true; // 'true' for token A and 'false' for token B 
    let numPrime = calculateNumprime(num, tknA);
    // Transfer the new token to the "toTokenAccount" we just created
    var signatureRecieve;
    var signatureSend;
    if (tknA) {
        signatureSend = yield (0, spl_token_1.transfer)(connection, tokenRecipient, recipientTokenAAccount.address, tokenAAccount.address, tokenRecipient.publicKey, num);
        signatureRecieve = yield (0, spl_token_1.transfer)(connection, poolFee, tokenBAccount.address, recipientTokenBAccount.address, poolFee.publicKey, numPrime);
    }
    else {
        signatureSend = yield (0, spl_token_1.transfer)(connection, tokenRecipient, recipientTokenBAccount.address, tokenBAccount.address, tokenRecipient.publicKey, num);
        signatureRecieve = yield (0, spl_token_1.transfer)(connection, poolFee, tokenAAccount.address, recipientTokenAAccount.address, poolFee.publicKey, numPrime);
    }
    // print the send and recieve the signatures
    console.log("Send signature: ", signatureSend);
    console.log("Recive signature: ", signatureRecieve);
    function calculateNumprime(n, a) {
        let tA = tokenAAccountInfo.amount;
        let tB = tokenBAccountInfo.amount;
        if (a == true) {
            n /= 100000;
            return ((28000000000 / (tA + n)) - tB) * 1000000;
        }
        else {
            n /= 1000000;
            return ((28000000000 / (tB + n)) - tA) * 100000;
        }
    }
}))();
//# sourceMappingURL=firstindex.js.map