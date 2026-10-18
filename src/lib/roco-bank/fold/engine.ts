// iPhone Duo fold engine — ported from jadon7/iphone-duo `main.js` (MIT, © 2026 jadon7):
// same Apple AR model, same hinge / flexible-strip vertex shaders and the fixed-front-view
// projected screen UI with fold-driven blur + darkening. Changes: TypeScript, scroll-driven
// state instead of the slider, our own canvas screens, a camera rig for the "bento → device"
// pull-back, and render-on-demand.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

import { INNER_UI_SIZE, OUTER_UI_SIZE } from "./ui-size";

export type FoldState = {
  /** 0 = inner screen fills the bento area 1:1, 1 = whole device framed */
  pull: number;
  /** 0 = open flat (180°), 1 = closed (0°) */
  fold: number;
  /** 0..1 after the fold: device settles to one side, cover screen content takes over */
  after: number;
};

const SCREEN_Z = 0.24948;
// UI frames in model units (from the reference project)
const INNER_FRAME = new THREE.Vector4(-7.89935, 0.34562 - 5.8974, 15.7987, 11.1035);
const UI_EYE = new THREE.Vector3(0, 0, 40);
const OUTER_FRAME = new THREE.Vector4(0.23396, 0.27173 - 5.8974, 7.73936, 11.2513).multiplyScalar(
  (UI_EYE.z - SCREEN_Z) / (UI_EYE.z - 0.825538),
);
export { INNER_UI_SIZE, OUTER_UI_SIZE } from "./ui-size";

const SCREEN_SHADER = /* glsl */ `
uniform float foldAngle;
uniform vec2 uiPixel;
uniform float uiBlurScale; // texture px per reference px (blur radius is defined at 1600×1125)
uniform vec4 uiFrame;
uniform vec2 uiGradient;
uniform vec3 uiReferenceEye;
varying vec3 vUIPosition;
vec3 screenColor() {
  float depth = (0.24948 - uiReferenceEye.z) / (vUIPosition.z - uiReferenceEye.z);
  vec2 projected = uiReferenceEye.xy + (vUIPosition.xy - uiReferenceEye.xy) * depth;
  vec2 sourceUV = (projected - uiFrame.xy) / uiFrame.zw;
  #ifdef INNER_UI
    float progress = clamp(foldAngle / 1.570796327, 0.0, 1.0);
  #else
    float c = cos(foldAngle), s = sin(foldAngle);
    vec2 hingeEdge = vec2(-0.23396, -0.27463 - 0.275454);
    vec2 foldedEdge = vec2(c * hingeEdge.x + s * hingeEdge.y, -s * hingeEdge.x + c * hingeEdge.y + 0.275454);
    float edgeDepth = (0.24948 - uiReferenceEye.z) / (foldedEdge.y - uiReferenceEye.z);
    float anchorX = uiReferenceEye.x + (foldedEdge.x - uiReferenceEye.x) * edgeDepth;
    sourceUV.x = uiGradient.x + (projected.x - anchorX) / uiFrame.z;
    float progress = clamp((3.141592654 - foldAngle) / 1.570796327, 0.0, 1.0);
  #endif
  float edge = (sourceUV.x - uiGradient.x) / (uiGradient.y - uiGradient.x);
  float motion = smoothstep(0.0, 1.0, progress);
  float blurGradient = clamp(edge, 0.0, 1.0);
  float darkenGradient = clamp((edge - 0.2) / 0.8, 0.0, 1.0);
  float effect = motion * pow(darkenGradient, 1.35);
  float radius = 72.0 * uiBlurScale * motion * pow(blurGradient, 1.35);
  vec2 aa = max(fwidth(sourceUV), uiPixel * 0.5);
  vec2 dx = dFdx(sourceUV) / uiPixel;
  vec2 dy = dFdy(sourceUV) / uiPixel;
  // correct mip for the current minification (no negative bias: sampling a finer mip than the
  // footprint keeps thin strokes at full brightness → the bento text looked a weight bolder)
  float baseLod = log2(max(1.0, max(length(dx), length(dy))));
  vec2 coverage = smoothstep(-aa, aa, sourceUV) * (1.0 - smoothstep(vec2(1.0) - aa, vec2(1.0) + aa, sourceUV));
  vec3 color = textureLod(map, clamp(sourceUV, vec2(0.0), vec2(1.0)), baseLod).rgb * coverage.x * coverage.y;
  if (radius > 0.0) {
    float lod = max(baseLod, log2(max(1.0, radius)));
    vec2 footprint = max(aa, uiPixel * radius * 0.75);
    color = vec3(0.0);
    for (int y = -2; y <= 2; y++) {
      for (int x = -2; x <= 2; x++) {
        float wx = x == 0 ? 6.0 : (abs(x) == 1 ? 4.0 : 1.0);
        float wy = y == 0 ? 6.0 : (abs(y) == 1 ? 4.0 : 1.0);
        vec2 sampleUV = sourceUV + vec2(float(x), float(y)) * uiPixel * radius;
        vec2 cov = smoothstep(-footprint, footprint, sampleUV) * (1.0 - smoothstep(vec2(1.0) - footprint, vec2(1.0) + footprint, sampleUV));
        color += textureLod(map, clamp(sampleUV, vec2(0.0), vec2(1.0)), lod).rgb * cov.x * cov.y * wx * wy / 256.0;
      }
    }
  }
  // the texture is stored as raw sRGB values and filtered in gamma space — exactly how the browser
  // composites the DOM bento — then decoded to linear here (linear-space filtering of white-on-dark
  // text made every glyph look a weight heavier than the DOM version at the hand-off)
  color = sRGBTransferEOTF(vec4(color, 1.0)).rgb;
  return color * (1.0 - min(1.0, effect * 2.0));
}
`;

const FOLD_SHADER = /* glsl */ `
uniform float foldAngle;
vec2 rotateHinge(vec2 p) {
  float c = cos(foldAngle), s = sin(foldAngle);
  p.y -= 0.275454;
  return vec2(c * p.x + s * p.y, -s * p.x + c * p.y + 0.275454);
}
#ifdef FLEXIBLE_SCREEN
vec4 bendStrip(vec3 p) {
  float halfWidth = 0.35;
  if (p.x >= halfWidth) return vec4(p.x, p.z, 1.0, 0.0);
  if (p.x <= -halfWidth) return vec4(rotateHinge(p.xz), cos(foldAngle), -sin(foldAngle));
  float t = (p.x + halfWidth) / (2.0 * halfWidth);
  float t2 = t*t, t3 = t2*t;
  vec2 a = rotateHinge(vec2(-halfWidth, p.z));
  vec2 b = vec2(halfWidth, p.z);
  vec2 ta = 2.0 * halfWidth * vec2(cos(foldAngle), -sin(foldAngle));
  vec2 tb = vec2(2.0 * halfWidth, 0.0);
  vec2 point = (2.0*t3-3.0*t2+1.0)*a + (t3-2.0*t2+t)*ta + (-2.0*t3+3.0*t2)*b + (t3-t2)*tb;
  vec2 tangent = normalize((6.0*t2-6.0*t)*a + (3.0*t2-4.0*t+1.0)*ta + (-6.0*t2+6.0*t)*b + (3.0*t2-2.0*t)*tb);
  return vec4(point, tangent);
}
#endif
`;

const MOVING_ROOT = "upTUAKvMVkPOMKq";
const FIXED_ROOT = "SiftyleUEEZwLhF";
const FLEXIBLE = ["JnJdTkxbQgUtLwU", "xdyyaajWsatVNxN", "UXtsBZYlaUvHoEh", "MvKPXGSdYDVvSpk"];
const INNER_SCREEN = "UXtsBZYlaUvHoEh";
const OUTER_SCREEN = "hhgAIoCGsHXeDPY";

type ScreenKind = "inner" | "outer";
type Screen = {
  material: THREE.MeshBasicMaterial;
  texture: THREE.CanvasTexture;
  frame: { value: THREE.Vector4 };
  gradient: { value: THREE.Vector2 };
  pixel: { value: THREE.Vector2 };
  blurScale: { value: number };
};

const smooth = (u: number) => u * u * (3 - 2 * u);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** The GLB is meshopt-compressed with KHR_mesh_quantization (normalized Int16/Int8 attributes).
 *  applyMatrix4 writes floats back into the source typed array, so expand every attribute to
 *  Float32 first (getX/getY/… already return de-normalized values). */
function toFloatGeometry(src: THREE.BufferGeometry) {
  const g = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(src.attributes)) {
    const a = attr as THREE.BufferAttribute;
    const out = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) {
      for (let c = 0; c < a.itemSize; c++) out[i * a.itemSize + c] = a.getComponent(i, c);
    }
    g.setAttribute(name, new THREE.BufferAttribute(out, a.itemSize));
  }
  if (src.index) g.setIndex(src.index.clone());
  for (const grp of src.groups) g.addGroup(grp.start, grp.count, grp.materialIndex);
  return g;
}

/** Seamless rounded-rect version of the (multi-piece) inner screen mesh: same bounds, corner radius
 *  recovered from the vertices (min over (x−minX)+(maxY−y) = r·(2−√2) at a circular corner). */
function screenPunchGeometry(screen: THREE.BufferGeometry) {
  screen.computeBoundingBox();
  const bb = screen.boundingBox!;
  const pos = screen.attributes.position as THREE.BufferAttribute;
  let minSum = Infinity;
  for (let i = 0; i < pos.count; i++) minSum = Math.min(minSum, pos.getX(i) - bb.min.x + (bb.max.y - pos.getY(i)));
  const r = Math.max(0, minSum / (2 - Math.SQRT2));
  const w = bb.max.x - bb.min.x;
  const h = bb.max.y - bb.min.y;
  const x0 = bb.min.x;
  const y0 = bb.min.y;
  const shape = new THREE.Shape();
  shape.moveTo(x0 + r, y0);
  shape.lineTo(x0 + w - r, y0);
  shape.absarc(x0 + w - r, y0 + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x0 + w, y0 + h - r);
  shape.absarc(x0 + w - r, y0 + h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x0 + r, y0 + h);
  shape.absarc(x0 + r, y0 + h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x0, y0 + r);
  shape.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  const g = new THREE.ShapeGeometry(shape, 24);
  g.translate(0, 0, bb.max.z);
  return g;
}

const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

export class FoldEngine {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  private rig = new THREE.Group();
  private phone = new THREE.Group();
  private bend = { value: 0 };
  private screens: Record<ScreenKind, Screen>;
  private size = { w: 1, h: 1 };
  /** CSS px size of the bento content rectangle at pull = 0 (it maps onto the inner UI frame) */
  private contentPx = { w: 1440, h: 1024 };
  private state: FoldState = { pull: 0, fold: 0, after: 0 };
  private dirty = true;
  ready = false;

  constructor(private container: HTMLElement, inner: HTMLCanvasElement, outer: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    const env = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(env, 0.04).texture;
    env.dispose();
    pmrem.dispose();
    this.scene.environmentIntensity = 1.35;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb5baa8, 1.8));
    const key = new THREE.DirectionalLight(0xfffcf5, 2.6);
    key.position.set(-15, 25, 30);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xe8edf5, 2);
    rim.position.set(15, 5, -15);
    this.scene.add(rim);
    this.rig.add(this.phone);
    this.scene.add(this.rig);
    const make = (kind: ScreenKind, canvas: HTMLCanvasElement): Screen => {
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.NoColorSpace; // decoded manually after filtering (see screenColor)
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      return {
        material: new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
        texture,
        frame: { value: (kind === "inner" ? INNER_FRAME : OUTER_FRAME).clone() },
        gradient: { value: new THREE.Vector2(kind === "inner" ? 0.5 : 0, kind === "inner" ? 0 : 1) },
        pixel: { value: new THREE.Vector2(1 / canvas.width, 1 / canvas.height) },
        blurScale: { value: canvas.height / (kind === "inner" ? INNER_UI_SIZE.h : OUTER_UI_SIZE.h) },
      };
    };
    this.screens = { inner: make("inner", inner), outer: make("outer", outer) };
    // GPU resets (driver update / TDR on Windows, GPU switching on dual-GPU laptops) drop the
    // context; three.js restores its state, the canvas screens just need re-uploading
    this.renderer.domElement.addEventListener("webglcontextrestored", this.onContextRestored);
  }

  private onContextRestored = () => {
    this.refreshScreens();
  };

  /** loads the GLB converted from Apple's USD (scripts/assets/usd_to_glb.mjs; meshopt/quantized
   *  GLBs work too) — parsing the USDC directly blocked the main thread for ~1.7 s */
  async load(url: string) {
    let model: THREE.Object3D;
    if (url.endsWith(".glb")) {
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      model = (await loader.loadAsync(url)).scene;
    } else {
      const { USDLoader } = await import("three/examples/jsm/loaders/USDLoader.js");
      model = await new USDLoader().loadAsync(url);
    }
    model.scale.multiplyScalar(100);
    model.updateMatrixWorld(true);
    model.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const geometry = toFloatGeometry(mesh.geometry).applyMatrix4(mesh.matrixWorld);
      geometry.translate(0, -5.8974, 0);
      let ancestor: THREE.Object3D | null = mesh;
      while (ancestor && ![MOVING_ROOT, FIXED_ROOT].includes(ancestor.name)) ancestor = ancestor.parent;
      const moving = ancestor?.name === MOVING_ROOT;
      const flexible = FLEXIBLE.includes(mesh.name);
      const kind: ScreenKind | null = mesh.name === INNER_SCREEN ? "inner" : mesh.name === OUTER_SCREEN ? "outer" : null;
      const material = kind ? this.screens[kind].material : (mesh.material as THREE.Material).clone();
      if (kind) {
        const p = geometry.attributes.position;
        const uv = new Float32Array(p.count * 2);
        for (let i = 0; i < p.count; i++) {
          uv[i * 2] = kind === "inner" ? (p.getX(i) + 7.89935) / 15.7987 : (-0.23396 - p.getX(i)) / 7.73936;
          uv[i * 2 + 1] = kind === "inner" ? (p.getY(i) + 5.8974 - 0.34562) / 11.1035 : (p.getY(i) + 5.8974 - 0.27173) / 11.2513;
        }
        geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      }
      if (moving || flexible) {
        material.onBeforeCompile = (shader) => {
          shader.uniforms.foldAngle = this.bend;
          if (kind) {
            const sc = this.screens[kind];
            shader.uniforms.uiFrame = sc.frame;
            shader.uniforms.uiGradient = sc.gradient;
            shader.uniforms.uiReferenceEye = { value: UI_EYE };
            shader.uniforms.uiPixel = sc.pixel;
            shader.uniforms.uiBlurScale = sc.blurScale;
            shader.fragmentShader = shader.fragmentShader
              .replace("#include <map_pars_fragment>", `#include <map_pars_fragment>\n${kind === "inner" ? "#define INNER_UI" : ""}\n${SCREEN_SHADER}`)
              .replace("#include <map_fragment>", "diffuseColor.rgb *= screenColor();");
            shader.vertexShader = `varying vec3 vUIPosition;\n${shader.vertexShader}`.replace(
              "#include <project_vertex>",
              "vUIPosition = transformed;\n#include <project_vertex>",
            );
          }
          shader.vertexShader = `${flexible ? "#define FLEXIBLE_SCREEN\n" : ""}${FOLD_SHADER}\n${shader.vertexShader}`
            .replace(
              "#include <begin_vertex>",
              flexible
                ? "vec4 folded = bendStrip(position);\nvec3 transformed = vec3(folded.x, position.y, folded.y);"
                : "vec2 folded = rotateHinge(position.xz);\nvec3 transformed = vec3(folded.x, position.y, folded.y);",
            )
            .replace(
              "#include <beginnormal_vertex>",
              `vec3 objectNormal = vec3(normal);
              ${flexible ? "vec4 strip = bendStrip(position); float a = atan(-strip.w, strip.z);" : "float a = foldAngle;"}
              objectNormal.x = cos(a) * normal.x + sin(a) * normal.z;
              objectNormal.z = -sin(a) * normal.x + cos(a) * normal.z;`,
            );
        };
        material.customProgramCacheKey = () => `${flexible ? "fold-flexible" : "fold-cover"}-${kind ?? "body"}`;
      }
      if (kind === "inner") {
        this.punch = new THREE.Mesh(
          screenPunchGeometry(geometry),
          new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            depthWrite: false,
            // drawn last and only over the screen: ignore the thin crease/glass meshes in front of it
            depthTest: false,
            blending: THREE.CustomBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.ZeroFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            blendSrcAlpha: THREE.ZeroFactor,
            blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
            opacity: 1,
            toneMapped: false,
          }),
        );
        this.punch.renderOrder = 999;
        this.punch.frustumCulled = false;
        this.phone.add(this.punch);
      }
      const out = new THREE.Mesh(geometry, material);
      out.name = mesh.name;
      out.frustumCulled = false;
      this.phone.add(out);
    });
    // compile shaders off the critical path (KHR_parallel_shader_compile when available), then go live
    this.pose();
    await this.renderer.compileAsync(this.scene, this.camera);
    const names = new Set<string>();
    this.phone.traverse((o) => names.add(o.name));
    this.stats = { meshes: this.phone.children.length, inner: names.has(INNER_SCREEN), outer: names.has(OUTER_SCREEN) };
    this.ready = true;
    this.dirty = true;
  }

  stats = { meshes: 0, inner: false, outer: false };

  /** pre-uploads every texture, one per idle callback (avoids a long first-frame upload) */
  async uploadTexturesIdle() {
    const textures = new Set<THREE.Texture>();
    this.phone.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (!m) return;
      for (const mat of Array.isArray(m) ? m : [m]) {
        for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) textures.add(v as THREE.Texture);
      }
    });
    const idle = () =>
      new Promise<void>((r) => (window.requestIdleCallback ? window.requestIdleCallback(() => r(), { timeout: 200 }) : setTimeout(r, 16)));
    for (const t of textures) {
      await idle();
      this.renderer.initTexture(t);
    }
  }

  refreshScreens() {
    this.screens.inner.texture.needsUpdate = true;
    this.screens.outer.texture.needsUpdate = true;
    this.dirty = true;
  }

  resize(w: number, h: number, contentW: number, contentH: number) {
    this.size = { w, h };
    this.contentPx = { w: contentW, h: contentH };
    // DPR changes when the window moves between displays (Retina ↔ 100 / 125 / 150 % Windows scaling)
    const dpr = Math.min(window.devicePixelRatio, 2);
    if (this.renderer.getPixelRatio() !== dpr) this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  set(next: FoldState) {
    const s = this.state;
    if (s.pull === next.pull && s.fold === next.fold && s.after === next.after) return;
    this.state = { ...next };
    this.dirty = true;
  }

  /** distance from the screen plane for a given CSS-px-per-model-unit */
  private distFor(ppu: number) {
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    return this.size.h / 2 / (tanHalf * ppu);
  }

  private pose() {
    const { pull, fold, after } = this.state;
    const { w, h } = this.size;
    // "packaging": at pull 0 the inner screen is exactly the on-page bento (1024-px content height ==
    // inner UI frame height, 11.1035 u); the camera then pulls back until the whole device is framed,
    // and while it closes the device grows to ~74 % of the viewport height
    const ppuStart = this.contentPx.h / INNER_FRAME.w;
    const ppuOpen = Math.min(w / 25, h / 17.5, 46);
    const ppuClosed = Math.min((h * 0.74) / 11.9, (w * 0.42) / 8.2);
    const p = easeInOutCubic(clamp01(pull));
    const f = clamp01(fold);
    const fe = 0.5 - 0.5 * Math.cos(Math.PI * f); // closing: cosine in-out (reference loop curve)
    let ppu = Math.exp(lerp(Math.log(ppuStart), Math.log(ppuOpen), p));
    ppu = Math.exp(lerp(Math.log(ppu), Math.log(ppuClosed), smooth(clamp01((f - 0.35) / 0.65))));
    // inner screen plane ⟂ view axis and centred on it → the DOM bento follows it with one CSS scale
    this.innerScreenScale = ppu / ppuStart;
    this.camera.position.set(0, 0, SCREEN_Z + this.distFor(ppu));
    this.camera.lookAt(0, 0, SCREEN_Z);
    this.bend.value = fe * Math.PI;
    this.screens.outer.material.color.setScalar(f <= 0 ? 0 : 1);
    // the closed device sits on the fixed (right) half → recentre it; afterwards slide it left
    const a = smooth(clamp01(after));
    const shiftPx = -0.21 * w * a;
    this.rig.position.set(-3.95 * fe + shiftPx / ppu, 0, 0);
    this.rig.rotation.set(0, 0, 0);
    this.rig.scale.setScalar(1);
  }

  /** CSS scale mapping the DOM bento onto the inner screen during the pull */
  innerScreenScale = 1;
  private punch: THREE.Mesh | null = null;

  /** 0 = the DOM bento shows through the inner screen (hole punched in the canvas), 1 = WebGL screen */
  setInnerScreenAlpha(a: number) {
    if (!this.punch) return;
    const m = this.punch.material as THREE.MeshBasicMaterial;
    const visible = a < 1 && this.state.fold <= 0;
    if (this.punch.visible !== visible) {
      this.punch.visible = visible;
      this.dirty = true;
    }
    if (m.opacity !== 1 - a) {
      m.opacity = 1 - a;
      this.dirty = true;
    }
  }

  refreshOuter() {
    this.screens.outer.texture.needsUpdate = true;
    this.dirty = true;
  }

  /** the inner canvas was re-painted from the live bento */
  refreshInner() {
    this.screens.inner.texture.needsUpdate = true;
    this.dirty = true;
  }

  /** render if anything changed; returns true when a frame was drawn */
  render(force = false) {
    if (!this.ready || (!this.dirty && !force)) return false;
    this.pose();
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
    return true;
  }

  dispose() {
    this.renderer.domElement.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
      }
    });
  }
}
