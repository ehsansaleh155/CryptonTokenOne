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
const poolFee = web3_js_1.Keypair.generate();
const poolState = web3_js_1.Keypair.generate();
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
    yield connection.confirmTransaction(yield connection.requestAirdrop(poolFee.publicKey, web3_js_1.LAMPORTS_PER_SOL));
    // Token A, B mints. Mint poolAuthority is owner
    const mintA = yield (0, spl_token_1.createMint)(connection, poolFee, poolFee.publicKey, null, 9);
    const mintB = yield (0, spl_token_1.createMint)(connection, poolFee, poolFee.publicKey, null, 9);
    console.log(`Token A mint: ${mintA}`);
    console.log(`Token B mint: ${mintB}`);
    // PDA of poolState for token swap program
    const [poolAuthority, bumpSeed] = yield web3_js_2.PublicKey.findProgramAddress([poolState.publicKey.toBuffer()], spl_token_swap_1.TOKEN_SWAP_PROGRAM_ID);
    // Mint for token pool. Owner is poolAuthority
    const tokenPool = yield (0, spl_token_1.createMint)(connection, poolFee, poolAuthority, null, 2);
    const feeTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, tokenPool, poolFee.publicKey);
    const tokenAccountPool = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, tokenPool, poolFee.publicKey);
    // Token A, B accounts. For swap to store tokens. Owner is poolAuthority
    const tokenAAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintA, poolAuthority, true);
    const tokenBAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, poolFee, mintB, poolAuthority, true);
    console.log(`Swap token account A: ${tokenAAccount.address.toBase58()}`);
    console.log(`Swap token account B: ${tokenBAccount.address.toBase58()}`);
    yield (0, spl_token_1.mintTo)(connection, poolFee, mintA, tokenAAccount.address, poolFee, 1000000);
    yield (0, spl_token_1.mintTo)(connection, poolFee, mintB, tokenBAccount.address, poolFee, 1000000);
    yield spl_token_swap_1.TokenSwap.createTokenSwap(connection, new web3_js_2.Account(poolFee.secretKey), new web3_js_2.Account(poolState.secretKey), poolAuthority, tokenAAccount.address, tokenBAccount.address, tokenPool, mintA, mintB, feeTokenAccount.address, tokenAccountPool.address, spl_token_swap_1.TOKEN_SWAP_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, TRADING_FEE_NUMERATOR, TRADING_FEE_DENOMINATOR, OWNER_TRADING_FEE_NUMERATOR, OWNER_TRADING_FEE_DENOMINATOR, OWNER_WITHDRAW_FEE_NUMERATOR, OWNER_WITHDRAW_FEE_DENOMINATOR, HOST_FEE_NUMERATOR, HOST_FEE_DENOMINATOR, spl_token_swap_1.CurveType.ConstantPrice, new spl_token_swap_1.Numberu64(1));
    const fetchedTokenSwap = yield spl_token_swap_1.TokenSwap.loadTokenSwap(connection, poolState.publicKey, spl_token_swap_1.TOKEN_SWAP_PROGRAM_ID, new web3_js_2.Account(poolFee.secretKey));
    const tokenRecipient = web3_js_1.Keypair.generate();
    yield connection.confirmTransaction(yield connection.requestAirdrop(tokenRecipient.publicKey, web3_js_1.LAMPORTS_PER_SOL));
    // tokenRecipient A, B, accounts. For swap to store tokens. Owner is owner
    const recipientTokenAAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, tokenRecipient, mintA, tokenRecipient.publicKey, true);
    const recipientTokenBAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, tokenRecipient, mintB, tokenRecipient.publicKey, true);
    const tokensToMintTotokenRecipient = 10000;
    const AtokensToSwap = 5000;
    const minBTokensToReceive = 4000;
    yield (0, spl_token_1.mintTo)(connection, tokenRecipient, mintA, recipientTokenAAccount.address, poolFee, tokensToMintTotokenRecipient);
    console.log(`tokenRecipient account A: ${recipientTokenAAccount.address.toBase58()}`);
    console.log(`tokenRecipient account B: ${recipientTokenBAccount.address.toBase58()}`);
    const swapTransaction = yield fetchedTokenSwap.swap(recipientTokenAAccount.address, tokenAAccount.address, tokenBAccount.address, recipientTokenBAccount.address, feeTokenAccount.address, new web3_js_2.Account(tokenRecipient.secretKey), AtokensToSwap, minBTokensToReceive);
    console.log(swapTransaction);
});
main();
//# sourceMappingURL=kossher%20copy.js.map