import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    LAMPORTS_PER_SOL,
    SystemProgram,
    sendAndConfirmTransaction
} from "@solana/web3.js";
import {
    getOrCreateAssociatedTokenAccount,
    getAccount,
    createMint,
    transfer,
    getMint,
    mintTo,
} from "@solana/spl-token";

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

(async () => {
    // connection
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // accoutns
    const tokenProgramId = new PublicKey('SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8');
    const tokenA = Keypair.generate();
    const tokenB = Keypair.generate();
    const tokenRecipient = Keypair.generate();
    const poolAuthority = Keypair.generate();
    ////const poolMint = Keypair.generate();
    const poolFee = Keypair.generate();
    const poolState = Keypair.generate();

    //airdrop in poolState and poolFee accounts
    const airdropSignature = await connection.requestAirdrop(
        poolState.publicKey,
        6 * LAMPORTS_PER_SOL, //this is enough to be rent exempt
    );
    await connection.confirmTransaction(airdropSignature);
    const airdropSignature1 = await connection.requestAirdrop(
        poolFee.publicKey,
        5 * LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(airdropSignature1);

    //creat PDA for poolAuthority
    const instruction = SystemProgram.createAccount({
        fromPubkey: poolState.publicKey,
        newAccountPubkey: poolAuthority.publicKey,
        space: 82,
        lamports: LAMPORTS_PER_SOL,
        programId: tokenProgramId,
    });
    let transaction = new Transaction({
        feePayer: poolState.publicKey
    });
    transaction.add(instruction);
    var pdaSignature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [poolState, poolAuthority]
    );
    console.log(pdaSignature);

    //mint token A
    const mintA = await createMint(
        connection,
        poolFee,
        tokenA.publicKey,
        poolAuthority.publicKey,
        5 // We are using 5 for decimal
    );
    const mintAInfo = await getMint(
        connection,
        mintA
    );
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
        poolAuthority,
        4000000000 // because decimals for the mint are set to 5 => 40000
    );
    console.log("Mint A balance: ", mintAInfo.supply);
    console.log("Token A account balance: ", tokenAAccountInfo.amount);

    //mint token B
    const mintB = await createMint(
        connection,
        poolFee,
        tokenB.publicKey,
        poolAuthority.publicKey,
        6 // different token decimal
    );
    const mintBInfo = await getMint(
        connection,
        mintB
    );
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
        poolAuthority,
        700000000000 // because decimals for the mint are set to 6 => 700000
    );
    console.log("Mint B balance: ", mintBInfo.supply);
    console.log("Token B account balance: ", tokenBAccountInfo.amount);

    //Now the pool is created and A_total * B_total = 40000 * 700000 = 28e9 = invarient

    // Get the token accounts of the tokenRecipient address, and if they do not exist, create thtem
    const recipientTokenAAccount = await getOrCreateAssociatedTokenAccount(connection, poolFee, mintA, tokenRecipient.publicKey);
    const recipientTokenBAccount = await getOrCreateAssociatedTokenAccount(connection, poolFee, mintB, tokenRecipient.publicKey);

    // Transfer num number of token A or B from tokenRecipient to the pool and get back the numprime number of the other token
    let num = 2000000; //an example amount with consideration of decimals (5 for A and 6 for B)
    let tknA = true; // 'true' for token A and 'false' for token B 
    let numPrime = calculateNumprime(num, tknA);

    // Transfer the new token to the "toTokenAccount" we just created
    var signatureRecieve;
    var signatureSend;
    if (tknA) {
        signatureSend = await transfer(
            connection,
            tokenRecipient,
            recipientTokenAAccount.address,
            tokenAAccount.address,
            tokenRecipient.publicKey,
            num
        );
        signatureRecieve = await transfer(
            connection,
            poolFee,
            tokenBAccount.address,
            recipientTokenBAccount.address,
            poolFee.publicKey,
            numPrime
        );
    } else {
        signatureSend = await transfer(
            connection,
            tokenRecipient,
            recipientTokenBAccount.address,
            tokenBAccount.address,
            tokenRecipient.publicKey,
            num
        );
        signatureRecieve = await transfer(
            connection,
            poolFee,
            tokenAAccount.address,
            recipientTokenAAccount.address,
            poolFee.publicKey,
            numPrime
        );

    }

    // print the send and recieve the signatures
    console.log("Send signature: ", signatureSend);
    console.log("Recive signature: ", signatureRecieve);

    function calculateNumprime(n: number, a: boolean) {
        let tA = tokenAAccountInfo.amount as unknown as number;
        let tB = tokenBAccountInfo.amount as unknown as number;
        if (a == true) {
            n /= 100000;
            return ((28000000000 / (tA + n)) - tB) * 1000000
        } else {
            n /= 1000000;
            return ((28000000000 / (tB + n)) - tA) * 100000
        }
    }
})();