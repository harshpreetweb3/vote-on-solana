import * as anchor from '@coral-xyz/anchor'
import { Program, BN } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Votingdapp } from '../target/types/votingdapp'
import { BankrunProvider, startAnchor } from "anchor-bankrun"; //BankRun provider class | replacement for AnchorProvider
// it act as a wrapper for solana bankrun
// allow us to write typical anchor tests with minimal changes
// it speeds up the testing workflow
const IDL = require('../target/idl/votingdapp.json');

const votingAddress = new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF');

describe('votingdapp', () => {

  let context;
  let provider;
  let votingProgram: Program<Votingdapp>;

  beforeAll(async () => {
    context = await startAnchor("", [{ name: "votingdapp", programId: votingAddress }], []);
    provider = new BankrunProvider(context);
    votingProgram = new Program<Votingdapp>(
      IDL,
      provider
    );
  })

  it('Initialize Poll', async () => {

    // Start a bankrun in an Anchor workspace, with all the workspace programs deployed.
    // This will spin up a BanksServer and a BanksClient, deploy programs and add accounts as instructed. 

    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "Poll 1",
      "What is favorite social app?",
      new anchor.BN(0),
      new anchor.BN(1821246480)
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.pollName).toEqual("Poll 1");
    expect(poll.pollDescription).toEqual("What is favorite social app?");
    expect(poll.pollStart.toNumber()).toEqual(0);
    expect(poll.pollEnd.toNumber()).toEqual(1821246480);
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  //apa accounts nhi pass kr rhe bro
  //apne bs paise katte ja rhe ne kyo k within a fn account create ho reha hai
  it('Initialize candidate', async () => {

    const candidateName1 = "Hustlepreet".slice(0, 32); // Ensure name fits within 32 bytes
    const candidateName2 = "Anmolpreet".slice(0, 32); // Ensure name fits within 32 bytes

    await votingProgram.methods.initializeCandidate(
      candidateName1,
      new anchor.BN(1)
    ).rpc();

    await votingProgram.methods.initializeCandidate(
      candidateName2,
      new anchor.BN(1)
    ).rpc();

    const [anmolCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from(candidateName2)],
      votingAddress
    );

    const anmolCandidate = await votingProgram.account.candidate.fetch(anmolCandidateAddress);
    console.log(anmolCandidate);

    const [hustlepreetCandidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from(candidateName1)],
      votingAddress
    );

    const hustlepreetCandidate = await votingProgram.account.candidate.fetch(hustlepreetCandidateAddress);
    console.log(hustlepreetCandidate);

  });

  it('vote', async () => {

    await votingProgram.methods.vote(
      "Hustlepreet",
      new anchor.BN(1)
    ).rpc();

    const [candidateAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Hustlepreet")],
      votingAddress
    );

    console.log(candidateAddress);

    const candidate = await votingProgram.account.candidate.fetch(candidateAddress);

    console.log(candidate);
    expect(candidate.candidateVotes.toNumber()).toEqual(1);

  });

})
