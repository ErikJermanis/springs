const el = document.getElementById("card");

// --- Spring parameters (tweak these) ---
const k = 700; // stiffness (N/m-ish)
const c = 27; // damping
const m = 1; // mass

// State
let x = 0,
  y = 0; // current position
let vx = 0,
  vy = 0; // current velocity
let targetX = 0,
  targetY = 0;

// Drag state
let dragging = false;
let startPX = 0,
  startPY = 0;
let startX = 0,
  startY = 0;

// For better "release velocity" feel
let lastT = 0,
  lastX = 0,
  lastY = 0;

function setTransform() {
  el.style.transform = `translate(${x}px, ${y}px)`;
}

el.addEventListener("pointerdown", (e) => {
  dragging = true;
  el.setPointerCapture(e.pointerId);

  startPX = e.clientX;
  startPY = e.clientY;
  startX = x;
  startY = y;

  // Stop spring while dragging
  vx = 0;
  vy = 0;

  lastT = performance.now();
  lastX = x;
  lastY = y;
});

el.addEventListener("pointermove", (e) => {
  if (!dragging) return;

  const dx = e.clientX - startPX;
  const dy = e.clientY - startPY;

  x = startX + dx;
  y = startY + dy;
  setTransform();

  // estimate velocity during drag (for release)
  const now = performance.now();
  const dt = Math.max(1, now - lastT) / 1000;
  vx = (x - lastX) / dt;
  vy = (y - lastY) / dt;
  lastT = now;
  lastX = x;
  lastY = y;
});

el.addEventListener("pointerup", () => {
  if (!dragging) return;
  dragging = false;

  // Snap target back to origin (rest position)
  targetX = 0;
  targetY = 0;
});

el.addEventListener("pointercancel", () => {
  dragging = false;
  targetX = 0;
  targetY = 0;
});

// --- Spring simulation loop ---
let prevTime = performance.now();

function animate(now) {
  const dt = Math.min(0.033, (now - prevTime) / 1000); // clamp dt to avoid huge jumps
  prevTime = now;

  if (!dragging) {
    // Forces toward target: F = -k(x - target) - c*v
    const fx = -k * (x - targetX) - c * vx;
    const fy = -k * (y - targetY) - c * vy;

    // Acceleration: a = F/m
    const ax = fx / m;
    const ay = fy / m;

    // Semi-implicit Euler integration (stable enough for UI)
    vx += ax * dt;
    vy += ay * dt;
    x += vx * dt;
    y += vy * dt;

    setTransform();

    // Stop when very close and slow (prevents endless tiny updates)
    const dist2 = (x - targetX) ** 2 + (y - targetY) ** 2;
    const speed2 = vx ** 2 + vy ** 2;
    if (dist2 < 0.01 && speed2 < 0.01) {
      x = targetX;
      y = targetY;
      vx = 0;
      vy = 0;
      setTransform();
    }
  }

  requestAnimationFrame(animate);
}

setTransform();
requestAnimationFrame(animate);
