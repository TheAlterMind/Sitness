/*! apply.js - the app's half of /iterate. No panel, no UI: it polls the JSON file that the
 * iterate-bar mod (the tweak bar in Claude's UI) writes, and applies it to the page.
 *
 *   import './apply'        // dev builds only; it polls <origin>/__tweaks.json
 *
 * The file looks like { vars: {"--tw-radius": "20px"}, attrs: {"data-tw-pill": ""}, fx: {...}, replay: 3 }.
 * Variables and attributes go on <html>; tweakbar.css turns them into effects. `fx` drives the
 * behaviours CSS cannot (slow-mo, pause, FPS meter, ripple, sounds, tilt, rainbow, confetti).
 * Call window.Tweakbar.celebrate() where something completes to use the confetti toggle.
 */
(function () {
  'use strict'
  var root = document.documentElement
  var URL = (window.TWEAKS_URL || '/__tweaks.json')
  var applied = { vars: {}, attrs: {} }, fx = {}, lastReplay = null, lastText = null

  function setAll(map, set, remove, prev) {
    Object.keys(prev).forEach(function (k) { if (!(k in map)) remove(k) })
    Object.keys(map).forEach(function (k) { set(k, map[k]) })
  }

  function apply(p) {
    setAll(p.vars || {}, function (k, v) { root.style.setProperty(k, v) }, function (k) { root.style.removeProperty(k) }, applied.vars)
    setAll(p.attrs || {}, function (k, v) { root.setAttribute(k, v) }, function (k) { root.removeAttribute(k) }, applied.attrs)
    applied = { vars: p.vars || {}, attrs: p.attrs || {} }
    fx = p.fx || {}
    rate(); fps(!!fx.fps)
    if (lastReplay !== null && p.replay !== lastReplay) replay()
    lastReplay = p.replay
  }

  function replay() {
    document.querySelectorAll('.tw-enter').forEach(function (e, i) {
      e.style.setProperty('--i', i); e.classList.remove('tw-enter'); void e.offsetWidth; e.classList.add('tw-enter')
    })
  }

  // Slow-motion and pause for every running CSS / Web animation.
  var rateTimer = null
  function rate() {
    clearInterval(rateTimer)
    var r = fx.rate || 1, paused = !!fx.pause
    var go = function () {
      if (!document.getAnimations) return
      document.getAnimations().forEach(function (a) {
        try { a.updatePlaybackRate(r); if (paused) { a.pause(); a.__tw = true } else if (a.__tw) { a.play(); a.__tw = false } } catch (e) { /* finished */ }
      })
    }
    go()
    if (r !== 1 || paused) rateTimer = setInterval(go, 200)
  }

  var fpsEl = null, fpsRaf = 0
  function fps(on) {
    if (!on) { if (fpsEl) { fpsEl.remove(); fpsEl = null; cancelAnimationFrame(fpsRaf) } return }
    if (fpsEl) return
    fpsEl = document.createElement('div'); fpsEl.className = 'tw-fps'; document.body.appendChild(fpsEl)
    var n = 0, t0 = performance.now()
    ;(function tick(t) { n++; if (t - t0 > 500) { fpsEl.textContent = Math.round(n * 1000 / (t - t0)) + ' fps'; n = 0; t0 = t } fpsRaf = requestAnimationFrame(tick) })(t0)
  }

  // Colour-blindness simulation filters, referenced from tweakbar.css as url(#tw-<name>).
  function defs() {
    var M = { protanopia: '.567 .433 0 0 0 .558 .442 0 0 0 0 .242 .758 0 0 0 0 0 1 0', deuteranopia: '.625 .375 0 0 0 .7 .3 0 0 0 0 .3 .7 0 0 0 0 0 1 0', tritanopia: '.95 .05 0 0 0 0 .433 .567 0 0 0 .475 .525 0 0 0 0 0 1 0', achromatopsia: '.299 .587 .114 0 0 .299 .587 .114 0 0 .299 .587 .114 0 0 0 0 0 1 0' }
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.style.position = 'absolute'
    Object.keys(M).forEach(function (k) {
      var f = document.createElementNS(ns, 'filter'); f.id = 'tw-' + k
      var m = document.createElementNS(ns, 'feColorMatrix'); m.setAttribute('type', 'matrix'); m.setAttribute('values', M[k])
      f.appendChild(m); svg.appendChild(f)
    })
    document.body.appendChild(svg)
  }

  function extras() {
    document.addEventListener('pointerdown', function (e) {
      if (fx.ripple) { var d = document.createElement('span'); d.className = 'tw-ripple'; d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; document.body.appendChild(d); setTimeout(function () { d.remove() }, 600) }
      if (fx.sound) { try { var a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 520 + Math.random() * 200; g.gain.value = 0.04; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.05) } catch (x) { /* no audio */ } }
    }, true)
    document.addEventListener('pointermove', function (e) {
      if (!fx.tilt) return
      var el = e.target.closest && e.target.closest('.card'); if (!el) return
      var b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5
      el.style.transform = 'perspective(600px) rotateY(' + x * 8 + 'deg) rotateX(' + -y * 8 + 'deg)'
      el.addEventListener('pointerleave', function () { el.style.transform = '' }, { once: true })
    })
    var h = 0, base = null
    setInterval(function () {
      if (fx.rainbow) { h = (h + 2) % 360; if (base === null) base = root.style.getPropertyValue('--tw-hue'); root.style.setProperty('--tw-hue', (h - 180) + 'deg') }
      else if (base !== null) { base ? root.style.setProperty('--tw-hue', base) : root.style.removeProperty('--tw-hue'); base = null }
    }, 60)
  }

  function poll() {
    fetch(URL + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : null }).then(function (t) {
      if (t && t !== lastText) { lastText = t; try { apply(JSON.parse(t)) } catch (e) { /* file mid-write */ } }
    }).catch(function () { /* server not reachable */ })
  }

  window.Tweakbar = {
    // Call from the app when something is completed; does nothing unless the confetti toggle is on.
    celebrate: function () {
      if (!fx.confetti) return
      for (var i = 0; i < 40; i++) {
        var p = document.createElement('span'); p.className = 'tw-confetti'; p.style.background = 'hsl(' + Math.random() * 360 + ' 90% 60%)'; p.style.left = 50 + (Math.random() - 0.5) * 30 + 'vw'; document.body.appendChild(p)
        var a = p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + (Math.random() - 0.5) * 400 + 'px,' + (Math.random() * 500 + 150) + 'px) rotate(' + Math.random() * 720 + 'deg)', opacity: 0 }], { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.4,1)' })
        a.onfinish = (function (el) { return function () { el.remove() } })(p)
      }
    },
    replay: replay,
  }

  function start() { defs(); extras(); poll(); setInterval(poll, 400) }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start)
})()
