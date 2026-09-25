import * as THREE from 'three';

// Objetos realistas de P08. Texturas: NASA Visible Earth (Blue Marble, Black Marble, nubes),
// dominio público, optimizadas en /public/textures. Sol y estrellas generados por shader.

const EARTH_TILT = THREE.MathUtils.degToRad(23.44);

const earthVertex = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const earthFragment = /* glsl */`
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D cloudMap;
  uniform float ready;
  uniform float cloudShift;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(-vWorld);               // El Sol está en el origen.
    vec3 V = normalize(cameraPosition - vWorld);
    float ndl = dot(N, L);
    float daylight = smoothstep(-0.12, 0.22, ndl);

    vec3 dayRaw = texture2D(dayMap, vUv).rgb;
    vec3 day = pow(dayRaw, vec3(2.2));
    vec3 night = pow(texture2D(nightMap, vUv).rgb, vec3(2.2));
    float cloud = texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r;
    cloud = smoothstep(0.12, 0.9, cloud);

    float ocean = clamp((dayRaw.b - max(dayRaw.r, dayRaw.g) * 0.95) * 7.0, 0.0, 1.0);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 70.0) * ocean * (1.0 - cloud) * daylight;

    vec3 color = day * max(ndl, 0.0) * 1.7 + day * 0.012;
    color += vec3(1.0, 0.93, 0.8) * spec * 0.55;
    float lights = smoothstep(0.05, 0.45, dot(night, vec3(0.3, 0.59, 0.11)));
    color += vec3(1.0, 0.7, 0.36) * lights * (1.0 - daylight) * (1.0 - cloud * 0.85) * 0.9;
    vec3 cloudColor = vec3(max(ndl, 0.0) * 1.35 + 0.006);
    color = mix(color, cloudColor, cloud * 0.9);

    // Atmósfera fina vista de canto, sólo del lado iluminado.
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    color += vec3(0.28, 0.52, 1.0) * fresnel * smoothstep(-0.25, 0.6, ndl) * 0.9;

    color = mix(vec3(0.02, 0.05, 0.09) * max(ndl, 0.1), color, ready);
    color = vec3(1.0) - exp(-color * 1.25);
    gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
  }
`;

const haloFragment = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 L = normalize(-vWorld);
    float rim = pow(smoothstep(0.0, 0.3, -dot(N, V)), 1.6);
    float lit = smoothstep(-0.35, 0.55, dot(N, L));
    gl_FragColor = vec4(vec3(0.3, 0.55, 1.0) * rim * lit * 0.55, 1.0);
  }
`;

// Sol: granulación animada y oscurecimiento del limbo; sin halo ni resplandor
// para no ocultar la Tierra, la órbita ni las fichas.
const sunFragment = /* glsl */`
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vLocal;
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; } return v; }
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorld);
    float mu = clamp(dot(N, V), 0.0, 1.0);
    vec3 p = normalize(vLocal);
    // Granulación fina y de bajo contraste, como en una imagen solar en luz visible.
    float cells = fbm(p * 70.0 + vec3(0.0, time * 0.04, time * 0.03));
    float fine = fbm(p * 160.0 - vec3(time * 0.06));
    float large = fbm(p * 5.0 + vec3(time * 0.01));
    float spots = smoothstep(0.74, 0.8, fbm(p * 3.0 + 11.0)) * smoothstep(0.6, 0.2, abs(p.y));
    float g = (cells * 0.6 + fine * 0.4 - 0.5) * 0.16 + (large - 0.5) * 0.06;
    vec3 center = vec3(1.0, 0.8, 0.5);
    vec3 limb = vec3(0.78, 0.33, 0.08);
    float ld = pow(mu, 0.55);                      // oscurecimiento del limbo
    vec3 color = mix(limb, center, ld) * (1.0 + g);
    color *= 1.0 - spots * 0.6;
    color *= 0.93;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const sunVertex = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const starVertex = /* glsl */`
  attribute float size;
  attribute vec3 tint;
  uniform float pixelRatio;
  varying vec3 vTint;
  void main() {
    vTint = tint;
    gl_PointSize = size * pixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const starFragment = /* glsl */`
  varying vec3 vTint;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(vTint * a * a, 1.0);
  }
`;

function starField(pixelRatio: number) {
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const gauss = () => (rand() + rand() + rand() + rand() - 2) / 2;
  const palette = [[.72, .8, 1], [.88, .92, 1], [1, 1, 1], [1, .95, .85], [1, .85, .66], [1, .74, .55]];
  const bright = 32000, dust = 60000, total = bright + dust;
  const positions = new Float32Array(total * 3), tints = new Float32Array(total * 3), sizes = new Float32Array(total);
  const galaxy = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.05, .3, .5));
  const v = new THREE.Vector3();
  for (let i = 0; i < total; i++) {
    const inBand = i >= bright || rand() < .35;
    if (inBand) {
      const lon = rand() * Math.PI * 2, lat = gauss() * (i >= bright ? .16 : .3);
      v.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)).applyQuaternion(galaxy);
    } else {
      const z = rand() * 2 - 1, t = rand() * Math.PI * 2, r = Math.sqrt(1 - z * z);
      v.set(r * Math.cos(t), z, r * Math.sin(t));
    }
    v.multiplyScalar(80).toArray(positions, i * 3);
    const c = palette[Math.floor(rand() * palette.length)];
    const magnitude = i >= bright ? .12 + rand() * .2 : Math.pow(rand(), 3.2) * 1.3 + .16;
    tints.set([c[0] * magnitude, c[1] * magnitude, c[2] * magnitude], i * 3);
    sizes[i] = i >= bright ? 1.6 + rand() * 1.4 : 1.6 + Math.pow(rand(), 5) * 3.6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('tint', new THREE.BufferAttribute(tints, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: starVertex, fragmentShader: starFragment, uniforms: { pixelRatio: { value: pixelRatio } },
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = -1;
  points.frustumCulled = false;
  return points;
}

export function createCosmos(renderer: THREE.WebGLRenderer, onReady: () => void) {
  const textures: THREE.Texture[] = [];
  const loader = new THREE.TextureLoader();
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const earthUniforms = {
    dayMap: { value: null as THREE.Texture | null }, nightMap: { value: null as THREE.Texture | null },
    cloudMap: { value: null as THREE.Texture | null }, ready: { value: 0 }, cloudShift: { value: 0 },
  };
  let pending = 3;
  const load = (url: string, key: 'dayMap' | 'nightMap' | 'cloudMap') => loader.load(url, texture => {
    texture.anisotropy = anisotropy;
    texture.wrapS = THREE.RepeatWrapping;
    earthUniforms[key].value = texture;
    textures.push(texture);
    if (--pending === 0) { earthUniforms.ready.value = 1; onReady(); }
  });
  load('/textures/earth-day.jpg', 'dayMap');
  load('/textures/earth-night.jpg', 'nightMap');
  load('/textures/earth-clouds.jpg', 'cloudMap');

  // Jerarquía: earth (posición orbital) → tilt (inclinación del eje) → spin (rotación diaria).
  const earth = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.z = EARTH_TILT;
  earth.add(tilt);
  const spin = new THREE.Mesh(new THREE.SphereGeometry(.58, 96, 64), new THREE.ShaderMaterial({ vertexShader: earthVertex, fragmentShader: earthFragment, uniforms: earthUniforms }));
  tilt.add(spin);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(.58 * 1.045, 64, 48), new THREE.ShaderMaterial({
    vertexShader: earthVertex, fragmentShader: haloFragment, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  earth.add(halo);
  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -.8, 0), new THREE.Vector3(0, .8, 0)]), new THREE.LineBasicMaterial({ color: '#c9d4d8', transparent: true, opacity: .45 }));
  tilt.add(axis);

  const sunUniforms = { time: { value: 0 } };
  const sun = new THREE.Mesh(new THREE.SphereGeometry(.9, 96, 64), new THREE.ShaderMaterial({ vertexShader: sunVertex, fragmentShader: sunFragment, uniforms: sunUniforms }));
  const stars = starField(renderer.getPixelRatio());

  return {
    earth, spin, axis, sun, stars,
    /** Avanza nubes y superficie solar sólo cuando la escena está en movimiento. */
    advance(ms: number) {
      sunUniforms.time.value += ms / 1000;
      earthUniforms.cloudShift.value = (earthUniforms.cloudShift.value + ms * .0000012) % 1;
    },
    dispose() { textures.forEach(texture => texture.dispose()); },
  };
}
