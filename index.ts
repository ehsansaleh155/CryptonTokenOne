import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Keypair,
    Account,
    //Transaction,
    LAMPORTS_PER_SOL,
    //SystemProgram,
    //sendAndConfirmTransaction
} from "@solana/web3.js";
import {
    getOrCreateAssociatedTokenAccount,
    getAccount,
    createMint,
    //transfer,
    getMint,
    mintTo,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
    CurveType,
    Numberu64,
    TokenSwap,
    TOKEN_SWAP_PROGRAM_ID
} from '@solana/spl-token-swap';

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

(async () => {
    // connection
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // accoutns
    const tokenA = Keypair.generate();
    const tokenB = Keypair.generate();
    const tokenRecipient = Keypair.generate();
    const poolFee = Keypair.generate();
    const poolState = Keypair.generate();

    // PDA of tokenSwapAccount for token swap program
    const [poolAuthority, _bumpSeed] = await PublicKey.findProgramAddress(
        [poolState.publicKey.toBuffer()],
        TOKEN_SWAP_PROGRAM_ID,
    );

    //airdrop in poolState and poolFee accounts
    await connection.confirmTransaction(await connection.requestAirdrop(
        poolState.publicKey,
        LAMPORTS_PER_SOL, //this is enough to be rent exempt
    ));
    await connection.confirmTransaction(await connection.requestAirdrop(
        poolFee.publicKey,
        LAMPORTS_PER_SOL,
    ));

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
        tokenA.publicKey,
        poolAuthority,
        5 // We are using 5 for decimal
    );
    //const mintAInfo = await getMint(
    //    connection,
    //    mintA
    //);
    const tokenAAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        poolFee,
        mintA,
        poolFee.publicKey
    );
    const tokenAAccountInfo = await getAccount(
        connection,
        tokenAAccount.address
    );
    await mintTo(
        connection,
        poolFee,
        mintA,
        tokenAAccount.address,
        poolFee,
        4_000_000 // because decimals for the mint are set to 5 => 40
    );
    //console.log("Mint A balance: ", mintAInfo.supply);
    console.log("Token A account balance: ", tokenAAccountInfo.amount);

    //mint token B
    const mintB = await createMint(
        connection,
        poolFee,
        tokenB.publicKey,
        poolAuthority,
        6 // different token decimal
    );
    //const mintBInfo = await getMint(
    //    connection,
    //    mintB
    //);
    const tokenBAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        poolFee,
        mintB,
        poolFee.publicKey
    );
    const tokenBAccountInfo = await getAccount(
        connection,
        tokenBAccount.address
    );
    await mintTo(
        connection,
        poolFee,
        mintB,
        tokenBAccount.address,
        poolFee,
        700_000_000 // because decimals for the mint are set to 6 => 700
    );
    //console.log("Mint B balance: ", mintBInfo.supply);
    console.log("Token B account balance: ", tokenBAccountInfo.amount);

    //Now the pool is created and A_total * B_total = 40 * 700 = 28e3 = invarient

    // Get the token accounts of the tokenRecipient address, and if they do not exist, create thtem
    const recipientTokenAAccount = await getOrCreateAssociatedTokenAccount(connection, poolFee, mintA, tokenRecipient.publicKey, true);
    const recipientTokenBAccount = await getOrCreateAssociatedTokenAccount(connection, poolFee, mintB, tokenRecipient.publicKey, true);

    //variables
    const SWAP_PROGRAM_OWNER_FEE_ADDRESS = process.env.SWAP_PROGRAM_OWNER_FEE_ADDRESS;
    const TRADING_FEE_NUMERATOR = 25;
    const TRADING_FEE_DENOMINATOR = 10_000;
    const OWNER_TRADING_FEE_NUMERATOR = 5;
    const OWNER_TRADING_FEE_DENOMINATOR = 10_000;
    const OWNER_WITHDRAW_FEE_NUMERATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 1;
    const OWNER_WITHDRAW_FEE_DENOMINATOR = SWAP_PROGRAM_OWNER_FEE_ADDRESS ? 0 : 6;
    const HOST_FEE_NUMERATOR = 20;
    const HOST_FEE_DENOMINATOR = 100;

    //////////////////////////////////

    //////////////////////////////////

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

    /*
    const fetchedTokenSwap = await TokenSwap.loadTokenSwap(
        connection,
        poolState.publicKey,
        TOKEN_SWAP_PROGRAM_ID,
        new Account(poolFee.secretKey)
    );
    */

    const tokensToMintTotokenRecipient = 10_000;
    const AtokensToSwap = 2_000;
    let tknA = true; // 'true' for token A and 'false' for token B
    const minBTokensToReceive = calculateNumprime(AtokensToSwap, tknA);

    await mintTo(connection, tokenRecipient, mintA, recipientTokenAAccount.address, poolFee, tokensToMintTotokenRecipient);

    console.log(`tokenRecipient account A: ${recipientTokenAAccount.address.toBase58()}`);
    console.log(`tokenRecipient account B: ${recipientTokenBAccount.address.toBase58()}`);

    const swapTransaction = await tSwap.swap(recipientTokenAAccount.address, tokenAAccount.address, tokenBAccount.address, recipientTokenBAccount.address, feeTokenAccount.address, new Account(tokenRecipient.secretKey), AtokensToSwap, minBTokensToReceive);
    console.log(swapTransaction);

    //function to calculate the approximation of the numbers of the recieving tokens
    function calculateNumprime(n: number, a: boolean) {
        let tA = tokenAAccountInfo.amount as unknown as number;
        let tB = tokenBAccountInfo.amount as unknown as number;
        if (a == true) {
            n /= 100;
            return ((28_000 / (tA + n)) - tB) * 1000
        } else {
            n /= 1000;
            return ((28_000 / (tB + n)) - tA) * 100
        }
    }

})();