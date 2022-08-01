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
const web3_js_2 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const spl_token_swap_1 = require("@solana/spl-token-swap");
const SWAP_PROGRAM_OWNER_FEE_ADDRESS = process.env.SWAP_PROGRAM_OWNER_FEE_ADDRESS;
const TRADING_FEE_NUMERATOR = 25;
const TRADING_FEE_DENOMINATOR = 10000;
const OWNER_TRADING_FEE_NUMERATOR = 5;
const OWNER_TRADING_FEE_DENOMINATOR = 10000;
const OWNER_WITHDRAW_FEE_NUMERATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 1;
const OWNER_WITHDRAW_FEE_DENOMINATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 6;
const HOST_FEE_NUMERATOR = 20;
const HOST_FEE_DENOMINATOR = 100;
(() => __awaiter(void 0, void 0, void 0, function* () {
    // connection
    const connection = new web3_js_2.Connection((0, web3_js_2.clusterApiUrl)("devnet"), "confirmed");
    // accoutns
    const poolFee = web3_js_1.Keypair.generate();
    const poolState = web3_js_1.Keypair.generate();
    const tokenRecipient = web3_js_1.Keypair.generate();
    // PDA of tokenSwapAccount for token swap program
    const [poolAuthority, _bumpSeed] = yield web3_js_2.PublicKey.findProgramAddress([poolState.publicKey.toBuffer()], spl_token_swap_1.TOKEN_SWAP_PROGRAM_ID);
    //airdrop in poolState and poolFee accounts
    yield connection.confirmTransaction(yield connection.requestAirdrop(poolFee.publicKey, 2 * web3_js_1.LAMPORTS_PER_SOL));
    console.log(`${(yield connection.getBalance(poolFee.publicKey)) / web3_js_1.LAMPORTS_PER_SOL} SOL`);
    // Mint for token pool.
    const tokenPool = yield (0, spl_token_1.createMint)(connection, poolFee, poolAuthority, null, 2);
    const feeTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, tokenPool, poolFee.publicKey);
    const tokenAccountPool = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, tokenPool, poolFee.publicKey);
    //mint token A
    const mintA = yield (0, spl_token_1.createMint)(connection, poolFee, poolFee.publicKey, 
    //tokenA.publicKey,
    null, 9);
    /* const mintAInfo = await getMint(
        connection,
        mintA
    ); */
    const tokenAAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintA, poolAuthority, true);
    /* const tokenAAccountInfo = await getAccount(
        connection,
        tokenAAccount.address
    ); */
    yield (0, spl_token_1.mintTo)(connection, poolFee, mintA, tokenAAccount.address, poolFee, 4000000);
    console.log(`Token A amount in the pool: ${(yield connection.getTokenAccountBalance(tokenAAccount.address)).value.amount}`);
    //mint token B
    const mintB = yield (0, spl_token_1.createMint)(connection, poolFee, poolFee.publicKey, 
    //tokenB.publicKey,
    null, 9);
    /* const mintBInfo = await getMint(
        connection,
        mintB
    ); */
    const tokenBAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintB, poolAuthority, true);
    /* const tokenBAccountInfo = await getAccount(
        connection,
        tokenBAccount.address
    ); */
    yield (0, spl_token_1.mintTo)(connection, poolFee, mintB, tokenBAccount.address, poolFee, 4000000);
    console.log(`Token B amount in the pool: ${(yield connection.getTokenAccountBalance(tokenBAccount.address)).value.amount}`);
    //Now the pool is created and A_total * B_total = 4e6 * 7e6 = 28e12 = invarient
    // Get the token accounts of the tokenRecipient address, and if they do not exist, create thtem
    yield connection.confirmTransaction(yield connection.requestAirdrop(tokenRecipient.publicKey, web3_js_1.LAMPORTS_PER_SOL));
    console.log(`${(yield connection.getBalance(tokenRecipient.publicKey)) / web3_js_1.LAMPORTS_PER_SOL} SOL`);
    console.log("Hereeeeeee 0");
    const recipientTokenAAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, tokenRecipient, mintA, tokenRecipient.publicKey, true);
    const recipientTokenBAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, tokenRecipient, mintB, tokenRecipient.publicKey, true);
    //TokenSwap
    const tSwap = yield spl_token_swap_1.TokenSwap.createTokenSwap(connection, new web3_js_2.Account(poolFee.secretKey), new web3_js_2.Account(poolState.secretKey), poolAuthority, tokenAAccount.address, tokenBAccount.address, tokenPool, mintA, mintB, feeTokenAccount.address, tokenAccountPool.address, spl_token_swap_1.TOKEN_SWAP_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, TRADING_FEE_NUMERATOR, TRADING_FEE_DENOMINATOR, OWNER_TRADING_FEE_NUMERATOR, OWNER_TRADING_FEE_DENOMINATOR, OWNER_WITHDRAW_FEE_NUMERATOR, OWNER_WITHDRAW_FEE_DENOMINATOR, HOST_FEE_NUMERATOR, HOST_FEE_DENOMINATOR, spl_token_swap_1.CurveType.ConstantPrice, new spl_token_swap_1.Numberu64(1));
    console.log("Hereeeeeee 1");
    //function to calculate the approximation of the numbers of the recieving tokens
    function calculateNumprime(n, a) {
        let tA = 4000000;
        let tB = 7000000;
        if (a == true) {
            return -0.9 * ((28e12 / (tA + n)) - tB); //0.9 coefficient is not important, it's just the minimum expectation so its better to have a little treshold 
        }
        else {
            return -0.9 * ((28e12 / (tB + n)) - tA);
        }
    }
    const initialTokensToRecipient = 12000;
    const AtokensToSwap = 5500;
    let tknA = true; // 'true' for token A and 'false' for token B
    const expectedTokensToReceive = 1; //calculateNumprime(AtokensToSwap, tknA);
    yield (0, spl_token_1.mintTo)(connection, tokenRecipient, mintA, recipientTokenAAccount.address, poolFee, initialTokensToRecipient);
    console.log(`Token A amount in the user's wallet befroe swaping: ${(yield connection.getTokenAccountBalance(recipientTokenAAccount.address)).value.amount}`);
    console.log("Hereeeeeee 2");
    /* await mintTo(
        connection,
        tokenRecipient,
        mintB,
        recipientTokenBAccount.address,
        poolFee,
        initialTokensToRecipient
    );
    console.log(`Token B amount in the user's wallet befroe swaping: ${(await connection.getTokenAccountBalance(recipientTokenBAccount.address)).value.amount}`);
    console.log("Hereeeeeee 3"); */
    //onsole.log(`tokenRecipient account A: ${recipientTokenAAccount.address.toBase58()}`);
    //console.log(`tokenRecipient account B: ${recipientTokenBAccount.address.toBase58()}`);
    const swapTransaction = yield tSwap.swap(recipientTokenAAccount.address, tokenAAccount.address, tokenBAccount.address, recipientTokenBAccount.address, feeTokenAccount.address, new web3_js_2.Account(tokenRecipient.secretKey), AtokensToSwap, expectedTokensToReceive);
    console.log("Hereeeeeee 4");
    console.log(swapTransaction);
}))();
//# sourceMappingURL=d9.js.map