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
const payer = web3_js_1.Keypair.generate();
const tokenSwapAccount = web3_js_1.Keypair.generate();
const connection = new web3_js_2.Connection((0, web3_js_2.clusterApiUrl)('devnet'), 'confirmed');
const SWAP_PROGRAM_OWNER_FEE_ADDRESS = process.env.SWAP_PROGRAM_OWNER_FEE_ADDRESS;
const TRADING_FEE_NUMERATOR = 25;
const TRADING_FEE_DENOMINATOR = 10000;
const OWNER_TRADING_FEE_NUMERATOR = 5;
const OWNER_TRADING_FEE_DENOMINATOR = 10000;
const OWNER_WITHDRAW_FEE_NUMERATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 1;
const OWNER_WITHDRAW_FEE_DENOMINATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 6;
const HOST_FEE_NUMERATOR = 20;
const HOST_FEE_DENOMINATOR = 100;
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    yield connection.confirmTransaction(yield connection.requestAirdrop(payer.publicKey, web3_js_1.LAMPORTS_PER_SOL));
    // Token A, B mints. Mint authority is owner
    const tokenA = yield (0, spl_token_1.createMint)(connection, payer, payer.publicKey, null, 9);
    const tokenB = yield (0, spl_token_1.createMint)(connection, payer, payer.publicKey, null, 9);
    console.log(`Token A mint: ${tokenA}`);
    console.log(`Token B mint: ${tokenB}`);
    // PDA of tokenSwapAccount for token swap program
    const [authority, bumpSeed] = yield web3_js_2.PublicKey.findProgramAddress([tokenSwapAccount.publicKey.toBuffer()], spl_token_swap_1.TOKEN_SWAP_PROGRAM_ID);
    // Mint for token pool. Owner is authority
    const tokenPool = yield (0, spl_token_1.createMint)(connection, payer, authority, null, 2);
    const feeAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, payer, tokenPool, payer.publicKey);
    const tokenAccountPool = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, payer, tokenPool, payer.publicKey);
    // Token A, B accounts. For swap to store tokens. Owner is authority
    const tokenAccountA = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, payer, tokenA, authority, true);
    const tokenAccountB = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, payer, tokenB, authority, true);
    console.log(`Swap token account A: ${tokenAccountA.address.toBase58()}`);
    console.log(`Swap token account B: ${tokenAccountB.address.toBase58()}`);
    yield (0, spl_token_1.mintTo)(connection, payer, tokenA, tokenAccountA.address, payer, 1000000);
    yield (0, spl_token_1.mintTo)(connection, payer, tokenB, tokenAccountB.address, payer, 1000000);
    yield spl_token_swap_1.TokenSwap.createTokenSwap(connection, new web3_js_2.Account(payer.secretKey), new web3_js_2.Account(tokenSwapAccount.secretKey), authority, tokenAccountA.address, tokenAccountB.address, tokenPool, tokenA, tokenB, feeAccount.address, tokenAccountPool.address, spl_token_swap_1.TOKEN_SWAP_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, TRADING_FEE_NUMERATOR, TRADING_FEE_DENOMINATOR, OWNER_TRADING_FEE_NUMERATOR, OWNER_TRADING_FEE_DENOMINATOR, OWNER_WITHDRAW_FEE_NUMERATOR, OWNER_WITHDRAW_FEE_DENOMINATOR, HOST_FEE_NUMERATOR, HOST_FEE_DENOMINATOR, spl_token_swap_1.CurveType.ConstantPrice, new spl_token_swap_1.Numberu64(1));
    const fetchedTokenSwap = yield spl_token_swap_1.TokenSwap.loadTokenSwap(connection, tokenSwapAccount.publicKey, spl_token_swap_1.TOKEN_SWAP_PROGRAM_ID, new web3_js_2.Account(payer.secretKey));
    const user = web3_js_1.Keypair.generate();
    yield connection.confirmTransaction(yield connection.requestAirdrop(user.publicKey, web3_js_1.LAMPORTS_PER_SOL));
    // User A, B, accounts. For swap to store tokens. Owner is owner
    const userAccountA = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, user, tokenA, user.publicKey, true);
    const userAccountB = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, user, tokenB, user.publicKey, true);
    const tokensToMintToUser = 10000;
    const AtokensToSwap = 5000;
    const minBTokensToReceive = 4000;
    yield (0, spl_token_1.mintTo)(connection, user, tokenA, userAccountA.address, payer, tokensToMintToUser);
    console.log(`User account A: ${userAccountA.address.toBase58()}`);
    console.log(`User account B: ${userAccountB.address.toBase58()}`);
    const swapTransaction = yield fetchedTokenSwap.swap(userAccountA.address, tokenAccountA.address, tokenAccountB.address, userAccountB.address, feeAccount.address, new web3_js_2.Account(user.secretKey), AtokensToSwap, minBTokensToReceive);
    console.log(swapTransaction);
});
main();
//# sourceMappingURL=kossher.js.map