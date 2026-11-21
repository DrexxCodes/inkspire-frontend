import { test } from "node:test";
import assert from "node:assert/strict";
import { detectInstallEnv, installGuide } from "../lib/install";

const UA = {
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.153 Mobile/15E148 Safari/604.1",
  iphoneFirefox: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15",
  iphoneEdge: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/126.2592.87 Mobile/15E148 Safari/605.1.15",
  ipadAsMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  androidChrome: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  androidSamsung: "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  androidFirefox: "Mozilla/5.0 (Android 14; Mobile; rv:127.0) Gecko/127.0 Firefox/127.0",
  windowsChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  windowsEdge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  windowsFirefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
};

test("detects device and browser from the user agent", () => {
  assert.deepEqual(detectInstallEnv(UA.iphoneSafari), { os: "ios", browser: "safari" });
  assert.deepEqual(detectInstallEnv(UA.iphoneChrome), { os: "ios", browser: "chrome" });
  assert.deepEqual(detectInstallEnv(UA.iphoneFirefox), { os: "ios", browser: "firefox" });
  assert.deepEqual(detectInstallEnv(UA.iphoneEdge), { os: "ios", browser: "edge" });
  assert.deepEqual(detectInstallEnv(UA.androidChrome), { os: "android", browser: "chrome" });
  assert.deepEqual(detectInstallEnv(UA.androidSamsung), { os: "android", browser: "samsung" });
  assert.deepEqual(detectInstallEnv(UA.androidFirefox), { os: "android", browser: "firefox" });
  assert.deepEqual(detectInstallEnv(UA.windowsChrome), { os: "desktop", browser: "chrome" });
  assert.deepEqual(detectInstallEnv(UA.windowsEdge), { os: "desktop", browser: "edge" });
  assert.deepEqual(detectInstallEnv(UA.macSafari), { os: "desktop", browser: "safari" });
  assert.deepEqual(detectInstallEnv(UA.windowsFirefox), { os: "desktop", browser: "firefox" });
});

test("an iPad that reports itself as a Mac is recognised by its touch screen", () => {
  assert.equal(detectInstallEnv(UA.ipadAsMac, 5).os, "ios");
  assert.equal(detectInstallEnv(UA.ipadAsMac, 0).os, "desktop"); // a real Mac has no touch points
});

test("unknown browsers fall back to 'other' instead of throwing", () => {
  assert.deepEqual(detectInstallEnv(""), { os: "desktop", browser: "other" });
  assert.equal(detectInstallEnv("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148").browser, "other");
});

test("iOS steps go through Share and Add to Home Screen, and non Safari browsers get a Safari hint", () => {
  const safari = installGuide("ios", "safari");
  assert.equal(safari.steps.length, 3);
  assert.match(safari.steps[0]!.text, /Share/);
  assert.match(safari.steps[1]!.text, /Add to Home Screen/);
  assert.equal(safari.note, undefined);

  const chrome = installGuide("ios", "chrome");
  assert.match(chrome.note ?? "", /Safari/);
});

test("Android and desktop Chromium steps mention Install", () => {
  assert.match(installGuide("android", "chrome").steps[1]!.text, /Install app/);
  assert.match(installGuide("android", "firefox").steps[1]!.text, /Install/);
  assert.match(installGuide("desktop", "edge").steps[1]!.text, /Install Inkspire/);
});

test("desktop Safari uses Add to Dock and desktop Firefox is told it cannot install", () => {
  assert.match(installGuide("desktop", "safari").steps[0]!.text, /Add to Dock/);
  const firefox = installGuide("desktop", "firefox");
  assert.equal(firefox.steps.length, 0);
  assert.match(firefox.note ?? "", /Chrome, Edge or Safari/);
});

test("guides for a device the reader is not on use sensible default browsers", () => {
  assert.equal(installGuide("ios").note, undefined); // defaults to Safari
  assert.ok(installGuide("android").steps.length > 0);
  assert.ok(installGuide("desktop").steps.length > 0);
});
