# np-gltoy

webgl toy

-   simpleInit
-   renderFullScreenCanvas

inject

```glsl
uniform float u_time
uniform vec2 u_mouse
uniform vec2 u_resolution
uniform vec4 u_date
uniform vec3 iResolution
```

## demo

```typescript
import frag from './frag.glsl';
import { simpleInit, renderFullScreenCanvas } from 'np-gltoy';

document.body.style.background = `linear-gradient(180deg, rgb(255 244 208), rgb(84 203 177))`;
renderFullScreenCanvas({
    frag,
    autoPlay: true,
});
```

```glsl
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

void main(){
    vec2 st=gl_FragCoord.xy/u_resolution.xy;
    //
    gl_FragColor=vec4(color);
}

```
