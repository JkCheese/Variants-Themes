// ==UserScript==
// @name         Chess.com Variants - Multi Player Full HSL Sync (Final Fix)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Sets hue, saturation, brightness CSS vars from color pickers
// @include      https://www.chess.com/variants*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const NUM_PLAYERS = 4;
  const POLL_INTERVAL = 500;
  const root = document.documentElement;
  const lastHex = {};

  function hexToHSL(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    const d = max - min;

    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }

    return {
      h: Math.round(h), // degrees
      s: (s).toFixed(3), // 0.000–1.000
      l: (l).toFixed(3) // 0.000–1.000
    };
  }

  function updateCSSVars(player, hex) {
  const hsl = hexToHSL(hex);

  // Add 0.5 to the saturation value and limit it to between 0 and 2 (for safety)
  let adjustedSat = parseFloat(hsl.s) + 0.5;
  if (adjustedSat > 1) adjustedSat = 1; // limit the saturation to a reasonable range
  if (adjustedSat < 0) adjustedSat = 0; // avoid negative saturation

  let adjustedBrit = parseFloat(hsl.l) + 0.5;
  if (adjustedBrit > 1) adjustedBrit = 1; // limit the saturation to a reasonable range
  if (adjustedBrit < 0) adjustedBrit = 0; // avoid negative saturation

  // Apply the adjustments to the CSS variables
  root.style.setProperty(`--player${player}-hue`, `${hsl.h}deg`);
  root.style.setProperty(`--player${player}-sat`, adjustedSat);
  root.style.setProperty(`--player${player}-brit`, adjustedBrit); // Keep brightness unchanged for now
}

  function storageKey(player) {
    return `player${player}ColorHex`;
  }

  // Load saved values from localStorage
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const stored = localStorage.getItem(storageKey(i));
    if (stored) {
      lastHex[i] = stored;
      updateCSSVars(i, stored);
    }
  }

  // Poll every half second for color picker changes
  setInterval(() => {
    for (let i = 0; i < NUM_PLAYERS; i++) {
      const input = document.getElementById(`color-color${i}`);
      if (!input) continue;

      if (input.value !== lastHex[i]) {
        lastHex[i] = input.value;
        localStorage.setItem(storageKey(i), input.value);
        updateCSSVars(i, input.value);
      }
    }
  }, POLL_INTERVAL);
})();
