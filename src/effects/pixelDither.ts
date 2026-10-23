import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { pixelConfig } from '../config'

const bayer = `
  float bayer4(vec2 p) {
    int x = int(mod(p.x, 4.0)); int y = int(mod(p.y, 4.0));
    int index = x + y * 4;
    float values[16]; values[0]=0.0; values[1]=8.0; values[2]=2.0; values[3]=10.0;
    values[4]=12.0; values[5]=4.0; values[6]=14.0; values[7]=6.0;
    values[8]=3.0; values[9]=11.0; values[10]=1.0; values[11]=9.0;
    values[12]=15.0; values[13]=7.0; values[14]=13.0; values[15]=5.0;
    return values[index] / 16.0 - 0.5;
  }
`

export function createPixelEffect(renderer: THREE.WebGLRenderer) {
  // Half-float keeps colours above 1.0 for the bloom; the stencil buffer masks the pagoda's reflection to the water.
  const target = new THREE.WebGLRenderTarget(pixelConfig.width, pixelConfig.height, {
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.HalfFloatType, stencilBuffer: true,
  })
  const composer = new EffectComposer(renderer, target)
  const scenePass = new RenderPass(null as unknown as THREE.Scene, null as unknown as THREE.Camera)
  // A threshold of 1.0 means only HDR colours bloom: the pagoda's crown and candles, not the bright sky.
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(pixelConfig.width, pixelConfig.height), 0.4, 0.6, 1.0)
  // three.js stores colours in linear space; the shader matches and outputs in sRGB, so convert back.
  const palette = pixelConfig.palette.map((color) => new THREE.Color(color).convertLinearToSRGB())
  const shaderPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      resolution: { value: new THREE.Vector2(pixelConfig.width, pixelConfig.height) },
      ditherStrength: { value: pixelConfig.ditherStrength },
      palette: { value: palette },
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float ditherStrength; uniform vec3 palette[${palette.length}];
      uniform vec2 resolution; varying vec2 vUv; ${bayer}
      void main() {
        // The scene renders linear; compare in sRGB so the dither steps look even.
        vec3 color = clamp(sRGBTransferOETF(texture2D(tDiffuse, vUv)).rgb, 0.0, 1.0);
        color += bayer4(gl_FragCoord.xy) * ditherStrength;
        // Snap to the nearest palette colour, so greens stay green, water stays teal and gold stays gold.
        vec3 best = palette[0];
        float bestDistance = 1e9;
        for (int i = 0; i < ${palette.length}; i++) {
          vec3 delta = color - palette[i];
          float distance = dot(delta, delta);
          if (distance < bestDistance) { bestDistance = distance; best = palette[i]; }
        }
        gl_FragColor = vec4(best, 1.0);
      }`,
  })
  shaderPass.enabled = true
  // With the dither off, the output pass converts the HDR linear image for the screen instead.
  const outputPass = new OutputPass()
  outputPass.enabled = false
  composer.addPass(scenePass)
  composer.addPass(bloomPass)
  composer.addPass(shaderPass)
  composer.addPass(outputPass)
  return {
    composer, scenePass, shaderPass, bloomPass,
    setEnabled: (enabled: boolean) => {
      shaderPass.enabled = enabled
      outputPass.enabled = !enabled
    },
    setSize: (width: number, height: number) => {
      composer.setSize(width, height)
      renderer.setPixelRatio(1)
    },
  }
}
