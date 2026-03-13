// Download transcripts for missing recipe videos using yt-dlp
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ytdlp = path.join(__dirname, 'yt-dlp.exe');
const transcriptDir = path.join(__dirname, '..', 'data', 'transcripts');

// Missing video IDs (>= 2 min, not in recipe-data.js)
const missingIds = [
  'rUHpW2vrONA', 'dzhcnJah9l4', 'QFjkVIIs_QI', 'RLDINjaQrK4', 'C93La9i_3fU',
  'D6jur8U69Dc', 'oh0rg13H7EE', 'KP0o-pSzD24', 'GZ99z9VMRa8', 'J-3L_ECIEdA',
  'PUmdQmTqdyY', 'NlY0bTGsXfg', 'TLaP9d1UOy4', '7pKnWnids9I', 'paFqRAcw--A',
  'Cr361y5pN-s', '1pHp-FZxeeI', 'a_dTrINLsJE', 'M9z4x3ovs14', 'CF-yOnWjTc8',
  'K-tnFG7jPaA', 'UCwcJajOmrg', 'vjr16VvNlbs', 'NQl32xtv94E', 'HooAIuvLl_4',
  'SebbbsYueFw', 'IYdC63zA0AM', '4X6vO1Xj34Q', 'EFqNSeD0yF0', 'yo3m29nd-MQ',
  'Eei76jX7NUU', 'U0ph7kRHy24', 'NZ5NUvBJUrA', 'tfvB9NoF94s', '_gZDs96giME',
  '3vYJlUXwdt8', 'NTfo3Q1yt34', 'uQLxPSCAq7g', 'qGejOx1DrHo', 'gk-sIUtzPw0',
  'lsQtg_Frmcg', 'bxS6Yk1ZN_E', 'SS8k6JMy0a4', 'dAuDtBX0Cho', 'ysFRLKinlSw',
  'u2O8mKPtv5w', 'YP91O_wwdxI', 'xtz3TrxpFwM', 'Ga8DZ9BsVmg', '-VUUfjEi0f8',
  'SZMwYtfsQ3Q', 'McfSaNIGM2E', 'zcpVBC3HJCY', '9RQrPowHQdk', '9GQb8GMmT14',
  '8S4DTqKAtdA', 'o0p-u-DztuE', 'wEeF4-QiR8E'
];

let success = 0;
let failed = 0;
const failedIds = [];

for (const id of missingIds) {
  const outFile = path.join(transcriptDir, `${id}.hi.vtt`);
  if (fs.existsSync(outFile)) {
    console.log(`SKIP ${id} (already exists)`);
    success++;
    continue;
  }

  const url = `https://www.youtube.com/watch?v=${id}`;
  try {
    execSync(
      `"${ytdlp}" --skip-download --write-auto-sub --sub-lang hi --sub-format vtt -o "${path.join(transcriptDir, id)}" "${url}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
    // yt-dlp names it id.hi.vtt
    if (fs.existsSync(outFile)) {
      console.log(`OK   ${id}`);
      success++;
    } else {
      // Try English subtitles as fallback
      execSync(
        `"${ytdlp}" --skip-download --write-auto-sub --sub-lang en --sub-format vtt -o "${path.join(transcriptDir, id)}" "${url}"`,
        { timeout: 30000, stdio: 'pipe' }
      );
      const enFile = path.join(transcriptDir, `${id}.en.vtt`);
      if (fs.existsSync(enFile)) {
        console.log(`OK   ${id} (en)`);
        success++;
      } else {
        console.log(`FAIL ${id} (no subs)`);
        failed++;
        failedIds.push(id);
      }
    }
  } catch (err) {
    console.log(`FAIL ${id} (${err.message.slice(0, 60)})`);
    failed++;
    failedIds.push(id);
  }
}

console.log(`\nDone: ${success} success, ${failed} failed`);
if (failedIds.length) console.log('Failed IDs:', failedIds.join(', '));
