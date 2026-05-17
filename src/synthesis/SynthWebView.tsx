import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { InterventionType } from '../stores/shieldStore';

export interface SynthWebViewRef {
  play: (type: InterventionType) => void;
  stop: () => void;
}

const SYNTH_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
let audioCtx = null;
let activeNodes = [];

function ensureCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function stopAll() {
  activeNodes.forEach(n => { try { n.stop(); n.disconnect(); } catch(e) {} });
  activeNodes = [];
}

function playBilateralEMDR() {
  ensureCtx();
  stopAll();
  const merger = audioCtx.createChannelMerger(2);
  merger.connect(audioCtx.destination);

  const osc = audioCtx.createOscillator();
  osc.frequency.value = 330;
  osc.type = 'sine';

  const gainL = audioCtx.createGain();
  const gainR = audioCtx.createGain();
  osc.connect(gainL);
  osc.connect(gainR);
  gainL.connect(merger, 0, 0);
  gainR.connect(merger, 0, 1);

  const panRate = 0.33;
  const masterGain = 0.3;
  const startTime = audioCtx.currentTime;

  function updatePan() {
    const t = audioCtx.currentTime - startTime;
    const pan = Math.sin(2 * Math.PI * panRate * t);
    gainL.gain.setTargetAtTime(masterGain * (0.5 + 0.5 * pan), audioCtx.currentTime, 0.01);
    gainR.gain.setTargetAtTime(masterGain * (0.5 - 0.5 * pan), audioCtx.currentTime, 0.01);
  }

  osc.start();
  activeNodes.push(osc);
  const interval = setInterval(updatePan, 50);
  activeNodes.push({ stop: () => clearInterval(interval), disconnect: () => {} });
}

function playBinauralBeats() {
  ensureCtx();
  stopAll();
  const merger = audioCtx.createChannelMerger(2);
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.25;
  merger.connect(masterGain);
  masterGain.connect(audioCtx.destination);

  const oscL = audioCtx.createOscillator();
  oscL.frequency.value = 250;
  oscL.type = 'sine';

  const oscR = audioCtx.createOscillator();
  oscR.frequency.value = 256;
  oscR.type = 'sine';

  oscL.connect(merger, 0, 0);
  oscR.connect(merger, 0, 1);

  oscL.start();
  oscR.start();
  activeNodes.push(oscL, oscR);
}

function playResonancePacing() {
  ensureCtx();
  stopAll();
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.25;
  masterGain.connect(audioCtx.destination);

  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 210;
  osc.connect(masterGain);
  osc.start();
  activeNodes.push(osc);

  const startTime = audioCtx.currentTime;
  function updateFreq() {
    const t = audioCtx.currentTime - startTime;
    const breathCycle = Math.sin(2 * Math.PI * 0.1 * t);
    const freq = 210 + 30 * breathCycle;
    osc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.02);
  }

  const interval = setInterval(updateFreq, 50);
  activeNodes.push({ stop: () => clearInterval(interval), disconnect: () => {} });
}

window.addEventListener('message', function(e) {
  try {
    const msg = JSON.parse(e.data);
    if (msg.action === 'play') {
      if (msg.type === 'bilateralEMDR') playBilateralEMDR();
      else if (msg.type === 'binauralBeats') playBinauralBeats();
      else if (msg.type === 'resonancePacing') playResonancePacing();
    } else if (msg.action === 'stop') {
      stopAll();
    }
  } catch(err) {}
});
</script>
</body>
</html>`;

const SynthWebView = forwardRef<SynthWebViewRef>((_, ref) => {
  const webViewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    play(type: InterventionType) {
      webViewRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ action: 'play', type: '${type}' }) }));`
      );
    },
    stop() {
      webViewRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ action: 'stop' }) }));`
      );
    },
  }));

  return (
    <WebView
      ref={webViewRef}
      source={{ html: SYNTH_HTML }}
      style={styles.hidden}
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      javaScriptEnabled
    />
  );
});

SynthWebView.displayName = 'SynthWebView';

export default SynthWebView;

const styles = StyleSheet.create({
  hidden: { width: 0, height: 0, opacity: 0 },
});
