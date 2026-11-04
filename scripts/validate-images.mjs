import sharp from "sharp";
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join, extname } from "path";

const SRC_DIR = join(process.cwd(), "src");
const PUBLIC_DIR = join(process.cwd(), "public");
const IMAGES_DIR = join(PUBLIC_DIR, "images");

// Recursively get all files in a dir
function getFiles(dir, exts) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (!file.startsWith(".") && file !== "node_modules" && file !== "_originals") {
        results = results.concat(getFiles(fullPath, exts));
      }
    } else {
      if (exts.includes(extname(file).toLowerCase())) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

async function validate() {
  console.log("\n🔍 PALASSH DEEP INTEGRITY VALIDATION\n");
  console.log("═".repeat(70));

  let issuesFound = 0;

  // TEST 1: Check integrity of every image in public/images
  console.log("\n[TEST 1] Validating image files in public/images/ with Sharp...");
  const imageFiles = readdirSync(IMAGES_DIR).filter(
    (f) => !f.startsWith(".") && f !== "_originals"
  );

  for (const img of imageFiles) {
    const imgPath = join(IMAGES_DIR, img);
    try {
      const meta = await sharp(imgPath).metadata();
      const sz = statSync(imgPath).size;
      const szKb = (sz / 1024).toFixed(1);

      if (meta.width && meta.height && meta.format) {
        console.log(`  ✅ ${img.padEnd(25)} ${meta.format.toUpperCase()} ${meta.width}x${meta.height} (${szKb} KB)`);
      } else {
        console.error(`  ❌ ${img}: Incomplete metadata`);
        issuesFound++;
      }
    } catch (err) {
      console.error(`  ❌ ${img}: CORRUPTED or unreadable: ${err.message}`);
      issuesFound++;
    }
  }

  // TEST 2: Check all image references in code
  console.log("\n[TEST 2] Checking all image paths referenced in src/...");
  const codeFiles = getFiles(SRC_DIR, [".ts", ".tsx", ".js", ".jsx", ".css"]);
  const imagePathRegex = /["'`]((\/images\/[^"'`]+)|(\/[^"'`]+\.(webp|png|jpg|jpeg|ico|svg)))["'`]/g;

  const foundReferences = new Set();
  let missingReferences = 0;

  for (const file of codeFiles) {
    const content = readFileSync(file, "utf8");
    let match;
    while ((match = imagePathRegex.exec(content)) !== null) {
      const ref = match[1];
      foundReferences.add(ref);

      // Verify this file exists in public
      const localPath = join(PUBLIC_DIR, ref.startsWith("/") ? ref.slice(1) : ref);
      if (!existsSync(localPath)) {
        console.error(`  ❌ Missing file: "${ref}" referenced in ${file.replace(process.cwd(), "")}`);
        missingReferences++;
        issuesFound++;
      }
    }
  }

  if (missingReferences === 0) {
    console.log(`  ✅ All ${foundReferences.size} unique image references resolve to valid files on disk!`);
    for (const ref of foundReferences) {
      console.log(`     • ${ref}`);
    }
  }

  // TEST 3: Check for any remaining .jpg or .jpeg references in src/
  console.log("\n[TEST 3] Checking for any stale .jpg / .jpeg references in src/...");
  const jpgRegex = /["'`][^"'`]*\.(jpg|jpeg)["'`]/i;
  let staleCount = 0;
  for (const file of codeFiles) {
    const content = readFileSync(file, "utf8");
    if (jpgRegex.test(content)) {
      console.error(`  ⚠️ Stale jpg/jpeg reference in: ${file.replace(process.cwd(), "")}`);
      staleCount++;
      issuesFound++;
    }
  }
  if (staleCount === 0) {
    console.log("  ✅ Zero .jpg or .jpeg references found in src/!");
  }

  // TEST 4: Favicon check
  console.log("\n[TEST 4] Checking public/favicon.ico...");
  const favPath = join(PUBLIC_DIR, "favicon.ico");
  if (existsSync(favPath)) {
    const favSz = statSync(favPath).size;
    console.log(`  ✅ favicon.ico exists and size is ${(favSz / 1024).toFixed(2)} KB (${favSz} bytes)`);
  } else {
    console.error("  ❌ favicon.ico does not exist!");
    issuesFound++;
  }

  console.log("\n" + "═".repeat(70));
  if (issuesFound === 0) {
    console.log("🎉 ALL VALIDATION CHECKS PASSED PERFECTLY WITH 0 ISSUES!\n");
  } else {
    console.error(`🚨 VALIDATION FAILED WITH ${issuesFound} ISSUE(S)\n`);
    process.exit(1);
  }
}

validate().catch(console.error);

