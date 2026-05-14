import { NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';
const REPO       = process.env.GITHUB_REPO;   // e.g. "JBiddlecome/Dog_Poop_Project"
const TOKEN      = process.env.GITHUB_TOKEN;
const FILE_PATH  = 'data/walks.json';
const BRANCH     = 'main';

async function getWalksFile() {
  const res = await fetch(
    `${GITHUB_API}/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
    }
  );
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`);
  const data = await res.json();
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  return { content, sha: data.sha };
}

async function commitWalksFile(content, sha, message) {
  const encoded = Buffer.from(JSON.stringify(content, null, 2) + '\n').toString('base64');
  const res = await fetch(
    `${GITHUB_API}/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, content: encoded, sha, branch: BRANCH }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub commit failed: ${res.status} ${err.message ?? ''}`);
  }
}

export async function POST(request) {
  // Auth — same password as the admin page
  const auth     = request.headers.get('Authorization') ?? '';
  const password = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { walkDate, locations } = body;
  if (!walkDate || !Array.isArray(locations) || locations.length === 0) {
    return NextResponse.json({ ok: false, error: 'Missing walkDate or locations' }, { status: 400 });
  }
  if (locations.some(l => l.lat == null || l.lng == null)) {
    return NextResponse.json({ ok: false, error: 'Every location must have lat and lng' }, { status: 400 });
  }

  if (!REPO || !TOKEN) {
    return NextResponse.json(
      { ok: false, error: 'Server not configured for uploads (missing GITHUB_REPO or GITHUB_TOKEN)' },
      { status: 503 }
    );
  }

  try {
    const { content: walksFile, sha } = await getWalksFile();

    if (walksFile.walks.some(w => w.date === walkDate)) {
      return NextResponse.json(
        { ok: false, error: `Walk ${walkDate} already uploaded` },
        { status: 409 }
      );
    }

    walksFile.walks.push({ date: walkDate, locations });

    const totalPoops = locations.reduce((s, l) => s + l.count, 0);
    await commitWalksFile(
      walksFile,
      sha,
      `Add walk ${walkDate} via Android app (${locations.length} locations, ${totalPoops} poops)`
    );

    return NextResponse.json({
      ok: true,
      message: `Walk ${walkDate} uploaded. Site will redeploy in ~2 minutes.`,
      locations: locations.length,
      totalPoops,
    });
  } catch (err) {
    console.error('[upload-walk]', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
