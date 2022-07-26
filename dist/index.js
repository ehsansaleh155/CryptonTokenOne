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
const spl_token_swap_1 = require("@solana/spl-token-swap");
/*
We need to create below accoutns:

- empty pool state account      : poolState
- pool authority(PDA)           : poolAuthority
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
    const tokenA = web3_js_1.Keypair.generate();
    const tokenB = web3_js_1.Keypair.generate();
    const tokenRecipient = web3_js_1.Keypair.generate();
    const poolFee = web3_js_1.Keypair.generate();
    const poolState = web3_js_1.Keypair.generate();
    // PDA of tokenSwapAccount for token swap program
    const [poolAuthority, _bumpSeed] = yield web3_js_1.PublicKey.findProgramAddress([poolState.publicKey.toBuffer()], spl_token_swap_1.TOKEN_SWAP_PROGRAM_ID);
    //airdrop in poolState and poolFee accounts
    yield connection.confirmTransaction(yield connection.requestAirdrop(poolState.publicKey, web3_js_1.LAMPORTS_PER_SOL));
    yield connection.confirmTransaction(yield connection.requestAirdrop(poolFee.publicKey, web3_js_1.LAMPORTS_PER_SOL));
    // Mint for token pool.
    const tokenPool = yield (0, spl_token_1.createMint)(connection, poolFee, poolAuthority, null, 2);
    const feeTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, tokenPool, poolFee.publicKey);
    const tokenAccountPool = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, tokenPool, poolFee.publicKey);
    //mint token A
    const mintA = yield (0, spl_token_1.createMint)(connection, poolFee, tokenA.publicKey, poolAuthority, 5 // We are using 5 for decimal
    );
    //const mintAInfo = await getMint(
    //    connection,
    //    mintA
    //);
    const tokenAAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintA, poolFee.publicKey);
    const tokenAAccountInfo = yield (0, spl_token_1.getAccount)(connection, tokenAAccount.address);
    yield (0, spl_token_1.mintTo)(connection, poolFee, mintA, tokenAAccount.address, poolFee, 4000000 // because decimals for the mint are set to 5 => 40
    );
    //console.log("Mint A balance: ", mintAInfo.supply);
    console.log("Token A account balance: ", tokenAAccountInfo.amount);
    //mint token B
    const mintB = yield (0, spl_token_1.createMint)(connection, poolFee, tokenB.publicKey, poolAuthority, 6 // different token decimal
    );
    //const mintBInfo = await getMint(
    //    connection,
    //    mintB
    //);
    const tokenBAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintB, poolFee.publicKey);
    const tokenBAccountInfo = yield (0, spl_token_1.getAccount)(connection, tokenBAccount.address);
    yield (0, spl_token_1.mintTo)(connection, poolFee, mintB, tokenBAccount.address, poolFee, 700000000 // because decimals for the mint are set to 6 => 700
    );
    //console.log("Mint B balance: ", mintBInfo.supply);
    console.log("Token B account balance: ", tokenBAccountInfo.amount);
    //Now the pool is created and A_total * B_total = 40 * 700 = 28e3 = invarient
    // Get the token accounts of the tokenRecipient address, and if they do not exist, create thtem
    const recipientTokenAAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintA, tokenRecipient.publicKey, true);
    const recipientTokenBAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintB, tokenRecipient.publicKey, true);
    //variables
    const SWAP_PROGRAM_OWNER_FEE_ADDRESS = process.env.SWAP_PROGRAM_OWNER_FEE_ADDRESS;
    const TRADING_FEE_NUMERATOR = 25;
    const TRADING_FEE_DENOMINATOR = 10000;
    const OWNER_TRADING_FEE_NUMERATOR = 5;
    const OWNER_TRADING_FEE_DENOMINATOR = 10000;
    const OWNER_WITHDRAW_FEE_NUMERATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 1;
    const OWNER_WITHDRAW_FEE_DENOMINATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 6;
    const HOST_FEE_NUMERATOR = 20;
    const HOST_FEE_DENOMINATOR = 100;
    //////////////////////////////////
    //////////////////////////////////
    //TokenSwap
    const tSwap = yield spl_token_swap_1.TokenSwap.createTokenSwap(connection, new web3_js_1.Account(poolFee.secretKey), new web3_js_1.Account(poolState.secretKey), poolAuthority, tokenAAccount.address, tokenBAccount.address, tokenPool, mintA, mintB, feeTokenAccount.address, tokenAccountPool.address, spl_token_swap_1.TOKEN_SWAP_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, TRADING_FEE_NUMERATOR, TRADING_FEE_DENOMINATOR, OWNER_TRADING_FEE_NUMERATOR, OWNER_TRADING_FEE_DENOMINATOR, OWNER_WITHDRAW_FEE_NUMERATOR, OWNER_WITHDRAW_FEE_DENOMINATOR, HOST_FEE_NUMERATOR, HOST_FEE_DENOMINATOR, spl_token_swap_1.CurveType.ConstantPrice, new spl_token_swap_1.Numberu64(1));
    /*
    const fetchedTokenSwap = await TokenSwap.loadTokenSwap(
        connection,
        poolState.publicKey,
        TOKEN_SWAP_PROGRAM_ID,
        new Account(poolFee.secretKey)
    );
    */
    const tokensToMintTotokenRecipient = 10000;
    const AtokensToSwap = 2000;
    let tknA = true; // 'true' for token A and 'false' for token B
    const minBTokensToReceive = calculateNumprime(AtokensToSwap, tknA);
    yield (0, spl_token_1.mintTo)(connection, tokenRecipient, mintA, recipientTokenAAccount.address, poolFee, tokensToMintTotokenRecipient);
    console.log(`tokenRecipient account A: ${recipientTokenAAccount.address.toBase58()}`);
    console.log(`tokenRecipient account B: ${recipientTokenBAccount.address.toBase58()}`);
    const swapTransaction = yield tSwap.swap(recipientTokenAAccount.address, tokenAAccount.address, tokenBAccount.address, recipientTokenBAccount.address, feeTokenAccount.address, new web3_js_1.Account(tokenRecipient.secretKey), AtokensToSwap, minBTokensToReceive);
    console.log(swapTransaction);
    //function to calculate the approximation of the numbers of the recieving tokens
    function calculateNumprime(n, a) {
        let tA = tokenAAccountInfo.amount;
        let tB = tokenBAccountInfo.amount;
        if (a == true) {
            n /= 100;
            return ((28000 / (tA + n)) - tB) * 1000;
        }
        else {
            n /= 1000;
            return ((28000 / (tB + n)) - tA) * 100;
        }
    }
}))();
//# sourceMappingURL=index.js.map