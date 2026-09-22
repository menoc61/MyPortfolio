/**
 * Downloads any missing tech icons for the About stack into public/icons.
 * Sources: devicon (raw.githubusercontent) with a jsDelivr fallback, then
 * simple-icons via jsDelivr as a last resort. Run: node scripts/fetch-icons.mjs
 */
import { writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";

const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });

/** slug -> devicon folder/file candidates */
const DEVICON = {
    react: ["react/react-original"],
    nextjs: ["nextjs/nextjs-original"],
    typescript: ["typescript/typescript-original"],
    javascript: ["javascript/javascript-original"],
    reactnative: ["react/react-original"],
    expo: ["expo/expo-original"],
    flutter: ["flutter/flutter-original"],
    threejs: ["threejs/threejs-original"],
    scss: ["sass/sass-original"],
    vite: ["vitejs/vitejs-original"],
    nodejs: ["nodejs/nodejs-original"],
    express: ["express/express-original"],
    graphql: ["graphql/graphql-plain"],
    firebase: ["firebase/firebase-original"],
    postgresql: ["postgresql/postgresql-original"],
    mysql: ["mysql/mysql-original"],
    mongodb: ["mongodb/mongodb-original"],
    php: ["php/php-original"],
    googlecloud: ["googlecloud/googlecloud-original"],
    docker: ["docker/docker-original"],
    git: ["git/git-original"],
    python: ["python/python-original"],
    pandas: ["pandas/pandas-original"],
    numpy: ["numpy/numpy-original"],
    tensorflow: ["tensorflow/tensorflow-original"],
    gsap: ["gsap/gsap", "gsap/gsap-plain", "gsap/gsap-original-wordmark"],
    awsamplify: ["aws/aws-original-wordmark", "amazonwebservices/amazonwebservices-original"],
    dynamodb: ["amazonwebservices/amazonwebservices-plain-wordmark"],
};

/** simple-icons slugs for anything devicon does not ship (Power BI). */
const SIMPLE = { powerbi: "powerbi" };

const RAW = "https://raw.githubusercontent.com/devicons/devicon/master/icons/";
const JSD = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/";
const SIMPLE_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@11/icons/";

async function get(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    return r.text();
}

for (const [name, candidates] of Object.entries(DEVICON)) {
    const target = `${OUT}/${name}.svg`;
    if (existsSync(target)) continue;
    let ok = false;
    for (const candidate of candidates) {
        for (const base of [RAW, JSD]) {
            try {
                writeFileSync(target, await get(base + candidate + ".svg"));
                console.log("OK", name, "via", base.includes("jsdelivr") ? "jsdelivr" : "raw", candidate);
                ok = true;
                break;
            } catch {
                /* try next */
            }
        }
        if (ok) break;
    }
    if (!ok) console.log("FAIL", name);
}

for (const [name, slug] of Object.entries(SIMPLE)) {
    const target = `${OUT}/${name}.svg`;
    if (existsSync(target)) continue;
    try {
        writeFileSync(target, await get(SIMPLE_CDN + slug + ".svg"));
        console.log("OK", name, "(simple-icons)");
    } catch (error) {
        console.log("FAIL", name, String(error));
    }
}

console.log(readdirSync(OUT).length, "icons in", OUT);
