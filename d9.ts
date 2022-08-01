import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Connection, clusterApiUrl, Account, PublicKey } from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
    getAccount,
    createMint,
    //transfer,
    getMint,
    mintTo,
    mintToChecked,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { CurveType, Numberu64, TokenSwap, TOKEN_SWAP_PROGRAM_ID } from '@solana/spl-token-swap';

const SWAP_PROGRAM_OWNER_FEE_ADDRESS =
    process.env.SWAP_PROGRAM_OWNER_FEE_ADDRESS;

const TRADING_FEE_NUMERATOR = 25;
const TRADING_FEE_DENOMINATOR = 10000;
const OWNER_TRADING_FEE_NUMERATOR = 5;
const OWNER_TRADING_FEE_DENOMINATOR = 10000;
const OWNER_WITHDRAW_FEE_NUMERATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 1;
const OWNER_WITHDRAW_FEE_DENOMINATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 6;
const HOST_FEE_NUMERATOR = 20;
const HOST_FEE_DENOMINATOR = 100;

(async () => {
    // connection
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // accoutns
    const poolFee = Keypair.generate();
    const poolState = Keypair.generate();
    const tokenRecipient = Keypair.generate();

    // PDA of tokenSwapAccount for token swap program
    const [poolAuthority, _bumpSeed] = await PublicKey.findProgramAddress(
        [poolState.publicKey.toBuffer()],
        TOKEN_SWAP_PROGRAM_ID,
    );

    //airdrop in poolState and poolFee accounts
    await connection.confirmTransaction(await connection.requestAirdrop(
        poolFee.publicKey,
        2 * LAMPORTS_PER_SOL,
    ));
    console.log(
        `${(await connection.getBalance(poolFee.publicKey)) / LAMPORTS_PER_SOL} SOL`
    );

    // Mint for token pool.
    const tokenPool = await createMint(connection, poolFee, poolAuthority, null, 2);
    const feeTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        poolFee,
        tokenPool,
        poolFee.publicKey
    );
    const tokenAccountPool = await getOrCreateAssociatedTokenAccount(
        connection,
        poolFee,
        tokenPool,
        poolFee.publicKey
    );

    //mint token A
    const mintA = await createMint(
        connection,
        poolFee,
        poolFee.publicKey,
        //tokenA.publicKey,
        null,
        9
    );
    /* const mintAInfo = await getMint(
        connection,
        mintA
    ); */
    const tokenAAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        poolFee,
        mintA,
        poolAuthority,
        true
    );
    /* const tokenAAccountInfo = await getAccount(
        connection,
        tokenAAccount.address
    ); */
    await mintTo(
        connection,
        poolFee,
        mintA,
        tokenAAccount.address,
        poolFee,
        4_000_000
    );
    console.log(`Token A amount in the pool: ${(await connection.getTokenAccountBalance(tokenAAccount.address)).value.amount}`);

    //mint token B
    const mintB = await createMint(
        connection,
        poolFee,
        poolFee.publicKey,
        //tokenB.publicKey,
        null,
        9
    );
    /* const mintBInfo = await getMint(
        connection,
        mintB
    ); */
    const tokenBAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        poolFee,
        mintB,
        poolAuthority,
        true
    );
    /* const tokenBAccountInfo = await getAccount(
        connection,
        tokenBAccount.address
    ); */
    await mintTo(
        connection,
        poolFee,
        mintB,
        tokenBAccount.address,
        poolFee,
        4_000_000
    );
    console.log(`Token B amount in the pool: ${(await connection.getTokenAccountBalance(tokenBAccount.address)).value.amount}`);

    //Now the pool is created and A_total * B_total = 4e6 * 7e6 = 28e12 = invarient
    // Get the token accounts of the tokenRecipient address, and if they do not exist, create thtem
    await connection.confirmTransaction(await connection.requestAirdrop(
        tokenRecipient.publicKey,
        LAMPORTS_PER_SOL,
    ));
    console.log(
        `${(await connection.getBalance(tokenRecipient.publicKey)) / LAMPORTS_PER_SOL} SOL`
    );
    console.log("Hereeeeeee 0");
    const recipientTokenAAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        tokenRecipient,
        mintA,
        tokenRecipient.publicKey,
        true
    );
    const recipientTokenBAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        tokenRecipient,
        mintB,
        tokenRecipient.publicKey,
        true
    );

    //TokenSwap
    const tSwap = await TokenSwap.createTokenSwap(
        connection,
        new Account(poolFee.secretKey),
        new Account(poolState.secretKey),
        poolAuthority,
        tokenAAccount.address,
        tokenBAccount.address,
        tokenPool,
        mintA,
        mintB,
        feeTokenAccount.address,
        tokenAccountPool.address,
        TOKEN_SWAP_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        TRADING_FEE_NUMERATOR,
        TRADING_FEE_DENOMINATOR,
        OWNER_TRADING_FEE_NUMERATOR,
        OWNER_TRADING_FEE_DENOMINATOR,
        OWNER_WITHDRAW_FEE_NUMERATOR,
        OWNER_WITHDRAW_FEE_DENOMINATOR,
        HOST_FEE_NUMERATOR,
        HOST_FEE_DENOMINATOR,
        CurveType.ConstantPrice,
        new Numberu64(1),
    );
    console.log("Hereeeeeee 1");

    //function to calculate the approximation of the numbers of the recieving tokens
    function calculateNumprime(n: number, a: boolean) {
        let tA = 4_000_000;
        let tB = 7_000_000;
        if (a == true) {
            return -0.9 * ((28e12 / (tA + n)) - tB) //0.9 coefficient is not important, it's just the minimum expectation so its better to have a little treshold 
        } else {
            return -0.9 * ((28e12 / (tB + n)) - tA)
        }
    }

    const initialTokensToRecipient = 12_000;
    const AtokensToSwap = 5_500;
    let tknA = true; // 'true' for token A and 'false' for token B
    const expectedTokensToReceive = 1; //calculateNumprime(AtokensToSwap, tknA);

    await mintTo(
        connection,
        tokenRecipient,
        mintA,
        recipientTokenAAccount.address,
        poolFee,
        initialTokensToRecipient
    );
    console.log(`Token A amount in the user's wallet befroe swaping: ${(await connection.getTokenAccountBalance(recipientTokenAAccount.address)).value.amount}`);
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

    const swapTransaction = await tSwap.swap(
        recipientTokenAAccount.address,
        tokenAAccount.address,
        tokenBAccount.address,
        recipientTokenBAccount.address,
        feeTokenAccount.address,
        new Account(tokenRecipient.secretKey),
        AtokensToSwap,
        expectedTokensToReceive
    );
    console.log("Hereeeeeee 4");
    console.log(swapTransaction);
})();