import config from '@payload-config';
import { getPayload } from 'payload';
import { authenticator } from 'otplib';
import { ObjectId } from 'mongodb';

interface Args {
  email?: string;
  userId?: string;
  enroll?: boolean;
  raw?: boolean;
  enable?: boolean;
}

function parseArgs(): Args {
  const args: Args = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--email=')) args.email = a.substring('--email='.length);
    else if (a.startsWith('--userId=')) args.userId = a.substring('--userId='.length);
    else if (a === '--enroll') args.enroll = true;
    else if (a === '--raw') args.raw = true;
    else if (a === '--enable') args.enable = true;
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: bun run scripts/debug-totp.ts [options]
  --email=<email>        Target user by email
  --userId=<id>          Target user by Payload id
  --enroll               Generate and persist a new TOTP secret
  --raw                  Use raw Mongo update instead of Payload API
  --enable               Mark TOTP enabled & set verification timestamp (requires secret already)
  --help, -h             Show this message

Examples:
  bun run scripts/debug-totp.ts --email=test@example.com
  bun run scripts/debug-totp.ts --email=test@example.com --enroll
  bun run scripts/debug-totp.ts --email=test@example.com --enroll --raw
  bun run scripts/debug-totp.ts --userId=692c467909a65c9ec8b0941e --enroll --enable
`);
}

async function main() {
  const { email, userId, enroll, raw, enable } = parseArgs();
  const payload = await getPayload({ config });

  if (!email && !userId) {
    console.error('Error: missing --email or --userId\n');
    printHelp();
    process.exit(1);
  }

  // Locate user
  let userDoc: any = null;
  if (userId) {
    try {
      userDoc = await payload.findByID({ collection: 'users', id: userId });
    } catch (e) {
      console.warn('findByID failed, attempting email fallback:', e);
    }
  }
  if (!userDoc && email) {
    const found = await payload.find({
      collection: 'users',
      limit: 1,
      where: { email: { equals: email } },
      depth: 0,
    });
    userDoc = found.docs[0];
  }

  if (!userDoc) {
    console.error('User not found');
    process.exit(1);
  }

  const before = {
    id: userDoc.id,
    email: userDoc.email,
    totpEnabled: userDoc.totpEnabled,
    hasSecret: !!userDoc.totpSecret,
    secretPreview: userDoc.totpSecret ? String(userDoc.totpSecret).slice(0, 4) + '...' : null,
    totpVerifiedAt: userDoc.totpVerifiedAt,
  };
  console.log('Before:', before);

  let generatedSecret: string | undefined;
  let otpauth: string | undefined;

  if (enroll) {
    generatedSecret = authenticator.generateSecret();
    otpauth = authenticator.keyuri(userDoc.email || 'user', 'TradeSocial', generatedSecret);
    console.log('Generated Secret Preview:', generatedSecret.slice(0, 8) + '...');
    console.log('otpauth URL:', otpauth);

    if (raw) {
      // Raw Mongo fallback
      const coll = (payload as any).db.connection.collection('users');
      const _id = new ObjectId(userDoc.id);
      const res = await coll.updateOne(
        { _id },
        { $set: { totpSecret: generatedSecret, totpEnabled: false, totpVerifiedAt: null } }
      );
      console.log('Raw update result:', res.modifiedCount);
    } else {
      // Payload update with overrideAccess
      await payload.update({
        collection: 'users',
        id: userDoc.id,
        data: { totpSecret: generatedSecret, totpEnabled: false, totpVerifiedAt: null } as any,
        overrideAccess: true,
        depth: 0,
      });
      console.log('Payload update attempted');
    }
  }

  if (enable && generatedSecret) {
    // Simulate verification enabling
    await payload.update({
      collection: 'users',
      id: userDoc.id,
      data: { totpEnabled: true, totpVerifiedAt: new Date().toISOString() } as any,
      overrideAccess: true,
      depth: 0,
    });
    console.log('Enabled flag set');
  }

  // Re-fetch fresh document
  const afterDoc = await payload.findByID({ collection: 'users', id: userDoc.id });
  const after = {
    id: afterDoc.id,
    email: afterDoc.email,
    totpEnabled: afterDoc.totpEnabled,
    hasSecret: !!afterDoc.totpSecret,
    secretPreview: afterDoc.totpSecret ? String(afterDoc.totpSecret).slice(0, 4) + '...' : null,
    totpVerifiedAt: afterDoc.totpVerifiedAt,
  };
  console.log('After:', after);

  if (enroll && !after.hasSecret) {
    console.warn('Secret still missing after update. Suggest checking collection hooks, access rules, or plugin interference.');
  }

  console.log('Debug complete.');
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});