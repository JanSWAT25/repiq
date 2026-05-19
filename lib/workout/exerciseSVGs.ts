// lib/workout/exerciseSVGs.ts
// High-quality animated SVG illustrations for each exercise
// Human silhouettes with smooth animations

export const EXERCISE_SVGS: Record<string, string> = {

push_standard: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes pushup {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(22px); }
  }
  @keyframes armBend {
    0%,100% { d: path("M 80 95 L 55 105"); }
    50% { d: path("M 80 95 L 60 120"); }
  }
  .body { animation: pushup 2s ease-in-out infinite; }
  @keyframes fade { 0%,100%{opacity:.15} 50%{opacity:.3} }
  .shadow { animation: fade 2s ease-in-out infinite; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<!-- Floor -->
<rect x="0" y="158" width="320" height="2" fill="#1e1e1e" rx="1"/>
<!-- Shadow -->
<ellipse cx="160" cy="160" rx="70" ry="6" fill="#ef4444" class="shadow"/>
<!-- Body group animates up/down -->
<g class="body">
  <!-- Feet -->
  <ellipse cx="210" cy="156" rx="12" ry="5" fill="#c0392b"/>
  <ellipse cx="185" cy="156" rx="10" ry="4" fill="#c0392b"/>
  <!-- Legs -->
  <rect x="183" y="128" width="14" height="30" rx="7" fill="#e74c3c"/>
  <rect x="204" y="128" width="13" height="30" rx="6" fill="#c0392b"/>
  <!-- Torso -->
  <rect x="120" y="90" width="85" height="42" rx="10" fill="#e74c3c"/>
  <!-- Head -->
  <circle cx="220" cy="82" r="18" fill="#e74c3c"/>
  <!-- Hair detail -->
  <ellipse cx="220" cy="68" rx="14" ry="8" fill="#c0392b"/>
  <!-- Right arm (straight) -->
  <rect x="195" y="120" width="12" height="32" rx="6" fill="#c0392b" transform="rotate(-5 201 120)"/>
  <!-- Left arm (bent) -->
  <rect x="110" y="115" width="12" height="28" rx="6" fill="#c0392b" transform="rotate(8 116 115)"/>
  <!-- Hands -->
  <ellipse cx="205" cy="152" rx="8" ry="5" fill="#a93226"/>
  <ellipse cx="115" cy="143" rx="8" ry="5" fill="#a93226"/>
</g>
<!-- Label -->
<text x="160" y="185" text-anchor="middle" fill="#444" font-size="11" font-family="system-ui,sans-serif" letter-spacing="1">PUSH-UP</text>
</svg>`,

squat_bodyweight: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes squat {
    0%,100% { transform: translateY(0) scaleY(1); transform-origin: bottom center; }
    50% { transform: translateY(28px) scaleY(0.78); transform-origin: bottom center; }
  }
  @keyframes armSwing {
    0%,100% { transform: rotate(0deg); transform-origin: 160px 80px; }
    50% { transform: rotate(25deg); transform-origin: 160px 80px; }
  }
  .body { animation: squat 2.2s ease-in-out infinite; }
  .arms { animation: armSwing 2.2s ease-in-out infinite; }
  @keyframes fade { 0%,100%{rx:40} 50%{rx:55} }
  .shadow { animation: fade 2.2s ease-in-out infinite; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<rect x="0" y="163" width="320" height="2" fill="#1e1e1e" rx="1"/>
<ellipse cx="160" cy="166" rx="40" ry="5" fill="#ef4444" opacity="0.2"/>
<g class="body">
  <!-- Feet -->
  <ellipse cx="140" cy="162" rx="14" ry="5" fill="#c0392b"/>
  <ellipse cx="180" cy="162" rx="14" ry="5" fill="#c0392b"/>
  <!-- Lower legs -->
  <rect x="132" y="130" width="16" height="34" rx="8" fill="#e74c3c"/>
  <rect x="172" y="130" width="16" height="34" rx="8" fill="#c0392b"/>
  <!-- Upper legs -->
  <rect x="130" y="100" width="18" height="34" rx="8" fill="#c0392b" transform="rotate(-10 139 100)"/>
  <rect x="172" y="100" width="18" height="34" rx="8" fill="#e74c3c" transform="rotate(10 181 100)"/>
  <!-- Torso -->
  <rect x="138" y="65" width="44" height="48" rx="12" fill="#e74c3c"/>
  <!-- Head -->
  <circle cx="160" cy="52" r="20" fill="#e74c3c"/>
  <ellipse cx="160" cy="37" rx="15" ry="9" fill="#c0392b"/>
</g>
<!-- Arms animated separately -->
<g class="arms">
  <rect x="98" y="78" width="12" height="40" rx="6" fill="#c0392b" transform="rotate(-30 104 78)"/>
  <rect x="210" y="78" width="12" height="40" rx="6" fill="#c0392b" transform="rotate(30 216 78)"/>
</g>
<text x="160" y="185" text-anchor="middle" fill="#444" font-size="11" font-family="system-ui,sans-serif" letter-spacing="1">SQUAT</text>
</svg>`,

pull_strict: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes pullup {
    0%,100% { transform: translateY(25px); }
    45%,55% { transform: translateY(0px); }
  }
  .body { animation: pullup 2.5s ease-in-out infinite; }
  @keyframes armChange {
    0%,100% { transform: rotate(10deg); transform-origin: 160px 30px; }
    45%,55% { transform: rotate(-5deg); transform-origin: 160px 30px; }
  }
  .arms { animation: armChange 2.5s ease-in-out infinite; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<!-- Pull-up bar -->
<rect x="60" y="22" width="200" height="10" rx="5" fill="#333"/>
<rect x="55" y="10" width="10" height="25" rx="3" fill="#2a2a2a"/>
<rect x="255" y="10" width="10" height="25" rx="3" fill="#2a2a2a"/>
<!-- Bolts -->
<circle cx="65" cy="18" r="3" fill="#444"/>
<circle cx="255" cy="18" r="3" fill="#444"/>
<g class="body">
  <!-- Legs hanging -->
  <rect x="148" y="115" width="15" height="45" rx="7" fill="#c0392b"/>
  <rect x="157" y="115" width="15" height="45" rx="7" fill="#e74c3c"/>
  <!-- Feet cross -->
  <ellipse cx="155" cy="162" rx="12" ry="6" fill="#c0392b"/>
  <ellipse cx="170" cy="165" rx="11" ry="5" fill="#a93226"/>
  <!-- Torso -->
  <rect x="140" y="65" width="40" height="55" rx="12" fill="#e74c3c"/>
  <!-- Head -->
  <circle cx="160" cy="52" r="19" fill="#e74c3c"/>
  <ellipse cx="160" cy="38" rx="14" ry="8" fill="#c0392b"/>
</g>
<g class="arms">
  <!-- Left arm to bar -->
  <rect x="118" y="28" width="12" height="42" rx="6" fill="#c0392b" transform="rotate(15 124 28)"/>
  <!-- Right arm to bar -->
  <rect x="188" y="28" width="12" height="42" rx="6" fill="#c0392b" transform="rotate(-15 194 28)"/>
  <!-- Hands on bar -->
  <ellipse cx="128" cy="30" rx="9" ry="6" fill="#a93226"/>
  <ellipse cx="192" cy="30" rx="9" ry="6" fill="#a93226"/>
</g>
<text x="160" y="192" text-anchor="middle" fill="#444" font-size="11" font-family="system-ui,sans-serif" letter-spacing="1">PULL-UP</text>
</svg>`,

hinge_glute_bridge: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes bridge {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-22px); }
  }
  @keyframes legAngle {
    0%,100% { transform: rotate(0deg) translateY(0); transform-origin: 200px 150px; }
    50% { transform: rotate(-15deg) translateY(-5px); transform-origin: 200px 150px; }
  }
  .hips { animation: bridge 2s ease-in-out infinite; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<!-- Floor mat -->
<rect x="20" y="158" width="280" height="8" rx="4" fill="#1a1a1a"/>
<!-- Head on floor -->
<circle cx="68" cy="148" r="18" fill="#e74c3c"/>
<ellipse cx="68" cy="135" rx="14" ry="8" fill="#c0392b"/>
<!-- Upper body on floor -->
<rect x="82" y="138" width="80" height="22" rx="10" fill="#e74c3c"/>
<!-- Arms on floor -->
<rect x="75" y="145" width="10" height="30" rx="5" fill="#c0392b" transform="rotate(20 80 145)"/>
<rect x="158" y="145" width="10" height="30" rx="5" fill="#c0392b" transform="rotate(-20 163 145)"/>
<!-- Animated hips up -->
<g class="hips">
  <!-- Hips/glutes -->
  <ellipse cx="182" cy="140" rx="26" ry="18" fill="#e74c3c"/>
  <!-- Upper legs -->
  <rect x="165" y="130" width="16" height="40" rx="8" fill="#c0392b" transform="rotate(-55 173 130)"/>
  <rect x="188" y="130" width="16" height="40" rx="8" fill="#e74c3c" transform="rotate(-50 196 130)"/>
</g>
<!-- Lower legs (static, feet on floor) -->
<rect x="195" y="118" width="15" height="42" rx="7" fill="#c0392b" transform="rotate(75 202 118)"/>
<rect x="218" y="118" width="15" height="42" rx="7" fill="#e74c3c" transform="rotate(72 225 118)"/>
<!-- Feet -->
<ellipse cx="218" cy="158" rx="14" ry="5" fill="#a93226"/>
<ellipse cx="238" cy="158" rx="13" ry="5" fill="#a93226"/>
<text x="160" y="185" text-anchor="middle" fill="#444" font-size="11" font-family="system-ui,sans-serif" letter-spacing="1">GLUTE BRIDGE</text>
</svg>`,

core_plank: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes plankPulse {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  @keyframes glow {
    0%,100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }
  .body { animation: plankPulse 3s ease-in-out infinite; }
  .highlight { animation: glow 3s ease-in-out infinite; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<rect x="0" y="158" width="320" height="2" fill="#1e1e1e" rx="1"/>
<!-- Core highlight -->
<rect x="130" y="108" width="70" height="18" rx="9" fill="#ef4444" class="highlight"/>
<g class="body">
  <!-- Feet/toes -->
  <ellipse cx="68" cy="155" rx="10" ry="5" fill="#a93226"/>
  <ellipse cx="85" cy="155" rx="10" ry="5" fill="#a93226"/>
  <!-- Lower legs -->
  <rect x="62" y="125" width="14" height="32" rx="7" fill="#e74c3c"/>
  <rect x="78" y="125" width="13" height="32" rx="6" fill="#c0392b"/>
  <!-- Thighs -->
  <rect x="88" y="115" width="55" height="20" rx="9" fill="#c0392b"/>
  <!-- Torso - perfectly straight line -->
  <rect x="118" y="105" width="90" height="22" rx="10" fill="#e74c3c"/>
  <!-- Head -->
  <circle cx="228" cy="108" r="17" fill="#e74c3c"/>
  <ellipse cx="228" cy="95" rx="13" ry="7" fill="#c0392b"/>
  <!-- Forearms on floor -->
  <rect x="196" y="122" width="12" height="35" rx="6" fill="#c0392b" transform="rotate(80 202 122)"/>
  <rect x="218" y="122" width="12" height="35" rx="6" fill="#e74c3c" transform="rotate(80 224 122)"/>
  <!-- Elbows -->
  <ellipse cx="232" cy="143" rx="8" ry="5" fill="#a93226"/>
  <ellipse cx="248" cy="143" rx="8" ry="5" fill="#a93226"/>
</g>
<!-- Straight line indicator -->
<line x1="65" y1="95" x2="245" y2="95" stroke="#ef4444" stroke-width="1" stroke-dasharray="4,6" opacity="0.3"/>
<text x="160" y="183" text-anchor="middle" fill="#444" font-size="11" font-family="system-ui,sans-serif" letter-spacing="1">PLANK HOLD</text>
</svg>`,

dip_parallel: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes dip {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(28px); }
  }
  .body { animation: dip 2s ease-in-out infinite; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<!-- Dip bars -->
<rect x="95" y="55" width="8" height="90" rx="4" fill="#2a2a2a"/>
<rect x="215" y="55" width="8" height="90" rx="4" fill="#2a2a2a"/>
<rect x="88" y="52" width="22" height="10" rx="5" fill="#333"/>
<rect x="208" y="52" width="22" height="10" rx="5" fill="#333"/>
<!-- Base feet -->
<rect x="88" y="140" width="22" height="8" rx="4" fill="#222"/>
<rect x="208" y="140" width="22" height="8" rx="4" fill="#222"/>
<g class="body">
  <!-- Legs hanging -->
  <rect x="148" y="105" width="14" height="50" rx="7" fill="#c0392b"/>
  <rect x="160" y="105" width="14" height="50" rx="7" fill="#e74c3c"/>
  <!-- Crossed feet -->
  <ellipse cx="155" cy="158" rx="12" ry="6" fill="#a93226"/>
  <ellipse cx="170" cy="162" rx="11" ry="5" fill="#a93226"/>
  <!-- Torso -->
  <rect x="138" y="62" width="44" height="50" rx="12" fill="#e74c3c"/>
  <!-- Head -->
  <circle cx="160" cy="50" r="18" fill="#e74c3c"/>
  <ellipse cx="160" cy="37" rx="14" ry="8" fill="#c0392b"/>
  <!-- Arms on bars -->
  <rect x="96" y="60" width="12" height="42" rx="6" fill="#c0392b"/>
  <rect x="210" y="60" width="12" height="42" rx="6" fill="#c0392b"/>
  <!-- Hands gripping bars -->
  <ellipse cx="102" cy="62" rx="10" ry="6" fill="#a93226"/>
  <ellipse cx="216" cy="62" rx="10" ry="6" fill="#a93226"/>
</g>
<text x="160" y="185" text-anchor="middle" fill="#444" font-size="11" font-family="system-ui,sans-serif" letter-spacing="1">DIP</text>
</svg>`,

row_australian: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes row {
    0%,100% { transform: translateY(8px) rotate(2deg); transform-origin: 240px 120px; }
    50% { transform: translateY(0px) rotate(0deg); transform-origin: 240px 120px; }
  }
  .body { animation: row 2s ease-in-out infinite; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<!-- Bar suspended -->
<rect x="50" y="68" width="220" height="10" rx="5" fill="#333"/>
<rect x="48" y="30" width="10" height="50" rx="3" fill="#2a2a2a"/>
<rect x="262" y="30" width="10" height="50" rx="3" fill="#2a2a2a"/>
<!-- Floor -->
<rect x="0" y="168" width="320" height="4" fill="#1e1e1e" rx="2"/>
<g class="body">
  <!-- Feet on floor -->
  <ellipse cx="68" cy="168" rx="14" ry="5" fill="#a93226"/>
  <ellipse cx="90" cy="168" rx="14" ry="5" fill="#a93226"/>
  <!-- Legs straight -->
  <rect x="60" y="130" width="16" height="40" rx="8" fill="#e74c3c"/>
  <rect x="82" y="130" width="16" height="40" rx="8" fill="#c0392b"/>
  <!-- Body - near horizontal -->
  <rect x="95" y="105" width="100" height="28" rx="12" fill="#e74c3c" transform="rotate(-8 145 105)"/>
  <!-- Head -->
  <circle cx="215" cy="88" r="18" fill="#e74c3c"/>
  <ellipse cx="215" cy="75" rx="14" ry="8" fill="#c0392b"/>
  <!-- Arms reaching up to bar -->
  <rect x="188" y="68" width="12" height="30" rx="6" fill="#c0392b" transform="rotate(10 194 68)"/>
  <rect x="210" y="68" width="12" height="28" rx="6" fill="#e74c3c" transform="rotate(-5 216 68)"/>
  <!-- Hands on bar -->
  <ellipse cx="196" cy="70" rx="9" ry="5" fill="#a93226"/>
  <ellipse cx="218" cy="70" rx="9" ry="5" fill="#a93226"/>
</g>
<text x="160" y="188" text-anchor="middle" fill="#444" font-size="11" font-family="system-ui,sans-serif" letter-spacing="1">AUSTRALIAN ROW</text>
</svg>`,

cond_burpee: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes burpee {
    0% { transform: translateY(0) scaleY(1); transform-origin: bottom; }        /* standing */
    20% { transform: translateY(35px) scaleY(0.6); transform-origin: bottom; }  /* squat */
    40% { transform: translateY(45px) scaleY(0.4) rotate(90deg); transform-origin: bottom; } /* plank */
    60% { transform: translateY(45px) scaleY(0.4) rotate(90deg); transform-origin: bottom; } /* pushup */
    80% { transform: translateY(35px) scaleY(0.6); transform-origin: bottom; }  /* squat up */
    100% { transform: translateY(-20px) scaleY(1); transform-origin: bottom; }  /* jump */
  }
  .body { animation: burpee 3s ease-in-out infinite; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<rect x="0" y="165" width="320" height="2" fill="#1e1e1e"/>
<g class="body" transform="translate(160, 20)">
  <circle cx="0" cy="18" r="18" fill="#e74c3c"/>
  <ellipse cx="0" cy="5" rx="14" ry="8" fill="#c0392b"/>
  <rect x="-20" y="34" width="40" height="45" rx="12" fill="#e74c3c"/>
  <rect x="-22" y="50" width="12" height="35" rx="6" fill="#c0392b" transform="rotate(-20 -16 50)"/>
  <rect x="10" y="50" width="12" height="35" rx="6" fill="#c0392b" transform="rotate(20 16 50)"/>
  <rect x="-18" y="77" width="15" height="38" rx="7" fill="#c0392b"/>
  <rect x="3" y="77" width="15" height="38" rx="7" fill="#e74c3c"/>
  <ellipse cx="-10" cy="118" rx="12" ry="5" fill="#a93226"/>
  <ellipse cx="11" cy="118" rx="12" ry="5" fill="#a93226"/>
</g>
<!-- Jump arrows -->
<text x="160" y="188" text-anchor="middle" fill="#444" font-size="11" font-family="system-ui,sans-serif" letter-spacing="1">BURPEE</text>
</svg>`,

squat_bulgarian: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes bsquat {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(25px); }
  }
  .body { animation: bsquat 2.2s ease-in-out infinite; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<!-- Bench -->
<rect x="30" y="130" width="90" height="12" rx="6" fill="#222"/>
<rect x="35" y="142" width="12" height="25" rx="3" fill="#1a1a1a"/>
<rect x="103" y="142" width="12" height="25" rx="3" fill="#1a1a1a"/>
<!-- Floor -->
<rect x="0" y="167" width="320" height="2" fill="#1e1e1e"/>
<g class="body">
  <!-- Rear foot on bench -->
  <ellipse cx="88" cy="130" rx="14" ry="5" fill="#a93226"/>
  <rect x="78" y="100" width="14" height="32" rx="7" fill="#e74c3c" transform="rotate(-15 85 100)"/>
  <!-- Front foot on floor -->
  <ellipse cx="185" cy="167" rx="16" ry="5" fill="#a93226"/>
  <!-- Front leg -->
  <rect x="172" y="128" width="16" height="42" rx="8" fill="#c0392b"/>
  <!-- Upper front leg -->
  <rect x="158" y="100" width="18" height="35" rx="9" fill="#e74c3c" transform="rotate(-8 167 100)"/>
  <!-- Torso -->
  <rect x="145" y="55" width="42" height="52" rx="12" fill="#e74c3c"/>
  <!-- Head -->
  <circle cx="166" cy="43" r="19" fill="#e74c3c"/>
  <ellipse cx="166" cy="29" rx="14" ry="8" fill="#c0392b"/>
  <!-- Arms for balance -->
  <rect x="112" y="72" width="12" height="38" rx="6" fill="#c0392b" transform="rotate(-25 118 72)"/>
  <rect x="188" y="72" width="12" height="38" rx="6" fill="#c0392b" transform="rotate(25 194 72)"/>
</g>
<text x="160" y="186" text-anchor="middle" fill="#444" font-size="10" font-family="system-ui,sans-serif" letter-spacing="1">BULGARIAN SPLIT SQUAT</text>
</svg>`,

cond_mountain_climber: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes leftKnee {
    0%,100% { transform: translateX(0) translateY(0); }
    25%,75% { transform: translateX(35px) translateY(-20px); }
  }
  @keyframes rightKnee {
    0%,50%,100% { transform: translateX(0) translateY(0); }
    25%,75% { transform: translateX(-35px) translateY(-20px); }
  }
  .leftLeg { animation: leftKnee 1.2s ease-in-out infinite; }
  .rightLeg { animation: rightKnee 1.2s ease-in-out infinite; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<rect x="0" y="158" width="320" height="2" fill="#1e1e1e"/>
<!-- Static upper body in plank -->
<!-- Forearms -->
<rect x="215" y="120" width="12" height="38" rx="6" fill="#c0392b" transform="rotate(82 221 120)"/>
<rect x="238" y="120" width="12" height="38" rx="6" fill="#e74c3c" transform="rotate(82 244 120)"/>
<ellipse cx="250" cy="152" rx="10" ry="5" fill="#a93226"/>
<ellipse cx="270" cy="152" rx="10" ry="5" fill="#a93226"/>
<!-- Torso -->
<rect x="130" y="92" width="100" height="22" rx="10" fill="#e74c3c"/>
<!-- Head -->
<circle cx="248" cy="88" r="17" fill="#e74c3c"/>
<ellipse cx="248" cy="75" rx="13" ry="7" fill="#c0392b"/>
<!-- Left leg -->
<g class="leftLeg">
  <rect x="108" y="105" width="14" height="40" rx="7" fill="#c0392b"/>
  <ellipse cx="115" cy="148" rx="11" ry="5" fill="#a93226"/>
</g>
<!-- Right leg -->
<g class="rightLeg">
  <rect x="130" y="105" width="14" height="40" rx="7" fill="#e74c3c"/>
  <ellipse cx="137" cy="148" rx="11" ry="5" fill="#a93226"/>
</g>
<text x="160" y="180" text-anchor="middle" fill="#444" font-size="10" font-family="system-ui,sans-serif" letter-spacing="1">MOUNTAIN CLIMBER</text>
</svg>`,

};

// Default fallback for exercises without specific SVGs
export function getExerciseSVG(exerciseId: string): string {
  return EXERCISE_SVGS[exerciseId] ?? getDefaultSVG(exerciseId);
}

function getDefaultSVG(exerciseId: string): string {
  const name = exerciseId.replace(/_/g, ' ').toUpperCase();
  const cat = exerciseId.split('_')[0];

  const anim = cat === 'push' || cat === 'dip' ? 'pushup' :
               cat === 'squat' || cat === 'hinge' ? 'squat' :
               cat === 'pull' || cat === 'row' ? 'pullup' : 'pulse';

  return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
<style>
  @keyframes pushup { 0%,100%{transform:translateY(0)} 50%{transform:translateY(22px)} }
  @keyframes squat { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.72) translateY(20px)} }
  @keyframes pullup { 0%,100%{transform:translateY(22px)} 50%{transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
  .body { animation: ${anim} 2s ease-in-out infinite; transform-origin: bottom center; }
</style>
<rect width="320" height="200" fill="#0f0f0f"/>
<rect x="0" y="165" width="320" height="2" fill="#1e1e1e"/>
<g class="body" transform="translate(160,30)">
  <circle cx="0" cy="18" r="18" fill="#e74c3c"/>
  <ellipse cx="0" cy="5" rx="13" ry="7" fill="#c0392b"/>
  <rect x="-18" y="34" width="36" height="45" rx="11" fill="#e74c3c"/>
  <rect x="-20" y="50" width="11" height="33" rx="5" fill="#c0392b" transform="rotate(-18 -14 50)"/>
  <rect x="9" y="50" width="11" height="33" rx="5" fill="#c0392b" transform="rotate(18 15 50)"/>
  <rect x="-16" y="77" width="14" height="35" rx="7" fill="#c0392b"/>
  <rect x="2" y="77" width="14" height="35" rx="7" fill="#e74c3c"/>
  <ellipse cx="-9" cy="114" rx="11" ry="5" fill="#a93226"/>
  <ellipse cx="9" cy="114" rx="11" ry="5" fill="#a93226"/>
</g>
<text x="160" y="188" text-anchor="middle" fill="#444" font-size="10" font-family="system-ui,sans-serif" letter-spacing="1">${name}</text>
</svg>`;
}
